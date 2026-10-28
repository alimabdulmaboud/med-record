-- Med: Phase 3 (Secure Medical Document Vault) Database Migration
-- Version 1.0 (2026-10-28)
-- Sets up person_documents table, indexes, and strict Row Level Security (RLS) policies.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. Table: Person Documents
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.person_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (
        document_type IN (
            'lab_result',
            'radiology',
            'prescription',
            'hospital_report',
            'vaccination_card'
        )
    ),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    doctor_name TEXT,
    facility_name TEXT,
    document_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Targeted indexes for fast document filtering and retrieval
CREATE INDEX IF NOT EXISTS idx_person_documents_person ON public.person_documents(person_id, document_date DESC);
CREATE INDEX IF NOT EXISTS idx_person_documents_family ON public.person_documents(family_id, document_date DESC);
CREATE INDEX IF NOT EXISTS idx_person_documents_type ON public.person_documents(person_id, document_type, document_date DESC);
CREATE INDEX IF NOT EXISTS idx_person_documents_active ON public.person_documents(person_id) WHERE archived_at IS NULL;

-- Enable Row Level Security (Default Deny)
ALTER TABLE public.person_documents ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Row Level Security Policies
-- ==============================================================================

-- Policy 1: SELECT
-- A user can select documents if they are a manager in the family OR have a valid, unexpired, unrevoked viewer grant on that person
CREATE POLICY "Users can read documents with manager role or active viewer grant"
    ON public.person_documents
    FOR SELECT
    USING (
        public.has_family_manager_role(family_id)
        OR public.has_person_viewer_access(person_id)
    );

-- Policy 2: INSERT
-- Only family managers can insert documents into their family
CREATE POLICY "Family managers can insert documents"
    ON public.person_documents
    FOR INSERT
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 3: UPDATE
-- Only family managers can update or soft-delete documents in their family
CREATE POLICY "Family managers can update documents"
    ON public.person_documents
    FOR UPDATE
    USING (
        public.has_family_manager_role(family_id)
    )
    WITH CHECK (
        public.has_family_manager_role(family_id)
    );

-- Policy 4: DELETE (Reserved for complete account erasure)
CREATE POLICY "Family managers can delete documents"
    ON public.person_documents
    FOR DELETE
    USING (
        public.has_family_manager_role(family_id)
    );
