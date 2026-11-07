import json
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

import pytest

from app.workers.canonical_product_import import (
    ManifestValidationError,
    read_manifest,
)


@contextmanager
def temporary_manifest(data: dict) -> Iterator[Path]:
    path = Path(__file__).with_name(f".tmp-canonical-{uuid4().hex}.json")
    path.write_text(json.dumps(data), encoding="utf-8")
    try:
        yield path
    finally:
        path.unlink(missing_ok=True)


def cpu_record() -> dict:
    return {
        "category": "processors",
        "brand": "AMD",
        "name": "AMD Ryzen 5 7600",
        "model_number": "Ryzen 5 7600",
        "socket": "AM5",
        "tdp_w": 65,
        "max_power_w": None,
        "ram_types": ["ddr5"],
        "source_url": "https://www.amd.com/en/products/processors/desktop/ryzen.html",
        "checked_at": "2026-11-07T00:00:00+06:00",
    }


def test_reads_official_cpu_record() -> None:
    with temporary_manifest({"products": [cpu_record()]}) as path:
        product = read_manifest(path)[0]

    assert product.socket == "AM5"
    assert product.product_row("category-id")["model_number"] == "Ryzen 5 7600"
    assert product.spec_row()["ram_types"] == ["ddr5"]


def test_rejects_nonofficial_spec_source() -> None:
    record = cpu_record()
    record["source_url"] = "https://shop.example/amd-ryzen-5-7600"
    with (
        temporary_manifest({"products": [record]}) as path,
        pytest.raises(ManifestValidationError, match="official AMD"),
    ):
        read_manifest(path)


def test_ids_are_deterministic() -> None:
    with temporary_manifest({"products": [cpu_record()]}) as path:
        first = read_manifest(path)[0]
        second = read_manifest(path)[0]

    assert first.deterministic_id == second.deterministic_id
