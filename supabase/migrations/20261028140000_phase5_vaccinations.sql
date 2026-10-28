-- Med: Phase 5 (Childhood Vaccination Tracker - Egyptian MOH Schedule) Database Migration
-- Version 1.0 (2026-10-28)
-- Sets up person_vaccinations table, indexes, and strict Row Level Security (RLS) policies.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. Table: Person Vaccinations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.person_vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    vaccine_code TEXT NOT NULL,
    vaccine_name TEXT NOT NULL,
    target_disease TEXT NOT NULL,
    dose_number INTEGER NOT NULL DEFAULT 1,
    age_milestone_months INTEGER NOT NULL DEFAULT 0,
    scheduled_date DATE NOT NULL,
    administered_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'overdue')),
    batch_number TEXT,
    administered_by TEXT,
    notes TEXT,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Targeted indexes for fast vaccination lookups and tracking
CREATE INDEX IF NOT EXISTS idx_person_vaccinations_person ON public.person_vaccinations(person_id, scheduled_date ASC);
CREATE INDEX IF NOT EXISTS idx_person_vaccinations_family ON public.person_vaccinations(family_id, scheduled_date ASC);
CREATE INDEX IF NOT EXISTS idx_person_vaccinations_status ON public.person_vaccinations(person_id, status);
CREATE INDEX IF NOT EXISTS idx_person_vaccinations_code ON public.person_vaccinations(person_id, vaccine_code);
CREATE INDEX IF NOT EXISTS idx_person_vaccinations_active ON public.person_vaccinations(person_id) WHERE archived_at IS NULL;

-- Enable Row Level Security (Default Deny)
ALTER TABLE public.person_vaccinations ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Row Level Security Policies
-- ==============================================================================

-- Policy 1: SELECT
-- A user can read vaccinations if they are a manager in the family OR have a valid, unexpired, unrevoked viewer grant on that person
CREATE POLICY "Users can read vaccinations with manager role or active viewer grant"
    ON public.person_vaccinations
    FOR SELECT
    USING (
        public.has_family_manager_role(family_id)
        OR public.has_person_viewer_access(person_id)
    );

-- Policy 2: INSERT
-- Strictly restricted to family managers
CREATE POLICY "Managers can insert vaccinations"
    ON public.person_vaccinations
    FOR INSERT
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 3: UPDATE
-- Strictly restricted to family managers
CREATE POLICY "Managers can update vaccinations"
    ON public.person_vaccinations
    FOR UPDATE
    USING (
        public.has_family_manager_role(family_id)
    )
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 4: DELETE (hard delete restricted, soft-delete via archived_at is preferred)
CREATE POLICY "Managers can delete vaccinations"
    ON public.person_vaccinations
    FOR DELETE
    USING (
        public.has_family_manager_role(family_id)
    );
