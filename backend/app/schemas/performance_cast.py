"""
Pydantic схемы для каста и персонала спектакля.

Содержит схемы для:
- PerformanceCast — связь участников со спектаклем
"""
from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# Enums
# =============================================================================

class CastRoleType(str, Enum):
    """Тип роли участника."""
    CAST = "cast"
    CREW = "crew"


# =============================================================================
# Performance Cast Schemas
# =============================================================================

class PerformanceCastCreate(BaseModel):
    """Схема создания связи участника со спектаклем."""

    user_id: int = Field(..., description="ID пользователя")
    role_type: CastRoleType = Field(..., description="Тип роли: актёр или персонал")
    character_name: str | None = Field(None, max_length=255, description="Имя персонажа (для актёров)")
    functional_role: str | None = Field(None, max_length=255, description="Функциональная роль (для персонала)")
    is_understudy: bool = Field(False, description="Флаг дублёра")
    notes: str | None = Field(None, max_length=2000, description="Примечание")


class PerformanceCastUpdate(BaseModel):
    """Схема обновления связи участника."""

    character_name: str | None = None
    functional_role: str | None = None
    is_understudy: bool | None = None
    notes: str | None = None


class PerformanceCastResponse(BaseModel):
    """Схема ответа связи участника со спектаклем."""

    id: UUID
    performance_id: int
    user_id: int
    role_type: CastRoleType
    character_name: str | None
    functional_role: str | None
    is_understudy: bool
    notes: str | None
    created_at: datetime
    updated_at: datetime

    # Вложенная информация о пользователе
    user_full_name: str | None = None
    user_email: str | None = None
    user_department: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PerformanceCastListResponse(BaseModel):
    """Схема для списка участников (облегчённая)."""

    id: UUID
    user_id: int
    user_full_name: str | None
    role_type: CastRoleType
    character_name: str | None
    functional_role: str | None
    is_understudy: bool

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Grouped Responses
# =============================================================================

class PerformanceCastGroupedResponse(BaseModel):
    """Группированный ответ с кастом и персоналом."""

    performance_id: int
    cast: list[PerformanceCastListResponse] = []
    crew: list[PerformanceCastListResponse] = []
    total_cast: int = 0
    total_crew: int = 0
