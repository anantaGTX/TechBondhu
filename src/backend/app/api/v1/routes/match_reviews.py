from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from postgrest.exceptions import APIError

from app.core.auth import CurrentAdmin
from app.repositories.match_review_repository import (
    MatchReviewConflictError,
    MatchReviewNotFoundError,
)
from app.schemas.match_review import (
    MatchReviewDecision,
    MatchReviewItem,
    MatchReviewResult,
)
from app.services.match_review_service import MatchReviewService

router = APIRouter()


@router.get("", response_model=list[MatchReviewItem])
def list_match_reviews(
    _: CurrentAdmin,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[MatchReviewItem]:
    return MatchReviewService().list_pending(limit=limit, offset=offset)


@router.post("/{match_id}/decision", response_model=MatchReviewResult)
def decide_match_review(
    match_id: UUID,
    body: MatchReviewDecision,
    admin: CurrentAdmin,
) -> MatchReviewResult:
    try:
        return MatchReviewService().review(
            match_id=match_id,
            decision=body.decision,
            reviewed_by=admin.id,
        )
    except MatchReviewNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match proposal was not found.",
        ) from exc
    except MatchReviewConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The proposal cannot be reviewed in its current state.",
        ) from exc
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The catalog database rejected the review operation.",
        ) from exc
