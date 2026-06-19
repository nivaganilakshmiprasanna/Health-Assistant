import os
import logging
import pdfplumber
from PIL import Image
from app.utils.groq_client import generate_multimodal

logger = logging.getLogger(__name__)

# Try importing pytesseract, but fail gracefully if not installed
try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a digital PDF using pdfplumber.
    """
    text_content = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)
    except Exception as e:
        logger.error(f"pdfplumber extraction failed: {str(e)}")
    
    return "\n".join(text_content)

def perform_ocr(file_path: str) -> str:
    """
    Extracts text from a medical report (PDF or Image) using local methods or Gemini OCR.
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    # Check if PDF
    if ext == ".pdf":
        logger.info(f"Extracting text from digital PDF: {file_path}")
        text = extract_text_from_pdf(file_path)
        
        # If text is empty or very short, it's probably a scanned PDF
        if len(text.strip()) < 100:
            logger.info("PDF is scanned or has no extractable text. Falling back to Gemini Multimodal OCR.")
            try:
                with open(file_path, "rb") as f:
                    pdf_bytes = f.read()
                ocr_prompt = """
                Analyze this medical PDF page.
                1. If it is a text-based medical report or prescription (including handwritten doctor prescriptions or notes in cursive), perform OCR and transcribe all clinical text, medication names, dosages, and instructions clearly. Make a strong effort to transcribe handwritten cursive medical terms (e.g. Zerodol, Pantocid, TID) by guessing based on spelling and clinical context. If a word is highly uncertain, output your best guess. Do not refuse to transcribe.
                2. If it is a raw medical scan image (such as an ultrasound, X-ray, MRI, CT, or ECG scan) with minimal or no text:
                   - Describe the type of scan or visual representation.
                   - Transcribe all visible labels, annotations, or overlay text clearly.
                   - Provide a detailed visual description of what is shown and explain what these anatomical structures are.
                   - Explicitly note that this is a raw scan image.
                """
                text = generate_multimodal(ocr_prompt, pdf_bytes, "application/pdf")
            except Exception as e:
                logger.error(f"Gemini PDF OCR fallback failed: {str(e)}")
                text = "Failed to extract text from scanned PDF."
        return text

    # Check if Image
    elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tiff", ".webp"]:
        logger.info(f"Extracting text from image: {file_path}")
        
        # Try local Tesseract OCR if available
        if HAS_TESSERACT:
            try:
                # Test if Tesseract path is valid
                img = Image.open(file_path)
                text = pytesseract.image_to_string(img)
                if len(text.strip()) > 50:
                    logger.info("Successfully extracted text using local Tesseract OCR.")
                    return text
            except Exception as e:
                logger.warning(f"Local Tesseract OCR failed or path not set: {str(e)}. Falling back to Gemini.")
        
        # Fallback to Gemini Multimodal OCR for images
        try:
            with open(file_path, "rb") as f:
                img_bytes = f.read()
            
            # Determine mime type
            mime_type = "image/png"
            if ext in [".jpg", ".jpeg"]:
                mime_type = "image/jpeg"
            elif ext == ".webp":
                mime_type = "image/webp"
            
            ocr_prompt = """
            Analyze this medical image or document.
            1. If it is a text-based medical report or prescription (including handwritten doctor prescriptions or notes in cursive), perform OCR and transcribe all clinical text, medication names, dosages, and instructions clearly. Make a strong effort to transcribe handwritten cursive medical terms (e.g. Zerodol, Pantocid, TID) by guessing based on spelling and clinical context. If a word is highly uncertain, output your best guess. Do not refuse to transcribe.
            2. If it is a raw medical scan image (such as an ultrasound, X-ray, MRI, CT, or ECG scan) with minimal or no text:
               - Describe the type of scan or visual representation.
               - Transcribe all visible labels, annotations, or overlay text clearly.
               - Provide a detailed visual description of what is shown and explain what these anatomical structures are.
               - Explicitly note that this is a raw scan image.
            """
            text = generate_multimodal(ocr_prompt, img_bytes, mime_type)
            return text
        except Exception as e:
            logger.error(f"Gemini Image OCR fallback failed: {str(e)}")
            return "Failed to extract text from report image."
            
    else:
        logger.warning(f"Unsupported file type for OCR: {ext}")
        return "Unsupported file type."
