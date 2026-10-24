# Better Auth setup

TechBondhu uses Better Auth in Next.js for user sessions. FastAPI accepts
short-lived Better Auth JWTs and verifies them with Better Auth's public JWKS.

## 1. Add frontend secrets

Add these values to `src/frontend/.env.local`:

```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<at-least-32-random-characters>
DATABASE_URL=<supabase-postgresql-session-pooler-url>
GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-web-client-secret>
GITHUB_CLIENT_ID=<github-oauth-app-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-app-client-secret>
RESEND_API_KEY=<resend-api-key>
AUTH_EMAIL_FROM=TechBondhu <account@your-verified-domain.com>
```

Generate the secret locally with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copy the output into `BETTER_AUTH_SECRET`. Do not commit or share it.

In Supabase, open **Connect**, select the PostgreSQL **Session pooler**, and
copy its URI. Replace the password placeholder with the database password.
Keep URL-encoded characters in the password.

### Google sign-in

Create a **Web application** OAuth client in Google Cloud Console under
**APIs & Services → Credentials**. Add this authorized redirect URI for local
development:

```text
http://localhost:3000/api/auth/callback/google
```

For production, add the same path under the production origin, for example:

```text
https://techbondhu.example/api/auth/callback/google
```

Copy the client ID and secret into `src/frontend/.env.local`, then restart the
Next.js development server. Google OAuth creates a TechBondhu account on first
use and signs in the same linked account on later uses.

### GitHub sign-in

In GitHub, open **Settings → Developer settings → OAuth Apps**, then register
a new OAuth application. Use `http://localhost:3000` as the homepage URL and
this authorization callback URL:

```text
http://localhost:3000/api/auth/callback/github
```

Copy the OAuth App client ID and generate a client secret, then add both to
`src/frontend/.env.local`. For production, create a separate OAuth App using
the production origin and the same `/api/auth/callback/github` path.

### Password reset email

TechBondhu sends password reset links through Resend. Create a Resend API key,
verify the domain used by `AUTH_EMAIL_FROM`, and add both settings to
`src/frontend/.env.local`. The sender must include a display name and an email
on the verified domain, for example:

```env
RESEND_API_KEY=re_...
AUTH_EMAIL_FROM=TechBondhu <account@techbondhu.com>
```

The **Forgot password?** link opens `/forgot-password`. Better Auth generates a
one-time link that expires after 60 minutes and returns the user to
`/reset-password`. Successfully changing the password revokes existing
TechBondhu sessions.

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

