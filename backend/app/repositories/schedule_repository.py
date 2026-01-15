"""
Репозиторий модуля расписания.

Содержит классы для работы с БД:
- ScheduleEventRepository
- EventParticipantRepository
"""
from datetime import date, datetime, timedelta
from typing import Sequence

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.schedule import (
    ScheduleEvent,
    EventParticipant,
    EventType,
    EventStatus,
)
from app.models.performance import Performance
from app.repositories.base import BaseRepository


class ScheduleEventRepository(BaseRepository[ScheduleEvent]):
    """Репозиторий для работы с событиями расписания."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(ScheduleEvent, session)
    
    async def get_with_relations(self, event_id: int) -> ScheduleEvent | None:
        """Получить событие со связями."""
        query = (
            select(ScheduleEvent)
            .options(
                selectinload(ScheduleEvent.participants),
                selectinload(ScheduleEvent.performance),
            )
            .where(ScheduleEvent.id == event_id)
        )
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_date_range(
        self,
        date_from: date,
        date_to: date,
        theater_id: int | None = None,
        event_type: EventType | None = None,
        status: EventStatus | None = None,
        performance_id: int | None = None,
    ) -> Sequence[ScheduleEvent]:
        """Получить события за период."""
        query = (
            select(ScheduleEvent)
            .options(selectinload(ScheduleEvent.performance))
            .where(ScheduleEvent.is_active.is_(True))
            .where(ScheduleEvent.event_date >= date_from)
            .where(ScheduleEvent.event_date <= date_to)
            .order_by(ScheduleEvent.event_date, ScheduleEvent.start_time)
        )
        
        if theater_id:
            query = query.where(ScheduleEvent.theater_id == theater_id)
        
        if event_type:
            query = query.where(ScheduleEvent.event_type == event_type)
        
        if status:
            query = query.where(ScheduleEvent.status == status)
        
        if performance_id:
            query = query.where(ScheduleEvent.performance_id == performance_id)
        
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_by_date(
        self,
        event_date: date,
        theater_id: int | None = None,
    ) -> Sequence[ScheduleEvent]:
        """Получить события на конкретную дату."""
        return await self.get_by_date_range(
            event_date, event_date, theater_id
        )
    
    async def get_upcoming(
        self,
        days: int = 7,
        theater_id: int | None = None,
        limit: int = 10,
    ) -> Sequence[ScheduleEvent]:
        """Получить предстоящие события."""
        today = date.today()
        end_date = today + timedelta(days=days)
        
        query = (
            select(ScheduleEvent)
            .options(selectinload(ScheduleEvent.performance))
            .where(ScheduleEvent.is_active.is_(True))
            .where(ScheduleEvent.event_date >= today)
            .where(ScheduleEvent.event_date <= end_date)
            .where(ScheduleEvent.status.in_([EventStatus.PLANNED, EventStatus.CONFIRMED]))
            .order_by(ScheduleEvent.event_date, ScheduleEvent.start_time)
            .limit(limit)
        )
        
        if theater_id:
            query = query.where(ScheduleEvent.theater_id == theater_id)
        
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def search(
        self,
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        event_type: EventType | None = None,
        status: EventStatus | None = None,
        performance_id: int | None = None,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[ScheduleEvent], int]:
        """Поиск событий с фильтрацией."""
        query = (
            select(ScheduleEvent)
            .options(selectinload(ScheduleEvent.performance))
        )
        count_query = select(func.count(ScheduleEvent.id))
        
        filters = [ScheduleEvent.is_active.is_(True)]
        
        if search:
            filters.append(
                or_(
                    ScheduleEvent.title.ilike(f"%{search}%"),
                    ScheduleEvent.venue.ilike(f"%{search}%"),
                )
            )
        
        if date_from:
            filters.append(ScheduleEvent.event_date >= date_from)
        
        if date_to:
            filters.append(ScheduleEvent.event_date <= date_to)
        
        if event_type:
            filters.append(ScheduleEvent.event_type == event_type)
        
        if status:
            filters.append(ScheduleEvent.status == status)
        
        if performance_id:
            filters.append(ScheduleEvent.performance_id == performance_id)
        
        if theater_id:
            filters.append(ScheduleEvent.theater_id == theater_id)
        
        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))
        
        # Общее количество
        total_result = await self._session.execute(count_query)
        total = total_result.scalar() or 0
        
        # Результаты
        query = (
            query
            .order_by(ScheduleEvent.event_date.desc(), ScheduleEvent.start_time)
            .offset(skip)
            .limit(limit)
        )
        
        result = await self._session.execute(query)
        events = result.scalars().all()
        
        return events, total
    
    async def get_stats(self, theater_id: int | None = None) -> dict:
        """Получить статистику расписания."""
        base_filter = ScheduleEvent.is_active.is_(True)
        if theater_id:
            base_filter = and_(base_filter, ScheduleEvent.theater_id == theater_id)
        
        stats = {}
        
        # Общее количество
        total_query = select(func.count(ScheduleEvent.id)).where(base_filter)
        total_result = await self._session.execute(total_query)
        stats["total_events"] = total_result.scalar() or 0
        
        # По статусам
        for status in [EventStatus.PLANNED, EventStatus.CONFIRMED, EventStatus.COMPLETED, EventStatus.CANCELLED]:
            status_query = (
                select(func.count(ScheduleEvent.id))
                .where(base_filter)
                .where(ScheduleEvent.status == status)
            )
            result = await self._session.execute(status_query)
            stats[status.value] = result.scalar() or 0
        
        # По типам
        perf_query = (
            select(func.count(ScheduleEvent.id))
            .where(base_filter)
            .where(ScheduleEvent.event_type == EventType.PERFORMANCE)
        )
        perf_result = await self._session.execute(perf_query)
        stats["performances_count"] = perf_result.scalar() or 0
        
        rehearsal_types = [
            EventType.REHEARSAL,
            EventType.TECH_REHEARSAL,
            EventType.DRESS_REHEARSAL,
        ]
        reh_query = (
            select(func.count(ScheduleEvent.id))
            .where(base_filter)
            .where(ScheduleEvent.event_type.in_(rehearsal_types))
        )
        reh_result = await self._session.execute(reh_query)
        stats["rehearsals_count"] = reh_result.scalar() or 0
        
        stats["other_count"] = (
            stats["total_events"] 
            - stats["performances_count"] 
            - stats["rehearsals_count"]
        )
        
        # Предстоящие события
        today = date.today()
        upcoming_query = (
            select(func.count(ScheduleEvent.id))
            .where(base_filter)
            .where(ScheduleEvent.event_date >= today)
            .where(ScheduleEvent.status.in_([EventStatus.PLANNED, EventStatus.CONFIRMED]))
        )
        upcoming_result = await self._session.execute(upcoming_query)
        stats["upcoming_events"] = upcoming_result.scalar() or 0
        
        return stats


class EventParticipantRepository(BaseRepository[EventParticipant]):
    """Репозиторий для работы с участниками событий."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(EventParticipant, session)
    
    async def get_by_event(self, event_id: int) -> Sequence[EventParticipant]:
        """Получить участников события."""
        query = (
            select(EventParticipant)
            .options(selectinload(EventParticipant.user))
            .where(EventParticipant.event_id == event_id)
        )
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_by_user_and_event(
        self,
        user_id: int,
        event_id: int,
    ) -> EventParticipant | None:
        """Найти участника по пользователю и событию."""
        query = (
            select(EventParticipant)
            .where(EventParticipant.user_id == user_id)
            .where(EventParticipant.event_id == event_id)
        )
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_user_events(
        self,
        user_id: int,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> Sequence[EventParticipant]:
        """Получить события пользователя."""
        query = (
            select(EventParticipant)
            .options(selectinload(EventParticipant.event))
            .where(EventParticipant.user_id == user_id)
        )
        
        if date_from or date_to:
            query = query.join(ScheduleEvent)
            if date_from:
                query = query.where(ScheduleEvent.event_date >= date_from)
            if date_to:
                query = query.where(ScheduleEvent.event_date <= date_to)
        
        result = await self._session.execute(query)
        return result.scalars().all()
