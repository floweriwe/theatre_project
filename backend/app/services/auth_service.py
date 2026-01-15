"""
Сервис аутентификации.

Содержит бизнес-логику для:
- Регистрации пользователей
- Входа в систему
- Обновления токенов
- Выхода из системы
"""
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import TokenType
from app.core.exceptions import (
    AlreadyExistsError,
    InvalidCredentialsError,
    InvalidTokenError,
    NotFoundError,
    TokenBlacklistedError,
    UserNotActiveError,
)
from app.core.permissions import get_permissions_for_roles
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_user_id_from_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.redis_service import RedisService


class AuthService:
    """
    Сервис аутентификации и авторизации.
    
    Координирует работу репозитория пользователей и Redis
    для управления аутентификацией.
    """
    
    def __init__(
        self,
        session: AsyncSession,
        redis: RedisService,
    ) -> None:
        """
        Инициализировать сервис.
        
        Args:
            session: Сессия БД
            redis: Сервис Redis
        """
        self._user_repo = UserRepository(session)
        self._redis = redis
        self._session = session
    
    async def register(self, data: RegisterRequest) -> User:
        """
        Зарегистрировать нового пользователя.
        
        Args:
            data: Данные для регистрации
            
        Returns:
            Созданный пользователь
            
        Raises:
            AlreadyExistsError: Если email уже занят
        """
        # Проверяем уникальность email
        if await self._user_repo.email_exists(data.email):
            raise AlreadyExistsError("Пользователь", "email", data.email)
        
        # Хэшируем пароль
        hashed_password = hash_password(data.password)
        
        # Создаём пользователя
        user_data = {
            "email": data.email,
            "hashed_password": hashed_password,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "patronymic": data.patronymic,
            "phone": data.phone,
            "is_active": True,
            "is_verified": False,  # Требуется подтверждение email
        }
        
        user = await self._user_repo.create(user_data)
        return user
    
    async def login(self, data: LoginRequest) -> TokenResponse:
        """
        Выполнить вход в систему.
        
        Args:
            data: Учётные данные
            
        Returns:
            Пара токенов (access + refresh)
            
        Raises:
            InvalidCredentialsError: Неверный email или пароль
            UserNotActiveError: Пользователь деактивирован
        """
        # Находим пользователя
        user = await self._user_repo.get_by_email(data.email)
        if not user:
            raise InvalidCredentialsError()
        
        # Проверяем пароль
        if not verify_password(data.password, user.hashed_password):
            raise InvalidCredentialsError()
        
        # Проверяем активность
        if not user.is_active:
            raise UserNotActiveError()
        
        # Генерируем токены
        tokens = await self._generate_tokens(user)
        
        # Обновляем время последнего входа
        await self._user_repo.update(
            user,
            {"last_login_at": datetime.now(timezone.utc)},
        )
        
        return tokens
    
    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        """
        Обновить токены по refresh token.
        
        Args:
            refresh_token: Текущий refresh token
            
        Returns:
            Новая пара токенов
            
        Raises:
            InvalidTokenError: Невалидный refresh token
            TokenBlacklistedError: Токен отозван
            NotFoundError: Пользователь не найден
        """
        # Извлекаем user_id из токена
        user_id = get_user_id_from_token(refresh_token, TokenType.REFRESH)
        
        # Проверяем, что токен совпадает с сохранённым
        stored_token = await self._redis.get_refresh_token(user_id)
        if stored_token != refresh_token:
            raise TokenBlacklistedError()
        
        # Получаем пользователя
        user = await self._user_repo.get_by_id_with_roles(user_id)
        if not user:
            raise NotFoundError("Пользователь", user_id)
        
        if not user.is_active:
            raise UserNotActiveError()
        
        # Генерируем новые токены
        return await self._generate_tokens(user)
    
    async def logout(self, user_id: int, access_token: str) -> None:
        """
        Выполнить выход из системы.
        
        Удаляет refresh token и добавляет access token в blacklist.
        
        Args:
            user_id: ID пользователя
            access_token: Текущий access token
        """
        # Удаляем refresh token
        await self._redis.delete_refresh_token(user_id)
        
        # Добавляем access token в blacklist
        await self._redis.blacklist_token(access_token)
    
    async def get_user_by_id(self, user_id: int) -> User | None:
        """
        Получить пользователя по ID.
        
        Args:
            user_id: ID пользователя
            
        Returns:
            User или None
        """
        return await self._user_repo.get_by_id_with_roles(user_id)
    
    async def _generate_tokens(self, user: User) -> TokenResponse:
        """
        Сгенерировать пару токенов для пользователя.
        
        Args:
            user: Пользователь
            
        Returns:
            TokenResponse с access и refresh токенами
        """
        # Собираем роли и разрешения
        role_codes = user.role_codes
        permissions = list(get_permissions_for_roles(role_codes))
        
        # Для суперпользователя добавляем полные права
        if user.is_superuser:
            permissions = ["admin:full"]
        
        # Создаём access token
        access_token = create_access_token(
            user_id=user.id,
            theater_id=user.theater_id,
            roles=role_codes,
            permissions=permissions,
        )
        
        # Создаём refresh token
        refresh_token = create_refresh_token(user_id=user.id)
        
        # Сохраняем refresh token в Redis
        await self._redis.store_refresh_token(user.id, refresh_token)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )
