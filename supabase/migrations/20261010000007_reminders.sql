-- ============================================================================
-- Migration: 20261010000007_reminders.sql
-- Description: Phase 14 - Reminders and notification channel schema
-- Rules:
--   - AGENTS.md Rule #3: Tenant isolation via clinic_id and RLS (default deny).
--   - AGENTS.md Rule #5: Never hard-delete (archived_at / archived_by).
--   - AGENTS.md Rule #6: Audit logging.
-- ============================================================================

-- 1. Reminder templates table (clinic customizable)
create table if not exists public.reminder_templates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('appointment', 'follow_up')),
  title text not null,
  template_body text not null,
  is_default boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id)
);

-- Index
create index if not exists idx_reminder_templates_clinic on public.reminder_templates(clinic_id);

-- 2. Reminders table (daily scheduled reminders)
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.profiles(id),
  reminder_type text not null check (reminder_type in ('appointment', 'follow_up')),
  target_date date not null,
  channel text not null default 'manual',
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  message_text text not null,
  sent_at timestamptz,
  sent_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id)
);

-- Indexes for performance
create index if not exists idx_reminders_clinic_date on public.reminders(clinic_id, target_date);
create index if not exists idx_reminders_status on public.reminders(clinic_id, status);
create index if not exists idx_reminders_patient on public.reminders(patient_id);

-- Enable RLS
alter table public.reminder_templates enable row level security;
alter table public.reminders enable row level security;

-- RLS Policies for reminder_templates:
-- Clinic staff (owner, receptionist, doctor) can read templates in their clinic
create policy "Staff can view clinic reminder templates"
  on public.reminder_templates
  for select
  using (
    auth.uid() in (
      select user_id from public.user_roles
      where clinic_id = reminder_templates.clinic_id
        and role in ('clinic_owner', 'receptionist', 'doctor')
    )
    and archived_at is null
  );

-- Clinic owner & receptionist can manage templates
create policy "Owner and receptionist can insert reminder templates"
  on public.reminder_templates
  for insert
  with check (
    auth.uid() in (
      select user_id from public.user_roles
      where clinic_id = reminder_templates.clinic_id
        and role in ('clinic_owner', 'receptionist')
    )
  );

create policy "Owner and receptionist can update reminder templates"
  on public.reminder_templates
  for update
  using (
    auth.uid() in (
      select user_id from public.user_roles
      where clinic_id = reminder_templates.clinic_id
        and role in ('clinic_owner', 'receptionist')
    )
  );

-- RLS Policies for reminders:
-- Operational table: Staff (owner, receptionist, doctor) can view and update reminders in their clinic
create policy "Staff can view clinic reminders"
  on public.reminders
  for select
  using (
    auth.uid() in (
      select user_id from public.user_roles
      where clinic_id = reminders.clinic_id
        and role in ('clinic_owner', 'receptionist', 'doctor')
    )
    and archived_at is null
  );

create policy "Staff can insert reminders"
  on public.reminders
  for insert
  with check (
    auth.uid() in (
      select user_id from public.user_roles
      where clinic_id = reminders.clinic_id
        and role in ('clinic_owner', 'receptionist', 'doctor')
    )
  );

create policy "Staff can update reminders"
  on public.reminders
  for update
  using (
    auth.uid() in (
      select user_id from public.user_roles
      where clinic_id = reminders.clinic_id
        and role in ('clinic_owner', 'receptionist', 'doctor')
    )
  );
