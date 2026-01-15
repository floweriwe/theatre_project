"""
Эндпоинты аутентификации.

POST /auth/login    - Вход в систему
POST /auth/register - Регистрация
POST /auth/refresh  - Обновление токенов
POST /auth/logout   - Выход из системы
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.deps import AuthServiceDep, CurrentUserDep, get_current_user
from app.core.exceptions import (
    AlreadyExistsError,
    InvalidCredentialsError,
    InvalidTokenError,
    TokenBlacklistedError,
    TokenExpiredError,
    UserNotActiveError,
)
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.base import MessageResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Аутентификация"])

bearer_scheme = HTTPBearer()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Регистрация нового пользователя",
    description="Создаёт нового пользователя в системе. Email должен быть уникальным.",
)
async def register(
    data: RegisterRequest,
    auth_service: AuthServiceDep,
) -> UserResponse:
    """
    Зарегистрировать нового пользователя.
    
    После регистрации пользователь получает статус is_verified=False.
    Для полного доступа требуется подтверждение email.
    """
    try:
        user = await auth_service.register(data)
        
        return UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            patronymic=user.patronymic,
            phone=user.phone,
            full_name=user.full_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            theater_id=user.theater_id,
            roles=[],
            permissions=[],
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )
    
    except AlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.detail,
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Вход в систему",
    description="Аутентификация по email и паролю. Возвращает access и refresh токены.",
)
async def login(
    data: LoginRequest,
    auth_service: AuthServiceDep,
) -> TokenResponse:
    """
    Выполнить вход в систему.
    
    При успешном входе возвращает:
    - access_token: для авторизации запросов (30 минут)
    - refresh_token: для обновления access_token (7 дней)
    """
    try:
        return await auth_service.login(data)
    
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.detail,
        )
    except UserNotActiveError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.detail,
        )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Обновить токены",
    description="Получить новую пару токенов по refresh token.",
)
async def refresh_tokens(
    data: RefreshTokenRequest,
    auth_service: AuthServiceDep,
) -> TokenResponse:
    """
    Обновить access и refresh токены.
    
    Старый refresh token становится недействительным.
    """
    try:
        return await auth_service.refresh_tokens(data.refresh_token)
    
    except (InvalidTokenError, TokenExpiredError, TokenBlacklistedError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.detail,
        )
    except UserNotActiveError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.detail,
        )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Выход из системы",
    description="Инвалидировать текущие токены.",
)
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    current_user: CurrentUserDep,
    auth_service: AuthServiceDep,
) -> MessageResponse:
    """
    Выполнить выход из системы.
    
    Access token добавляется в blacklist.
    Refresh token удаляется из Redis.
    """
    await auth_service.logout(
        user_id=current_user.id,
        access_token=credentials.credentials,
    )
    
    return MessageResponse(message="Выход выполнен успешно")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Получить текущего пользователя",
    description="Возвращает информацию о текущем аутентифицированном пользователе.",
)
async def get_me(
    current_user: CurrentUserDep,
    auth_service: AuthServiceDep,
) -> UserResponse:
    """
    Получить данные текущего пользователя.
    
    Возвращает полную информацию, включая роли и разрешения.
    """
    user = await auth_service.get_user_by_id(current_user.id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )
    
    from app.schemas.user import RoleResponse
    
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        patronymic=user.patronymic,
        phone=user.phone,
        full_name=user.full_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        theater_id=user.theater_id,
        roles=[
            RoleResponse(
                id=role.id,
                name=role.name,
                code=role.code,
                permissions=role.permissions,
            )
            for role in user.roles
        ],
        permissions=user.permissions,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )
