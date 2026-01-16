"""
Unit-тесты для ScheduleService.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import date, time, datetime

from app.services.schedule_service import ScheduleService
from app.models.schedule import ScheduleEvent, EventStatus, EventType, EventParticipant, ParticipantStatus
from app.core.exceptions import ValidationError


@pytest.mark.asyncio
@pytest.mark.service
class TestScheduleServiceEvents:
    """Тесты для работы с событиями."""

    async def test_confirm_event_success(self):
        """Успешное подтверждение события."""
        mock_session = AsyncMock()
        service = ScheduleService(mock_session)
        
        event = ScheduleEvent(
            id=1,
            title="Репетиция",
            event_type=EventType.REHEARSAL,
            status=EventStatus.PLANNED,
            event_date=date(2026, 2, 1),
            start_time=time(10, 0),
        )
        
        service._event_repo.get_with_relations = AsyncMock(return_value=event)
        service._event_repo.update_by_id = AsyncMock()
        service._event_repo.get_with_relations = AsyncMock(
            return_value=ScheduleEvent(
                id=1,
                title="Репетиция",
                event_type=EventType.REHEARSAL,
                status=EventStatus.CONFIRMED,
                event_date=date(2026, 2, 1),
                start_time=time(10, 0),
            )
        )
        
        result = await service.confirm_event(event_id=1, user_id=1)
        
        assert result.status == EventStatus.CONFIRMED
        mock_session.commit.assert_called_once()

    async def test_start_event_success(self):
        """Успешное начало события."""
        mock_session = AsyncMock()
        service = ScheduleService(mock_session)
        
        event = ScheduleEvent(
            id=1,
            title="Спектакль",
            event_type=EventType.PERFORMANCE,
            status=EventStatus.CONFIRMED,
            event_date=date.today(),
            start_time=time(19, 0),
        )
        
        service._event_repo.get_with_relations = AsyncMock(return_value=event)
        service._event_repo.update_by_id = AsyncMock()
        service._event_repo.get_with_relations = AsyncMock(
            return_value=ScheduleEvent(
                id=1,
                title="Спектакль",
                event_type=EventType.PERFORMANCE,
                status=EventStatus.IN_PROGRESS,
                event_date=date.today(),
                start_time=time(19, 0),
            )
        )
        
        result = await service.start_event(event_id=1, user_id=1)
        
        assert result.status == EventStatus.IN_PROGRESS
        mock_session.commit.assert_called_once()

    async def test_complete_event_success(self):
        """Успешное завершение события."""
        mock_session = AsyncMock()
        service = ScheduleService(mock_session)
        
        event = ScheduleEvent(
            id=1,
            title="Спектакль",
            event_type=EventType.PERFORMANCE,
            status=EventStatus.IN_PROGRESS,
            event_date=date.today(),
            start_time=time(19, 0),
        )
        
        service._event_repo.get_with_relations = AsyncMock(return_value=event)
        service._event_repo.update_by_id = AsyncMock()
        service._event_repo.get_with_relations = AsyncMock(
            return_value=ScheduleEvent(
                id=1,
                title="Спектакль",
                event_type=EventType.PERFORMANCE,
                status=EventStatus.COMPLETED,
                event_date=date.today(),
                start_time=time(19, 0),
            )
        )
        
        result = await service.complete_event(event_id=1, user_id=1)
        
        assert result.status == EventStatus.COMPLETED
        mock_session.commit.assert_called_once()

    async def test_cancel_completed_event_fails(self):
        """Попытка отменить завершённое событие."""
        mock_session = AsyncMock()
        service = ScheduleService(mock_session)
        
        event = ScheduleEvent(
            id=1,
            title="Завершённый спектакль",
            status=EventStatus.COMPLETED,
            event_date=date.today(),
            start_time=time(19, 0),
        )
        
        service._event_repo.get_with_relations = AsyncMock(return_value=event)
        
        with pytest.raises(ValidationError):
            await service.cancel_event(event_id=1, user_id=1)


@pytest.mark.asyncio
@pytest.mark.service
class TestScheduleServiceParticipants:
    """Тесты для работы с участниками."""

    async def test_add_participant_success(self):
        """Успешное добавление участника."""
        mock_session = AsyncMock()
        service = ScheduleService(mock_session)
        
        event = ScheduleEvent(id=1, title="Репетиция", event_date=date.today(), start_time=time(10, 0))
        service._event_repo.get_with_relations = AsyncMock(return_value=event)
        service._participant_repo.get_by_user_and_event = AsyncMock(return_value=None)
        service._participant_repo.get_by_id = AsyncMock(
            return_value=EventParticipant(
                id=1,
                event_id=1,
                user_id=5,
                role="Актёр",
                status=ParticipantStatus.INVITED,
            )
        )
        
        from app.schemas.schedule import ParticipantCreate
        data = ParticipantCreate(
            user_id=5,
            role="Актёр",
            status=ParticipantStatus.INVITED,
        )
        
        result = await service.add_participant(event_id=1, data=data)
        
        assert result.user_id == 5
        mock_session.commit.assert_called_once()

    async def test_add_duplicate_participant_fails(self):
        """Попытка добавить дублирующегося участника."""
        mock_session = AsyncMock()
        service = ScheduleService(mock_session)
        
        event = ScheduleEvent(id=1, title="Репетиция", event_date=date.today(), start_time=time(10, 0))
        existing_participant = EventParticipant(id=1, event_id=1, user_id=5)
        
        service._event_repo.get_with_relations = AsyncMock(return_value=event)
        service._participant_repo.get_by_user_and_event = AsyncMock(return_value=existing_participant)
        
        from app.schemas.schedule import ParticipantCreate
        data = ParticipantCreate(user_id=5, role="Актёр", status=ParticipantStatus.INVITED)
        
        with pytest.raises(ValidationError):
            await service.add_participant(event_id=1, data=data)


@pytest.mark.asyncio
@pytest.mark.service
class TestScheduleServiceStats:
    """Тесты для статистики."""

    async def test_get_stats(self):
        """Получение статистики расписания."""
        mock_session = AsyncMock()
        service = ScheduleService(mock_session)
        
        service._event_repo.get_stats = AsyncMock(return_value={
            "total_events": 200,
            "planned": 50,
            "confirmed": 80,
            "completed": 60,
            "cancelled": 10,
            "performances_count": 100,
            "rehearsals_count": 80,
            "other_count": 20,
            "upcoming_events": 30,
        })
        
        result = await service.get_stats(theater_id=1)
        
        assert result.total_events == 200
        assert result.planned == 50
        assert result.confirmed == 80
        assert result.completed == 60
        assert result.performances_count == 100
        assert result.upcoming_events == 30
