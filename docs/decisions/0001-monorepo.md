# ADR 0001: Monorepo with separated applications

## Status

Accepted

## Decision

Keep the Next.js frontend under `src/frontend`, the FastAPI backend under
`src/backend`, Supabase database assets, and project documentation in one
repository while deploying them as separate services.

## Why

This keeps schema, API, and UI changes reviewable together without mixing runtime responsibilities. It also allows each application to use its native tooling.

## Consequences

- Web and API dependencies remain independent.
- Shared contracts should come from the FastAPI OpenAPI document rather than manually duplicated models.
- Database changes must be committed as ordered Supabase migrations.

