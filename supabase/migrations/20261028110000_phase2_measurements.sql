-- Med: Phase 2 (Rapid Measurements & Interactive WHO Growth Engine) Database Migration
-- Version 1.0 (2026-10-28)
-- Sets up person_measurements table, indexes, and strict Row Level Security (RLS) policies.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. Table: Person Measurements
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.person_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    measurement_type TEXT NOT NULL CHECK (
        measurement_type IN (
            'blood_pressure',
            'blood_glucose',
            'heart_rate',
            'spo2',
            'temperature',
            'weight',
            'height',
            'head_circumference',
            'growth_entry'
        )
    ),
    values JSONB NOT NULL,
    unit TEXT NOT NULL,
    is_abnormal BOOLEAN NOT NULL DEFAULT FALSE,
    severity TEXT CHECK (severity IN ('normal', 'low', 'high', 'critical')),
    label_ar TEXT,
    label_en TEXT,
    normal_range TEXT,
    advice_ar TEXT,
    percentiles JSONB,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Targeted indexes for high-speed timeline retrieval and person/family queries
CREATE INDEX IF NOT EXISTS idx_person_measurements_person ON public.person_measurements(person_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_person_measurements_family ON public.person_measurements(family_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_person_measurements_type ON public.person_measurements(person_id, measurement_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_person_measurements_active ON public.person_measurements(person_id) WHERE archived_at IS NULL;

-- Enable Row Level Security (Default Deny)
ALTER TABLE public.person_measurements ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Row Level Security Policies
-- ==============================================================================

-- Policy 1: SELECT
-- A user can select measurements if they are a manager in the family OR have a valid, unexpired, unrevoked viewer grant on that person
CREATE POLICY "Users can read measurements with manager role or active viewer grant"
    ON public.person_measurements
    FOR SELECT
    USING (
        public.has_family_manager_role(family_id)
        OR public.has_person_viewer_access(person_id)
    );

-- Policy 2: INSERT
-- Only family managers can insert measurements into their family
CREATE POLICY "Family managers can insert measurements"
    ON public.person_measurements
    FOR INSERT
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 3: UPDATE
-- Only family managers can update/soft-delete measurements in their family
CREATE POLICY "Family managers can update measurements"
    ON public.person_measurements
    FOR UPDATE
    USING (
        public.has_family_manager_role(family_id)
    )
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 4: DELETE (Reserved for complete account erasure)
CREATE POLICY "Family managers can delete measurements"
    ON public.person_measurements
    FOR DELETE
    USING (
        public.has_family_manager_role(family_id)
    );
