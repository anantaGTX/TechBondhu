# Architecture

## Core rule

A product is not the same thing as a seller listing. `products` represents the canonical item; `merchant_listings` represents a merchant's price, URL, warranty, and availability for that item.

## Request flow

```text
Browser -> Next.js -> FastAPI -> Supabase PostgreSQL
                               -> background ingestion jobs
                               -> merchant feeds/APIs
```

Next.js can also access Supabase Auth and explicitly approved RLS-protected user records. It must not contain product-matching or compatibility business logic.

## Frontend organization

- `app/` contains routes, layouts, loading states, and route-level composition.
- `features/` contains domain UI and feature-specific hooks.
- `components/ui/` contains reusable presentational components.
- `lib/` contains framework clients and shared infrastructure.
- `types/` contains frontend and generated API types.

Avoid placing large business rules in React components. Pages should compose features, and features should call typed API functions.

## Backend organization

- `api/` exposes thin HTTP routers.
- `schemas/` defines request and response contracts.
- `services/` contains use-case and business logic.
- `repositories/` contains database access.
- `domain/` contains rules that do not depend on HTTP or Supabase.
- `integrations/` contains merchant, social, and external API adapters.
- `workers/` contains scheduled and background jobs.

Routers validate HTTP input, call a service, and return a schema. They should not contain database queries or complex rules.

## Initial bounded contexts

1. Catalog: categories, brands, canonical products, specifications
2. Commerce discovery: merchants, listings, prices, inventory
3. PC builder: builds, component selections, compatibility rules
4. Deals: offers, coupons, sources, expiry
5. Locations: stores, coordinates, opening hours
6. Accounts: profiles, wishlists, alerts, reviews

## API conventions

- All public application endpoints begin with `/api/v1`.
- Resource names are plural.
- List endpoints support pagination from the beginning.
- Errors use one consistent response shape.
- API schemas are converted into frontend types through OpenAPI generation later.

## Data ingestion

Imports run outside normal API requests. Each connector should produce a normalized candidate listing, preserve the source URL, and record when the source was checked. Automatic product matches must store a confidence score; uncertain matches require review.

