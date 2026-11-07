# TechBondhu — Team Setup Guide

This guide walks you through running **TechBondhu** from scratch on your machine, including:
- Next.js Frontend (`http://localhost:3000`)
- FastAPI Backend (`http://localhost:8000`)
- Better Auth (Email Sign-Up/Sign-In, Google Login, GitHub Login)
- Product Catalog & Bangladesh Retailer Offers (37 canonical products + 176 live retailer offers)

---

## Prerequisites

Make sure you have installed:
1. **Node.js** `>= 22` (`node -v`)
2. **Python** `>= 3.12` (`python --version`)
3. **Docker Desktop** *(only required if running Local Supabase; not needed if using a shared Supabase Cloud `.env.local`)*

---

## Step 1: Clone & Install Dependencies

Open PowerShell in the project root (`TechBondhu`):

```powershell
# 1. Install frontend & workspace dependencies
npm install

# 2. Create and activate the Python virtual environment for the backend
cd src/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Install backend packages
pip install -e ".[dev]"
cd ../..
```

---

## Step 2: Start the Database

You can run TechBondhu using **Local Supabase (Docker)** or a **Shared Supabase Cloud** project.

### Option A: Local Supabase (Recommended for independent local work)
1. Start **Docker Desktop** and wait until it is running.
2. From the project root, start local Supabase:
   ```powershell
   npx supabase start
   ```
3. Apply all migrations (including PC Builder tables and Better Auth tables):
   ```powershell
   npx supabase db reset
   ```
   *(Local services will run on API `http://127.0.0.1:54321`, Postgres `127.0.0.1:54322`, and Studio `http://127.0.0.1:54323`.)*

### Option B: Shared Supabase Cloud (No Docker needed)
- Skip `npx supabase start` and use the team's shared Supabase Cloud credentials in Step 3.

---

## Step 3: Configure `.env.local` Files

You need **two** environment files (never committed to Git):

### 1. Backend Environment (`src/backend/.env.local`)
Copy `src/backend/.env.example` to `src/backend/.env.local`:

```powershell
Copy-Item src/backend/.env.example src/backend/.env.local
```

For **Local Supabase**, `src/backend/.env.local` should contain:
```env
APP_ENV=development
APP_DEBUG=true
APP_API_V1_PREFIX=/api/v1
APP_CORS_ORIGINS=http://localhost:3000
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks
```

### 2. Frontend Environment (`src/frontend/.env.local`)
Copy `src/frontend/.env.example` to `src/frontend/.env.local`:

```powershell
Copy-Item src/frontend/.env.example src/frontend/.env.local
```

For **Local Supabase**, `src/frontend/.env.local` should contain:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Optional: Ask a teammate for the shared Google/GitHub dev OAuth keys if testing social login
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```
*(Important: Keep each `KEY=VALUE` on a single line with no line breaks.)*

---

## Step 4: Import Products & Retailer Offers Into Your Database

Run these three commands from the project root (`TechBondhu`) to populate the database with all **37 canonical CPUs/Motherboards** and **176 Bangladesh tech-site offers**:

```powershell
.\src\backend\.venv\Scripts\python.exe scripts/import_canonical_products.py --apply
.\src\backend\.venv\Scripts\python.exe scripts/import_listing_candidates.py --apply --create-merchants
.\src\backend\.venv\Scripts\python.exe scripts/auto_promote_matches.py --apply
```

---

## Step 5: Run Backend & Frontend

Open **two** PowerShell terminals in the project root (`TechBondhu`):

### Terminal 1 — Start the FastAPI Backend (`http://localhost:8000`)
```powershell
cd src/backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Start the Next.js Frontend (`http://localhost:3000`)
```powershell
npm run dev:web
```

---

## Verify Everything Works

1. **PC Builder & Products:** Open `http://localhost:3000/pc-builder/build` — you should see CPUs and Motherboards loaded with retailer prices and stock status.
2. **Sign Up & Sign In:** Open `http://localhost:3000/sign-up` or `http://localhost:3000/sign-in` — email/password registration and login work out of the box, and Google/GitHub login work when OAuth credentials are set in `src/frontend/.env.local`.
3. **API Docs:** Open `http://localhost:8000/docs` to inspect and test FastAPI endpoints directly.

---

## Common Troubleshooting

- **"We could not sign you in. Sign-in is unavailable right now":**
  1. Check that `DATABASE_URL` in `src/frontend/.env.local` matches your running Postgres instance (`postgresql://postgres:postgres@127.0.0.1:54322/postgres` for local Supabase).
  2. Make sure the `better_auth` schema migration (`supabase/migrations/202611070005_better_auth.sql`) has been applied (`npx supabase db reset` or run that SQL file in Supabase Studio at `http://127.0.0.1:54323`).
  3. Restart `npm run dev:web` after editing `.env.local`.
- **No products showing in PC Builder:**
  1. Ensure the FastAPI backend is running on port `8000`.
  2. Run the 3 import commands in **Step 4** above.
