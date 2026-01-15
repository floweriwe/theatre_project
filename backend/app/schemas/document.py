"""
Pydantic схемы модуля документооборота.

Содержит схемы для:
- Категорий документов
- Документов
- Версий документов
- Тегов
"""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict

from app.schemas.base import PaginatedResponse


# =============================================================================
# Enums
# =============================================================================

class DocumentStatus(str, Enum):
    """Статус документа."""
    
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class FileType(str, Enum):
    """Тип файла."""
    
    PDF = "pdf"
    DOCUMENT = "document"
    SPREADSHEET = "spreadsheet"
    IMAGE = "image"
    OTHER = "other"


# =============================================================================
# Tag Schemas
# =============================================================================

class TagBase(BaseModel):
    """Базовая схема тега."""
    
    name: str = Field(..., min_length=1, max_length=50)
    color: str | None = Field(None, max_length=7)


class TagCreate(TagBase):
    """Схема создания тега."""
    pass


class TagResponse(TagBase):
    """Схема ответа тега."""
    
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Document Category Schemas
# =============================================================================

class DocCategoryBase(BaseModel):
    """Базовая схема категории документов."""
    
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: str | None = Field(None, max_length=2000)
    parent_id: int | None = None
    color: str | None = Field(None, max_length=7)
    icon: str | None = Field(None, max_length=50)
    sort_order: int = Field(0, ge=0)
    required_permissions: list[str] | None = None


class DocCategoryCreate(DocCategoryBase):
    """Схема создания категории."""
    pass


class DocCategoryUpdate(BaseModel):
    """Схема обновления категории."""
    
    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None
    parent_id: int | None = None
    color: str | None = None
    icon: str | None = None
    sort_order: int | None = None
    required_permissions: list[str] | None = None
    is_active: bool | None = None


class DocCategoryResponse(DocCategoryBase):
    """Схема ответа категории."""
    
    id: int
    is_active: bool
    theater_id: int | None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DocCategoryWithChildren(DocCategoryResponse):
    """Категория с дочерними элементами."""
    
    children: list["DocCategoryWithChildren"] = []


# =============================================================================
# Document Version Schemas
# =============================================================================

class DocumentVersionResponse(BaseModel):
    """Схема ответа версии документа."""
    
    id: int
    document_id: int
    version: int
    file_path: str
    file_name: str
    file_size: int
    comment: str | None
    created_at: datetime
    created_by_id: int | None
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Document Schemas
# =============================================================================

class DocumentBase(BaseModel):
    """Базовая схема документа."""
    
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=5000)
    category_id: int | None = None
    is_public: bool = False


class DocumentCreate(DocumentBase):
    """Схема создания документа (без файла — он передаётся отдельно)."""
    
    tag_ids: list[int] | None = None
    performance_id: int | None = None


class DocumentUpdate(BaseModel):
    """Схема обновления документа."""
    
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    category_id: int | None = None
    status: DocumentStatus | None = None
    is_public: bool | None = None
    tag_ids: list[int] | None = None
    performance_id: int | None = None
    is_active: bool | None = None


class DocumentResponse(DocumentBase):
    """Схема ответа документа."""
    
    id: int
    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    file_type: FileType
    current_version: int
    status: DocumentStatus
    performance_id: int | None
    metadata: dict | None
    is_active: bool
    theater_id: int | None
    created_at: datetime
    updated_at: datetime
    
    # Вложенные объекты
    category: DocCategoryResponse | None = None
    tags: list[TagResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    """Схема для списка документов (облегчённая)."""
    
    id: int
    name: str
    file_name: str
    file_size: int
    file_type: FileType
    status: DocumentStatus
    category_id: int | None
    category_name: str | None = None
    current_version: int
    is_public: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Paginated Responses
# =============================================================================

class PaginatedDocuments(PaginatedResponse):
    """Постраничный список документов."""
    
    items: list[DocumentListResponse]


class PaginatedDocCategories(PaginatedResponse):
    """Постраничный список категорий."""
    
    items: list[DocCategoryResponse]


# =============================================================================
# Filter Schemas
# =============================================================================

class DocumentFilter(BaseModel):
    """Фильтры для поиска документов."""
    
    search: str | None = Field(None, description="Поиск по названию")
    category_id: int | None = Field(None, description="Фильтр по категории")
    status: DocumentStatus | None = Field(None, description="Фильтр по статусу")
    file_type: FileType | None = Field(None, description="Фильтр по типу файла")
    tag_ids: list[int] | None = Field(None, description="Фильтр по тегам")
    is_public: bool | None = Field(None, description="Только публичные")


# =============================================================================
# Statistics
# =============================================================================

class DocumentStats(BaseModel):
    """Статистика документов."""
    
    total_documents: int
    active: int
    draft: int
    archived: int
    total_size: int  # в байтах
    categories_count: int
    tags_count: int
    
    # По типам файлов
    pdf_count: int = 0
    document_count: int = 0
    spreadsheet_count: int = 0
    image_count: int = 0
    other_count: int = 0


# =============================================================================
# File Upload Response
# =============================================================================

class FileUploadResponse(BaseModel):
    """Ответ после загрузки файла."""
    
    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    file_type: FileType
