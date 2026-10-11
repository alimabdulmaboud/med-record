-- ==============================================================================
-- Med SaaS Migration: 20261010000004_pediatrics_module.sql
-- Description: Pediatrics Module Schema (Birth History, Feeding History, 
--              Vaccine Templates & Records, Milestones, Pediatric Exams)
--              Strict Medical Privacy RLS (Doctor-Only, Tenant Isolated)
-- ==============================================================================

-- 1. Birth History Table
CREATE TABLE IF NOT EXISTS public.birth_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    gestational_age_weeks NUMERIC CHECK (gestational_age_weeks >= 20 AND gestational_age_weeks <= 45),
    delivery_type TEXT CHECK (delivery_type IN ('vaginal', 'c_section', 'assisted')),
    birth_weight_kg NUMERIC CHECK (birth_weight_kg > 0 AND birth_weight_kg < 10),
    birth_length_cm NUMERIC CHECK (birth_length_cm > 0 AND birth_length_cm < 100),
    birth_head_circumference_cm NUMERIC CHECK (birth_head_circumference_cm > 0 AND birth_head_circumference_cm < 60),
    apgar_score_1min INTEGER CHECK (apgar_score_1min >= 0 AND apgar_score_1min <= 10),
    apgar_score_5min INTEGER CHECK (apgar_score_5min >= 0 AND apgar_score_5min <= 10),
    nicu_stay BOOLEAN DEFAULT false,
    nicu_days INTEGER DEFAULT 0,
    complications TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_patient_birth_history UNIQUE (clinic_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_birth_history_clinic ON public.birth_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_birth_history_patient ON public.birth_history(patient_id);

-- 2. Feeding History Table
CREATE TABLE IF NOT EXISTS public.feeding_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    feeding_type TEXT CHECK (feeding_type IN ('exclusive_breastfeeding', 'formula', 'mixed', 'solids_weaned')),
    formula_name TEXT,
    solids_start_age_months NUMERIC CHECK (solids_start_age_months >= 0),
    vitamin_d_supplement BOOLEAN DEFAULT false,
    iron_supplement BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_patient_feeding_history UNIQUE (clinic_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_feeding_history_clinic ON public.feeding_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_feeding_history_patient ON public.feeding_history(patient_id);

-- 3. Vaccine Templates Table (Clinic-editable schedule template)
CREATE TABLE IF NOT EXISTS public.vaccine_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    vaccine_name TEXT NOT NULL,
    target_age_months NUMERIC NOT NULL CHECK (target_age_months >= 0),
    dose_number INTEGER NOT NULL DEFAULT 1 CHECK (dose_number >= 1),
    is_mandatory BOOLEAN DEFAULT true,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vaccine_templates_clinic ON public.vaccine_templates(clinic_id);

-- 4. Vaccinations Table (Patient administered records)
CREATE TABLE IF NOT EXISTS public.vaccinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    dose_number INTEGER NOT NULL DEFAULT 1 CHECK (dose_number >= 1),
    administered_date DATE,
    batch_number TEXT,
    site TEXT CHECK (site IN ('right_thigh', 'left_thigh', 'right_deltoid', 'left_deltoid', 'oral', 'intradermal')),
    administered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'administered' CHECK (status IN ('administered', 'scheduled', 'overdue', 'skipped')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vaccinations_clinic ON public.vaccinations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_patient ON public.vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_date ON public.vaccinations(clinic_id, administered_date);

-- 5. Milestones Table (Developmental milestones by age band)
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    milestone_key TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('gross_motor', 'fine_motor', 'speech_language', 'cognitive_social')),
    age_band TEXT NOT NULL,
    achieved BOOLEAN NOT NULL DEFAULT false,
    achieved_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_patient_milestone UNIQUE (clinic_id, patient_id, milestone_key)
);

CREATE INDEX IF NOT EXISTS idx_milestones_clinic ON public.milestones(clinic_id);
CREATE INDEX IF NOT EXISTS idx_milestones_patient ON public.milestones(patient_id);

-- 6. Pediatric Exams Table (Structured examination by body system)
CREATE TABLE IF NOT EXISTS public.pediatric_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    general_appearance TEXT,
    head_neck TEXT,
    cardiovascular TEXT,
    respiratory TEXT,
    abdomen TEXT,
    neurological TEXT,
    musculoskeletal TEXT,
    skin TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pediatric_exams_clinic ON public.pediatric_exams(clinic_id);
CREATE INDEX IF NOT EXISTS idx_pediatric_exams_patient ON public.pediatric_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_pediatric_exams_visit ON public.pediatric_exams(visit_id);

-- ==============================================================================
-- Row Level Security (RLS) - Universal Default Deny
-- ==============================================================================
ALTER TABLE public.birth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pediatric_exams ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Doctor Policies (Tenant-isolated, Doctor-only, Medical Privacy Non-negotiable Rule #2)
-- ------------------------------------------------------------------------------

-- Birth History
CREATE POLICY "birth_history_doctor_select"
ON public.birth_history FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "birth_history_doctor_insert"
ON public.birth_history FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "birth_history_doctor_update"
ON public.birth_history FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Feeding History
CREATE POLICY "feeding_history_doctor_select"
ON public.feeding_history FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "feeding_history_doctor_insert"
ON public.feeding_history FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "feeding_history_doctor_update"
ON public.feeding_history FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Vaccine Templates
CREATE POLICY "vaccine_templates_doctor_select"
ON public.vaccine_templates FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "vaccine_templates_doctor_insert"
ON public.vaccine_templates FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "vaccine_templates_doctor_update"
ON public.vaccine_templates FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Vaccinations
CREATE POLICY "vaccinations_doctor_select"
ON public.vaccinations FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "vaccinations_doctor_insert"
ON public.vaccinations FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "vaccinations_doctor_update"
ON public.vaccinations FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Milestones
CREATE POLICY "milestones_doctor_select"
ON public.milestones FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "milestones_doctor_insert"
ON public.milestones FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "milestones_doctor_update"
ON public.milestones FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Pediatric Exams
CREATE POLICY "pediatric_exams_doctor_select"
ON public.pediatric_exams FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "pediatric_exams_doctor_insert"
ON public.pediatric_exams FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "pediatric_exams_doctor_update"
ON public.pediatric_exams FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);
