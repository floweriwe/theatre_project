"""
Pydantic схемы для чеклистов Performance Hub.

Содержит схемы для:
- ChecklistTemplate — шаблоны чеклистов
- ChecklistInstance — экземпляры чеклистов
"""
from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# Enums
# =============================================================================

class ChecklistType(str, Enum):
    """Тип чеклиста."""
    PRE_SHOW = "pre_show"
    DAY_OF = "day_of"
    POST_SHOW = "post_show"
    MONTAGE = "montage"
    REHEARSAL = "rehearsal"


class ChecklistStatus(str, Enum):
    """Статус выполнения чеклиста."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


# =============================================================================
# Checklist Item Schemas
# =============================================================================

class ChecklistItemDefinition(BaseModel):
    """Определение элемента чеклиста в шаблоне."""

    label: str = Field(..., min_length=1, max_length=500)
    description: str | None = Field(None, max_length=1000)
    required: bool = Field(True)


class ChecklistItemCompletion(BaseModel):
    """Данные о выполнении элемента чеклиста."""

    index: int
    is_checked: bool = False
    comment: str | None = None
    photo_url: str | None = None
    checked_by_id: int | None = None
    checked_at: datetime | None = None


class ChecklistItemUpdate(BaseModel):
    """Схема обновления статуса элемента чеклиста."""

    is_checked: bool
    comment: str | None = Field(None, max_length=1000)
    photo_url: str | None = Field(None, max_length=500)


# =============================================================================
# Checklist Template Schemas
# =============================================================================

class ChecklistTemplateCreate(BaseModel):
    """Схема создания шаблона чеклиста."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    type: ChecklistType
    items: list[ChecklistItemDefinition] = Field(default_factory=list)


class ChecklistTemplateUpdate(BaseModel):
    """Схема обновления шаблона чеклиста."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    type: ChecklistType | None = None
    items: list[ChecklistItemDefinition] | None = None
    is_active: bool | None = None


class ChecklistTemplateResponse(BaseModel):
    """Схема ответа шаблона чеклиста."""

    id: UUID
    name: str
    description: str | None
    type: ChecklistType
    items: list[ChecklistItemDefinition]
    is_active: bool
    theater_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChecklistTemplateListResponse(BaseModel):
    """Схема для списка шаблонов (облегчённая)."""

    id: UUID
    name: str
    type: ChecklistType
    items_count: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Checklist Instance Schemas
# =============================================================================

class ChecklistInstanceCreate(BaseModel):
    """Схема создания экземпляра чеклиста."""

    template_id: UUID | None = Field(None, description="ID шаблона (опционально)")
    name: str | None = Field(None, min_length=1, max_length=255, description="Кастомное название")


class ChecklistInstanceResponse(BaseModel):
    """Схема ответа экземпляра чеклиста."""

    id: UUID
    performance_id: int
    template_id: UUID | None
    name: str
    status: ChecklistStatus
    completion_data: dict
    created_at: datetime
    updated_at: datetime

    # Вычисляемые поля
    total_items: int = 0
    completed_items: int = 0
    completion_percentage: int = 0

    # Вложенная информация о шаблоне
    template_name: str | None = None
    template_type: ChecklistType | None = None

    model_config = ConfigDict(from_attributes=True)


class ChecklistInstanceListResponse(BaseModel):
    """Схема для списка экземпляров (облегчённая)."""

    id: UUID
    name: str
    status: ChecklistStatus
    template_type: ChecklistType | None
    completion_percentage: int

    model_config = ConfigDict(from_attributes=True)
