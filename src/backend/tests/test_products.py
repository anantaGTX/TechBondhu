import asyncio

from httpx import ASGITransport, AsyncClient, Response

from app.api.v1.routes.products import get_product_service
from app.main import app
from app.schemas.common import Page
from app.schemas.product import ProductDetail, ProductSummary


class EmptyProductService:
    def list_products(
        self,
        *,
        query: str | None,
        category: str | None,
        page: int,
        page_size: int,
    ) -> Page[ProductSummary]:
        _ = query, category
        return Page(items=[], page=page, page_size=page_size, total=0)

    def get_product(self, slug: str) -> ProductDetail | None:
        _ = slug
        return None


def test_list_products_starts_empty() -> None:
    async def request_products() -> Response:
        transport = ASGITransport(app=app)
        async with AsyncClient(
            transport=transport,
            base_url="http://testserver",
        ) as client:
            return await client.get("/api/v1/products")

    app.dependency_overrides[get_product_service] = EmptyProductService
    try:
        response = asyncio.run(request_products())
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "items": [],
        "page": 1,
        "page_size": 20,
        "total": 0,
    }

