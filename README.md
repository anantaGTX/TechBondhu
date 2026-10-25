# TechBondhu

TechBondhu is a technology-product discovery and comparison platform. The first release focuses on PC components, merchant offers, compatibility-aware PC building, deals, and local store discovery.

## Repository layout

```text
src/
  frontend/     Next.js frontend
  backend/      FastAPI backend
supabase/
  migrations/   Database schema and RLS policies
  seed.sql       Local development data
docs/            Architecture and product decisions
scripts/         Cross-project maintenance scripts
```

## Responsibility boundaries

- `src/frontend` renders pages and handles browser interaction.
- `src/backend` owns product normalization, comparison, compatibility, deals, merchant integrations, and other business rules.
- `supabase` owns PostgreSQL schema changes, indexes, database functions, and Row-Level Security policies.
- The browser may use Supabase directly for authenticated, RLS-protected user data. Privileged operations always go through FastAPI.
- The Supabase service-role key is server-only and must never be placed in a `NEXT_PUBLIC_*` variable.

## Local setup

1. Copy `.env.example` to `.env.local` and supply local Supabase values.Nafi
2. Install web dependencies with `npm install`.
3. Start the web application with `npm run dev:web`.
4. Create a Python virtual environment inside `src/backend/.venv`.
5. Install the API with `pip install -e ".[dev]"` from `src/backend`.
6. Start the API with `uvicorn app.main:app --reload` from `src/backend`.
7. Run Supabase locally with the Supabase CLI when database work begins.

Web: `http://localhost:3000`

API: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## Development order

1. Product categories and canonical products
2. Merchant listings and price comparison
3. PC build creation and compatibility rules
4. Deals and store locations
5. Alerts, reviews, and merchant self-service
6. Visual PC simulator

See `docs/architecture.md` for the module rules and data flow.

Authentication setup is documented in `docs/authentication.md`.

