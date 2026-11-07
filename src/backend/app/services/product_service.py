from app.repositories.product_repository import ProductRepository
from app.schemas.common import Page
from app.schemas.product import (
    MerchantOffer,
    PricePoint,
    ProductDetail,
    ProductSummary,
)


class ProductService:
    def __init__(self, repository: ProductRepository | None = None) -> None:
        self.repository = repository or ProductRepository()

    def list_products(
        self,
        *,
        query: str | None,
        category: str | None,
        page: int,
        page_size: int,
    ) -> Page[ProductSummary]:
        rows, total = self.repository.list_products(
            query=query,
            category=category,
            page=page,
            page_size=page_size,
        )
        items = []
        for row in rows:
            active_offers = [
                offer for offer in row.get("offers", []) if offer["is_active"]
            ]
            priced_offers = [offer for offer in active_offers if offer.get("price")]
            merchant_offers = [
                MerchantOffer(
                    id=offer["id"],
                    merchant_name=offer["merchant"]["name"],
                    merchant_slug=offer["merchant"]["slug"],
                    merchant_logo_url=offer["merchant"].get("logo_url"),
                    title=offer["title"],
                    product_url=offer["product_url"],
                    price=offer["price"],
                    currency=offer["currency"],
                    stock=offer["stock"],
                    last_checked_at=offer.get("last_checked_at"),
                )
                for offer in priced_offers
            ]
            merchant_offers.sort(
                key=lambda offer: (_stock_rank(offer.stock), offer.price)
            )
            lowest = (
                float(merchant_offers[0].price) if merchant_offers else None
            )
            currency = (
                priced_offers[0]["currency"] if priced_offers else "BDT"
            )
            brand = row.get("brand")
            cpu_specs = row.get("cpu_specs")
            socket = cpu_specs.get("socket") if cpu_specs else None
            items.append(
                ProductSummary(
                    id=row["id"],
                    name=row["name"],
                    slug=row["slug"],
                    brand_name=brand["name"] if brand else None,
                    category_name=row["category"]["name"],
                    category_slug=row["category"]["slug"],
                    model_number=row.get("model_number"),
                    image_url=row.get("image_url"),
                    lowest_price=lowest,
                    currency=currency,
                    offer_count=len(priced_offers),
                    socket=socket["name"] if socket else None,
                    tdp_w=cpu_specs.get("tdp_w") if cpu_specs else None,
                    core_count=(
                        cpu_specs.get("core_count") if cpu_specs else None
                    ),
                    thread_count=(
                        cpu_specs.get("thread_count") if cpu_specs else None
                    ),
                    base_clock_ghz=(
                        cpu_specs.get("base_clock_ghz") if cpu_specs else None
                    ),
                    boost_clock_ghz=(
                        cpu_specs.get("boost_clock_ghz") if cpu_specs else None
                    ),
                    l3_cache_mb=(
                        cpu_specs.get("l3_cache_mb") if cpu_specs else None
                    ),
                    offers=merchant_offers,
                )
            )
        return Page(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
        )

    def get_product(self, slug: str) -> ProductDetail | None:
        row = self.repository.get_by_slug(slug)
        if row is None:
            return None
        offers = [
            MerchantOffer(
                id=offer["id"],
                merchant_name=offer["merchant"]["name"],
                merchant_slug=offer["merchant"]["slug"],
                merchant_logo_url=offer["merchant"].get("logo_url"),
                title=offer["title"],
                product_url=offer["product_url"],
                price=offer["price"],
                currency=offer["currency"],
                stock=offer["stock"],
                last_checked_at=offer.get("last_checked_at"),
                price_history=sorted(
                    [
                        PricePoint.model_validate(point)
                        for point in offer.get("price_history", [])
                    ],
                    key=lambda point: point.captured_at,
                ),
            )
            for offer in row.get("offers", [])
            if offer["is_active"]
        ]
        offers.sort(key=lambda offer: (_stock_rank(offer.stock), offer.price))
        brand = row.get("brand")
        cpu_specs = row.get("cpu_specs")
        socket = cpu_specs.get("socket") if cpu_specs else None
        return ProductDetail(
            id=row["id"],
            name=row["name"],
            slug=row["slug"],
            model_number=row.get("model_number"),
            description=row.get("description"),
            image_url=row.get("image_url"),
            brand_name=brand["name"] if brand else None,
            category_name=row["category"]["name"],
            category_slug=row["category"]["slug"],
            socket=socket["name"] if socket else None,
            tdp_w=cpu_specs.get("tdp_w") if cpu_specs else None,
            max_power_w=cpu_specs.get("max_power_w") if cpu_specs else None,
            ram_types=cpu_specs.get("ram_types") or [] if cpu_specs else [],
            core_count=cpu_specs.get("core_count") if cpu_specs else None,
            thread_count=cpu_specs.get("thread_count") if cpu_specs else None,
            base_clock_ghz=(
                cpu_specs.get("base_clock_ghz") if cpu_specs else None
            ),
            boost_clock_ghz=(
                cpu_specs.get("boost_clock_ghz") if cpu_specs else None
            ),
            l3_cache_mb=(
                cpu_specs.get("l3_cache_mb") if cpu_specs else None
            ),
            specification_source_url=(
                cpu_specs.get("source_url") if cpu_specs else None
            ),
            offers=offers,
        )


def _stock_rank(stock: str) -> int:
    return {
        "in_stock": 0,
        "preorder": 1,
        "unknown": 2,
        "out_of_stock": 3,
    }.get(stock, 4)

