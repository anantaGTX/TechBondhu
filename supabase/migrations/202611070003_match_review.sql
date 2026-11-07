create or replace function public.review_product_match(
    p_match_id uuid,
    p_decision public.product_match_status,
    p_reviewed_by text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
    v_match public.product_match_candidates%rowtype;
    v_candidate public.merchant_listing_candidates%rowtype;
    v_listing_id uuid;
    v_previous_price numeric(12, 2);
begin
    if p_decision not in ('approved', 'rejected') then
        raise exception using
            errcode = '22023',
            message = 'decision_must_be_approved_or_rejected';
    end if;
    if p_reviewed_by is null or btrim(p_reviewed_by) = '' then
        raise exception using
            errcode = '22023',
            message = 'reviewed_by_is_required';
    end if;

    select * into v_match
    from public.product_match_candidates
    where id = p_match_id
    for update;

    if not found then
        raise exception using errcode = 'P0002', message = 'match_not_found';
    end if;
    if v_match.status = p_decision then
        return jsonb_build_object(
            'match_id', v_match.id,
            'status', v_match.status,
            'listing_id', (
                select promoted_listing_id
                from public.merchant_listing_candidates
                where id = v_match.listing_candidate_id
            )
        );
    end if;
    if v_match.status in ('approved', 'rejected') then
        raise exception using
            errcode = '55000',
            message = 'match_already_reviewed';
    end if;

    if p_decision = 'rejected' then
        update public.product_match_candidates
        set status = 'rejected',
            reviewed_by = p_reviewed_by,
            reviewed_at = timezone('utc', now())
        where id = p_match_id;

        return jsonb_build_object(
            'match_id', p_match_id,
            'status', 'rejected',
            'listing_id', null
        );
    end if;

    select * into v_candidate
    from public.merchant_listing_candidates
    where id = v_match.listing_candidate_id
    for update;

    if v_candidate.price is null then
        raise exception using
            errcode = '23502',
            message = 'listing_candidate_has_no_price';
    end if;
    if v_candidate.status = 'rejected' then
        raise exception using
            errcode = '55000',
            message = 'listing_candidate_is_rejected';
    end if;

    perform 1
    from public.product_match_candidates
    where listing_candidate_id = v_match.listing_candidate_id
    for update;

    select id, price into v_listing_id, v_previous_price
    from public.merchant_listings
    where merchant_id = v_candidate.merchant_id
      and product_url = v_candidate.product_url
    for update;

    insert into public.merchant_listings (
        product_id,
        merchant_id,
        title,
        product_url,
        price,
        currency,
        stock,
        is_active,
        last_checked_at
    )
    values (
        v_match.product_id,
        v_candidate.merchant_id,
        v_candidate.title,
        v_candidate.product_url,
        v_candidate.price,
        v_candidate.currency,
        v_candidate.stock,
        true,
        v_candidate.source_checked_at
    )
    on conflict (merchant_id, product_url) do update
    set product_id = excluded.product_id,
        title = excluded.title,
        price = excluded.price,
        currency = excluded.currency,
        stock = excluded.stock,
        is_active = true,
        last_checked_at = excluded.last_checked_at
    returning id into v_listing_id;

    if v_previous_price is null
       or v_previous_price is distinct from v_candidate.price then
        insert into public.price_history (
            listing_id,
            price,
            currency,
            captured_at
        )
        values (
            v_listing_id,
            v_candidate.price,
            v_candidate.currency,
            v_candidate.source_checked_at
        );
    end if;

    update public.product_match_candidates
    set status = 'rejected',
        reviewed_by = p_reviewed_by,
        reviewed_at = timezone('utc', now())
    where listing_candidate_id = v_match.listing_candidate_id
      and id <> p_match_id
      and status not in ('approved', 'rejected');

    update public.product_match_candidates
    set status = 'approved',
        reviewed_by = p_reviewed_by,
        reviewed_at = timezone('utc', now())
    where id = p_match_id;

    update public.merchant_listing_candidates
    set status = 'matched',
        promoted_listing_id = v_listing_id
    where id = v_match.listing_candidate_id;

    return jsonb_build_object(
        'match_id', p_match_id,
        'status', 'approved',
        'listing_id', v_listing_id
    );
end;
$$;

revoke all on function public.review_product_match(
    uuid,
    public.product_match_status,
    text
) from public, anon, authenticated;

grant execute on function public.review_product_match(
    uuid,
    public.product_match_status,
    text
) to service_role;
