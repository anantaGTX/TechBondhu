from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any, cast

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPOSITORY_ROOT / "src" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.workers.listing_candidate_import import (
    ListingCandidate,
    ProductRecord,
    batched,
    build_match_proposals,
    merchant_id_for_domain,
    merchant_slug,
    normalize_domain,
    normalize_text,
    read_listing_candidates,
)

DEFAULT_CSV = (
    REPOSITORY_ROOT
    / "docs"
    / "research"
    / "bd-cpu-motherboard-listings-2026-11-07.csv"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Validate and optionally stage researched shop listings for product "
            "matching. Dry-run is the default."
        )
    )
    parser.add_argument("csv", nargs="?", type=Path, default=DEFAULT_CSV)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write validated rows with the Supabase service role.",
    )
    parser.add_argument(
        "--create-merchants",
        action="store_true",
        help="Create missing merchant records. Only valid with --apply.",
    )
    parser.add_argument("--batch-size", type=int, default=250)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    csv_path = args.csv.resolve()
    candidates = read_listing_candidates(csv_path)
    _print_dry_run_summary(csv_path, candidates)

    if not args.apply:
        print("Dry-run complete. No database rows were written.")
        return 0
    if args.batch_size < 1 or args.batch_size > 1000:
        raise SystemExit("--batch-size must be between 1 and 1000")

    _load_backend_env()
    supabase_url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_role_key:
        raise SystemExit(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply"
        )

    from supabase import create_client

    client = create_client(supabase_url, service_role_key)
    category_ids = _load_category_ids(client)
    merchants = _load_merchants(client)
    missing_domains = sorted(
        {
            candidate.retailer_domain
            for candidate in candidates
            if candidate.retailer_domain not in merchants
        }
    )
    if missing_domains and not args.create_merchants:
        raise SystemExit(
            "Missing merchants: "
            + ", ".join(missing_domains)
            + ". Re-run with --create-merchants after reviewing them."
        )
    if missing_domains:
        _create_missing_merchants(client, candidates, missing_domains)
        merchants = _load_merchants(client)

    candidate_rows = [
        candidate.as_database_row(
            merchant_id=merchants[candidate.retailer_domain],
            category_id=category_ids[candidate.category_slug],
        )
        for candidate in candidates
    ]
    for batch in batched(candidate_rows, args.batch_size):
        (
            client.table("merchant_listing_candidates")
            .upsert(cast(Any, batch), on_conflict="id", default_to_null=False)
            .execute()
        )

    brands = _fetch_all(client, "brands", "id,name")
    brand_ids_by_name = {
        normalize_text(row["name"]): row["id"] for row in brands
    }
    products = [
        ProductRecord(
            id=row["id"],
            category_id=row["category_id"],
            brand_id=row.get("brand_id"),
            name=row["name"],
            model_number=row.get("model_number"),
        )
        for row in _fetch_all(
            client,
            "products",
            "id,category_id,brand_id,name,model_number",
        )
    ]
    proposals = build_match_proposals(
        candidates,
        products=products,
        category_ids=category_ids,
        brand_ids_by_name=brand_ids_by_name,
    )
    proposal_rows = [proposal.as_database_row() for proposal in proposals]
    for batch in batched(proposal_rows, args.batch_size):
        (
            client.table("product_match_candidates")
            .upsert(
                cast(Any, batch),
                on_conflict="id",
                ignore_duplicates=True,
                default_to_null=False,
            )
            .execute()
        )

    print(
        f"Staged {len(candidate_rows)} listing candidates and "
        f"{len(proposal_rows)} exact-match review proposals."
    )
    print("No candidate was auto-approved or promoted to merchant_listings.")
    return 0


def _print_dry_run_summary(
    csv_path: Path, candidates: list[ListingCandidate]
) -> None:
    by_category: dict[str, int] = {}
    by_retailer: dict[str, int] = {}
    priced = 0
    for candidate in candidates:
        by_category[candidate.category] = by_category.get(candidate.category, 0) + 1
        by_retailer[candidate.retailer] = by_retailer.get(candidate.retailer, 0) + 1
        priced += candidate.price_bdt is not None

    print(f"Validated: {csv_path}")
    print(f"Rows: {len(candidates)}")
    print(f"Priced rows: {priced}")
    print(
        "Categories: "
        + ", ".join(f"{key}={value}" for key, value in sorted(by_category.items()))
    )
    print(f"Retailers: {len(by_retailer)}")


def _load_backend_env() -> None:
    for filename in (".env", ".env.local"):
        path = BACKEND_ROOT / filename
        if not path.exists():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def _load_category_ids(client: Any) -> dict[str, str]:
    rows = (
        client.table("categories")
        .select("id,slug")
        .in_("slug", ["processors", "motherboards"])
        .execute()
        .data
    )
    result = {row["slug"]: row["id"] for row in rows}
    missing = {"processors", "motherboards"} - result.keys()
    if missing:
        raise SystemExit("Missing categories: " + ", ".join(sorted(missing)))
    return result


def _load_merchants(client: Any) -> dict[str, str]:
    rows = _fetch_all(client, "merchants", "id,slug,website_url")
    merchants: dict[str, str] = {}
    for row in rows:
        website_url = row.get("website_url")
        if not website_url:
            continue
        from urllib.parse import urlparse

        domain = normalize_domain(urlparse(website_url).hostname or "")
        if domain:
            merchants[domain] = row["id"]
    return merchants


def _create_missing_merchants(
    client: Any,
    candidates: list[ListingCandidate],
    missing_domains: list[str],
) -> None:
    first_by_domain: dict[str, ListingCandidate] = {}
    for candidate in candidates:
        first_by_domain.setdefault(candidate.retailer_domain, candidate)

    rows = []
    for domain in missing_domains:
        candidate = first_by_domain[domain]
        rows.append(
            {
                "id": str(merchant_id_for_domain(domain)),
                "name": candidate.retailer,
                "slug": merchant_slug(candidate.retailer),
                "website_url": f"https://{domain}",
                "is_verified": False,
                "is_active": True,
            }
        )
    client.table("merchants").upsert(rows, on_conflict="id").execute()


def _fetch_all(
    client: Any,
    table: str,
    columns: str,
    *,
    page_size: int = 1000,
) -> list[dict]:
    rows: list[dict] = []
    start = 0
    while True:
        page = (
            client.table(table)
            .select(columns)
            .range(start, start + page_size - 1)
            .execute()
            .data
        )
        rows.extend(page)
        if len(page) < page_size:
            return rows
        start += page_size


if __name__ == "__main__":
    raise SystemExit(main())
