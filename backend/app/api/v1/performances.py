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
    PerformanceInventoryCreate,
    PerformanceInventoryItemResponse,
    PerformanceInventoryResponse,
)
from app.models.performance_inventory import PerformanceInventory
from app.models.inventory import InventoryItem
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


# =============================================================================
# Performance Inventory Endpoints
# =============================================================================

@router.get(
    "/{performance_id}/inventory",
    response_model=PerformanceInventoryResponse,
    summary="Получить инвентарь спектакля",
)
async def get_performance_inventory(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Получить список предметов инвентаря, привязанных к спектаклю."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Получаем привязанный инвентарь
    result = await service._session.execute(
        select(PerformanceInventory)
        .where(PerformanceInventory.performance_id == performance_id)
        .options(selectinload(PerformanceInventory.item))
    )
    links = result.scalars().all()

    items = []
    for link in links:
        if link.item:
            items.append(PerformanceInventoryItemResponse(
                item_id=link.item_id,
                item_name=link.item.name,
                item_inventory_number=link.item.inventory_number,
                item_status=link.item.status.value,
                note=link.note,
                quantity_required=link.quantity_required,
                created_at=link.created_at,
            ))

    return PerformanceInventoryResponse(
        performance_id=performance_id,
        items=items,
    )


@router.post(
    "/{performance_id}/inventory",
    response_model=PerformanceInventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Привязать инвентарь к спектаклю",
)
async def add_performance_inventory(
    performance_id: int,
    data: PerformanceInventoryCreate,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Привязать предмет инвентаря к спектаклю."""
    from sqlalchemy import select

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Проверяем существование предмета инвентаря
    item_result = await service._session.execute(
        select(InventoryItem).where(InventoryItem.id == data.item_id)
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Предмет инвентаря не найден")

    # Проверяем, нет ли уже такой связи
    existing_result = await service._session.execute(
        select(PerformanceInventory).where(
            PerformanceInventory.performance_id == performance_id,
            PerformanceInventory.item_id == data.item_id,
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Этот предмет уже привязан к спектаклю"
        )

    # Создаём связь
    link = PerformanceInventory(
        performance_id=performance_id,
        item_id=data.item_id,
        note=data.note,
        quantity_required=data.quantity_required,
    )
    service._session.add(link)
    await service._session.commit()
    await service._session.refresh(link)

    return PerformanceInventoryItemResponse(
        item_id=item.id,
        item_name=item.name,
        item_inventory_number=item.inventory_number,
        item_status=item.status.value,
        note=link.note,
        quantity_required=link.quantity_required,
        created_at=link.created_at,
    )


@router.delete(
    "/{performance_id}/inventory/{item_id}",
    response_model=MessageResponse,
    summary="Отвязать инвентарь от спектакля",
)
async def remove_performance_inventory(
    performance_id: int,
    item_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Удалить привязку предмета инвентаря от спектакля."""
    from sqlalchemy import select, delete

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Проверяем существование связи
    existing_result = await service._session.execute(
        select(PerformanceInventory).where(
            PerformanceInventory.performance_id == performance_id,
            PerformanceInventory.item_id == item_id,
        )
    )
    link = existing_result.scalar_one_or_none()
    if not link:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Связь между спектаклем и предметом не найдена"
        )

    # Удаляем связь
    await service._session.execute(
        delete(PerformanceInventory).where(
            PerformanceInventory.performance_id == performance_id,
            PerformanceInventory.item_id == item_id,
        )
    )
    await service._session.commit()

    return MessageResponse(message="Предмет успешно отвязан от спектакля")
