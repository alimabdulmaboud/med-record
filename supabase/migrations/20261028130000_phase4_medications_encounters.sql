-- Med: Phase 4 (Medications Regimen & Doctor Visits Journal) Database Migration
-- Version 1.0 (2026-10-28)
-- Sets up person_medications and person_encounters tables, indexes, and strict Row Level Security (RLS) policies.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. Table: Person Medications
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.person_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dose TEXT NOT NULL,
    frequency TEXT NOT NULL,
    timing_notes TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    reminder_enabled BOOLEAN NOT NULL DEFAULT false,
    reminder_time TEXT, -- HH:MM (24-hour)
    prescribed_by TEXT,
    notes TEXT,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Targeted indexes for fast medication lookups
CREATE INDEX IF NOT EXISTS idx_person_medications_person ON public.person_medications(person_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_person_medications_family ON public.person_medications(family_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_person_medications_status ON public.person_medications(person_id, status);
CREATE INDEX IF NOT EXISTS idx_person_medications_active ON public.person_medications(person_id) WHERE archived_at IS NULL;

-- Enable Row Level Security (Default Deny)
ALTER TABLE public.person_medications ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Table: Person Encounters (Doctor Visits Journal)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.person_encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    facility_name TEXT,
    chief_complaint TEXT,
    diagnosis TEXT,
    notes TEXT,
    follow_up_date DATE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Targeted indexes for encounters lookups
CREATE INDEX IF NOT EXISTS idx_person_encounters_person ON public.person_encounters(person_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_person_encounters_family ON public.person_encounters(family_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_person_encounters_followup ON public.person_encounters(person_id, follow_up_date DESC);
CREATE INDEX IF NOT EXISTS idx_person_encounters_active ON public.person_encounters(person_id) WHERE archived_at IS NULL;

-- Enable Row Level Security (Default Deny)
ALTER TABLE public.person_encounters ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. Row Level Security Policies for Person Medications
-- ==============================================================================

-- Policy 1: SELECT
CREATE POLICY "Users can read medications with manager role or active viewer grant"
    ON public.person_medications
    FOR SELECT
    USING (
        public.has_family_manager_role(family_id)
        OR public.has_person_viewer_access(person_id)
    );

-- Policy 2: INSERT
CREATE POLICY "Managers can insert medications"
    ON public.person_medications
    FOR INSERT
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 3: UPDATE
CREATE POLICY "Managers can update medications"
    ON public.person_medications
    FOR UPDATE
    USING (
        public.has_family_manager_role(family_id)
    )
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 4: DELETE (hard delete restricted, preference is soft-delete via archived_at)
CREATE POLICY "Managers can delete medications"
    ON public.person_medications
    FOR DELETE
    USING (
        public.has_family_manager_role(family_id)
    );

-- ==============================================================================
-- 4. Row Level Security Policies for Person Encounters
-- ==============================================================================

-- Policy 1: SELECT
CREATE POLICY "Users can read encounters with manager role or active viewer grant"
    ON public.person_encounters
    FOR SELECT
    USING (
        public.has_family_manager_role(family_id)
        OR public.has_person_viewer_access(person_id)
    );

-- Policy 2: INSERT
CREATE POLICY "Managers can insert encounters"
    ON public.person_encounters
    FOR INSERT
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 3: UPDATE
CREATE POLICY "Managers can update encounters"
    ON public.person_encounters
    FOR UPDATE
    USING (
        public.has_family_manager_role(family_id)
    )
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 4: DELETE
CREATE POLICY "Managers can delete encounters"
    ON public.person_encounters
    FOR DELETE
    USING (
        public.has_family_manager_role(family_id)
    );
