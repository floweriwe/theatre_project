import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.integration
class TestDocumentAPI:
    async def test_get_documents_success(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/documents')
        assert response.status_code == 200
        data = response.json()
        assert 'items' in data

    async def test_get_documents_unauthorized(self, async_client: AsyncClient):
        response = await async_client.get('/api/v1/documents')
        assert response.status_code == 401

    async def test_get_document_not_found(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/documents/99999')
        assert response.status_code == 404

    async def test_get_categories_success(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/documents/categories/')
        assert response.status_code == 200

    async def test_get_stats_success(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/documents/stats/')
        assert response.status_code == 200
