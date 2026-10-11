-- ==============================================================================
-- Med SaaS Migration: 20261010000005_nutrition_module.sql
-- Description: Nutrition Module Schema (Initial Assessment, Anthropometry,
--              Body Composition, Energy Plans, Diet History, Meal Plans, Templates)
--              Strict Medical Privacy RLS (Doctor-Only, Tenant Isolated)
-- ==============================================================================

-- 1. Nutrition Assessments Table (Initial assessment & sensitive eating disorder flag)
CREATE TABLE IF NOT EXISTS public.nutrition_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    primary_goal TEXT NOT NULL CHECK (primary_goal IN ('weight_loss', 'weight_gain', 'muscle_building', 'diabetes_management', 'hypertension', 'pregnancy_lactation', 'gi_disorders', 'sports_nutrition', 'general_wellness')),
    weight_history TEXT,
    previous_diets TEXT,
    lifestyle_sleep_hours NUMERIC,
    lifestyle_activity_level TEXT CHECK (lifestyle_activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'extra_active')),
    lifestyle_work_nature TEXT,
    lifestyle_smoking TEXT CHECK (lifestyle_smoking IN ('non_smoker', 'smoker', 'ex_smoker')),
    sensitive_eating_disorder_flag BOOLEAN NOT NULL DEFAULT false,
    clinical_conditions_notes TEXT,
    supplements_medications TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_patient_nutrition_assessment UNIQUE (clinic_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_assessments_clinic ON public.nutrition_assessments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_assessments_patient ON public.nutrition_assessments(patient_id);

-- 2. Anthropometry Table (Circumferences & Body Measurements)
CREATE TABLE IF NOT EXISTS public.anthropometry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    weight_kg NUMERIC NOT NULL,
    height_cm NUMERIC NOT NULL,
    bmi NUMERIC,
    waist_cm NUMERIC,
    hip_cm NUMERIC,
    waist_hip_ratio NUMERIC,
    arm_circ_cm NUMERIC,
    neck_circ_cm NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_anthropometry_clinic ON public.anthropometry(clinic_id);
CREATE INDEX IF NOT EXISTS idx_anthropometry_patient ON public.anthropometry(patient_id);
CREATE INDEX IF NOT EXISTS idx_anthropometry_visit ON public.anthropometry(visit_id);

-- 3. Body Composition Table (InBody / Bioimpedance manual entry)
CREATE TABLE IF NOT EXISTS public.body_composition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    body_fat_pct NUMERIC CHECK (body_fat_pct >= 0 AND body_fat_pct <= 100),
    muscle_mass_kg NUMERIC CHECK (muscle_mass_kg >= 0),
    body_water_pct NUMERIC CHECK (body_water_pct >= 0 AND body_water_pct <= 100),
    visceral_fat_level NUMERIC CHECK (visceral_fat_level >= 0),
    bmr_device_kcal NUMERIC CHECK (bmr_device_kcal >= 0),
    device_report_attachment TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_body_comp_clinic ON public.body_composition(clinic_id);
CREATE INDEX IF NOT EXISTS idx_body_comp_patient ON public.body_composition(patient_id);
CREATE INDEX IF NOT EXISTS idx_body_comp_visit ON public.body_composition(visit_id);

-- 4. Energy Plans Table (BMR, TDEE, Calorie Target, Macro Split)
CREATE TABLE IF NOT EXISTS public.energy_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    bmr_formula TEXT NOT NULL DEFAULT 'mifflin_st_jeor' CHECK (bmr_formula IN ('mifflin_st_jeor', 'harris_benedict', 'katch_mcardle')),
    bmr_calculated NUMERIC NOT NULL,
    activity_factor NUMERIC NOT NULL DEFAULT 1.2,
    tdee_kcal NUMERIC NOT NULL,
    target_calories NUMERIC NOT NULL,
    protein_pct NUMERIC NOT NULL,
    carbs_pct NUMERIC NOT NULL,
    fats_pct NUMERIC NOT NULL,
    protein_g NUMERIC NOT NULL,
    carbs_g NUMERIC NOT NULL,
    fats_g NUMERIC NOT NULL,
    water_liters NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_energy_plans_clinic ON public.energy_plans(clinic_id);
CREATE INDEX IF NOT EXISTS idx_energy_plans_patient ON public.energy_plans(patient_id);

-- 5. Diet History Table (24-hour recall & eating habits)
CREATE TABLE IF NOT EXISTS public.diet_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    recall_type TEXT NOT NULL DEFAULT 'typical_day' CHECK (recall_type IN ('24_hour_recall', 'typical_day')),
    meals_per_day INTEGER DEFAULT 3,
    snacks_per_day INTEGER DEFAULT 1,
    caffeine_cups_daily NUMERIC DEFAULT 1,
    eating_out_freq TEXT,
    disliked_foods TEXT,
    food_allergies TEXT,
    recall_content JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_patient_diet_history UNIQUE (clinic_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_diet_history_clinic ON public.diet_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_diet_history_patient ON public.diet_history(patient_id);

-- 6. Meal Plans Table (Active and historical meal plans)
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    plan_name TEXT NOT NULL,
    target_calories NUMERIC,
    meals JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_clinic ON public.meal_plans(clinic_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_patient ON public.meal_plans(patient_id);

-- 7. Meal Plan Templates Table (Clinic-reusable meal plan templates)
CREATE TABLE IF NOT EXISTS public.meal_plan_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    template_name TEXT NOT NULL,
    category TEXT,
    target_calories NUMERIC NOT NULL,
    meals JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_clinic ON public.meal_plan_templates(clinic_id);

-- ==============================================================================
-- Row Level Security (RLS) - Universal Default Deny
-- ==============================================================================
ALTER TABLE public.nutrition_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anthropometry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_composition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_templates ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Doctor Policies (Tenant-isolated, Doctor-only, Medical Privacy Non-negotiable Rule #2)
-- ------------------------------------------------------------------------------

-- Nutrition Assessments
CREATE POLICY "nutrition_assessments_doctor_select"
ON public.nutrition_assessments FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "nutrition_assessments_doctor_insert"
ON public.nutrition_assessments FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "nutrition_assessments_doctor_update"
ON public.nutrition_assessments FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Anthropometry
CREATE POLICY "anthropometry_doctor_select"
ON public.anthropometry FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "anthropometry_doctor_insert"
ON public.anthropometry FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "anthropometry_doctor_update"
ON public.anthropometry FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Body Composition
CREATE POLICY "body_composition_doctor_select"
ON public.body_composition FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "body_composition_doctor_insert"
ON public.body_composition FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "body_composition_doctor_update"
ON public.body_composition FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Energy Plans
CREATE POLICY "energy_plans_doctor_select"
ON public.energy_plans FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "energy_plans_doctor_insert"
ON public.energy_plans FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "energy_plans_doctor_update"
ON public.energy_plans FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Diet History
CREATE POLICY "diet_history_doctor_select"
ON public.diet_history FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "diet_history_doctor_insert"
ON public.diet_history FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "diet_history_doctor_update"
ON public.diet_history FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Meal Plans
CREATE POLICY "meal_plans_doctor_select"
ON public.meal_plans FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "meal_plans_doctor_insert"
ON public.meal_plans FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "meal_plans_doctor_update"
ON public.meal_plans FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

-- Meal Plan Templates
CREATE POLICY "meal_plan_templates_doctor_select"
ON public.meal_plan_templates FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
    AND archived_at IS NULL
);

CREATE POLICY "meal_plan_templates_doctor_insert"
ON public.meal_plan_templates FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);

CREATE POLICY "meal_plan_templates_doctor_update"
ON public.meal_plan_templates FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND public.has_role('doctor')
);
