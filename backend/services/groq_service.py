"""Groq (OpenAI-compatible) client. The model interprets text and explains
results; it never computes emissions or supplies factors."""
import json
import os
from typing import Any, Dict, List

import httpx

from services import factor_store as fs

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqUnavailable(Exception):
    pass


def _chat(messages: List[Dict[str, str]], json_mode: bool = False, temperature: float = 0.1) -> str:
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise GroqUnavailable("GROQ_API_KEY is not set in backend/.env")
    body: Dict[str, Any] = {
        "model": os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b"),
        "messages": messages,
        "temperature": temperature,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    try:
        r = httpx.post(GROQ_URL, headers={"Authorization": f"Bearer {key}"}, json=body, timeout=45)
    except httpx.HTTPError as e:
        raise GroqUnavailable(f"Could not reach Groq: {e}")
    if r.status_code != 200:
        raise GroqUnavailable(f"Groq returned {r.status_code}: {r.text[:200]}")
    return r.json()["choices"][0]["message"]["content"]


def parse_activity_text(text: str) -> Dict[str, Any]:
    """Free text -> structured inputs limited to the types the dataset supports."""
    system = (
        "You convert a small business owner's description into structured activity data. "
        "Return JSON only with keys: electricity {amount, unit, period}, fuels [{type, quantity, unit, period}], "
        "materials [{type, quantity, unit, period}], waste [{type, quantity, unit, period}], not_understood [string]. "
        "period is Monthly, Quarterly or Annual. electricity unit is kWh or MWh. fuel unit is Litres. "
        "material and waste unit is kg or tonnes. "
        f"Allowed fuel types: {list(fs.FUEL_TYPES)}. Allowed material types: {list(fs.MATERIAL_TYPES)}. "
        f"Allowed waste types: {list(fs.WASTE_TYPES)}. "
        "Use only these exact type names. Never guess a quantity. Put anything that does not fit, or any "
        "number you are unsure of, into not_understood. Do not calculate emissions."
    )
    raw = _chat([{"role": "system", "content": system}, {"role": "user", "content": text}], json_mode=True, temperature=0)
    data = json.loads(raw)
    # Enforce the allowed vocabulary; drop anything the model made up.
    allowed = {"fuels": fs.FUEL_TYPES, "materials": fs.MATERIAL_TYPES, "waste": fs.WASTE_TYPES}
    notes = list(data.get("not_understood") or [])
    for key, table in allowed.items():
        kept = []
        for item in data.get(key) or []:
            if item.get("type") in table:
                kept.append(item)
            else:
                notes.append(f"Dropped unsupported {key[:-1] if key != 'waste' else 'waste'} type: {item.get('type')}")
        data[key] = kept
    data["not_understood"] = notes
    return data


def explain_result(prediction: Dict[str, Any]) -> str:
    """Plain-language explanation grounded in the calculated result only."""
    facts = {
        "total_tCO2": prediction["total"],
        "scope1": prediction["scope1"],
        "scope2": prediction["scope2"],
        "scope3": prediction["scope3"],
        "unverified_share_pct": prediction["unverified_share_pct"],
        "line_items": [
            {k: l[k] for k in ("label", "domain", "annual_quantity", "unit", "factor", "factor_unit",
                               "emissions_tonnes", "status", "source", "reference_year", "boundary")}
            for l in prediction["line_items"]
        ],
        "excluded_for_missing_factor": prediction["unsupported"],
    }
    system = (
        "You explain a carbon footprint to a non-expert small business owner. Use ONLY the numbers in the "
        "JSON provided. Do not compute new emissions, do not add factors or figures from memory, and do not "
        "invent costs. Cover: what the biggest sources are, which factor and source each result used, and "
        "plainly flag every line whose status is not verified_historical and every excluded item. Then give "
        "3 to 5 practical, qualitative reduction ideas aimed at the largest sources, with no cost or savings "
        "numbers. Never suggest switching to another material or fuel unless it appears in the JSON with a lower factor. Keep it under 300 words."
    )
    return _chat([{"role": "system", "content": system}, {"role": "user", "content": json.dumps(facts)}], temperature=0.2)
