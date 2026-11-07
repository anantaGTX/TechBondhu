from __future__ import annotations

from decimal import Decimal
from typing import Any


def is_auto_promotable(
    row: dict[str, Any], *, minimum_confidence: Decimal
) -> bool:
    listing = row.get("listing")
    return bool(
        row.get("status") == "needs_review"
        and row.get("method") == "model_number"
        and Decimal(str(row.get("confidence", 0))) >= minimum_confidence
        and isinstance(listing, dict)
        and listing.get("price") is not None
    )
