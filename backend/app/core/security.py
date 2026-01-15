"""
Модуль безопасности.

Содержит функции для работы с JWT токенами,
хэширования паролей и верификации.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.core.constants import TokenType
from app.core.exceptions import InvalidTokenError, TokenExpiredError


# Контекст для хэширования паролей (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# =============================================================================
# Password Functions
# =============================================================================

def hash_password(password: str) -> str:
    """
    Захэшировать пароль.
    
    Использует bcrypt с автоматической генерацией соли.
    
    Args:
        password: Открытый пароль
        
    Returns:
        Хэш пароля для хранения в БД
    """
    return pwd_context.hash(password)


# Алиас для совместимости
get_password_hash = hash_password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверить пароль.
    
    Args:
        plain_password: Введённый пароль
        hashed_password: Хэш из БД
        
    Returns:
        True если пароль верный
    """
    return pwd_context.verify(plain_password, hashed_password)


# =============================================================================
# JWT Functions
# =============================================================================

def create_access_token(
    user_id: int,
    theater_id: int | None = None,
    roles: list[str] | None = None,
    permissions: list[str] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Создать access token.
    
    Access token содержит информацию о пользователе и его правах.
    Короткое время жизни (по умолчанию 30 минут).
    
    Args:
        user_id: ID пользователя
        theater_id: ID театра (tenant)
        roles: Список ролей пользователя
        permissions: Список разрешений
        expires_delta: Время жизни токена
        
    Returns:
        Закодированный JWT токен
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    expire = datetime.now(timezone.utc) + expires_delta
    
    payload = {
        "sub": str(user_id),
        "type": TokenType.ACCESS.value,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    
    if theater_id is not None:
        payload["theater_id"] = theater_id
    
    if roles is not None:
        payload["roles"] = roles
    
    if permissions is not None:
        payload["permissions"] = permissions
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    user_id: int,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Создать refresh token.
    
    Refresh token используется только для получения нового access token.
    Длительное время жизни (по умолчанию 7 дней).
    
    Args:
        user_id: ID пользователя
        expires_delta: Время жизни токена
        
    Returns:
        Закодированный JWT токен
    """
    if expires_delta is None:
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    expire = datetime.now(timezone.utc) + expires_delta
    
    payload = {
        "sub": str(user_id),
        "type": TokenType.REFRESH.value,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Декодировать и валидировать JWT токен.
    
    Args:
        token: JWT токен
        
    Returns:
        Payload токена
        
    Raises:
        TokenExpiredError: Если токен истёк
        InvalidTokenError: Если токен невалидный
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise TokenExpiredError()
    except JWTError:
        raise InvalidTokenError()


def get_token_payload(token: str, expected_type: TokenType) -> dict[str, Any]:
    """
    Получить payload токена с проверкой типа.
    
    Args:
        token: JWT токен
        expected_type: Ожидаемый тип токена
        
    Returns:
        Payload токена
        
    Raises:
        InvalidTokenError: Если тип токена не совпадает
    """
    payload = decode_token(token)
    
    token_type = payload.get("type")
    if token_type != expected_type.value:
        raise InvalidTokenError()
    
    return payload


def get_user_id_from_token(token: str, expected_type: TokenType) -> int:
    """
    Извлечь user_id из токена.
    
    Args:
        token: JWT токен
        expected_type: Ожидаемый тип токена
        
    Returns:
        ID пользователя
        
    Raises:
        InvalidTokenError: Если user_id отсутствует или невалидный
    """
    payload = get_token_payload(token, expected_type)
    
    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenError()
    
    try:
        return int(user_id)
    except ValueError:
        raise InvalidTokenError()
