from uuid import UUID

from pydantic import BaseModel


class ProductSummary(BaseModel):
    id: UUID
    name: str
    slug: str
    brand_name: str | None = None
    category_name: str
    lowest_price: float | None = None
    currency: str = "BDT"

