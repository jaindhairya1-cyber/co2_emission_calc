# Smart Bill & Consumption Analysis Engine — Implementation Specification

## 1. Executive Summary
The **Smart Bill & Consumption Analysis Engine** removes manual classification complexity for MSMEs. Instead of forcing business owners to understand GHG Scopes, emission factors, and carbon accounting categorizations:
1. **The user only provides the bill or consumption data** (e.g., uploads an electricity bill, diesel fuel receipt, steel delivery note, or enters raw numbers like *"12,000 units on MP electricity bill"*).
2. **The engine automatically classifies the operational domain** (*Electricity*, *Fuel*, *Transport*, *Materials*, or *Waste*).
3. **The engine calculates the statutory carbon emissions** using official Central Electricity Authority (CEA India FY 2024-25, v21.0) and DEFRA factors.
4. **The engine tells the user in plain English** exactly where the emissions originate, which statutory Scope it impacts, and how to reduce it.
5. **A lightweight temporary local SQLite database** (`backend/terraai.db`) stores bills, sessions, and activity logs on the local system.

---

## 2. Architecture & Data Flow

```
+-------------------------------------------------------------+
|                      USER BILL INPUT                        |
|   (Image / PDF / Invoice Text / Raw Consumption Numbers)   |
+-------------------------------------------------------------+
                              │
                              ▼
+-------------------------------------------------------------+
|             SMART BILL CLASSIFIER & ANALYZER                |
|  1. Domain Detection (Electricity / Fuel / Transport / etc) |
|  2. Quantity & Metric Unit Extraction (kWh, L, kg, tonnes)   |
|  3. Statutory Factor Mapping (CEA 0.710, Diesel 2.687...)   |
|  4. Scope Attribution (Scope 1 Direct / Scope 2 / Scope 3)  |
+-------------------------------------------------------------+
                              │
                              ▼
+-------------------------------------------------------------+
|              PLAIN-ENGLISH BUSINESS EXPLANATION             |
|   "This bill is from Electricity (Scope 2). It generates    |
|    8.52 tCO₂e. Upgrading to solar can save ₹38,000/yr."     |
+-------------------------------------------------------------+
                              │
                              ▼
+-------------------------------------------------------------+
|               LOCAL TEMPORARY DATABASE (SQLite)             |
|   Stored in backend/terraai.db (Sessions, Bills, Logs)     |
+-------------------------------------------------------------+
```

---

## 3. Temporary Local Database Schema (`backend/terraai.db`)

We use **SQLite3**, which runs natively on Python with zero external server dependencies, persisting cleanly to `backend/terraai.db` on the local system:

### Table 1: `sessions`
- `session_id` (TEXT PRIMARY KEY) — e.g. `TEMP-MSME-8492`
- `business_name` (TEXT) — e.g. `ABC Textiles`
- `industry` (TEXT) — e.g. `Textiles`
- `city` (TEXT) — e.g. `Indore, Madhya Pradesh`
- `created_at` (DATETIME)

### Table 2: `analyzed_bills`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `session_id` (TEXT) — Foreign key to session
- `bill_name` (TEXT) — e.g. `MPPKVVCL_Electricity_Aug2026.pdf`
- `raw_text` (TEXT) — Raw bill text or user statement
- `detected_domain` (TEXT) — `Electricity` | `Fuel` | `Transport` | `Materials` | `Waste`
- `detected_scope` (TEXT) — `Scope 2` | `Scope 1` | `Scope 3`
- `quantity` (REAL) — e.g. `12000`
- `unit` (TEXT) — e.g. `kWh`
- `emissions_tco2e` (REAL) — Computed emissions in metric tons CO₂e
- `explanation` (TEXT) — Plain English origin breakdown
- `reduction_tip` (TEXT) — Practical MSME decarbonization recommendation
- `created_at` (DATETIME)

### Table 3: `activity_entries`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `session_id` (TEXT)
- `domain` (TEXT)
- `amount` (REAL)
- `unit` (TEXT)
- `period` (TEXT)
- `source_type` (TEXT) — `Actual (from bill)` / `Estimated`
- `tco2e` (REAL)
- `updated_at` (DATETIME)

---

## 4. Domain Inference & Emission Calculation Rules

| Input Signals / Keywords | Detected Domain | Statutory Scope | Applied Factor | Explanation Formula |
| :--- | :--- | :--- | :--- | :--- |
| `kwh`, `units`, `discom`, `mppkvvcl`, `bescom`, `power`, `grid`, `electricity` | **Electricity** | **Scope 2 (Indirect)** | `0.710 kg CO₂e/kWh` (CEA India) | `kWh × 0.710 / 1000` |
| `diesel`, `petrol`, `hsd`, `fuel`, `lpg`, `cng`, `generator`, `dg set`, `boiler`, `litres` | **Fuel** | **Scope 1 (Direct)** | `2.687 kg CO₂e/L` (Diesel) | `Litres × 2.687 / 1000` |
| `freight`, `truck`, `logistics`, `km`, `kilometres`, `dispatch`, `delivery` | **Transport** | **Scope 3 (Logistics)** | `0.285 kg CO₂e/km` (LCV) | `km × 0.285 / 1000` |
| `steel`, `cotton`, `yarn`, `fabric`, `polymer`, `raw material`, `kg`, `tonnes` | **Materials** | **Scope 3 (Embodied)** | `1.820 kg CO₂e/kg` (Steel) | `kg × 1.820 / 1000` |
| `waste`, `scrap`, `hazardous`, `disposal`, `landfill`, `manifest` | **Waste** | **Scope 3 (End-of-life)** | `0.580 kg CO₂e/kg` (Landfill) | `kg × 0.580 / 1000` |

---

## 5. FastAPI Endpoints Added

1. **`POST /api/bills/analyze`**
   - **Body:** `{ "session_id": "...", "bill_text": "...", "bill_filename": "..." }`
   - **Process:** Classifies domain, extracts consumption, calculates emissions, saves to SQLite.
   - **Response:**
     ```json
     {
       "status": "success",
       "bill_id": 1,
       "domain": "Electricity",
       "scope": "Scope 2",
       "quantity": 12000,
       "unit": "kWh",
       "emissions_tco2e": 8.52,
       "explanation": "This bill is from your Grid Electricity consumption. It generates 8.52 tCO₂e under Scope 2.",
       "reduction_tip": "High electricity footprint. A 25 kWp captive rooftop solar system can offset up to 35% of this bill with a 3.7-year payback."
     }
     ```
2. **`GET /api/bills/list?session_id=...`**
   - Returns all analyzed bills stored in the local SQLite database.
3. **`GET /api/database/status`**
   - Returns total bill records and database status.
