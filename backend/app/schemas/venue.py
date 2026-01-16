"""
Pydantic схемы для модуля площадок театра.

Содержит схемы для CRUD операций с площадками (Venue).
"""
from datetime import datetime
from typing import Optional

from pydantic import Field, field_validator

from app.models.venue import VenueType
from app.schemas.base import BaseSchema, TimestampSchema


class VenueBase(BaseSchema):
    """Базовая схема площадки."""

    name: str = Field(..., min_length=1, max_length=100, description="Название площадки")
    code: str = Field(..., min_length=1, max_length=50, description="Код площадки")
    description: Optional[str] = Field(None, description="Описание площадки")
    venue_type: VenueType = Field(..., description="Тип площадки")
    capacity: Optional[int] = Field(None, gt=0, description="Вместимость (только для залов и сцен)")
    address: Optional[str] = Field(None, max_length=500, description="Адрес (если отличается от основного)")
    is_active: bool = Field(True, description="Активна ли площадка")


class VenueCreate(VenueBase):
    """Схема для создания площадки."""

    @field_validator('capacity')
    @classmethod
    def validate_capacity(cls, v: Optional[int], info) -> Optional[int]:
        """Проверить вместимость."""
        if v is not None and v <= 0:
            raise ValueError('Вместимость должна быть положительным числом')
        return v

    @field_validator('code')
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Проверить и нормализовать код."""
        if not v or not v.strip():
            raise ValueError('Код не может быть пустым')
        # Приводим к верхнему регистру и убираем лишние пробелы
        return v.strip().upper()


class VenueUpdate(BaseSchema):
    """Схема для обновления площадки."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    venue_type: Optional[VenueType] = None
    capacity: Optional[int] = Field(None, gt=0)
    address: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

    @field_validator('capacity')
    @classmethod
    def validate_capacity(cls, v: Optional[int]) -> Optional[int]:
        """Проверить вместимость."""
        if v is not None and v <= 0:
            raise ValueError('Вместимость должна быть положительным числом')
        return v

    @field_validator('code')
    @classmethod
    def validate_code(cls, v: Optional[str]) -> Optional[str]:
        """Проверить и нормализовать код."""
        if v is not None:
            if not v.strip():
                raise ValueError('Код не может быть пустым')
            return v.strip().upper()
        return v


class VenueResponse(VenueBase, TimestampSchema):
    """Схема ответа с данными площадки."""

    id: int = Field(..., description="ID площадки")
    theater_id: Optional[int] = Field(None, description="ID театра")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "name": "Основная сцена",
                "code": "MAIN-STAGE",
                "description": "Большой зал на 500 мест",
                "venue_type": "main_stage",
                "capacity": 500,
                "address": None,
                "is_active": True,
                "theater_id": 1,
                "created_at": "2026-01-15T10:00:00Z",
                "updated_at": "2026-01-15T10:00:00Z",
            }
        }
    }


class VenueListResponse(BaseSchema):
    """Схема для списка площадок (упрощенная)."""

    id: int
    name: str
    code: str
    venue_type: VenueType
    capacity: Optional[int] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
