create extension if not exists citext;
create extension if not exists pgcrypto;

create type public.stock_status as enum (
    'in_stock',
    'out_of_stock',
    'preorder',
    'unknown'
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

create table public.brands (
    id uuid primary key default gen_random_uuid(),
    name citext not null unique,
    slug text not null unique,
    website_url text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table public.categories (
    id uuid primary key default gen_random_uuid(),
    parent_id uuid references public.categories(id) on delete restrict,
    name citext not null,
    slug text not null unique,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (parent_id, name)
);

create table public.products (
    id uuid primary key default gen_random_uuid(),
    brand_id uuid references public.brands(id) on delete restrict,
    category_id uuid not null references public.categories(id) on delete restrict,
    name text not null,
    slug text not null unique,
    model_number citext,
    description text,
    image_url text,
    is_active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create unique index products_brand_model_number_unique
on public.products (brand_id, model_number)
where model_number is not null;

create index products_category_id_idx on public.products (category_id);
create index products_name_search_idx on public.products
using gin (to_tsvector('simple', name));

create table public.merchants (
    id uuid primary key default gen_random_uuid(),
    name citext not null unique,
    slug text not null unique,
    website_url text,
    logo_url text,
    is_verified boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table public.store_locations (
    id uuid primary key default gen_random_uuid(),
    merchant_id uuid not null references public.merchants(id) on delete cascade,
    name text not null,
    address_line text not null,
    city text not null,
    country_code char(2) not null default 'BD',
    latitude numeric(9, 6),
    longitude numeric(9, 6),
    phone text,
    opening_hours jsonb not null default '{}'::jsonb,
    is_active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (latitude between -90 and 90),
    check (longitude between -180 and 180)
);

create index store_locations_merchant_id_idx
on public.store_locations (merchant_id);

create table public.merchant_listings (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    merchant_id uuid not null references public.merchants(id) on delete cascade,
    store_location_id uuid references public.store_locations(id) on delete set null,
    merchant_sku text,
    title text not null,
    product_url text not null,
    price numeric(12, 2) not null check (price >= 0),
    original_price numeric(12, 2) check (original_price >= price),
    currency char(3) not null default 'BDT',
    stock public.stock_status not null default 'unknown',
    warranty_text text,
    is_active boolean not null default true,
    last_checked_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (merchant_id, product_url)
);

create index merchant_listings_product_price_idx
on public.merchant_listings (product_id, price)
where is_active = true;

create index merchant_listings_merchant_id_idx
on public.merchant_listings (merchant_id);

create table public.price_history (
    id bigint generated always as identity primary key,
    listing_id uuid not null references public.merchant_listings(id) on delete cascade,
    price numeric(12, 2) not null check (price >= 0),
    original_price numeric(12, 2),
    currency char(3) not null default 'BDT',
    captured_at timestamptz not null default timezone('utc', now())
);

create index price_history_listing_captured_idx
on public.price_history (listing_id, captured_at desc);

create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger merchants_set_updated_at
before update on public.merchants
for each row execute function public.set_updated_at();

create trigger store_locations_set_updated_at
before update on public.store_locations
for each row execute function public.set_updated_at();

create trigger merchant_listings_set_updated_at
before update on public.merchant_listings
for each row execute function public.set_updated_at();

alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.merchants enable row level security;
alter table public.store_locations enable row level security;
alter table public.merchant_listings enable row level security;
alter table public.price_history enable row level security;

create policy "Public brands are readable"
on public.brands for select using (true);

create policy "Public categories are readable"
on public.categories for select using (true);

create policy "Active products are readable"
on public.products for select using (is_active = true);

create policy "Active merchants are readable"
on public.merchants for select using (is_active = true);

create policy "Active store locations are readable"
on public.store_locations for select using (is_active = true);

create policy "Active listings are readable"
on public.merchant_listings for select using (is_active = true);

create policy "Price history is readable"
on public.price_history for select using (true);

