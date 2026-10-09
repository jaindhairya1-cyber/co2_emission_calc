"""Deterministic emissions calculator driven entirely by the factor dataset.

Formula F001: emissions_kg = activity_quantity * emission_factor.
No fallback values: an input without a matching factor is reported under
`unsupported` and contributes nothing to the totals.
"""
from typing import Any, Dict, List

from services import factor_store as fs

PERIOD_MULT = {"Monthly": 12, "Quarterly": 4, "Annual": 1, "Yearly": 1}
MASS_TO_KG = {"kg": 1.0, "tonnes": 1000.0, "tonne": 1000.0, "t": 1000.0}


def load_factors() -> Dict[str, Any]:
    return fs.load_dataset()


def _num(v: Any) -> float:
    try:
        return float(v or 0.0)
    except (TypeError, ValueError):
        return 0.0


def _annual(qty: Any, period: Any) -> float:
    return _num(qty) * PERIOD_MULT.get(period or "Annual", 1)


def _line(domain: str, label: str, annual_qty: float, unit: str, factor_id: str) -> Dict[str, Any]:
    info = fs.describe_factor(factor_id)
    kg = annual_qty * info["factor"]
    return {
        "domain": domain,
        "scope": fs.SCOPE_BY_CATEGORY[domain.lower()],
        "label": label,
        "annual_quantity": round(annual_qty, 4),
        "unit": unit,
        "factor_id": factor_id,
        "factor": info["factor"],
        "factor_unit": info["factor_unit"],
        "emissions_kg": kg,
        "emissions_tonnes": kg / 1000.0,
        "status": info["status"],
        "source": info["source"],
        "source_url": info["source_url"],
        "reference_year": info["reference_year"],
        "boundary": info["boundary"],
    }


def _usable(factor_id: str, allow_unverified: bool) -> bool:
    f = fs.get_factor(factor_id)
    if f is None or f["status"] in fs.BLOCKED_STATUSES:
        return False
    return allow_unverified or f["status"] == "verified_historical"


def predict_emissions(input_data: Dict[str, Any]) -> Dict[str, Any]:
    allow_unverified = input_data.get("allow_unverified", True)
    lines: List[Dict[str, Any]] = []
    unsupported: List[Dict[str, str]] = []

    def skip(domain: str, what: str, reason: str):
        unsupported.append({"domain": domain, "item": what, "reason": reason})

    # Electricity (Scope 2)
    elec = input_data.get("electricity") or {}
    elec_id = input_data.get("electricity_factor_id") or fs.DEFAULT_ELECTRICITY_FACTOR_ID
    qty = _annual(elec.get("amount"), elec.get("period"))
    if qty > 0:
        kwh = qty * (1000.0 if elec.get("unit") == "MWh" else 1.0)
        if _usable(elec_id, allow_unverified):
            lines.append(_line("Electricity", "Grid electricity", kwh, "kWh", elec_id))
        else:
            skip("Electricity", elec_id, "Factor is missing or not permitted by the selected policy.")

    # Fuel (Scope 1)
    for f in input_data.get("fuels") or []:
        qty = _annual(f.get("quantity"), f.get("period"))
        if qty <= 0:
            continue
        ftype = f.get("type")
        fid = fs.FUEL_TYPES.get(ftype)
        if fid is None:
            skip("Fuel", str(ftype), "No factor for this fuel in the dataset.")
        elif f.get("unit") not in (None, "Litres", "litres", "L"):
            skip("Fuel", str(ftype), f"Factor is per litre; quantity was given in {f.get('unit')}.")
        elif not _usable(fid, allow_unverified):
            skip("Fuel", str(ftype), "Only unverified factors exist and unverified factors are switched off.")
        else:
            lines.append(_line("Fuel", ftype, qty, "litre", fid))

    # Transport (Scope 3)
    tr = input_data.get("transport") or {}
    dist = _annual(tr.get("distance_km"), tr.get("period"))
    if dist > 0:
        vtype = tr.get("vehicle_type") or "Light Commercial Vehicle"
        fid = fs.TRANSPORT_TYPES.get(vtype) or fs.TRANSPORT_TYPES.get("Commercial Freight")
        if fid is None:
            skip("Transport", str(vtype), "No matching factor for this vehicle type in the dataset.")
        elif not _usable(fid, allow_unverified):
            skip("Transport", str(vtype), "Only unverified factors exist and unverified factors are switched off.")
        else:
            lines.append(_line("Transport", vtype, dist, "km", fid))

    # Materials (Scope 3) and Waste (Scope 3)
    for domain, key, table in (("Materials", "materials", fs.MATERIAL_TYPES), ("Waste", "waste", fs.WASTE_TYPES)):
        for m in input_data.get(key) or []:
            qty = _annual(m.get("quantity"), m.get("period"))
            if qty <= 0:
                continue
            mtype = m.get("type")
            fid = table.get(mtype)
            kg = qty * MASS_TO_KG.get(m.get("unit") or "kg", 1.0)
            if fid is None:
                skip(domain, str(mtype), "No matching factor in the dataset (a generic factor would be a guess).")
            elif not _usable(fid, allow_unverified):
                skip(domain, str(mtype), "Only unverified factors exist and unverified factors are switched off.")
            else:
                lines.append(_line(domain, mtype, kg, "kg", fid))

    totals_t = {1: 0.0, 2: 0.0, 3: 0.0}
    by_domain: Dict[str, float] = {}
    for ln in lines:
        totals_t[ln["scope"]] += ln["emissions_tonnes"]
        by_domain[ln["domain"]] = by_domain.get(ln["domain"], 0.0) + ln["emissions_tonnes"]
    total = sum(totals_t.values())

    scope_of = {"Electricity": 2, "Fuel": 1, "Transport": 3, "Materials": 3, "Waste": 3}
    breakdown = [
        {"domain": d, "scope": f"Scope {scope_of[d]}", "emissions": round(by_domain.get(d, 0.0), 3),
         "pct": round(by_domain.get(d, 0.0) / total * 100, 1) if total else 0.0}
        for d in ("Electricity", "Fuel", "Transport", "Materials", "Waste")
    ]
    unverified_t = sum(l["emissions_tonnes"] for l in lines if l["status"] != "verified_historical")
    meta = fs.load_dataset()["metadata"]

    return {
        "total": round(total, 3),
        "scope1": round(totals_t[1], 3),
        "scope2": round(totals_t[2], 3),
        "scope3": round(totals_t[3], 3),
        "unit": "tCO2 (dataset factors are CO2, not CO2e)",
        "breakdown": breakdown,
        "line_items": lines,
        "unsupported": unsupported,
        "unverified_share_pct": round(unverified_t / total * 100, 1) if total else 0.0,
        "assumptions": [
            "Emissions = annual activity quantity x emission factor (formula F001).",
            "Monthly inputs are x12, quarterly x4. Annual inputs are used as given.",
            f"Electricity uses factor {elec_id}.",
            "Factors are CO2 only; no CO2e conversion is applied.",
            "Material factors have unspecified lifecycle boundaries unless the line item says otherwise.",
            "Items without a dataset factor are excluded, not estimated.",
        ],
        "dataset": {"name": meta["dataset_name"], "version": meta["version"]},
    }


def calculate_roi_scenario(base_footprint: float, category: str, reduction_pct: float) -> Dict[str, Any]:
    """CO2 saved is arithmetic on the supplied footprint. Cost and payback need
    user-supplied capex/tariff data, which the dataset does not contain."""
    saved = base_footprint * (reduction_pct / 100.0)
    return {
        "category": category,
        "reduction_pct": reduction_pct,
        "co2_saved_tco2e": round(saved, 3),
        "annual_savings_inr": None,
        "estimated_capex_inr": None,
        "payback_years": None,
        "note": "Cost and payback are not in the emission-factor dataset; supply capex and annual saving to compute them.",
    }
