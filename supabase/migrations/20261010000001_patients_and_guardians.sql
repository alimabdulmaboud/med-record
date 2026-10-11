-- ==============================================================================
-- Med SaaS Migration: 20261010000001_patients_and_guardians.sql
-- Description: Patients, Guardians, Patient-Guardian links, and RLS policies
-- ==============================================================================

-- 1. Patients Table (Demographics; no login accounts)
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(clinic_id, name);

-- 2. Guardians Table (Phone is NOT unique, shared by siblings)
CREATE TABLE IF NOT EXISTS public.guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relation_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_guardians_clinic_phone ON public.guardians(clinic_id, phone);
CREATE INDEX IF NOT EXISTS idx_guardians_clinic_name ON public.guardians(clinic_id, name);

-- 3. Patient Guardians Join Table (Links patients to one or more guardians)
CREATE TABLE IF NOT EXISTS public.patient_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE RESTRICT,
    relationship TEXT NOT NULL DEFAULT 'parent',
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_patient_guardian UNIQUE (patient_id, guardian_id)
);

CREATE INDEX IF NOT EXISTS idx_pg_patient ON public.patient_guardians(patient_id);
CREATE INDEX IF NOT EXISTS idx_pg_guardian ON public.patient_guardians(guardian_id);

-- ==============================================================================
-- 4. Enable Row Level Security (RLS) on all 3 tables (Default Deny)
-- ==============================================================================

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_guardians ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. RLS Policies (Tenant Isolation & Staff Access)
-- ==============================================================================

-- ---- PATIENTS POLICIES ----
-- SELECT: Staff of the clinic can see patients belonging to their clinic
CREATE POLICY "patients_select_policy" ON public.patients
FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
);

-- INSERT: Staff of the clinic (owner, doctor, receptionist)
CREATE POLICY "patients_insert_policy" ON public.patients
FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
);

-- UPDATE: Staff of the clinic
CREATE POLICY "patients_update_policy" ON public.patients
FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
);

-- ---- GUARDIANS POLICIES ----
CREATE POLICY "guardians_select_policy" ON public.guardians
FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
);

CREATE POLICY "guardians_insert_policy" ON public.guardians
FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
);

CREATE POLICY "guardians_update_policy" ON public.guardians
FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
);

-- ---- PATIENT_GUARDIANS POLICIES ----
CREATE POLICY "patient_guardians_select_policy" ON public.patient_guardians
FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
);

CREATE POLICY "patient_guardians_insert_policy" ON public.patient_guardians
FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
);

CREATE POLICY "patient_guardians_update_policy" ON public.patient_guardians
FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
);

CREATE POLICY "patient_guardians_delete_policy" ON public.patient_guardians
FOR DELETE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
);
