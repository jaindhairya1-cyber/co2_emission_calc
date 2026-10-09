# TerraAI — Supabase Auth Requirements & Integration Guide

This document specifies the complete authentication requirements, environment variables, dashboard configuration, and database security rules for **Supabase Auth** in TerraAI.

---

## 1. Architecture Overview

TerraAI supports a **hybrid authentication model** designed specifically for Indian MSMEs:
1. **Authenticated Users (Supabase Auth)**:
   - **Email & Password**: Standard corporate/enterprise account with credentials.
   - **Mobile Phone OTP**: Quick MSME verification via SMS code.
   - **Google OAuth**: 1-click social sign-in.
   - User identity, tokens, and sessions are managed by Supabase Cloud (`@supabase/supabase-js`).
2. **Frictionless Guest Access (Temporary ID)**:
   - Instant guest token (`TEMP-MSME-XXXX`) allowing full access to calculation, domains, What-If simulation, and bill analysis without forced login.
   - 1-click account linking from Profile screen to persist carbon data across devices.

---

## 2. Environment Variables Setup

### Frontend (`frontend/.env`)
Create `frontend/.env` (or copy from `frontend/.env.example`):
```env
# Supabase Project URL (Dashboard -> Project Settings -> API)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anon Public API Key (Dashboard -> Project Settings -> API)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API URL
VITE_API_URL=http://127.0.0.1:8000
```

### In-App Credential Setup
If you run without `.env`, click the **Supabase Auth** badge in the top-right of **Screen 2 (Authentication)** or navigate to the Profile screen to enter your Supabase URL & Key directly in the UI modal. Credentials are saved locally in browser storage.

---

## 3. Supabase Dashboard Configuration Checklist

### Step 1: Enable Email Authentication
1. Go to **Authentication -> Providers -> Email** in your Supabase Dashboard.
2. Ensure **Enable Email provider** is turned **ON**.
3. *For Local/Testing*: Turn **Confirm email** **OFF** to allow instant sign-in without waiting for email verification link.
4. *For Production*: Turn **Confirm email** **ON** and configure custom SMTP or Supabase default email templates.

### Step 2: Configure Redirect URLs & Site URL
1. Go to **Authentication -> URL Configuration**.
2. Set **Site URL** to:
   ```
   http://localhost:5174
   ```
3. Add following **Redirect URLs**:
   ```
   http://localhost:5174/**
   http://localhost:5173/**
   http://127.0.0.1:5174/**
   http://127.0.0.1:5173/**
   ```

### Step 3: Enable Phone Auth (Optional / MSME OTP)
1. Go to **Authentication -> Providers -> Phone**.
2. Toggle **Enable Phone provider**.
3. Choose SMS Provider (e.g. Twilio, MessageBird, or Supabase Test Phone Numbers).
4. Add test phone numbers under **Authentication -> Phone Auth Test Numbers** (e.g., `+919876543210` with code `123456`) for zero-cost local testing.

### Step 4: Enable Google OAuth (Optional)
1. Go to **Authentication -> Providers -> Google**.
2. Enter your **Client ID** and **Client Secret** from Google Cloud Console.
3. In Google Cloud Console, add Supabase's callback URL:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`

---

## 4. PostgreSQL Database Schema & Row Level Security (RLS)

Execute the script located at `instance/supabase_auth_schema.sql` directly inside the **Supabase SQL Editor**:

```sql
-- 1. Profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    company_name VARCHAR(255) DEFAULT 'MSME Enterprise',
    active_temp_id VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Automatic trigger when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, active_temp_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'temp_id', NULL)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

---

## 5. Security & Privacy Guarantees

- **No Fake Profiles or Reviews**: Hardcoded mock customer testimonials, fake user personas ("Aman Jain"), and synthetic star reviews are completely eliminated.
- **Data Isolation**: Each user's activity entries, bills, and reduction plans are scoped to their Supabase `auth.uid()` or guest `session_id`.
- **JWT Protection**: All communication with Supabase uses cryptographic JSON Web Tokens signed by the project secret.
