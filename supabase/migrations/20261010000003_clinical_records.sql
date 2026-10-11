-- ==============================================================================
-- Med SaaS Migration: 20261010000003_clinical_records.sql
-- Description: Core Clinical Records, Measurements, Allergies, Prescriptions,
--              Labs, Clinical Templates, and Strict Medical Privacy RLS
-- ==============================================================================

-- 1. Visits Table
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE SET NULL,
    visit_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    visit_type TEXT NOT NULL DEFAULT 'new' CHECK (visit_type IN ('new', 'follow_up', 'consultation')),
    chief_complaint TEXT NOT NULL,
    diagnosis TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_visits_clinic ON public.visits(clinic_id);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor ON public.visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON public.visits(clinic_id, visit_date);

-- 2. Measurements Table (Vital signs & physical metrics)
CREATE TABLE IF NOT EXISTS public.measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    weight_kg NUMERIC,
    height_cm NUMERIC,
    temperature_c NUMERIC,
    pulse_bpm NUMERIC,
    systolic_bp NUMERIC,
    diastolic_bp NUMERIC,
    oxygen_saturation NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_measurements_clinic ON public.measurements(clinic_id);
CREATE INDEX IF NOT EXISTS idx_measurements_patient ON public.measurements(patient_id);
CREATE INDEX IF NOT EXISTS idx_measurements_visit ON public.measurements(visit_id);

-- 3. Allergies Table (Prominently flagged clinical safety)
CREATE TABLE IF NOT EXISTS public.allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('mild', 'moderate', 'severe')),
    reaction TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_allergies_clinic ON public.allergies(clinic_id);
CREATE INDEX IF NOT EXISTS idx_allergies_patient ON public.allergies(patient_id);

-- 4. Medical History Table (Chronic conditions, surgical history)
CREATE TABLE IF NOT EXISTS public.medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    condition_type TEXT NOT NULL DEFAULT 'chronic' CHECK (condition_type IN ('chronic', 'past_illness', 'surgical', 'family')),
    diagnosed_date DATE,
    current_medication TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_med_history_clinic ON public.medical_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_med_history_patient ON public.medical_history(patient_id);

-- 5. Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic ON public.prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit ON public.prescriptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);

-- 6. Prescription Items Table (Verbatim doctor text: no auto-editing)
CREATE TABLE IF NOT EXISTS public.prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dose TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_presc_items_clinic ON public.prescription_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_presc_items_presc ON public.prescription_items(prescription_id);

-- 7. Lab Orders Table
CREATE TABLE IF NOT EXISTS public.lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    requested_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_clinic ON public.lab_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON public.lab_orders(patient_id);

-- 8. Lab Results Table
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    lab_order_id UUID REFERENCES public.lab_orders(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    result_value TEXT NOT NULL,
    unit TEXT,
    reference_range TEXT,
    result_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lab_results_clinic ON public.lab_results(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON public.lab_results(patient_id);

-- 9. Visit Notes Table
CREATE TABLE IF NOT EXISTS public.visit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    note_content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_visit_notes_clinic ON public.visit_notes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_visit_notes_visit ON public.visit_notes(visit_id);

-- 10. Clinical Templates Table (Saved visit and prescription templates, common diagnoses)
CREATE TABLE IF NOT EXISTS public.clinical_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('visit', 'prescription', 'diagnosis')),
    name TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_templates_clinic ON public.clinical_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_templates_doctor ON public.clinical_templates(doctor_id);

-- ==============================================================================
-- 11. Enable Row Level Security (RLS) on all 10 Clinical Tables (Default Deny)
-- ==============================================================================

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_templates ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 12. Strict Clinical RLS Policies: DOCTOR ONLY within same clinic.
-- Receptionists and Platform Admins have ZERO access policies (Strict Medical Privacy).
-- ==============================================================================

-- 12.1 Visits
CREATE POLICY "visits_doctor_select"
ON public.visits FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "visits_doctor_insert"
ON public.visits FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "visits_doctor_update"
ON public.visits FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- 12.2 Measurements
CREATE POLICY "measurements_doctor_select"
ON public.measurements FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "measurements_doctor_insert"
ON public.measurements FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "measurements_doctor_update"
ON public.measurements FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- 12.3 Allergies
CREATE POLICY "allergies_doctor_select"
ON public.allergies FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "allergies_doctor_insert"
ON public.allergies FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "allergies_doctor_update"
ON public.allergies FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- 12.4 Medical History
CREATE POLICY "medical_history_doctor_select"
ON public.medical_history FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "medical_history_doctor_insert"
ON public.medical_history FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "medical_history_doctor_update"
ON public.medical_history FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- 12.5 Prescriptions
CREATE POLICY "prescriptions_doctor_select"
ON public.prescriptions FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "prescriptions_doctor_insert"
ON public.prescriptions FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "prescriptions_doctor_update"
ON public.prescriptions FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- 12.6 Prescription Items
CREATE POLICY "prescription_items_doctor_select"
ON public.prescription_items FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "prescription_items_doctor_insert"
ON public.prescription_items FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- 12.7 Lab Orders
CREATE POLICY "lab_orders_doctor_select"
ON public.lab_orders FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "lab_orders_doctor_insert"
ON public.lab_orders FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- 12.8 Lab Results
CREATE POLICY "lab_results_doctor_select"
ON public.lab_results FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "lab_results_doctor_insert"
ON public.lab_results FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- 12.9 Visit Notes
CREATE POLICY "visit_notes_doctor_select"
ON public.visit_notes FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "visit_notes_doctor_insert"
ON public.visit_notes FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- 12.10 Clinical Templates
CREATE POLICY "clinical_templates_doctor_select"
ON public.clinical_templates FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "clinical_templates_doctor_insert"
ON public.clinical_templates FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "clinical_templates_doctor_update"
ON public.clinical_templates FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);
