-- ==============================================================================
-- Med SaaS Migration: 20261010000000_security_foundation.sql
-- Description: Core tenancy, RBAC, RLS policies, audit log, and security functions
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clinics Table
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
    settings JSONB NOT NULL DEFAULT '{
        "arrive_before_minutes": 15,
        "skip_alert_minutes": 60,
        "urgent_enabled": false,
        "urgent_fee_multiplier": 3,
        "consultation_prices": {
            "new": 300,
            "follow_up": 150,
            "quick_consult": 100
        },
        "enabled_modules": []
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID
);

-- 3. Profiles Table (Extends auth.users, belongs to a clinic; NULL for platform_admin)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID
);

-- 4. User Roles Table (Supports multi-role in the same clinic)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE RESTRICT,
    role TEXT NOT NULL CHECK (role IN ('platform_admin', 'clinic_owner', 'doctor', 'receptionist')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure a user cannot have duplicate role entries within the same clinic
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_clinic_role ON public.user_roles (user_id, COALESCE(clinic_id, '00000000-0000-0000-0000-000000000000'::uuid), role);

-- 5. Invitations Table (Invitation-only auth, Rule 4)
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    roles TEXT[] NOT NULL DEFAULT '{}',
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Audit Log Table (Append-only, Rule 6)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE RESTRICT,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    before_state JSONB,
    after_state JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookup on audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_clinic ON public.audit_log(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_id, created_at DESC);

-- ==============================================================================
-- 7. SQL Helper Functions (SECURITY DEFINER with strict search_path)
-- ==============================================================================

-- Helper: Get current caller's clinic_id from profile
CREATE OR REPLACE FUNCTION public.current_clinic_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Helper: Check if caller is platform_admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
          AND role = 'platform_admin'
    );
$$;

-- Helper: Check if caller has a specific role for their clinic
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = required_role
          AND (ur.clinic_id IS NULL OR ur.clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()))
    );
$$;

-- Trigger Function: Enforce Append-Only on audit_log (No UPDATE or DELETE)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only. UPDATE and DELETE operations are strictly forbidden.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_mutation ON public.audit_log;
CREATE TRIGGER trg_prevent_audit_log_mutation
BEFORE UPDATE OR DELETE ON public.audit_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- ==============================================================================
-- 8. Enable Row Level Security (RLS) on all tables (Default Deny)
-- ==============================================================================

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 9. RLS Policies
-- ==============================================================================

-- ---- CLINICS POLICIES ----
-- SELECT: platform_admin can see all; clinic members see their own clinic
CREATE POLICY "clinics_select_policy" ON public.clinics
FOR SELECT TO authenticated
USING (
    public.is_platform_admin() 
    OR id = public.current_clinic_id()
);

-- INSERT: platform_admin only
CREATE POLICY "clinics_insert_policy" ON public.clinics
FOR INSERT TO authenticated
WITH CHECK (
    public.is_platform_admin()
);

-- UPDATE: platform_admin OR clinic_owner for their own clinic
CREATE POLICY "clinics_update_policy" ON public.clinics
FOR UPDATE TO authenticated
USING (
    public.is_platform_admin() 
    OR (id = public.current_clinic_id() AND public.has_role('clinic_owner'))
)
WITH CHECK (
    public.is_platform_admin() 
    OR (id = public.current_clinic_id() AND public.has_role('clinic_owner'))
);

-- ---- PROFILES POLICIES ----
-- SELECT: platform_admin can see all; users see profiles in their own clinic
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
    public.is_platform_admin() 
    OR clinic_id = public.current_clinic_id()
);

-- INSERT: platform_admin OR self (during invite acceptance)
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
    public.is_platform_admin() 
    OR id = auth.uid()
);

-- UPDATE: platform_admin, self, or clinic_owner managing staff
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (
    public.is_platform_admin() 
    OR id = auth.uid()
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
)
WITH CHECK (
    public.is_platform_admin() 
    OR id = auth.uid()
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
);

-- ---- USER_ROLES POLICIES ----
-- SELECT: platform_admin sees all; clinic members see roles in their own clinic
CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (
    public.is_platform_admin() 
    OR clinic_id = public.current_clinic_id()
);

-- INSERT: platform_admin OR clinic_owner in their own clinic
CREATE POLICY "user_roles_insert_policy" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
    public.is_platform_admin() 
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
);

-- UPDATE: platform_admin OR clinic_owner in their own clinic
CREATE POLICY "user_roles_update_policy" ON public.user_roles
FOR UPDATE TO authenticated
USING (
    public.is_platform_admin() 
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
)
WITH CHECK (
    public.is_platform_admin() 
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
);

-- DELETE: platform_admin OR clinic_owner in their own clinic
CREATE POLICY "user_roles_delete_policy" ON public.user_roles
FOR DELETE TO authenticated
USING (
    public.is_platform_admin() 
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
);

-- ---- INVITATIONS POLICIES ----
-- SELECT: platform_admin OR clinic staff in same clinic
CREATE POLICY "invitations_select_policy" ON public.invitations
FOR SELECT TO authenticated
USING (
    public.is_platform_admin() 
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
);

-- INSERT: platform_admin OR clinic_owner
CREATE POLICY "invitations_insert_policy" ON public.invitations
FOR INSERT TO authenticated
WITH CHECK (
    public.is_platform_admin() 
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
);

-- UPDATE: platform_admin OR clinic_owner
CREATE POLICY "invitations_update_policy" ON public.invitations
FOR UPDATE TO authenticated
USING (
    public.is_platform_admin() 
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
)
WITH CHECK (
    public.is_platform_admin() 
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
);

-- ---- AUDIT_LOG POLICIES ----
-- SELECT: platform_admin sees all; clinic_owner sees their clinic's audit log
CREATE POLICY "audit_log_select_policy" ON public.audit_log
FOR SELECT TO authenticated
USING (
    public.is_platform_admin() 
    OR (clinic_id = public.current_clinic_id() AND public.has_role('clinic_owner'))
);

-- INSERT: Any authenticated user can append audit entries
CREATE POLICY "audit_log_insert_policy" ON public.audit_log
FOR INSERT TO authenticated
WITH CHECK (
    actor_id = auth.uid()
);

-- UPDATE and DELETE: NO POLICIES EXIST -> Default Deny applies.
