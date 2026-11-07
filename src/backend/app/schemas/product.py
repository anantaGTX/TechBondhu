from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MerchantOffer(BaseModel):
    id: UUID
    merchant_name: str
    merchant_slug: str
    merchant_logo_url: str | None = None
    title: str
    product_url: str
    price: float
    currency: str
    stock: str
    last_checked_at: datetime | None = None
    price_history: list["PricePoint"] = Field(default_factory=list)


class PricePoint(BaseModel):
    price: float
    currency: str
    captured_at: datetime


class ProductSummary(BaseModel):
    id: UUID
    name: str
    slug: str
    brand_name: str | None = None
    category_name: str
    category_slug: str
    model_number: str | None = None
    image_url: str | None = None
    lowest_price: float | None = None
    currency: str = "BDT"
    offer_count: int = 0
    socket: str | None = None
    tdp_w: float | None = None
    core_count: int | None = None
    thread_count: int | None = None
    base_clock_ghz: float | None = None
    boost_clock_ghz: float | None = None
    l3_cache_mb: float | None = None
    offers: list[MerchantOffer] = Field(default_factory=list)


class ProductDetail(BaseModel):
    id: UUID
    name: str
    slug: str
    model_number: str | None = None
    description: str | None = None
    image_url: str | None = None
    brand_name: str | None = None
    category_name: str
    category_slug: str
    socket: str | None = None
    tdp_w: float | None = None
    max_power_w: float | None = None
    ram_types: list[str] = Field(default_factory=list)
    core_count: int | None = None
    thread_count: int | None = None
    base_clock_ghz: float | None = None
    boost_clock_ghz: float | None = None
    l3_cache_mb: float | None = None
    specification_source_url: str | None = None
    offers: list[MerchantOffer]

