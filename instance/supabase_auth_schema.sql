-- ==============================================================================
-- TerraAI — Supabase Auth & PostgreSQL Row Level Security (RLS) Schema
-- Location: instance/supabase_auth_schema.sql
-- Compatible with: Supabase Cloud PostgreSQL, Local Supabase CLI, and Vanilla PostgreSQL
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. PUBLIC PROFILES TABLE (Linked directly to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    company_name VARCHAR(255) DEFAULT 'MSME Enterprise',
    industry VARCHAR(100) DEFAULT 'Manufacturing',
    city VARCHAR(150) DEFAULT 'Indore, Madhya Pradesh',
    reporting_period VARCHAR(50) DEFAULT 'FY 2025-26',
    active_temp_id VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ------------------------------------------------------------------------------
-- 3. AUTOMATIC PROFILE CREATION TRIGGER ON SUPABASE SIGNUP
-- ------------------------------------------------------------------------------
-- When a user registers via Email/Password, Phone OTP, or Google OAuth,
-- this trigger automatically provisions their profile in public.profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        company_name,
        active_temp_id,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'MSME Enterprise'),
        COALESCE(NEW.raw_user_meta_data->>'temp_id', NULL),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. LINK SESSIONS TABLE TO SUPABASE AUTH USERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) UNIQUE NOT NULL,
    supabase_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    business_name VARCHAR(255) NOT NULL DEFAULT 'MSME Unit',
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

CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_supabase_uid ON public.sessions(supabase_user_id);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Enable RLS on Sessions (Allows authenticated users to manage their data, and anon guest sessions)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users manage their own sessions"
    ON public.sessions FOR ALL
    TO authenticated
    USING (supabase_user_id = auth.uid() OR supabase_user_id IS NULL)
    WITH CHECK (supabase_user_id = auth.uid() OR supabase_user_id IS NULL);

CREATE POLICY "Anonymous users manage temporary guest sessions"
    ON public.sessions FOR ALL
    TO anon
    USING (session_id LIKE 'TEMP-%')
    WITH CHECK (session_id LIKE 'TEMP-%');

-- Enable RLS on Statutory Emission Factors (Read-only for all, write for service_role)
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of statutory emission factors"
    ON public.emission_factors FOR SELECT
    TO anon, authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 6. GRANT PERMISSIONS
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.emission_factors TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.sessions TO anon, authenticated;
