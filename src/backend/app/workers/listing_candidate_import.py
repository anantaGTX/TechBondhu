from __future__ import annotations

import csv
import re
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlparse
from uuid import NAMESPACE_URL, UUID, uuid5

CATEGORY_SLUGS = {
    "cpu": "processors",
    "motherboard": "motherboards",
}
STOCK_STATUSES = {"in_stock", "out_of_stock", "preorder", "unknown"}
GENERIC_BUY_LABELS = {"add to cart", "buy now", "order now"}
REQUIRED_COLUMNS = {
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
}


class CsvValidationError(ValueError):
    def __init__(self, issues: list[str]) -> None:
        self.issues = issues
        preview = "; ".join(issues[:10])
        suffix = "" if len(issues) <= 10 else f"; and {len(issues) - 10} more"
        super().__init__(f"CSV validation failed: {preview}{suffix}")


@dataclass(frozen=True, slots=True)
class ListingCandidate:
    captured_at: datetime
    retailer: str
    retailer_domain: str
    category: str
    brand: str | None
    title: str
    model_number: str | None
    price_bdt: Decimal | None
    stock_raw: str | None
    stock_status: str
    product_url: str
    evidence_url: str

    @property
    def category_slug(self) -> str:
        return CATEGORY_SLUGS[self.category]

    @property
    def deterministic_id(self) -> UUID:
        identity = f"techbondhu:listing-candidate:{self.product_url}"
        return uuid5(NAMESPACE_URL, identity)

    def as_database_row(
        self, *, merchant_id: str, category_id: str
    ) -> dict[str, object]:
        return {
            "id": str(self.deterministic_id),
            "merchant_id": merchant_id,
            "category_id": category_id,
            "title": self.title,
            "product_url": self.product_url,
            "evidence_url": self.evidence_url,
            "manufacturer_model_number": self.model_number,
            "price": float(self.price_bdt) if self.price_bdt is not None else None,
            "currency": "BDT",
            "stock": self.stock_status,
            "raw_stock_text": self.stock_raw,
            "source_checked_at": self.captured_at.isoformat(),
        }


@dataclass(frozen=True, slots=True)
class ProductRecord:
    id: str
    category_id: str
    brand_id: str | None
    name: str
    model_number: str | None


@dataclass(frozen=True, slots=True)
class MatchProposal:
    listing_candidate_id: str
    product_id: str
    confidence: Decimal
    method: str
    reason: str

    @property
    def deterministic_id(self) -> UUID:
        identity = (
            "techbondhu:product-match-candidate:"
            f"{self.listing_candidate_id}:{self.product_id}"
        )
        return uuid5(NAMESPACE_URL, identity)

    def as_database_row(self) -> dict[str, object]:
        return {
            "id": str(self.deterministic_id),
            "listing_candidate_id": self.listing_candidate_id,
            "product_id": self.product_id,
            "confidence": float(self.confidence),
            "method": self.method,
            "status": "needs_review",
            "reason": self.reason,
        }


def read_listing_candidates(path: Path) -> list[ListingCandidate]:
    issues: list[str] = []
    candidates: list[ListingCandidate] = []
    seen_urls: dict[str, int] = {}

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        columns = set(reader.fieldnames or [])
        missing = sorted(REQUIRED_COLUMNS - columns)
        if missing:
            raise CsvValidationError([f"missing columns: {', '.join(missing)}"])

        for line_number, row in enumerate(reader, start=2):
            try:
                candidate = _parse_row(row, line_number=line_number)
            except ValueError as exc:
                issues.append(str(exc))
                continue

            previous_line = seen_urls.get(candidate.product_url)
            if previous_line is not None:
                issues.append(
                    f"line {line_number}: duplicate product_url; first seen "
                    f"on line {previous_line}"
                )
                continue

            seen_urls[candidate.product_url] = line_number
            candidates.append(candidate)

    if issues:
        raise CsvValidationError(issues)
    if not candidates:
        raise CsvValidationError(["CSV contains no listing candidates"])
    return candidates


def build_match_proposals(
    candidates: Iterable[ListingCandidate],
    *,
    products: Iterable[ProductRecord],
    category_ids: dict[str, str],
    brand_ids_by_name: dict[str, str],
) -> list[MatchProposal]:
    products_by_model: dict[tuple[str, str | None, str], list[ProductRecord]] = {}
    products_by_title: dict[tuple[str, str | None, str], list[ProductRecord]] = {}
    products_by_catalog_model: dict[
        tuple[str, str | None, str], list[ProductRecord]
    ] = {}

    for product in products:
        if product.model_number:
            model_key = (
                product.category_id,
                product.brand_id,
                normalize_text(product.model_number),
            )
            products_by_model.setdefault(model_key, []).append(product)
            catalog_model_key = (
                product.category_id,
                product.brand_id,
                normalize_catalog_model(product.model_number),
            )
            products_by_catalog_model.setdefault(catalog_model_key, []).append(product)
        title_key = (
            product.category_id,
            product.brand_id,
            normalize_text(product.name),
        )
        products_by_title.setdefault(title_key, []).append(product)

    proposals: list[MatchProposal] = []
    for candidate in candidates:
        category_id = category_ids[candidate.category_slug]
        brand_id = (
            brand_ids_by_name.get(normalize_text(candidate.brand))
            if candidate.brand
            else None
        )

        matches: list[ProductRecord] = []
        method = ""
        confidence = Decimal("0")
        reason = ""

        if candidate.model_number and brand_id:
            key = (category_id, brand_id, normalize_text(candidate.model_number))
            matches = products_by_model.get(key, [])
            method = "model_number"
            confidence = Decimal("0.9500")
            reason = (
                "Brand, category, and model candidate match exactly. Manual "
                "review is required because the research CSV does not prove "
                "that the shop explicitly supplied the model number."
            )

        if not matches and brand_id:
            extracted_model = extract_catalog_model(candidate.title, candidate.brand)
            if extracted_model:
                key = (category_id, brand_id, extracted_model)
                matches = products_by_catalog_model.get(key, [])
                method = "model_number"
                confidence = Decimal("0.9500")
                reason = (
                    "Brand and a normalized model parsed from the retailer title "
                    "match one canonical product. Manual review is required."
                )

        if not matches and brand_id:
            normalized_title = normalize_catalog_model(candidate.title)
            contained = [
                product
                for (product_category, product_brand, model), records in (
                    products_by_catalog_model.items()
                )
                if product_category == category_id
                and product_brand == brand_id
                and model
                and f" {model} " in f" {normalized_title} "
                for product in records
            ]
            if len(contained) == 1:
                matches = contained
                method = "model_number"
                confidence = Decimal("0.9400")
                reason = (
                    "Brand and canonical model tokens occur in the retailer "
                    "title. Manual review is required."
                )

        if not matches and brand_id:
            key = (category_id, brand_id, normalize_text(candidate.title))
            matches = products_by_title.get(key, [])
            method = "exact_title"
            confidence = Decimal("0.9000")
            reason = (
                "Brand, category, and normalized title match exactly. Manual "
                "review is required before promotion."
            )

        if len(matches) != 1:
            continue

        proposals.append(
            MatchProposal(
                listing_candidate_id=str(candidate.deterministic_id),
                product_id=matches[0].id,
                confidence=confidence,
                method=method,
                reason=reason,
            )
        )

    return proposals


def merchant_slug(name: str) -> str:
    value = normalize_text(name).replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def merchant_id_for_domain(domain: str) -> UUID:
    return uuid5(NAMESPACE_URL, f"techbondhu:merchant:{normalize_domain(domain)}")


def normalize_domain(value: str) -> str:
    domain = value.strip().lower().rstrip(".")
    return domain.removeprefix("www.")


def normalize_text(value: str | None) -> str:
    if value is None:
        return ""
    return " ".join(value.casefold().split())


def normalize_catalog_model(value: str | None) -> str:
    if value is None:
        return ""
    return " ".join(re.sub(r"[^a-z0-9]+", " ", value.casefold()).split())


def extract_catalog_model(title: str, brand: str | None) -> str | None:
    normalized_brand = normalize_text(brand)
    normalized_title = normalize_catalog_model(title)
    if normalized_brand == "amd":
        match = re.search(
            r"\b(?:ryzen\s+)?([3579])\s+(\d{4,5}[a-z0-9]*)\b",
            normalized_title,
        )
        if match:
            return f"ryzen {match.group(1)} {match.group(2)}"
    if normalized_brand == "intel":
        ultra = re.search(
            r"\bcore\s+ultra\s+([3579])\s+(\d{3}[a-z]{0,3})\b",
            normalized_title,
        )
        if ultra:
            return f"core ultra {ultra.group(1)} {ultra.group(2)}"
        core = re.search(
            r"\bcore\s+i([3579])\s+(\d{4,5}[a-z]{0,3})\b",
            normalized_title,
        )
        if core:
            return f"core i{core.group(1)} {core.group(2)}"
    return None


def batched[T](items: list[T], size: int) -> Iterator[list[T]]:
    if size < 1:
        raise ValueError("batch size must be at least 1")
    for start in range(0, len(items), size):
        yield items[start : start + size]


def _parse_row(row: dict[str, str | None], *, line_number: int) -> ListingCandidate:
    retailer = _required(row, "retailer", line_number)
    retailer_domain = normalize_domain(
        _required(row, "retailer_domain", line_number)
    )
    category = _required(row, "category", line_number).lower()
    if category not in CATEGORY_SLUGS:
        raise ValueError(f"line {line_number}: unsupported category {category!r}")

    product_url = _validated_url(
        _required(row, "product_url", line_number),
        field="product_url",
        line_number=line_number,
    )
    host = normalize_domain(urlparse(product_url).hostname or "")
    if host != retailer_domain and not host.endswith(f".{retailer_domain}"):
        raise ValueError(
            f"line {line_number}: product_url host {host!r} does not match "
            f"retailer_domain {retailer_domain!r}"
        )

    evidence_url = _validated_url(
        _required(row, "evidence_url", line_number),
        field="evidence_url",
        line_number=line_number,
    )
    captured_at = _parse_datetime(
        _required(row, "captured_at", line_number), line_number=line_number
    )
    price = _parse_price(row.get("price_bdt"), line_number=line_number)
    stock_raw = _optional(row.get("stock_raw"))
    stock_status = _required(row, "stock_status", line_number).lower()
    if stock_status not in STOCK_STATUSES:
        raise ValueError(
            f"line {line_number}: unsupported stock_status {stock_status!r}"
        )
    if stock_raw and normalize_text(stock_raw) in GENERIC_BUY_LABELS:
        stock_status = "unknown"

    review_status = _required(row, "review_status", line_number).lower()
    if review_status != "unreviewed":
        raise ValueError(
            f"line {line_number}: expected review_status 'unreviewed', "
            f"got {review_status!r}"
        )

    return ListingCandidate(
        captured_at=captured_at,
        retailer=retailer,
        retailer_domain=retailer_domain,
        category=category,
        brand=_optional(row.get("brand")),
        title=_required(row, "title", line_number),
        model_number=_optional(row.get("model_number")),
        price_bdt=price,
        stock_raw=stock_raw,
        stock_status=stock_status,
        product_url=product_url,
        evidence_url=evidence_url,
    )


def _required(row: dict[str, str | None], key: str, line_number: int) -> str:
    value = _optional(row.get(key))
    if value is None:
        raise ValueError(f"line {line_number}: {key} is required")
    return value


def _optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _validated_url(value: str, *, field: str, line_number: int) -> str:
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError(
            f"line {line_number}: {field} must be an absolute HTTPS URL"
        )
    return value


def _parse_datetime(value: str, *, line_number: int) -> datetime:
    normalized = value.removesuffix("Z") + ("+00:00" if value.endswith("Z") else "")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise ValueError(
            f"line {line_number}: captured_at is not a valid ISO timestamp"
        ) from exc
    if parsed.tzinfo is None:
        raise ValueError(f"line {line_number}: captured_at must include a timezone")
    return parsed


def _parse_price(value: str | None, *, line_number: int) -> Decimal | None:
    normalized = _optional(value)
    if normalized is None:
        return None
    try:
        price = Decimal(normalized)
    except InvalidOperation as exc:
        raise ValueError(f"line {line_number}: invalid price_bdt") from exc
    if not price.is_finite() or price < 0:
        raise ValueError(f"line {line_number}: price_bdt must be non-negative")
    return price
