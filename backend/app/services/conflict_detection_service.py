"""
Сервис обнаружения конфликтов расписания v2.

Расширенные возможности:
- Конфликты по площадкам
- Конфликты по ресурсам (оборудование, персонал)
- Конфликты для повторяющихся событий
- Уровни серьёзности конфликтов
- Буферное время между событиями
"""
from datetime import date, time, timedelta
from dataclasses import dataclass
from enum import Enum
from typing import Optional

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.schedule import ScheduleEvent, EventStatus


class ConflictSeverity(str, Enum):
    """Уровень серьёзности конфликта."""

    HARD = "hard"  # Жёсткий конфликт - невозможно провести
    WARNING = "warning"  # Предупреждение - возможно, но нежелательно
    INFO = "info"  # Информация - потенциальная проблема


class ConflictType(str, Enum):
    """Тип конфликта."""

    VENUE = "venue"  # Конфликт по площадке
    RESOURCE = "resource"  # Конфликт по ресурсу
    PARTICIPANT = "participant"  # Конфликт по участнику
    BUFFER = "buffer"  # Недостаточное время между событиями


@dataclass
class ScheduleConflict:
    """Конфликт расписания."""

    severity: ConflictSeverity
    conflict_type: ConflictType
    message: str
    conflicting_event_id: int
    conflicting_event_title: str
    conflicting_event_date: date
    conflicting_event_start: time
    conflicting_event_end: Optional[time]
    resource_id: Optional[int] = None
    resource_type: Optional[str] = None


@dataclass
class ConflictCheckResult:
    """Результат проверки конфликтов."""

    has_conflicts: bool
    hard_conflicts: list[ScheduleConflict]
    warnings: list[ScheduleConflict]
    info: list[ScheduleConflict]

    @property
    def all_conflicts(self) -> list[ScheduleConflict]:
        return self.hard_conflicts + self.warnings + self.info

    @property
    def can_proceed(self) -> bool:
        """Можно ли продолжить (нет жёстких конфликтов)."""
        return len(self.hard_conflicts) == 0


class ConflictDetectionService:
    """
    Сервис обнаружения конфликтов расписания v2.

    Улучшения по сравнению с v1:
    - Структурированные результаты с типами конфликтов
    - Уровни серьёзности
    - Буферное время между событиями
    - Поддержка ресурсов
    - Batch проверка для повторяющихся событий
    """

    # Буферное время между событиями по умолчанию (минуты)
    DEFAULT_BUFFER_MINUTES = 15

    def __init__(self, session: AsyncSession):
        self._session = session

    async def check_venue_conflicts(
        self,
        venue_id: int,
        event_date: date,
        start_time: time,
        end_time: Optional[time],
        exclude_event_id: Optional[int] = None,
        theater_id: Optional[int] = None,
        buffer_minutes: int = DEFAULT_BUFFER_MINUTES,
    ) -> ConflictCheckResult:
        """
        Проверка конфликтов по площадке.

        Args:
            venue_id: ID площадки
            event_date: Дата события
            start_time: Время начала
            end_time: Время окончания
            exclude_event_id: ID события для исключения (при обновлении)
            theater_id: ID театра
            buffer_minutes: Буферное время между событиями

        Returns:
            ConflictCheckResult с найденными конфликтами
        """
        # Если end_time не указан, считаем конец дня
        if end_time is None:
            end_time = time(23, 59, 59)

        # Базовый запрос
        query = (
            select(ScheduleEvent)
            .where(
                and_(
                    ScheduleEvent.venue_id == venue_id,
                    ScheduleEvent.event_date == event_date,
                    ScheduleEvent.is_active == True,
                    ScheduleEvent.status != EventStatus.CANCELLED,
                )
            )
            .options(selectinload(ScheduleEvent.venue))
        )

        # Исключаем текущее событие
        if exclude_event_id is not None:
            query = query.where(ScheduleEvent.id != exclude_event_id)

        # Фильтр по театру
        if theater_id is not None:
            query = query.where(ScheduleEvent.theater_id == theater_id)

        result = await self._session.execute(query)
        events = result.scalars().all()

        hard_conflicts = []
        warnings = []
        info = []

        for event in events:
            event_end = event.end_time or time(23, 59, 59)

            # Проверяем жёсткое пересечение времени
            if self._times_overlap(start_time, end_time, event.start_time, event_end):
                hard_conflicts.append(ScheduleConflict(
                    severity=ConflictSeverity.HARD,
                    conflict_type=ConflictType.VENUE,
                    message=f"Площадка занята событием '{event.title}'",
                    conflicting_event_id=event.id,
                    conflicting_event_title=event.title,
                    conflicting_event_date=event.event_date,
                    conflicting_event_start=event.start_time,
                    conflicting_event_end=event.end_time,
                ))
                continue

            # Проверяем буферное время
            if buffer_minutes > 0:
                buffer_conflict = self._check_buffer_time(
                    start_time, end_time,
                    event.start_time, event_end,
                    buffer_minutes
                )
                if buffer_conflict:
                    warnings.append(ScheduleConflict(
                        severity=ConflictSeverity.WARNING,
                        conflict_type=ConflictType.BUFFER,
                        message=f"Менее {buffer_minutes} мин. между событиями",
                        conflicting_event_id=event.id,
                        conflicting_event_title=event.title,
                        conflicting_event_date=event.event_date,
                        conflicting_event_start=event.start_time,
                        conflicting_event_end=event.end_time,
                    ))

        return ConflictCheckResult(
            has_conflicts=len(hard_conflicts) > 0 or len(warnings) > 0,
            hard_conflicts=hard_conflicts,
            warnings=warnings,
            info=info,
        )

    async def check_resource_conflicts(
        self,
        resource_type: str,
        resource_id: int,
        event_date: date,
        start_time: time,
        end_time: Optional[time],
        exclude_event_id: Optional[int] = None,
        theater_id: Optional[int] = None,
    ) -> ConflictCheckResult:
        """
        Проверка конфликтов по ресурсу (оборудование, персонал).

        Args:
            resource_type: Тип ресурса ('equipment', 'staff', 'space')
            resource_id: ID ресурса
            event_date: Дата события
            start_time: Время начала
            end_time: Время окончания
            exclude_event_id: ID события для исключения
            theater_id: ID театра

        Returns:
            ConflictCheckResult с найденными конфликтами
        """
        from sqlalchemy import text

        if end_time is None:
            end_time = time(23, 59, 59)

        # Query events that use this resource
        query = text("""
            SELECT se.id, se.title, se.event_date, se.start_time, se.end_time
            FROM schedule_events se
            JOIN event_resources er ON er.event_id = se.id
            WHERE er.resource_type = :resource_type
              AND er.resource_id = :resource_id
              AND se.event_date = :event_date
              AND se.is_active = true
              AND se.status != 'cancelled'
              AND (:exclude_id IS NULL OR se.id != :exclude_id)
              AND (:theater_id IS NULL OR se.theater_id = :theater_id)
        """)

        result = await self._session.execute(query, {
            'resource_type': resource_type,
            'resource_id': resource_id,
            'event_date': event_date,
            'exclude_id': exclude_event_id,
            'theater_id': theater_id,
        })

        hard_conflicts = []

        for row in result:
            event_end = row.end_time or time(23, 59, 59)

            if self._times_overlap(start_time, end_time, row.start_time, event_end):
                hard_conflicts.append(ScheduleConflict(
                    severity=ConflictSeverity.HARD,
                    conflict_type=ConflictType.RESOURCE,
                    message=f"Ресурс занят событием '{row.title}'",
                    conflicting_event_id=row.id,
                    conflicting_event_title=row.title,
                    conflicting_event_date=row.event_date,
                    conflicting_event_start=row.start_time,
                    conflicting_event_end=row.end_time,
                    resource_id=resource_id,
                    resource_type=resource_type,
                ))

        return ConflictCheckResult(
            has_conflicts=len(hard_conflicts) > 0,
            hard_conflicts=hard_conflicts,
            warnings=[],
            info=[],
        )

    async def check_all_conflicts(
        self,
        venue_id: Optional[int],
        event_date: date,
        start_time: time,
        end_time: Optional[time],
        resource_ids: Optional[dict[str, list[int]]] = None,
        exclude_event_id: Optional[int] = None,
        theater_id: Optional[int] = None,
        buffer_minutes: int = DEFAULT_BUFFER_MINUTES,
    ) -> ConflictCheckResult:
        """
        Полная проверка всех типов конфликтов.

        Args:
            venue_id: ID площадки
            event_date: Дата события
            start_time: Время начала
            end_time: Время окончания
            resource_ids: Словарь {resource_type: [resource_id, ...]}
            exclude_event_id: ID события для исключения
            theater_id: ID театра
            buffer_minutes: Буферное время

        Returns:
            Объединённый ConflictCheckResult
        """
        all_hard = []
        all_warnings = []
        all_info = []

        # Venue conflicts
        if venue_id:
            venue_result = await self.check_venue_conflicts(
                venue_id, event_date, start_time, end_time,
                exclude_event_id, theater_id, buffer_minutes
            )
            all_hard.extend(venue_result.hard_conflicts)
            all_warnings.extend(venue_result.warnings)
            all_info.extend(venue_result.info)

        # Resource conflicts
        if resource_ids:
            for resource_type, ids in resource_ids.items():
                for resource_id in ids:
                    resource_result = await self.check_resource_conflicts(
                        resource_type, resource_id,
                        event_date, start_time, end_time,
                        exclude_event_id, theater_id
                    )
                    all_hard.extend(resource_result.hard_conflicts)
                    all_warnings.extend(resource_result.warnings)
                    all_info.extend(resource_result.info)

        return ConflictCheckResult(
            has_conflicts=len(all_hard) > 0 or len(all_warnings) > 0,
            hard_conflicts=all_hard,
            warnings=all_warnings,
            info=all_info,
        )

    async def check_batch_conflicts(
        self,
        dates: list[date],
        venue_id: Optional[int],
        start_time: time,
        end_time: Optional[time],
        exclude_event_id: Optional[int] = None,
        theater_id: Optional[int] = None,
    ) -> dict[date, ConflictCheckResult]:
        """
        Пакетная проверка конфликтов для нескольких дат.

        Используется для повторяющихся событий.

        Args:
            dates: Список дат для проверки
            venue_id: ID площадки
            start_time: Время начала
            end_time: Время окончания
            exclude_event_id: ID события для исключения
            theater_id: ID театра

        Returns:
            Словарь {date: ConflictCheckResult}
        """
        results = {}

        for check_date in dates:
            if venue_id:
                result = await self.check_venue_conflicts(
                    venue_id, check_date, start_time, end_time,
                    exclude_event_id, theater_id, buffer_minutes=0
                )
            else:
                result = ConflictCheckResult(
                    has_conflicts=False,
                    hard_conflicts=[],
                    warnings=[],
                    info=[],
                )
            results[check_date] = result

        return results

    def _times_overlap(
        self,
        start1: time,
        end1: time,
        start2: time,
        end2: time,
    ) -> bool:
        """
        Проверка пересечения двух временных интервалов.

        Логика: interval1.start < interval2.end AND interval1.end > interval2.start
        """
        return start1 < end2 and end1 > start2

    def _check_buffer_time(
        self,
        start1: time,
        end1: time,
        start2: time,
        end2: time,
        buffer_minutes: int,
    ) -> bool:
        """
        Проверка буферного времени между событиями.

        Returns:
            True если буферное время нарушено
        """
        from datetime import datetime, timedelta

        # Convert times to datetime for arithmetic
        today = date.today()
        dt1_start = datetime.combine(today, start1)
        dt1_end = datetime.combine(today, end1)
        dt2_start = datetime.combine(today, start2)
        dt2_end = datetime.combine(today, end2)

        buffer = timedelta(minutes=buffer_minutes)

        # Check if event 1 ends too close to event 2 start
        if dt1_end <= dt2_start:
            gap = dt2_start - dt1_end
            if gap < buffer:
                return True

        # Check if event 2 ends too close to event 1 start
        if dt2_end <= dt1_start:
            gap = dt1_start - dt2_end
            if gap < buffer:
                return True

        return False
