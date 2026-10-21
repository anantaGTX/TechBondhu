from fastapi import APIRouter, Query

from app.schemas.common import Page
from app.schemas.product import ProductSummary
from app.services.product_service import ProductService

router = APIRouter()


@router.get("", response_model=Page[ProductSummary])
async def list_products(
    query: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[ProductSummary]:
    service = ProductService()
    return await service.list_products(query=query, page=page, page_size=page_size)

