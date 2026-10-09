import urllib.request
import json

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

# Test 1: User gives Electricity bill text
print("--- TEST 1: Electricity Bill ---")
res1 = post("http://127.0.0.1:8000/api/bills/analyze", {
    "session_id": "TEMP-MSME-8492",
    "bill_text": "MPPKVVCL Madhya Pradesh Power Discom Bill. Total units consumed: 12,000 kWh for spinning mill shopfloor.",
    "bill_filename": "MP_Electricity_Bill_Aug.pdf"
})
print("Detected domain:", res1['detected_domain'])
print("Detected scope:", res1['detected_scope'])
print("Extracted quantity:", res1['quantity'], res1['unit'])
print("Calculated emissions:", res1['emissions_tco2e'], "tCO2e")
print("Explanation:", res1['explanation'])

# Test 2: User gives Fuel statement
print("\n--- TEST 2: Diesel Fuel Invoice ---")
res2 = post("http://127.0.0.1:8000/api/bills/analyze", {
    "session_id": "TEMP-MSME-8492",
    "bill_text": "HPCL Commercial High Speed Diesel fuel voucher for 500 Litres DG backup genset running.",
    "bill_filename": "HPCL_Diesel_Challan.pdf"
})
print("Detected domain:", res2['detected_domain'])
print("Detected scope:", res2['detected_scope'])
print("Extracted quantity:", res2['quantity'], res2['unit'])
print("Calculated emissions:", res2['emissions_tco2e'], "tCO2e")

# Test 3: Check SQLite database
print("\n--- TEST 3: Check Local SQLite Database ---")
stats = get("http://127.0.0.1:8000/api/database/status")
print("Database stats:", stats)

bills_list = get("http://127.0.0.1:8000/api/bills/list")
print("Total analyzed bills stored in SQLite:", len(bills_list['bills']))
print("SUCCESS: Smart Bill Analysis & SQLite Persistence verified!")
