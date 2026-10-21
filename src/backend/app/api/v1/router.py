from fastapi import APIRouter

from app.api.v1.routes import auth, health, products

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(auth.router, prefix="/auth", tags=["authentication"])
router.include_router(products.router, prefix="/products", tags=["products"])

