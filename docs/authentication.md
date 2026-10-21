# Better Auth setup

TechBondhu uses Better Auth in Next.js for user sessions. FastAPI accepts
short-lived Better Auth JWTs and verifies them with Better Auth's public JWKS.

## 1. Add frontend secrets

Add these values to `src/frontend/.env.local`:

```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<at-least-32-random-characters>
DATABASE_URL=<supabase-postgresql-session-pooler-url>
```

Generate the secret locally with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copy the output into `BETTER_AUTH_SECRET`. Do not commit or share it.

In Supabase, open **Connect**, select the PostgreSQL **Session pooler**, and
copy its URI. Replace the password placeholder with the database password.
Keep URL-encoded characters in the password.

## 2. Add backend verification settings

Add these values to `src/backend/.env.local`:

```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks
```

The backend does not receive `BETTER_AUTH_SECRET` or `DATABASE_URL`.

## 3. Create Better Auth tables

From the frontend directory, run:

```powershell
cd D:\TechBondhu\src\frontend
npx auth@latest migrate --config src/lib/auth.ts
```

The configuration stores Better Auth tables in a separate PostgreSQL schema
named `better_auth` and includes the JWT plugin's `jwks` table. Supabase's
reserved `auth` schema is left untouched.

## 4. Run the applications

Frontend:

```powershell
cd D:\TechBondhu
npm run dev:web
```

Backend:

```powershell
cd D:\TechBondhu\src\backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Test registration at `http://localhost:3000/sign-up` and the protected page at
`http://localhost:3000/dashboard`.

The protected FastAPI endpoint is `GET /api/v1/auth/me`. Obtain a JWT in the
browser with `authClient.token()` and send it as:

```text
Authorization: Bearer <token>
```

