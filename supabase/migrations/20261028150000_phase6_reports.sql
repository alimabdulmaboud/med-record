-- Med: Phase 6 (Bilingual Doctor Report Generator & Expiring Share Links) Database Migration
-- Version 1.0 (2026-10-28)
-- Sets up doctor_reports and report_shares tables, indexes, and strict Row Level Security (RLS) policies.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. Table: Doctor Reports (Compiled IPS Bundles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.doctor_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary_notes TEXT,
    date_range_from DATE NOT NULL,
    date_range_to DATE NOT NULL,
    included_sections TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    report_data JSONB NOT NULL,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Targeted indexes for doctor reports
CREATE INDEX IF NOT EXISTS idx_doctor_reports_person ON public.doctor_reports(person_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_reports_family ON public.doctor_reports(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_reports_active ON public.doctor_reports(person_id) WHERE archived_at IS NULL;

-- Enable Row Level Security (Default Deny)
ALTER TABLE public.doctor_reports ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Table: Report Shares (72-Hour Expiring Access Tokens)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES public.doctor_reports(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    pin_hash TEXT,
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Targeted indexes for share lookups
CREATE INDEX IF NOT EXISTS idx_report_shares_token ON public.report_shares(access_token);
CREATE INDEX IF NOT EXISTS idx_report_shares_report ON public.report_shares(report_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_family ON public.report_shares(family_id);

-- Enable Row Level Security (Default Deny)
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. Row Level Security Policies for Doctor Reports
-- ==============================================================================

-- Policy 1: SELECT
CREATE POLICY "Users can read doctor reports with manager role or active viewer grant"
    ON public.doctor_reports
    FOR SELECT
    USING (
        public.has_family_manager_role(family_id)
        OR public.has_person_viewer_access(person_id)
    );

-- Policy 2: INSERT
CREATE POLICY "Managers can insert doctor reports"
    ON public.doctor_reports
    FOR INSERT
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 3: UPDATE
CREATE POLICY "Managers can update doctor reports"
    ON public.doctor_reports
    FOR UPDATE
    USING (
        public.has_family_manager_role(family_id)
    )
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 4: DELETE
CREATE POLICY "Managers can delete doctor reports"
    ON public.doctor_reports
    FOR DELETE
    USING (
        public.has_family_manager_role(family_id)
    );

-- ==============================================================================
-- 4. Row Level Security Policies for Report Shares
-- ==============================================================================

-- Policy 1: SELECT (Manager can inspect their shares, or token bearer if unrevoked and not expired)
CREATE POLICY "Users can read report shares with manager role or active token"
    ON public.report_shares
    FOR SELECT
    USING (
        public.has_family_manager_role(family_id)
        OR (is_revoked = false AND expires_at > timezone('utc'::text, now()))
    );

-- Policy 2: INSERT
CREATE POLICY "Managers can insert report shares"
    ON public.report_shares
    FOR INSERT
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 3: UPDATE (Revocation or access count)
CREATE POLICY "Managers can update report shares"
    ON public.report_shares
    FOR UPDATE
    USING (
        public.has_family_manager_role(family_id)
    )
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 4: DELETE
CREATE POLICY "Managers can delete report shares"
    ON public.report_shares
    FOR DELETE
    USING (
        public.has_family_manager_role(family_id)
    );
