"""
Схемы пользователя.

Содержит схемы для CRUD операций с пользователями.
"""
from datetime import datetime
import re

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema


# Простая валидация email без DNS-проверки
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def validate_email_simple(email: str) -> str:
    """Простая валидация email без проверки DNS."""
    if not EMAIL_REGEX.match(email):
        raise ValueError('Некорректный формат email')
    return email.lower()


class UserBase(BaseSchema):
    """Базовые поля пользователя."""
    
    email: str = Field(..., description="Email пользователя")
    first_name: str = Field(..., min_length=1, max_length=100, description="Имя")
    last_name: str = Field(..., min_length=1, max_length=100, description="Фамилия")
    patronymic: str | None = Field(None, max_length=100, description="Отчество")
    phone: str | None = Field(None, max_length=20, description="Телефон")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        return validate_email_simple(v)


class UserCreate(UserBase):
    """Схема создания пользователя."""
    
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Пароль",
    )
    theater_id: int | None = Field(None, description="ID театра")
    role_ids: list[int] = Field(default_factory=list, description="ID ролей")


class UserUpdate(BaseSchema):
    """Схема обновления пользователя (все поля опциональны)."""
    
    email: str | None = Field(None, description="Email пользователя")
    first_name: str | None = Field(None, min_length=1, max_length=100, description="Имя")
    last_name: str | None = Field(None, min_length=1, max_length=100, description="Фамилия")
    patronymic: str | None = Field(None, max_length=100, description="Отчество")
    phone: str | None = Field(None, max_length=20, description="Телефон")
    is_active: bool | None = Field(None, description="Активен ли пользователь")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v is not None:
            return validate_email_simple(v)
        return v


class UserPasswordUpdate(BaseSchema):
    """Схема обновления пароля."""
    
    current_password: str = Field(..., description="Текущий пароль")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Новый пароль",
    )


class RoleResponse(BaseSchema):
    """Схема роли в ответе."""
    
    id: int
    name: str
    code: str
    permissions: list[str]


class UserResponse(BaseSchema):
    """Схема пользователя в ответе API."""
    
    id: int
    email: str  # Без валидации - данные из БД уже валидны
    first_name: str
    last_name: str
    patronymic: str | None
    phone: str | None
    full_name: str
    is_active: bool
    is_verified: bool
    theater_id: int | None
    roles: list[RoleResponse]
    permissions: list[str]
    created_at: datetime
    last_login_at: datetime | None


class UserInDB(BaseSchema):
    """
    Схема пользователя из БД.
    
    Используется внутренне, содержит hashed_password.
    """
    
    id: int
    email: str
    hashed_password: str
    first_name: str
    last_name: str
    patronymic: str | None
    phone: str | None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    theater_id: int | None
    created_at: datetime
    updated_at: datetime


class CurrentUser(BaseSchema):
    """
    Схема текущего пользователя.
    
    Используется в dependencies для передачи информации
    о пользователе в endpoint'ы.
    """
    
    id: int
    email: str
    first_name: str
    last_name: str
    full_name: str
    is_active: bool
    is_verified: bool
    is_superuser: bool
    theater_id: int | None
    roles: list[str]
    permissions: list[str]
