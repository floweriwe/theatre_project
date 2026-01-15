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
