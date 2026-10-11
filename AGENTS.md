# AGENTS.md — Med (clinic management platform)

Read `docs/PROJECT.md` before starting any task. It is the source of truth for scope, roles, queue rules and data model. Build steps are in `docs/PROMPTS.md`. If a request conflicts with `docs/PROJECT.md`, stop and ask; do not silently pick one.

## What this product is

A multi-clinic SaaS for clinics: booking, live waiting queue, doctor visit, printed prescription, owner reports. One shared core plus one module per specialty. Version 1 ships core + Pediatrics + Nutrition. Interface is Arabic-first, right-to-left.

## Non-negotiable rules

1. **Roles first.** Roles: `platform_admin`, `clinic_owner`, `doctor`, `receptionist`. Permission logic lives in the database (Row Level Security), not only in the UI.
2. **Medical privacy.** `platform_admin` and `receptionist` must never be able to read clinical data. Keep the "clinical tables" list in code up to date; every new clinical table is added to it and covered by the RLS tests.
3. **Tenant isolation.** Every clinic-owned table has `clinic_id` and RLS. Default deny. A table without RLS is a bug.
4. **Invitation only.** No public sign-up, no social login. Accounts are created only from valid invitations.
5. **Never hard-delete.** Use `archived_at` / `archived_by` and a restore path. No permanent deletion unless the spec says so.
6. **Audit.** Write to the append-only `audit_log` for invitations, role changes, archive/restore, queue overrides, priority use, settings changes and opening a patient's clinical record.
7. **No invented medical data.** Never hardcode growth reference values, vaccination ages, drug doses or food values from memory. Load official data files or leave configurable templates empty, and say so.
8. **Do not auto-edit clinical text.** What the doctor types is what is stored and printed.
9. **Queue logic is a pure module** (no DB access) with unit tests. All thresholds come from clinic settings, never magic numbers.
10. **Do not remove or weaken tests to make a build pass.** Report what you could not verify.

## Stack (assumed, see PROJECT.md section 14)

Next.js App Router + TypeScript + Tailwind + shadcn/ui · Supabase (Postgres, Auth, Realtime, Row Level Security) · Recharts · Vitest + Playwright.

## Conventions

- All user-facing strings go in the message files (Arabic default). No inline Arabic or English in components.
- RTL by default. Clinical numbers in Western digits unless the clinic setting says otherwise. Clinic timezone `Africa/Cairo`; store UTC.
- Specialty code lives in `src/modules/<name>` and is registered in `src/modules/registry.ts`. A clinic without a module must not see its routes or data.
- Database changes only through migrations in `supabase/migrations`. Never edit the database by hand.
- Queue states: `booked`, `waiting`, `in_consultation`, `completed`, `left`, `no_show`, `cancelled`. Every transition is stored with timestamp and actor.
- Keep components small, typed, and tested where the logic matters (queue engine, growth calculations, permissions, reports).
- Receptionist screens show demographics, booking, queue and paid status only.

## Working style

- For large tasks, show a short plan first and wait for approval.
- After finishing, list: what changed, what you assumed, what is not done, and how to verify.
- Ask one clear question when the spec is ambiguous instead of guessing.
- Update `docs/PROJECT.md` and its changelog when a decision changes.
