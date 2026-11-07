alter table public.cpu_specs
    add column if not exists core_count integer,
    add column if not exists thread_count integer,
    add column if not exists base_clock_ghz numeric(4, 2),
    add column if not exists boost_clock_ghz numeric(4, 2),
    add column if not exists l3_cache_mb numeric(6, 2);

alter table public.cpu_specs
    add constraint cpu_specs_core_count_check
        check (core_count is null or core_count > 0),
    add constraint cpu_specs_thread_count_check
        check (thread_count is null or thread_count > 0),
    add constraint cpu_specs_thread_core_check
        check (
            core_count is null
            or thread_count is null
            or thread_count >= core_count
        ),
    add constraint cpu_specs_base_clock_check
        check (base_clock_ghz is null or base_clock_ghz > 0),
    add constraint cpu_specs_boost_clock_check
        check (boost_clock_ghz is null or boost_clock_ghz > 0),
    add constraint cpu_specs_clock_order_check
        check (
            base_clock_ghz is null
            or boost_clock_ghz is null
            or boost_clock_ghz >= base_clock_ghz
        ),
    add constraint cpu_specs_l3_cache_check
        check (l3_cache_mb is null or l3_cache_mb > 0);
