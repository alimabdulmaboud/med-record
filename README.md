# Med — Clinic Management Platform (منصة مِيد)

A multi-clinic SaaS for healthcare practices: booking, live waiting queue, doctor visit, printed prescription, and clinic owner reports.

## Architecture

- **Core:** Foundational operational loop shared by all clinics (`src/modules/core`).
- **Specialty Modules:** Pluggable modules enabled per clinic (`pediatrics`, `nutrition` in `src/modules/`).
- **Arabic-First RTL:** Interface is Arabic by default (`dir="rtl" lang="ar"`), with no inline text strings (all strings stored in `src/lib/i18n/messages/`).
- **Security & Multi-tenancy:** Strict Row Level Security (RLS) in PostgreSQL with default-deny policies.

---

## Prerequisites

- **Node.js:** v20+ (tested on Node v24)
- **npm:** v10+
- **Supabase CLI:** (Optional for local emulation, or connect to remote/hosted project)

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Default configuration includes:
- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `TZ=Africa/Cairo`

### 3. Supabase Local Development

To start the local Supabase environment (requires Docker):

```bash
npx supabase start
```

To run database migrations:

```bash
npx supabase migration up
```

To run seeds:

```bash
npx supabase db reset
```

*(Note: Supabase configuration files live in `supabase/config.toml`, `supabase/migrations/`, and `supabase/seed.sql`)*

### 4. Start Development Server

```bash
npm run dev
```

The application will be running at [http://localhost:3000](http://localhost:3000).

---

## Testing & Quality Checks

Run the CI-ready check command (lint + type-check + unit tests):

```bash
npm run check
```

Or individual commands:

- **Lint:** `npm run lint`
- **Type Check:** `npm run type-check`
- **Unit Tests (Vitest):** `npm run test`
- **E2E Tests (Playwright):** `npm run test:e2e`
