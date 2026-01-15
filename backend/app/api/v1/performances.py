"""
API эндпоинты модуля спектаклей.

Роуты:
- /performances — спектакли
- /performances/{id}/sections — разделы паспорта
- /performances/stats — статистика
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status

from app.api.deps import CurrentUserDep, SessionDep
from app.core.exceptions import NotFoundError, ValidationError
from app.models.performance import PerformanceStatus, SectionType
from app.schemas.base import MessageResponse
from app.schemas.performance import (
    PerformanceCreate,
    PerformanceUpdate,
    PerformanceResponse,
    PerformanceListResponse,
    PaginatedPerformances,
    SectionCreate,
    SectionUpdate,
    SectionResponse,
    PerformanceStats,
)
from app.services.performance_service import PerformanceService

router = APIRouter(prefix="/performances", tags=["Спектакли"])


# =============================================================================
# Dependencies
# =============================================================================

async def get_performance_service(session: SessionDep) -> PerformanceService:
    """Получить сервис спектаклей."""
    return PerformanceService(session)


PerformanceServiceDep = Depends(get_performance_service)


# =============================================================================
# Performances Endpoints
# =============================================================================

@router.get(
    "",
    response_model=PaginatedPerformances,
    summary="Получить список спектаклей",
)
async def get_performances(
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
    search: str | None = Query(None, description="Поиск по названию"),
    status: PerformanceStatus | None = Query(None, description="Фильтр по статусу"),
    genre: str | None = Query(None, description="Фильтр по жанру"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Получить список спектаклей с фильтрацией."""
    skip = (page - 1) * limit
    
    performances, total = await service.get_performances(
        search=search,
        status=status,
        genre=genre,
        theater_id=current_user.theater_id,
        skip=skip,
        limit=limit,
    )
    
    items = [_performance_to_list(p) for p in performances]
    
    return PaginatedPerformances(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
    )


@router.get(
    "/repertoire",
    response_model=list[PerformanceListResponse],
    summary="Получить текущий репертуар",
)
async def get_repertoire(
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Получить спектакли в репертуаре."""
    performances = await service.get_repertoire(current_user.theater_id)
    return [_performance_to_list(p) for p in performances]


@router.post(
    "",
    response_model=PerformanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать спектакль",
)
async def create_performance(
    data: PerformanceCreate,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Создать новый спектакль."""
    performance = await service.create_performance(
        data=data,
        user_id=current_user.id,
        theater_id=current_user.theater_id,
    )
    return _performance_to_response(performance)


@router.get(
    "/{performance_id}",
    response_model=PerformanceResponse,
    summary="Получить спектакль",
)
async def get_performance(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Получить спектакль по ID."""
    try:
        performance = await service.get_performance(performance_id)
        return _performance_to_response(performance)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.patch(
    "/{performance_id}",
    response_model=PerformanceResponse,
    summary="Обновить спектакль",
)
async def update_performance(
    performance_id: int,
    data: PerformanceUpdate,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Обновить спектакль."""
    try:
        performance = await service.update_performance(
            performance_id=performance_id,
            data=data,
            user_id=current_user.id,
        )
        return _performance_to_response(performance)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.delete(
    "/{performance_id}",
    response_model=MessageResponse,
    summary="Удалить спектакль",
)
async def delete_performance(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Удалить спектакль (soft delete)."""
    try:
        await service.delete_performance(performance_id, current_user.id)
        return MessageResponse(message="Спектакль успешно удалён")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Status Actions
# =============================================================================

@router.post(
    "/{performance_id}/to-repertoire",
    response_model=PerformanceResponse,
    summary="В репертуар",
)
async def to_repertoire(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Перевести спектакль в репертуар."""
    try:
        performance = await service.to_repertoire(performance_id, current_user.id)
        return _performance_to_response(performance)
    except (NotFoundError, ValidationError) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code, e.detail)


@router.post(
    "/{performance_id}/pause",
    response_model=PerformanceResponse,
    summary="На паузу",
)
async def pause_performance(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Поставить спектакль на паузу."""
    try:
        performance = await service.pause(performance_id, current_user.id)
        return _performance_to_response(performance)
    except (NotFoundError, ValidationError) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code, e.detail)


@router.post(
    "/{performance_id}/archive",
    response_model=PerformanceResponse,
    summary="В архив",
)
async def archive_performance(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Архивировать спектакль."""
    try:
        performance = await service.archive(performance_id, current_user.id)
        return _performance_to_response(performance)
    except (NotFoundError, ValidationError) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code, e.detail)


@router.post(
    "/{performance_id}/restore",
    response_model=PerformanceResponse,
    summary="Восстановить",
)
async def restore_performance(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Восстановить спектакль из архива."""
    try:
        performance = await service.restore(performance_id, current_user.id)
        return _performance_to_response(performance)
    except (NotFoundError, ValidationError) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code, e.detail)


# =============================================================================
# Poster
# =============================================================================

@router.post(
    "/{performance_id}/poster",
    response_model=PerformanceResponse,
    summary="Загрузить постер",
)
async def upload_poster(
    performance_id: int,
    current_user: CurrentUserDep,
    file: UploadFile = File(..., description="Изображение постера"),
    service: PerformanceService = PerformanceServiceDep,
):
    """Загрузить постер спектакля."""
    try:
        performance = await service.upload_poster(
            performance_id=performance_id,
            file=file,
            user_id=current_user.id,
        )
        return _performance_to_response(performance)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


# =============================================================================
# Sections Endpoints
# =============================================================================

@router.get(
    "/{performance_id}/sections",
    response_model=list[SectionResponse],
    summary="Разделы паспорта",
)
async def get_sections(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Получить разделы паспорта спектакля."""
    try:
        sections = await service.get_sections(performance_id)
        return [_section_to_response(s) for s in sections]
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.post(
    "/{performance_id}/sections",
    response_model=SectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать раздел",
)
async def create_section(
    performance_id: int,
    data: SectionCreate,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Создать раздел паспорта."""
    try:
        section = await service.create_section(
            performance_id=performance_id,
            data=data,
            user_id=current_user.id,
        )
        return _section_to_response(section)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


@router.patch(
    "/sections/{section_id}",
    response_model=SectionResponse,
    summary="Обновить раздел",
)
async def update_section(
    section_id: int,
    data: SectionUpdate,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Обновить раздел паспорта."""
    try:
        section = await service.update_section(
            section_id=section_id,
            data=data,
            user_id=current_user.id,
        )
        return _section_to_response(section)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.delete(
    "/sections/{section_id}",
    response_model=MessageResponse,
    summary="Удалить раздел",
)
async def delete_section(
    section_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Удалить раздел паспорта."""
    try:
        await service.delete_section(section_id)
        return MessageResponse(message="Раздел успешно удалён")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Stats Endpoint
# =============================================================================

@router.get(
    "/stats/",
    response_model=PerformanceStats,
    summary="Статистика спектаклей",
)
async def get_performance_stats(
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Получить статистику спектаклей."""
    return await service.get_stats(current_user.theater_id)


# =============================================================================
# Response Converters
# =============================================================================

def _performance_to_response(p) -> PerformanceResponse:
    """Преобразовать спектакль в response."""
    return PerformanceResponse(
        id=p.id,
        title=p.title,
        subtitle=p.subtitle,
        description=p.description,
        author=p.author,
        director=p.director,
        composer=p.composer,
        choreographer=p.choreographer,
        genre=p.genre,
        age_rating=p.age_rating,
        duration_minutes=p.duration_minutes,
        intermissions=p.intermissions,
        premiere_date=p.premiere_date,
        status=p.status,
        poster_path=p.poster_path,
        metadata=p.extra_data,
        is_active=p.is_active,
        theater_id=p.theater_id,
        created_at=p.created_at,
        updated_at=p.updated_at,
        sections=[_section_to_response(s) for s in p.sections] if p.sections else [],
    )


def _performance_to_list(p) -> PerformanceListResponse:
    """Преобразовать спектакль для списка."""
    return PerformanceListResponse(
        id=p.id,
        title=p.title,
        subtitle=p.subtitle,
        author=p.author,
        director=p.director,
        genre=p.genre,
        age_rating=p.age_rating,
        duration_minutes=p.duration_minutes,
        status=p.status,
        premiere_date=p.premiere_date,
        poster_path=p.poster_path,
        is_active=p.is_active,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


def _section_to_response(s) -> SectionResponse:
    """Преобразовать раздел в response."""
    return SectionResponse(
        id=s.id,
        performance_id=s.performance_id,
        section_type=s.section_type,
        title=s.title,
        content=s.content,
        responsible_id=s.responsible_id,
        data=s.data,
        sort_order=s.sort_order,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )
