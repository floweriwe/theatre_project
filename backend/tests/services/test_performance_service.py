"""
Unit-тесты для PerformanceService.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.performance_service import PerformanceService
from app.models.performance import Performance, PerformanceStatus
from app.core.exceptions import ValidationError


@pytest.mark.asyncio
@pytest.mark.service
class TestPerformanceServiceStatus:
    """Тесты для управления статусами спектаклей."""

    async def test_to_repertoire_success(self):
        """Успешный переход в репертуар."""
        mock_session = AsyncMock()
        service = PerformanceService(mock_session)
        
        performance = Performance(
            id=1, title="Тест", status=PerformanceStatus.PREPARATION
        )
        
        service._performance_repo.get_with_sections = AsyncMock(return_value=performance)
        service._performance_repo.update_by_id = AsyncMock()
        service._performance_repo.get_with_sections = AsyncMock(
            return_value=Performance(id=1, title="Тест", status=PerformanceStatus.IN_REPERTOIRE)
        )
        
        result = await service.to_repertoire(performance_id=1, user_id=1)
        
        assert result.status == PerformanceStatus.IN_REPERTOIRE
        mock_session.commit.assert_called_once()

    async def test_invalid_transition_fails(self):
        """Недопустимый переход вызывает ошибку."""
        mock_session = AsyncMock()
        service = PerformanceService(mock_session)
        
        performance = Performance(id=1, title="Тест", status=PerformanceStatus.PAUSED)
        service._performance_repo.get_with_sections = AsyncMock(return_value=performance)
        
        with pytest.raises(ValidationError):
            await service.change_status(1, PerformanceStatus.PREPARATION, user_id=1)


@pytest.mark.asyncio
@pytest.mark.service
class TestPerformanceServiceStats:
    """Тесты для статистики."""

    async def test_get_stats(self):
        """Получение статистики."""
        mock_session = AsyncMock()
        service = PerformanceService(mock_session)
        
        service._performance_repo.get_stats = AsyncMock(return_value={
            "total_performances": 25,
            "preparation": 5,
            "in_repertoire": 12,
            "paused": 3,
            "archived": 5,
            "genres": ["драма"],
        })
        
        result = await service.get_stats(theater_id=1)
        
        assert result.total_performances == 25
        assert result.in_repertoire == 12
