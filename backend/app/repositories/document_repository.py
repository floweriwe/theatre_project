"""
Репозиторий модуля документооборота.

Содержит классы для работы с БД:
- DocumentCategoryRepository
- DocumentRepository
- DocumentVersionRepository
- TagRepository
"""
from typing import Sequence

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.models.document import (
    DocumentCategory,
    Document,
    DocumentVersion,
    Tag,
    DocumentStatus,
    FileType,
)
from app.repositories.base import BaseRepository


class DocumentCategoryRepository(BaseRepository[DocumentCategory]):
    """Репозиторий для работы с категориями документов."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(DocumentCategory, session)
    
    async def get_by_code(self, code: str, theater_id: int | None = None) -> DocumentCategory | None:
        """Получить категорию по коду."""
        query = select(DocumentCategory).where(DocumentCategory.code == code)
        if theater_id:
            query = query.where(DocumentCategory.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_tree(self, theater_id: int | None = None) -> Sequence[DocumentCategory]:
        """Получить дерево категорий."""
        query = (
            select(DocumentCategory)
            .options(selectinload(DocumentCategory.children))
            .where(DocumentCategory.parent_id.is_(None))
            .where(DocumentCategory.is_active.is_(True))
            .order_by(DocumentCategory.sort_order, DocumentCategory.name)
        )
        if theater_id:
            query = query.where(DocumentCategory.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalars().all()


class TagRepository(BaseRepository[Tag]):
    """Репозиторий для работы с тегами."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(Tag, session)
    
    async def get_by_name(self, name: str, theater_id: int | None = None) -> Tag | None:
        """Получить тег по имени."""
        query = select(Tag).where(Tag.name == name)
        if theater_id:
            query = query.where(Tag.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_ids(self, ids: list[int]) -> Sequence[Tag]:
        """Получить теги по списку ID."""
        if not ids:
            return []
        query = select(Tag).where(Tag.id.in_(ids))
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_or_create(self, name: str, theater_id: int | None = None) -> Tag:
        """Получить или создать тег."""
        tag = await self.get_by_name(name, theater_id)
        if tag:
            return tag
        
        tag = Tag(name=name, theater_id=theater_id)
        self._session.add(tag)
        await self._session.flush()
        return tag


class DocumentRepository(BaseRepository[Document]):
    """Репозиторий для работы с документами."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(Document, session)
    
    async def get_with_relations(self, document_id: int) -> Document | None:
        """Получить документ со связанными объектами."""
        query = (
            select(Document)
            .options(
                joinedload(Document.category),
                selectinload(Document.tags),
                selectinload(Document.versions),
            )
            .where(Document.id == document_id)
        )
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def search(
        self,
        search: str | None = None,
        category_id: int | None = None,
        status: DocumentStatus | None = None,
        file_type: FileType | None = None,
        tag_ids: list[int] | None = None,
        is_public: bool | None = None,
        is_active: bool | None = None,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[Document], int]:
        """
        Поиск документов с фильтрацией.
        
        Returns:
            Кортеж (список документов, общее количество)
        """
        # Базовый запрос
        query = select(Document).options(
            joinedload(Document.category),
            selectinload(Document.tags),
        )
        count_query = select(func.count(Document.id))
        
        # Фильтры
        filters = []
        
        if search:
            search_filter = or_(
                Document.name.ilike(f"%{search}%"),
                Document.description.ilike(f"%{search}%"),
                Document.file_name.ilike(f"%{search}%"),
            )
            filters.append(search_filter)
        
        if category_id is not None:
            filters.append(Document.category_id == category_id)
        
        if status is not None:
            filters.append(Document.status == status)
        
        if file_type is not None:
            filters.append(Document.file_type == file_type)
        
        if is_public is not None:
            filters.append(Document.is_public == is_public)
        
        if is_active is not None:
            filters.append(Document.is_active == is_active)
        
        if theater_id is not None:
            filters.append(Document.theater_id == theater_id)
        
        # Применяем фильтры
        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))
        
        # Фильтр по тегам (отдельно, требует join)
        if tag_ids:
            query = query.join(Document.tags).where(Tag.id.in_(tag_ids))
            count_query = count_query.join(Document.tags).where(Tag.id.in_(tag_ids))
        
        # Получаем общее количество
        total_result = await self._session.execute(count_query)
        total = total_result.scalar() or 0
        
        # Применяем пагинацию и сортировку
        query = (
            query
            .order_by(Document.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        
        result = await self._session.execute(query)
        documents = result.scalars().unique().all()
        
        return documents, total
    
    async def get_by_category(
        self,
        category_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[Document]:
        """Получить документы по категории."""
        query = (
            select(Document)
            .where(Document.category_id == category_id)
            .where(Document.is_active.is_(True))
            .order_by(Document.name)
            .offset(skip)
            .limit(limit)
        )
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_stats(self, theater_id: int | None = None) -> dict:
        """Получить статистику документов."""
        base_filter = Document.is_active.is_(True)
        if theater_id:
            base_filter = and_(base_filter, Document.theater_id == theater_id)
        
        # Общее количество
        total_query = select(func.count(Document.id)).where(base_filter)
        total_result = await self._session.execute(total_query)
        total = total_result.scalar() or 0
        
        stats = {"total_documents": total}
        
        # По статусам
        for status in DocumentStatus:
            status_query = (
                select(func.count(Document.id))
                .where(base_filter)
                .where(Document.status == status)
            )
            result = await self._session.execute(status_query)
            stats[status.value] = result.scalar() or 0
        
        # По типам файлов
        for file_type in FileType:
            type_query = (
                select(func.count(Document.id))
                .where(base_filter)
                .where(Document.file_type == file_type)
            )
            result = await self._session.execute(type_query)
            stats[f"{file_type.value}_count"] = result.scalar() or 0
        
        # Общий размер
        size_query = (
            select(func.coalesce(func.sum(Document.file_size), 0))
            .where(base_filter)
        )
        size_result = await self._session.execute(size_query)
        stats["total_size"] = int(size_result.scalar() or 0)
        
        return stats


class DocumentVersionRepository(BaseRepository[DocumentVersion]):
    """Репозиторий для работы с версиями документов."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(DocumentVersion, session)
    
    async def get_by_document(
        self,
        document_id: int,
        skip: int = 0,
        limit: int = 10,
    ) -> Sequence[DocumentVersion]:
        """Получить версии документа."""
        query = (
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_latest(self, document_id: int) -> DocumentVersion | None:
        """Получить последнюю версию документа."""
        query = (
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version.desc())
            .limit(1)
        )
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def create_version(
        self,
        document_id: int,
        version: int,
        file_path: str,
        file_name: str,
        file_size: int,
        user_id: int | None = None,
        comment: str | None = None,
    ) -> DocumentVersion:
        """Создать новую версию документа."""
        doc_version = DocumentVersion(
            document_id=document_id,
            version=version,
            file_path=file_path,
            file_name=file_name,
            file_size=file_size,
            created_by_id=user_id,
            comment=comment,
        )
        self._session.add(doc_version)
        await self._session.flush()
        return doc_version
    
    async def delete_old_versions(self, document_id: int, keep_count: int = 2):
        """
        Удалить старые версии, оставив только keep_count последних.
        
        По умолчанию оставляем 2 версии (текущую + предыдущую).
        """
        # Получаем все версии
        versions = await self.get_by_document(document_id, limit=100)
        
        if len(versions) <= keep_count:
            return
        
        # Удаляем старые
        for version in versions[keep_count:]:
            await self._session.delete(version)
        
        await self._session.flush()
