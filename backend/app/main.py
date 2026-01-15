"""
Точка входа FastAPI приложения.

Инициализирует приложение, подключает роутеры,
настраивает middleware и обработчики событий.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import TheatreException
from app.database.session import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Управление жизненным циклом приложения.
    
    Выполняется при запуске и остановке приложения:
    - Инициализация подключения к БД
    - Инициализация Redis
    - Освобождение ресурсов при остановке
    """
    from app.services.redis_service import redis_service
    
    # Startup
    await init_db()
    await redis_service.connect()
    yield
    # Shutdown
    await redis_service.disconnect()
    await close_db()


def create_application() -> FastAPI:
    """
    Фабрика приложения FastAPI.
    
    Создаёт и настраивает экземпляр приложения.
    Использование фабрики упрощает тестирование.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        description="API для системы управления театром",
        version="0.1.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )
    
    # -------------------------------------------------------------------------
    # Middleware
    # -------------------------------------------------------------------------
    
    # CORS - разрешаем запросы с frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # -------------------------------------------------------------------------
    # Exception Handlers
    # -------------------------------------------------------------------------
    
    @app.exception_handler(TheatreException)
    async def theatre_exception_handler(
        request: Request,
        exc: TheatreException
    ) -> JSONResponse:
        """Обработчик кастомных исключений приложения."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "error_code": exc.error_code,
            },
        )
    
    # -------------------------------------------------------------------------
    # Routers
    # -------------------------------------------------------------------------
    
    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check() -> dict[str, str]:
        """Проверка работоспособности сервиса."""
        return {"status": "healthy"}
    
    # API v1
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    
    return app


# Создаём экземпляр приложения
app = create_application()
