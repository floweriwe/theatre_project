"""
Схемы аутентификации и авторизации.

Содержит схемы для login, register, token refresh.
"""
from typing import Annotated
from pydantic import Field, field_validator
import re

from app.schemas.base import BaseSchema
from app.core.constants import PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH


# Простая валидация email без DNS-проверки
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def validate_email_simple(email: str) -> str:
    """Простая валидация email без проверки DNS."""
    if not EMAIL_REGEX.match(email):
        raise ValueError('Некорректный формат email')
    return email.lower()


class LoginRequest(BaseSchema):
    """Запрос на вход в систему."""
    
    email: str = Field(
        ...,
        description="Email пользователя",
        examples=["user@example.com"],
    )
    password: str = Field(
        ...,
        min_length=1,
        description="Пароль",
        examples=["secretpassword"],
    )
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        return validate_email_simple(v)


class RegisterRequest(BaseSchema):
    """Запрос на регистрацию нового пользователя."""
    
    email: str = Field(
        ...,
        description="Email пользователя",
        examples=["user@example.com"],
    )
    password: str = Field(
        ...,
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description=f"Пароль (от {PASSWORD_MIN_LENGTH} до {PASSWORD_MAX_LENGTH} символов)",
        examples=["SecurePass123!"],
    )
    first_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Имя",
        examples=["Иван"],
    )
    last_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Фамилия",
        examples=["Иванов"],
    )
    patronymic: str | None = Field(
        None,
        max_length=100,
        description="Отчество",
        examples=["Иванович"],
    )
    phone: str | None = Field(
        None,
        max_length=20,
        description="Телефон",
        examples=["+7 999 123-45-67"],
    )
    theater_code: str | None = Field(
        None,
        max_length=50,
        description="Код театра для привязки",
        examples=["bolshoi"],
    )
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        return validate_email_simple(v)


class TokenResponse(BaseSchema):
    """Ответ с токенами доступа."""
    
    access_token: str = Field(
        ...,
        description="JWT access token",
    )
    refresh_token: str = Field(
        ...,
        description="JWT refresh token",
    )
    token_type: str = Field(
        default="bearer",
        description="Тип токена",
    )


class RefreshTokenRequest(BaseSchema):
    """Запрос на обновление access token."""
    
    refresh_token: str = Field(
        ...,
        description="Refresh token для получения нового access token",
    )


class TokenPayload(BaseSchema):
    """Payload JWT токена."""
    
    sub: str = Field(..., description="ID пользователя")
    type: str = Field(..., description="Тип токена (access/refresh)")
    exp: int = Field(..., description="Время истечения (timestamp)")
    theater_id: int | None = Field(None, description="ID театра")
    roles: list[str] = Field(default_factory=list, description="Роли пользователя")
    permissions: list[str] = Field(default_factory=list, description="Разрешения")
