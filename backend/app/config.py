"""
Конфигурация приложения.

Использует Pydantic Settings для загрузки настроек
из переменных окружения с валидацией типов.
"""
from functools import lru_cache
from typing import Literal

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Настройки приложения.
    
    Все значения загружаются из переменных окружения.
    Для локальной разработки используется файл .env.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # -------------------------------------------------------------------------
    # General
    # -------------------------------------------------------------------------
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    APP_NAME: str = "Theatre Management System"
    API_V1_PREFIX: str = "/api/v1"
    
    # -------------------------------------------------------------------------
    # Security
    # -------------------------------------------------------------------------
    SECRET_KEY: str = Field(
        ...,
        description="Секретный ключ для JWT токенов",
        min_length=32,
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # -------------------------------------------------------------------------
    # Database
    # -------------------------------------------------------------------------
    POSTGRES_USER: str = "theatre"
    POSTGRES_PASSWORD: str = "theatre"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "theatre_main"
    
    # Можно задать напрямую, иначе будет собран из компонентов
    DATABASE_URL: str | None = None
    
    @computed_field  # type: ignore[misc]
    @property
    def database_url(self) -> str:
        """Получить URL базы данных."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    # -------------------------------------------------------------------------
    # Redis
    # -------------------------------------------------------------------------
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: str | None = None
    
    @computed_field  # type: ignore[misc]
    @property
    def redis_url(self) -> str:
        """Получить URL Redis."""
        if self.REDIS_URL:
            return self.REDIS_URL
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # -------------------------------------------------------------------------
    # File Storage
    # -------------------------------------------------------------------------
    STORAGE_PATH: str = "/app/storage"
    STORAGE_URL: str = "/static/storage"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50 MB
    
    # -------------------------------------------------------------------------
    # CORS
    # -------------------------------------------------------------------------
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    @computed_field  # type: ignore[misc]
    @property
    def cors_origins_list(self) -> list[str]:
        """Получить список разрешённых origins для CORS."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # -------------------------------------------------------------------------
    # Pagination
    # -------------------------------------------------------------------------
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100


@lru_cache
def get_settings() -> Settings:
    """
    Получить настройки приложения (с кэшированием).
    
    Используется как Dependency в FastAPI:
        settings: Settings = Depends(get_settings)
    """
    return Settings()


# Глобальный экземпляр для удобства импорта
settings = get_settings()
