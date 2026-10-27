-- Med Record (سجلي الطبي) Schema & Row Level Security Policies
-- Version 1.0 (2026-10-27)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Family Members (Parent / Children)
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relationship TEXT NOT NULL CHECK (relationship IN ('self', 'child', 'spouse', 'parent')),
    birth_date DATE NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    blood_type TEXT NOT NULL DEFAULT 'unknown' CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),
    is_primary BOOLEAN DEFAULT FALSE,
    avatar_color TEXT DEFAULT 'blue',
    allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
    chronic_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
    emergency_contacts JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own family members"
    ON public.family_members
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Vital Measurements
CREATE TABLE IF NOT EXISTS public.measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    measurement_type TEXT NOT NULL,
    values JSONB NOT NULL,
    unit TEXT NOT NULL,
    loinc_code TEXT,
    is_abnormal BOOLEAN DEFAULT FALSE,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their family measurements"
    ON public.measurements
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = measurements.member_id
            AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = measurements.member_id
            AND family_members.user_id = auth.uid()
        )
    );

-- 3. Pediatric Growth Measurements
CREATE TABLE IF NOT EXISTS public.growth_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    age_in_months NUMERIC(6, 2) NOT NULL,
    weight_kg NUMERIC(5, 2),
    height_cm NUMERIC(5, 2),
    head_circumference_cm NUMERIC(5, 2),
    weight_for_age_percentile NUMERIC(5, 2),
    height_for_age_percentile NUMERIC(5, 2),
    head_circumference_percentile NUMERIC(5, 2),
    bmi_for_age_percentile NUMERIC(5, 2),
    weight_for_age_zscore NUMERIC(5, 2),
    height_for_age_zscore NUMERIC(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage pediatric growth measurements"
    ON public.growth_measurements
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = growth_measurements.member_id
            AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = growth_measurements.member_id
            AND family_members.user_id = auth.uid()
        )
    );

-- 4. Medications
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dose TEXT NOT NULL,
    frequency TEXT NOT NULL,
    timing_notes TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    reminder_enabled BOOLEAN DEFAULT FALSE,
    reminder_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage family medications"
    ON public.medications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = medications.member_id
            AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = medications.member_id
            AND family_members.user_id = auth.uid()
        )
    );

-- 5. Medical Documents Vault
CREATE TABLE IF NOT EXISTS public.medical_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('lab_result', 'radiology', 'prescription', 'hospital_report', 'vaccination_card')),
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    document_date DATE NOT NULL,
    doctor_name TEXT,
    facility_name TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    extracted_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage family documents"
    ON public.medical_documents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = medical_documents.member_id
            AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = medical_documents.member_id
            AND family_members.user_id = auth.uid()
        )
    );

-- 6. Encounters / Doctor Visits
CREATE TABLE IF NOT EXISTS public.encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    facility_name TEXT,
    chief_complaint TEXT,
    diagnosis TEXT,
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage family encounters"
    ON public.encounters
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = encounters.member_id
            AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = encounters.member_id
            AND family_members.user_id = auth.uid()
        )
    );

-- 7. Vaccinations
CREATE TABLE IF NOT EXISTS public.vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    target_disease TEXT NOT NULL,
    dose_number INTEGER NOT NULL DEFAULT 1,
    scheduled_date DATE NOT NULL,
    administered_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'overdue')),
    batch_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage vaccinations"
    ON public.vaccinations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = vaccinations.member_id
            AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = vaccinations.member_id
            AND family_members.user_id = auth.uid()
        )
    );

-- 8. Doctor Reports
CREATE TABLE IF NOT EXISTS public.doctor_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    included_sections JSONB NOT NULL DEFAULT '["vitals", "medications", "allergies", "labs", "visits"]'::JSONB,
    snapshot_data JSONB NOT NULL,
    summary_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doctor_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage doctor reports"
    ON public.doctor_reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = doctor_reports.member_id
            AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.id = doctor_reports.member_id
            AND family_members.user_id = auth.uid()
        )
    );

-- 9. Shareable Read-Only Links
CREATE TABLE IF NOT EXISTS public.report_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.doctor_reports(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE,
    pin_hash TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage share links
CREATE POLICY "Users can manage their report shares"
    ON public.report_shares
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.doctor_reports
            JOIN public.family_members ON family_members.id = doctor_reports.member_id
            WHERE doctor_reports.id = report_shares.report_id
            AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.doctor_reports
            JOIN public.family_members ON family_members.id = doctor_reports.member_id
            WHERE doctor_reports.id = report_shares.report_id
            AND family_members.user_id = auth.uid()
        )
    );

-- Public read access for valid, non-expired, non-revoked tokens
CREATE POLICY "Public can view valid active shares"
    ON public.report_shares
    FOR SELECT
    USING (
        is_revoked = FALSE
        AND expires_at > NOW()
    );

-- 10. Audit Log for Security & Report Views
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);
