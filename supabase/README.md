# Supabase

This directory is the source of truth for the PostgreSQL schema.

- Add every schema change as a new ordered migration.
- Never edit a migration after it has been applied to a shared environment.
- Keep Row-Level Security enabled for browser-accessible tables.
- Use `seed.sql` only for stable local-development fixtures.
- Generate frontend database types after migrations are applied.

The first migration establishes the catalog and merchant-listing boundary. PC builds, compatibility rules, deals, reviews, wishlists, and alerts should each be introduced through later migrations when their behavior is implemented.

