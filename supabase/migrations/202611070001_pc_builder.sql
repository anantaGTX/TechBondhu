create type public.ram_type as enum (
    'ddr4',
    'ddr5'
);

create type public.motherboard_form_factor as enum (
    'atx',
    'micro_atx',
    'mini_itx',
    'e_atx'
);

create type public.psu_form_factor as enum (
    'atx',
    'sfx',
    'sfx_l'
);

create type public.storage_kind as enum (
    'ssd',
    'hdd'
);

create type public.cooler_kind as enum (
    'air',
    'aio'
);

create table public.cpu_sockets (
    id uuid primary key default gen_random_uuid(),
    name citext not null unique,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (btrim(name::text) <> '')
);

create table public.cpu_specs (
    product_id uuid primary key references public.products(id) on delete cascade,
    socket_id uuid references public.cpu_sockets(id) on delete restrict,
    tdp_w numeric(8, 2) check (tdp_w >= 0),
    max_power_w numeric(8, 2) check (max_power_w >= 0),
    ram_types public.ram_type[],
    source_url text not null,
    checked_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (btrim(source_url) <> ''),
    check (ram_types is null or cardinality(ram_types) > 0)
);

create index cpu_specs_socket_id_idx on public.cpu_specs (socket_id);

create table public.motherboard_specs (
    product_id uuid primary key references public.products(id) on delete cascade,
    socket_id uuid references public.cpu_sockets(id) on delete restrict,
    chipset text,
    form_factor public.motherboard_form_factor,
    ram_type public.ram_type,
    ram_slots smallint check (ram_slots > 0),
    m2_slots smallint check (m2_slots >= 0),
    cpu_power_8pin_count smallint check (cpu_power_8pin_count >= 0),
    source_url text not null,
    checked_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (chipset is null or btrim(chipset) <> ''),
    check (btrim(source_url) <> '')
);

create index motherboard_specs_socket_id_idx
on public.motherboard_specs (socket_id);

create index motherboard_specs_ram_type_idx
on public.motherboard_specs (ram_type);

create table public.ram_specs (
    product_id uuid primary key references public.products(id) on delete cascade,
    ram_type public.ram_type,
    capacity_gb integer check (capacity_gb > 0),
    module_count smallint check (module_count > 0),
    height_mm numeric(7, 2) check (height_mm > 0),
    source_url text not null,
    checked_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (btrim(source_url) <> '')
);

create index ram_specs_ram_type_idx on public.ram_specs (ram_type);

create table public.gpu_specs (
    product_id uuid primary key references public.products(id) on delete cascade,
    length_mm numeric(7, 2) check (length_mm > 0),
    slot_width numeric(4, 2) check (slot_width > 0),
    tdp_w numeric(8, 2) check (tdp_w >= 0),
    power_8pin_count smallint check (power_8pin_count >= 0),
    uses_12vhpwr boolean,
    source_url text not null,
    checked_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (btrim(source_url) <> '')
);

create table public.storage_specs (
    product_id uuid primary key references public.products(id) on delete cascade,
    kind public.storage_kind,
    form text,
    capacity_gb integer check (capacity_gb > 0),
    source_url text not null,
    checked_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (form is null or btrim(form) <> ''),
    check (btrim(source_url) <> '')
);

create index storage_specs_kind_idx on public.storage_specs (kind);

create table public.psu_specs (
    product_id uuid primary key references public.products(id) on delete cascade,
    wattage_w integer check (wattage_w > 0),
    form_factor public.psu_form_factor,
    pcie_8pin_count smallint check (pcie_8pin_count >= 0),
    has_12vhpwr boolean,
    cpu_8pin_count smallint check (cpu_8pin_count >= 0),
    source_url text not null,
    checked_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (btrim(source_url) <> '')
);

create table public.case_specs (
    product_id uuid primary key references public.products(id) on delete cascade,
    board_form_factors public.motherboard_form_factor[],
    max_gpu_length_mm numeric(7, 2) check (max_gpu_length_mm > 0),
    max_cooler_height_mm numeric(7, 2) check (max_cooler_height_mm > 0),
    radiator_sizes_mm smallint[],
    width_mm numeric(7, 2) check (width_mm > 0),
    height_mm numeric(7, 2) check (height_mm > 0),
    depth_mm numeric(7, 2) check (depth_mm > 0),
    source_url text not null,
    checked_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (
        board_form_factors is null
        or cardinality(board_form_factors) > 0
    ),
    check (radiator_sizes_mm is null or cardinality(radiator_sizes_mm) > 0),
    check (btrim(source_url) <> '')
);

create table public.cooler_specs (
    product_id uuid primary key references public.products(id) on delete cascade,
    kind public.cooler_kind,
    height_mm numeric(7, 2) check (height_mm > 0),
    radiator_mm smallint check (radiator_mm > 0),
    tdp_rating_w numeric(8, 2) check (tdp_rating_w > 0),
    source_url text not null,
    checked_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (btrim(source_url) <> ''),
    check (
        kind is distinct from 'air'::public.cooler_kind
        or radiator_mm is null
    )
);

create table public.cooler_supported_sockets (
    cooler_product_id uuid not null
        references public.cooler_specs(product_id) on delete cascade,
    socket_id uuid not null references public.cpu_sockets(id) on delete restrict,
    primary key (cooler_product_id, socket_id)
);

alter table public.merchant_listings
add constraint merchant_listings_id_product_id_unique
unique (id, product_id);

create table public.builds (
    id uuid primary key default gen_random_uuid(),
    owner_id text not null,
    name text not null default 'Untitled build',
    goal text,
    budget_bdt numeric(12, 2) check (budget_bdt >= 0),
    share_slug text unique,
    is_public boolean not null default false,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (btrim(owner_id) <> ''),
    check (btrim(name) <> ''),
    check (goal is null or btrim(goal) <> ''),
    check (share_slug is null or btrim(share_slug) <> '')
);

create index builds_owner_id_updated_at_idx
on public.builds (owner_id, updated_at desc);

create table public.build_items (
    build_id uuid not null references public.builds(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete restrict,
    quantity smallint not null default 1 check (quantity > 0),
    chosen_listing_id uuid,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    primary key (build_id, product_id),
    foreign key (chosen_listing_id, product_id)
        references public.merchant_listings(id, product_id)
);

create index build_items_product_id_idx on public.build_items (product_id);

create trigger cpu_sockets_set_updated_at
before update on public.cpu_sockets
for each row execute function public.set_updated_at();

create trigger cpu_specs_set_updated_at
before update on public.cpu_specs
for each row execute function public.set_updated_at();

create trigger motherboard_specs_set_updated_at
before update on public.motherboard_specs
for each row execute function public.set_updated_at();

create trigger ram_specs_set_updated_at
before update on public.ram_specs
for each row execute function public.set_updated_at();

create trigger gpu_specs_set_updated_at
before update on public.gpu_specs
for each row execute function public.set_updated_at();

create trigger storage_specs_set_updated_at
before update on public.storage_specs
for each row execute function public.set_updated_at();

create trigger psu_specs_set_updated_at
before update on public.psu_specs
for each row execute function public.set_updated_at();

create trigger case_specs_set_updated_at
before update on public.case_specs
for each row execute function public.set_updated_at();

create trigger cooler_specs_set_updated_at
before update on public.cooler_specs
for each row execute function public.set_updated_at();

create trigger builds_set_updated_at
before update on public.builds
for each row execute function public.set_updated_at();

create trigger build_items_set_updated_at
before update on public.build_items
for each row execute function public.set_updated_at();

alter table public.cpu_sockets enable row level security;
alter table public.cpu_specs enable row level security;
alter table public.motherboard_specs enable row level security;
alter table public.ram_specs enable row level security;
alter table public.gpu_specs enable row level security;
alter table public.storage_specs enable row level security;
alter table public.psu_specs enable row level security;
alter table public.case_specs enable row level security;
alter table public.cooler_specs enable row level security;
alter table public.cooler_supported_sockets enable row level security;
alter table public.builds enable row level security;
alter table public.build_items enable row level security;

create policy "CPU sockets are readable"
on public.cpu_sockets for select using (true);

create policy "CPU specs are readable"
on public.cpu_specs for select using (true);

create policy "Motherboard specs are readable"
on public.motherboard_specs for select using (true);

create policy "RAM specs are readable"
on public.ram_specs for select using (true);

create policy "GPU specs are readable"
on public.gpu_specs for select using (true);

create policy "Storage specs are readable"
on public.storage_specs for select using (true);

create policy "PSU specs are readable"
on public.psu_specs for select using (true);

create policy "Case specs are readable"
on public.case_specs for select using (true);

create policy "Cooler specs are readable"
on public.cooler_specs for select using (true);

create policy "Cooler socket support is readable"
on public.cooler_supported_sockets for select using (true);

-- Builds have no browser-facing policies. FastAPI uses the service role and
-- checks the Better Auth owner_id before every read or write. Public shared
-- builds are also returned through FastAPI after checking is_public.
