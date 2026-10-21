import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;
const authUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Better Auth.");
}

if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
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

