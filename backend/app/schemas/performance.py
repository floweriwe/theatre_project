"""
Pydantic схемы модуля спектаклей.

Содержит схемы для:
- Спектаклей (Performance)
- Разделов паспорта (PerformanceSection)
"""
from datetime import datetime, date
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict

from app.schemas.base import PaginatedResponse


# =============================================================================
# Enums
# =============================================================================

class PerformanceStatus(str, Enum):
    """Статус спектакля."""
    
    PREPARATION = "preparation"
    IN_REPERTOIRE = "in_repertoire"
    PAUSED = "paused"
    ARCHIVED = "archived"


class SectionType(str, Enum):
    """Тип раздела паспорта."""
    
    LIGHTING = "lighting"
    SOUND = "sound"
    SCENERY = "scenery"
    PROPS = "props"
    COSTUMES = "costumes"
    MAKEUP = "makeup"
    VIDEO = "video"
    EFFECTS = "effects"
    OTHER = "other"


# =============================================================================
# Performance Section Schemas
# =============================================================================

class SectionBase(BaseModel):
    """Базовая схема раздела паспорта."""
    
    section_type: SectionType
    title: str = Field(..., min_length=1, max_length=100)
    content: str | None = Field(None, max_length=10000)
    responsible_id: int | None = None
    data: dict | None = None
    sort_order: int = Field(0, ge=0)


class SectionCreate(SectionBase):
    """Схема создания раздела."""
    pass


class SectionUpdate(BaseModel):
    """Схема обновления раздела."""
    
    title: str | None = Field(None, min_length=1, max_length=100)
    content: str | None = None
    responsible_id: int | None = None
    data: dict | None = None
    sort_order: int | None = None


class SectionResponse(SectionBase):
    """Схема ответа раздела."""
    
    id: int
    performance_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Performance Schemas
# =============================================================================

class PerformanceBase(BaseModel):
    """Базовая схема спектакля."""
    
    title: str = Field(..., min_length=1, max_length=255)
    subtitle: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=10000)
    
    # Авторы
    author: str | None = Field(None, max_length=255)
    director: str | None = Field(None, max_length=255)
    composer: str | None = Field(None, max_length=255)
    choreographer: str | None = Field(None, max_length=255)
    
    # Характеристики
    genre: str | None = Field(None, max_length=100)
    age_rating: str | None = Field(None, max_length=10)
    duration_minutes: int | None = Field(None, ge=1)
    intermissions: int = Field(0, ge=0)
    
    # Даты
    premiere_date: date | None = None


class PerformanceCreate(PerformanceBase):
    """Схема создания спектакля."""
    pass


class PerformanceUpdate(BaseModel):
    """Схема обновления спектакля."""
    
    title: str | None = Field(None, min_length=1, max_length=255)
    subtitle: str | None = None
    description: str | None = None
    author: str | None = None
    director: str | None = None
    composer: str | None = None
    choreographer: str | None = None
    genre: str | None = None
    age_rating: str | None = None
    duration_minutes: int | None = None
    intermissions: int | None = None
    premiere_date: date | None = None
    status: PerformanceStatus | None = None
    is_active: bool | None = None


class PerformanceResponse(PerformanceBase):
    """Схема ответа спектакля."""
    
    id: int
    status: PerformanceStatus
    poster_path: str | None
    metadata: dict | None
    is_active: bool
    theater_id: int | None
    created_at: datetime
    updated_at: datetime
    
    # Вложенные объекты
    sections: list[SectionResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


class PerformanceListResponse(BaseModel):
    """Схема для списка спектаклей (облегчённая)."""
    
    id: int
    title: str
    subtitle: str | None
    author: str | None
    director: str | None
    genre: str | None
    age_rating: str | None
    duration_minutes: int | None
    status: PerformanceStatus
    premiere_date: date | None
    poster_path: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Paginated Responses
# =============================================================================

class PaginatedPerformances(PaginatedResponse):
    """Постраничный список спектаклей."""
    
    items: list[PerformanceListResponse]


# =============================================================================
# Filter Schemas
# =============================================================================

class PerformanceFilter(BaseModel):
    """Фильтры для поиска спектаклей."""
    
    search: str | None = Field(None, description="Поиск по названию")
    status: PerformanceStatus | None = Field(None, description="Фильтр по статусу")
    genre: str | None = Field(None, description="Фильтр по жанру")


# =============================================================================
# Statistics
# =============================================================================

class PerformanceStats(BaseModel):
    """Статистика спектаклей."""

    total_performances: int
    preparation: int
    in_repertoire: int
    paused: int
    archived: int

    # По жанрам (топ-5)
    genres: list[dict] = []


# =============================================================================
# Performance Inventory Schemas
# =============================================================================

class PerformanceInventoryCreate(BaseModel):
    """Схема для привязки предмета инвентаря к спектаклю."""

    item_id: int = Field(..., description="ID предмета инвентаря")
    note: str | None = Field(None, max_length=1000, description="Примечание (например, 'Только в 1 акте')")
    quantity_required: int = Field(1, ge=1, description="Требуемое количество")


class PerformanceInventoryItemResponse(BaseModel):
    """Информация о предмете инвентаря в контексте спектакля."""

    item_id: int
    item_name: str
    item_inventory_number: str
    item_status: str
    note: str | None
    quantity_required: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PerformanceInventoryResponse(BaseModel):
    """Ответ со списком привязанного инвентаря."""

    performance_id: int
    items: list[PerformanceInventoryItemResponse] = []
