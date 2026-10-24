import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";

import { sendPasswordResetEmail } from "@/lib/email";

const databaseUrl = process.env.DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;
const authUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Better Auth.");
}

if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
}

if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together.");
}

if (Boolean(githubClientId) !== Boolean(githubClientSecret)) {
  throw new Error("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be configured together.");
}

const globalForAuth = globalThis as unknown as {
  techBondhuAuthPool?: Pool;
};

const pool =
  globalForAuth.techBondhuAuthPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForAuth.techBondhuAuthPool = pool;
}

export const auth = betterAuth({
  appName: "TechBondhu",
  baseURL: authUrl,
  secret: authSecret,
  trustedOrigins: [authUrl],
  database: {
    dialect: new PostgresDialect({ pool }),
    type: "postgres",
    // Supabase reserves its own `auth` schema, so Better Auth stays isolated.
    schemaName: "better_auth",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      void sendPasswordResetEmail({ to: user.email, url }).catch((error: unknown) => {
        console.error("Unable to send password reset email", error);
      });
    },
  },
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          prompt: "select_account",
        },
      }
      : {}),
    ...(githubClientId && githubClientSecret
      ? {
        github: {
          clientId: githubClientId,
          clientSecret: githubClientSecret,
        },
      }
      : {}),
  },
  advanced: {
    database: {
      joins: true,
    },
  },
  plugins: [
    jwt(),
    // This must remain the last plugin so Server Actions can set cookies.
    nextCookies(),
  ],
});

