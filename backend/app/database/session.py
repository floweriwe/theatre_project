"""
Управление сессиями базы данных.

Содержит async session factory и функции жизненного цикла.
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

# Глобальный engine (инициализируется в init_db)
_engine: AsyncEngine | None = None
_async_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """
    Получить engine базы данных.
    
    Raises:
        RuntimeError: Если БД не инициализирована
    """
    if _engine is None:
        raise RuntimeError("База данных не инициализирована. Вызовите init_db()")
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """
    Получить фабрику сессий.
    
    Raises:
        RuntimeError: Если БД не инициализирована
    """
    if _async_session_factory is None:
        raise RuntimeError("База данных не инициализирована. Вызовите init_db()")
    return _async_session_factory


async def init_db() -> None:
    """
    Инициализировать подключение к базе данных.
    
    Вызывается при старте приложения (lifespan).
    Создаёт engine и фабрику сессий.
    """
    global _engine, _async_session_factory
    
    _engine = create_async_engine(
        settings.database_url,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args={
            "server_settings": {
                "client_encoding": "utf8"
            }
        }
    )
    
    _async_session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


async def close_db() -> None:
    """
    Закрыть подключение к базе данных.
    
    Вызывается при остановке приложения (lifespan).
    """
    global _engine, _async_session_factory
    
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _async_session_factory = None


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Получить сессию базы данных.
    
    Используется как Dependency в FastAPI:
        async def get_items(session: AsyncSession = Depends(get_session)):
            ...
    
    Сессия автоматически закрывается после выполнения запроса.
    При возникновении исключения происходит rollback.
    
    Yields:
        AsyncSession для работы с БД
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def async_session_factory() -> AsyncSession:
    """
    Создать новую сессию базы данных.
    
    Используется в скриптах:
        async with async_session_factory() as session:
            ...
    
    Returns:
        Контекстный менеджер AsyncSession
    """
    factory = get_session_factory()
    return factory()
