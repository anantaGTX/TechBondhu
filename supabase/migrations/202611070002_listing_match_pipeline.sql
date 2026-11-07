create type public.listing_candidate_status as enum (
    'pending',
    'matched',
    'rejected'
);

create type public.product_match_method as enum (
    'model_number',
    'exact_title',
    'fuzzy_title',
    'manual'
);

create type public.product_match_status as enum (
    'auto',
    'needs_review',
    'approved',
    'rejected'
);

-- Raw shop observations live here until they are matched to a canonical
-- product. Keeping them out of merchant_listings prevents unreviewed rows
-- from appearing in the public catalog.
create table public.merchant_listing_candidates (
    id uuid primary key default gen_random_uuid(),
    merchant_id uuid not null
        references public.merchants(id) on delete cascade,
    category_id uuid not null
        references public.categories(id) on delete restrict,
    title text not null,
    product_url text not null,
    evidence_url text not null,
    manufacturer_model_number citext,
    price numeric(12, 2) check (price >= 0),
    currency char(3) not null default 'BDT',
    stock public.stock_status not null default 'unknown',
    raw_stock_text text,
    source_checked_at timestamptz not null,
    status public.listing_candidate_status not null default 'pending',
    promoted_listing_id uuid unique
        references public.merchant_listings(id) on delete set null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (merchant_id, product_url),
    check (btrim(title) <> ''),
    check (btrim(product_url) <> ''),
    check (btrim(evidence_url) <> ''),
    check (
        manufacturer_model_number is null
        or btrim(manufacturer_model_number::text) <> ''
    ),
    check (raw_stock_text is null or btrim(raw_stock_text) <> ''),
    check (
        (status = 'matched' and promoted_listing_id is not null)
        or (status <> 'matched' and promoted_listing_id is null)
    )
);

create index merchant_listing_candidates_category_status_idx
on public.merchant_listing_candidates (category_id, status);

create index merchant_listing_candidates_model_number_idx
on public.merchant_listing_candidates (manufacturer_model_number)
where manufacturer_model_number is not null;

create index merchant_listing_candidates_merchant_id_idx
on public.merchant_listing_candidates (merchant_id);

-- A raw listing can have multiple proposed canonical products, but only one
-- proposal may be accepted automatically or manually.
create table public.product_match_candidates (
    id uuid primary key default gen_random_uuid(),
    listing_candidate_id uuid not null
        references public.merchant_listing_candidates(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete cascade,
    confidence numeric(5, 4) not null check (
        confidence >= 0
        and confidence <= 1
    ),
    method public.product_match_method not null,
    status public.product_match_status not null,
    reason text,
    reviewed_by text,
    reviewed_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (listing_candidate_id, product_id),
    check (reason is null or btrim(reason) <> ''),
    check (reviewed_by is null or btrim(reviewed_by) <> ''),
    check (
        (status in ('approved', 'rejected') and reviewed_at is not null)
        or (status not in ('approved', 'rejected') and reviewed_at is null)
    ),
    check (
        status <> 'auto'
        or confidence >= 0.9800
    )
);

create unique index product_match_candidates_one_accepted_idx
on public.product_match_candidates (listing_candidate_id)
where status in ('auto', 'approved');

create index product_match_candidates_review_queue_idx
on public.product_match_candidates (status, confidence desc)
where status = 'needs_review';

create index product_match_candidates_product_id_idx
on public.product_match_candidates (product_id);

create trigger merchant_listing_candidates_set_updated_at
before update on public.merchant_listing_candidates
for each row execute function public.set_updated_at();

create trigger product_match_candidates_set_updated_at
before update on public.product_match_candidates
for each row execute function public.set_updated_at();

alter table public.merchant_listing_candidates enable row level security;
alter table public.product_match_candidates enable row level security;

-- These staging and review tables intentionally have no browser policies.
-- Only service-role workers and administrative review tools may access them.
