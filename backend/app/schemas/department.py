"""
Pydantic схемы для модуля департаментов/цехов.

Содержит схемы для работы с цехами театра.
"""
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict

from app.models.department import DepartmentType
from app.schemas.base import PaginatedResponse


# =============================================================================
# Department Schemas
# =============================================================================

class DepartmentBase(BaseModel):
    """Базовая схема цеха."""

    name: str = Field(..., min_length=1, max_length=100, description="Название цеха")
    code: str = Field(..., min_length=1, max_length=50, description="Код цеха")
    description: str | None = Field(None, description="Описание")
    department_type: DepartmentType = Field(..., description="Тип цеха")
    head_id: int | None = Field(None, description="ID руководителя цеха")


class DepartmentCreate(DepartmentBase):
    """Схема создания цеха."""
    pass


class DepartmentUpdate(BaseModel):
    """Схема обновления цеха."""

    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None
    department_type: DepartmentType | None = None
    head_id: int | None = None
    is_active: bool | None = None


class DepartmentResponse(DepartmentBase):
    """Схема ответа цеха."""

    id: int
    is_active: bool
    theater_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DepartmentWithHead(DepartmentResponse):
    """Цех с информацией о руководителе."""

    head_full_name: str | None = None

    @classmethod
    def from_department(cls, department):
        """Создать из модели Department."""
        data = {
            "id": department.id,
            "name": department.name,
            "code": department.code,
            "description": department.description,
            "department_type": department.department_type,
            "head_id": department.head_id,
            "is_active": department.is_active,
            "theater_id": department.theater_id,
            "created_at": department.created_at,
            "updated_at": department.updated_at,
            "head_full_name": department.head.full_name if department.head else None,
        }
        return cls(**data)


# =============================================================================
# Paginated Response
# =============================================================================

class PaginatedDepartments(PaginatedResponse[DepartmentResponse]):
    """Пагинированный список цехов."""
    pass
