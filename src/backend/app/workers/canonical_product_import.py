from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse
from uuid import NAMESPACE_URL, UUID, uuid5

ALLOWED_CATEGORIES = {"processors", "motherboards"}
ALLOWED_RAM_TYPES = {"ddr4", "ddr5"}
ALLOWED_FORM_FACTORS = {"atx", "micro_atx", "mini_itx", "e_atx"}
OFFICIAL_DOMAINS = {
    "AMD": {"amd.com"},
    "Intel": {"intel.com"},
    "ASUS": {"asus.com"},
    "Gigabyte": {"gigabyte.com"},
    "MSI": {"msi.com"},
    "ASRock": {"asrock.com"},
    "Biostar": {"biostar.com.tw"},
}


class ManifestValidationError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class CanonicalProduct:
    category: str
    brand: str
    name: str
    model_number: str
    source_url: str
    checked_at: datetime
    socket: str | None
    image_url: str | None = None
    tdp_w: Decimal | None = None
    max_power_w: Decimal | None = None
    ram_types: tuple[str, ...] = ()
    core_count: int | None = None
    thread_count: int | None = None
    base_clock_ghz: Decimal | None = None
    boost_clock_ghz: Decimal | None = None
    l3_cache_mb: Decimal | None = None
    chipset: str | None = None
    form_factor: str | None = None
    ram_type: str | None = None
    ram_slots: int | None = None
    m2_slots: int | None = None
    cpu_power_8pin_count: int | None = None

    @property
    def deterministic_id(self) -> UUID:
        identity = (
            "techbondhu:canonical-product:"
            f"{self.category}:{self.brand.casefold()}:{self.model_number.casefold()}"
        )
        return uuid5(NAMESPACE_URL, identity)

    @property
    def brand_id(self) -> UUID:
        return uuid5(NAMESPACE_URL, f"techbondhu:brand:{self.brand.casefold()}")

    @property
    def socket_id(self) -> UUID | None:
        if self.socket is None:
            return None
        return uuid5(NAMESPACE_URL, f"techbondhu:cpu-socket:{self.socket.casefold()}")

    @property
    def slug(self) -> str:
        value = f"{self.brand}-{self.model_number}".casefold()
        return re.sub(r"[^a-z0-9]+", "-", value).strip("-")

    def product_row(self, category_id: str) -> dict[str, object]:
        return {
            "id": str(self.deterministic_id),
            "brand_id": str(self.brand_id),
            "category_id": category_id,
            "name": self.name,
            "slug": self.slug,
            "model_number": self.model_number,
            "image_url": self.image_url,
            "is_active": True,
        }

    def spec_row(self) -> dict[str, object]:
        common: dict[str, object] = {
            "product_id": str(self.deterministic_id),
            "socket_id": str(self.socket_id) if self.socket_id else None,
            "source_url": self.source_url,
            "checked_at": self.checked_at.isoformat(),
        }
        if self.category == "processors":
            return {
                **common,
                "tdp_w": float(self.tdp_w) if self.tdp_w is not None else None,
                "max_power_w": (
                    float(self.max_power_w)
                    if self.max_power_w is not None
                    else None
                ),
                "ram_types": list(self.ram_types) or None,
                "core_count": self.core_count,
                "thread_count": self.thread_count,
                "base_clock_ghz": (
                    float(self.base_clock_ghz)
                    if self.base_clock_ghz is not None
                    else None
                ),
                "boost_clock_ghz": (
                    float(self.boost_clock_ghz)
                    if self.boost_clock_ghz is not None
                    else None
                ),
                "l3_cache_mb": (
                    float(self.l3_cache_mb)
                    if self.l3_cache_mb is not None
                    else None
                ),
            }
        return {
            **common,
            "chipset": self.chipset,
            "form_factor": self.form_factor,
            "ram_type": self.ram_type,
            "ram_slots": self.ram_slots,
            "m2_slots": self.m2_slots,
            "cpu_power_8pin_count": self.cpu_power_8pin_count,
        }


def read_manifest(path: Path) -> list[CanonicalProduct]:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ManifestValidationError(f"Could not read manifest: {exc}") from exc
    if not isinstance(raw, dict) or not isinstance(raw.get("products"), list):
        raise ManifestValidationError("Manifest must contain a products array")

    products: list[CanonicalProduct] = []
    errors: list[str] = []
    seen: set[tuple[str, str, str]] = set()
    for index, item in enumerate(raw["products"], start=1):
        try:
            product = _parse_product(item)
            key = (
                product.category,
                product.brand.casefold(),
                product.model_number.casefold(),
            )
            if key in seen:
                raise ManifestValidationError("duplicate category/brand/model")
            seen.add(key)
            products.append(product)
        except (KeyError, TypeError, ValueError, ManifestValidationError) as exc:
            errors.append(f"product {index}: {exc}")
    if errors:
        raise ManifestValidationError("; ".join(errors))
    if not products:
        raise ManifestValidationError("Manifest contains no products")
    return products


def _parse_product(item: object) -> CanonicalProduct:
    if not isinstance(item, dict):
        raise ManifestValidationError("must be an object")
    category = _required_text(item, "category")
    brand = _required_text(item, "brand")
    name = _required_text(item, "name")
    model_number = _required_text(item, "model_number")
    source_url = _required_text(item, "source_url")
    socket = _optional_text(item.get("socket"))

    if category not in ALLOWED_CATEGORIES:
        raise ManifestValidationError(f"unsupported category {category!r}")
    if brand not in OFFICIAL_DOMAINS:
        raise ManifestValidationError(f"unsupported brand {brand!r}")
    parsed_url = urlparse(source_url)
    host = (parsed_url.hostname or "").casefold().removeprefix("www.")
    if parsed_url.scheme != "https" or not any(
        host == domain or host.endswith(f".{domain}")
        for domain in OFFICIAL_DOMAINS[brand]
    ):
        raise ManifestValidationError(
            f"source_url must be an official {brand} HTTPS URL"
        )

    checked_at_raw = _required_text(item, "checked_at")
    checked_at = datetime.fromisoformat(checked_at_raw.replace("Z", "+00:00"))
    if checked_at.tzinfo is None:
        raise ManifestValidationError("checked_at must include a timezone")

    ram_types = tuple(item.get("ram_types") or ())
    ram_type = _optional_text(item.get("ram_type"))
    form_factor = _optional_text(item.get("form_factor"))
    if any(value not in ALLOWED_RAM_TYPES for value in ram_types):
        raise ManifestValidationError("ram_types contains an unsupported value")
    if ram_type is not None and ram_type not in ALLOWED_RAM_TYPES:
        raise ManifestValidationError("ram_type is unsupported")
    if form_factor is not None and form_factor not in ALLOWED_FORM_FACTORS:
        raise ManifestValidationError("form_factor is unsupported")

    if category == "processors" and not ram_types:
        raise ManifestValidationError("processor ram_types is required")
    if category == "motherboards" and ram_type is None:
        raise ManifestValidationError("motherboard ram_type is required")

    return CanonicalProduct(
        category=category,
        brand=brand,
        name=name,
        model_number=model_number,
        source_url=source_url,
        checked_at=checked_at,
        socket=socket,
        image_url=_optional_text(item.get("image_url")),
        tdp_w=_decimal_or_none(item.get("tdp_w")),
        max_power_w=_decimal_or_none(item.get("max_power_w")),
        ram_types=ram_types,
        core_count=_positive_int_or_none(item.get("core_count")),
        thread_count=_positive_int_or_none(item.get("thread_count")),
        base_clock_ghz=_decimal_or_none(item.get("base_clock_ghz")),
        boost_clock_ghz=_decimal_or_none(item.get("boost_clock_ghz")),
        l3_cache_mb=_decimal_or_none(item.get("l3_cache_mb")),
        chipset=_optional_text(item.get("chipset")),
        form_factor=form_factor,
        ram_type=ram_type,
        ram_slots=_nonnegative_int_or_none(item.get("ram_slots")),
        m2_slots=_nonnegative_int_or_none(item.get("m2_slots")),
        cpu_power_8pin_count=_nonnegative_int_or_none(
            item.get("cpu_power_8pin_count")
        ),
    )


def _required_text(item: dict, key: str) -> str:
    value = _optional_text(item.get(key))
    if value is None:
        raise ManifestValidationError(f"{key} is required")
    return value


def _optional_text(value: object) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ManifestValidationError("expected text")
    value = value.strip()
    return value or None


def _decimal_or_none(value: object) -> Decimal | None:
    if value is None:
        return None
    result = Decimal(str(value))
    if not result.is_finite() or result < 0:
        raise ManifestValidationError("numeric values must be non-negative")
    return result


def _nonnegative_int_or_none(value: object) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ManifestValidationError("count values must be non-negative integers")
    return value


def _positive_int_or_none(value: object) -> int | None:
    result = _nonnegative_int_or_none(value)
    if result == 0:
        raise ManifestValidationError("count values must be positive integers")
    return result
