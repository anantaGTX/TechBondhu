from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.schemas.common import Page
from app.schemas.product import ProductDetail, ProductSummary
from app.services.product_service import ProductService

router = APIRouter()


def get_product_service() -> ProductService:
    return ProductService()


ProductServiceDependency = Annotated[ProductService, Depends(get_product_service)]


@router.get("", response_model=Page[ProductSummary])
def list_products(
    service: ProductServiceDependency,
    query: str | None = None,
    category: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[ProductSummary]:
    return service.list_products(
        query=query,
        category=category,
        page=page,
        page_size=page_size,
    )


@router.get("/{slug}", response_model=ProductDetail)
def get_product(slug: str, service: ProductServiceDependency) -> ProductDetail:
    product = service.get_product(slug)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product was not found.",
        )
    return product

