import csv
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

import pytest

from app.workers.listing_candidate_import import (
    CsvValidationError,
    ProductRecord,
    build_match_proposals,
    extract_catalog_model,
    read_listing_candidates,
)

FIELDNAMES = [
    "captured_at",
    "retailer",
    "retailer_domain",
    "category",
    "brand",
    "title",
    "model_number",
    "price_bdt",
    "stock_raw",
    "stock_status",
    "product_url",
    "evidence_url",
    "review_status",
]


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)


@contextmanager
def temporary_csv(rows: list[dict[str, str]]) -> Iterator[Path]:
    path = Path(__file__).with_name(f".tmp-listings-{uuid4().hex}.csv")
    write_csv(path, rows)
    try:
        yield path
    finally:
        path.unlink(missing_ok=True)


def valid_row() -> dict[str, str]:
    return {
        "captured_at": "2026-11-07T09:55:44.858Z",
        "retailer": "Example Shop",
        "retailer_domain": "example.com.bd",
        "category": "cpu",
        "brand": "AMD",
        "title": "AMD Ryzen 5 7600 Processor",
        "model_number": "Ryzen 5 7600",
        "price_bdt": "21500",
        "stock_raw": "In Stock",
        "stock_status": "in_stock",
        "product_url": "https://example.com.bd/amd-ryzen-5-7600",
        "evidence_url": "https://example.com.bd/processor",
        "review_status": "unreviewed",
    }


def test_reads_and_normalizes_generic_buy_label() -> None:
    row = valid_row()
    row["stock_raw"] = "Buy Now"

    with temporary_csv([row]) as path:
        candidates = read_listing_candidates(path)

    assert len(candidates) == 1
    assert candidates[0].stock_status == "unknown"
    assert candidates[0].price_bdt is not None


def test_rejects_duplicate_product_urls() -> None:
    with (
        temporary_csv([valid_row(), valid_row()]) as path,
        pytest.raises(CsvValidationError, match="duplicate product_url"),
    ):
        read_listing_candidates(path)


def test_rejects_cross_domain_product_url() -> None:
    row = valid_row()
    row["product_url"] = "https://different.example/amd-ryzen-5-7600"
    with (
        temporary_csv([row]) as path,
        pytest.raises(CsvValidationError, match="does not match retailer_domain"),
    ):
        read_listing_candidates(path)


def test_exact_model_match_requires_review() -> None:
    with temporary_csv([valid_row()]) as path:
        candidate = read_listing_candidates(path)[0]
    product = ProductRecord(
        id="product-id",
        category_id="cpu-category-id",
        brand_id="amd-brand-id",
        name="AMD Ryzen 5 7600",
        model_number="Ryzen 5 7600",
    )

    proposals = build_match_proposals(
        [candidate],
        products=[product],
        category_ids={"processors": "cpu-category-id"},
        brand_ids_by_name={"amd": "amd-brand-id"},
    )

    assert len(proposals) == 1
    assert proposals[0].method == "model_number"
    assert proposals[0].as_database_row()["status"] == "needs_review"


@pytest.mark.parametrize(
    ("brand", "title", "expected"),
    [
        ("AMD", "AMD Ryzen 5 5600G Tray Processor", "ryzen 5 5600g"),
        ("Intel", "Intel Core i5-12400 Desktop CPU", "core i5 12400"),
        (
            "Intel",
            "Intel Core Ultra 7-265KF Processor",
            "core ultra 7 265kf",
        ),
    ],
)
def test_extracts_cpu_catalog_models(
    brand: str, title: str, expected: str
) -> None:
    assert extract_catalog_model(title, brand) == expected


def test_title_model_match_requires_review() -> None:
    row = valid_row()
    row["title"] = "AMD Ryzen 5 7600 Gaming Tray Processor"
    row["model_number"] = ""
    with temporary_csv([row]) as path:
        candidate = read_listing_candidates(path)[0]
    product = ProductRecord(
        id="product-id",
        category_id="cpu-category-id",
        brand_id="amd-brand-id",
        name="AMD Ryzen 5 7600",
        model_number="Ryzen 5 7600",
    )

    proposals = build_match_proposals(
        [candidate],
        products=[product],
        category_ids={"processors": "cpu-category-id"},
        brand_ids_by_name={"amd": "amd-brand-id"},
    )

    assert len(proposals) == 1
    assert proposals[0].confidence < 1
    assert proposals[0].as_database_row()["status"] == "needs_review"
