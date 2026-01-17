"""
API эндпоинты Performance Hub.

Роуты:
- /performances/{id}/structure — структура спектакля
- /performances/{id}/snapshot — версионирование
- /performances/{id}/inventory — связь с инвентарём (Hub)
- /performances/{id}/cast — каст и персонал
- /checklists/templates — шаблоны чеклистов
- /performances/{id}/checklists — экземпляры чеклистов
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, SessionDep
from app.schemas.base import MessageResponse
from app.schemas.performance import (
    PerformanceInventoryLinkCreate,
    PerformanceInventoryLinkUpdate,
    PerformanceInventoryLinkResponse,
    PerformanceSnapshotCreate,
    PerformanceSnapshotResponse,
)
from app.schemas.checklist_hub import (
    ChecklistTemplateCreate,
    ChecklistTemplateUpdate,
    ChecklistTemplateResponse,
    ChecklistTemplateListResponse,
    ChecklistInstanceCreate,
    ChecklistInstanceResponse,
    ChecklistItemUpdate,
)
from app.schemas.performance_cast import (
    PerformanceCastCreate,
    PerformanceCastUpdate,
    PerformanceCastResponse,
    PerformanceCastGroupedResponse,
)
from app.services.performance_hub_service import PerformanceHubService

router = APIRouter(tags=["Performance Hub"])


# =============================================================================
# Dependencies
# =============================================================================

async def get_hub_service(session: SessionDep) -> PerformanceHubService:
    """Получить сервис Performance Hub."""
    return PerformanceHubService(session)


HubServiceDep = Depends(get_hub_service)


# =============================================================================
# Performance Structure Endpoints
# =============================================================================

@router.get(
    "/performances/{performance_id}/structure",
    summary="Получить полную структуру спектакля",
)
async def get_performance_structure(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """
    Получить полную структуру спектакля для Performance Constructor.

    Включает: разделы, инвентарь, каст, чеклисты.
    """
    structure = await service.get_performance_structure(performance_id)
    if not structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Спектакль {performance_id} не найден",
        )
    return structure


@router.post(
    "/performances/{performance_id}/snapshot",
    response_model=PerformanceSnapshotResponse,
    summary="Создать снапшот конфигурации",
)
async def create_snapshot(
    performance_id: int,
    data: PerformanceSnapshotCreate,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Создать новую версию (снапшот) конфигурации спектакля."""
    try:
        return await service.create_snapshot(performance_id, data.description)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


# =============================================================================
# Inventory Link Endpoints (Hub)
# =============================================================================

@router.post(
    "/performances/{performance_id}/inventory",
    response_model=PerformanceInventoryLinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить инвентарь к спектаклю",
)
async def add_inventory_link(
    performance_id: int,
    data: PerformanceInventoryLinkCreate,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Добавить связь инвентаря со спектаклем (с поддержкой сцены)."""
    try:
        return await service.add_inventory_link(performance_id, data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch(
    "/performances/{performance_id}/inventory/{link_id}",
    response_model=PerformanceInventoryLinkResponse,
    summary="Обновить связь инвентаря",
)
async def update_inventory_link(
    performance_id: int,
    link_id: UUID,
    data: PerformanceInventoryLinkUpdate,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Обновить количество, примечание или сцену для связи инвентаря."""
    try:
        return await service.update_inventory_link(performance_id, link_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete(
    "/performances/{performance_id}/inventory/{link_id}",
    response_model=MessageResponse,
    summary="Удалить связь инвентаря",
)
async def remove_inventory_link(
    performance_id: int,
    link_id: UUID,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Удалить связь инвентаря со спектаклем."""
    success = await service.remove_inventory_link(performance_id, link_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Связь не найдена",
        )
    return MessageResponse(message="Связь удалена")


# =============================================================================
# Checklist Template Endpoints
# =============================================================================

@router.get(
    "/checklists/templates",
    response_model=list[ChecklistTemplateResponse],
    summary="Получить шаблоны чеклистов",
)
async def get_checklist_templates(
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Получить список доступных шаблонов чеклистов."""
    return await service.get_checklist_templates(current_user.theater_id)


@router.post(
    "/checklists/templates",
    response_model=ChecklistTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать шаблон чеклиста",
)
async def create_checklist_template(
    data: ChecklistTemplateCreate,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Создать новый шаблон чеклиста."""
    return await service.create_checklist_template(data, current_user.theater_id)


# =============================================================================
# Checklist Instance Endpoints
# =============================================================================

@router.post(
    "/performances/{performance_id}/checklists",
    response_model=ChecklistInstanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать экземпляр чеклиста",
)
async def create_checklist_instance(
    performance_id: int,
    data: ChecklistInstanceCreate,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Создать экземпляр чеклиста для спектакля из шаблона."""
    return await service.create_checklist_instance(performance_id, data)


@router.patch(
    "/checklists/{instance_id}/item/{item_index}",
    response_model=ChecklistInstanceResponse,
    summary="Обновить элемент чеклиста",
)
async def update_checklist_item(
    instance_id: UUID,
    item_index: int,
    data: ChecklistItemUpdate,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Обновить статус элемента чеклиста (отметить выполненным)."""
    try:
        return await service.update_checklist_item(
            instance_id, item_index, data, current_user.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


# =============================================================================
# Cast & Crew Endpoints
# =============================================================================

@router.get(
    "/performances/{performance_id}/cast",
    response_model=PerformanceCastGroupedResponse,
    summary="Получить каст и персонал",
)
async def get_cast_crew(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Получить каст и персонал спектакля, сгруппированные по типу."""
    return await service.get_cast_crew(performance_id)


@router.post(
    "/performances/{performance_id}/cast",
    response_model=PerformanceCastResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить участника",
)
async def add_cast_member(
    performance_id: int,
    data: PerformanceCastCreate,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Добавить участника (актёра или персонал) к спектаклю."""
    try:
        return await service.add_cast_member(performance_id, data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch(
    "/performances/{performance_id}/cast/{member_id}",
    response_model=PerformanceCastResponse,
    summary="Обновить участника",
)
async def update_cast_member(
    performance_id: int,
    member_id: UUID,
    data: PerformanceCastUpdate,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Обновить информацию об участнике (персонаж, роль, дублёр)."""
    try:
        return await service.update_cast_member(performance_id, member_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete(
    "/performances/{performance_id}/cast/{member_id}",
    response_model=MessageResponse,
    summary="Удалить участника",
)
async def remove_cast_member(
    performance_id: int,
    member_id: UUID,
    current_user: CurrentUserDep,
    service: PerformanceHubService = HubServiceDep,
):
    """Удалить участника из спектакля."""
    success = await service.remove_cast_member(performance_id, member_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Участник не найден",
        )
    return MessageResponse(message="Участник удалён")
