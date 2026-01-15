#!/usr/bin/env python3
"""
🎭 Theatre Management System — Полная диагностика

Запуск из контейнера:
    docker-compose exec backend python -m scripts.diagnostic

Проверяет:
- Подключение к БД
- Наличие данных
- Сериализацию моделей
- API endpoints
- Файлы в storage
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime

# Добавляем путь к приложению
sys.path.insert(0, str(Path(__file__).parent.parent))


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'


class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0
    
    def ok(self, msg: str, detail: str = ""):
        self.passed += 1
        print(f"  {Colors.GREEN}✓{Colors.END} {msg}" + (f" ({detail})" if detail else ""))
    
    def fail(self, msg: str, error: str = ""):
        self.failed += 1
        print(f"  {Colors.RED}✗{Colors.END} {msg}" + (f" - {error}" if error else ""))
    
    def warn(self, msg: str, warning: str = ""):
        self.warnings += 1
        print(f"  {Colors.YELLOW}⚠{Colors.END} {msg}" + (f" - {warning}" if warning else ""))
    
    def header(self, msg: str):
        print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}\n{msg}\n{'='*60}{Colors.END}")


results = TestResults()


async def check_database():
    """Проверка базы данных."""
    results.header("1. БАЗА ДАННЫХ")
    
    from sqlalchemy import select, func, text
    from app.database.session import async_session_maker
    
    try:
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
            results.ok("Подключение к PostgreSQL")
            
            # Импорт моделей
            from app.models.user import User
            from app.models.theater import Theater
            from app.models.inventory import InventoryItem, Category, StorageLocation
            from app.models.document import Document, DocumentCategory
            from app.models.performance import Performance
            from app.models.schedule import ScheduleEvent
            
            # Проверка таблиц
            tables = [
                ("Users", User),
                ("Inventory Items", InventoryItem),
                ("Documents", Document),
                ("Performances", Performance),
                ("Schedule Events", ScheduleEvent),
            ]
            
            for name, model in tables:
                try:
                    count = await session.scalar(select(func.count()).select_from(model))
                    if count > 0:
                        results.ok(f"Таблица {name}", f"{count} записей")
                    else:
                        results.warn(f"Таблица {name}", "пустая")
                except Exception as e:
                    results.fail(f"Таблица {name}", str(e))
                    
    except Exception as e:
        results.fail("Подключение к БД", str(e))


async def check_redis():
    """Проверка Redis."""
    results.header("2. REDIS")
    
    try:
        from app.services.redis_service import redis_service
        
        pong = await redis_service.ping()
        if pong:
            results.ok("Подключение к Redis")
        else:
            results.fail("Redis ping", "нет ответа")
            
    except Exception as e:
        results.fail("Redis", str(e))


async def check_auth():
    """Проверка аутентификации."""
    results.header("3. АУТЕНТИФИКАЦИЯ")
    
    from sqlalchemy import select
    from app.database.session import async_session_maker
    from app.models.user import User
    from app.core.security import verify_password, create_access_token
    
    async with async_session_maker() as session:
        admin = await session.scalar(
            select(User).where(User.email == "admin@theatre.test")
        )
        
        if not admin:
            results.fail("Пользователь admin@theatre.test", "не найден")
            return None
        
        results.ok("Пользователь admin найден", f"ID={admin.id}")
        
        if verify_password("Theatre2024!", admin.hashed_password):
            results.ok("Верификация пароля")
        else:
            results.fail("Верификация пароля")
            return None
        
        try:
            token = create_access_token(data={"sub": str(admin.id)})
            results.ok("Генерация JWT токена")
            return token
        except Exception as e:
            results.fail("Генерация JWT", str(e))
            return None


async def check_serialization():
    """Проверка сериализации моделей."""
    results.header("4. СЕРИАЛИЗАЦИЯ (Pydantic)")
    
    from sqlalchemy import select
    from sqlalchemy.orm import joinedload, selectinload
    from app.database.session import async_session_maker
    from app.models.inventory import InventoryItem
    from app.models.document import Document
    from app.models.performance import Performance
    from app.schemas.inventory import InventoryItemResponse, CategoryResponse, LocationResponse
    from app.schemas.document import DocumentResponse
    from app.schemas.performance import PerformanceResponse
    
    async with async_session_maker() as session:
        # Inventory
        item = await session.scalar(
            select(InventoryItem)
            .options(joinedload(InventoryItem.category), joinedload(InventoryItem.location))
            .limit(1)
        )
        
        if item:
            try:
                cat_resp = CategoryResponse.model_validate(item.category) if item.category else None
                loc_resp = LocationResponse.model_validate(item.location) if item.location else None
                
                response = InventoryItemResponse(
                    id=item.id,
                    name=item.name,
                    inventory_number=item.inventory_number,
                    description=item.description,
                    category_id=item.category_id,
                    location_id=item.location_id,
                    status=item.status,
                    quantity=item.quantity,
                    purchase_price=float(item.purchase_price) if item.purchase_price else None,
                    current_value=float(item.current_value) if item.current_value else None,
                    purchase_date=item.purchase_date,
                    warranty_until=item.warranty_until,
                    custom_fields=item.custom_fields,
                    is_active=item.is_active,
                    theater_id=item.theater_id,
                    images=item.images,
                    created_at=item.created_at,
                    updated_at=item.updated_at,
                    category=cat_resp,
                    location=loc_resp,
                )
                json_data = response.model_dump(mode='json')
                results.ok("InventoryItemResponse", f"{len(json_data)} полей")
            except Exception as e:
                results.fail("InventoryItemResponse", str(e))
        
        # Document
        doc = await session.scalar(
            select(Document)
            .options(joinedload(Document.category), selectinload(Document.tags))
            .limit(1)
        )
        
        if doc:
            try:
                response = DocumentResponse.model_validate(doc)
                json_data = response.model_dump(mode='json')
                results.ok("DocumentResponse", f"{len(json_data)} полей")
            except Exception as e:
                results.fail("DocumentResponse", str(e))
        
        # Performance
        perf = await session.scalar(
            select(Performance)
            .options(selectinload(Performance.sections))
            .limit(1)
        )
        
        if perf:
            try:
                response = PerformanceResponse.model_validate(perf)
                json_data = response.model_dump(mode='json')
                results.ok("PerformanceResponse", f"{len(json_data)} полей")
            except Exception as e:
                results.fail("PerformanceResponse", str(e))


async def check_storage():
    """Проверка файлового хранилища."""
    results.header("5. ФАЙЛОВОЕ ХРАНИЛИЩЕ")
    
    from app.config import settings
    
    storage_path = Path(settings.STORAGE_PATH)
    
    if storage_path.exists():
        results.ok(f"Директория {storage_path}")
    else:
        results.warn(f"Директория {storage_path}", "не существует")
        return
    
    # Поддиректории
    subdirs = ["documents", "posters"]
    for subdir in subdirs:
        path = storage_path / subdir
        if path.exists():
            files = list(path.rglob("*"))
            file_count = len([f for f in files if f.is_file()])
            if file_count > 0:
                results.ok(f"/{subdir}/", f"{file_count} файлов")
            else:
                results.warn(f"/{subdir}/", "пусто")
        else:
            results.warn(f"/{subdir}/", "не существует")


async def check_api_converters():
    """Проверка API converters (критическое!)."""
    results.header("6. API CONVERTERS")
    
    from sqlalchemy import select
    from sqlalchemy.orm import joinedload, selectinload
    from app.database.session import async_session_maker
    from app.models.inventory import InventoryItem
    from app.models.document import Document
    from app.models.performance import Performance
    from app.models.schedule import ScheduleEvent
    
    async with async_session_maker() as session:
        # Inventory converter
        item = await session.scalar(
            select(InventoryItem)
            .options(joinedload(InventoryItem.category), joinedload(InventoryItem.location))
            .limit(1)
        )
        
        if item:
            try:
                # Симуляция того что делает API
                from app.api.v1.inventory import _item_to_response
                response = _item_to_response(item)
                results.ok("_item_to_response", item.name[:30])
            except AttributeError as e:
                results.fail("_item_to_response", f"AttributeError: {e}")
            except Exception as e:
                results.fail("_item_to_response", str(e))
        
        # Document converter
        doc = await session.scalar(
            select(Document)
            .options(joinedload(Document.category), selectinload(Document.tags))
            .limit(1)
        )
        
        if doc:
            try:
                from app.api.v1.documents import _document_to_response
                response = _document_to_response(doc)
                results.ok("_document_to_response", doc.name[:30])
            except AttributeError as e:
                results.fail("_document_to_response", f"AttributeError: {e}")
            except Exception as e:
                results.fail("_document_to_response", str(e))
        
        # Performance converter
        perf = await session.scalar(
            select(Performance)
            .options(selectinload(Performance.sections))
            .limit(1)
        )
        
        if perf:
            try:
                from app.api.v1.performances import _performance_to_response
                response = _performance_to_response(perf)
                results.ok("_performance_to_response", perf.title[:30])
            except AttributeError as e:
                results.fail("_performance_to_response", f"AttributeError: {e}")
            except Exception as e:
                results.fail("_performance_to_response", str(e))
        
        # Schedule converter
        event = await session.scalar(
            select(ScheduleEvent)
            .options(
                joinedload(ScheduleEvent.performance),
                selectinload(ScheduleEvent.participants)
            )
            .limit(1)
        )
        
        if event:
            try:
                from app.api.v1.schedule import _event_to_response
                response = _event_to_response(event)
                results.ok("_event_to_response", event.title[:30])
            except AttributeError as e:
                results.fail("_event_to_response", f"AttributeError: {e}")
            except Exception as e:
                results.fail("_event_to_response", str(e))


async def main():
    print(f"""
{Colors.BOLD}{Colors.CYAN}
╔══════════════════════════════════════════════════════════════╗
║         🎭 THEATRE MANAGEMENT SYSTEM                         ║
║              ПОЛНАЯ ДИАГНОСТИКА                              ║
╚══════════════════════════════════════════════════════════════╝
{Colors.END}
Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
""")
    
    await check_database()
    await check_redis()
    await check_auth()
    await check_serialization()
    await check_storage()
    await check_api_converters()
    
    # Итоги
    print(f"""
{Colors.BOLD}{Colors.CYAN}{'='*60}
ИТОГИ ДИАГНОСТИКИ
{'='*60}{Colors.END}

  Всего тестов: {results.passed + results.failed + results.warnings}
  {Colors.GREEN}✓ Пройдено:{Colors.END} {results.passed}
  {Colors.RED}✗ Ошибок:{Colors.END} {results.failed}
  {Colors.YELLOW}⚠ Предупреждений:{Colors.END} {results.warnings}

  Статус: {"🟢 СИСТЕМА РАБОТАЕТ" if results.failed == 0 else "🔴 ЕСТЬ ПРОБЛЕМЫ"}
""")
    
    return results.failed == 0


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
