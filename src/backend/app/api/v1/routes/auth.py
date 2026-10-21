from fastapi import APIRouter

from app.core.auth import CurrentUser
from app.schemas.auth import AuthenticatedUser

router = APIRouter()


@router.get("/me", response_model=AuthenticatedUser)
def read_current_user(current_user: CurrentUser) -> AuthenticatedUser:
    return current_user

