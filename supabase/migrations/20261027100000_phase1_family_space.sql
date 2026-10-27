-- Med: Phase 1 (Family Space) Database Migration
-- Version 1.0 (2026-10-27)
-- Sets up Family Space tables, RLS policies, helper functions, and private storage bucket.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. Tables Creation
-- ==============================================================================

-- 1. Families
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'عائلتي',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- 2. Family Members (Manager vs Viewer)
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_family_user UNIQUE(family_id, user_id)
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 3. People (Adults & Children in a Family)
CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    blood_type TEXT NOT NULL DEFAULT 'unknown' CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),
    allergies TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    chronic_conditions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    phone_number TEXT,
    linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- 4. Emergency Contacts (Per Person)
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- 5. Viewer Grants (Granular Read-Only Access)
CREATE TABLE IF NOT EXISTS public.viewer_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.viewer_grants ENABLE ROW LEVEL SECURITY;

-- 6. Consents (User Legal & Medical Disclaimer Acceptance)
CREATE TABLE IF NOT EXISTS public.consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'terms_and_disclaimer',
    version TEXT NOT NULL DEFAULT '1.0',
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_agent TEXT,
    ip_hash TEXT,
    CONSTRAINT uq_user_consent_type UNIQUE(user_id, type)
);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- 7. Audit Log (Append-Only, NO health data in metadata)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'person',
    entity_id TEXT,
    family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
    person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Add family_id and person_id columns if audit_log was pre-created in previous migration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_log' AND column_name='family_id') THEN
        ALTER TABLE public.audit_log ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_log' AND column_name='person_id') THEN
        ALTER TABLE public.audit_log ADD COLUMN person_id UUID REFERENCES public.people(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_people_family ON public.people(family_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_viewer_grants_active ON public.viewer_grants(family_member_id, person_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_family ON public.audit_log(family_id, created_at DESC);

-- ==============================================================================
-- 2. Helper Functions (SECURITY DEFINER with strict search_path)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_family_manager(f_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = f_id
          AND user_id = auth.uid()
          AND role = 'manager'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_family_member(f_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = f_id
          AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.has_active_viewer_grant(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.viewer_grants vg
        JOIN public.family_members fm ON fm.id = vg.family_member_id
        WHERE vg.person_id = p_id
          AND fm.user_id = auth.uid()
          AND fm.role = 'viewer'
          AND vg.expires_at > timezone('utc'::text, now())
          AND vg.revoked_at IS NULL
    );
$$;

-- ==============================================================================
-- 3. Row Level Security Policies
-- ==============================================================================

-- Families
CREATE POLICY "Family members can view their family"
    ON public.families FOR SELECT
    USING (public.is_family_member(id));

CREATE POLICY "Authenticated users can create a family"
    ON public.families FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Family managers can update their family"
    ON public.families FOR UPDATE
    USING (public.is_family_manager(id))
    WITH CHECK (public.is_family_manager(id));

CREATE POLICY "Family managers can delete their family"
    ON public.families FOR DELETE
    USING (public.is_family_manager(id));

-- Family Members
CREATE POLICY "Members can view family member list"
    ON public.family_members FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Managers or creating user can insert family member"
    ON public.family_members FOR INSERT
    WITH CHECK (
        public.is_family_manager(family_id) 
        OR (user_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.family_members WHERE family_id = family_members.family_id))
    );

CREATE POLICY "Managers can update family members"
    ON public.family_members FOR UPDATE
    USING (public.is_family_manager(family_id))
    WITH CHECK (public.is_family_manager(family_id));

CREATE POLICY "Managers can remove family members"
    ON public.family_members FOR DELETE
    USING (public.is_family_manager(family_id));

-- People
CREATE POLICY "Managers and granted viewers can select people"
    ON public.people FOR SELECT
    USING (
        public.is_family_manager(family_id)
        OR public.has_active_viewer_grant(id)
    );

CREATE POLICY "Family managers can insert people"
    ON public.people FOR INSERT
    WITH CHECK (public.is_family_manager(family_id));

CREATE POLICY "Family managers can update people"
    ON public.people FOR UPDATE
    USING (public.is_family_manager(family_id))
    WITH CHECK (public.is_family_manager(family_id));

CREATE POLICY "Family managers can delete people"
    ON public.people FOR DELETE
    USING (public.is_family_manager(family_id));

-- Emergency Contacts
CREATE POLICY "People viewable contacts are selectable"
    ON public.emergency_contacts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.people p
            WHERE p.id = emergency_contacts.person_id
              AND (public.is_family_manager(p.family_id) OR public.has_active_viewer_grant(p.id))
        )
    );

CREATE POLICY "Managers can insert emergency contacts"
    ON public.emergency_contacts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.people p
            WHERE p.id = emergency_contacts.person_id
              AND public.is_family_manager(p.family_id)
        )
    );

CREATE POLICY "Managers can update emergency contacts"
    ON public.emergency_contacts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.people p
            WHERE p.id = emergency_contacts.person_id
              AND public.is_family_manager(p.family_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.people p
            WHERE p.id = emergency_contacts.person_id
              AND public.is_family_manager(p.family_id)
        )
    );

CREATE POLICY "Managers can delete emergency contacts"
    ON public.emergency_contacts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.people p
            WHERE p.id = emergency_contacts.person_id
              AND public.is_family_manager(p.family_id)
        )
    );

-- Viewer Grants
CREATE POLICY "Viewable grants for own member or manager"
    ON public.viewer_grants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.id = viewer_grants.family_member_id
              AND (fm.user_id = auth.uid() OR public.is_family_manager(fm.family_id))
        )
    );

CREATE POLICY "Managers can manage viewer grants"
    ON public.viewer_grants FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.id = viewer_grants.family_member_id
              AND public.is_family_manager(fm.family_id)
        )
    );

CREATE POLICY "Managers can update viewer grants"
    ON public.viewer_grants FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.id = viewer_grants.family_member_id
              AND public.is_family_manager(fm.family_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.id = viewer_grants.family_member_id
              AND public.is_family_manager(fm.family_id)
        )
    );

CREATE POLICY "Managers can delete viewer grants"
    ON public.viewer_grants FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.id = viewer_grants.family_member_id
              AND public.is_family_manager(fm.family_id)
        )
    );

-- Consents
CREATE POLICY "Users can view own consents"
    ON public.consents FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own consents"
    ON public.consents FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Audit Log (Strictly Append-Only)
CREATE POLICY "Actors and managers can view audit log"
    ON public.audit_log FOR SELECT
    USING (
        actor_id = auth.uid()
        OR (family_id IS NOT NULL AND public.is_family_manager(family_id))
    );

CREATE POLICY "Users can insert audit logs for own actions"
    ON public.audit_log FOR INSERT
    WITH CHECK (actor_id = auth.uid());

-- Trigger to forbid UPDATE and DELETE on audit_log
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Audit log entries are immutable and cannot be updated or deleted';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_family_audit_log_mutation ON public.audit_log;
CREATE TRIGGER trg_prevent_family_audit_log_mutation
BEFORE UPDATE OR DELETE ON public.audit_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- ==============================================================================
-- 4. Private Storage Bucket Setup (Signed URLs Only)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'family_documents_private',
    'family_documents_private',
    FALSE,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = FALSE;
