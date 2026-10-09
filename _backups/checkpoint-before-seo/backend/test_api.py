import urllib.request
import json

payload = {
    "business": {"name": "ABC Textiles", "industry": "Textiles", "city": "Indore, MP", "employees": 50, "reportingPeriod": "FY 2025-26"},
    "electricity": {"amount": 12000, "unit": "kWh", "period": "Monthly"},
    "fuels": [{"type": "Diesel", "quantity": 500, "unit": "Litres", "period": "Monthly"}],
    "transport": {"distance_km": 3800, "vehicle_type": "Light Commercial Vehicle", "period": "Monthly"},
    "materials": [{"type": "Steel", "quantity": 5000, "unit": "kg", "period": "Monthly"}],
    "waste": [{"type": "General waste", "quantity": 200, "unit": "kg", "period": "Monthly"}],
    "footprint": {"total": 128.4, "scope1": 32.5, "scope2": 51.8, "scope3": 44.1},
    "tempId": "TEMP-MSME-8492"
}

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("1. Predicting emissions via FastAPI...")
pred = post("http://127.0.0.1:8000/api/predict", payload)
print("-> Predicted total:", pred['prediction']['total'], "tCO2e")
print("-> Scopes:", pred['prediction']['scope1'], pred['prediction']['scope2'], pred['prediction']['scope3'])

print("2. Generating Excel Spreadsheet (.xlsx)...")
sheet = post("http://127.0.0.1:8000/api/reports/spreadsheet", payload)
print("-> Generated spreadsheet file:", sheet['filename'])

print("3. Generating PDF report (.pdf)...")
pdf = post("http://127.0.0.1:8000/api/reports/pdf", payload)
print("-> Generated PDF file:", pdf['filename'])

print("4. Listing saved reports...")
rep_list = get("http://127.0.0.1:8000/api/reports/list")
print("-> Saved spreadsheets on server:", rep_list['spreadsheets'])
print("-> Saved PDFs on server:", rep_list['pdfs'])
print("ALL TESTS PASSED!")
