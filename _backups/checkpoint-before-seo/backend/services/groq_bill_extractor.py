import base64
import hashlib
import io
import math
import os
import re
from typing import Any

import httpx
import pymupdf
from fastapi import HTTPException
from pypdf import PdfReader

from models.bill_schema import BillExtractionResponse
from services.bill_validator import (
    check_category_match,
    fuzzy_match_business,
    validate_extracted_data,
)
from services.ocr_service import extract_text_from_image
from services.vision_extractor import calculate_footprint_estimate

MAX_DOCUMENT_BYTES = 12 * 1024 * 1024
MAX_PDF_PAGES = 20
ALLOWED_CATEGORIES = {
    "Electricity": "Electricity",
    "Fuel": "Fuel",
    "Transport": "Transport",
    "Materials": "Raw material purchase",
    "Raw material purchase": "Raw material purchase",
    "Waste": "Waste",
}
CATEGORY_FIELDS = {
    "Electricity": (
        "consumer_number", "units_consumed_kwh", "previous_reading", "current_reading",
        "billing_period", "tariff_category", "sanctioned_load", "amount",
    ),
    "Fuel": ("line_items", "diesel_litres", "petrol_litres", "lpg_cylinders", "amount"),
    "Transport": (
        "vehicle_type", "vehicle_number", "fuel_type", "total_distance_km",
        "total_weight_kg", "routes", "amount",
    ),
    "Raw material purchase": (
        "line_items", "cotton_kg", "polyester_kg", "total_material_weight_kg", "amount",
    ),
    "Waste": ("line_items", "total_waste_kg", "waste_types_count", "amount"),
}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MIME_TYPES = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}

EXTRACTION_PROMPT = """Read this Indian MSME bill or activity document and extract only facts visible in it.
Do not guess, infer missing quantities, or substitute example values. Return null for absent fields.
Ignore taxes and fees when extracting activity quantities. Return one JSON object with:
{
 "detected_category": "Electricity" | "Fuel" | "Transport" | "Raw material purchase" | "Waste",
 "common_fields": {
  "vendor_name": {"value": string|null, "confidence": number},
  "buyer_name": {"value": string|null, "confidence": number},
  "buyer_gstin": {"value": string|null, "confidence": number},
  "bill_number": {"value": string|null, "confidence": number},
  "bill_date": {"value": string|null, "confidence": number},
  "billing_period": {"value": string|null, "confidence": number},
  "total_amount_inr": {"value": number|null, "confidence": number}
 },
 "category_data": {
  "Electricity": {"consumer_number": {"value": string|null, "confidence": number}, "units_consumed_kwh": {"value": number|null, "confidence": number}, "previous_reading": {"value": number|null, "confidence": number}, "current_reading": {"value": number|null, "confidence": number}, "billing_period": {"value": string|null, "confidence": number}, "tariff_category": {"value": string|null, "confidence": number}, "sanctioned_load": {"value": string|null, "confidence": number}, "amount": {"value": number|null, "confidence": number}},
  "Fuel": {"line_items": [{"fuel_type": string, "quantity": number, "unit": string, "rate": number|null, "amount": number|null, "confidence": number}], "diesel_litres": {"value": number|null, "confidence": number}, "petrol_litres": {"value": number|null, "confidence": number}, "lpg_cylinders": {"value": number|null, "confidence": number}, "amount": {"value": number|null, "confidence": number}},
  "Transport": {"vehicle_type": {"value": string|null, "confidence": number}, "vehicle_number": {"value": string|null, "confidence": number}, "fuel_type": {"value": string|null, "confidence": number}, "total_distance_km": {"value": number|null, "confidence": number}, "total_weight_kg": {"value": number|null, "confidence": number}, "routes": {"value": [string], "confidence": number}, "amount": {"value": number|null, "confidence": number}},
  "Raw material purchase": {"line_items": [{"item_name": string, "material_type": string, "quantity": number, "unit": string, "rate": number|null, "amount": number|null, "weight_kg": number|null, "confidence": number}], "cotton_kg": {"value": number|null, "confidence": number}, "polyester_kg": {"value": number|null, "confidence": number}, "total_material_weight_kg": {"value": number|null, "confidence": number}, "amount": {"value": number|null, "confidence": number}},
  "Waste": {"line_items": [{"waste_type": string, "quantity_kg": number, "disposal_method": string, "rate": number|null, "amount": number|null, "confidence": number}], "total_waste_kg": {"value": number|null, "confidence": number}, "waste_types_count": {"value": number|null, "confidence": number}, "amount": {"value": number|null, "confidence": number}}
 }
}
Normalize electricity units to kWh, distances to km, fuel units to Litres when applicable, and weights to kg or tonnes. Confidence must be 0 to 1. Return JSON only."""


def _validate_document(filename: str, file_bytes: bytes) -> tuple[str, str]:
    extension = os.path.splitext(filename.lower())[1]
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Upload a PDF, JPG, JPEG, or PNG document.")
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded document is empty.")
    if len(file_bytes) > MAX_DOCUMENT_BYTES:
        raise HTTPException(status_code=413, detail="Documents must be 12 MB or smaller.")

    signatures = {
        ".pdf": file_bytes.startswith(b"%PDF-"),
        ".jpg": file_bytes.startswith(b"\xff\xd8\xff"),
        ".jpeg": file_bytes.startswith(b"\xff\xd8\xff"),
        ".png": file_bytes.startswith(b"\x89PNG\r\n\x1a\n"),
    }
    if not signatures[extension]:
        raise HTTPException(
            status_code=415,
            detail="The file contents do not match its PDF, JPG, JPEG, or PNG extension.",
        )
    return extension, MIME_TYPES[extension]


def _period_from_bill(common_fields: dict[str, Any], category_data: dict[str, Any]) -> str | None:
    period = common_fields.get("billing_period", {})
    if not isinstance(period, dict) or not period.get("value"):
        period = category_data.get("billing_period", {})
    value = str(period.get("value") or "").strip().lower() if isinstance(period, dict) else ""
    if not value:
        return None
    if "quarter" in value or re.search(r"\bq[1-4]\b", value):
        return "Quarterly"
    if "annual" in value or "year" in value or re.search(r"\bfy\b", value):
        return "Annual"
    if re.search(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b", value):
        return "Monthly"
    return None


def _field_value(category_data: dict[str, Any], name: str) -> Any:
    field = category_data.get(name)
    return field.get("value") if isinstance(field, dict) else None


def _validate_confidences(value: Any) -> None:
    if isinstance(value, dict):
        if "confidence" in value:
            confidence = value["confidence"]
            if (
                isinstance(confidence, bool)
                or not isinstance(confidence, (int, float))
                or not math.isfinite(confidence)
                or not 0 <= confidence <= 1
            ):
                raise HTTPException(status_code=502, detail="Groq returned an invalid confidence score.")
        for nested_value in value.values():
            _validate_confidences(nested_value)
    elif isinstance(value, list):
        for nested_value in value:
            _validate_confidences(nested_value)


def _activity_records(
    category: str,
    category_data: dict[str, Any],
    period: str | None,
) -> list[dict[str, Any]]:
    records = []

    def add(activity_type: Any, quantity: Any, unit: Any) -> None:
        try:
            amount = float(quantity)
        except (TypeError, ValueError):
            return
        label = str(activity_type or "").strip()
        if amount <= 0 or not label:
            return
        records.append({
            "type": label,
            "quantity": amount,
            "unit": str(unit or ""),
            "period": period,
        })

    if category == "Electricity":
        add("Grid electricity", _field_value(category_data, "units_consumed_kwh"), "kWh")
    elif category == "Fuel":
        for item in category_data.get("line_items", []):
            if isinstance(item, dict):
                add(item.get("fuel_type"), item.get("quantity"), item.get("unit"))
        if not records:
            for field, fuel_type, unit in (
                ("diesel_litres", "Diesel", "Litres"),
                ("petrol_litres", "Petrol", "Litres"),
                ("lpg_cylinders", "LPG", "nos"),
            ):
                add(fuel_type, _field_value(category_data, field), unit)
    elif category == "Transport":
        add(_field_value(category_data, "vehicle_type"), _field_value(category_data, "total_distance_km"), "km")
    elif category == "Raw material purchase":
        for item in category_data.get("line_items", []):
            if not isinstance(item, dict):
                continue
            weight = item.get("weight_kg")
            unit = str(item.get("unit") or "kg")
            quantity = weight if weight is not None else item.get("quantity")
            if weight is not None:
                unit = "kg"
            add(item.get("material_type") or item.get("item_name"), quantity, unit)
        if not records:
            for field, material_type in (("cotton_kg", "Cotton yarn"), ("polyester_kg", "Plastic polymers")):
                add(material_type, _field_value(category_data, field), "kg")
    elif category == "Waste":
        for item in category_data.get("line_items", []):
            if isinstance(item, dict):
                add(item.get("waste_type"), item.get("quantity_kg"), "kg")
        if not records:
            add("General waste", _field_value(category_data, "total_waste_kg"), "kg")
    return records


def _extract_pdf_text(file_bytes: bytes) -> tuple[str, str]:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        if len(reader.pages) > MAX_PDF_PAGES:
            raise HTTPException(status_code=413, detail=f"PDFs must contain {MAX_PDF_PAGES} pages or fewer.")
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="The PDF is corrupt or could not be read.") from exc
    if text:
        return text, "pypdf"

    try:
        document = pymupdf.open(stream=file_bytes, filetype="pdf")
        if len(document) > MAX_PDF_PAGES:
            document.close()
            raise HTTPException(status_code=413, detail=f"PDFs must contain {MAX_PDF_PAGES} pages or fewer.")
        pages = []
        for page in document:
            pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
            recognized, _ = extract_text_from_image(pixmap.tobytes("png"))
            if recognized:
                pages.append(recognized)
        document.close()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail="The scanned PDF could not be processed with OCR.") from exc
    text = "\n".join(pages).strip()
    if not text:
        raise HTTPException(status_code=422, detail="No readable text was found in this PDF. Try a clearer scan.")
    return text, "pypdf + RapidOCR"


async def _call_groq(
    prompt: str,
    api_key: str,
    model: str,
    image_data_url: str | None = None,
) -> dict[str, Any]:
    content: Any = prompt
    if image_data_url:
        content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": image_data_url}},
        ]
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": EXTRACTION_PROMPT},
                        {"role": "user", "content": content},
                    ],
                    "temperature": 0,
                    "max_completion_tokens": 3000,
                    "response_format": {"type": "json_object"},
                },
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="Groq extraction timed out. Please retry.") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not connect to the Groq extraction service.") from exc

    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="Groq rate limit reached. Please wait and retry.")
    if response.status_code in (401, 403):
        raise HTTPException(status_code=503, detail="Groq rejected its API key. Check backend/.env.")
    if response.is_error:
        raise HTTPException(status_code=502, detail="Groq could not extract this document.")
    try:
        content_text = response.json()["choices"][0]["message"]["content"]
        import json

        result = json.loads(content_text)
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Groq returned an invalid extraction response.") from exc
    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="Groq returned an invalid extraction response.")
    return result


async def extract_bill(
    filename: str,
    file_bytes: bytes,
    target_category: str,
    business_name: str | None = None,
    business_gstin: str | None = None,
) -> dict[str, Any]:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Bill extraction is not configured. Add GROQ_API_KEY to backend/.env and restart the backend.",
        )

    extension, mime_type = _validate_document(filename, file_bytes)
    canonical_target = ALLOWED_CATEGORIES.get(target_category)
    if not canonical_target:
        raise HTTPException(status_code=422, detail="Select a supported activity category.")

    prompt = f"Extract this document for the {canonical_target} category. Return all available common and category-specific fields."
    image_data_url = None
    if extension == ".pdf":
        document_text, ocr_engine = _extract_pdf_text(file_bytes)
        prompt = f"{prompt}\n\nDocument text:\n{document_text[:100000]}"
    else:
        encoded = base64.b64encode(file_bytes).decode("ascii")
        image_data_url = f"data:{mime_type};base64,{encoded}"
        ocr_engine = "Groq multimodal vision OCR"

    extraction = await _call_groq(
        prompt,
        api_key,
        os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b").strip(),
        image_data_url,
    )
    detected_category = extraction.get("detected_category")
    if detected_category not in set(ALLOWED_CATEGORIES.values()):
        raise HTTPException(status_code=422, detail="The document category could not be identified reliably.")
    common_fields = extraction.get("common_fields")
    category_data = extraction.get("category_data")
    if not isinstance(common_fields, dict) or not isinstance(category_data, dict):
        raise HTTPException(status_code=502, detail="Groq returned incomplete structured extraction data.")
    for field_name in CATEGORY_FIELDS[detected_category]:
        if field_name == "line_items":
            if field_name not in category_data:
                category_data[field_name] = []
            elif not isinstance(category_data[field_name], list):
                raise HTTPException(status_code=502, detail="Groq returned invalid category line items.")
        else:
            if field_name not in category_data:
                category_data[field_name] = {"value": None, "confidence": 0}
            elif not isinstance(category_data[field_name], dict):
                raise HTTPException(status_code=502, detail="Groq returned invalid category fields.")
    _validate_confidences({"common_fields": common_fields, "category_data": category_data})
    category_matches, category_warning = check_category_match(detected_category, canonical_target)
    business_verification = fuzzy_match_business(
        common_fields.get("buyer_name", {}).get("value") if isinstance(common_fields.get("buyer_name"), dict) else None,
        common_fields.get("buyer_gstin", {}).get("value") if isinstance(common_fields.get("buyer_gstin"), dict) else None,
        business_name,
        business_gstin,
    )
    try:
        flags = [
            flag.model_dump() if hasattr(flag, "model_dump") else flag
            for flag in validate_extracted_data(detected_category, common_fields, category_data)
        ]
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Groq returned invalid values for document validation.") from exc
    if category_warning:
        flags.insert(0, {"field": "category", "type": "warning", "message": category_warning})
    if business_verification.warning:
        flags.insert(0, {"field": "buyer_name", "type": "warning", "message": business_verification.warning})

    period = _period_from_bill(common_fields, category_data)
    activity_records = _activity_records(detected_category, category_data, period)
    try:
        calculated_emissions = calculate_footprint_estimate(detected_category, category_data)
        response = BillExtractionResponse(
            file_name=filename,
            detected_category=detected_category,
            category_matches_page=category_matches,
            business_verification=business_verification,
            common_fields=common_fields,
            category_data=category_data,
            validation_flags=flags,
            calculated_emissions=calculated_emissions,
        )
    except (TypeError, ValueError, KeyError) as exc:
        raise HTTPException(status_code=502, detail="Groq returned fields that failed validation.") from exc

    return {
        **response.model_dump(),
        "ocr_engine": ocr_engine,
        "activity_records": activity_records,
        "document_hash": hashlib.sha256(file_bytes).hexdigest(),
        "business_suggestion": {
            "name": common_fields.get("buyer_name", {}).get("value")
            if isinstance(common_fields.get("buyer_name"), dict)
            else None,
        },
    }
