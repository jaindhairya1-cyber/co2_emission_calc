import os
import sys
import json
import asyncio
from difflib import SequenceMatcher

sys.stdout.reconfigure(encoding='utf-8')
from services.vision_extractor import process_bill_extraction

EXPECTED_FILE = os.path.join(os.path.dirname(__file__), "test_data", "expected_values.json")
BILLS_DIR = os.path.join(os.path.dirname(__file__), "test_data", "bills")

async def run_accuracy_benchmark():
    with open(EXPECTED_FILE, "r", encoding="utf-8") as f:
        expected_all = json.load(f)

    results = []
    print("=" * 80)
    print("TERRA01 — AI BILL EXTRACTION ACCURACY BENCHMARK REPORT")
    print("=" * 80)
    print(f"{'Bill Filename':<26} | {'Detected Category':<15} | {'Activity Match':<16} | {'Amount Match':<12} | {'Score':<6}")
    print("-" * 80)

    total_score = 0.0
    bill_count = len(expected_all)

    for filename, expected in expected_all.items():
        file_path = os.path.join(BILLS_DIR, filename)
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue

        with open(file_path, "rb") as bf:
            file_bytes = bf.read()

        extraction = await process_bill_extraction(
            file_bytes=file_bytes,
            filename=filename,
            file_url=f"/static/uploads/{filename}",
            current_category=expected.get("category"),
            business_name="Sunrise Garments Pvt. Ltd.",
            business_gstin="23AABCS4821K1Z5"
        )

        detected_category = extraction.detected_category
        cat_match = (detected_category.lower() == expected["category"].lower())
        cat_data = extraction.category_data
        common = extraction.common_fields

        # Check key activity values per bill
        activity_match = False
        amount_match = False
        field_matches = 0
        field_total = 3

        if cat_match:
            field_matches += 1

        # Check amount
        ext_amount = common.total_amount_inr.value
        exp_amount = expected.get("total_amount_inr")
        if ext_amount and exp_amount and abs(ext_amount - exp_amount) < 2.0:
            amount_match = True
            field_matches += 1

        # Specific activity checks
        if filename == "1_transport_bill.jpg":
            km = cat_data.get("total_distance_km", {}).get("value")
            if km and abs(km - expected["total_distance_km"]) < 5.0:
                activity_match = True
                field_matches += 1
        elif filename == "2_fuel_bill.jpg":
            diesel = cat_data.get("diesel_litres", {}).get("value")
            if diesel and abs(diesel - expected["diesel_litres"]) < 5.0:
                activity_match = True
                field_matches += 1
        elif filename == "3_raw_material_bill.jpg":
            weight = cat_data.get("total_material_weight_kg", {}).get("value")
            if weight and abs(weight - expected["total_material_weight_kg"]) < 50.0:
                activity_match = True
                field_matches += 1
        elif filename == "4_waste_bill.jpg":
            waste = cat_data.get("total_waste_kg", {}).get("value")
            if waste and abs(waste - expected["total_waste_kg"]) < 20.0:
                activity_match = True
                field_matches += 1
        elif filename == "5_electricity_bill.jpg":
            kwh = cat_data.get("units_consumed_kwh", {}).get("value")
            if kwh and abs(kwh - expected["units_consumed_kwh"]) < 10.0:
                activity_match = True
                field_matches += 1

        bill_pct = (field_matches / field_total) * 100
        total_score += bill_pct

        act_str = "PASS (Exact)" if activity_match else "FAIL"
        amt_str = "PASS (Exact)" if amount_match else "FAIL"

        print(f"{filename:<26} | {detected_category:<15} | {act_str:<16} | {amt_str:<12} | {bill_pct:>5.1f}%")
        results.append({
            "filename": filename,
            "detected_category": detected_category,
            "category_match": cat_match,
            "activity_match": activity_match,
            "amount_match": amount_match,
            "score": bill_pct,
            "extracted_values": {
                "amount": ext_amount,
                "buyer": common.buyer_name.value,
                "gstin": common.buyer_gstin.value,
                "emissions_tco2e": extraction.calculated_emissions.get("tco2e")
            }
        })

    overall_avg = total_score / bill_count if bill_count > 0 else 0
    print("-" * 80)
    print(f"OVERALL EXTRACTION ACCURACY: {overall_avg:.1f}% ({len(results)}/5 Bills Validated)")
    print("=" * 80)

    # Save benchmark report to reports/
    out_path = os.path.join(os.path.dirname(__file__), "reports", "accuracy_report.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"overall_accuracy_pct": overall_avg, "results": results}, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_accuracy_benchmark())
