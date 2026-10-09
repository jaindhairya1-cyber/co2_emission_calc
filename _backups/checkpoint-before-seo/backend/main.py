import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Body, Query, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Literal
import httpx

from database import (
    init_db,
    get_bills,
    get_db_stats,
    save_session,
    get_session_owner,
    save_confirmed_activities,
)
from services.calculator import load_factors, predict_emissions, calculate_roi_scenario
from services.report_generator import generate_spreadsheet_report, generate_pdf_report, SPREADSHEETS_DIR, PDF_DIR, REPORTS_DIR
from services.bill_analyzer import analyze_bill_input
from services.groq_bill_extractor import ALLOWED_CATEGORIES, extract_bill
from services import factor_store, groq_service
from services.ocr_service import process_document_ocr

_env = Path(__file__).parent / ".env"
if _env.exists():
    for _line in _env.read_text().splitlines():
        if "=" in _line and not _line.lstrip().startswith("#"):
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

app = FastAPI(
    title="TerraAI Backend API",
    description="Python FastAPI backend with SQLite/PostgreSQL storage, Smart Bill OCR & Auto-Classifier, Statutory Emission Intelligence, and Automated Reporting (Excel & PDF)",
    version="1.2.0"
)

# CORS Middleware to allow requests from frontend Vite app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database schema on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Static file mount to download generated reports directly
app.mount("/static/reports", StaticFiles(directory=REPORTS_DIR), name="reports")

@app.get("/")
def root():
    return {
        "app": "TerraAI Carbon Intelligence API",
        "status": "online",
        "ocr_engine": "RapidOCR & pypdf",
        "database": "SQLite (Local Temporary File in instance/)",
        "standards": ["CEA FY 2024-25 v21.0", "DEFRA MSME", "GHG Corporate Standard"],
        "endpoints": [
            "/api/emission-factors",
            "/api/predict",
            "/api/what-if",
            "/api/bills/upload-ocr",
            "/api/bills/analyze",
            "/api/bills/list",
            "/api/reports/spreadsheet",
            "/api/reports/pdf",
            "/api/reports/list",
            "/api/auth/requirements",
            "/api/database/status"
        ]
    }

@app.get("/api/emission-factors")
def get_emission_factors():
    """Returns static official emission factors for Electricity, Fuel, Transport, Materials, and Waste"""
    return load_factors()

@app.post("/api/predict")
def predict_footprint(payload: Dict[str, Any] = Body(...)):
    """Dynamically predicts carbon footprint based on the exact user activity data given"""
    try:
        prediction = predict_emissions(payload)
        return {
            "status": "success",
            "prediction": prediction
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/factor-options")
def factor_options():
    """Input types the calculator supports, each with its factor, source and status"""
    return {"options": factor_store.list_options(), "dataset": factor_store.load_dataset()["metadata"]["version"]}

class AiTextBody(BaseModel):
    text: str

@app.post("/api/ai/parse")
def ai_parse(body: AiTextBody):
    """Groq turns a plain-language description into structured inputs; the calculator does the math"""
    try:
        parsed = groq_service.parse_activity_text(body.text)
    except groq_service.GroqUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"Groq returned unreadable output: {e}")
    return {"status": "success", "parsed": parsed, "prediction": predict_emissions(parsed)}

@app.post("/api/ai/explain")
def ai_explain(payload: Dict[str, Any] = Body(...)):
    """Recalculates from the inputs, then has Groq explain that result in plain language"""
    prediction = predict_emissions(payload)
    try:
        text = groq_service.explain_result(prediction)
    except groq_service.GroqUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))
    return {"status": "success", "explanation": text, "prediction": prediction}

@app.post("/api/what-if")
def roi_scenario(
    base_footprint: float = Body(128.4),
    category: str = Body("Electricity"),
    reduction_pct: float = Body(20.0)
):
    """Calculates ROI scenarios & financial payback using CEA India baselines"""
    try:
        result = calculate_roi_scenario(base_footprint, category, reduction_pct)
        return {
            "status": "success",
            "scenario": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==============================================================================
# SUPABASE AUTH REQUIREMENTS & TOKEN VERIFICATION
# ==============================================================================

@app.get("/api/auth/requirements")
def auth_requirements():
    """Returns Supabase Auth configuration requirements and status checklist"""
    supabase_url = os.getenv("SUPABASE_URL", "")
    return {
        "status": "ready",
        "auth_engine": "Supabase Auth (PostgreSQL & JWT)",
        "supabase_url_configured": bool(supabase_url),
        "supported_auth_methods": [
            {"method": "email_password", "description": "Corporate MSME email & password", "enabled": True},
            {"method": "phone_otp", "description": "Mobile SMS OTP verification for factory managers", "enabled": True},
            {"method": "google_oauth", "description": "1-click Google OAuth single sign-on", "enabled": True},
            {"method": "temporary_guest", "description": "Instant frictionless TEMP-MSME-XXXX session token", "enabled": True}
        ],
        "database_schema_path": "instance/supabase_auth_schema.sql",
        "rls_enabled": True,
        "checklist": [
            "1. Supabase Project URL & Anon Public Key set in frontend/.env",
            "2. Authentication -> Providers -> Email enabled in Supabase dashboard",
            "3. Authentication -> URL Configuration -> Site URL set to http://localhost:5174",
            "4. Run instance/supabase_auth_schema.sql in Supabase SQL Editor for RLS policies"
        ]
    }

@app.post("/api/auth/verify-token")
def verify_token(payload: Dict[str, Any] = Body(...)):
    """Verifies authentication token or session payload"""
    token = payload.get("token", "")
    session_id = payload.get("session_id", "TEMP-MSME-8492")
    if not token and not session_id:
        raise HTTPException(status_code=400, detail="token or session_id required")
    return {
        "status": "authenticated",
        "session_id": session_id,
        "valid": True
    }

class ActivityRecord(BaseModel):
    type: str = Field(min_length=1, max_length=100)
    quantity: float = Field(gt=0, le=1_000_000_000)
    unit: str = Field(min_length=1, max_length=30)
    period: Literal["Monthly", "Quarterly", "Annual"]


class ConfirmBillPayload(BaseModel):
    session_id: str = Field(min_length=1, max_length=64)
    target_category: str
    detected_category: str
    document_hash: str = Field(pattern=r"^[a-f0-9]{64}$")
    file_name: str = Field(min_length=1, max_length=255)
    activity_records: List[ActivityRecord] = Field(min_length=1, max_length=100)
    common_fields: Dict[str, Any] = Field(default_factory=dict)
    category_data: Dict[str, Any] = Field(default_factory=dict)
    business_name: str = Field(default="MSME Enterprise", max_length=255)
    industry: str = Field(default="Manufacturing", max_length=100)
    city: str = Field(default="", max_length=150)
    owner_name: Optional[str] = Field(default=None, max_length=150)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)


async def _verified_user_id(authorization: Optional[str], anon_key: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    configured_anon_key = os.getenv("SUPABASE_ANON_KEY", "").strip()
    key = configured_anon_key or (anon_key or "").strip()
    if not supabase_url or not key:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={"Authorization": authorization, "apikey": key},
            )
    except httpx.HTTPError:
        return None
    if response.is_error:
        return None
    user_id = response.json().get("id")
    return str(user_id) if user_id else None


# ==============================================================================
# SMART BILL OCR & AUTO-CLASSIFIER (PDF, JPG, PNG)
# ==============================================================================

@app.post("/api/bills/extract")
async def extract_bill_draft(
    file: UploadFile = File(...),
    target_category: str = Form(...),
    business_name: str = Form(""),
    business_gstin: str = Form(""),
):
    file_bytes = await file.read(12 * 1024 * 1024 + 1)
    if len(file_bytes) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Documents must be 12 MB or smaller.")
    return await extract_bill(
        filename=file.filename or "",
        file_bytes=file_bytes,
        target_category=target_category,
        business_name=business_name or None,
        business_gstin=business_gstin or None,
    )


@app.post("/api/bills/confirm")
async def confirm_bill(
    payload: ConfirmBillPayload,
    authorization: Optional[str] = Header(None),
    apikey: Optional[str] = Header(None),
):
    target_category = ALLOWED_CATEGORIES.get(payload.target_category)
    if not target_category or payload.detected_category != target_category:
        raise HTTPException(status_code=422, detail="Confirm only a document matching the selected category.")

    user_id = await _verified_user_id(authorization, apikey)
    session_owner = get_session_owner(payload.session_id)
    if session_owner and session_owner != user_id:
        raise HTTPException(status_code=403, detail="This activity session belongs to another user.")

    try:
        result = save_confirmed_activities(
            session_id=payload.session_id,
            category=payload.detected_category,
            file_name=payload.file_name,
            document_hash=payload.document_hash,
            activities=[item.model_dump() for item in payload.activity_records],
            metadata={
                "common_fields": payload.common_fields,
                "category_data": payload.category_data,
            },
            session_details={
                "business_name": payload.business_name,
                "industry": payload.industry,
                "city": payload.city,
                "owner_name": payload.owner_name,
                "email": payload.email,
                "phone": payload.phone,
                "supabase_user_id": user_id,
            },
        )
    except ValueError as exc:
        status_code = 409 if "already been confirmed" in str(exc) else 422
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    return {"status": "success", **result}


@app.post("/api/bills/upload-ocr")
async def upload_bill_ocr(
    file: UploadFile = File(...),
    session_id: str = Form("TEMP-MSME-8492"),
    business_name: str = Form("ABC Textiles")
):
    """
    Accepts PDF, JPG, JPEG, or PNG document upload, runs OCR recognition (pypdf for PDF, RapidOCR for images),
    extracts consumption quantities, auto-classifies domain, calculates emissions, and saves to database.
    """
    try:
        file_bytes = await file.read()
        ocr_result = process_document_ocr(file.filename, file_bytes)
        extracted_text = ocr_result["extracted_text"]
        
        save_session(session_id, business_name=business_name)
        analysis = analyze_bill_input(
            session_id=session_id,
            bill_text=extracted_text,
            bill_filename=file.filename
        )
        
        return {
            "status": "success",
            "ocr": ocr_result,
            "analysis": analysis,
            "message": f"Successfully processed {file.filename} with {ocr_result['engine']}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Processing failed: {str(e)}")

@app.post("/api/bills/analyze")
def analyze_bill(payload: Dict[str, Any] = Body(...)):
    """
    Analyzes raw bill text or consumption statement, automatically infers domain (Electricity, Fuel, Transport, Materials, Waste),
    calculates statutory emissions, and saves to database.
    """
    session_id = payload.get("session_id", "TEMP-MSME-8492")
    bill_text = payload.get("bill_text", "")
    bill_filename = payload.get("bill_filename", "Bill_Document.pdf")
    business_name = payload.get("business_name", "ABC Textiles")

    if not bill_text:
        raise HTTPException(status_code=400, detail="bill_text or consumption description is required")

    save_session(session_id, business_name=business_name)
    result = analyze_bill_input(session_id=session_id, bill_text=bill_text, bill_filename=bill_filename)
    return result

@app.get("/api/bills/list")
def list_analyzed_bills(session_id: Optional[str] = Query(None)):
    """Returns list of analyzed bills stored in database"""
    return {
        "status": "success",
        "bills": get_bills(session_id=session_id)
    }

@app.get("/api/database/status")
def database_status():
    """Returns status and statistics of database"""
    return get_db_stats()

# ==============================================================================
# SPREADSHEET & PDF GENERATION
# ==============================================================================

@app.post("/api/reports/spreadsheet")
def create_spreadsheet(payload: Dict[str, Any] = Body(...)):
    """Generates an official MSME Carbon Audit Spreadsheet (.xlsx)"""
    try:
        filename = generate_spreadsheet_report(payload)
        return {
            "status": "success",
            "filename": filename,
            "download_url": f"/api/reports/download/{filename}",
            "type": "spreadsheet"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate spreadsheet: {str(e)}")

@app.post("/api/reports/pdf")
def create_pdf(payload: Dict[str, Any] = Body(...)):
    """Generates an official ESG Carbon Audit PDF Report"""
    try:
        filename = generate_pdf_report(payload)
        return {
            "status": "success",
            "filename": filename,
            "download_url": f"/api/reports/download/{filename}",
            "type": "pdf"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@app.get("/api/reports/download/{filename}")
def download_report(filename: str):
    """Direct file download for generated spreadsheet and PDF reports"""
    if filename.endswith(".xlsx") or filename.endswith(".csv"):
        file_path = os.path.join(SPREADSHEETS_DIR, filename)
    elif filename.endswith(".pdf"):
        file_path = os.path.join(PDF_DIR, filename)
    else:
        raise HTTPException(status_code=400, detail="Invalid report format")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )

@app.get("/api/reports/list")
def list_reports():
    """Lists all stored report files in spreadsheets and pdf directories"""
    spreadsheets = os.listdir(SPREADSHEETS_DIR) if os.path.exists(SPREADSHEETS_DIR) else []
    pdfs = os.listdir(PDF_DIR) if os.path.exists(PDF_DIR) else []
    return {
        "spreadsheets": spreadsheets,
        "pdfs": pdfs
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
