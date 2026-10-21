from app.schemas.common import Page
from app.schemas.product import ProductSummary


class ProductService:
    async def list_products(
        self,
        *,
        query: str | None,
        page: int,
        page_size: int,
    ) -> Page[ProductSummary]:
        # Repository integration will be added with the first catalog migration.
        _ = query
        return Page(items=[], page=page, page_size=page_size, total=0)

