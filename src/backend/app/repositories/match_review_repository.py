from typing import Any, cast
from uuid import UUID

from postgrest.exceptions import APIError

from app.integrations.supabase import get_service_role_client


class MatchReviewNotFoundError(Exception):
    pass


class MatchReviewConflictError(Exception):
    pass


class MatchReviewRepository:
    def list_pending(self, *, limit: int, offset: int) -> list[dict[str, Any]]:
        client = get_service_role_client()
        response = (
            client.table("product_match_candidates")
            .select(
                "id,confidence,method,reason,created_at,"
                "listing:merchant_listing_candidates!inner("
                "id,title,product_url,price,currency,stock,"
                "merchant:merchants!inner(name)),"
                "product:products!inner("
                "id,name,model_number,brand:brands(name),"
                "category:categories!inner(slug))"
            )
            .eq("status", "needs_review")
            .order("confidence", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return cast(list[dict[str, Any]], response.data)

    def review(
        self,
        *,
        match_id: UUID,
        decision: str,
        reviewed_by: str,
    ) -> dict[str, Any]:
        client = get_service_role_client()
        try:
            response = client.rpc(
                "review_product_match",
                {
                    "p_match_id": str(match_id),
                    "p_decision": decision,
                    "p_reviewed_by": reviewed_by,
                },
            ).execute()
        except APIError as exc:
            message = str(exc)
            if "match_not_found" in message:
                raise MatchReviewNotFoundError from exc
            if any(
                value in message
                for value in (
                    "match_already_reviewed",
                    "listing_candidate_has_no_price",
                    "listing_candidate_is_rejected",
                )
            ):
                raise MatchReviewConflictError(message) from exc
            raise
        if not isinstance(response.data, dict):
            raise RuntimeError("Unexpected review_product_match response")
        return response.data
