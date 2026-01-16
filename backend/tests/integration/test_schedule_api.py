import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.integration
class TestScheduleAPI:
    async def test_get_events_success(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/schedule')
        assert response.status_code == 200
        data = response.json()
        assert 'items' in data

    async def test_get_events_unauthorized(self, async_client: AsyncClient):
        response = await async_client.get('/api/v1/schedule')
        assert response.status_code == 401

    async def test_get_event_not_found(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/schedule/99999')
        assert response.status_code == 404

    async def test_get_calendar_success(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/schedule/calendar/2026/2')
        assert response.status_code == 200

    async def test_get_stats_success(self, authorized_client: AsyncClient):
        response = await authorized_client.get('/api/v1/schedule/stats/')
        assert response.status_code == 200
