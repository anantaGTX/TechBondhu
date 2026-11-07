from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class MatchReviewItem(BaseModel):
    id: UUID
    confidence: float = Field(ge=0, le=1)
    method: str
    reason: str | None = None
    created_at: datetime
    listing_candidate_id: UUID
    listing_title: str
    product_url: str
    price: float | None
    currency: str
    stock: str
    merchant_name: str
    product_id: UUID
    product_name: str
    model_number: str | None
    brand_name: str | None
    category_slug: str


class MatchReviewDecision(BaseModel):
    decision: Literal["approved", "rejected"]


class MatchReviewResult(BaseModel):
    match_id: UUID
    status: Literal["approved", "rejected"]
    listing_id: UUID | None = None
