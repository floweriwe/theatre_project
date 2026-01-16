"""
Фикстуры для тестов.

Настраивает тестовую БД и клиент для запросов к API.
"""
import asyncio
from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings
from app.database.base import Base
from app.database.session import get_session
from app.main import app
from app.services.redis_service import RedisService


# Используем отдельную тестовую БД
TEST_DATABASE_URL = settings.database_url.replace(
    settings.POSTGRES_DB,
    f"{settings.POSTGRES_DB}_test"
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Создать event loop для сессии тестов."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Создать тестовый engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Получить тестовую сессию БД."""
    async_session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    
    async with async_session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def mock_redis() -> AsyncGenerator[RedisService, None]:
    """Мок Redis сервиса."""
    redis = RedisService()
    await redis.connect()
    yield redis
    # Очищаем тестовые данные
    if redis._client:
        await redis._client.flushdb()
    await redis.disconnect()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession, mock_redis: RedisService) -> AsyncGenerator[AsyncClient, None]:
    """
    Создать тестовый HTTP клиент.
    
    Подменяет зависимости приложения на тестовые.
    """
    from app.api.deps import get_db_session, get_redis
    
    async def override_get_session():
        yield db_session
    
    async def override_get_redis():
        return mock_redis
    
    app.dependency_overrides[get_db_session] = override_get_session
    app.dependency_overrides[get_redis] = override_get_redis
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()


# =============================================================================
# Вспомогательные фикстуры
# =============================================================================

@pytest.fixture
def test_user_data() -> dict[str, Any]:
    """Данные тестового пользователя."""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "first_name": "Тест",
        "last_name": "Тестов",
    }


@pytest.fixture
def another_user_data() -> dict[str, Any]:
    """Данные второго тестового пользователя."""
    return {
        "email": "another@example.com",
        "password": "AnotherPass456!",
        "first_name": "Другой",
        "last_name": "Пользователь",
    }


@pytest_asyncio.fixture
async def authorized_client(
    client: AsyncClient,
    test_user_data: dict[str, Any],
) -> AsyncGenerator[AsyncClient, None]:
    """
    Создать авторизованный HTTP клиент.
    
    Регистрирует пользователя и добавляет токен в заголовки.
    """
    # Регистрируем пользователя
    await client.post("/api/v1/auth/register", json=test_user_data)
    
    # Логинимся
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        }
    )
    
    tokens = login_response.json()
    access_token = tokens.get("access_token")
    
    # Добавляем токен в заголовки
    client.headers["Authorization"] = f"Bearer {access_token}"
    
    yield client
    
    # Очищаем заголовки
    client.headers.pop("Authorization", None)

# =============================================================================
# Additional Test Fixtures
# =============================================================================

@pytest_asyncio.fixture
async def test_db(db_session: AsyncSession) -> AsyncSession:
    """
    Алиас для db_session для совместимости.
    """
    return db_session


@pytest_asyncio.fixture
async def async_client(client: AsyncClient) -> AsyncClient:
    """
    Алиас для client для совместимости.
    """
    return client




@pytest.fixture
def admin_user_data() -> dict[str, Any]:
    """Данные администратора."""
    return {
        "email": "admin@theatre.test",
        "password": "Theatre2024!",
        "first_name": "Админ",
        "last_name": "Театров",
    }


@pytest.fixture
def sample_inventory_item() -> dict[str, Any]:
    """Пример данных для инвентаря."""
    return {
        "name": "Тестовый реквизит",
        "category": "props",
        "status": "in_stock",
        "quantity": 5,
        "location": "Склад №1",
        "description": "Тестовое описание реквизита",
    }


@pytest.fixture
def sample_performance() -> dict[str, Any]:
    """Пример данных для спектакля."""
    return {
        "title": "Тестовый спектакль",
        "description": "Описание тестового спектакля",
        "duration_minutes": 120,
        "genre": "drama",
    }


@pytest.fixture
def make_headers():
    """Фабрика для создания HTTP заголовков с токеном."""
    def _make_headers(token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}
    return _make_headers
