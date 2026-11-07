from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPOSITORY_ROOT / "src" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.workers.canonical_product_import import (
    OFFICIAL_DOMAINS,
    CanonicalProduct,
    read_manifest,
)

DEFAULT_MANIFEST = (
    REPOSITORY_ROOT / "docs" / "research" / "canonical-products-2026-11-07.json"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate and import official-source canonical PC products."
    )
    parser.add_argument("manifest", nargs="?", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--apply", action="store_true", help="Write to Supabase.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    products = read_manifest(args.manifest.resolve())
    processors = sum(product.category == "processors" for product in products)
    motherboards = len(products) - processors
    print(f"Validated {len(products)} canonical products")
    print(f"Processors: {processors}; motherboards: {motherboards}")
    if not args.apply:
        print("Dry-run complete. No database rows were written.")
        return 0

    _load_backend_env()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply"
        )
    from supabase import create_client

    client = create_client(url, key)
    categories = _category_ids(client)
    _upsert_brands(client, products)
    _upsert_sockets(client, products)
    product_rows: list[Any] = [
        product.product_row(categories[product.category]) for product in products
    ]
    client.table("products").upsert(
        product_rows,
        on_conflict="id",
        default_to_null=False,
    ).execute()

    cpu_specs: list[Any] = [
        product.spec_row() for product in products if product.category == "processors"
    ]
    motherboard_specs: list[Any] = [
        product.spec_row()
        for product in products
        if product.category == "motherboards"
    ]
    if cpu_specs:
        client.table("cpu_specs").upsert(
            cpu_specs, on_conflict="product_id", default_to_null=False
        ).execute()
    if motherboard_specs:
        client.table("motherboard_specs").upsert(
            motherboard_specs, on_conflict="product_id", default_to_null=False
        ).execute()
    print(f"Imported {len(products)} canonical products with official-source specs.")
    return 0


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


def _category_ids(client: Any) -> dict[str, str]:
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


def _upsert_brands(client: Any, products: list[CanonicalProduct]) -> None:
    rows = {
        product.brand: {
            "id": str(product.brand_id),
            "name": product.brand,
            "slug": product.brand.casefold().replace(" ", "-"),
            "website_url": (
                f"https://www.{min(OFFICIAL_DOMAINS[product.brand])}"
            ),
        }
        for product in products
    }
    client.table("brands").upsert(list(rows.values()), on_conflict="id").execute()


def _upsert_sockets(client: Any, products: list[CanonicalProduct]) -> None:
    rows = {
        product.socket.casefold(): {
            "id": str(product.socket_id),
            "name": product.socket,
        }
        for product in products
        if product.socket and product.socket_id
    }
    if rows:
        client.table("cpu_sockets").upsert(
            list(rows.values()), on_conflict="id"
        ).execute()


if __name__ == "__main__":
    raise SystemExit(main())
