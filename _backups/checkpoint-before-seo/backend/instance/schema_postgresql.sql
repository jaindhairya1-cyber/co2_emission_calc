-- ==============================================================================
-- TerraAI — PostgreSQL Database Schema
-- Language: PostgreSQL (PL/pgSQL / SQL DDL)
-- Location: backend/instance/schema_postgresql.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE TABLE IF NOT EXISTS emission_factors (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(50) NOT NULL,
    category_name VARCHAR(150) NOT NULL,
    factor_value NUMERIC(10, 4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    scope VARCHAR(50) NOT NULL,
    statutory_standard VARCHAR(255) NOT NULL,
    avg_unit_cost_inr NUMERIC(10, 2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_factors_domain ON emission_factors(domain);

CREATE TABLE IF NOT EXISTS analyzed_bills (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    bill_name VARCHAR(255) NOT NULL,
    raw_text TEXT NOT NULL,
    detected_domain VARCHAR(50) NOT NULL,
    detected_scope VARCHAR(50) NOT NULL,
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

CREATE TABLE IF NOT EXISTS activity_entries (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    quantity NUMERIC(14, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    period VARCHAR(50) NOT NULL DEFAULT 'Monthly',
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

CREATE TABLE IF NOT EXISTS reduction_actions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    action_key VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
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
