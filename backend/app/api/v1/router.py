"""
Главный роутер API v1.

Объединяет все endpoint'ы первой версии API.
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.departments import router as departments_router
from app.api.v1.document_generation import router as generation_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.documents import router as documents_router
from app.api.v1.performances import router as performances_router
from app.api.v1.performance_hub import router as performance_hub_router
from app.api.v1.schedule import router as schedule_router
from app.api.v1.templates import router as templates_router
from app.api.v1.venues import router as venues_router

# Создаём главный роутер API v1
api_router = APIRouter()

# Подключаем роутеры модулей
api_router.include_router(auth_router)
api_router.include_router(analytics_router)
api_router.include_router(departments_router)
api_router.include_router(generation_router)
api_router.include_router(inventory_router)
api_router.include_router(documents_router)
api_router.include_router(performances_router)
api_router.include_router(performance_hub_router)
api_router.include_router(schedule_router)
api_router.include_router(templates_router)
api_router.include_router(venues_router)
