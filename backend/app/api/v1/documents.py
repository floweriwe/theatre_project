"""
API ÑÐ½Ð´Ð¿Ð¾Ð¸Ð½Ñ‚Ñ‹ Ð¼Ð¾Ð´ÑƒÐ»Ñ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð¾Ð±Ð¾Ñ€Ð¾Ñ‚Ð°.

Ð Ð¾ÑƒÑ‚Ñ‹:
- /documents â€” Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ñ‹
- /documents/categories â€” ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
- /documents/tags â€” Ñ‚ÐµÐ³Ð¸
- /documents/stats â€” ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ°
"""
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import FileResponse

from app.api.deps import CurrentUserDep, SessionDep
from app.config import settings
from app.core.exceptions import NotFoundError, AlreadyExistsError, ValidationError
from app.models.document import DocumentStatus, FileType
from app.schemas.base import MessageResponse
from app.schemas.document import (
    # Categories
    DocCategoryCreate,
    DocCategoryUpdate,
    DocCategoryResponse,
    DocCategoryWithChildren,
    # Tags
    TagCreate,
    TagResponse,
    # Documents
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListResponse,
    PaginatedDocuments,
    DocumentPreviewUrlResponse,
    # Versions
    DocumentVersionResponse,
    # Stats
    DocumentStats,
)
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Ð”Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ñ‹"])


# =============================================================================
# Dependencies
# =============================================================================

async def get_document_service(session: SessionDep) -> DocumentService:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐµÑ€Ð²Ð¸Ñ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð²."""
    return DocumentService(session)


DocumentServiceDep = Depends(get_document_service)


# =============================================================================
# Documents Endpoints
# =============================================================================

@router.get(
    "",
    response_model=PaginatedDocuments,
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð²",
)
async def get_documents(
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
    search: str | None = Query(None, description="ÐŸÐ¾Ð¸ÑÐº Ð¿Ð¾ Ð½Ð°Ð·Ð²Ð°Ð½Ð¸ÑŽ"),
    category_id: int | None = Query(None, description="Ð¤Ð¸Ð»ÑŒÑ‚Ñ€ Ð¿Ð¾ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸"),
    status: DocumentStatus | None = Query(None, description="Ð¤Ð¸Ð»ÑŒÑ‚Ñ€ Ð¿Ð¾ ÑÑ‚Ð°Ñ‚ÑƒÑÑƒ"),
    file_type: FileType | None = Query(None, description="Ð¤Ð¸Ð»ÑŒÑ‚Ñ€ Ð¿Ð¾ Ñ‚Ð¸Ð¿Ñƒ Ñ„Ð°Ð¹Ð»Ð°"),
    is_public: bool | None = Query(None, description="Ð¢Ð¾Ð»ÑŒÐºÐ¾ Ð¿ÑƒÐ±Ð»Ð¸Ñ‡Ð½Ñ‹Ðµ"),
    department_id: int | None = Query(None, description="Ð¤Ð¸Ð»ÑŒÑ‚Ñ€ Ð¿Ð¾ Ñ†ÐµÑ…Ñƒ"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð² Ñ Ñ„Ð¸Ð»ÑŒÑ‚Ñ€Ð°Ñ†Ð¸ÐµÐ¹."""
    skip = (page - 1) * limit
    
    documents, total = await service.get_documents(
        search=search,
        category_id=category_id,
        status=status,
        file_type=file_type,
        is_public=is_public,
        department_id=department_id,
        theater_id=current_user.theater_id,
        skip=skip,
        limit=limit,
    )
    
    items = []
    for doc in documents:
        items.append(DocumentListResponse(
            id=doc.id,
            name=doc.name,
            file_name=doc.file_name,
            file_size=doc.file_size,
            file_type=doc.file_type,
            status=doc.status,
            category_id=doc.category_id,
            category_name=doc.category.name if doc.category else None,
            current_version=doc.current_version,
            is_public=doc.is_public,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
        ))
    
    return PaginatedDocuments(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
    )


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ð—Ð°Ð³Ñ€ÑƒÐ·Ð¸Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚",
)
async def upload_document(
    current_user: CurrentUserDep,
    file: UploadFile = File(..., description="Ð¤Ð°Ð¹Ð» Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð°"),
    name: str = Form(..., description="ÐÐ°Ð·Ð²Ð°Ð½Ð¸Ðµ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð°"),
    description: str | None = Form(None, description="ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ"),
    category_id: int | None = Form(None, description="ID ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸"),
    is_public: bool = Form(False, description="ÐŸÑƒÐ±Ð»Ð¸Ñ‡Ð½Ñ‹Ð¹ Ð´Ð¾ÑÑ‚ÑƒÐ¿"),
    service: DocumentService = DocumentServiceDep,
):
    """Ð—Ð°Ð³Ñ€ÑƒÐ·Ð¸Ñ‚ÑŒ Ð½Ð¾Ð²Ñ‹Ð¹ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚."""
    try:
        # Ð¡Ð¾Ñ…Ñ€Ð°Ð½ÑÐµÐ¼ Ñ„Ð°Ð¹Ð»
        file_info = await service.save_file(file, current_user.theater_id)
        
        # Ð¡Ð¾Ð·Ð´Ð°Ñ‘Ð¼ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚
        data = DocumentCreate(
            name=name,
            description=description,
            category_id=category_id,
            is_public=is_public,
        )
        
        document = await service.create_document(
            data=data,
            file_info=file_info,
            user_id=current_user.id,
            theater_id=current_user.theater_id,
        )
        
        return _document_to_response(document)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚",
)
async def get_document(
    document_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚ Ð¿Ð¾ ID."""
    try:
        document = await service.get_document(document_id)
        return _document_to_response(document)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.patch(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚",
)
async def update_document(
    document_id: int,
    current_user: CurrentUserDep,
    name: str | None = Form(None),
    description: str | None = Form(None),
    category_id: int | None = Form(None),
    is_public: bool | None = Form(None),
    file: UploadFile | None = File(None, description="ÐÐ¾Ð²Ñ‹Ð¹ Ñ„Ð°Ð¹Ð» (Ð¾Ð¿Ñ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾)"),
    service: DocumentService = DocumentServiceDep,
):
    """ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚. ÐŸÑ€Ð¸ Ð·Ð°Ð³Ñ€ÑƒÐ·ÐºÐµ Ð½Ð¾Ð²Ð¾Ð³Ð¾ Ñ„Ð°Ð¹Ð»Ð° ÑÐ¾Ð·Ð´Ð°Ñ‘Ñ‚ÑÑ Ð½Ð¾Ð²Ð°Ñ Ð²ÐµÑ€ÑÐ¸Ñ."""
    try:
        # Ð¡Ð¾Ñ…Ñ€Ð°Ð½ÑÐµÐ¼ Ð½Ð¾Ð²Ñ‹Ð¹ Ñ„Ð°Ð¹Ð» ÐµÑÐ»Ð¸ ÐµÑÑ‚ÑŒ
        file_info = None
        if file:
            file_info = await service.save_file(file, current_user.theater_id)
        
        # ÐžÐ±Ð½Ð¾Ð²Ð»ÑÐµÐ¼
        data = DocumentUpdate(
            name=name,
            description=description,
            category_id=category_id,
            is_public=is_public,
        )
        
        document = await service.update_document(
            document_id=document_id,
            data=data,
            user_id=current_user.id,
            new_file=file_info,
        )
        
        return _document_to_response(document)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


@router.delete(
    "/{document_id}",
    response_model=MessageResponse,
    summary="Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚",
)
async def delete_document(
    document_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚ (soft delete)."""
    try:
        await service.delete_document(document_id, current_user.id)
        return MessageResponse(message="Ð”Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»Ñ‘Ð½")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.post(
    "/{document_id}/archive",
    response_model=DocumentResponse,
    summary="ÐÑ€Ñ…Ð¸Ð²Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚",
)
async def archive_document(
    document_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """ÐŸÐµÑ€ÐµÐ¼ÐµÑÑ‚Ð¸Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚ Ð² Ð°Ñ€Ñ…Ð¸Ð²."""
    try:
        document = await service.archive_document(document_id, current_user.id)
        return _document_to_response(document)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


@router.post(
    "/{document_id}/restore",
    response_model=DocumentResponse,
    summary="Ð’Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð¸Ð· Ð°Ñ€Ñ…Ð¸Ð²Ð°",
)
async def restore_document(
    document_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """Ð’Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚ Ð¸Ð· Ð°Ñ€Ñ…Ð¸Ð²Ð°."""
    try:
        document = await service.restore_document(document_id, current_user.id)
        return _document_to_response(document)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


@router.get(
    "/{document_id}/versions",
    response_model=list[DocumentVersionResponse],
    summary="Ð˜ÑÑ‚Ð¾Ñ€Ð¸Ñ Ð²ÐµÑ€ÑÐ¸Ð¹",
)
async def get_document_versions(
    document_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑŽ Ð²ÐµÑ€ÑÐ¸Ð¹ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð°."""
    try:
        versions = await service.get_document_versions(document_id)
        return [_version_to_response(v) for v in versions]
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.get(
    "/{document_id}/versions/latest",
    response_model=DocumentVersionResponse,
    summary="Получить последнюю версию",
)
async def get_latest_version(
    document_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """Получить информацию о последней версии документа."""
    try:
        version = await service.get_latest_version(document_id)
        return _version_to_response(version)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.post(
    "/{document_id}/versions",
    response_model=DocumentVersionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Загрузить новую версию",
)
async def upload_new_version(
    document_id: int,
    current_user: CurrentUserDep,
    file: UploadFile = File(..., description="Файл новой версии"),
    comment: str | None = Form(None, description="Комментарий к версии"),
    service: DocumentService = DocumentServiceDep,
):
    """Загрузить новую версию документа."""
    try:
        version = await service.upload_new_version(
            document_id=document_id,
            file=file,
            user_id=current_user.id,
            comment=comment,
        )
        return _version_to_response(version)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
    except ValidationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, e.detail)


@router.get(
    "/versions/{version_id}/download",
    summary="Скачать конкретную версию",
)
async def download_version(
    version_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """Скачать файл конкретной версии документа."""
    try:
        version = await service.get_version_by_id(version_id)

        file_path = Path(settings.STORAGE_PATH) / "documents" / version.file_path
        if not file_path.exists():
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")

        return FileResponse(
            path=file_path,
            filename=version.file_name,
            media_type="application/octet-stream",
        )
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.get(
    "/{document_id}/download",
    summary="Ð¡ÐºÐ°Ñ‡Ð°Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚",
)
async def download_document(
    document_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """Ð¡ÐºÐ°Ñ‡Ð°Ñ‚ÑŒ Ñ„Ð°Ð¹Ð» Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð°."""
    try:
        document = await service.get_document(document_id)

        file_path = Path(settings.STORAGE_PATH) / "documents" / document.file_path
        if not file_path.exists():
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Ð¤Ð°Ð¹Ð» Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½")

        return FileResponse(
            path=file_path,
            filename=document.file_name,
            media_type=document.mime_type,
        )
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.get(
    "/{document_id}/download-url",
    response_model=DocumentPreviewUrlResponse,
    summary="Получить URL для скачивания документа",
)
async def get_document_download_url(
    document_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """
    Получить URL для скачивания документа с информацией о content_type.

    Возвращает URL и метаданные файла, включая корректный MIME-тип,
    определенный при загрузке с помощью python-magic.
    """
    try:
        document = await service.get_document(document_id)

        # Проверяем существование файла
        file_path = Path(settings.STORAGE_PATH) / "documents" / document.file_path
        if not file_path.exists():
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")

        # Формируем URL для доступа к файлу
        # В production это будет внешний URL через nginx/CDN
        download_url = f"/api/v1/documents/{document_id}/download"

        return DocumentPreviewUrlResponse(
            url=download_url,
            file_name=document.file_name,
            content_type=document.mime_type,
            file_size=document.file_size,
            expires_in=3600,  # 1 час
        )
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


@router.get(
    "/{document_id}/preview",
    summary="Предпросмотр документа (PDF)",
)
async def preview_document(
    document_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """
    Получить предпросмотр документа в формате PDF.

    Для DOCX/DOC файлов создаёт упрощённый PDF preview.
    Для PDF файлов возвращает оригинал.
    Для других форматов возвращает 400.

    ОГРАНИЧЕНИЯ MVP:
    - DOCX конвертируется в простой текстовый PDF
    - Теряется сложное форматирование, таблицы, изображения
    - Для полноценного preview требуется LibreOffice (Phase 2)
    """
    try:
        document = await service.get_document(document_id)

        # Для PDF возвращаем оригинал
        if document.mime_type == "application/pdf":
            file_path = Path(settings.STORAGE_PATH) / "documents" / document.file_path
            if not file_path.exists():
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")

            return FileResponse(
                path=file_path,
                filename=document.file_name,
                media_type="application/pdf",
            )

        # Для DOCX/DOC создаём preview
        preview_url = await service.get_document_preview_url(document_id)

        if preview_url is None:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Предпросмотр недоступен для данного типа файла",
            )

        # Получаем путь к preview файлу
        preview_path = Path(settings.STORAGE_PATH) / "previews" / f"doc_{document_id}_preview.pdf"
        if not preview_path.exists():
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Ошибка создания предпросмотра",
            )

        return FileResponse(
            path=preview_path,
            filename=f"preview_{document.file_name}.pdf",
            media_type="application/pdf",
        )

    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Categories Endpoints
# =============================================================================

@router.get(
    "/categories/",
    response_model=list[DocCategoryResponse],
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹",
)
async def get_categories(
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð²."""
    categories, _ = await service.get_categories(current_user.theater_id)
    return [_category_to_response(c) for c in categories if c.is_active]


@router.get(
    "/categories/tree",
    response_model=list[DocCategoryWithChildren],
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð´ÐµÑ€ÐµÐ²Ð¾ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹",
)
async def get_categories_tree(
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¸ÐµÑ€Ð°Ñ€Ñ…Ð¸Ñ‡ÐµÑÐºÐ¾Ðµ Ð´ÐµÑ€ÐµÐ²Ð¾ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹."""
    categories = await service.get_categories_tree(current_user.theater_id)
    return [_category_to_tree_response(c) for c in categories]


@router.post(
    "/categories/",
    response_model=DocCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ",
)
async def create_category(
    data: DocCategoryCreate,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ð½Ð¾Ð²ÑƒÑŽ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð²."""
    try:
        category = await service.create_category(
            data=data,
            user_id=current_user.id,
            theater_id=current_user.theater_id,
        )
        return _category_to_response(category)
    except AlreadyExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, e.detail)


@router.patch(
    "/categories/{category_id}",
    response_model=DocCategoryResponse,
    summary="ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ",
)
async def update_category(
    category_id: int,
    data: DocCategoryUpdate,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
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
    service: DocumentService = DocumentServiceDep,
):
    """Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ (soft delete)."""
    try:
        await service.delete_category(category_id)
        return MessageResponse(message="ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»ÐµÐ½Ð°")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Tags Endpoints
# =============================================================================

@router.get(
    "/tags/",
    response_model=list[TagResponse],
    summary="ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº Ñ‚ÐµÐ³Ð¾Ð²",
)
async def get_tags(
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº Ñ‚ÐµÐ³Ð¾Ð²."""
    tags = await service.get_tags(current_user.theater_id)
    return [TagResponse(id=t.id, name=t.name, color=t.color) for t in tags]


@router.post(
    "/tags/",
    response_model=TagResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ñ‚ÐµÐ³",
)
async def create_tag(
    data: TagCreate,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ð½Ð¾Ð²Ñ‹Ð¹ Ñ‚ÐµÐ³."""
    try:
        tag = await service.create_tag(
            name=data.name,
            color=data.color,
            theater_id=current_user.theater_id,
        )
        return TagResponse(id=tag.id, name=tag.name, color=tag.color)
    except AlreadyExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, e.detail)


@router.delete(
    "/tags/{tag_id}",
    response_model=MessageResponse,
    summary="Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ñ‚ÐµÐ³",
)
async def delete_tag(
    tag_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ñ‚ÐµÐ³."""
    try:
        await service.delete_tag(tag_id)
        return MessageResponse(message="Ð¢ÐµÐ³ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»Ñ‘Ð½")
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)


# =============================================================================
# Stats Endpoint
# =============================================================================

@router.get(
    "/stats/",
    response_model=DocumentStats,
    summary="Ð¡Ñ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ° Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð²",
)
async def get_document_stats(
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÑƒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð²."""
    return await service.get_stats(current_user.theater_id)


# =============================================================================
# Response Converters
# =============================================================================

def _document_to_response(doc) -> DocumentResponse:
    """ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÑŒ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚ Ð² response."""
    return DocumentResponse(
        id=doc.id,
        name=doc.name,
        description=doc.description,
        category_id=doc.category_id,
        is_public=doc.is_public,
        file_path=doc.file_path,
        file_name=doc.file_name,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        file_type=doc.file_type,
        current_version=doc.current_version,
        status=doc.status,
        performance_id=doc.performance_id,
        metadata=doc.extra_data,
        is_active=doc.is_active,
        theater_id=doc.theater_id,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        category=_category_to_response(doc.category) if doc.category else None,
        tags=[TagResponse(id=t.id, name=t.name, color=t.color) for t in doc.tags],
    )


def _category_to_response(cat) -> DocCategoryResponse:
    """ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ Ð² response."""
    return DocCategoryResponse(
        id=cat.id,
        name=cat.name,
        code=cat.code,
        description=cat.description,
        parent_id=cat.parent_id,
        color=cat.color,
        icon=cat.icon,
        sort_order=cat.sort_order,
        required_permissions=cat.required_permissions,
        is_active=cat.is_active,
        theater_id=cat.theater_id,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
    )


def _category_to_tree_response(cat) -> DocCategoryWithChildren:
    """ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ Ñ Ð´ÐµÑ‚ÑŒÐ¼Ð¸ Ð² response."""
    return DocCategoryWithChildren(
        id=cat.id,
        name=cat.name,
        code=cat.code,
        description=cat.description,
        parent_id=cat.parent_id,
        color=cat.color,
        icon=cat.icon,
        sort_order=cat.sort_order,
        required_permissions=cat.required_permissions,
        is_active=cat.is_active,
        theater_id=cat.theater_id,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
        children=[_category_to_tree_response(c) for c in cat.children if c.is_active],
    )


def _version_to_response(version) -> DocumentVersionResponse:
    """ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÑŒ Ð²ÐµÑ€ÑÐ¸ÑŽ Ð² response."""
    return DocumentVersionResponse(
        id=version.id,
        document_id=version.document_id,
        version=version.version,
        file_path=version.file_path,
        file_name=version.file_name,
        file_size=version.file_size,
        comment=version.comment,
        created_at=version.created_at,
        created_by_id=version.created_by_id,
    )
