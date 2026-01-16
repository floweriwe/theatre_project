"""
API endpoints модуля департаментов/цехов.

Routes:
- /departments - список цехов
- /departments/{id} - операции с конкретным цехом
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, SessionDep
from app.core.exceptions import NotFoundError, AlreadyExistsError, ValidationError
from app.schemas.base import MessageResponse
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DepartmentWithHead,
    PaginatedDepartments,
)
from app.services.department_service import DepartmentService

router = APIRouter(prefix="/departments", tags=["Цеха"])


# =============================================================================
# Dependencies
# =============================================================================

async def get_department_service(session: SessionDep) -> DepartmentService:
    """Получить сервис департаментов."""
    return DepartmentService(session)


DepartmentServiceDep = Depends(get_department_service)


# =============================================================================
# Endpoints
# =============================================================================

@router.get(
    "",
    response_model=PaginatedDepartments,
    summary="Получить список цехов",
    description="Возвращает постраничный список цехов театра",
)
async def get_departments(
    current_user: CurrentUserDep,
    service: DepartmentService = DepartmentServiceDep,
    is_active: bool | None = Query(True, description="Фильтр по активности"),
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(100, ge=1, le=500, description="Элементов на странице"),
):
    """Получить список цехов театра."""
    skip = (page - 1) * limit

    departments, total = await service.get_all(
        theater_id=current_user.theater_id,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )

    # Преобразуем в response schema
    items = [DepartmentResponse.model_validate(dept) for dept in departments]

    return PaginatedDepartments.create(
        items=items,
        total=total,
        page=page,
        limit=limit,
    )


@router.post(
    "",
    response_model=DepartmentWithHead,
    status_code=status.HTTP_201_CREATED,
    summary="Создать цех",
    description="Создаёт новый цех в системе",
)
async def create_department(
    data: DepartmentCreate,
    current_user: CurrentUserDep,
    service: DepartmentService = DepartmentServiceDep,
):
    """Создать новый цех."""
    try:
        department = await service.create(
            data=data,
            user_id=current_user.id,
            theater_id=current_user.theater_id,
        )
        return DepartmentWithHead.from_department(department)
    except AlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.detail),
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.detail),
        )


@router.get(
    "/{department_id}",
    response_model=DepartmentWithHead,
    summary="Получить цех по ID",
    description="Возвращает информацию о цехе с данными руководителя",
)
async def get_department(
    department_id: int,
    current_user: CurrentUserDep,
    service: DepartmentService = DepartmentServiceDep,
):
    """Получить цех по ID."""
    try:
        department = await service.get_by_id(department_id)
        return DepartmentWithHead.from_department(department)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail),
        )


@router.put(
    "/{department_id}",
    response_model=DepartmentWithHead,
    summary="Обновить цех",
    description="Обновляет данные цеха",
)
async def update_department(
    department_id: int,
    data: DepartmentUpdate,
    current_user: CurrentUserDep,
    service: DepartmentService = DepartmentServiceDep,
):
    """Обновить цех."""
    try:
        department = await service.update(
            department_id=department_id,
            data=data,
            user_id=current_user.id,
        )
        return DepartmentWithHead.from_department(department)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail),
        )
    except AlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.detail),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.detail),
        )


@router.delete(
    "/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить цех",
    description="Деактивирует цех (soft delete)",
)
async def delete_department(
    department_id: int,
    current_user: CurrentUserDep,
    service: DepartmentService = DepartmentServiceDep,
):
    """Удалить цех (soft delete)."""
    try:
        await service.delete(
            department_id=department_id,
            user_id=current_user.id,
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e.detail),
        )
