import os
import sqlite3
import datetime
import json
from typing import Dict, Any, List, Optional

# Locate the instance directory (both root/instance and backend/instance supported)
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
INSTANCE_DIR = os.path.join(PROJECT_ROOT, 'instance')
os.makedirs(INSTANCE_DIR, exist_ok=True)

# Default local DB path located inside the instance folder
SQLITE_DB_PATH = os.path.join(INSTANCE_DIR, 'terraai.db')

# Optional PostgreSQL Connection String from Environment
DATABASE_URL = os.getenv('DATABASE_URL')

def is_postgresql() -> bool:
    return bool(DATABASE_URL and DATABASE_URL.startswith(('postgresql://', 'postgres://')))

def get_connection():
    if is_postgresql():
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
        return conn
    else:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    if is_postgresql():
        schema_path = os.path.join(INSTANCE_DIR, 'schema_postgresql.sql')
        if os.path.exists(schema_path):
            with open(schema_path, 'r', encoding='utf-8') as f:
                ddl = f.read()
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(ddl)
            conn.commit()
            conn.close()
    else:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            supabase_user_id TEXT DEFAULT NULL,
            business_name TEXT DEFAULT 'ABC Textiles',
            industry TEXT DEFAULT 'Textiles',
            city TEXT DEFAULT 'Indore, Madhya Pradesh',
            employees INTEGER DEFAULT 50,
            reporting_period TEXT DEFAULT 'FY 2025-26',
            owner_name TEXT DEFAULT NULL,
            email TEXT DEFAULT NULL,
            phone TEXT DEFAULT NULL,
            created_at TEXT,
            updated_at TEXT
        )
        """)

        # Ensure all columns exist in existing table
        for col in [
            ("supabase_user_id", "TEXT"),
            ("owner_name", "TEXT"),
            ("email", "TEXT"),
            ("phone", "TEXT")
        ]:
            try:
                cursor.execute(f"ALTER TABLE sessions ADD COLUMN {col[0]} {col[1]} DEFAULT NULL")
            except Exception:
                pass  # Column already exists

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyzed_bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            bill_name TEXT,
            raw_text TEXT,
            detected_domain TEXT,
            detected_scope TEXT,
            quantity REAL,
            unit TEXT,
            emissions_tco2e REAL,
            statutory_factor REAL DEFAULT 0.71,
            explanation TEXT,
            reduction_tip TEXT,
            created_at TEXT
        )
        """)

        try:
            cursor.execute("ALTER TABLE analyzed_bills ADD COLUMN statutory_factor REAL DEFAULT 0.71")
        except Exception:
            pass

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            domain TEXT,
            activity_type TEXT,
            amount REAL,
            unit TEXT,
            period TEXT,
            source_type TEXT,
            tco2e REAL,
            updated_at TEXT,
            document_hash TEXT,
            document_metadata TEXT
        )
        """)

        for col in [
            ("activity_type", "TEXT"),
            ("document_hash", "TEXT"),
            ("document_metadata", "TEXT")
        ]:
            try:
                cursor.execute(f"ALTER TABLE activity_entries ADD COLUMN {col[0]} {col[1]} DEFAULT NULL")
            except Exception:
                pass

        cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_document_hash
        ON activity_entries(session_id, document_hash)
        WHERE document_hash IS NOT NULL
        """)

        conn.commit()
        conn.close()

def _upsert_session(cursor, session_id, business_name, industry, city, owner_name, email, phone, supabase_user_id):
    now = datetime.datetime.now().isoformat()
    if is_postgresql():
        cursor.execute("""
        INSERT INTO sessions (
            session_id, supabase_user_id, business_name, industry, city, owner_name, email, phone, created_at, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT(session_id) DO UPDATE SET
            supabase_user_id=COALESCE(EXCLUDED.supabase_user_id, sessions.supabase_user_id),
            business_name=EXCLUDED.business_name,
            industry=EXCLUDED.industry,
            city=EXCLUDED.city,
            owner_name=COALESCE(EXCLUDED.owner_name, sessions.owner_name),
            email=COALESCE(EXCLUDED.email, sessions.email),
            phone=COALESCE(EXCLUDED.phone, sessions.phone),
            updated_at=EXCLUDED.updated_at
        """, (session_id, supabase_user_id, business_name, industry, city, owner_name, email, phone, now, now))
    else:
        cursor.execute("""
        INSERT INTO sessions (
            session_id, supabase_user_id, business_name, industry, city, owner_name, email, phone, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
            supabase_user_id=COALESCE(excluded.supabase_user_id, sessions.supabase_user_id),
            business_name=excluded.business_name,
            industry=excluded.industry,
            city=excluded.city,
            owner_name=COALESCE(excluded.owner_name, sessions.owner_name),
            email=COALESCE(excluded.email, sessions.email),
            phone=COALESCE(excluded.phone, sessions.phone),
            updated_at=excluded.updated_at
        """, (session_id, supabase_user_id, business_name, industry, city, owner_name, email, phone, now, now))

def save_session(
    session_id: str,
    business_name: str = 'ABC Textiles',
    industry: str = 'Textiles',
    city: str = 'Indore, Madhya Pradesh',
    owner_name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    supabase_user_id: Optional[str] = None
):
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    _upsert_session(
        cursor, session_id, business_name, industry, city, owner_name, email, phone, supabase_user_id
    )
    conn.commit()
    conn.close()

def save_analyzed_bill(
    session_id: str,
    bill_name: str,
    raw_text: str,
    detected_domain: str,
    detected_scope: str,
    quantity: float,
    unit: str,
    emissions_tco2e: float,
    statutory_factor: float = 0.7100,
    explanation: str = "",
    reduction_tip: str = ""
) -> int:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.datetime.now().isoformat()

    if is_postgresql():
        cursor.execute("""
        INSERT INTO analyzed_bills (
            session_id, bill_name, raw_text, detected_domain, detected_scope,
            quantity, unit, emissions_tco2e, statutory_factor, explanation, reduction_tip, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """, (
            session_id, bill_name, raw_text, detected_domain, detected_scope,
            quantity, unit, emissions_tco2e, statutory_factor, explanation, reduction_tip, now
        ))
        bill_id = cursor.fetchone()['id']
    else:
        cursor.execute("""
        INSERT INTO analyzed_bills (
            session_id, bill_name, raw_text, detected_domain, detected_scope,
            quantity, unit, emissions_tco2e, statutory_factor, explanation, reduction_tip, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id, bill_name, raw_text, detected_domain, detected_scope,
            quantity, unit, emissions_tco2e, statutory_factor, explanation, reduction_tip, now
        ))
        bill_id = cursor.lastrowid

    conn.commit()
    conn.close()
    return bill_id

def get_bills(session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    if session_id:
        if is_postgresql():
            cursor.execute("SELECT * FROM analyzed_bills WHERE session_id = %s ORDER BY id DESC", (session_id,))
        else:
            cursor.execute("SELECT * FROM analyzed_bills WHERE session_id = ? ORDER BY id DESC", (session_id,))
    else:
        cursor.execute("SELECT * FROM analyzed_bills ORDER BY id DESC LIMIT 50")
    
    rows = cursor.fetchall()
    bills = [dict(r) for r in rows]
    conn.close()
    return bills

def get_db_stats() -> Dict[str, Any]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS total_bills FROM analyzed_bills")
    total_bills = cursor.fetchone()[0 if not is_postgresql() else 'total_bills']
    cursor.execute("SELECT COUNT(*) AS total_sessions FROM sessions")
    total_sessions = cursor.fetchone()[0 if not is_postgresql() else 'total_sessions']
    conn.close()
    return {
        "engine": "PostgreSQL" if is_postgresql() else "SQLite (Local File in instance/)",
        "db_location": "DATABASE_URL" if is_postgresql() else SQLITE_DB_PATH,
        "total_bills_analyzed": total_bills,
        "total_sessions": total_sessions
    }


def get_session_owner(session_id: str) -> Optional[str]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    placeholder = "%s" if is_postgresql() else "?"
    cursor.execute(
        f"SELECT supabase_user_id FROM sessions WHERE session_id = {placeholder}",
        (session_id,)
    )
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return row["supabase_user_id"] if is_postgresql() else row["supabase_user_id"]


def save_confirmed_activities(
    session_id: str,
    category: str,
    file_name: str,
    document_hash: str,
    activities: List[Dict[str, Any]],
    metadata: Dict[str, Any],
    session_details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if not activities:
        raise ValueError("At least one valid activity record is required.")

    factors_path = os.path.join(os.path.dirname(__file__), "data", "factors.json")
    with open(factors_path, "r", encoding="utf-8") as factors_file:
        factors = json.load(factors_file)

    domain_keys = {
        "Electricity": "electricity",
        "Fuel": "fuels",
        "Transport": "transport",
        "Raw material purchase": "materials",
        "Waste": "waste"
    }
    domain_key = domain_keys[category]
    inserted = []
    conn = get_connection()
    placeholder = "%s" if is_postgresql() else "?"
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT id FROM activity_entries WHERE session_id = {placeholder} AND document_hash = {placeholder}",
            (session_id, document_hash)
        )
        existing = cursor.fetchone()
        if existing:
            raise ValueError("This document has already been confirmed.")

        if session_details is not None:
            _upsert_session(
                cursor,
                session_id,
                session_details["business_name"],
                session_details["industry"],
                session_details["city"],
                session_details["owner_name"],
                session_details["email"],
                session_details["phone"],
                session_details["supabase_user_id"],
            )

        for index, item in enumerate(activities):
            quantity = float(item["quantity"])
            unit = str(item["unit"])
            activity_type = str(item["type"])
            period = str(item["period"])
            conversion = 1000.0 if unit.lower() in ("tonne", "tonnes", "mt") else 1.0
            quantity_for_factor = quantity * conversion

            if category == "Electricity":
                if unit.lower() not in ("kwh", "mwh"):
                    raise ValueError("Electricity activity must use kWh or MWh.")
                if unit.lower() == "mwh":
                    quantity_for_factor *= 1000.0
                factor = factors["electricity"]["india_grid"]["factor"]
            elif category == "Fuel":
                fuel_key = next(
                    (key for key in factors["fuels"] if key.lower() == activity_type.lower()),
                    None
                )
                if fuel_key is None:
                    raise ValueError(f"No configured emission factor for fuel type '{activity_type}'.")
                allowed_units = {
                    "Diesel": ("litre", "litres", "l"),
                    "Petrol": ("litre", "litres", "l"),
                    "LPG": ("kg", "kgs"),
                    "Natural Gas": ("m3", "m³"),
                    "Coal": ("kg", "kgs"),
                }
                if unit.lower() not in allowed_units[fuel_key]:
                    raise ValueError(f"{fuel_key} quantity must be converted to {allowed_units[fuel_key][0]} before saving.")
                factor = factors["fuels"][fuel_key]["factor"]
            elif category == "Transport":
                if unit.lower() not in ("km", "kms"):
                    raise ValueError("Transport distance must use km.")
                vehicle_key = next(
                    (key for key in factors["transport"] if key.lower() == activity_type.lower()),
                    None
                )
                if vehicle_key is None:
                    vehicle_name = activity_type.lower()
                    if "heavy" in vehicle_name or "truck" in vehicle_name or "hcv" in vehicle_name:
                        vehicle_key = "Heavy Commercial Vehicle"
                    elif "three wheeler" in vehicle_name or "3 wheeler" in vehicle_name or "auto rickshaw" in vehicle_name:
                        vehicle_key = "Three Wheeler Goods"
                    elif "light commercial" in vehicle_name or "lcv" in vehicle_name:
                        vehicle_key = "Light Commercial Vehicle"
                if vehicle_key is None:
                    raise ValueError(f"No configured emission factor matches vehicle type '{activity_type}'.")
                factor = factors["transport"][vehicle_key]["factor"]
            else:
                if unit.lower() not in ("kg", "kgs", "tonne", "tonnes", "mt"):
                    raise ValueError("Materials and waste activity quantities must use kg or tonnes.")
                category_factors = factors[domain_key]
                factor_entry = next(
                    (value for key, value in category_factors.items() if key.lower() in activity_type.lower()),
                    None
                )
                if factor_entry is None:
                    factor_entry = next(
                        (value for key, value in category_factors.items() if activity_type.lower() in key.lower()),
                        None
                    )
                if factor_entry is None:
                    raise ValueError(f"No configured emission factor matches '{activity_type}'. Please choose a supported type.")
                factor = factor_entry["factor"]

            emissions = quantity_for_factor * factor / 1000.0
            document_metadata = json.dumps(metadata, ensure_ascii=False) if index == 0 else None
            row_document_hash = document_hash if index == 0 else None
            if is_postgresql():
                cursor.execute("""
                    INSERT INTO activity_entries (
                        session_id, domain, activity_type, quantity, unit, period,
                        source_type, emissions_tco2e, document_attachment_name,
                        is_verified, document_hash, document_metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, %s, %s)
                    RETURNING id
                """, (
                    session_id, category, activity_type, quantity, unit, period,
                    "Actual (from confirmed bill)", emissions, file_name,
                    row_document_hash, document_metadata
                ))
                inserted.append(cursor.fetchone()["id"])
            else:
                cursor.execute("""
                    INSERT INTO activity_entries (
                        session_id, domain, activity_type, amount, unit, period,
                        source_type, tco2e, updated_at, document_hash, document_metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id, category, activity_type, quantity, unit, period,
                    "Actual (from confirmed bill)", emissions,
                    datetime.datetime.now().isoformat(), row_document_hash, document_metadata
                ))
                inserted.append(cursor.lastrowid)
        conn.commit()
    except ValueError:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        if "unique" in str(exc).lower() or "duplicate" in str(exc).lower():
            raise ValueError("This document has already been confirmed.") from exc
        raise
    finally:
        conn.close()
    return {"activity_ids": inserted, "duplicate": False}
