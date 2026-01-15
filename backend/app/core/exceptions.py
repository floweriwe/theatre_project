"""
Кастомные исключения приложения.

Все бизнес-исключения наследуются от TheatreException,
что позволяет единообразно обрабатывать их в API.
"""
from typing import Any


class TheatreException(Exception):
    """
    Базовое исключение приложения.
    
    Все кастомные исключения должны наследоваться от него.
    Содержит HTTP статус-код и код ошибки для API.
    
    Attributes:
        status_code: HTTP статус-код ответа
        detail: Человекочитаемое описание ошибки
        error_code: Машиночитаемый код ошибки для frontend
    """
    
    def __init__(
        self,
        detail: str = "Произошла ошибка",
        status_code: int = 400,
        error_code: str = "THEATRE_ERROR",
    ) -> None:
        self.detail = detail
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.detail)


# =============================================================================
# Authentication Exceptions
# =============================================================================

class AuthenticationError(TheatreException):
    """Ошибка аутентификации."""
    
    def __init__(self, detail: str = "Ошибка аутентификации") -> None:
        super().__init__(
            detail=detail,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
        )


class InvalidCredentialsError(AuthenticationError):
    """Неверные учётные данные."""
    
    def __init__(self) -> None:
        super().__init__(detail="Неверный email или пароль")
        self.error_code = "INVALID_CREDENTIALS"


class TokenExpiredError(AuthenticationError):
    """Токен истёк."""
    
    def __init__(self) -> None:
        super().__init__(detail="Токен истёк")
        self.error_code = "TOKEN_EXPIRED"


class InvalidTokenError(AuthenticationError):
    """Невалидный токен."""
    
    def __init__(self) -> None:
        super().__init__(detail="Невалидный токен")
        self.error_code = "INVALID_TOKEN"


class TokenBlacklistedError(AuthenticationError):
    """Токен в чёрном списке (пользователь вышел)."""
    
    def __init__(self) -> None:
        super().__init__(detail="Токен недействителен")
        self.error_code = "TOKEN_BLACKLISTED"


# =============================================================================
# Authorization Exceptions
# =============================================================================

class AuthorizationError(TheatreException):
    """Ошибка авторизации (недостаточно прав)."""
    
    def __init__(self, detail: str = "Недостаточно прав для выполнения операции") -> None:
        super().__init__(
            detail=detail,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
        )


class PermissionDeniedError(AuthorizationError):
    """Отказ в доступе из-за отсутствия разрешения."""
    
    def __init__(self, permission: str | None = None) -> None:
        detail = "Недостаточно прав"
        if permission:
            detail = f"Требуется разрешение: {permission}"
        super().__init__(detail=detail)
        self.error_code = "PERMISSION_DENIED"


# =============================================================================
# Resource Exceptions
# =============================================================================

class NotFoundError(TheatreException):
    """Ресурс не найден."""
    
    def __init__(
        self,
        resource: str = "Ресурс",
        resource_id: Any = None
    ) -> None:
        detail = f"{resource} не найден"
        if resource_id:
            detail = f"{resource} с ID {resource_id} не найден"
        super().__init__(
            detail=detail,
            status_code=404,
            error_code="NOT_FOUND",
        )


class AlreadyExistsError(TheatreException):
    """Ресурс уже существует."""
    
    def __init__(
        self,
        resource: str = "Ресурс",
        field: str | None = None,
        value: Any = None,
    ) -> None:
        if field and value:
            detail = f"{resource} с {field}='{value}' уже существует"
        else:
            detail = f"{resource} уже существует"
        super().__init__(
            detail=detail,
            status_code=409,
            error_code="ALREADY_EXISTS",
        )


# =============================================================================
# Validation Exceptions
# =============================================================================

class ValidationError(TheatreException):
    """Ошибка валидации данных."""
    
    def __init__(self, detail: str = "Ошибка валидации данных") -> None:
        super().__init__(
            detail=detail,
            status_code=422,
            error_code="VALIDATION_ERROR",
        )


# =============================================================================
# User Exceptions
# =============================================================================

class UserNotActiveError(TheatreException):
    """Пользователь деактивирован."""
    
    def __init__(self) -> None:
        super().__init__(
            detail="Аккаунт деактивирован",
            status_code=403,
            error_code="USER_NOT_ACTIVE",
        )


class UserNotVerifiedError(TheatreException):
    """Email пользователя не подтверждён."""
    
    def __init__(self) -> None:
        super().__init__(
            detail="Email не подтверждён",
            status_code=403,
            error_code="USER_NOT_VERIFIED",
        )
