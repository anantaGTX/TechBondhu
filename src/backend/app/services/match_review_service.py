from uuid import UUID

from app.repositories.match_review_repository import MatchReviewRepository
from app.schemas.match_review import MatchReviewItem, MatchReviewResult


class MatchReviewService:
    def __init__(self, repository: MatchReviewRepository | None = None) -> None:
        self.repository = repository or MatchReviewRepository()

    def list_pending(self, *, limit: int, offset: int) -> list[MatchReviewItem]:
        rows = self.repository.list_pending(limit=limit, offset=offset)
        return [self._to_item(row) for row in rows]

    def review(
        self,
        *,
        match_id: UUID,
        decision: str,
        reviewed_by: str,
    ) -> MatchReviewResult:
        row = self.repository.review(
            match_id=match_id,
            decision=decision,
            reviewed_by=reviewed_by,
        )
        return MatchReviewResult.model_validate(row)

    @staticmethod
    def _to_item(row: dict) -> MatchReviewItem:
        listing = row["listing"]
        product = row["product"]
        brand = product.get("brand")
        return MatchReviewItem(
            id=row["id"],
            confidence=row["confidence"],
            method=row["method"],
            reason=row.get("reason"),
            created_at=row["created_at"],
            listing_candidate_id=listing["id"],
            listing_title=listing["title"],
            product_url=listing["product_url"],
            price=listing.get("price"),
            currency=listing["currency"],
            stock=listing["stock"],
            merchant_name=listing["merchant"]["name"],
            product_id=product["id"],
            product_name=product["name"],
            model_number=product.get("model_number"),
            brand_name=brand["name"] if brand else None,
            category_slug=product["category"]["slug"],
        )
