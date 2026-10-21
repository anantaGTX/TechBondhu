import asyncio

from httpx import ASGITransport, AsyncClient, Response

from app.main import app


def test_list_products_starts_empty() -> None:
    async def request_products() -> Response:
        transport = ASGITransport(app=app)
        async with AsyncClient(
            transport=transport,
            base_url="http://testserver",
        ) as client:
            return await client.get("/api/v1/products")

    response = asyncio.run(request_products())

    assert response.status_code == 200
    assert response.json() == {
        "items": [],
        "page": 1,
        "page_size": 20,
        "total": 0,
    }

