"""
API эндпоинты модуля расписания.

Роуты:
- /schedule — события
- /schedule/calendar — календарь
- /schedule/{id}/participants — участники
- /schedule/stats — статистика
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, SessionDep
from app.core.exceptions import NotFoundError, ValidationError
from app.models.schedule import EventType, EventStatus, ParticipantStatus
from app.schemas.base import MessageResponse
from app.schemas.schedule import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventListResponse,
    PaginatedEvents,
    ParticipantCreate,
    ParticipantUpdate,
    ParticipantResponse,
    CalendarDay,
    ScheduleStats,
)
from app.services.schedule_service import ScheduleService
from app.services.recurrence_service import RecurrenceService
from app.services.conflict_detection_service import ConflictDetectionService
from app.services.resource_calendar_service import ResourceCalendarService
from app.models.schedule import EVENT_TYPE_CONFIG

router = APIRouter(prefix="/schedule", tags=["Расписание"])


# =============================================================================
# Dependencies
# =============================================================================

async def get_schedule_service(session: SessionDep) -> ScheduleService:
    """Получить сервис расписания."""
    return ScheduleService(session)


ScheduleServiceDep = Depends(get_schedule_service)


# =============================================================================
# Events Endpoints
# =============================================================================

@router.get(
    "",
    response_model=PaginatedEvents,
    summary="Получить список событий",
)
async def get_events(
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
    search: str | None = Query(None, description="Поиск по названию"),
    date_from: date | None = Query(None, description="Дата начала периода"),
    date_to: date | None = Query(None, description="Дата окончания периода"),
    event_type: EventType | None = Query(None, description="Тип события"),
    event_status: EventStatus | None = Query(None, alias="status", description="Статус"),
    performance_id: int | None = Query(None, description="ID спектакля"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Получить список событий с фильтрацией."""
    skip = (page - 1) * limit
    
    events, total = await service.get_events(
        search=search,
        date_from=date_from,
        date_to=date_to,
        event_type=event_type,
        status=event_status,
        performance_id=performance_id,
        theater_id=current_user.theater_id,
        skip=skip,
        limit=limit,
    )
    
    items = [_event_to_list(e) for e in events]
    
    return PaginatedEvents(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
    )


@router.get(
    "/upcoming",
    response_model=list[EventListResponse],
    summary="Предстоящие события",
)
async def get_upcoming_events(
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
    days: int = Query(7, ge=1, le=30, description="Количество дней"),
    limit: int = Query(10, ge=1, le=50),
):
    """Получить предстоящие события."""
    events = await service.get_upcoming(
        days=days,
        theater_id=current_user.theater_id,
        limit=limit,
    )
    return [_event_to_list(e) for e in events]


# =============================================================================
# Conflict Detection Endpoint (must be before /{event_id} routes)
# =============================================================================

@router.get(
    "/conflicts",
    summary="Проверить конфликты расписания",
)
async def check_conflicts(
    venue_id: int = Query(..., description="ID площадки"),
    event_date: date = Query(..., description="Дата события"),
    start_time: str = Query(..., description="Время начала (HH:MM)"),
    end_time: str = Query(..., description="Время окончания (HH:MM)"),
    event_id: int | None = Query(None, description="ID текущего события (для обновления)"),
    current_user: CurrentUserDep = None,
    service: ScheduleService = ScheduleServiceDep,
):
    """
    Проверить наличие конфликтов расписания.

    Возвращает список событий, которые пересекаются по времени
    с указанной площадкой в указанную дату.
    """
    from datetime import time as dt_time

    # Парсим время
    try:
        start_h, start_m = map(int, start_time.split(":"))
        end_h, end_m = map(int, end_time.split(":"))
        start = dt_time(start_h, start_m)
        end = dt_time(end_h, end_m)
    except (ValueError, AttributeError):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Неверный формат времени. Используйте HH:MM"
        )

    conflicts = await service.check_conflicts(
        venue_id=venue_id,
        event_date=event_date,
        start_time=start,
        end_time=end,
        exclude_event_id=event_id,
        theater_id=current_user.theater_id,
    )

    return {
        "has_conflicts": len(conflicts) > 0,
        "conflicts": [
            {
                "id": e.id,
                "title": e.title,
                "event_date": e.event_date.isoformat(),
                "start_time": e.start_time.isoformat(),
                "end_time": e.end_time.isoformat() if e.end_time else None,
                "event_type": e.event_type.value,
                "venue_name": e.venue.name if e.venue else None,
            }
            for e in conflicts
        ],
    }


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать событие",
)
async def create_event(
    data: EventCreate,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Создать новое событие."""
    event = await service.create_event(
        data=data,
        user_id=current_user.id,
        theater_id=current_user.theater_id,
    )
    return _event_to_response(event)


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="Получить событие",
)
async def get_event(
    event_id: int,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Получить событие по ID."""
    try:
        event = await service.get_event(event_id)
        return _event_to_response(event)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.patch(
    "/{event_id}",
    response_model=EventResponse,
    summary="Обновить событие",
)
async def update_event(
    event_id: int,
    data: EventUpdate,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Обновить событие."""
    try:
        event = await service.update_event(
            event_id=event_id,
            data=data,
            user_id=current_user.id,
        )
        return _event_to_response(event)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.delete(
    "/{event_id}",
    response_model=MessageResponse,
    summary="Удалить событие",
)
async def delete_event(
    event_id: int,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Удалить событие (soft delete)."""
    try:
        await service.delete_event(event_id, current_user.id)
        return MessageResponse(message="Событие успешно удалено")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Status Actions
# =============================================================================

@router.post(
    "/{event_id}/confirm",
    response_model=EventResponse,
    summary="Подтвердить",
)
async def confirm_event(
    event_id: int,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Подтвердить событие."""
    try:
        event = await service.confirm_event(event_id, current_user.id)
        return _event_to_response(event)
    except (NotFoundError, ValidationError) as e:
        code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(code, e.detail)


@router.post(
    "/{event_id}/start",
    response_model=EventResponse,
    summary="Начать",
)
async def start_event(
    event_id: int,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Начать событие."""
    try:
        event = await service.start_event(event_id, current_user.id)
        return _event_to_response(event)
    except (NotFoundError, ValidationError) as e:
        code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(code, e.detail)


@router.post(
    "/{event_id}/complete",
    response_model=EventResponse,
    summary="Завершить",
)
async def complete_event(
    event_id: int,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Завершить событие."""
    try:
        event = await service.complete_event(event_id, current_user.id)
        return _event_to_response(event)
    except (NotFoundError, ValidationError) as e:
        code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(code, e.detail)


@router.post(
    "/{event_id}/cancel",
    response_model=EventResponse,
    summary="Отменить",
)
async def cancel_event(
    event_id: int,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Отменить событие."""
    try:
        event = await service.cancel_event(event_id, current_user.id)
        return _event_to_response(event)
    except (NotFoundError, ValidationError) as e:
        code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(code, e.detail)


# =============================================================================
# Participants Endpoints
# =============================================================================

@router.get(
    "/{event_id}/participants",
    response_model=list[ParticipantResponse],
    summary="Участники события",
)
async def get_participants(
    event_id: int,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Получить участников события."""
    try:
        participants = await service.get_participants(event_id)
        return [_participant_to_response(p) for p in participants]
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.post(
    "/{event_id}/participants",
    response_model=ParticipantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить участника",
)
async def add_participant(
    event_id: int,
    data: ParticipantCreate,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Добавить участника в событие."""
    try:
        participant = await service.add_participant(event_id, data)
        return _participant_to_response(participant)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


@router.patch(
    "/participants/{participant_id}",
    response_model=ParticipantResponse,
    summary="Обновить участника",
)
async def update_participant(
    participant_id: int,
    data: ParticipantUpdate,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Обновить данные участника."""
    try:
        participant = await service.update_participant(participant_id, data)
        return _participant_to_response(participant)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.delete(
    "/participants/{participant_id}",
    response_model=MessageResponse,
    summary="Удалить участника",
)
async def remove_participant(
    participant_id: int,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Удалить участника из события."""
    try:
        await service.remove_participant(participant_id)
        return MessageResponse(message="Участник удалён")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.post(
    "/{event_id}/respond",
    response_model=ParticipantResponse,
    summary="Ответить на приглашение",
)
async def respond_to_event(
    event_id: int,
    participant_status: ParticipantStatus = Query(..., alias="status"),
    current_user: CurrentUserDep = None,
    service: ScheduleService = ScheduleServiceDep,
):
    """Ответить на приглашение в событие."""
    try:
        participant = await service.respond_to_event(
            event_id, current_user.id, participant_status
        )
        return _participant_to_response(participant)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Calendar Endpoints
# =============================================================================

@router.get(
    "/calendar/{year}/{month}",
    response_model=list[CalendarDay],
    summary="Календарь на месяц",
)
async def get_calendar(
    year: int,
    month: int,
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Получить календарь на месяц."""
    if month < 1 or month > 12:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Неверный месяц")
    
    calendar = await service.get_calendar(
        year=year,
        month=month,
        theater_id=current_user.theater_id,
    )
    return calendar


# =============================================================================
# Stats Endpoint
# =============================================================================

@router.get(
    "/stats/",
    response_model=ScheduleStats,
    summary="Статистика расписания",
)
async def get_schedule_stats(
    current_user: CurrentUserDep,
    service: ScheduleService = ScheduleServiceDep,
):
    """Получить статистику расписания."""
    return await service.get_stats(current_user.theater_id)


# =============================================================================
# Event Types Configuration (Phase 14)
# =============================================================================

@router.get(
    "/event-types",
    summary="Конфигурация типов событий",
)
async def get_event_types(
    current_user: CurrentUserDep,
):
    """
    Получить конфигурацию типов событий с цветами и метками.

    Возвращает список всех типов событий с их цветами и русскими названиями.
    """
    return [
        {
            "value": event_type.value,
            "label": config["label"],
            "color": config["color"],
            "icon": config["icon"],
        }
        for event_type, config in EVENT_TYPE_CONFIG.items()
    ]


# =============================================================================
# Recurrence Endpoints (Phase 14)
# =============================================================================

@router.post(
    "/recurrence/parse",
    summary="Распарсить RRule строку",
)
async def parse_recurrence_rule(
    rrule: str,
    current_user: CurrentUserDep,
):
    """
    Распарсить RFC 5545 RRule строку и вернуть человекочитаемое описание.
    """
    service = RecurrenceService()
    try:
        pattern = service.parse_rrule(rrule)
        description = service.describe_pattern(rrule)
        return {
            "frequency": pattern.frequency,
            "interval": pattern.interval,
            "count": pattern.count,
            "until": pattern.until.isoformat() if pattern.until else None,
            "by_day": pattern.by_day,
            "by_month_day": pattern.by_month_day,
            "by_month": pattern.by_month,
            "description": description,
        }
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post(
    "/recurrence/build",
    summary="Создать RRule строку",
)
async def build_recurrence_rule(
    frequency: str,
    current_user: CurrentUserDep,
    interval: int = 1,
    count: int | None = None,
    until: date | None = None,
    by_day: str | None = Query(None, description="Дни недели через запятую (MO,TU,WE)"),
):
    """
    Создать RFC 5545 RRule строку из параметров.
    """
    from app.services.recurrence_service import RecurrencePattern

    service = RecurrenceService()
    try:
        pattern = RecurrencePattern(
            frequency=frequency.upper(),
            interval=interval,
            count=count,
            until=until,
            by_day=by_day.split(",") if by_day else None,
        )
        rrule = service.build_rrule(pattern)
        description = service.describe_pattern(rrule)
        return {
            "rrule": rrule,
            "description": description,
        }
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post(
    "/recurrence/expand",
    summary="Развернуть повторения",
)
async def expand_recurrence(
    rrule: str,
    start_date: date,
    start_time: str,
    range_start: date,
    range_end: date,
    current_user: CurrentUserDep,
    end_time: str | None = None,
):
    """
    Сгенерировать даты повторяющегося события за указанный период.
    """
    from datetime import time as dt_time

    service = RecurrenceService()

    # Parse times
    try:
        start_h, start_m = map(int, start_time.split(":"))
        st = dt_time(start_h, start_m)
        et = None
        if end_time:
            end_h, end_m = map(int, end_time.split(":"))
            et = dt_time(end_h, end_m)
    except (ValueError, AttributeError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Неверный формат времени")

    try:
        instances = service.generate_instances(
            rrule_string=rrule,
            start_date=start_date,
            start_time=st,
            end_time=et,
            range_start=range_start,
            range_end=range_end,
        )
        return {
            "count": len(instances),
            "instances": [
                {
                    "date": inst.date.isoformat(),
                    "start_time": inst.start_time.isoformat(),
                    "end_time": inst.end_time.isoformat() if inst.end_time else None,
                }
                for inst in instances
            ],
        }
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


# =============================================================================
# Enhanced Conflict Detection (Phase 14)
# =============================================================================

@router.post(
    "/conflicts/check",
    summary="Расширенная проверка конфликтов",
)
async def check_conflicts_enhanced(
    event_date: date,
    start_time: str,
    end_time: str,
    current_user: CurrentUserDep,
    session: SessionDep,
    venue_id: int | None = None,
    event_id: int | None = None,
    buffer_minutes: int = 15,
):
    """
    Расширенная проверка конфликтов с уровнями серьёзности и буферным временем.

    Возвращает:
    - hard_conflicts: Жёсткие конфликты (невозможно провести)
    - warnings: Предупреждения (недостаточный буфер между событиями)
    - can_proceed: Можно ли продолжить (нет жёстких конфликтов)
    """
    from datetime import time as dt_time

    # Parse times
    try:
        start_h, start_m = map(int, start_time.split(":"))
        end_h, end_m = map(int, end_time.split(":"))
        st = dt_time(start_h, start_m)
        et = dt_time(end_h, end_m)
    except (ValueError, AttributeError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Неверный формат времени")

    service = ConflictDetectionService(session)
    result = await service.check_all_conflicts(
        venue_id=venue_id,
        event_date=event_date,
        start_time=st,
        end_time=et,
        exclude_event_id=event_id,
        theater_id=current_user.theater_id,
        buffer_minutes=buffer_minutes,
    )

    return {
        "has_conflicts": result.has_conflicts,
        "can_proceed": result.can_proceed,
        "hard_conflicts": [
            {
                "severity": c.severity.value,
                "type": c.conflict_type.value,
                "message": c.message,
                "event_id": c.conflicting_event_id,
                "event_title": c.conflicting_event_title,
                "event_date": c.conflicting_event_date.isoformat(),
                "start_time": c.conflicting_event_start.isoformat(),
                "end_time": c.conflicting_event_end.isoformat() if c.conflicting_event_end else None,
            }
            for c in result.hard_conflicts
        ],
        "warnings": [
            {
                "severity": c.severity.value,
                "type": c.conflict_type.value,
                "message": c.message,
                "event_id": c.conflicting_event_id,
                "event_title": c.conflicting_event_title,
                "event_date": c.conflicting_event_date.isoformat(),
                "start_time": c.conflicting_event_start.isoformat(),
                "end_time": c.conflicting_event_end.isoformat() if c.conflicting_event_end else None,
            }
            for c in result.warnings
        ],
    }


# =============================================================================
# Resource Calendar Endpoints (Phase 14)
# =============================================================================

@router.get(
    "/resources/venues/timeline",
    summary="Таймлайн площадок",
)
async def get_venues_timeline(
    date_from: date,
    date_to: date,
    current_user: CurrentUserDep,
    session: SessionDep,
    venue_ids: str | None = Query(None, description="ID площадок через запятую"),
):
    """
    Получить таймлайн использования площадок за период.

    Если venue_ids не указан, возвращает все активные площадки.
    """
    service = ResourceCalendarService(session)

    if venue_ids:
        ids = [int(x) for x in venue_ids.split(",")]
        timelines = await service.get_multiple_venue_timelines(
            venue_ids=ids,
            date_from=date_from,
            date_to=date_to,
            theater_id=current_user.theater_id,
        )
    else:
        timelines = await service.get_all_venues_timeline(
            date_from=date_from,
            date_to=date_to,
            theater_id=current_user.theater_id,
        )

    return [
        {
            "resource_id": t.resource_id,
            "resource_type": t.resource_type,
            "resource_name": t.resource_name,
            "days": [
                {
                    "date": d.date.isoformat(),
                    "total_hours": d.total_hours,
                    "is_fully_booked": d.is_fully_booked,
                    "slots": [
                        {
                            "event_id": s.event_id,
                            "event_title": s.event_title,
                            "event_type": s.event_type,
                            "status": s.status,
                            "start_time": s.start_time.isoformat(),
                            "end_time": s.end_time.isoformat() if s.end_time else None,
                            "color": s.color,
                            "performance_id": s.performance_id,
                        }
                        for s in d.slots
                    ],
                }
                for d in t.days
            ],
        }
        for t in timelines
    ]


@router.get(
    "/resources/venues/{venue_id}/availability",
    summary="Свободные слоты площадки",
)
async def get_venue_availability(
    venue_id: int,
    event_date: date,
    current_user: CurrentUserDep,
    session: SessionDep,
):
    """
    Получить свободные временные слоты площадки на указанную дату.
    """
    service = ResourceCalendarService(session)

    free_slots = await service.get_venue_availability(
        venue_id=venue_id,
        event_date=event_date,
        theater_id=current_user.theater_id,
    )

    return {
        "venue_id": venue_id,
        "date": event_date.isoformat(),
        "free_slots": [
            {
                "start_time": slot[0].isoformat(),
                "end_time": slot[1].isoformat(),
            }
            for slot in free_slots
        ],
    }


@router.get(
    "/resources/venues/{venue_id}/utilization",
    summary="Статистика использования площадки",
)
async def get_venue_utilization(
    venue_id: int,
    date_from: date,
    date_to: date,
    current_user: CurrentUserDep,
    session: SessionDep,
):
    """
    Получить статистику использования площадки за период.
    """
    service = ResourceCalendarService(session)

    stats = await service.get_venue_utilization(
        venue_id=venue_id,
        date_from=date_from,
        date_to=date_to,
        theater_id=current_user.theater_id,
    )

    return stats


# =============================================================================
# Response Converters
# =============================================================================

def _event_to_response(e) -> EventResponse:
    """Преобразовать событие в response."""
    return EventResponse(
        id=e.id,
        title=e.title,
        description=e.description,
        event_type=e.event_type,
        status=e.status,
        event_date=e.event_date,
        start_time=e.start_time,
        end_time=e.end_time,
        venue=e.venue,
        performance_id=e.performance_id,
        color=e.color,
        is_public=e.is_public,
        metadata=e.extra_data,
        is_active=e.is_active,
        theater_id=e.theater_id,
        created_at=e.created_at,
        updated_at=e.updated_at,
        performance_title=e.performance.title if e.performance else None,
        participants=[_participant_to_response(p) for p in e.participants] if e.participants else [],
    )


def _event_to_list(e) -> EventListResponse:
    """Преобразовать событие для списка."""
    return EventListResponse(
        id=e.id,
        title=e.title,
        event_type=e.event_type,
        status=e.status,
        event_date=e.event_date,
        start_time=e.start_time,
        end_time=e.end_time,
        venue=e.venue,
        color=e.color,
        is_public=e.is_public,
        performance_id=e.performance_id,
        performance_title=e.performance.title if e.performance else None,
        participants_count=len(e.participants) if hasattr(e, 'participants') and e.participants else 0,
    )


def _participant_to_response(p) -> ParticipantResponse:
    """Преобразовать участника в response."""
    return ParticipantResponse(
        id=p.id,
        event_id=p.event_id,
        user_id=p.user_id,
        role=p.role,
        status=p.status,
        note=p.note,
        user_name=f"{p.user.first_name} {p.user.last_name}".strip() if hasattr(p, 'user') and p.user else None,
    )
