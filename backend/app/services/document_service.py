"""
Сервис модуля документооборота.

Бизнес-логика для работы с документами:
- CRUD операции
- Загрузка и хранение файлов
- Версионирование
- Статистика
"""
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import BinaryIO
import mimetypes

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import NotFoundError, AlreadyExistsError, ValidationError
from app.models.document import (
    DocumentCategory,
    Document,
    DocumentVersion,
    Tag,
    DocumentStatus,
    FileType,
)
from app.repositories.document_repository import (
    DocumentCategoryRepository,
    DocumentRepository,
    DocumentVersionRepository,
    TagRepository,
)
from app.schemas.document import (
    DocCategoryCreate,
    DocCategoryUpdate,
    DocumentCreate,
    DocumentUpdate,
    DocumentStats,
    FileUploadResponse,
)


# Маппинг MIME типов на FileType
MIME_TYPE_MAP = {
    "application/pdf": FileType.PDF,
    "application/msword": FileType.DOCUMENT,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileType.DOCUMENT,
    "application/vnd.oasis.opendocument.text": FileType.DOCUMENT,
    "text/plain": FileType.DOCUMENT,
    "application/vnd.ms-excel": FileType.SPREADSHEET,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileType.SPREADSHEET,
    "text/csv": FileType.SPREADSHEET,
    "image/png": FileType.IMAGE,
    "image/jpeg": FileType.IMAGE,
    "image/gif": FileType.IMAGE,
    "image/svg+xml": FileType.IMAGE,
    "image/webp": FileType.IMAGE,
}

# Разрешённые расширения
ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".odt", ".txt", ".rtf",
    ".xls", ".xlsx", ".csv", ".ods",
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
    ".zip", ".rar", ".7z",
}

# Максимальный размер файла (50 MB)
MAX_FILE_SIZE = 50 * 1024 * 1024


class DocumentService:
    """
    Сервис документооборота.
    
    Управляет документами, их версиями, категориями и тегами.
    """
    
    def __init__(self, session: AsyncSession):
        self._session = session
        self._category_repo = DocumentCategoryRepository(session)
        self._document_repo = DocumentRepository(session)
        self._version_repo = DocumentVersionRepository(session)
        self._tag_repo = TagRepository(session)
        self._storage_path = Path(settings.STORAGE_PATH) / "documents"
        self._storage_path.mkdir(parents=True, exist_ok=True)
    
    # =========================================================================
    # File Operations
    # =========================================================================
    
    def _get_file_type(self, mime_type: str) -> FileType:
        """Определить тип файла по MIME типу."""
        return MIME_TYPE_MAP.get(mime_type, FileType.OTHER)
    
    def _generate_file_path(self, file_name: str, theater_id: int | None = None) -> str:
        """
        Сгенерировать путь для хранения файла.
        
        Формат: documents/{theater_id}/{year}/{month}/{timestamp}_{filename}
        """
        now = datetime.utcnow()
        theater_dir = str(theater_id) if theater_id else "common"
        
        # Очищаем имя файла
        safe_name = "".join(c for c in file_name if c.isalnum() or c in ".-_")
        unique_name = f"{now.strftime('%Y%m%d_%H%M%S')}_{safe_name}"
        
        relative_path = f"{theater_dir}/{now.year}/{now.month:02d}/{unique_name}"
        return relative_path
    
    async def save_file(
        self,
        file: UploadFile,
        theater_id: int | None = None,
    ) -> FileUploadResponse:
        """
        Сохранить загруженный файл.
        
        Args:
            file: Загружаемый файл
            theater_id: ID театра
            
        Returns:
            Информация о сохранённом файле
            
        Raises:
            ValidationError: Если файл не прошёл валидацию
        """
        # Проверяем расширение
        file_ext = Path(file.filename or "").suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise ValidationError(f"Недопустимый тип файла: {file_ext}")
        
        # Читаем содержимое для проверки размера
        content = await file.read()
        file_size = len(content)
        
        if file_size > MAX_FILE_SIZE:
            raise ValidationError(
                f"Файл слишком большой. Максимум: {MAX_FILE_SIZE // (1024*1024)} MB"
            )
        
        if file_size == 0:
            raise ValidationError("Файл пустой")
        
        # Определяем MIME тип
        mime_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
        file_type = self._get_file_type(mime_type)
        
        # Генерируем путь
        relative_path = self._generate_file_path(file.filename or "file", theater_id)
        full_path = self._storage_path / relative_path
        
        # Создаём директорию
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Сохраняем файл
        with open(full_path, "wb") as f:
            f.write(content)
        
        return FileUploadResponse(
            file_path=relative_path,
            file_name=file.filename or "file",
            file_size=file_size,
            mime_type=mime_type,
            file_type=file_type,
        )
    
    def delete_file(self, file_path: str) -> bool:
        """Удалить файл из хранилища."""
        full_path = self._storage_path / file_path
        if full_path.exists():
            full_path.unlink()
            return True
        return False
    
    def get_file_url(self, file_path: str) -> str:
        """Получить URL для доступа к файлу."""
        return f"/storage/documents/{file_path}"
    
    # =========================================================================
    # Categories
    # =========================================================================
    
    async def get_categories(
        self,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[DocumentCategory], int]:
        """Получить список категорий."""
        items = await self._category_repo.get_all(skip=skip, limit=limit)
        total = await self._category_repo.count()
        return list(items), total
    
    async def get_categories_tree(
        self,
        theater_id: int | None = None,
    ) -> list[DocumentCategory]:
        """Получить дерево категорий."""
        categories = await self._category_repo.get_tree(theater_id)
        return list(categories)
    
    async def get_category(self, category_id: int) -> DocumentCategory:
        """Получить категорию по ID."""
        category = await self._category_repo.get_by_id(category_id)
        if not category:
            raise NotFoundError(f"Категория с ID {category_id} не найдена")
        return category
    
    async def create_category(
        self,
        data: DocCategoryCreate,
        user_id: int,
        theater_id: int | None = None,
    ) -> DocumentCategory:
        """Создать категорию."""
        # Проверяем уникальность кода
        existing = await self._category_repo.get_by_code(data.code, theater_id)
        if existing:
            raise AlreadyExistsError(f"Категория с кодом '{data.code}' уже существует")
        
        category = DocumentCategory(
            **data.model_dump(),
            theater_id=theater_id,
            created_by_id=user_id,
            updated_by_id=user_id,
        )
        
        created = await self._category_repo.create(category.__dict__)
        await self._session.commit()
        
        return await self._category_repo.get_by_id(created.id)
    
    async def update_category(
        self,
        category_id: int,
        data: DocCategoryUpdate,
        user_id: int,
    ) -> DocumentCategory:
        """Обновить категорию."""
        category = await self.get_category(category_id)
        
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by_id"] = user_id
        
        # Проверяем код на уникальность
        if "code" in update_data and update_data["code"] != category.code:
            existing = await self._category_repo.get_by_code(update_data["code"], category.theater_id)
            if existing:
                raise AlreadyExistsError(f"Категория с кодом '{update_data['code']}' уже существует")
        
        updated = await self._category_repo.update(category_id, update_data)
        await self._session.commit()
        
        return updated
    
    async def delete_category(self, category_id: int) -> bool:
        """Удалить категорию (soft delete)."""
        await self.get_category(category_id)
        await self._category_repo.update(category_id, {"is_active": False})
        await self._session.commit()
        return True
    
    # =========================================================================
    # Tags
    # =========================================================================
    
    async def get_tags(
        self,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Tag]:
        """Получить список тегов."""
        items = await self._tag_repo.get_all(skip=skip, limit=limit)
        return list(items)
    
    async def create_tag(
        self,
        name: str,
        color: str | None = None,
        theater_id: int | None = None,
    ) -> Tag:
        """Создать тег."""
        existing = await self._tag_repo.get_by_name(name, theater_id)
        if existing:
            raise AlreadyExistsError(f"Тег '{name}' уже существует")
        
        tag = Tag(name=name, color=color, theater_id=theater_id)
        self._session.add(tag)
        await self._session.commit()
        
        return tag
    
    async def delete_tag(self, tag_id: int) -> bool:
        """Удалить тег."""
        tag = await self._tag_repo.get_by_id(tag_id)
        if not tag:
            raise NotFoundError(f"Тег с ID {tag_id} не найден")
        
        await self._session.delete(tag)
        await self._session.commit()
        return True
    
    # =========================================================================
    # Documents
    # =========================================================================
    
    async def get_documents(
        self,
        search: str | None = None,
        category_id: int | None = None,
        status: DocumentStatus | None = None,
        file_type: FileType | None = None,
        tag_ids: list[int] | None = None,
        is_public: bool | None = None,
        is_active: bool | None = True,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Document], int]:
        """Получить список документов с фильтрацией."""
        documents, total = await self._document_repo.search(
            search=search,
            category_id=category_id,
            status=status,
            file_type=file_type,
            tag_ids=tag_ids,
            is_public=is_public,
            is_active=is_active,
            theater_id=theater_id,
            skip=skip,
            limit=limit,
        )
        return list(documents), total
    
    async def get_document(self, document_id: int) -> Document:
        """Получить документ по ID."""
        document = await self._document_repo.get_with_relations(document_id)
        if not document:
            raise NotFoundError(f"Документ с ID {document_id} не найден")
        return document
    
    async def create_document(
        self,
        data: DocumentCreate,
        file_info: FileUploadResponse,
        user_id: int,
        theater_id: int | None = None,
    ) -> Document:
        """
        Создать документ.
        
        Args:
            data: Данные документа
            file_info: Информация о загруженном файле
            user_id: ID пользователя
            theater_id: ID театра
        """
        # Проверяем категорию
        if data.category_id:
            await self.get_category(data.category_id)
        
        # Получаем теги
        tags = []
        if data.tag_ids:
            tags = list(await self._tag_repo.get_by_ids(data.tag_ids))
        
        # Создаём документ
        document = Document(
            name=data.name,
            description=data.description,
            category_id=data.category_id,
            file_path=file_info.file_path,
            file_name=file_info.file_name,
            file_size=file_info.file_size,
            mime_type=file_info.mime_type,
            file_type=file_info.file_type,
            current_version=1,
            status=DocumentStatus.ACTIVE,
            performance_id=data.performance_id,
            is_public=data.is_public,
            theater_id=theater_id,
            created_by_id=user_id,
            updated_by_id=user_id,
            tags=tags,
        )
        
        self._session.add(document)
        await self._session.flush()
        
        # Создаём первую версию
        await self._version_repo.create_version(
            document_id=document.id,
            version=1,
            file_path=file_info.file_path,
            file_name=file_info.file_name,
            file_size=file_info.file_size,
            user_id=user_id,
            comment="Первоначальная загрузка",
        )
        
        await self._session.commit()
        
        return await self._document_repo.get_with_relations(document.id)
    
    async def update_document(
        self,
        document_id: int,
        data: DocumentUpdate,
        user_id: int,
        new_file: FileUploadResponse | None = None,
    ) -> Document:
        """
        Обновить документ.
        
        При загрузке нового файла создаётся новая версия.
        """
        document = await self.get_document(document_id)
        
        update_data = data.model_dump(exclude_unset=True, exclude={"tag_ids"})
        update_data["updated_by_id"] = user_id
        
        # Обновляем теги
        if data.tag_ids is not None:
            tags = list(await self._tag_repo.get_by_ids(data.tag_ids))
            document.tags = tags
        
        # Если есть новый файл — создаём версию
        if new_file:
            new_version = document.current_version + 1
            
            # Сохраняем текущую версию в историю (если ещё не сохранена)
            existing_version = await self._version_repo.get_latest(document_id)
            if not existing_version or existing_version.version != document.current_version:
                await self._version_repo.create_version(
                    document_id=document_id,
                    version=document.current_version,
                    file_path=document.file_path,
                    file_name=document.file_name,
                    file_size=document.file_size,
                    user_id=user_id,
                    comment="Автосохранение перед обновлением",
                )
            
            # Создаём новую версию
            await self._version_repo.create_version(
                document_id=document_id,
                version=new_version,
                file_path=new_file.file_path,
                file_name=new_file.file_name,
                file_size=new_file.file_size,
                user_id=user_id,
                comment="Обновление файла",
            )
            
            # Удаляем старые версии (оставляем 2)
            await self._version_repo.delete_old_versions(document_id, keep_count=2)
            
            # Обновляем данные документа
            update_data["file_path"] = new_file.file_path
            update_data["file_name"] = new_file.file_name
            update_data["file_size"] = new_file.file_size
            update_data["mime_type"] = new_file.mime_type
            update_data["file_type"] = new_file.file_type
            update_data["current_version"] = new_version
        
        await self._document_repo.update(document_id, update_data)
        await self._session.commit()
        
        return await self._document_repo.get_with_relations(document_id)
    
    async def delete_document(self, document_id: int, user_id: int) -> bool:
        """Удалить документ (soft delete)."""
        await self.get_document(document_id)
        await self._document_repo.update(document_id, {
            "is_active": False,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        return True
    
    async def archive_document(self, document_id: int, user_id: int) -> Document:
        """Архивировать документ."""
        document = await self.get_document(document_id)
        
        if document.status == DocumentStatus.ARCHIVED:
            raise ValidationError("Документ уже в архиве")
        
        await self._document_repo.update(document_id, {
            "status": DocumentStatus.ARCHIVED,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        
        return await self._document_repo.get_with_relations(document_id)
    
    async def restore_document(self, document_id: int, user_id: int) -> Document:
        """Восстановить документ из архива."""
        document = await self.get_document(document_id)
        
        if document.status != DocumentStatus.ARCHIVED:
            raise ValidationError("Документ не в архиве")
        
        await self._document_repo.update(document_id, {
            "status": DocumentStatus.ACTIVE,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        
        return await self._document_repo.get_with_relations(document_id)
    
    # =========================================================================
    # Versions
    # =========================================================================
    
    async def get_document_versions(
        self,
        document_id: int,
        skip: int = 0,
        limit: int = 10,
    ) -> list[DocumentVersion]:
        """Получить версии документа."""
        await self.get_document(document_id)
        versions = await self._version_repo.get_by_document(document_id, skip, limit)
        return list(versions)
    
    # =========================================================================
    # Statistics
    # =========================================================================
    
    async def get_stats(self, theater_id: int | None = None) -> DocumentStats:
        """Получить статистику документов."""
        stats = await self._document_repo.get_stats(theater_id)
        
        # Количество категорий
        categories, _ = await self.get_categories(theater_id)
        stats["categories_count"] = len([c for c in categories if c.is_active])
        
        # Количество тегов
        tags = await self.get_tags(theater_id)
        stats["tags_count"] = len(tags)
        
        return DocumentStats(
            total_documents=stats["total_documents"],
            active=stats.get("active", 0),
            draft=stats.get("draft", 0),
            archived=stats.get("archived", 0),
            total_size=stats["total_size"],
            categories_count=stats["categories_count"],
            tags_count=stats["tags_count"],
            pdf_count=stats.get("pdf_count", 0),
            document_count=stats.get("document_count", 0),
            spreadsheet_count=stats.get("spreadsheet_count", 0),
            image_count=stats.get("image_count", 0),
            other_count=stats.get("other_count", 0),
        )
