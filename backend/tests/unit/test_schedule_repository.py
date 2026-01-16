"""Unit tests for schedule repository."""
import pytest
from datetime import date, timedelta
from app.models.schedule import ScheduleEvent, EventParticipant, EventType, EventStatus
from app.models.performance import Performance, PerformanceStatus
from app.models.user import User
from app.repositories.schedule_repository import ScheduleEventRepository, EventParticipantRepository

@pytest.mark.asyncio
@pytest.mark.unit
class TestScheduleEventRepository:
    async def test_get_by_date_range(self, test_db):
        repo = ScheduleEventRepository(test_db)
        
        today = date.today()
        tomorrow = today + timedelta(days=1)
        next_week = today + timedelta(days=7)
        
        event1 = ScheduleEvent(title="Event Today", event_date=today, event_type=EventType.PERFORMANCE, status=EventStatus.CONFIRMED)
        event2 = ScheduleEvent(title="Event Tomorrow", event_date=tomorrow, event_type=EventType.REHEARSAL, status=EventStatus.PLANNED)
        event3 = ScheduleEvent(title="Event Next Week", event_date=next_week, event_type=EventType.PERFORMANCE, status=EventStatus.CONFIRMED)
        test_db.add_all([event1, event2, event3])
        await test_db.commit()
        
        results = await repo.get_by_date_range(today, tomorrow)
        assert len(results) == 2
        
        results = await repo.get_by_date_range(today, next_week)
        assert len(results) == 3
    
    async def test_get_by_date_range_with_filters(self, test_db):
        repo = ScheduleEventRepository(test_db)
        
        today = date.today()
        event1 = ScheduleEvent(title="Performance", event_date=today, event_type=EventType.PERFORMANCE, status=EventStatus.CONFIRMED)
        event2 = ScheduleEvent(title="Rehearsal", event_date=today, event_type=EventType.REHEARSAL, status=EventStatus.PLANNED)
        test_db.add_all([event1, event2])
        await test_db.commit()
        
        results = await repo.get_by_date_range(today, today, event_type=EventType.PERFORMANCE)
        assert len(results) == 1
        assert results[0].title == "Performance"
        
        results = await repo.get_by_date_range(today, today, status=EventStatus.CONFIRMED)
        assert len(results) == 1
        assert results[0].title == "Performance"
    
    async def test_get_by_date(self, test_db):
        repo = ScheduleEventRepository(test_db)
        
        today = date.today()
        tomorrow = today + timedelta(days=1)
        
        event1 = ScheduleEvent(title="Today", event_date=today, event_type=EventType.PERFORMANCE, status=EventStatus.CONFIRMED)
        event2 = ScheduleEvent(title="Tomorrow", event_date=tomorrow, event_type=EventType.PERFORMANCE, status=EventStatus.CONFIRMED)
        test_db.add_all([event1, event2])
        await test_db.commit()
        
        results = await repo.get_by_date(today)
        assert len(results) == 1
        assert results[0].title == "Today"
    
    async def test_get_upcoming(self, test_db):
        repo = ScheduleEventRepository(test_db)
        
        today = date.today()
        future = today + timedelta(days=3)
        past = today - timedelta(days=3)
        
        event1 = ScheduleEvent(title="Upcoming", event_date=future, event_type=EventType.PERFORMANCE, status=EventStatus.CONFIRMED)
        event2 = ScheduleEvent(title="Past", event_date=past, event_type=EventType.PERFORMANCE, status=EventStatus.COMPLETED)
        test_db.add_all([event1, event2])
        await test_db.commit()
        
        results = await repo.get_upcoming(days=7)
        assert len(results) >= 1
        assert any(e.title == "Upcoming" for e in results)
    
    async def test_search_events(self, test_db):
        repo = ScheduleEventRepository(test_db)
        
        today = date.today()
        event1 = ScheduleEvent(title="Hamlet Show", event_date=today, event_type=EventType.PERFORMANCE, status=EventStatus.CONFIRMED)
        event2 = ScheduleEvent(title="Romeo Rehearsal", event_date=today, event_type=EventType.REHEARSAL, status=EventStatus.PLANNED)
        test_db.add_all([event1, event2])
        await test_db.commit()
        
        results, total = await repo.search(search="hamlet")
        assert total == 1
        assert results[0].title == "Hamlet Show"
        
        results, total = await repo.search(event_type=EventType.PERFORMANCE)
        assert total == 1
        assert results[0].title == "Hamlet Show"


@pytest.mark.asyncio
@pytest.mark.unit
class TestEventParticipantRepository:
    async def test_get_by_event(self, test_db):
        repo = EventParticipantRepository(test_db)
        
        user = User(email="test@test.com", first_name="Test", last_name="User", hashed_password="hash")
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        event = ScheduleEvent(title="Test Event", event_date=date.today(), event_type=EventType.REHEARSAL, status=EventStatus.PLANNED)
        test_db.add(event)
        await test_db.commit()
        await test_db.refresh(event)
        
        participant = EventParticipant(event_id=event.id, user_id=user.id, role="Actor")
        test_db.add(participant)
        await test_db.commit()
        
        results = await repo.get_by_event(event.id)
        assert len(results) == 1
        assert results[0].role == "Actor"
    
    async def test_get_by_user_and_event(self, test_db):
        repo = EventParticipantRepository(test_db)
        
        user = User(email="actor@test.com", first_name="Actor", last_name="Test", hashed_password="hash")
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        event = ScheduleEvent(title="Performance", event_date=date.today(), event_type=EventType.PERFORMANCE, status=EventStatus.CONFIRMED)
        test_db.add(event)
        await test_db.commit()
        await test_db.refresh(event)
        
        participant = EventParticipant(event_id=event.id, user_id=user.id, role="Lead")
        test_db.add(participant)
        await test_db.commit()
        
        result = await repo.get_by_user_and_event(user.id, event.id)
        assert result is not None
        assert result.role == "Lead"
    
    async def test_get_user_events(self, test_db):
        repo = EventParticipantRepository(test_db)
        
        user = User(email="user@test.com", first_name="User", last_name="Test", hashed_password="hash")
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        today = date.today()
        event1 = ScheduleEvent(title="Event 1", event_date=today, event_type=EventType.REHEARSAL, status=EventStatus.PLANNED)
        event2 = ScheduleEvent(title="Event 2", event_date=today + timedelta(days=1), event_type=EventType.PERFORMANCE, status=EventStatus.CONFIRMED)
        test_db.add_all([event1, event2])
        await test_db.commit()
        await test_db.refresh(event1)
        await test_db.refresh(event2)
        
        participants = [
            EventParticipant(event_id=event1.id, user_id=user.id, role="Actor"),
            EventParticipant(event_id=event2.id, user_id=user.id, role="Director"),
        ]
        test_db.add_all(participants)
        await test_db.commit()
        
        results = await repo.get_user_events(user.id)
        assert len(results) == 2
