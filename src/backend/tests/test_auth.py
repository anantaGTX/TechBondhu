import asyncio

from httpx import ASGITransport, AsyncClient, Response

from app.main import app


def test_current_user_requires_authentication() -> None:
    async def request_current_user() -> Response:
        transport = ASGITransport(app=app)
        async with AsyncClient(
            transport=transport,
            base_url="http://testserver",
        ) as client:
            return await client.get("/api/v1/auth/me")

    response = asyncio.run(request_current_user())

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication is required."}

