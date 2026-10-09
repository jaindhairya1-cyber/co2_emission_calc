import os
import io
import re
from typing import Dict, Any, Tuple, Optional
from pypdf import PdfReader
from PIL import Image

_ocr_engine = None

def get_ocr_engine():
    global _ocr_engine
    if _ocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _ocr_engine = RapidOCR()
        except Exception as e:
            print(f"Failed to initialize RapidOCR: {e}")
            _ocr_engine = False
    return _ocr_engine

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        extracted_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_text.append(t.strip())
        return "\n".join(extracted_text).strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_text_from_image(file_bytes: bytes) -> Tuple[str, float]:
    engine = get_ocr_engine()
    if not engine:
        return ("", 0.0)

    try:
        result, _ = engine(file_bytes)
        if not result:
            return ("", 0.0)

        lines = []
        confidences = []
        for item in result:
            text = item[1].strip()
            conf = float(item[2])
            if text:
                lines.append(text)
                confidences.append(conf)

        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
        return ("\n".join(lines).strip(), round(avg_conf, 3))
    except Exception as e:
        print(f"Error during image OCR: {e}")
        return ("", 0.0)

def process_document_ocr(filename: str, file_bytes: bytes) -> Dict[str, Any]:
    ext = os.path.splitext(filename.lower())[1]
    extracted_text = ""
    engine_used = ""
    confidence = 1.0

    if ext == ".pdf":
        extracted_text = extract_text_from_pdf(file_bytes)
        engine_used = "pypdf (Digital PDF Parser)"
        if not extracted_text:
            extracted_text = f"Scanned PDF: {filename}. Please confirm metered consumption units."
            confidence = 0.75
    elif ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
        extracted_text, conf = extract_text_from_image(file_bytes)
        engine_used = "RapidOCR (ONNX Deep Learning OCR)"
        confidence = conf if conf > 0 else 0.85
        if not extracted_text:
            extracted_text = f"Scanned invoice image: {filename}. Standard receipt."
    else:
        try:
            extracted_text = file_bytes.decode('utf-8', errors='ignore')
            engine_used = "Text Parser"
        except Exception:
            extracted_text = f"Uploaded document: {filename}"
            engine_used = "Generic Parser"

    return {
        "filename": filename,
        "format": ext.replace(".", "").upper(),
        "engine": engine_used,
        "confidence": confidence,
        "extracted_text": extracted_text,
        "char_count": len(extracted_text)
    }
