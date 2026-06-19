import os
import json
import logging
import base64
import io
import httpx
from app.config import GROQ_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def generate_text(prompt: str, model_name: str = "llama-3.3-70b-versatile", json_mode: bool = False) -> str:
    """
    Generates text from a prompt using Groq Chat Completions API.
    Optionally enforces JSON output. Maps Gemini model names to Llama equivalents.
    """
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY is not set.")
        raise ValueError("GROQ_API_KEY is missing. Please configure it in your .env file.")

    # Map Gemini model name to Llama model name
    if "gemini" in model_name:
        model_name = "llama-3.3-70b-versatile"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model_name,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        logger.info(f"Calling Groq API (model: {model_name}, json_mode: {json_mode})...")
        response = httpx.post(GROQ_API_URL, headers=headers, json=payload, timeout=60.0)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Error calling Groq generate_text: {str(e)}")
        if json_mode:
            return "{}"
        raise e

def generate_multimodal(prompt: str, file_bytes: bytes, mime_type: str, model_name: str = "meta-llama/llama-4-scout-17b-16e-instruct") -> str:
    """
    Generates content based on text prompt and image data.
    If input is PDF, renders pages as images using pypdfium2 before passing to Groq Vision model.
    """
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY is not set.")
        raise ValueError("GROQ_API_KEY is missing. Please configure it in your .env file.")

    # Map model name
    if "gemini" in model_name or "llama-3.2" in model_name:
        model_name = "meta-llama/llama-4-scout-17b-16e-instruct"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    content_list = [{"type": "text", "text": prompt}]

    try:
        # Convert PDF to images if mime_type is PDF
        if mime_type == "application/pdf":
            logger.info("PDF file detected. Converting pages to images for Groq Vision...")
            import pypdfium2 as pdfium
            pdf = pdfium.PdfDocument(file_bytes)
            # Render first 3 pages to avoid too large payloads/tokens
            max_pages = min(len(pdf), 3)
            for i in range(max_pages):
                page = pdf[i]
                bitmap = page.render(scale=2.0)  # scale 2.0 for higher quality OCR
                pil_img = bitmap.to_pil()
                img_byte_arr = io.BytesIO()
                pil_img.save(img_byte_arr, format='PNG')
                page_bytes = img_byte_arr.getvalue()
                base64_image = base64.b64encode(page_bytes).decode('utf-8')
                content_list.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{base64_image}"
                    }
                })
        else:
            # Handle image types
            base64_image = base64.b64encode(file_bytes).decode('utf-8')
            content_list.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{base64_image}"
                }
            })

        payload = {
            "model": model_name,
            "messages": [
                {"role": "user", "content": content_list}
            ]
        }

        logger.info(f"Calling Groq Vision API (model: {model_name}, input type: {mime_type})...")
        response = httpx.post(GROQ_API_URL, headers=headers, json=payload, timeout=90.0)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Error calling Groq generate_multimodal: {str(e)}")
        raise e
