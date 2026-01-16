import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.integration
class TestPerformanceAPI:
    async def test_get_performances_success(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/performances')
        assert response.status_code == 200
        data = response.json()
        assert 'items' in data

    async def test_get_performances_unauthorized(self, async_client: AsyncClient):
        response = await async_client.get('/api/v1/performances')
        assert response.status_code == 401

    async def test_get_performance_not_found(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/performances/99999')
        assert response.status_code == 404

    async def test_get_repertoire_success(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/performances/repertoire')
        assert response.status_code == 200
