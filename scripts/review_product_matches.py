from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from uuid import UUID

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPOSITORY_ROOT / "src" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Review private product/listing match proposals."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    list_parser = subparsers.add_parser("list", help="Show pending reviews.")
    list_parser.add_argument("--limit", type=int, default=20)
    list_parser.add_argument("--offset", type=int, default=0)

    for decision in ("approve", "reject"):
        decision_parser = subparsers.add_parser(decision)
        decision_parser.add_argument("match_id", type=UUID)
        decision_parser.add_argument(
            "--reviewed-by",
            required=True,
            help="Auditable reviewer identifier, such as a Better Auth user ID.",
        )
        decision_parser.add_argument(
            "--yes",
            action="store_true",
            help="Confirm the state-changing review decision.",
        )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    _load_backend_env()
    if not os.environ.get("SUPABASE_URL") or not os.environ.get(
        "SUPABASE_SERVICE_ROLE_KEY"
    ):
        raise SystemExit(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
        )

    from app.services.match_review_service import MatchReviewService

    service = MatchReviewService()
    if args.command == "list":
        if not 1 <= args.limit <= 100:
            raise SystemExit("--limit must be between 1 and 100")
        if args.offset < 0:
            raise SystemExit("--offset must be non-negative")
        items = service.list_pending(limit=args.limit, offset=args.offset)
        for item in items:
            price = "unpriced" if item.price is None else f"{item.price:g} {item.currency}"
            print(f"{item.id}  confidence={item.confidence:.2%}  {price}")
            print(f"  canonical: {item.product_name}")
            print(f"  listing:   {item.listing_title}")
            print(f"  merchant:  {item.merchant_name}")
            print(f"  url:       {item.product_url}")
        print(f"Displayed {len(items)} pending proposals.")
        return 0

    if not args.yes:
        raise SystemExit(
            f"Refusing to {args.command} without --yes after manual comparison"
        )
    decision = "approved" if args.command == "approve" else "rejected"
    result = service.review(
        match_id=args.match_id,
        decision=decision,
        reviewed_by=args.reviewed_by,
    )
    print(
        f"Match {result.match_id} is {result.status}; "
        f"listing_id={result.listing_id or 'none'}"
    )
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
