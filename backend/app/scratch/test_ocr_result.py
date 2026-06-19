import os
import sys

# Ensure backend path is in Python path
sys.path.append("c:\\Users\\DELL\\Desktop\\multi health ai")

from app.utils.ocr import perform_ocr

def main():
    file_path = "c:\\Users\\DELL\\Desktop\\multi health ai\\backend\\uploads\\prescription_1_20260618135512_Screenshot_2026-06-18_135503.png"
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
        
    print(f"Running OCR on {file_path}...")
    extracted_text = perform_ocr(file_path)
    print("--- EXTRACTED TEXT ---")
    print(extracted_text)
    print("----------------------")

if __name__ == "__main__":
    main()
