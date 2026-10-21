-- Keep this file deterministic and limited to local development fixtures.

insert into public.categories (name, slug)
values
    ('Processors', 'processors'),
    ('Motherboards', 'motherboards'),
    ('Graphics Cards', 'graphics-cards'),
    ('Memory', 'memory'),
    ('Storage', 'storage'),
    ('Power Supplies', 'power-supplies'),
    ('Cases', 'cases'),
    ('CPU Coolers', 'cpu-coolers')
on conflict (slug) do nothing;

