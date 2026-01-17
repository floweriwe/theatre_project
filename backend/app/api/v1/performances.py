"""
API эндпоинты модуля спектаклей.

Роуты:
- /performances — спектакли
- /performances/{id}/sections — разделы паспорта
- /performances/{id}/documents — документы спектакля
- /performances/stats — статистика
"""
from typing import List
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
from app.schemas.checklist import (
    ChecklistCreate,
    ChecklistResponse,
    ChecklistWithItemsResponse,
    ChecklistItemCreate,
    ChecklistItemResponse,
    ChecklistItemUpdate,
)
from app.schemas.performance_document import (
    PerformanceDocumentCreate,
    PerformanceDocumentUpdate,
    PerformanceDocumentResponse,
    PerformanceDocumentListItem,
    PerformanceDocumentsTree,
    DocumentTreeSection,
    DocumentTreeCategory,
    BulkUploadResult,
    PassportReadinessResponse,
    SectionDetailedReadiness,
    SECTION_NAMES,
    CATEGORY_NAMES,
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


# =============================================================================
# Checklists Endpoints
# =============================================================================

@router.get(
    "/{performance_id}/checklists",
    response_model=list[ChecklistWithItemsResponse],
    summary="Получить чеклисты спектакля",
)
async def get_performance_checklists(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Получить все чеклисты готовности спектакля."""

    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    checklists = await service.get_checklists(performance_id)

    result = []
    for cl in checklists:
        items = [
            ChecklistItemResponse(
                id=item.id,
                checklist_id=item.checklist_id,
                description=item.description,
                is_completed=item.is_completed,
                sort_order=item.sort_order,
                assigned_to_id=item.assigned_to_id,
                completed_at=item.completed_at,
                created_at=item.created_at,
            )
            for item in cl.items
        ]
        result.append(ChecklistWithItemsResponse(
            id=cl.id,
            performance_id=cl.performance_id,
            name=cl.name,
            description=cl.description,
            is_active=cl.is_active,
            created_at=cl.created_at,
            updated_at=cl.updated_at,
            items=items,
            total_items=cl.total_items,
            completed_items=cl.completed_items,
            completion_percentage=cl.completion_percentage,
        ))

    return result


@router.post(
    "/{performance_id}/checklists",
    response_model=ChecklistResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать чеклист",
)
async def create_checklist(
    performance_id: int,
    data: ChecklistCreate,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Создать новый чеклист для спектакля."""

    try:
        checklist = await service.create_checklist(
            performance_id=performance_id,
            name=data.name,
            description=data.description,
            user_id=current_user.id,
        )
        return ChecklistResponse(
            id=checklist.id,
            performance_id=checklist.performance_id,
            name=checklist.name,
            description=checklist.description,
            is_active=checklist.is_active,
            created_at=checklist.created_at,
            updated_at=checklist.updated_at,
        )
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.delete(
    "/checklists/{checklist_id}",
    response_model=MessageResponse,
    summary="Удалить чеклист",
)
async def delete_checklist(
    checklist_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Удалить чеклист."""
    try:
        await service.delete_checklist(checklist_id)
        return MessageResponse(message="Чеклист успешно удалён")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.post(
    "/checklists/{checklist_id}/items",
    response_model=ChecklistItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить элемент в чеклист",
)
async def add_checklist_item(
    checklist_id: int,
    data: ChecklistItemCreate,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Добавить элемент в чеклист."""

    try:
        item = await service.add_checklist_item(
            checklist_id=checklist_id,
            description=data.description,
        )
        return ChecklistItemResponse(
            id=item.id,
            checklist_id=item.checklist_id,
            description=item.description,
            is_completed=item.is_completed,
            sort_order=item.sort_order,
            assigned_to_id=item.assigned_to_id,
            completed_at=item.completed_at,
            created_at=item.created_at,
        )
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.patch(
    "/checklist-items/{item_id}",
    response_model=ChecklistItemResponse,
    summary="Обновить элемент чеклиста",
)
async def update_checklist_item(
    item_id: int,
    data: ChecklistItemUpdate,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Обновить элемент чеклиста (например, отметить выполненным)."""

    try:
        item = await service.update_checklist_item(
            item_id=item_id,
            description=data.description,
            is_completed=data.is_completed,
            sort_order=data.sort_order,
            assigned_to_id=data.assigned_to_id,
        )
        return ChecklistItemResponse(
            id=item.id,
            checklist_id=item.checklist_id,
            description=item.description,
            is_completed=item.is_completed,
            sort_order=item.sort_order,
            assigned_to_id=item.assigned_to_id,
            completed_at=item.completed_at,
            created_at=item.created_at,
        )
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.delete(
    "/checklist-items/{item_id}",
    response_model=MessageResponse,
    summary="Удалить элемент чеклиста",
)
async def delete_checklist_item(
    item_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Удалить элемент из чеклиста."""
    try:
        await service.delete_checklist_item(item_id)
        return MessageResponse(message="Элемент успешно удалён")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Performance Documents Endpoints
# =============================================================================

@router.get(
    "/{performance_id}/documents",
    response_model=PerformanceDocumentsTree,
    summary="Получить документы спектакля",
)
async def get_performance_documents(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Получить документы спектакля, сгруппированные по разделам."""
    from collections import defaultdict
    from sqlalchemy import select
    from app.models.performance_document import (
        PerformanceDocument,
        DocumentSection,
        PerformanceDocumentCategory,
    )
    from app.services.performance_document_service import performance_document_storage

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Получаем документы
    result = await service._session.execute(
        select(PerformanceDocument)
        .where(
            PerformanceDocument.performance_id == performance_id,
            PerformanceDocument.is_current == True,
        )
        .order_by(PerformanceDocument.section, PerformanceDocument.sort_order)
    )
    documents = result.scalars().all()

    # Группируем по разделам и категориям
    grouped: dict[DocumentSection, dict[PerformanceDocumentCategory, list]] = defaultdict(
        lambda: defaultdict(list)
    )

    for doc in documents:
        download_url = performance_document_storage.get_download_url(doc.file_path)
        grouped[doc.section][doc.category].append(
            PerformanceDocumentListItem(
                id=doc.id,
                file_name=doc.file_name,
                file_size=doc.file_size,
                mime_type=doc.mime_type,
                section=doc.section,
                category=doc.category,
                display_name=doc.display_name,
                uploaded_at=doc.uploaded_at,
                download_url=download_url,
            )
        )

    # Формируем дерево
    sections = []
    for section in DocumentSection:
        categories = []
        section_docs = grouped.get(section, {})

        for category in PerformanceDocumentCategory:
            cat_docs = section_docs.get(category, [])
            if cat_docs:  # Включаем только непустые категории
                categories.append(
                    DocumentTreeCategory(
                        category=category,
                        category_name=CATEGORY_NAMES.get(category, category.value),
                        documents=cat_docs,
                        count=len(cat_docs),
                    )
                )

        section_total = sum(len(c.documents) for c in categories)
        if categories:  # Включаем только непустые разделы
            sections.append(
                DocumentTreeSection(
                    section=section,
                    section_name=SECTION_NAMES.get(section, section.value),
                    categories=categories,
                    total_count=section_total,
                )
            )

    return PerformanceDocumentsTree(
        performance_id=performance_id,
        sections=sections,
        total_documents=len(documents),
    )


@router.post(
    "/{performance_id}/documents",
    response_model=list[PerformanceDocumentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Загрузить документы",
)
async def upload_performance_documents(
    performance_id: int,
    current_user: CurrentUserDep,
    files: List[UploadFile] = File(..., description="Файлы документов"),
    service: PerformanceService = PerformanceServiceDep,
):
    """Загрузить документы спектакля с автокатегоризацией."""
    from app.models.performance_document import PerformanceDocument
    from app.services.performance_document_service import (
        performance_document_storage,
        document_categorization_service,
        StorageException,
    )

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Валидация файлов
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    ALLOWED_TYPES = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "audio/mpeg",
        "audio/wav",
        "video/mp4",
        "text/plain",
        "text/csv",
        "application/octet-stream",  # Для специализированных файлов (dwg, c2p, cues)
    }

    uploaded_docs = []
    try:
        for file in files:
            # Проверяем тип файла
            content_type = file.content_type or "application/octet-stream"

            # Читаем содержимое
            content = await file.read()
            file_size = len(content)

            # Проверяем размер
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Файл {file.filename} слишком большой (максимум 50MB)"
                )

            # Автокатегоризация
            category, section, confidence = document_categorization_service.categorize(
                file.filename or "document"
            )

            # Генерируем отображаемое имя
            display_name = document_categorization_service.suggest_display_name(
                file.filename or "document"
            )

            # Загружаем в MinIO
            storage_path, _, mime_type = await performance_document_storage.upload(
                file_data=content,
                performance_id=performance_id,
                section=section,
                filename=file.filename or "document",
                content_type=content_type,
            )

            # Создаём запись в БД
            doc = PerformanceDocument(
                performance_id=performance_id,
                file_path=storage_path,
                file_name=file.filename or "document",
                file_size=file_size,
                mime_type=mime_type,
                section=section,
                category=category,
                display_name=display_name,
                uploaded_by_id=current_user.id,
            )
            service._session.add(doc)
            await service._session.flush()

            # Добавляем URL для ответа
            download_url = performance_document_storage.get_download_url(storage_path)

            uploaded_docs.append(
                PerformanceDocumentResponse(
                    id=doc.id,
                    performance_id=doc.performance_id,
                    file_path=doc.file_path,
                    file_name=doc.file_name,
                    file_size=doc.file_size,
                    mime_type=doc.mime_type,
                    section=doc.section,
                    category=doc.category,
                    subcategory=doc.subcategory,
                    display_name=doc.display_name,
                    description=doc.description,
                    sort_order=doc.sort_order,
                    report_inclusion=doc.report_inclusion,
                    version=doc.version,
                    is_current=doc.is_current,
                    uploaded_by_id=doc.uploaded_by_id,
                    uploaded_at=doc.uploaded_at,
                    download_url=download_url,
                )
            )

        await service._session.commit()
        return uploaded_docs

    except StorageException as e:
        await service._session.rollback()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Ошибка загрузки: {str(e)}")
    except Exception as e:
        await service._session.rollback()
        raise


@router.get(
    "/{performance_id}/documents/{document_id}",
    response_model=PerformanceDocumentResponse,
    summary="Получить документ",
)
async def get_performance_document(
    performance_id: int,
    document_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Получить документ спектакля по ID."""
    from sqlalchemy import select
    from app.models.performance_document import PerformanceDocument
    from app.services.performance_document_service import performance_document_storage

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Получаем документ
    result = await service._session.execute(
        select(PerformanceDocument).where(
            PerformanceDocument.id == document_id,
            PerformanceDocument.performance_id == performance_id,
        )
    )
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Документ не найден")

    download_url = performance_document_storage.get_download_url(doc.file_path)

    return PerformanceDocumentResponse(
        id=doc.id,
        performance_id=doc.performance_id,
        file_path=doc.file_path,
        file_name=doc.file_name,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        section=doc.section,
        category=doc.category,
        subcategory=doc.subcategory,
        display_name=doc.display_name,
        description=doc.description,
        sort_order=doc.sort_order,
        report_inclusion=doc.report_inclusion,
        version=doc.version,
        is_current=doc.is_current,
        uploaded_by_id=doc.uploaded_by_id,
        uploaded_at=doc.uploaded_at,
        download_url=download_url,
    )


@router.patch(
    "/{performance_id}/documents/{document_id}",
    response_model=PerformanceDocumentResponse,
    summary="Обновить документ",
)
async def update_performance_document(
    performance_id: int,
    document_id: int,
    data: PerformanceDocumentUpdate,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Обновить метаданные документа."""
    from sqlalchemy import select
    from app.models.performance_document import PerformanceDocument
    from app.services.performance_document_service import performance_document_storage

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Получаем документ
    result = await service._session.execute(
        select(PerformanceDocument).where(
            PerformanceDocument.id == document_id,
            PerformanceDocument.performance_id == performance_id,
        )
    )
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Документ не найден")

    # Обновляем поля
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doc, field, value)

    await service._session.commit()
    await service._session.refresh(doc)

    download_url = performance_document_storage.get_download_url(doc.file_path)

    return PerformanceDocumentResponse(
        id=doc.id,
        performance_id=doc.performance_id,
        file_path=doc.file_path,
        file_name=doc.file_name,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        section=doc.section,
        category=doc.category,
        subcategory=doc.subcategory,
        display_name=doc.display_name,
        description=doc.description,
        sort_order=doc.sort_order,
        report_inclusion=doc.report_inclusion,
        version=doc.version,
        is_current=doc.is_current,
        uploaded_by_id=doc.uploaded_by_id,
        uploaded_at=doc.uploaded_at,
        download_url=download_url,
    )


@router.delete(
    "/{performance_id}/documents/{document_id}",
    response_model=MessageResponse,
    summary="Удалить документ",
)
async def delete_performance_document(
    performance_id: int,
    document_id: int,
    current_user: CurrentUserDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """Удалить документ спектакля."""
    from sqlalchemy import select, delete
    from app.models.performance_document import PerformanceDocument
    from app.services.performance_document_service import performance_document_storage

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Получаем документ
    result = await service._session.execute(
        select(PerformanceDocument).where(
            PerformanceDocument.id == document_id,
            PerformanceDocument.performance_id == performance_id,
        )
    )
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Документ не найден")

    # Удаляем файл из MinIO
    await performance_document_storage.delete(doc.file_path)

    # Удаляем запись из БД
    await service._session.execute(
        delete(PerformanceDocument).where(PerformanceDocument.id == document_id)
    )
    await service._session.commit()

    return MessageResponse(message="Документ успешно удалён")


# =============================================================================
# Document Tree & Passport Readiness Endpoints
# =============================================================================

@router.get(
    "/{performance_id}/documents/tree",
    response_model=PerformanceDocumentsTree,
    summary="Получить дерево документов",
)
async def get_documents_tree(
    performance_id: int,
    current_user: CurrentUserDep,
    session: SessionDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """
    Получить иерархическое дерево документов спектакля.

    Документы сгруппированы по разделам (1.0-4.0) и категориям
    с подсчётом количества в каждой группе.
    """
    from app.services.document_tree_service import document_tree_service

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    return await document_tree_service.get_document_tree(session, performance_id)


@router.get(
    "/{performance_id}/passport-readiness",
    response_model=PassportReadinessResponse,
    summary="Готовность паспорта спектакля",
)
async def get_passport_readiness(
    performance_id: int,
    current_user: CurrentUserDep,
    session: SessionDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """
    Получить отчёт о готовности паспорта спектакля.

    Рассчитывает процент заполненности по каждому разделу
    на основе обязательных категорий документов.
    """
    from app.services.passport_readiness_service import PassportReadinessService

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    readiness_service = PassportReadinessService(session)
    return await readiness_service.get_passport_readiness(performance_id)


@router.get(
    "/{performance_id}/passport-readiness/{section}",
    response_model=SectionDetailedReadiness,
    summary="Детали готовности раздела",
)
async def get_section_readiness(
    performance_id: int,
    section: str,
    current_user: CurrentUserDep,
    session: SessionDep,
    service: PerformanceService = PerformanceServiceDep,
):
    """
    Получить детализированную готовность раздела паспорта.

    Показывает статус каждой категории внутри раздела:
    какие категории заполнены, сколько документов в каждой.
    """
    from app.services.passport_readiness_service import PassportReadinessService
    from app.models.performance_document import DocumentSection

    # Проверяем существование спектакля
    try:
        await service.get_performance(performance_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Преобразуем строку раздела в enum
    try:
        section_enum = DocumentSection(section)
    except ValueError:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Неверный раздел: {section}. Допустимые значения: 1.0, 2.0, 3.0, 4.0"
        )

    readiness_service = PassportReadinessService(session)
    return await readiness_service.get_section_readiness(performance_id, section_enum)
