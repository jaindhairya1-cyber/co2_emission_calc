# TerraAI — Backend Implementation Guide & API Specification

## 1. Overview
The **TerraAI Backend** is a high-performance Python **FastAPI** service designed for MSME Carbon Accounting, GHG Scope 1/2/3 calculations, statutory emission factor lookups, and automated file generation (Spreadsheets `.xlsx` and PDF audit reports `.pdf`).

---

## 2. Architecture & File Structure

```
backend/
├── main.py                     # FastAPI server, endpoints, and CORS middleware
├── IMPLEMENTATION.md           # Implementation manual (this file)
├── test_api.py                 # Automated end-to-end verification test script
├── data/
│   └── factors.json            # Static statutory emission factor database (CEA, DEFRA, GHG)
├── services/
│   ├── calculator.py           # GHG Scope 1/2/3 calculation & ML prediction engine
│   └── report_generator.py     # PDF (ReportLab) & Excel (OpenPyXL) document generators
└── reports/                    # Persistent storage for generated files
    ├── spreadsheets/           # Generated .xlsx & .csv workbooks
    └── pdf/                    # Generated .pdf audit reports
```

---

## 3. Where is the Export PDF Code Located?

The PDF export functionality is implemented across two key files:

### A. The Generation Code: `backend/services/report_generator.py`
- **Function:** `generate_pdf_report(data: dict) -> str`
- **Library:** `reportlab`
- **What it does:**
  1. Accepts the business profile (`ABC Textiles`), reporting period, and Scope 1, 2, 3 footprint breakdown.
  2. Constructs a multi-section document layout with formatted tables, corporate branding (`#0E382B`), and statutory disclosure standards.
  3. Writes the compiled file directly to `backend/reports/pdf/TerraAI_Carbon_Audit_<BusinessName>_<timestamp>.pdf`.
  4. Returns the generated filename.

### B. The API Endpoint: `backend/main.py`
- **Endpoint:** `POST /api/reports/pdf`
  - Accepts full JSON payload from the frontend.
  - Calls `generate_pdf_report(payload)`.
  - Returns:
    ```json
    {
      "status": "success",
      "filename": "TerraAI_Carbon_Audit_ABC_Textiles_20261009_113841.pdf",
      "download_url": "/api/reports/download/TerraAI_Carbon_Audit_ABC_Textiles_20261009_113841.pdf",
      "type": "pdf"
    }
    ```
- **File Download Handler:** `GET /api/reports/download/{filename}`
  - Delivers the PDF or Excel spreadsheet directly as an attachment stream.

### C. The Frontend UI Trigger: `frontend/src/screens/Screen12Reports.jsx`
- The user can click the **"Download PDF Audit"** button on the Reports screen (or from the quick export button on the Dashboard).
- The button calls `POST http://127.0.0.1:8000/api/reports/pdf`, automatically launching the download in the browser.

---

## 4. Complete API Endpoints Reference

### 1. Static Emission Factors Lookup
- **URL:** `GET /api/emission-factors`
- **Description:** Returns the static statutory database of emission factors.
- **Standards:**
  - **Grid Electricity (India):** `0.710 kg CO₂e/kWh` (CEA FY 2024-25, v21.0)
  - **Diesel:** `2.687 kg CO₂e/L`
  - **Petrol:** `2.314 kg CO₂e/L`
  - **Freight Transport:** `0.285 kg CO₂e/km` (Light Commercial Vehicle)
  - **Virgin Steel:** `1.820 kg CO₂e/kg`
  - **General Waste:** `0.580 kg CO₂e/kg`

### 2. Dynamic Carbon Prediction Engine
- **URL:** `POST /api/predict`
- **Description:** Takes the user's actual entered activity data (kWh, fuel litres, fleet distance, material weight, waste) and recalculates Scope 1, Scope 2, Scope 3, and monthly projections.
- **Request Body:**
  ```json
  {
    "electricity": { "amount": 12000, "unit": "kWh", "period": "Monthly" },
    "fuels": [{ "type": "Diesel", "quantity": 500, "unit": "Litres", "period": "Monthly" }],
    "transport": { "distance_km": 3800, "vehicle_type": "Light Commercial Vehicle" },
    "materials": [{ "type": "Steel", "quantity": 5000, "unit": "kg" }],
    "waste": [{ "type": "General waste", "quantity": 200, "unit": "kg" }]
  }
  ```

### 3. What-If & ROI Simulation
- **URL:** `POST /api/what-if`
- **Description:** Simulates financial investment, annual cost savings, and payback period for a given category and percentage reduction.

### 4. Excel Spreadsheet Export
- **URL:** `POST /api/reports/spreadsheet`
- **Description:** Generates formatted `.xlsx` workbooks using `openpyxl`.

### 5. Stored Reports Inventory
- **URL:** `GET /api/reports/list`
- **Description:** Lists all spreadsheets and PDF files saved on the server.

---

## 5. Starting the Backend Server
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
- Interactive Swagger Documentation is available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
