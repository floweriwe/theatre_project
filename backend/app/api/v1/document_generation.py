"""
API эндпоинты для генерации документов из шаблонов.

Предоставляет:
- Автозаполнение данных из связанных сущностей
- Предпросмотр документа
- Генерация и сохранение документа
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.schemas.document_template import (
    GenerateDocumentRequest,
    GenerateDocumentPreviewRequest,
    GeneratedDocumentResponse,
    TemplateAutocompleteResponse,
    AutocompleteSuggestions,
    VariableValue,
)
from app.services.document_generation_service import DocumentGenerationService
from app.services.minio_service import MinioService

router = APIRouter(prefix="/document-generation", tags=["Document Generation"])


# =============================================================================
# Dependencies
# =============================================================================

def get_generation_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DocumentGenerationService:
    """Получить сервис генерации документов."""
    return DocumentGenerationService(session)


# =============================================================================
# Endpoints
# =============================================================================

@router.get(
    "/templates/{template_id}/autocomplete",
    response_model=TemplateAutocompleteResponse,
    summary="Получить данные для автозаполнения",
)
async def get_autocomplete_data(
    template_id: int,
    service: Annotated[DocumentGenerationService, Depends(get_generation_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    performance_id: int | None = Query(None, description="ID спектакля для автозаполнения"),
) -> TemplateAutocompleteResponse:
    """
    Получить данные для автозаполнения формы генерации.

    Возвращает:
    - Автозаполненные значения из спектакля
    - Подсказки для полей выбора (актёры, сотрудники)
    """
    data = await service.get_template_with_auto_fill(
        template_id=template_id,
        performance_id=performance_id,
    )

    # Формируем suggestions
    suggestions = [
        AutocompleteSuggestions(
            variable_name=name,
            options=[
                {"id": opt["id"], "label": opt["label"]}
                for opt in options
            ]
        )
        for name, options in data["suggestions"].items()
    ]

    # Формируем auto_filled_values
    auto_filled = [
        VariableValue(name=name, value=value)
        for name, value in data["auto_filled"].items()
    ]

    return TemplateAutocompleteResponse(
        template_id=template_id,
        performance_id=performance_id,
        suggestions=suggestions,
        auto_filled_values=auto_filled,
    )


@router.post(
    "/preview",
    summary="Предпросмотр документа",
)
async def preview_document(
    request: GenerateDocumentPreviewRequest,
    service: Annotated[DocumentGenerationService, Depends(get_generation_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> StreamingResponse:
    """
    Сгенерировать предпросмотр документа.

    Возвращает DOCX файл без сохранения в систему.
    Используется для проверки перед финальной генерацией.
    """
    # Преобразуем список VariableValue в dict
    variables = {v.name: v.value for v in request.variables}

    docx_bytes = await service.generate_preview(
        template_id=request.template_id,
        variables=variables,
        performance_id=request.performance_id,
    )

    return StreamingResponse(
        iter([docx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=preview.docx"
        }
    )


@router.post(
    "/generate",
    response_model=GeneratedDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Сгенерировать документ",
)
async def generate_document(
    request: GenerateDocumentRequest,
    service: Annotated[DocumentGenerationService, Depends(get_generation_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> GeneratedDocumentResponse:
    """
    Сгенерировать документ из шаблона и сохранить.

    Создаёт документ с заполненными данными и сохраняет в систему.
    Документ привязывается к спектаклю, если указан performance_id.

    - **template_id**: ID шаблона
    - **performance_id**: ID спектакля (опционально)
    - **variables**: Значения переменных для подстановки
    - **output_format**: Формат выхода (docx или pdf)
    - **document_name**: Название документа (опционально)
    """
    # Преобразуем список VariableValue в dict
    variables = {v.name: v.value for v in request.variables}

    document = await service.generate_document(
        template_id=request.template_id,
        variables=variables,
        performance_id=request.performance_id,
        document_name=request.document_name,
        output_format=request.output_format,
        user_id=current_user.id,
        theater_id=current_user.theater_id,
    )

    # Получаем URL для скачивания
    minio = MinioService()
    download_url = await minio.get_presigned_url(document.file_path)

    return GeneratedDocumentResponse(
        document_id=document.id,
        document_name=document.name,
        file_path=document.file_path,
        file_name=document.file_name,
        file_size=document.file_size,
        mime_type=document.mime_type,
        download_url=download_url,
    )


@router.post(
    "/templates/{template_id}/generate-for-performance/{performance_id}",
    response_model=GeneratedDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Быстрая генерация для спектакля",
)
async def quick_generate_for_performance(
    template_id: int,
    performance_id: int,
    service: Annotated[DocumentGenerationService, Depends(get_generation_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    output_format: str = Query("docx", pattern=r'^(docx|pdf)$'),
) -> GeneratedDocumentResponse:
    """
    Быстрая генерация документа для спектакля.

    Использует только автозаполнение без дополнительных данных.
    Подходит для стандартных документов типа паспорта спектакля.
    """
    # Получаем автозаполненные значения
    data = await service.get_template_with_auto_fill(
        template_id=template_id,
        performance_id=performance_id,
    )

    document = await service.generate_document(
        template_id=template_id,
        variables=data["auto_filled"],
        performance_id=performance_id,
        output_format=output_format,
        user_id=current_user.id,
        theater_id=current_user.theater_id,
    )

    # Получаем URL для скачивания
    minio = MinioService()
    download_url = await minio.get_presigned_url(document.file_path)

    return GeneratedDocumentResponse(
        document_id=document.id,
        document_name=document.name,
        file_path=document.file_path,
        file_name=document.file_name,
        file_size=document.file_size,
        mime_type=document.mime_type,
        download_url=download_url,
    )
