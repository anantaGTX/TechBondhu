from __future__ import annotations

import argparse
import os
import sys
from decimal import Decimal
from pathlib import Path
from typing import Any, cast
from uuid import UUID

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPOSITORY_ROOT / "src" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Promote deterministic priced model matches automatically."
    )
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--minimum-confidence", type=Decimal, default=Decimal("0.95"))
    parser.add_argument("--limit", type=int, default=1000)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not Decimal("0.95") <= args.minimum_confidence <= Decimal(1):
        raise SystemExit("--minimum-confidence must be between 0.95 and 1")
    if not 1 <= args.limit <= 1000:
        raise SystemExit("--limit must be between 1 and 1000")

    _load_backend_env()
    if not os.environ.get("SUPABASE_URL") or not os.environ.get(
        "SUPABASE_SERVICE_ROLE_KEY"
    ):
        raise SystemExit(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
        )

    from app.integrations.supabase import get_service_role_client
    from app.repositories.match_review_repository import MatchReviewRepository
    from app.workers.auto_match import is_auto_promotable

    client = get_service_role_client()
    rows = cast(
        list[dict[str, Any]],
        client.table("product_match_candidates")
        .select(
            "id,status,method,confidence,"
            "listing:merchant_listing_candidates!inner(price)"
        )
        .eq("status", "needs_review")
        .eq("method", "model_number")
        .gte("confidence", float(args.minimum_confidence))
        .limit(args.limit)
        .execute()
        .data,
    )
    eligible = [
        row
        for row in rows
        if is_auto_promotable(row, minimum_confidence=args.minimum_confidence)
    ]
    print(f"Eligible deterministic priced matches: {len(eligible)}")
    if not args.apply:
        print("Dry-run complete. No proposals were promoted.")
        return 0

    repository = MatchReviewRepository()
    promoted = 0
    for row in eligible:
        repository.review(
            match_id=UUID(row["id"]),
            decision="approved",
            reviewed_by="system:auto-match-v1",
        )
        promoted += 1
    print(f"Automatically promoted {promoted} merchant listings.")
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


if __name__ == "__main__":
    raise SystemExit(main())
