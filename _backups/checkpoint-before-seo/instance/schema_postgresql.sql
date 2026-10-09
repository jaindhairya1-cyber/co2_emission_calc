-- ==============================================================================
-- TerraAI — PostgreSQL Database Schema
-- Language: PostgreSQL (PL/pgSQL / SQL DDL)
-- Location: instance/schema_postgresql.sql
-- ==============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. SESSIONS TABLE (Temporary & Guest MSME Profiles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) UNIQUE NOT NULL,
    supabase_user_id UUID DEFAULT NULL,
    business_name VARCHAR(255) NOT NULL DEFAULT 'ABC Textiles',
    industry VARCHAR(100) NOT NULL DEFAULT 'Textiles',
    city VARCHAR(150) NOT NULL DEFAULT 'Indore, Madhya Pradesh',
    employees INTEGER NOT NULL DEFAULT 50,
    reporting_period VARCHAR(50) NOT NULL DEFAULT 'FY 2025-26',
    owner_name VARCHAR(150) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_supabase_uid ON sessions(supabase_user_id);

-- ------------------------------------------------------------------------------
-- 2. STATUTORY EMISSION FACTORS TABLE (CEA India, IPCC & DEFRA Standards)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emission_factors (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(50) NOT NULL,       -- 'electricity', 'fuel', 'transport', 'materials', 'waste'
    category_name VARCHAR(150) NOT NULL,
    factor_value NUMERIC(10, 4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    scope VARCHAR(50) NOT NULL,        -- 'Scope 1', 'Scope 2', 'Scope 3'
    statutory_standard VARCHAR(255) NOT NULL,
    avg_unit_cost_inr NUMERIC(10, 2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_factors_domain ON emission_factors(domain);

-- ------------------------------------------------------------------------------
-- 3. ANALYZED BILLS TABLE (Smart Auto-Classification of Invoices & Statements)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analyzed_bills (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    bill_name VARCHAR(255) NOT NULL,
    raw_text TEXT NOT NULL,
    detected_domain VARCHAR(50) NOT NULL,  -- 'Electricity', 'Fuel', 'Transport', 'Materials', 'Waste'
    detected_scope VARCHAR(50) NOT NULL,   -- 'Scope 1', 'Scope 2', 'Scope 3'
    quantity NUMERIC(14, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    emissions_tco2e NUMERIC(12, 4) NOT NULL,
    statutory_factor NUMERIC(10, 4) NOT NULL,
    explanation TEXT NOT NULL,
    reduction_tip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_session FOREIGN KEY (session_id) 
        REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analyzed_bills_session ON analyzed_bills(session_id);
CREATE INDEX IF NOT EXISTS idx_analyzed_bills_domain ON analyzed_bills(detected_domain);

-- ------------------------------------------------------------------------------
-- 4. ACTIVITY ENTRIES TABLE (Granular MSME Operational Logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_entries (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    domain VARCHAR(50) NOT NULL,           -- 'Electricity', 'Fuel', 'Transport', 'Materials', 'Waste'
    activity_type VARCHAR(100) NOT NULL,   -- 'Grid Power', 'Diesel DG', 'Freight LCV', etc.
    quantity NUMERIC(14, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    period VARCHAR(50) NOT NULL DEFAULT 'Monthly', -- 'Monthly', 'Quarterly', 'Annual'
    source_type VARCHAR(100) NOT NULL DEFAULT 'Actual (from bill)',
    emissions_tco2e NUMERIC(12, 4) NOT NULL,
    document_attachment_name VARCHAR(255) DEFAULT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_session FOREIGN KEY (session_id) 
        REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_session ON activity_entries(session_id);

-- ------------------------------------------------------------------------------
-- 5. DECARBONIZATION ACTIONS TABLE (Applied Roadmap & ROI Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reduction_actions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    action_key VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,         -- 'High priority', 'Medium priority'
    co2_reduced_tco2e NUMERIC(10, 2) NOT NULL,
    annual_saving_inr NUMERIC(12, 2) NOT NULL,
    investment_inr NUMERIC(12, 2) NOT NULL,
    payback_years NUMERIC(6, 2) NOT NULL,
    is_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT fk_action_session FOREIGN KEY (session_id) 
        REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_actions_session ON reduction_actions(session_id);

-- ==============================================================================
-- INITIAL STATUTORY SEEDS (CEA India, IPCC & DEFRA)
-- ==============================================================================
INSERT INTO emission_factors (domain, category_name, factor_value, unit, scope, statutory_standard, avg_unit_cost_inr)
VALUES 
    ('electricity', 'Grid electricity (India)', 0.7100, 'kg CO₂e/kWh', 'Scope 2', 'CEA (Central Electricity Authority, FY 2024-25, v21.0)', 8.50),
    ('electricity', 'Captive Solar / Green Tariff', 0.0450, 'kg CO₂e/kWh', 'Scope 2', 'NREL / CEA LCA Standard', 4.20),
    ('fuel', 'Diesel (High Speed / DG Sets)', 2.6870, 'kg CO₂e/L', 'Scope 1', 'IPCC / MoPNG India', 92.50),
    ('fuel', 'Petrol / Motor Spirit', 2.3140, 'kg CO₂e/L', 'Scope 1', 'GHG Corporate Protocol', 104.00),
    ('fuel', 'LPG (Commercial / Industrial)', 1.5120, 'kg CO₂e/kg', 'Scope 1', 'MoPNG / IPCC', 85.00),
    ('transport', 'Light Commercial Delivery Van (LCV)', 0.2850, 'kg CO₂e/km', 'Scope 3', 'ARAI / DEFRA LCV Factor', NULL),
    ('transport', 'Heavy Duty Freight Diesel Truck', 0.8920, 'kg CO₂e/km', 'Scope 3', 'ARAI / DEFRA Freight Truck', NULL),
    ('materials', 'Structural & Sheet Steel', 1.8200, 'kg CO₂e/kg', 'Scope 3', 'WorldSteel Association LCA 2024', NULL),
    ('materials', 'Cotton yarn & woven textiles', 3.5400, 'kg CO₂e/kg', 'Scope 3', 'Textile Exchange MSME Standard', NULL),
    ('waste', 'General Landfill Waste', 0.5800, 'kg CO₂e/kg', 'Scope 3', 'CPCB (Central Pollution Control Board)', NULL)
ON CONFLICT DO NOTHING;
