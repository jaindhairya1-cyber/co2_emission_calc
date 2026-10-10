"""Loads the emission-factor dataset once and exposes lookups.

The JSON file in the repository root is the single source of truth. Nothing in
this module (or the calculator) invents a factor: a missing factor is reported
as unsupported instead of being guessed.
"""
import json
import os
from functools import lru_cache
from typing import Any, Dict, List, Optional

DATASET_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "carbon_emission_factors_india.json",
)

# Statuses that must never feed a calculation, even when the user opts in.
BLOCKED_STATUSES = {"not_for_production", "scenario_not_inventory_factor"}

# Factor chosen when the user does not pick an electricity metric (CEA FY 2022-23,
# weighted average including RES and imports). Other metrics stay selectable.
DEFAULT_ELECTRICITY_FACTOR_ID = "electricity_india_grid_2022_23_res_incl_imports"

# UI label -> factor_id for each calculable input type.
FUEL_TYPES = {
    "Petrol": "petrol_user_supplied_2371",
    "Diesel": "diesel_user_supplied_264",
    "LPG": "fuel_lpg_1512",
}
MATERIAL_TYPES = {
    "Steel": "steel_user_supplied_21",
    "Aluminium": "aluminium_user_supplied_26",
    "Cotton yarn": "material_cotton_yarn_3540",
    "Plastic polymers": "material_plastic_polymers_2150",
    "Cement": "cement_user_supplied_076",
    "PET plastic": "pet_user_supplied_3",
    "Paper / pulp": "paper_pulp_user_supplied_198",
    "Timber (raw)": "wood_raw_timber_user_supplied_0493",
    "Sawn wood": "wood_sawn_user_supplied_0263",
    "Wood (burned)": "wood_burned_user_supplied_0323",
    "Ethylene (naphtha route)": "ethylene_naphtha_route_niti_2026",
    "Ethylene (ethane route)": "ethylene_ethane_route_niti_2026",
    "Caustic soda": "caustic_soda_user_supplied_290",
    "Soda ash (process)": "soda_ash_process_niti_2026",
    "Cement clinker (process)": "cement_clinker_process_niti_2026",
}
WASTE_TYPES = {
    "General waste": "waste_general_mixed_0580",
    "Metal scrap": "waste_metal_scrap_0150",
    "Food / organic waste (composted)": "food_organic_waste_composted_user_supplied_032",
    "Food / organic waste (landfill)": "food_organic_waste_landfill_user_supplied_129",
}
TRANSPORT_TYPES = {
    "Light Commercial Vehicle": "transport_lcv_user_supplied_0245",
    "Diesel Truck (Heavy)": "transport_heavy_truck_user_supplied_0760",
    "Electric Fleet Van": "transport_electric_van_user_supplied_0085",
    "Commercial Freight": "transport_freight_user_supplied_0220",
    "Commercial Fleet": "transport_freight_user_supplied_0220",
}
SCOPE_BY_CATEGORY = {"fuel": 1, "electricity": 2, "materials": 3, "waste": 3, "transport": 3}


@lru_cache(maxsize=1)
def load_dataset() -> Dict[str, Any]:
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def _factor_index() -> Dict[str, Dict[str, Any]]:
    return {f["factor_id"]: f for f in load_dataset()["emission_factors"]}


@lru_cache(maxsize=1)
def _source_index() -> Dict[str, Dict[str, Any]]:
    return {s["source_id"]: s for s in load_dataset()["sources"]}


def get_factor(factor_id: str) -> Optional[Dict[str, Any]]:
    return _factor_index().get(factor_id)


def describe_factor(factor_id: str) -> Dict[str, Any]:
    """Factor plus its source record, as shown to the user."""
    f = get_factor(factor_id)
    if f is None:
        raise KeyError(f"Unknown factor_id: {factor_id}")
    src = _source_index().get(f.get("source_id") or "")
    return {
        "factor_id": f["factor_id"],
        "activity": f["activity"],
        "factor": f["factor"],
        "factor_unit": f["factor_unit"],
        "activity_unit": f["activity_unit"],
        "gas": f["gas"],
        "reference_year": f.get("reference_year"),
        "boundary": f["boundary"],
        "status": f["status"],
        "source_id": f.get("source_id"),
        "source": (src["title"] + " (" + src["publisher"] + ")") if src else f.get("claimed_source") or "No source on file",
        "source_url": src["url"] if src else None,
        "source_location": f.get("source_location"),
        "notes": f.get("notes"),
    }


def list_options() -> Dict[str, List[Dict[str, Any]]]:
    """Input types the UI may offer, each tied to its factor."""
    def build(mapping):
        return [{"type": t, **describe_factor(fid)} for t, fid in mapping.items()]

    electricity = [
        describe_factor(f["factor_id"])
        for f in load_dataset()["emission_factors"]
        if f["category"] == "electricity" and f["status"] not in BLOCKED_STATUSES
    ]
    return {
        "electricity": electricity,
        "fuels": build(FUEL_TYPES),
        "transport": build(TRANSPORT_TYPES),
        "materials": build(MATERIAL_TYPES),
        "waste": build(WASTE_TYPES),
    }
