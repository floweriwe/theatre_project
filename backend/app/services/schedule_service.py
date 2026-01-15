"""
Сервис модуля расписания.

Бизнес-логика для работы с расписанием:
- CRUD операции с событиями
- Управление участниками
- Календарное представление
"""
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.models.schedule import (
    ScheduleEvent,
    EventParticipant,
    EventType,
    EventStatus,
    ParticipantStatus,
)
from app.repositories.schedule_repository import (
    ScheduleEventRepository,
    EventParticipantRepository,
)
from app.schemas.schedule import (
    EventCreate,
    EventUpdate,
    ParticipantCreate,
    ParticipantUpdate,
    ScheduleStats,
    CalendarEvent,
    CalendarDay,
)


class ScheduleService:
    """
    Сервис расписания.
    
    Управляет событиями, участниками и календарём.
    """
    
    def __init__(self, session: AsyncSession):
        self._session = session
        self._event_repo = ScheduleEventRepository(session)
        self._participant_repo = EventParticipantRepository(session)
    
    # =========================================================================
    # Events
    # =========================================================================
    
    async def get_events(
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
    ) -> tuple[list[ScheduleEvent], int]:
        """Получить список событий с фильтрацией."""
        events, total = await self._event_repo.search(
            search=search,
            date_from=date_from,
            date_to=date_to,
            event_type=event_type,
            status=status,
            performance_id=performance_id,
            theater_id=theater_id,
            skip=skip,
            limit=limit,
        )
        return list(events), total
    
    async def get_event(self, event_id: int) -> ScheduleEvent:
        """Получить событие по ID."""
        event = await self._event_repo.get_with_relations(event_id)
        if not event:
            raise NotFoundError(f"Событие с ID {event_id} не найдено")
        return event
    
    async def get_events_by_date(
        self,
        event_date: date,
        theater_id: int | None = None,
    ) -> list[ScheduleEvent]:
        """Получить события на дату."""
        events = await self._event_repo.get_by_date(event_date, theater_id)
        return list(events)
    
    async def get_events_by_range(
        self,
        date_from: date,
        date_to: date,
        theater_id: int | None = None,
        event_type: EventType | None = None,
    ) -> list[ScheduleEvent]:
        """Получить события за период."""
        events = await self._event_repo.get_by_date_range(
            date_from, date_to, theater_id, event_type
        )
        return list(events)
    
    async def get_upcoming(
        self,
        days: int = 7,
        theater_id: int | None = None,
        limit: int = 10,
    ) -> list[ScheduleEvent]:
        """Получить предстоящие события."""
        events = await self._event_repo.get_upcoming(days, theater_id, limit)
        return list(events)
    
    async def create_event(
        self,
        data: EventCreate,
        user_id: int,
        theater_id: int | None = None,
    ) -> ScheduleEvent:
        """Создать событие."""
        # Создаём событие
        event = ScheduleEvent(
            title=data.title,
            description=data.description,
            event_type=data.event_type,
            status=EventStatus.PLANNED,
            event_date=data.event_date,
            start_time=data.start_time,
            end_time=data.end_time,
            venue=data.venue,
            performance_id=data.performance_id,
            color=data.color,
            is_public=data.is_public,
            theater_id=theater_id,
            created_by_id=user_id,
            updated_by_id=user_id,
        )
        
        self._session.add(event)
        await self._session.flush()
        
        # Добавляем участников
        for p_data in data.participants:
            participant = EventParticipant(
                event_id=event.id,
                user_id=p_data.user_id,
                role=p_data.role,
                status=p_data.status,
                note=p_data.note,
            )
            self._session.add(participant)
        
        await self._session.commit()
        
        return await self._event_repo.get_with_relations(event.id)
    
    async def update_event(
        self,
        event_id: int,
        data: EventUpdate,
        user_id: int,
    ) -> ScheduleEvent:
        """Обновить событие."""
        await self.get_event(event_id)
        
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by_id"] = user_id
        
        await self._event_repo.update(event_id, update_data)
        await self._session.commit()
        
        return await self._event_repo.get_with_relations(event_id)
    
    async def delete_event(self, event_id: int, user_id: int) -> bool:
        """Удалить событие (soft delete)."""
        await self.get_event(event_id)
        await self._event_repo.update(event_id, {
            "is_active": False,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        return True
    
    # =========================================================================
    # Status Management
    # =========================================================================
    
    async def confirm_event(self, event_id: int, user_id: int) -> ScheduleEvent:
        """Подтвердить событие."""
        event = await self.get_event(event_id)
        
        if event.status not in [EventStatus.PLANNED]:
            raise ValidationError("Можно подтвердить только запланированное событие")
        
        await self._event_repo.update(event_id, {
            "status": EventStatus.CONFIRMED,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        
        return await self._event_repo.get_with_relations(event_id)
    
    async def start_event(self, event_id: int, user_id: int) -> ScheduleEvent:
        """Начать событие."""
        event = await self.get_event(event_id)
        
        if event.status not in [EventStatus.PLANNED, EventStatus.CONFIRMED]:
            raise ValidationError("Невозможно начать событие в текущем статусе")
        
        await self._event_repo.update(event_id, {
            "status": EventStatus.IN_PROGRESS,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        
        return await self._event_repo.get_with_relations(event_id)
    
    async def complete_event(self, event_id: int, user_id: int) -> ScheduleEvent:
        """Завершить событие."""
        event = await self.get_event(event_id)
        
        if event.status not in [EventStatus.IN_PROGRESS, EventStatus.CONFIRMED]:
            raise ValidationError("Невозможно завершить событие в текущем статусе")
        
        await self._event_repo.update(event_id, {
            "status": EventStatus.COMPLETED,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        
        return await self._event_repo.get_with_relations(event_id)
    
    async def cancel_event(self, event_id: int, user_id: int) -> ScheduleEvent:
        """Отменить событие."""
        event = await self.get_event(event_id)
        
        if event.status == EventStatus.COMPLETED:
            raise ValidationError("Нельзя отменить завершённое событие")
        
        await self._event_repo.update(event_id, {
            "status": EventStatus.CANCELLED,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        
        return await self._event_repo.get_with_relations(event_id)
    
    # =========================================================================
    # Participants
    # =========================================================================
    
    async def get_participants(self, event_id: int) -> list[EventParticipant]:
        """Получить участников события."""
        await self.get_event(event_id)
        participants = await self._participant_repo.get_by_event(event_id)
        return list(participants)
    
    async def add_participant(
        self,
        event_id: int,
        data: ParticipantCreate,
    ) -> EventParticipant:
        """Добавить участника."""
        await self.get_event(event_id)
        
        # Проверяем, нет ли уже такого участника
        existing = await self._participant_repo.get_by_user_and_event(
            data.user_id, event_id
        )
        if existing:
            raise ValidationError("Участник уже добавлен в событие")
        
        participant = EventParticipant(
            event_id=event_id,
            user_id=data.user_id,
            role=data.role,
            status=data.status,
            note=data.note,
        )
        
        self._session.add(participant)
        await self._session.commit()
        
        return await self._participant_repo.get_by_id(participant.id)
    
    async def update_participant(
        self,
        participant_id: int,
        data: ParticipantUpdate,
    ) -> EventParticipant:
        """Обновить участника."""
        participant = await self._participant_repo.get_by_id(participant_id)
        if not participant:
            raise NotFoundError(f"Участник с ID {participant_id} не найден")
        
        update_data = data.model_dump(exclude_unset=True)
        await self._participant_repo.update(participant_id, update_data)
        await self._session.commit()
        
        return await self._participant_repo.get_by_id(participant_id)
    
    async def remove_participant(self, participant_id: int) -> bool:
        """Удалить участника."""
        participant = await self._participant_repo.get_by_id(participant_id)
        if not participant:
            raise NotFoundError(f"Участник с ID {participant_id} не найден")
        
        await self._session.delete(participant)
        await self._session.commit()
        return True
    
    async def respond_to_event(
        self,
        event_id: int,
        user_id: int,
        status: ParticipantStatus,
    ) -> EventParticipant:
        """Ответить на приглашение."""
        participant = await self._participant_repo.get_by_user_and_event(
            user_id, event_id
        )
        if not participant:
            raise NotFoundError("Вы не являетесь участником этого события")
        
        await self._participant_repo.update(participant.id, {"status": status})
        await self._session.commit()
        
        return await self._participant_repo.get_by_id(participant.id)
    
    # =========================================================================
    # Calendar
    # =========================================================================
    
    async def get_calendar(
        self,
        year: int,
        month: int,
        theater_id: int | None = None,
    ) -> list[CalendarDay]:
        """Получить календарь на месяц."""
        # Определяем границы месяца
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)
        
        # Получаем события
        events = await self._event_repo.get_by_date_range(
            first_day, last_day, theater_id
        )
        
        # Группируем по дням
        days_dict: dict[date, list[CalendarEvent]] = {}
        
        for event in events:
            cal_event = CalendarEvent(
                id=event.id,
                title=event.title,
                event_type=event.event_type,
                status=event.status,
                date=event.event_date,
                start=event.start_time,
                end=event.end_time,
                color=event.color,
                performance_id=event.performance_id,
            )
            
            if event.event_date not in days_dict:
                days_dict[event.event_date] = []
            days_dict[event.event_date].append(cal_event)
        
        # Формируем список дней
        calendar_days = []
        current = first_day
        while current <= last_day:
            calendar_days.append(CalendarDay(
                date=current,
                events=days_dict.get(current, []),
            ))
            current += timedelta(days=1)
        
        return calendar_days
    
    # =========================================================================
    # Statistics
    # =========================================================================
    
    async def get_stats(self, theater_id: int | None = None) -> ScheduleStats:
        """Получить статистику расписания."""
        stats = await self._event_repo.get_stats(theater_id)
        
        return ScheduleStats(
            total_events=stats["total_events"],
            planned=stats.get("planned", 0),
            confirmed=stats.get("confirmed", 0),
            completed=stats.get("completed", 0),
            cancelled=stats.get("cancelled", 0),
            performances_count=stats.get("performances_count", 0),
            rehearsals_count=stats.get("rehearsals_count", 0),
            other_count=stats.get("other_count", 0),
            upcoming_events=stats.get("upcoming_events", 0),
        )
