"""
Зависимости для API endpoints.

Содержит Dependency Injection функции для:
- Получения текущего пользователя
- Получения сессии БД
- Получения сервисов
"""
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import TokenType
from app.core.exceptions import (
    InvalidTokenError,
    TokenBlacklistedError,
    TokenExpiredError,
    UserNotActiveError,
)
from app.core.security import get_token_payload
from app.database.session import get_session
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import CurrentUser
from app.services.auth_service import AuthService
from app.services.redis_service import redis_service, RedisService


# HTTP Bearer схема для Swagger UI
bearer_scheme = HTTPBearer(auto_error=False)


async def get_redis() -> RedisService:
    """
    Получить сервис Redis.
    
    Redis инициализируется один раз при старте приложения (в lifespan).
    Эта зависимость просто возвращает глобальный экземпляр.
    """
    # Redis уже должен быть подключен в lifespan
    return redis_service


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Получить сессию базы данных.
    
    Yields:
        AsyncSession для работы с БД
    """
    async for session in get_session():
        yield session


def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    redis: Annotated[RedisService, Depends(get_redis)],
) -> AuthService:
    """Получить сервис аутентификации."""
    return AuthService(session, redis)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    redis: Annotated[RedisService, Depends(get_redis)],
) -> CurrentUser:
    """
    Получить текущего аутентифицированного пользователя.
    
    Проверяет JWT токен, валидирует его и возвращает
    информацию о пользователе.
    
    Args:
        credentials: Bearer токен из заголовка
        session: Сессия БД
        redis: Сервис Redis
        
    Returns:
        CurrentUser с информацией о пользователе
        
    Raises:
        HTTPException 401: Если токен отсутствует или невалиден
        HTTPException 403: Если пользователь деактивирован
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    try:
        # Проверяем, не в blacklist ли токен
        if await redis.is_token_blacklisted(token):
            raise TokenBlacklistedError()
        
        # Декодируем токен
        payload = get_token_payload(token, TokenType.ACCESS)
        
        user_id = int(payload["sub"])
        
    except (TokenExpiredError, InvalidTokenError, TokenBlacklistedError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e.detail),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невалидный токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Получаем пользователя из БД
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id_with_roles(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт деактивирован",
        )
    
    # Формируем CurrentUser из данных токена и БД
    return CurrentUser(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,
        theater_id=user.theater_id,
        roles=payload.get("roles", []),
        permissions=payload.get("permissions", []),
    )


async def get_current_active_user(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    """
    Получить текущего активного пользователя.
    
    Дополнительно проверяет, что пользователь активен.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт деактивирован",
        )
    return current_user


async def get_current_superuser(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    """
    Получить текущего суперпользователя.
    
    Используется для защиты административных endpoint'ов.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуются права администратора",
        )
    return current_user


# Аннотированные типы для удобства
SessionDep = Annotated[AsyncSession, Depends(get_db_session)]
RedisDep = Annotated[RedisService, Depends(get_redis)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
