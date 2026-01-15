"""
Сервис для работы с Redis.

Предоставляет методы для:
- Хранения refresh токенов
- Blacklist для access токенов
- Кэширования данных
"""
from datetime import timedelta

import redis.asyncio as redis

from app.config import settings
from app.core.constants import RedisPrefix


class RedisService:
    """
    Сервис для работы с Redis.
    
    Инкапсулирует операции с Redis для токенов и кэша.
    """
    
    def __init__(self) -> None:
        """Инициализировать подключение к Redis."""
        self._client: redis.Redis | None = None
    
    async def connect(self) -> None:
        """Установить подключение к Redis."""
        self._client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    
    async def disconnect(self) -> None:
        """Закрыть подключение к Redis."""
        if self._client:
            await self._client.close()
            self._client = None
    
    @property
    def client(self) -> redis.Redis:
        """Получить клиент Redis."""
        if self._client is None:
            raise RuntimeError("Redis не подключён. Вызовите connect()")
        return self._client
    
    # =========================================================================
    # Refresh Tokens
    # =========================================================================
    
    async def store_refresh_token(
        self,
        user_id: int,
        token: str,
        expires_in: timedelta | None = None,
    ) -> None:
        """
        Сохранить refresh token.
        
        Args:
            user_id: ID пользователя
            token: Refresh token
            expires_in: Время жизни (по умолчанию 7 дней)
        """
        if expires_in is None:
            expires_in = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        key = f"{RedisPrefix.REFRESH_TOKEN.value}{user_id}"
        await self.client.setex(key, expires_in, token)
    
    async def get_refresh_token(self, user_id: int) -> str | None:
        """
        Получить сохранённый refresh token.
        
        Args:
            user_id: ID пользователя
            
        Returns:
            Token или None
        """
        key = f"{RedisPrefix.REFRESH_TOKEN.value}{user_id}"
        return await self.client.get(key)
    
    async def delete_refresh_token(self, user_id: int) -> None:
        """
        Удалить refresh token (logout).
        
        Args:
            user_id: ID пользователя
        """
        key = f"{RedisPrefix.REFRESH_TOKEN.value}{user_id}"
        await self.client.delete(key)
    
    # =========================================================================
    # Token Blacklist
    # =========================================================================
    
    async def blacklist_token(
        self,
        token: str,
        expires_in: timedelta | None = None,
    ) -> None:
        """
        Добавить access token в blacklist.
        
        Используется при logout для инвалидации токена.
        
        Args:
            token: Access token
            expires_in: Время хранения (должно быть >= времени жизни токена)
        """
        if expires_in is None:
            # Храним в blacklist немного дольше времени жизни токена
            expires_in = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES + 5)
        
        key = f"{RedisPrefix.TOKEN_BLACKLIST.value}{token}"
        await self.client.setex(key, expires_in, "1")
    
    async def is_token_blacklisted(self, token: str) -> bool:
        """
        Проверить, находится ли token в blacklist.
        
        Args:
            token: Access token для проверки
            
        Returns:
            True если токен в blacklist
        """
        key = f"{RedisPrefix.TOKEN_BLACKLIST.value}{token}"
        return await self.client.exists(key) > 0
    
    # =========================================================================
    # Generic Cache
    # =========================================================================
    
    async def set_cache(
        self,
        key: str,
        value: str,
        expires_in: timedelta | int,
    ) -> None:
        """
        Сохранить значение в кэш.
        
        Args:
            key: Ключ
            value: Значение (строка)
            expires_in: Время жизни
        """
        if isinstance(expires_in, int):
            expires_in = timedelta(seconds=expires_in)
        await self.client.setex(key, expires_in, value)
    
    async def get_cache(self, key: str) -> str | None:
        """
        Получить значение из кэша.
        
        Args:
            key: Ключ
            
        Returns:
            Значение или None
        """
        return await self.client.get(key)
    
    async def delete_cache(self, key: str) -> None:
        """
        Удалить значение из кэша.
        
        Args:
            key: Ключ
        """
        await self.client.delete(key)
    
    async def clear_cache_pattern(self, pattern: str) -> int:
        """
        Удалить все ключи по паттерну.
        
        Args:
            pattern: Паттерн (например: "user_cache:*")
            
        Returns:
            Количество удалённых ключей
        """
        keys = []
        async for key in self.client.scan_iter(pattern):
            keys.append(key)
        
        if keys:
            return await self.client.delete(*keys)
        return 0


# Глобальный экземпляр
redis_service = RedisService()
