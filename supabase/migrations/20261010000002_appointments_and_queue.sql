-- ==============================================================================
-- Med SaaS Migration: 20261010000002_appointments_and_queue.sql
-- Description: Appointments, Live Queue Entries, and Append-Only Queue Events
-- ==============================================================================

-- 1. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(clinic_id, scheduled_time);

-- 2. Queue Entries Table
CREATE TABLE IF NOT EXISTS public.queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    called_time TIMESTAMPTZ,
    consultation_start_time TIMESTAMPTZ,
    completed_time TIMESTAMPTZ,
    left_time TIMESTAMPTZ,
    state TEXT NOT NULL DEFAULT 'waiting' CHECK (
        state IN ('booked', 'waiting', 'in_consultation', 'completed', 'left', 'no_show', 'cancelled')
    ),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (
        priority IN ('normal', 'urgent', 'critical')
    ),
    order_index NUMERIC NOT NULL DEFAULT 1,
    auto_closed BOOLEAN NOT NULL DEFAULT false,
    snoozed_until TIMESTAMPTZ,
    urgent_multiplier NUMERIC DEFAULT 1,
    urgent_reason TEXT,
    urgent_approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_queue_clinic_state ON public.queue_entries(clinic_id, state);
CREATE INDEX IF NOT EXISTS idx_queue_patient ON public.queue_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_doctor ON public.queue_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_order ON public.queue_entries(clinic_id, state, order_index);

-- 3. Queue Events Table (Append-only audit trail for all transitions, reorders, and priority changes)
CREATE TABLE IF NOT EXISTS public.queue_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
    queue_entry_id UUID NOT NULL REFERENCES public.queue_entries(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL DEFAULT 'receptionist',
    event_type TEXT NOT NULL,
    from_state TEXT,
    to_state TEXT,
    from_order_index NUMERIC,
    to_order_index NUMERIC,
    reason TEXT,
    approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_queue_events_clinic ON public.queue_events(clinic_id);
CREATE INDEX IF NOT EXISTS idx_queue_events_entry ON public.queue_events(queue_entry_id);
CREATE INDEX IF NOT EXISTS idx_queue_events_created ON public.queue_events(created_at);

-- Trigger: Enforce append-only on queue_events (no updates, no deletes)
CREATE OR REPLACE FUNCTION public.enforce_queue_events_append_only()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'queue_events is append-only. Modification and deletion are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_queue_events_append_only ON public.queue_events;
CREATE TRIGGER trg_queue_events_append_only
BEFORE UPDATE OR DELETE ON public.queue_events
FOR EACH ROW EXECUTE FUNCTION public.enforce_queue_events_append_only();

-- ==============================================================================
-- 4. Enable Row Level Security (RLS) on all 3 tables (Default Deny)
-- ==============================================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_events ENABLE ROW LEVEL SECURITY;

-- Appointments RLS
CREATE POLICY "appointments_staff_select"
ON public.appointments FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND (public.has_role('clinic_owner') OR public.has_role('doctor') OR public.has_role('receptionist'))
    AND (archived_at IS NULL)
);

CREATE POLICY "appointments_staff_insert"
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND (public.has_role('clinic_owner') OR public.has_role('doctor') OR public.has_role('receptionist'))
);

CREATE POLICY "appointments_staff_update"
ON public.appointments FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND (public.has_role('clinic_owner') OR public.has_role('doctor') OR public.has_role('receptionist'))
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND (public.has_role('clinic_owner') OR public.has_role('doctor') OR public.has_role('receptionist'))
);

-- Queue Entries RLS
CREATE POLICY "queue_entries_staff_select"
ON public.queue_entries FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND (public.has_role('clinic_owner') OR public.has_role('doctor') OR public.has_role('receptionist'))
    AND (archived_at IS NULL)
);

CREATE POLICY "queue_entries_staff_insert"
ON public.queue_entries FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND (public.has_role('clinic_owner') OR public.has_role('doctor') OR public.has_role('receptionist'))
);

CREATE POLICY "queue_entries_staff_update"
ON public.queue_entries FOR UPDATE TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND (public.has_role('clinic_owner') OR public.has_role('doctor') OR public.has_role('receptionist'))
)
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND (public.has_role('clinic_owner') OR public.has_role('doctor') OR public.has_role('receptionist'))
);

-- Queue Events RLS (Append-only insert, read by staff, no update/delete)
CREATE POLICY "queue_events_staff_select"
ON public.queue_events FOR SELECT TO authenticated
USING (
    clinic_id = public.current_clinic_id()
    AND (public.has_role('clinic_owner') OR public.has_role('doctor') OR public.has_role('receptionist'))
);

CREATE POLICY "queue_events_staff_insert"
ON public.queue_events FOR INSERT TO authenticated
WITH CHECK (
    clinic_id = public.current_clinic_id()
    AND (public.has_role('clinic_owner') OR public.has_role('doctor') OR public.has_role('receptionist'))
);
