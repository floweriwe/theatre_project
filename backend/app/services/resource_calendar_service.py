"""
Сервис календаря ресурсов.

Управляет расписанием использования ресурсов:
- Площадки (venues)
- Оборудование (inventory items)
- Персонал (users по цехам)
"""
from datetime import date, time, timedelta
from dataclasses import dataclass
from typing import Optional

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.schedule import ScheduleEvent, EventStatus
from app.models.venue import Venue


@dataclass
class ResourceSlot:
    """Слот использования ресурса."""

    event_id: int
    event_title: str
    event_type: str
    status: str
    start_time: time
    end_time: Optional[time]
    color: Optional[str]
    performance_id: Optional[int] = None


@dataclass
class ResourceDay:
    """День в календаре ресурса."""

    date: date
    slots: list[ResourceSlot]
    total_hours: float = 0.0
    is_fully_booked: bool = False


@dataclass
class ResourceTimeline:
    """Таймлайн ресурса за период."""

    resource_id: int
    resource_type: str
    resource_name: str
    days: list[ResourceDay]


class ResourceCalendarService:
    """
    Сервис календаря ресурсов.

    Возможности:
    - Получение расписания площадок
    - Получение расписания оборудования
    - Расчёт занятости ресурсов
    - Timeline view для нескольких ресурсов
    """

    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_venue_timeline(
        self,
        venue_id: int,
        date_from: date,
        date_to: date,
        theater_id: Optional[int] = None,
    ) -> ResourceTimeline:
        """
        Получить таймлайн использования площадки.

        Args:
            venue_id: ID площадки
            date_from: Начало периода
            date_to: Конец периода
            theater_id: ID театра

        Returns:
            ResourceTimeline с событиями по дням
        """
        # Get venue info
        venue = await self._session.get(Venue, venue_id)
        venue_name = venue.name if venue else f"Venue #{venue_id}"

        # Get events for this venue
        query = (
            select(ScheduleEvent)
            .where(
                and_(
                    ScheduleEvent.venue_id == venue_id,
                    ScheduleEvent.event_date >= date_from,
                    ScheduleEvent.event_date <= date_to,
                    ScheduleEvent.is_active == True,
                    ScheduleEvent.status != EventStatus.CANCELLED,
                )
            )
            .order_by(ScheduleEvent.event_date, ScheduleEvent.start_time)
        )

        if theater_id is not None:
            query = query.where(ScheduleEvent.theater_id == theater_id)

        result = await self._session.execute(query)
        events = result.scalars().all()

        # Group events by date
        events_by_date: dict[date, list[ScheduleEvent]] = {}
        for event in events:
            if event.event_date not in events_by_date:
                events_by_date[event.event_date] = []
            events_by_date[event.event_date].append(event)

        # Build timeline
        days = []
        current = date_from
        while current <= date_to:
            day_events = events_by_date.get(current, [])

            slots = [
                ResourceSlot(
                    event_id=e.id,
                    event_title=e.title,
                    event_type=e.event_type.value,
                    status=e.status.value,
                    start_time=e.start_time,
                    end_time=e.end_time,
                    color=e.color,
                    performance_id=e.performance_id,
                )
                for e in day_events
            ]

            total_hours = self._calculate_total_hours(slots)
            is_fully_booked = total_hours >= 12.0  # Consider 12+ hours as fully booked

            days.append(ResourceDay(
                date=current,
                slots=slots,
                total_hours=total_hours,
                is_fully_booked=is_fully_booked,
            ))

            current += timedelta(days=1)

        return ResourceTimeline(
            resource_id=venue_id,
            resource_type='venue',
            resource_name=venue_name,
            days=days,
        )

    async def get_multiple_venue_timelines(
        self,
        venue_ids: list[int],
        date_from: date,
        date_to: date,
        theater_id: Optional[int] = None,
    ) -> list[ResourceTimeline]:
        """
        Получить таймлайны для нескольких площадок.

        Args:
            venue_ids: Список ID площадок
            date_from: Начало периода
            date_to: Конец периода
            theater_id: ID театра

        Returns:
            Список ResourceTimeline
        """
        timelines = []
        for venue_id in venue_ids:
            timeline = await self.get_venue_timeline(
                venue_id, date_from, date_to, theater_id
            )
            timelines.append(timeline)
        return timelines

    async def get_all_venues_timeline(
        self,
        date_from: date,
        date_to: date,
        theater_id: Optional[int] = None,
    ) -> list[ResourceTimeline]:
        """
        Получить таймлайны для всех площадок.

        Args:
            date_from: Начало периода
            date_to: Конец периода
            theater_id: ID театра

        Returns:
            Список ResourceTimeline для всех активных площадок
        """
        # Get all active venues
        query = select(Venue).where(Venue.is_active == True)
        if theater_id is not None:
            query = query.where(Venue.theater_id == theater_id)
        query = query.order_by(Venue.sort_order, Venue.name)

        result = await self._session.execute(query)
        venues = result.scalars().all()

        venue_ids = [v.id for v in venues]
        return await self.get_multiple_venue_timelines(
            venue_ids, date_from, date_to, theater_id
        )

    async def get_venue_availability(
        self,
        venue_id: int,
        event_date: date,
        theater_id: Optional[int] = None,
    ) -> list[tuple[time, time]]:
        """
        Получить свободные слоты площадки на дату.

        Args:
            venue_id: ID площадки
            event_date: Дата
            theater_id: ID театра

        Returns:
            Список кортежей (start_time, end_time) свободных слотов
        """
        # Get booked slots
        query = (
            select(ScheduleEvent.start_time, ScheduleEvent.end_time)
            .where(
                and_(
                    ScheduleEvent.venue_id == venue_id,
                    ScheduleEvent.event_date == event_date,
                    ScheduleEvent.is_active == True,
                    ScheduleEvent.status != EventStatus.CANCELLED,
                )
            )
            .order_by(ScheduleEvent.start_time)
        )

        if theater_id is not None:
            query = query.where(ScheduleEvent.theater_id == theater_id)

        result = await self._session.execute(query)
        booked = [(row[0], row[1] or time(23, 59, 59)) for row in result]

        # Calculate free slots
        free_slots = []
        day_start = time(8, 0, 0)  # Working day starts at 8:00
        day_end = time(23, 0, 0)  # Working day ends at 23:00

        current_start = day_start

        for booked_start, booked_end in booked:
            if current_start < booked_start:
                free_slots.append((current_start, booked_start))
            current_start = max(current_start, booked_end)

        if current_start < day_end:
            free_slots.append((current_start, day_end))

        return free_slots

    async def get_venue_utilization(
        self,
        venue_id: int,
        date_from: date,
        date_to: date,
        theater_id: Optional[int] = None,
    ) -> dict:
        """
        Получить статистику использования площадки.

        Args:
            venue_id: ID площадки
            date_from: Начало периода
            date_to: Конец периода
            theater_id: ID театра

        Returns:
            Словарь со статистикой
        """
        timeline = await self.get_venue_timeline(
            venue_id, date_from, date_to, theater_id
        )

        total_days = len(timeline.days)
        used_days = sum(1 for d in timeline.days if len(d.slots) > 0)
        total_hours = sum(d.total_hours for d in timeline.days)
        total_events = sum(len(d.slots) for d in timeline.days)

        # Calculate utilization percentage (based on 12-hour working day)
        max_hours = total_days * 12
        utilization_pct = (total_hours / max_hours * 100) if max_hours > 0 else 0

        # Count event types
        event_types: dict[str, int] = {}
        for day in timeline.days:
            for slot in day.slots:
                event_types[slot.event_type] = event_types.get(slot.event_type, 0) + 1

        return {
            'venue_id': venue_id,
            'venue_name': timeline.resource_name,
            'period_start': date_from.isoformat(),
            'period_end': date_to.isoformat(),
            'total_days': total_days,
            'used_days': used_days,
            'usage_days_pct': (used_days / total_days * 100) if total_days > 0 else 0,
            'total_hours': round(total_hours, 1),
            'utilization_pct': round(utilization_pct, 1),
            'total_events': total_events,
            'events_by_type': event_types,
        }

    def _calculate_total_hours(self, slots: list[ResourceSlot]) -> float:
        """Рассчитать общее время занятости в часах."""
        from datetime import datetime

        total_minutes = 0
        today = date.today()

        for slot in slots:
            start_dt = datetime.combine(today, slot.start_time)
            end_dt = datetime.combine(today, slot.end_time or time(23, 59, 59))
            duration = (end_dt - start_dt).total_seconds() / 60
            total_minutes += duration

        return total_minutes / 60
