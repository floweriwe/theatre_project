"""Integration tests for Inventory API endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.integration
class TestInventoryItemsAPI:
    async def test_get_items_success(self, authorized_client: AsyncClient):
        response = await authorized_client.get("/api/v1/inventory/items")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

    async def test_get_items_unauthorized(self, async_client: AsyncClient):
        response = await async_client.get("/api/v1/inventory/items")
        assert response.status_code == 401

    async def test_get_item_not_found(self, authorized_client: AsyncClient):
        response = await authorized_client.get("/api/v1/inventory/items/99999")
        assert response.status_code == 404

    async def test_get_stats_success(self, authorized_client: AsyncClient):
        response = await authorized_client.get("/api/v1/inventory/stats")
        assert response.status_code == 200
