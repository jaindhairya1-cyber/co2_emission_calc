import re
from difflib import SequenceMatcher
from typing import Dict, Any, List, Optional, Tuple
from models.bill_schema import BusinessVerification, ValidationFlag

def normalize_company_name(name: str) -> str:
    if not name:
        return ""
    text = name.lower()
    # Remove common suffixes and punctuation
    text = re.sub(r'[\.,\-\(\)\/\\]', ' ', text)
    stopwords = ["pvt", "ltd", "private", "limited", "co", "corp", "corporation", "llp", "inc", "company"]
    tokens = [t for t in text.split() if t not in stopwords]
    return " ".join(tokens).strip()

def normalize_gstin(gstin: str) -> str:
    if not gstin:
        return ""
    return re.sub(r'[^A-Z0-9]', '', gstin.upper())

def fuzzy_match_business(
    extracted_buyer: Optional[str],
    extracted_gstin: Optional[str],
    target_name: Optional[str],
    target_gstin: Optional[str]
) -> BusinessVerification:
    if not target_name and not target_gstin:
        return BusinessVerification(is_match=True, similarity_score=1.0)

    clean_ext_name = normalize_company_name(extracted_buyer or "")
    clean_tgt_name = normalize_company_name(target_name or "")

    clean_ext_gstin = normalize_gstin(extracted_gstin or "")
    clean_tgt_gstin = normalize_gstin(target_gstin or "")

    # 1. GSTIN Check: High confidence identifier in India
    if clean_ext_gstin and clean_tgt_gstin:
        if clean_ext_gstin == clean_tgt_gstin:
            return BusinessVerification(
                is_match=True,
                similarity_score=1.0,
                extracted_buyer_name=extracted_buyer,
                extracted_buyer_gstin=extracted_gstin,
                warning=None
            )
        # Check if 13+ out of 15 chars match (slight OCR glitch)
        gstin_match = SequenceMatcher(None, clean_ext_gstin, clean_tgt_gstin).ratio()
        if gstin_match > 0.88:
            return BusinessVerification(
                is_match=True,
                similarity_score=round(gstin_match, 2),
                extracted_buyer_name=extracted_buyer,
                extracted_buyer_gstin=extracted_gstin,
                warning=None
            )

    # 2. Name Similarity Check
    if clean_ext_name and clean_tgt_name:
        ratio = SequenceMatcher(None, clean_ext_name, clean_tgt_name).ratio()
        # Also check substring match (e.g. "sunrise garments" in "sunrise garments indore")
        if clean_tgt_name in clean_ext_name or clean_ext_name in clean_tgt_name:
            ratio = max(ratio, 0.90)

        if ratio >= 0.70:
            return BusinessVerification(
                is_match=True,
                similarity_score=round(ratio, 2),
                extracted_buyer_name=extracted_buyer,
                extracted_buyer_gstin=extracted_gstin,
                warning=None
            )
        else:
            return BusinessVerification(
                is_match=False,
                similarity_score=round(ratio, 2),
                extracted_buyer_name=extracted_buyer,
                extracted_buyer_gstin=extracted_gstin,
                warning=f"This bill is addressed to '{extracted_buyer or 'Unknown'}', not '{target_name}'."
            )

    # If neither could be compared reliably, default to permissive match with flag
    return BusinessVerification(
        is_match=True,
        similarity_score=0.85,
        extracted_buyer_name=extracted_buyer,
        extracted_buyer_gstin=extracted_gstin,
        warning=None
    )

def check_category_match(detected_cat: str, current_cat: Optional[str]) -> Tuple[bool, Optional[str]]:
    if not current_cat:
        return (True, None)

    cat_map = {
        "elec": "Electricity",
        "electricity": "Electricity",
        "fuel": "Fuel",
        "trans": "Transport",
        "transport": "Transport",
        "mat": "Raw material purchase",
        "materials": "Raw material purchase",
        "raw material": "Raw material purchase",
        "raw material purchase": "Raw material purchase",
        "waste": "Waste"
    }

    norm_detected = cat_map.get(detected_cat.lower().strip(), detected_cat)
    norm_current = cat_map.get(current_cat.lower().strip(), current_cat)

    if norm_detected.lower() == norm_current.lower():
        return (True, None)

    return (
        False,
        f"This document looks like a {norm_detected} bill, but is uploaded on the {norm_current} page."
    )

def validate_extracted_data(
    category: str,
    common_fields: Dict[str, Any],
    category_data: Dict[str, Any]
) -> List[ValidationFlag]:
    flags = []

    # 1. Low confidence fields check (< 0.70)
    for field_name, field_obj in common_fields.items():
        if isinstance(field_obj, dict) and "confidence" in field_obj:
            conf = field_obj.get("confidence", 1.0)
            if conf < 0.70 and field_obj.get("value") is not None:
                flags.append(ValidationFlag(
                    field=field_name,
                    type="warning",
                    message=f"{field_name.replace('_', ' ').title()} had low OCR certainty ({int(conf*100)}%). Please review."
                ))

    # 2. Mathematical Consistency Checks
    if category == "Electricity":
        curr = category_data.get("current_reading", {}).get("value")
        prev = category_data.get("previous_reading", {}).get("value")
        units = category_data.get("units_consumed_kwh", {}).get("value")

        if curr is not None and prev is not None and units is not None:
            diff = curr - prev
            if abs(diff - units) < 0.5:
                flags.append(ValidationFlag(
                    field="units_consumed_kwh",
                    type="info",
                    message=f"Verified meter arithmetic: {curr:,.0f} - {prev:,.0f} = {units:,.0f} kWh."
                ))
            else:
                flags.append(ValidationFlag(
                    field="units_consumed_kwh",
                    type="warning",
                    message=f"Meter reading difference ({diff:,.0f}) does not match billed units ({units:,.0f}). Please verify."
                ))

    elif category == "Transport":
        dist = category_data.get("total_distance_km", {}).get("value")
        if dist is not None and dist > 0:
            flags.append(ValidationFlag(
                field="total_distance_km",
                type="info",
                message=f"Recorded route transit: {dist:,.0f} km."
            ))

    elif category in ["Fuel", "Raw material purchase", "Waste"]:
        items = category_data.get("line_items", [])
        if items and isinstance(items, list):
            flags.append(ValidationFlag(
                field="line_items",
                type="info",
                message=f"Successfully extracted {len(items)} line item(s)."
            ))

    return flags
