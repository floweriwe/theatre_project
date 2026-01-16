"""
API эндпоинты модуля площадок театра.

Роуты:
- GET /venues - получить список площадок
- POST /venues - создать площадку
- GET /venues/{id} - получить площадку по ID
- PUT /venues/{id} - обновить площадку
- DELETE /venues/{id} - удалить площадку (soft delete)
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, SessionDep
from app.core.exceptions import NotFoundError, AlreadyExistsError
from app.schemas.base import MessageResponse, PaginatedResponse
from app.schemas.venue import VenueCreate, VenueUpdate, VenueResponse, VenueListResponse
from app.services.venue_service import VenueService


router = APIRouter(prefix="/venues", tags=["Площадки"])


# =============================================================================
# Dependencies
# =============================================================================

def get_venue_service(session: SessionDep) -> VenueService:
    """Получить сервис площадок."""
    return VenueService(session)


VenueServiceDep = Annotated[VenueService, Depends(get_venue_service)]


# =============================================================================
# Endpoints
# =============================================================================

@router.get(
    "",
    response_model=PaginatedResponse[VenueListResponse],
    summary="Получить список площадок",
    description="Возвращает постраничный список площадок театра с фильтрацией",
)
async def get_venues(
    current_user: CurrentUserDep,
    service: VenueServiceDep,
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(20, ge=1, le=100, description="Элементов на странице"),
    include_inactive: bool = Query(False, description="Включать неактивные площадки"),
) -> PaginatedResponse[VenueListResponse]:
    """
    Получить список площадок театра.

    Возвращает площадки текущего театра пользователя с пагинацией.
    По умолчанию возвращаются только активные площадки.
    """
    skip = (page - 1) * limit

    venues, total = await service.get_all(
        theater_id=current_user.theater_id,
        skip=skip,
        limit=limit,
        include_inactive=include_inactive,
    )

    # Преобразуем в list response
    venues_response = [
        VenueListResponse(
            id=venue.id,
            name=venue.name,
            code=venue.code,
            venue_type=venue.venue_type,
            capacity=venue.capacity,
            is_active=venue.is_active,
            created_at=venue.created_at,
        )
        for venue in venues
    ]

    return PaginatedResponse.create(
        items=venues_response,
        total=total,
        page=page,
        limit=limit,
    )


@router.post(
    "",
    response_model=VenueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать площадку",
    description="Создать новую площадку театра",
)
async def create_venue(
    data: VenueCreate,
    current_user: CurrentUserDep,
    service: VenueServiceDep,
) -> VenueResponse:
    """
    Создать новую площадку.

    Требования:
    - Код площадки должен быть уникальным в рамках театра
    - Вместимость (если указана) должна быть положительным числом
    - Код автоматически приводится к верхнему регистру
    """
    try:
        venue = await service.create(
            data=data,
            theater_id=current_user.theater_id,
        )
        return VenueResponse.model_validate(venue)
    except AlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e.detail),
        )


@router.get(
    "/{venue_id}",
    response_model=VenueResponse,
    summary="Получить площадку по ID",
    description="Возвращает детальную информацию о площадке",
)
async def get_venue(
    venue_id: int,
    current_user: CurrentUserDep,
    service: VenueServiceDep,
) -> VenueResponse:
    """
    Получить площадку по ID.

    Проверяет принадлежность площадки театру пользователя.
    """
    try:
        venue = await service.get_by_id(
            venue_id=venue_id,
            theater_id=current_user.theater_id,
        )
        return VenueResponse.model_validate(venue)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail),
        )


@router.put(
    "/{venue_id}",
    response_model=VenueResponse,
    summary="Обновить площадку",
    description="Обновить данные площадки театра",
)
async def update_venue(
    venue_id: int,
    data: VenueUpdate,
    current_user: CurrentUserDep,
    service: VenueServiceDep,
) -> VenueResponse:
    """
    Обновить площадку.

    Требования:
    - Новый код (если указан) должен быть уникальным в рамках театра
    - Вместимость (если указана) должна быть положительным числом
    - Код автоматически приводится к верхнему регистру
    """
    try:
        venue = await service.update(
            venue_id=venue_id,
            data=data,
            theater_id=current_user.theater_id,
        )
        return VenueResponse.model_validate(venue)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail),
        )
    except AlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e.detail),
        )


@router.delete(
    "/{venue_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Удалить площадку",
    description="Мягкое удаление площадки (помечается как неактивная)",
)
async def delete_venue(
    venue_id: int,
    current_user: CurrentUserDep,
    service: VenueServiceDep,
) -> MessageResponse:
    """
    Удалить площадку (soft delete).

    Площадка не удаляется физически, а помечается как неактивная.
    Это сохраняет ссылочную целостность с другими объектами системы.
    """
    try:
        await service.delete(
            venue_id=venue_id,
            theater_id=current_user.theater_id,
        )
        return MessageResponse(message="Площадка успешно удалена")
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail),
        )
