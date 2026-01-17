"""
API ÑÐ½Ð´Ð¿Ð¾Ð¸Ð½Ñ‚Ñ‹ Ð¼Ð¾Ð´ÑƒÐ»Ñ Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð·Ð°Ñ†Ð¸Ð¸.

Ð Ð¾ÑƒÑ‚Ñ‹:
- /inventory/items â€” Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚Ñ‹ Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ñ
- /inventory/categories â€” ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
- /inventory/locations â€” Ð¼ÐµÑÑ‚Ð° Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ
- /inventory/stats â€” ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ°
"""
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.api.deps import CurrentUserDep, SessionDep
from app.core.exceptions import NotFoundError, AlreadyExistsError, ValidationError
from app.core.permissions import Permission, require_permission
from app.models.inventory import ItemStatus
from app.schemas.base import MessageResponse
from app.schemas.inventory import (
    # Categories
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryWithChildren,
    PaginatedCategories,
    # Locations
    LocationCreate,
    LocationUpdate,
    LocationResponse,
    LocationWithChildren,
    PaginatedLocations,
    # Items
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    InventoryItemListResponse,
    PaginatedItems,
    # Photos
    InventoryPhotoResponse,
    # Movements
    MovementResponse,
    PaginatedMovements,
    # Stats
    InventoryStats,
)
from app.models.inventory_photo import InventoryPhoto
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Ð˜Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€ÑŒ"])


# =============================================================================
# Dependencies
# =============================================================================

async def get_inventory_service(session: SessionDep) -> InventoryService:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐµÑ€Ð²Ð¸Ñ Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð·Ð°Ñ†Ð¸Ð¸."""
    return InventoryService(session)


InventoryServiceDep = Depends(get_inventory_service)


# =============================================================================
# Items Endpoints
# =============================================================================

@router.get(
    "/items",
    response_model=PaginatedItems,
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚Ð¾Ð²",
    description="Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‰Ð°ÐµÑ‚ Ð¿Ð¾ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ‡Ð½Ñ‹Ð¹ ÑÐ¿Ð¸ÑÐ¾Ðº Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚Ð¾Ð² Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ñ Ñ Ñ„Ð¸Ð»ÑŒÑ‚Ñ€Ð°Ñ†Ð¸ÐµÐ¹",
)
async def get_items(
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
    search: str | None = Query(None, description="ÐŸÐ¾Ð¸ÑÐº Ð¿Ð¾ Ð½Ð°Ð·Ð²Ð°Ð½Ð¸ÑŽ/Ð½Ð¾Ð¼ÐµÑ€Ñƒ"),
    category_id: int | None = Query(None, description="Ð¤Ð¸Ð»ÑŒÑ‚Ñ€ Ð¿Ð¾ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸"),
    location_id: int | None = Query(None, description="Ð¤Ð¸Ð»ÑŒÑ‚Ñ€ Ð¿Ð¾ Ð¼ÐµÑÑ‚Ñƒ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ"),
    status: ItemStatus | None = Query(None, description="Ð¤Ð¸Ð»ÑŒÑ‚Ñ€ Ð¿Ð¾ ÑÑ‚Ð°Ñ‚ÑƒÑÑƒ"),
    is_active: bool = Query(True, description="Ð¢Ð¾Ð»ÑŒÐºÐ¾ Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ðµ"),
    page: int = Query(1, ge=1, description="ÐÐ¾Ð¼ÐµÑ€ ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñ‹"),
    limit: int = Query(20, ge=1, le=100, description="Ð­Ð»ÐµÐ¼ÐµÐ½Ñ‚Ð¾Ð² Ð½Ð° ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ðµ"),
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚Ð¾Ð² Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ñ."""
    skip = (page - 1) * limit
    
    items, total = await service.get_items(
        search=search,
        category_id=category_id,
        location_id=location_id,
        status=status,
        is_active=is_active,
        theater_id=current_user.theater_id,
        skip=skip,
        limit=limit,
    )
    
    # ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·ÑƒÐµÐ¼ Ð² list response
    items_response = []
    for item in items:
        items_response.append(InventoryItemListResponse(
            id=item.id,
            name=item.name,
            inventory_number=item.inventory_number,
            status=item.status,
            quantity=item.quantity,
            category_id=item.category_id,
            category_name=item.category.name if item.category else None,
            location_id=item.location_id,
            location_name=item.location.name if item.location else None,
            is_active=item.is_active,
            created_at=item.created_at,
        ))
    
    return PaginatedItems(
        items=items_response,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
    )


@router.post(
    "/items",
    response_model=InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚",
)
async def create_item(
    data: InventoryItemCreate,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ð½Ð¾Ð²Ñ‹Ð¹ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚ Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ñ."""
    try:
        item = await service.create_item(
            data=data,
            user_id=current_user.id,
            theater_id=current_user.theater_id,
        )
        return _item_to_response(item)
    except AlreadyExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, e.detail)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.get(
    "/items/{item_id}",
    response_model=InventoryItemResponse,
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚ Ð¿Ð¾ ID",
)
async def get_item(
    item_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð´ÐµÑ‚Ð°Ð»ÑŒÐ½ÑƒÑŽ Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸ÑŽ Ð¾ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚Ðµ."""
    try:
        item = await service.get_item(item_id)
        return _item_to_response(item)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.patch(
    "/items/{item_id}",
    response_model=InventoryItemResponse,
    summary="ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚",
)
async def update_item(
    item_id: int,
    data: InventoryItemUpdate,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚ Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ñ."""
    try:
        item = await service.update_item(
            item_id=item_id,
            data=data,
            user_id=current_user.id,
        )
        return _item_to_response(item)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except AlreadyExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, e.detail)


@router.delete(
    "/items/{item_id}",
    response_model=MessageResponse,
    summary="Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚",
)
async def delete_item(
    item_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚ Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ñ (soft delete)."""
    try:
        await service.delete_item(item_id, current_user.id)
        return MessageResponse(message="ÐŸÑ€ÐµÐ´Ð¼ÐµÑ‚ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»Ñ‘Ð½")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Item Actions
# =============================================================================

@router.post(
    "/items/{item_id}/transfer",
    response_model=InventoryItemResponse,
    summary="ÐŸÐµÑ€ÐµÐ¼ÐµÑÑ‚Ð¸Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚",
)
async def transfer_item(
    item_id: int,
    to_location_id: int = Query(..., description="ID Ð¼ÐµÑÑ‚Ð° Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ñ"),
    comment: str | None = Query(None, description="ÐšÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð¹"),
    current_user: CurrentUserDep = None,
    service: InventoryService = InventoryServiceDep,
):
    """ÐŸÐµÑ€ÐµÐ¼ÐµÑÑ‚Ð¸Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚ Ð² Ð´Ñ€ÑƒÐ³Ð¾Ðµ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ."""
    try:
        item = await service.transfer_item(
            item_id=item_id,
            to_location_id=to_location_id,
            user_id=current_user.id,
            comment=comment,
        )
        return _item_to_response(item)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


@router.post(
    "/items/{item_id}/reserve",
    response_model=InventoryItemResponse,
    summary="Ð—Ð°Ñ€ÐµÐ·ÐµÑ€Ð²Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚",
)
async def reserve_item(
    item_id: int,
    performance_id: int | None = Query(None, description="ID ÑÐ¿ÐµÐºÑ‚Ð°ÐºÐ»Ñ"),
    comment: str | None = Query(None, description="ÐšÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð¹"),
    current_user: CurrentUserDep = None,
    service: InventoryService = InventoryServiceDep,
):
    """Ð—Ð°Ñ€ÐµÐ·ÐµÑ€Ð²Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚ Ð´Ð»Ñ ÑÐ¿ÐµÐºÑ‚Ð°ÐºÐ»Ñ."""
    try:
        item = await service.reserve_item(
            item_id=item_id,
            user_id=current_user.id,
            performance_id=performance_id,
            comment=comment,
        )
        return _item_to_response(item)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


@router.post(
    "/items/{item_id}/release",
    response_model=InventoryItemResponse,
    summary="ÐžÑÐ²Ð¾Ð±Ð¾Ð´Ð¸Ñ‚ÑŒ Ð¸Ð· Ñ€ÐµÐ·ÐµÑ€Ð²Ð°",
)
async def release_item(
    item_id: int,
    comment: str | None = Query(None, description="ÐšÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð¹"),
    current_user: CurrentUserDep = None,
    service: InventoryService = InventoryServiceDep,
):
    """ÐžÑÐ²Ð¾Ð±Ð¾Ð´Ð¸Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚ Ð¸Ð· Ñ€ÐµÐ·ÐµÑ€Ð²Ð°."""
    try:
        item = await service.release_item(
            item_id=item_id,
            user_id=current_user.id,
            comment=comment,
        )
        return _item_to_response(item)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


@router.post(
    "/items/{item_id}/write-off",
    response_model=InventoryItemResponse,
    summary="Ð¡Ð¿Ð¸ÑÐ°Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚",
)
async def write_off_item(
    item_id: int,
    comment: str | None = Query(None, description="ÐŸÑ€Ð¸Ñ‡Ð¸Ð½Ð° ÑÐ¿Ð¸ÑÐ°Ð½Ð¸Ñ"),
    current_user: CurrentUserDep = None,
    service: InventoryService = InventoryServiceDep,
):
    """Ð¡Ð¿Ð¸ÑÐ°Ñ‚ÑŒ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚ Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ñ."""
    try:
        item = await service.write_off_item(
            item_id=item_id,
            user_id=current_user.id,
            comment=comment,
        )
        return _item_to_response(item)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


@router.get(
    "/items/{item_id}/movements",
    response_model=list[MovementResponse],
    summary="Ð˜ÑÑ‚Ð¾Ñ€Ð¸Ñ Ð¿ÐµÑ€ÐµÐ¼ÐµÑ‰ÐµÐ½Ð¸Ð¹",
)
async def get_item_movements(
    item_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑŽ Ð¿ÐµÑ€ÐµÐ¼ÐµÑ‰ÐµÐ½Ð¸Ð¹ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚Ð°."""
    try:
        movements = await service.get_item_movements(item_id, skip, limit)
        return [_movement_to_response(m) for m in movements]
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Categories Endpoints
# =============================================================================

@router.get(
    "/categories",
    response_model=list[CategoryResponse],
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹",
)
async def get_categories(
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹."""
    categories, _ = await service.get_categories(current_user.theater_id)
    return [_category_to_response(c) for c in categories if c.is_active]


@router.get(
    "/categories/tree",
    response_model=list[CategoryWithChildren],
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð´ÐµÑ€ÐµÐ²Ð¾ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹",
)
async def get_categories_tree(
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¸ÐµÑ€Ð°Ñ€Ñ…Ð¸Ñ‡ÐµÑÐºÐ¾Ðµ Ð´ÐµÑ€ÐµÐ²Ð¾ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹."""
    categories = await service.get_categories_tree(current_user.theater_id)
    return [_category_to_tree_response(c) for c in categories]


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ",
)
async def create_category(
    data: CategoryCreate,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ð½Ð¾Ð²ÑƒÑŽ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ."""
    try:
        category = await service.create_category(
            data=data,
            user_id=current_user.id,
            theater_id=current_user.theater_id,
        )
        return _category_to_response(category)
    except AlreadyExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, e.detail)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.get(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ",
)
async def get_category(
    category_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ Ð¿Ð¾ ID."""
    try:
        category = await service.get_category(category_id)
        return _category_to_response(category)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.patch(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    summary="ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ",
)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ."""
    try:
        category = await service.update_category(
            category_id=category_id,
            data=data,
            user_id=current_user.id,
        )
        return _category_to_response(category)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except AlreadyExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, e.detail)


@router.delete(
    "/categories/{category_id}",
    response_model=MessageResponse,
    summary="Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ",
)
async def delete_category(
    category_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ (soft delete)."""
    try:
        await service.delete_category(category_id)
        return MessageResponse(message="ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»ÐµÐ½Ð°")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Locations Endpoints
# =============================================================================

@router.get(
    "/locations",
    response_model=list[LocationResponse],
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº Ð¼ÐµÑÑ‚ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ",
)
async def get_locations(
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº Ð¼ÐµÑÑ‚ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ."""
    locations, _ = await service.get_locations(current_user.theater_id)
    return [_location_to_response(l) for l in locations if l.is_active]


@router.get(
    "/locations/tree",
    response_model=list[LocationWithChildren],
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð´ÐµÑ€ÐµÐ²Ð¾ Ð¼ÐµÑÑ‚ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ",
)
async def get_locations_tree(
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¸ÐµÑ€Ð°Ñ€Ñ…Ð¸Ñ‡ÐµÑÐºÐ¾Ðµ Ð´ÐµÑ€ÐµÐ²Ð¾ Ð¼ÐµÑÑ‚ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ."""
    locations = await service.get_locations_tree(current_user.theater_id)
    return [_location_to_tree_response(l) for l in locations]


@router.post(
    "/locations",
    response_model=LocationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ",
)
async def create_location(
    data: LocationCreate,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ð½Ð¾Ð²Ð¾Ðµ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ."""
    try:
        location = await service.create_location(
            data=data,
            user_id=current_user.id,
            theater_id=current_user.theater_id,
        )
        return _location_to_response(location)
    except AlreadyExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, e.detail)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.get(
    "/locations/{location_id}",
    response_model=LocationResponse,
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ",
)
async def get_location(
    location_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ Ð¿Ð¾ ID."""
    try:
        location = await service.get_location(location_id)
        return _location_to_response(location)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.patch(
    "/locations/{location_id}",
    response_model=LocationResponse,
    summary="ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ",
)
async def update_location(
    location_id: int,
    data: LocationUpdate,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ."""
    try:
        location = await service.update_location(
            location_id=location_id,
            data=data,
            user_id=current_user.id,
        )
        return _location_to_response(location)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except AlreadyExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, e.detail)


@router.delete(
    "/locations/{location_id}",
    response_model=MessageResponse,
    summary="Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ",
)
async def delete_location(
    location_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ (soft delete)."""
    try:
        await service.delete_location(location_id)
        return MessageResponse(message="ÐœÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¾")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Stats Endpoint
# =============================================================================

@router.get(
    "/stats",
    response_model=InventoryStats,
    summary="Ð¡Ñ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ° Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ñ",
)
async def get_inventory_stats(
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÑƒ Ð¸Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€Ñ."""
    return await service.get_stats(current_user.theater_id)


# =============================================================================
# Response Converters
# =============================================================================

def _item_to_response(item) -> InventoryItemResponse:
    """Преобразовать модель в response."""
    return InventoryItemResponse(
        id=item.id,
        name=item.name,
        inventory_number=item.inventory_number,
        description=item.description,
        category_id=item.category_id,
        location_id=item.location_id,
        status=item.status,
        quantity=item.quantity,
        purchase_price=float(item.purchase_price) if item.purchase_price else None,
        current_value=float(item.current_value) if item.current_value else None,
        purchase_date=item.purchase_date,
        warranty_until=item.warranty_until,
        custom_fields=item.custom_fields,
        is_active=item.is_active,
        theater_id=item.theater_id,
        images=item.images,
        # Физические характеристики
        dimensions=item.dimensions,
        weight=item.weight,
        condition=item.condition,
        created_at=item.created_at,
        updated_at=item.updated_at,
        category=_category_to_response(item.category) if item.category else None,
        location=_location_to_response(item.location) if item.location else None,
        photos=[_photo_to_response(photo) for photo in item.photos] if item.photos else [],
    )


def _photo_to_response(photo) -> "InventoryPhotoResponse":
    """Преобразовать фото в response с URL из MinIO."""
    from app.schemas.inventory import InventoryPhotoResponse
    from app.services.minio_service import minio_service

    # Генерируем URL для фото из MinIO
    file_url = minio_service.get_inventory_image_url(photo.file_path)

    return InventoryPhotoResponse(
        id=photo.id,
        item_id=photo.item_id,
        file_path=file_url,  # Возвращаем полный URL вместо пути
        is_primary=photo.is_primary,
        caption=photo.caption,
        created_at=photo.created_at,
        updated_at=photo.updated_at,
    )


def _category_to_response(category) -> CategoryResponse:
    """ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ Ð² response."""
    return CategoryResponse(
        id=category.id,
        name=category.name,
        code=category.code,
        description=category.description,
        parent_id=category.parent_id,
        color=category.color,
        icon=category.icon,
        sort_order=category.sort_order,
        is_active=category.is_active,
        theater_id=category.theater_id,
        created_at=category.created_at,
        updated_at=category.updated_at,
    )


def _category_to_tree_response(category) -> CategoryWithChildren:
    """ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ Ñ Ð´ÐµÑ‚ÑŒÐ¼Ð¸ Ð² response."""
    return CategoryWithChildren(
        id=category.id,
        name=category.name,
        code=category.code,
        description=category.description,
        parent_id=category.parent_id,
        color=category.color,
        icon=category.icon,
        sort_order=category.sort_order,
        is_active=category.is_active,
        theater_id=category.theater_id,
        created_at=category.created_at,
        updated_at=category.updated_at,
        children=[_category_to_tree_response(c) for c in category.children if c.is_active],
    )


def _location_to_response(location) -> LocationResponse:
    """ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÑŒ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ Ð² response."""
    return LocationResponse(
        id=location.id,
        name=location.name,
        code=location.code,
        description=location.description,
        parent_id=location.parent_id,
        address=location.address,
        sort_order=location.sort_order,
        is_active=location.is_active,
        theater_id=location.theater_id,
        full_path=location.full_path if hasattr(location, 'full_path') else None,
        created_at=location.created_at,
        updated_at=location.updated_at,
    )


def _location_to_tree_response(location) -> LocationWithChildren:
    """ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÑŒ Ð¼ÐµÑÑ‚Ð¾ Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ Ñ Ð´ÐµÑ‚ÑŒÐ¼Ð¸ Ð² response."""
    return LocationWithChildren(
        id=location.id,
        name=location.name,
        code=location.code,
        description=location.description,
        parent_id=location.parent_id,
        address=location.address,
        sort_order=location.sort_order,
        is_active=location.is_active,
        theater_id=location.theater_id,
        full_path=location.full_path if hasattr(location, 'full_path') else None,
        created_at=location.created_at,
        updated_at=location.updated_at,
        children=[_location_to_tree_response(l) for l in location.children if l.is_active],
    )


def _movement_to_response(movement) -> MovementResponse:
    """ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÑŒ Ð¿ÐµÑ€ÐµÐ¼ÐµÑ‰ÐµÐ½Ð¸Ðµ Ð² response."""
    return MovementResponse(
        id=movement.id,
        item_id=movement.item_id,
        movement_type=movement.movement_type,
        from_location_id=movement.from_location_id,
        to_location_id=movement.to_location_id,
        quantity=movement.quantity,
        comment=movement.comment,
        performance_id=movement.performance_id,
        created_at=movement.created_at,
        created_by_id=movement.created_by_id,
        from_location=_location_to_response(movement.from_location) if movement.from_location else None,
        to_location=_location_to_response(movement.to_location) if movement.to_location else None,
    )


# =============================================================================
# Photo Endpoints
# =============================================================================

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@router.post(
    "/items/{item_id}/photos",
    response_model=InventoryPhotoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Загрузить фото предмета",
)
async def upload_photo(
    item_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
    file: UploadFile = File(..., description="Файл изображения"),
    caption: str | None = Query(None, max_length=500, description="Подпись к фото"),
):
    """Загрузить фотографию для предмета инвентаря в MinIO."""
    from app.services.minio_service import minio_service

    # Проверяем существование предмета
    try:
        item = await service.get_item(item_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Проверяем расширение файла
    if not file.filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Имя файла не указано")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Недопустимый формат файла. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Загружаем файл в MinIO
    try:
        content = await file.read()
        object_name = await minio_service.upload_inventory_image(
            file_data=content,
            original_filename=file.filename,
            item_id=item_id,
        )
    except Exception as e:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Ошибка загрузки файла в хранилище: {str(e)}"
        )

    # Создаём запись в БД
    photo = InventoryPhoto(
        item_id=item_id,
        file_path=object_name,  # Храним путь в MinIO
        is_primary=False,
        caption=caption,
    )
    service._session.add(photo)
    await service._session.commit()
    await service._session.refresh(photo)

    return _photo_to_response(photo)


@router.get(
    "/items/{item_id}/photos",
    response_model=list[InventoryPhotoResponse],
    summary="Получить фото предмета",
)
async def get_item_photos(
    item_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """Получить список фотографий предмета инвентаря с URL."""
    from sqlalchemy import select

    # Проверяем существование предмета
    try:
        await service.get_item(item_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Получаем фото
    result = await service._session.execute(
        select(InventoryPhoto)
        .where(InventoryPhoto.item_id == item_id)
        .order_by(InventoryPhoto.is_primary.desc(), InventoryPhoto.created_at.desc())
    )
    photos = result.scalars().all()

    return [_photo_to_response(photo) for photo in photos]


@router.delete(
    "/photos/{photo_id}",
    response_model=MessageResponse,
    summary="Удалить фото",
)
async def delete_photo(
    photo_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    """Удалить фотографию предмета инвентаря из MinIO и БД."""
    from sqlalchemy import select
    from app.services.minio_service import minio_service

    # Ищем фото
    result = await service._session.execute(
        select(InventoryPhoto).where(InventoryPhoto.id == photo_id)
    )
    photo = result.scalar_one_or_none()

    if not photo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Фото не найдено")

    # Удаляем файл из MinIO
    await minio_service.delete_inventory_image(photo.file_path)

    # Удаляем запись из БД
    await service._session.delete(photo)
    await service._session.commit()

    return MessageResponse(message="Фото успешно удалено")


# =============================================================================
# Bulk Operations Endpoints
# =============================================================================

@router.post(
    "/bulk/status",
    summary="Массовое изменение статуса",
    description="Изменить статус нескольких предметов одновременно",
)
async def bulk_update_status(
    item_ids: list[int],
    new_status: ItemStatus,
    current_user: CurrentUserDep,
    session: SessionDep,
    comment: str | None = None,
):
    """Массовое изменение статуса предметов."""
    from app.services.bulk_operations_service import BulkOperationsService

    service = BulkOperationsService(session)
    try:
        result = await service.bulk_update_status(
            item_ids=item_ids,
            new_status=new_status,
            user_id=current_user.id,
            comment=comment,
            theater_id=current_user.theater_id,
        )
        return result.to_dict()
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post(
    "/bulk/transfer",
    summary="Массовое перемещение",
    description="Переместить несколько предметов в новую локацию",
)
async def bulk_transfer(
    item_ids: list[int],
    to_location_id: int,
    current_user: CurrentUserDep,
    session: SessionDep,
    comment: str | None = None,
):
    """Массовое перемещение предметов."""
    from app.services.bulk_operations_service import BulkOperationsService

    service = BulkOperationsService(session)
    result = await service.bulk_transfer(
        item_ids=item_ids,
        to_location_id=to_location_id,
        user_id=current_user.id,
        comment=comment,
        theater_id=current_user.theater_id,
    )
    return result.to_dict()


@router.post(
    "/bulk/delete",
    summary="Массовое удаление",
    description="Удалить (деактивировать) несколько предметов",
)
async def bulk_delete(
    item_ids: list[int],
    current_user: CurrentUserDep,
    session: SessionDep,
    comment: str | None = None,
):
    """Массовое удаление (soft delete) предметов."""
    from app.services.bulk_operations_service import BulkOperationsService

    service = BulkOperationsService(session)
    result = await service.bulk_delete(
        item_ids=item_ids,
        user_id=current_user.id,
        hard_delete=False,
        comment=comment,
        theater_id=current_user.theater_id,
    )
    return result.to_dict()


@router.post(
    "/bulk/tags",
    summary="Массовое назначение тегов",
    description="Назначить теги нескольким предметам",
)
async def bulk_assign_tags(
    item_ids: list[int],
    tag_ids: list[int],
    current_user: CurrentUserDep,
    session: SessionDep,
    replace: bool = False,
):
    """Массовое назначение тегов предметам."""
    from app.services.bulk_operations_service import BulkOperationsService

    service = BulkOperationsService(session)
    try:
        result = await service.bulk_assign_tags(
            item_ids=item_ids,
            tag_ids=tag_ids,
            replace=replace,
            user_id=current_user.id,
            theater_id=current_user.theater_id,
        )
        return result.to_dict()
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.delete(
    "/bulk/tags",
    summary="Массовое удаление тегов",
    description="Удалить теги с нескольких предметов",
)
async def bulk_remove_tags(
    item_ids: list[int],
    tag_ids: list[int],
    current_user: CurrentUserDep,
    session: SessionDep,
):
    """Массовое удаление тегов с предметов."""
    from app.services.bulk_operations_service import BulkOperationsService

    service = BulkOperationsService(session)
    result = await service.bulk_remove_tags(
        item_ids=item_ids,
        tag_ids=tag_ids,
        user_id=current_user.id,
        theater_id=current_user.theater_id,
    )
    return result.to_dict()


@router.post(
    "/bulk/category",
    summary="Массовое изменение категории",
    description="Изменить категорию нескольких предметов",
)
async def bulk_update_category(
    item_ids: list[int],
    category_id: int | None,
    current_user: CurrentUserDep,
    session: SessionDep,
):
    """Массовое изменение категории предметов."""
    from app.services.bulk_operations_service import BulkOperationsService

    service = BulkOperationsService(session)
    result = await service.bulk_update_category(
        item_ids=item_ids,
        category_id=category_id,
        user_id=current_user.id,
        theater_id=current_user.theater_id,
    )
    return result.to_dict()


# =============================================================================
# QR Code Endpoints
# =============================================================================

@router.get(
    "/items/{item_id}/qr",
    summary="Получить QR-код предмета",
    description="Генерирует QR-код для предмета инвентаря",
    responses={200: {"content": {"image/png": {}}}},
)
async def get_item_qr_code(
    item_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
    size: int = Query(300, ge=100, le=1000, description="Размер QR-кода в пикселях"),
    style: str = Query("rounded", description="Стиль: square или rounded"),
):
    """Получить QR-код для предмета инвентаря."""
    from fastapi.responses import Response
    from app.services.qr_code_service import QRCodeService
    from app.core.config import settings

    # Проверяем существование предмета
    try:
        item = await service.get_item(item_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)

    # Генерируем QR-код
    qr_service = QRCodeService(base_url=str(settings.FRONTEND_URL) if hasattr(settings, 'FRONTEND_URL') else None)
    qr_bytes = qr_service.generate_inventory_qr(
        item_id=item.id,
        inventory_number=item.inventory_number,
        style=style if style in ("square", "rounded") else "rounded",
        size=size,
    )

    return Response(content=qr_bytes, media_type="image/png")


@router.post(
    "/qr/batch",
    summary="Генерация QR-кодов пакетом",
    description="Генерирует QR-коды для нескольких предметов",
)
async def generate_batch_qr_codes(
    item_ids: list[int],
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
    size: int = Query(200, ge=100, le=500),
):
    """Генерация QR-кодов пакетом (возвращает base64)."""
    import base64
    from app.services.qr_code_service import QRCodeService
    from app.core.config import settings

    qr_service = QRCodeService(base_url=str(settings.FRONTEND_URL) if hasattr(settings, 'FRONTEND_URL') else None)

    results = []
    for item_id in item_ids:
        try:
            item = await service.get_item(item_id)
            qr_bytes = qr_service.generate_inventory_qr(
                item_id=item.id,
                inventory_number=item.inventory_number,
                size=size,
            )
            results.append({
                "item_id": item.id,
                "inventory_number": item.inventory_number,
                "qr_base64": base64.b64encode(qr_bytes).decode("utf-8"),
            })
        except NotFoundError:
            results.append({
                "item_id": item_id,
                "error": "Предмет не найден",
            })

    return {"items": results}


@router.post(
    "/qr/labels",
    summary="Генерация листа этикеток",
    description="Генерирует лист с QR-кодами для печати",
    responses={200: {"content": {"image/png": {}}}},
)
async def generate_label_sheet(
    item_ids: list[int],
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
    cols: int = Query(3, ge=1, le=5),
    rows: int = Query(8, ge=1, le=12),
):
    """Генерация листа этикеток для печати."""
    from fastapi.responses import Response
    from app.services.qr_code_service import QRCodeService

    qr_service = QRCodeService()

    # Собираем данные о предметах
    items_data = []
    for item_id in item_ids:
        try:
            item = await service.get_item(item_id)
            items_data.append((item.id, item.inventory_number, item.name))
        except NotFoundError:
            continue

    if not items_data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Предметы не найдены")

    # Генерируем лист
    sheet_bytes = qr_service.generate_label_sheet(
        items=items_data,
        cols=cols,
        rows=rows,
    )

    return Response(content=sheet_bytes, media_type="image/png")
