from decimal import Decimal

from app.workers.auto_match import is_auto_promotable


def test_allows_priced_high_confidence_model_match() -> None:
    row = {
        "status": "needs_review",
        "method": "model_number",
        "confidence": 0.95,
        "listing": {"price": 21500},
    }

    assert is_auto_promotable(row, minimum_confidence=Decimal("0.95"))


def test_rejects_unpriced_or_title_only_match() -> None:
    unpriced = {
        "status": "needs_review",
        "method": "model_number",
        "confidence": 0.95,
        "listing": {"price": None},
    }
    title_only = {
        "status": "needs_review",
        "method": "exact_title",
        "confidence": 0.99,
        "listing": {"price": 21500},
    }

    assert not is_auto_promotable(
        unpriced, minimum_confidence=Decimal("0.95")
    )
    assert not is_auto_promotable(
        title_only, minimum_confidence=Decimal("0.95")
    )
