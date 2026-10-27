# Med Phase 1: Setup & Free-Tier Deployment Guide

This guide covers local development, Supabase configuration, environment variables, and zero-cost hosting setup for **Phase 1: Family Space & Clinic Stub**.

---

## 1. Local Development Setup

### Prerequisites
- Node.js 20+ / npm
- Supabase CLI (`npm install -g supabase` or `npx supabase`)
- Git

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Start local Supabase container (optional, fallback in-memory is active)
npx supabase start

# 3. Apply Phase 1 migration
npx supabase migration up

# 4. Seed realistic fake Egyptian family (Ahmed, Sara, Yassin)
npx supabase db execute -f supabase/seed_phase1.sql

# 5. Start Next.js development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 2. Environment Variables (.env.local)

Create `.env.local` in the project root:

```ini
# Supabase Configuration (Free Tier: app.supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Private Storage Bucket Name
FAMILY_STORAGE_BUCKET=family_documents_private
```

---

## 3. Free-Tier Deployment (Vercel + Supabase)

### Supabase Free Tier
1. Create a free project at [supabase.com](https://supabase.com) (Region: `eu-central-1` Frankfurt recommended for lower latency to Egypt/MENA).
2. Go to **SQL Editor**, paste and run `supabase/migrations/20261027100000_phase1_family_space.sql`.
3. (Optional) Run `supabase/seed_phase1.sql` to populate demo data.
4. Go to **Project Settings** > **API** to copy your `URL` and `anon key`.

### Vercel Free Tier (Hobby)
1. Push your repository to GitHub or GitLab.
2. In Vercel, click **Add New** > **Project** and select this repo.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. Vercel will build Next.js with automatic SSL, global CDN, and security headers.

---

## 4. Verification Commands

Run the full check suite:
```bash
# Type check
npm run type-check

# Unit & RLS Tests
npm run test

# Run E2E Tests
npx playwright test e2e/phase1-family-space.spec.ts
```
