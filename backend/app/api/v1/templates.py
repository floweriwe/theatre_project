"""
API эндпоинты для шаблонов документов.

Предоставляет:
- CRUD операции с шаблонами
- Управление переменными шаблонов
"""
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.core.exceptions import NotFoundError, ValidationError
from app.models.user import User
from app.models.document_template import TemplateType
from app.schemas.document_template import (
    PaginatedTemplates,
    TemplateCreate,
    TemplateListResponse,
    TemplateResponse,
    TemplateUpdate,
    TemplateVariableCreate,
    TemplateVariableResponse,
    TemplateVariableUpdate,
)
from app.services.template_service import TemplateService

router = APIRouter(prefix="/templates", tags=["Templates"])


# =============================================================================
# Dependencies
# =============================================================================

def get_template_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> TemplateService:
    """Получить сервис шаблонов."""
    return TemplateService(session)


# =============================================================================
# Template Endpoints
# =============================================================================

@router.get(
    "",
    response_model=PaginatedTemplates,
    summary="Получить список шаблонов",
)
async def get_templates(
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = Query(0, ge=0, description="Пропустить записей"),
    limit: int = Query(50, ge=1, le=100, description="Максимум записей"),
    template_type: TemplateType | None = Query(None, description="Тип шаблона"),
    is_active: bool | None = Query(None, description="Только активные"),
) -> PaginatedTemplates:
    """
    Получить список шаблонов с фильтрацией.

    - **skip**: Пропустить записей
    - **limit**: Максимум записей (1-100)
    - **template_type**: Фильтр по типу (passport, contract и т.д.)
    - **is_active**: Фильтр по активности
    """
    templates, total = await service.get_templates(
        skip=skip,
        limit=limit,
        theater_id=current_user.theater_id,
        template_type=template_type,
        is_active=is_active,
    )

    # Преобразуем в TemplateListResponse
    items = []
    for t in templates:
        items.append(TemplateListResponse(
            id=t.id,
            name=t.name,
            code=t.code,
            template_type=t.template_type,
            description=t.description,
            is_active=t.is_active,
            is_system=t.is_system,
            default_output_format=t.default_output_format,
            variables_count=len(t.variables) if t.variables else 0,
            created_at=t.created_at,
        ))

    return PaginatedTemplates(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{template_id}",
    response_model=TemplateResponse,
    summary="Получить шаблон по ID",
)
async def get_template(
    template_id: int,
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> TemplateResponse:
    """Получить шаблон по ID с переменными."""
    template = await service.get_template(template_id)
    return TemplateResponse.model_validate(template)


@router.post(
    "",
    response_model=TemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать шаблон",
)
async def create_template(
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    name: str = Query(..., min_length=1, max_length=255),
    code: str = Query(..., min_length=1, max_length=50, pattern=r'^[A-Z_]+$'),
    template_type: TemplateType = Query(TemplateType.CUSTOM),
    description: str | None = Query(None, max_length=2000),
    default_output_format: str = Query("docx", pattern=r'^(docx|pdf)$'),
    file: UploadFile = File(..., description="Файл шаблона (DOCX)"),
) -> TemplateResponse:
    """
    Создать новый шаблон.

    - **name**: Название шаблона
    - **code**: Уникальный код (UPPERCASE_WITH_UNDERSCORES)
    - **template_type**: Тип шаблона
    - **description**: Описание
    - **file**: DOCX файл шаблона
    """
    data = TemplateCreate(
        name=name,
        code=code,
        template_type=template_type,
        description=description,
        default_output_format=default_output_format,
    )

    template = await service.create_template(
        data=data,
        file=file,
        theater_id=current_user.theater_id,
        user_id=current_user.id,
    )

    return TemplateResponse.model_validate(template)


@router.put(
    "/{template_id}",
    response_model=TemplateResponse,
    summary="Обновить шаблон",
)
async def update_template(
    template_id: int,
    data: TemplateUpdate,
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> TemplateResponse:
    """Обновить метаданные шаблона."""
    template = await service.update_template(
        template_id=template_id,
        data=data,
        user_id=current_user.id,
    )
    return TemplateResponse.model_validate(template)


@router.put(
    "/{template_id}/file",
    response_model=TemplateResponse,
    summary="Обновить файл шаблона",
)
async def update_template_file(
    template_id: int,
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    file: UploadFile = File(..., description="Новый файл шаблона (DOCX)"),
) -> TemplateResponse:
    """Заменить файл шаблона новым."""
    template = await service.update_template_file(
        template_id=template_id,
        file=file,
        user_id=current_user.id,
    )
    return TemplateResponse.model_validate(template)


@router.delete(
    "/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить шаблон",
)
async def delete_template(
    template_id: int,
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> None:
    """
    Удалить шаблон.

    Системные шаблоны удалить нельзя.
    """
    await service.delete_template(template_id)


# =============================================================================
# Variable Endpoints
# =============================================================================

@router.get(
    "/{template_id}/variables",
    response_model=list[TemplateVariableResponse],
    summary="Получить переменные шаблона",
)
async def get_template_variables(
    template_id: int,
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> list[TemplateVariableResponse]:
    """Получить список всех переменных шаблона."""
    variables = await service.get_template_variables(template_id)
    return [TemplateVariableResponse.model_validate(v) for v in variables]


@router.post(
    "/{template_id}/variables",
    response_model=TemplateVariableResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить переменную",
)
async def create_variable(
    template_id: int,
    data: TemplateVariableCreate,
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> TemplateVariableResponse:
    """Добавить новую переменную в шаблон."""
    variable = await service.create_variable(template_id, data)
    return TemplateVariableResponse.model_validate(variable)


@router.put(
    "/{template_id}/variables/{variable_id}",
    response_model=TemplateVariableResponse,
    summary="Обновить переменную",
)
async def update_variable(
    template_id: int,
    variable_id: int,
    data: TemplateVariableUpdate,
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> TemplateVariableResponse:
    """Обновить переменную шаблона."""
    variable = await service.update_variable(variable_id, data)
    return TemplateVariableResponse.model_validate(variable)


@router.delete(
    "/{template_id}/variables/{variable_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить переменную",
)
async def delete_variable(
    template_id: int,
    variable_id: int,
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> None:
    """Удалить переменную из шаблона."""
    await service.delete_variable(variable_id)


@router.put(
    "/{template_id}/variables/reorder",
    response_model=list[TemplateVariableResponse],
    summary="Изменить порядок переменных",
)
async def reorder_variables(
    template_id: int,
    variable_ids: list[int],
    service: Annotated[TemplateService, Depends(get_template_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> list[TemplateVariableResponse]:
    """
    Изменить порядок переменных в шаблоне.

    - **variable_ids**: Список ID переменных в новом порядке
    """
    variables = await service.reorder_variables(template_id, variable_ids)
    return [TemplateVariableResponse.model_validate(v) for v in variables]
