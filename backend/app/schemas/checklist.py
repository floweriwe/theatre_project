"""
Pydantic схемы для чеклистов готовности.
"""
from datetime import datetime

from pydantic import BaseModel, Field


# =============================================================================
# Checklist Item Schemas
# =============================================================================

class ChecklistItemBase(BaseModel):
    """Базовые поля элемента чеклиста."""
    description: str = Field(..., min_length=1, max_length=500)


class ChecklistItemCreate(ChecklistItemBase):
    """Схема создания элемента."""
    pass


class ChecklistItemUpdate(BaseModel):
    """Схема обновления элемента."""
    description: str | None = Field(None, min_length=1, max_length=500)
    is_completed: bool | None = None
    sort_order: int | None = None
    assigned_to_id: int | None = None


class ChecklistItemResponse(BaseModel):
    """Ответ с элементом чеклиста."""
    id: int
    checklist_id: int
    description: str
    is_completed: bool
    sort_order: int
    assigned_to_id: int | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================================================
# Checklist Schemas
# =============================================================================

class ChecklistBase(BaseModel):
    """Базовые поля чеклиста."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None


class ChecklistCreate(ChecklistBase):
    """Схема создания чеклиста."""
    pass


class ChecklistUpdate(BaseModel):
    """Схема обновления чеклиста."""
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None


class ChecklistResponse(BaseModel):
    """Ответ с чеклистом (без элементов)."""
    id: int
    performance_id: int
    name: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChecklistWithItemsResponse(ChecklistResponse):
    """Ответ с чеклистом и элементами."""
    items: list[ChecklistItemResponse] = []
    total_items: int = 0
    completed_items: int = 0
    completion_percentage: int = 0

    model_config = {"from_attributes": True}


# =============================================================================
# Aggregated Responses
# =============================================================================

class PerformanceChecklistsResponse(BaseModel):
    """Ответ со всеми чеклистами спектакля."""
    performance_id: int
    checklists: list[ChecklistWithItemsResponse] = []
    total_checklists: int = 0
    overall_completion: int = 0  # Средний процент выполнения
