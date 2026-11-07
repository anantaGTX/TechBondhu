import asyncio
from typing import Any
from uuid import UUID

from httpx import ASGITransport, AsyncClient, Response

from app.main import app
from app.repositories.match_review_repository import MatchReviewRepository
from app.services.match_review_service import MatchReviewService

MATCH_ID = UUID("11111111-1111-4111-8111-111111111111")
LISTING_ID = UUID("22222222-2222-4222-8222-222222222222")
PRODUCT_ID = UUID("33333333-3333-4333-8333-333333333333")


class FakeMatchReviewRepository(MatchReviewRepository):
    def list_pending(self, *, limit: int, offset: int) -> list[dict[str, Any]]:
        assert limit == 20
        assert offset == 0
        return [
            {
                "id": str(MATCH_ID),
                "confidence": 0.95,
                "method": "model_number",
                "reason": "Exact normalized model match.",
                "created_at": "2026-11-07T12:00:00Z",
                "listing": {
                    "id": str(LISTING_ID),
                    "title": "AMD Ryzen 5 7600 Processor",
                    "product_url": "https://shop.example/ryzen-5-7600",
                    "price": 21500,
                    "currency": "BDT",
                    "stock": "in_stock",
                    "merchant": {"name": "Example Shop"},
                },
                "product": {
                    "id": str(PRODUCT_ID),
                    "name": "AMD Ryzen 5 7600",
                    "model_number": "Ryzen 5 7600",
                    "brand": {"name": "AMD"},
                    "category": {"slug": "processors"},
                },
            }
        ]

    def review(
        self,
        *,
        match_id: UUID,
        decision: str,
        reviewed_by: str,
    ) -> dict[str, Any]:
        assert match_id == MATCH_ID
        assert decision == "approved"
        assert reviewed_by == "admin-id"
        return {
            "match_id": str(MATCH_ID),
            "status": "approved",
            "listing_id": str(LISTING_ID),
        }


def test_service_flattens_review_queue_rows() -> None:
    service = MatchReviewService(FakeMatchReviewRepository())

    item = service.list_pending(limit=20, offset=0)[0]

    assert item.id == MATCH_ID
    assert item.product_name == "AMD Ryzen 5 7600"
    assert item.merchant_name == "Example Shop"
    assert item.price == 21500


def test_service_returns_review_result() -> None:
    service = MatchReviewService(FakeMatchReviewRepository())

    result = service.review(
        match_id=MATCH_ID,
        decision="approved",
        reviewed_by="admin-id",
    )

    assert result.status == "approved"
    assert result.listing_id == LISTING_ID


def test_review_queue_requires_authentication() -> None:
    async def request_reviews() -> Response:
        transport = ASGITransport(app=app)
        async with AsyncClient(
            transport=transport,
            base_url="http://testserver",
        ) as client:
            return await client.get("/api/v1/admin/product-matches")

    response = asyncio.run(request_reviews())

    assert response.status_code == 401
