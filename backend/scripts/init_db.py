#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Полная инициализация БД Theatre Management System.

Скрипт выполняет:
1. Применение миграций Alembic
2. Создание театра
3. Создание ролей и пользователей
4. Создание категорий инвентаря и мест хранения
5. Создание инвентаря
6. Создание спектаклей с разделами
7. Создание категорий документов, тегов и документов с реальными PDF
8. Создание расписания с участниками

Запуск:
    python -m scripts.init_db
"""

import asyncio
import os
import sys
import random
from datetime import datetime, date, timedelta, time as dt_time
from pathlib import Path

# Добавляем корень проекта в путь
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, func
from app.config import settings


def get_async_session_maker():
    """Создать фабрику сессий для скрипта."""
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        pool_pre_ping=True,
    )
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


async_session_maker = get_async_session_maker()


# =============================================================================
# Вспомогательные функции
# =============================================================================

def print_header(text: str):
    print()
    print("=" * 70)
    print(f"  {text}")
    print("=" * 70)


def print_step(num: int, text: str):
    print(f"\n  [{num}] {text}")
    print("  " + "-" * 50)


def print_success(text: str):
    print(f"    [OK] {text}")


def print_info(text: str):
    print(f"    [i] {text}")


def print_warning(text: str):
    print(f"    [!] {text}")


def print_error(text: str):
    print(f"    [X] {text}")


def run_migrations():
    """Применить миграции Alembic."""
    import subprocess
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent
    )
    if result.returncode != 0:
        raise RuntimeError(f"Alembic error: {result.stderr}")
    print_success("Миграции применены")


def create_pdf_file(filepath: str, title: str, content: str) -> int:
    """Создать простой PDF файл и вернуть его размер."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import cm
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        
        # Создаем директории
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        # Заголовок
        c.setFont("Helvetica-Bold", 18)
        c.drawString(2*cm, height - 3*cm, title)
        
        # Содержимое
        c.setFont("Helvetica", 12)
        y = height - 5*cm
        for line in content.split('\n'):
            if y < 3*cm:
                c.showPage()
                y = height - 3*cm
                c.setFont("Helvetica", 12)
            c.drawString(2*cm, y, line[:80])  # Ограничиваем длину строки
            y -= 0.6*cm
        
        # Футер
        c.setFont("Helvetica", 10)
        c.drawString(2*cm, 2*cm, f"Theatre Management System - {datetime.now().strftime('%Y-%m-%d')}")
        
        c.save()
        return os.path.getsize(filepath)
    except ImportError:
        # Если reportlab не установлен, создаем заглушку
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'wb') as f:
            # Минимальный валидный PDF
            pdf_content = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer << /Size 4 /Root 1 0 R >>
startxref
196
%%EOF"""
            f.write(pdf_content)
        return len(pdf_content)


# =============================================================================
# Шаг 1: Создание театра
# =============================================================================

async def create_theater(session: AsyncSession) -> int:
    """Создать театр."""
    from app.models.theater import Theater
    
    existing = await session.execute(select(Theater).limit(1))
    theater = existing.scalar()
    
    if theater:
        print_info(f"Театр уже существует: {theater.name}")
        return theater.id
    
    theater = Theater(
        name="Московский Драматический Театр",
        code="mdt",
        database_name="theatre_mdt",
        description="Ведущий драматический театр города с богатой историей",
        address="г. Москва, ул. Театральная, д. 1",
        phone="+7 (495) 123-45-67",
        email="info@theatre.test",
        website="https://theatre.test",
        is_active=True,
    )
    session.add(theater)
    await session.commit()
    await session.refresh(theater)
    print_success(f"Театр создан: {theater.name}")
    return theater.id


# =============================================================================
# Шаг 2: Создание ролей и пользователей
# =============================================================================

async def create_roles_and_users(session: AsyncSession, theater_id: int) -> list:
    """Создать пользователей и связать с существующими ролями."""
    from app.models.user import User, Role, UserRole
    from app.core.security import get_password_hash
    
    # Проверяем существующих пользователей
    existing = await session.execute(
        select(User).where(User.theater_id == theater_id).limit(1)
    )
    if existing.scalar():
        print_info("Пользователи уже существуют")
        users = (await session.execute(
            select(User).where(User.theater_id == theater_id)
        )).scalars().all()
        return list(users)
    
    # Получаем существующие роли (созданные миграцией)
    existing_roles = (await session.execute(select(Role))).scalars().all()
    roles = {role.code: role for role in existing_roles}
    
    print_success(f"Найдено ролей: {len(roles)}")
    
    # Создаем пользователей
    # Используем роли из миграции: admin, sysadmin, director, tech_director, 
    # producer, department_head, accountant, performer, viewer
    password_hash = get_password_hash("Theatre2024!")
    
    users_data = [
        {
            "email": "admin@theatre.test",
            "first_name": "Администратор",
            "last_name": "Системы",
            "role_code": "admin",
            "is_superuser": True,
        },
        {
            "email": "director@theatre.test",
            "first_name": "Иван",
            "last_name": "Петров",
            "patronymic": "Сергеевич",
            "role_code": "director",  # Руководитель
        },
        {
            "email": "tech@theatre.test",
            "first_name": "Сергей",
            "last_name": "Техников",
            "role_code": "tech_director",  # Технический директор
        },
        {
            "email": "producer@theatre.test",
            "first_name": "Мария",
            "last_name": "Иванова",
            "patronymic": "Александровна",
            "role_code": "producer",  # Продюсер
        },
        {
            "email": "actor1@theatre.test",
            "first_name": "Анна",
            "last_name": "Актрисова",
            "patronymic": "Владимировна",
            "role_code": "performer",  # Артист
        },
        {
            "email": "actor2@theatre.test",
            "first_name": "Пётр",
            "last_name": "Актёров",
            "role_code": "performer",  # Артист
        },
        {
            "email": "accountant@theatre.test",
            "first_name": "Елена",
            "last_name": "Бухгалтерова",
            "role_code": "accountant",  # Бухгалтер
        },
        {
            "email": "viewer@theatre.test",
            "first_name": "Гость",
            "last_name": "Наблюдателев",
            "role_code": "viewer",  # Наблюдатель
        },
    ]
    
    created_users = []
    for user_data in users_data:
        role_code = user_data.pop("role_code")
        is_superuser = user_data.pop("is_superuser", False)
        user = User(
            **user_data,
            hashed_password=password_hash,
            theater_id=theater_id,
            is_active=True,
            is_verified=True,
            is_superuser=is_superuser,
        )
        session.add(user)
        await session.flush()
        
        # Связываем с ролью
        if role_code in roles:
            user_role = UserRole(
                user_id=user.id,
                role_id=roles[role_code].id,
            )
            session.add(user_role)
        else:
            print_warning(f"Роль '{role_code}' не найдена для пользователя {user.email}")
        
        created_users.append(user)
    
    await session.commit()
    print_success(f"Пользователей: {len(created_users)}")
    return created_users


# =============================================================================
# Шаг 3: Создание категорий и мест хранения
# =============================================================================

async def create_categories_and_locations(session: AsyncSession, theater_id: int) -> tuple:
    """Создать категории инвентаря и места хранения."""
    from app.models.inventory import InventoryCategory, StorageLocation
    
    existing = await session.execute(
        select(InventoryCategory).where(InventoryCategory.theater_id == theater_id).limit(1)
    )
    if existing.scalar():
        print_info("Категории уже существуют")
        categories = (await session.execute(
            select(InventoryCategory).where(InventoryCategory.theater_id == theater_id)
        )).scalars().all()
        locations = (await session.execute(
            select(StorageLocation).where(StorageLocation.theater_id == theater_id)
        )).scalars().all()
        return list(categories), list(locations)
    
    categories_data = [
        {"name": "Костюмы", "code": "costumes", "color": "#8B5CF6", "icon": "shirt"},
        {"name": "Реквизит", "code": "props", "color": "#3B82F6", "icon": "box"},
        {"name": "Декорации", "code": "scenery", "color": "#10B981", "icon": "layout"},
        {"name": "Мебель", "code": "furniture", "color": "#F59E0B", "icon": "armchair"},
        {"name": "Освещение", "code": "lighting", "color": "#EF4444", "icon": "lightbulb"},
        {"name": "Звуковое оборудование", "code": "sound", "color": "#EC4899", "icon": "speaker"},
        {"name": "Грим и парики", "code": "makeup", "color": "#14B8A6", "icon": "palette"},
        {"name": "Обувь", "code": "footwear", "color": "#6366F1", "icon": "footprints"},
        {"name": "Аксессуары", "code": "accessories", "color": "#84CC16", "icon": "gem"},
        {"name": "Бутафория", "code": "weapons", "color": "#F97316", "icon": "sword"},
        {"name": "Текстиль", "code": "textiles", "color": "#06B6D4", "icon": "shirt"},
        {"name": "Технические средства", "code": "tech", "color": "#A855F7", "icon": "settings"},
    ]
    
    locations_data = [
        {"name": "Основной склад", "code": "main", "address": "Подвал, комната С-01"},
        {"name": "Костюмерная", "code": "costumes", "address": "1 этаж, комната К-101"},
        {"name": "Реквизиторская", "code": "props", "address": "1 этаж, комната Р-102"},
        {"name": "Декорационный цех", "code": "scenery", "address": "Производственный корпус, Д-01"},
        {"name": "Гримёрный цех", "code": "makeup", "address": "2 этаж, комната Г-201"},
        {"name": "Световой цех", "code": "lighting", "address": "Чердак, комната О-01"},
        {"name": "Звуковой цех", "code": "sound", "address": "2 этаж, комната З-202"},
        {"name": "Большая сцена", "code": "main_stage", "address": "1 этаж, Большая сцена"},
        {"name": "Малая сцена", "code": "small_stage", "address": "3 этаж, Малая сцена"},
        {"name": "Репетиционный зал 1", "code": "rehearsal1", "address": "2 этаж, РЗ-1"},
        {"name": "Репетиционный зал 2", "code": "rehearsal2", "address": "2 этаж, РЗ-2"},
        {"name": "Мастерская", "code": "workshop", "address": "Производственный корпус, М-01"},
    ]
    
    categories = []
    for i, cat_data in enumerate(categories_data):
        cat = InventoryCategory(
            **cat_data,
            theater_id=theater_id,
            sort_order=i,
            is_active=True,
        )
        session.add(cat)
        categories.append(cat)
    
    locations = []
    for i, loc_data in enumerate(locations_data):
        loc = StorageLocation(
            **loc_data,
            theater_id=theater_id,
            sort_order=i,
            is_active=True,
        )
        session.add(loc)
        locations.append(loc)
    
    await session.commit()
    print_success(f"Категорий: {len(categories)}, Мест хранения: {len(locations)}")
    return categories, locations


# =============================================================================
# Шаг 4: Создание инвентаря
# =============================================================================

async def create_inventory(session: AsyncSession, theater_id: int, categories: list, locations: list) -> list:
    """Создать предметы инвентаря."""
    from app.models.inventory import InventoryItem, ItemStatus
    
    existing = await session.execute(
        select(InventoryItem).where(InventoryItem.theater_id == theater_id).limit(1)
    )
    if existing.scalar():
        print_info("Инвентарь уже существует")
        items = (await session.execute(
            select(InventoryItem).where(InventoryItem.theater_id == theater_id)
        )).scalars().all()
        return list(items)
    
    cat_map = {c.code: c for c in categories}
    
    items_data = [
        {"name": "Костюм Гамлета (чёрный камзол)", "category": "costumes", "status": ItemStatus.IN_STOCK, "quantity": 1, "price": 45000},
        {"name": "Платье Офелии (белое)", "category": "costumes", "status": ItemStatus.IN_STOCK, "quantity": 1, "price": 38000},
        {"name": "Костюм короля Клавдия", "category": "costumes", "status": ItemStatus.RESERVED, "quantity": 1, "price": 52000},
        {"name": "Костюм Раневской", "category": "costumes", "status": ItemStatus.IN_USE, "quantity": 1, "price": 35000},
        {"name": "Фрак мужской (чёрный)", "category": "costumes", "status": ItemStatus.IN_STOCK, "quantity": 3, "price": 28000},
        {"name": "Корона короля (бутафория)", "category": "accessories", "status": ItemStatus.RESERVED, "quantity": 1, "price": 15000},
        {"name": "Меч бутафорский", "category": "weapons", "status": ItemStatus.IN_USE, "quantity": 3, "price": 8000},
        {"name": "Кинжал бутафорский", "category": "weapons", "status": ItemStatus.IN_STOCK, "quantity": 5, "price": 3500},
        {"name": "Трон деревянный резной", "category": "furniture", "status": ItemStatus.IN_STOCK, "quantity": 1, "price": 120000},
        {"name": "Стол обеденный (антиквариат)", "category": "furniture", "status": ItemStatus.IN_STOCK, "quantity": 2, "price": 85000},
        {"name": "Стулья венские", "category": "furniture", "status": ItemStatus.IN_STOCK, "quantity": 8, "price": 12000},
        {"name": "Кресло режиссёрское", "category": "furniture", "status": ItemStatus.IN_USE, "quantity": 2, "price": 25000},
        {"name": "Диван викторианский", "category": "furniture", "status": ItemStatus.IN_STOCK, "quantity": 1, "price": 95000},
        {"name": "Занавес бархатный (красный)", "category": "textiles", "status": ItemStatus.IN_USE, "quantity": 1, "price": 250000},
        {"name": "Ковёр персидский (реплика)", "category": "textiles", "status": ItemStatus.IN_STOCK, "quantity": 2, "price": 45000},
        {"name": "Прожектор PAR64", "category": "lighting", "status": ItemStatus.IN_STOCK, "quantity": 12, "price": 18000},
        {"name": "Прожектор профильный", "category": "lighting", "status": ItemStatus.IN_USE, "quantity": 8, "price": 35000},
        {"name": "Светодиодная панель RGB", "category": "lighting", "status": ItemStatus.IN_STOCK, "quantity": 6, "price": 28000},
        {"name": "Микрофон беспроводной Shure", "category": "sound", "status": ItemStatus.IN_STOCK, "quantity": 6, "price": 42000},
        {"name": "Акустическая система JBL", "category": "sound", "status": ItemStatus.IN_USE, "quantity": 4, "price": 85000},
        {"name": "Микшерный пульт Yamaha", "category": "sound", "status": ItemStatus.IN_STOCK, "quantity": 1, "price": 180000},
        {"name": "Парик женский (блонд)", "category": "makeup", "status": ItemStatus.IN_STOCK, "quantity": 5, "price": 8500},
        {"name": "Парик мужской (седой)", "category": "makeup", "status": ItemStatus.IN_STOCK, "quantity": 3, "price": 7500},
        {"name": "Набор театрального грима", "category": "makeup", "status": ItemStatus.IN_STOCK, "quantity": 10, "price": 12000},
        {"name": "Декорация Лес (задник)", "category": "scenery", "status": ItemStatus.IN_STOCK, "quantity": 1, "price": 180000},
        {"name": "Декорация Комната (модульная)", "category": "scenery", "status": ItemStatus.IN_USE, "quantity": 1, "price": 250000},
        {"name": "Декорация Сад (вишнёвый)", "category": "scenery", "status": ItemStatus.IN_STOCK, "quantity": 1, "price": 320000},
        {"name": "Книга бутафорская (большая)", "category": "props", "status": ItemStatus.IN_STOCK, "quantity": 20, "price": 1500},
        {"name": "Чемодан винтажный", "category": "props", "status": ItemStatus.RESERVED, "quantity": 2, "price": 8000},
        {"name": "Телефон дисковый (ретро)", "category": "props", "status": ItemStatus.IN_STOCK, "quantity": 3, "price": 5500},
        {"name": "Граммофон (бутафория)", "category": "props", "status": ItemStatus.IN_STOCK, "quantity": 1, "price": 25000},
        {"name": "Канделябр на 5 свечей", "category": "props", "status": ItemStatus.IN_STOCK, "quantity": 4, "price": 12000},
    ]
    
    created = []
    for i, item_data in enumerate(items_data):
        category = cat_map.get(item_data["category"], categories[0])
        location = random.choice(locations)
        
        item = InventoryItem(
            name=item_data["name"],
            inventory_number=f"INV-2025-{i+1:04d}",
            description=f"Инвентарный предмет: {item_data['name']}",
            category_id=category.id,
            location_id=location.id,
            status=item_data["status"],
            quantity=item_data["quantity"],
            purchase_price=item_data["price"],
            current_value=int(item_data["price"] * random.uniform(0.7, 1.0)),
            purchase_date=datetime.now() - timedelta(days=random.randint(30, 730)),
            is_active=True,
            theater_id=theater_id,
        )
        session.add(item)
        created.append(item)
    
    await session.commit()
    print_success(f"Предметов инвентаря: {len(created)}")
    return created


# =============================================================================
# Шаг 5: Создание спектаклей
# =============================================================================

async def create_performances(session: AsyncSession, theater_id: int) -> list:
    """Создать спектакли."""
    from app.models.performance import Performance, PerformanceSection, PerformanceStatus, SectionType
    
    existing = await session.execute(
        select(Performance).where(Performance.theater_id == theater_id).limit(1)
    )
    if existing.scalar():
        print_info("Спектакли уже существуют")
        performances = (await session.execute(
            select(Performance).where(Performance.theater_id == theater_id)
        )).scalars().all()
        return list(performances)
    
    performances_data = [
        {
            "title": "Вишнёвый сад",
            "subtitle": "Комедия в четырёх действиях",
            "author": "А.П. Чехов",
            "director": "Иван Петров",
            "genre": "Драма",
            "age_rating": "12+",
            "duration_minutes": 150,
            "intermissions": 1,
            "premiere_date": date(2024, 9, 15),
            "status": PerformanceStatus.IN_REPERTOIRE,
        },
        {
            "title": "Мастер и Маргарита",
            "subtitle": "По роману М.А. Булгакова",
            "author": "М.А. Булгаков",
            "director": "Сергей Сидоров",
            "genre": "Мистерия",
            "age_rating": "16+",
            "duration_minutes": 180,
            "intermissions": 2,
            "premiere_date": date(2023, 2, 14),
            "status": PerformanceStatus.IN_REPERTOIRE,
        },
        {
            "title": "Ромео и Джульетта",
            "author": "У. Шекспир",
            "director": "Анна Козлова",
            "composer": "С.С. Прокофьев",
            "genre": "Трагедия",
            "age_rating": "12+",
            "duration_minutes": 140,
            "intermissions": 1,
            "premiere_date": date(2024, 2, 14),
            "status": PerformanceStatus.IN_REPERTOIRE,
        },
        {
            "title": "Три сестры",
            "author": "А.П. Чехов",
            "director": "Михаил Новиков",
            "genre": "Драма",
            "age_rating": "12+",
            "duration_minutes": 165,
            "intermissions": 1,
            "premiere_date": date(2024, 5, 1),
            "status": PerformanceStatus.IN_REPERTOIRE,
        },
        {
            "title": "Гамлет",
            "author": "У. Шекспир",
            "director": "Иван Петров",
            "genre": "Трагедия",
            "age_rating": "16+",
            "duration_minutes": 200,
            "intermissions": 2,
            "premiere_date": date(2023, 10, 31),
            "status": PerformanceStatus.IN_REPERTOIRE,
        },
        {
            "title": "Ревизор",
            "author": "Н.В. Гоголь",
            "director": "Сергей Сидоров",
            "genre": "Комедия",
            "age_rating": "12+",
            "duration_minutes": 130,
            "intermissions": 1,
            "premiere_date": date(2024, 4, 1),
            "status": PerformanceStatus.IN_REPERTOIRE,
        },
        {
            "title": "Чайка",
            "author": "А.П. Чехов",
            "director": "Анна Козлова",
            "genre": "Комедия",
            "age_rating": "12+",
            "duration_minutes": 145,
            "intermissions": 1,
            "status": PerformanceStatus.PREPARATION,
        },
        {
            "title": "Горе от ума",
            "author": "А.С. Грибоедов",
            "director": "Михаил Новиков",
            "genre": "Комедия",
            "age_rating": "12+",
            "duration_minutes": 155,
            "intermissions": 1,
            "status": PerformanceStatus.PREPARATION,
        },
        {
            "title": "Дядя Ваня",
            "author": "А.П. Чехов",
            "director": "Иван Петров",
            "genre": "Драма",
            "age_rating": "12+",
            "duration_minutes": 140,
            "intermissions": 1,
            "status": PerformanceStatus.PREPARATION,
        },
        {
            "title": "Евгений Онегин",
            "author": "А.С. Пушкин",
            "director": "Сергей Сидоров",
            "genre": "Драма",
            "age_rating": "12+",
            "duration_minutes": 170,
            "intermissions": 2,
            "status": PerformanceStatus.PAUSED,
        },
        {
            "title": "На дне",
            "author": "М. Горький",
            "director": "Анна Козлова",
            "genre": "Драма",
            "age_rating": "16+",
            "duration_minutes": 160,
            "intermissions": 1,
            "status": PerformanceStatus.PAUSED,
        },
        {
            "title": "Женитьба",
            "author": "Н.В. Гоголь",
            "director": "Михаил Новиков",
            "genre": "Комедия",
            "age_rating": "12+",
            "duration_minutes": 120,
            "intermissions": 1,
            "status": PerformanceStatus.ARCHIVED,
        },
    ]
    
    created = []
    for perf_data in performances_data:
        perf = Performance(
            **perf_data,
            description=f"Спектакль '{perf_data['title']}' по произведению {perf_data['author']}",
            theater_id=theater_id,
            is_active=True,
        )
        session.add(perf)
        await session.flush()
        
        # Добавляем разделы паспорта
        sections = [
            (SectionType.LIGHTING, "Световое оформление", "Описание светового оформления спектакля"),
            (SectionType.SOUND, "Звуковое оформление", "Описание звукового оформления"),
            (SectionType.SCENERY, "Декорации", "Описание декораций и оформления сцены"),
            (SectionType.PROPS, "Реквизит", "Список реквизита"),
            (SectionType.COSTUMES, "Костюмы", "Описание костюмов"),
        ]
        
        for i, (section_type, title, content) in enumerate(sections):
            section = PerformanceSection(
                performance_id=perf.id,
                section_type=section_type,
                title=title,
                content=content,
                sort_order=i,
            )
            session.add(section)
        
        created.append(perf)
    
    await session.commit()
    print_success(f"Спектаклей: {len(created)}")
    return created


# =============================================================================
# Шаг 6: Создание документов с реальными PDF
# =============================================================================

async def create_documents(session: AsyncSession, theater_id: int, performances: list) -> list:
    """Создать документы с реальными PDF файлами."""
    from app.models.document import Document, DocumentCategory, Tag, DocumentStatus, FileType
    
    if not performances:
        print_warning("Пропущено: нет спектаклей")
        return []
    
    existing = await session.execute(
        select(Document).where(Document.theater_id == theater_id).limit(1)
    )
    if existing.scalar():
        print_info("Документы уже существуют")
        return []
    
    # Путь для хранения документов
    docs_base_path = "/app/storage/documents"
    os.makedirs(docs_base_path, exist_ok=True)
    
    # Создаём категории документов
    doc_categories = [
        {"name": "Приказы", "code": "orders", "color": "#EF4444"},
        {"name": "Договоры", "code": "contracts", "color": "#3B82F6"},
        {"name": "Финансовые документы", "code": "finance", "color": "#10B981"},
        {"name": "Кадровые документы", "code": "hr", "color": "#F59E0B"},
        {"name": "Технические документы", "code": "tech", "color": "#8B5CF6"},
        {"name": "Творческие материалы", "code": "creative", "color": "#EC4899"},
        {"name": "Афиши и программки", "code": "promo", "color": "#14B8A6"},
        {"name": "Прочее", "code": "other", "color": "#6B7280"},
    ]
    
    categories = {}
    for i, cat_data in enumerate(doc_categories):
        cat = DocumentCategory(**cat_data, theater_id=theater_id, is_active=True, sort_order=i)
        session.add(cat)
        await session.flush()
        categories[cat.code] = cat
    
    # Создаём теги
    tags_data = ["Срочно", "Важно", "Архив", "2024", "2025", "Премьера", "Гастроли"]
    for tag_name in tags_data:
        tag = Tag(name=tag_name, theater_id=theater_id)
        session.add(tag)
    
    await session.flush()
    
    created = []
    
    # Общие документы театра
    general_docs = [
        {"name": "Устав театра", "category": "other", "content": "Устав\n\nОсновные положения работы театра.\n\n1. Общие положения\n2. Цели и задачи\n3. Управление театром\n4. Имущество\n5. Заключительные положения"},
        {"name": "Штатное расписание 2025", "category": "hr", "content": "Штатное расписание на 2025 год\n\nАдминистрация: 5 человек\nТворческий состав: 25 человек\nТехнический персонал: 15 человек\nОбслуживающий персонал: 10 человек\n\nВсего: 55 штатных единиц"},
        {"name": "Бюджет на 2025 год", "category": "finance", "content": "Бюджет театра на 2025 год\n\nДоходы: 45 000 000 руб.\nРасходы: 42 000 000 руб.\n\nОсновные статьи:\n- Зарплата: 28 000 000\n- Аренда: 5 000 000\n- Постановки: 6 000 000\n- Прочее: 3 000 000"},
        {"name": "Правила внутреннего распорядка", "category": "hr", "content": "Правила внутреннего распорядка\n\n1. Рабочее время: 10:00 - 22:00\n2. Обед: 14:00 - 15:00\n3. Дресс-код: деловой стиль\n4. Курение запрещено\n5. Использование мобильных телефонов ограничено"},
        {"name": "Коллективный договор 2024-2026", "category": "contracts", "content": "Коллективный договор\n\nСтороны: Администрация и Профсоюз работников\n\nОсновные положения:\n- Оплата труда\n- Рабочее время\n- Отпуска\n- Социальные гарантии\n- Охрана труда"},
    ]
    
    for doc_data in general_docs:
        cat = categories[doc_data["category"]]
        file_name = f"{doc_data['name'].lower().replace(' ', '_')}.pdf"
        file_path = f"{docs_base_path}/{doc_data['category']}/{file_name}"
        
        # Создаём реальный PDF файл
        file_size = create_pdf_file(file_path, doc_data["name"], doc_data["content"])
        
        doc = Document(
            name=doc_data["name"],
            file_name=file_name,
            description=f"Документ: {doc_data['name']}",
            category_id=cat.id,
            file_path=file_path,
            file_size=file_size,
            file_type=FileType.PDF,
            mime_type="application/pdf",
            status=DocumentStatus.ACTIVE,
            current_version=1,
            theater_id=theater_id,
            is_active=True,
        )
        session.add(doc)
        created.append(doc)
    
    # Технические документы для спектаклей
    for perf in performances[:8]:
        for doc_type, doc_name_prefix in [("lighting", "Световой райдер"), ("sound", "Звуковой райдер")]:
            file_name = f"{doc_type}_rider_{perf.id}.pdf"
            file_path = f"{docs_base_path}/tech/{file_name}"
            
            content = f"{doc_name_prefix}\n\nСпектакль: {perf.title}\nАвтор: {perf.author}\nРежиссёр: {perf.director}\n\nТехнические требования:\n- Количество приборов: {random.randint(10, 50)}\n- Мощность: {random.randint(5, 20)} кВт\n- Особые требования: см. приложение"
            file_size = create_pdf_file(file_path, f"{doc_name_prefix} - {perf.title}", content)
            
            doc = Document(
                name=f"{doc_name_prefix} - {perf.title}",
                file_name=file_name,
                description=f"Технический райдер ({doc_type}) для спектакля {perf.title}",
                category_id=categories["tech"].id,
                performance_id=perf.id,
                file_path=file_path,
                file_size=file_size,
                file_type=FileType.PDF,
                mime_type="application/pdf",
                status=DocumentStatus.ACTIVE,
                current_version=1,
                theater_id=theater_id,
                is_active=True,
            )
            session.add(doc)
            created.append(doc)
    
    # Программки спектаклей
    for perf in performances[:8]:
        file_name = f"program_{perf.id}.pdf"
        file_path = f"{docs_base_path}/promo/{file_name}"
        
        content = f"ПРОГРАММКА\n\n{perf.title}\n{perf.subtitle or ''}\n\nАвтор: {perf.author}\nРежиссёр: {perf.director}\n\nПродолжительность: {perf.duration_minutes} мин.\nВозрастное ограничение: {perf.age_rating}\n\nДействующие лица и исполнители:\n..."
        file_size = create_pdf_file(file_path, f"Программка - {perf.title}", content)
        
        doc = Document(
            name=f"Программка - {perf.title}",
            file_name=file_name,
            description=f"Программка спектакля {perf.title}",
            category_id=categories["promo"].id,
            performance_id=perf.id,
            file_path=file_path,
            file_size=file_size,
            file_type=FileType.PDF,
            mime_type="application/pdf",
            status=DocumentStatus.ACTIVE,
            current_version=1,
            theater_id=theater_id,
            is_public=True,
            is_active=True,
        )
        session.add(doc)
        created.append(doc)
    
    await session.commit()
    print_success(f"Документов: {len(created)} (с реальными PDF файлами)")
    return created


# =============================================================================
# Шаг 7: Создание расписания
# =============================================================================

async def create_schedule(session: AsyncSession, theater_id: int, performances: list, users: list) -> list:
    """Создать события расписания."""
    from app.models.schedule import ScheduleEvent, EventParticipant, EventType, EventStatus, ParticipantRole, ParticipantStatus
    from app.models.venue import Venue

    if not performances or not users:
        print_warning("Пропущено: нет спектаклей или пользователей")
        return []

    existing = await session.execute(
        select(ScheduleEvent).where(ScheduleEvent.theater_id == theater_id).limit(1)
    )
    if existing.scalar():
        print_info("События расписания уже существуют")
        return []

    # Получаем площадки из БД
    venues_result = await session.execute(select(Venue))
    venue_list = venues_result.scalars().all()
    venue_map = {v.name: v.id for v in venue_list}

    # Fallback названия для сопоставления
    venue_names = ["Основная сцена", "Репетиционный зал"]

    created = []
    colors = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"]
    
    # Фильтруем спектакли в репертуаре
    active_performances = [p for p in performances if p.status.value == "in_repertoire"][:6]
    
    start_date = date.today()
    
    for day_offset in range(60):
        current_date = start_date + timedelta(days=day_offset)
        
        # Понедельник — выходной
        if current_date.weekday() == 0:
            continue
        
        perf = random.choice(active_performances) if active_performances else random.choice(performances[:6])
        
        # Выходные — спектакли, будни — репетиции
        if current_date.weekday() in [5, 6]:
            event_type = EventType.PERFORMANCE
            start_time = dt_time(18, 0) if current_date.weekday() == 6 else dt_time(19, 0)
            end_time = dt_time(21, 30) if current_date.weekday() == 6 else dt_time(22, 0)
            title = perf.title
            venue_name = "Основная сцена"
            is_public = True
        else:
            event_type = random.choice([EventType.REHEARSAL, EventType.TECH_REHEARSAL])
            hour = random.choice([10, 14])
            start_time = dt_time(hour, 0)
            end_time = dt_time(hour + 3, 0)
            title = f"Репетиция: {perf.title}"
            venue_name = random.choice(venue_names)
            is_public = False

        # Получаем venue_id или None
        venue_id = venue_map.get(venue_name)

        event = ScheduleEvent(
            title=title,
            description=f"{'Показ' if event_type == EventType.PERFORMANCE else 'Репетиция'} спектакля {perf.title}",
            event_type=event_type,
            status=EventStatus.PLANNED if current_date > date.today() else EventStatus.COMPLETED,
            event_date=current_date,
            start_time=start_time,
            end_time=end_time,
            venue_id=venue_id,
            performance_id=perf.id,
            theater_id=theater_id,
            is_public=is_public,
            color=random.choice(colors),
        )
        session.add(event)
        await session.flush()
        
        # Добавляем участников
        if len(users) > 1:
            participants = random.sample(users[1:], min(3, len(users)-1))
            for user in participants:
                participant = EventParticipant(
                    event_id=event.id,
                    user_id=user.id,
                    role=ParticipantRole.PERFORMER,
                    status=ParticipantStatus.CONFIRMED,
                )
                session.add(participant)
        
        created.append(event)
    
    await session.commit()
    print_success(f"Событий расписания: {len(created)}")
    return created


# =============================================================================
# Сбор статистики
# =============================================================================

async def collect_stats(session: AsyncSession, theater_id: int) -> dict:
    """Собрать статистику."""
    from app.models.inventory import InventoryItem, InventoryCategory, StorageLocation
    from app.models.performance import Performance
    from app.models.document import Document
    from app.models.schedule import ScheduleEvent
    from app.models.user import User, Role
    
    stats = {}
    
    result = await session.execute(
        select(func.count(User.id)).where(User.theater_id == theater_id)
    )
    stats["users"] = result.scalar() or 0
    
    result = await session.execute(
        select(func.count(Role.id))
    )
    stats["roles"] = result.scalar() or 0
    
    result = await session.execute(
        select(func.count(InventoryCategory.id)).where(InventoryCategory.theater_id == theater_id)
    )
    stats["categories"] = result.scalar() or 0
    
    result = await session.execute(
        select(func.count(StorageLocation.id)).where(StorageLocation.theater_id == theater_id)
    )
    stats["locations"] = result.scalar() or 0
    
    result = await session.execute(
        select(func.count(InventoryItem.id)).where(InventoryItem.theater_id == theater_id)
    )
    stats["items"] = result.scalar() or 0
    
    result = await session.execute(
        select(func.count(Performance.id)).where(Performance.theater_id == theater_id)
    )
    stats["performances"] = result.scalar() or 0
    
    result = await session.execute(
        select(func.count(Document.id)).where(Document.theater_id == theater_id)
    )
    stats["documents"] = result.scalar() or 0
    
    result = await session.execute(
        select(func.count(ScheduleEvent.id)).where(ScheduleEvent.theater_id == theater_id)
    )
    stats["events"] = result.scalar() or 0
    
    result = await session.execute(
        select(func.sum(InventoryItem.current_value)).where(InventoryItem.theater_id == theater_id)
    )
    stats["inventory_value"] = result.scalar() or 0
    
    return stats


# =============================================================================
# Главная функция
# =============================================================================

async def main():
    """Главная функция инициализации."""
    print_header("ИНИЦИАЛИЗАЦИЯ БД THEATRE MANAGEMENT SYSTEM")
    
    start_time = datetime.now()
    errors = []
    stats = {}
    
    # Шаг 1: Миграции
    print_step(1, "Применение миграций")
    try:
        run_migrations()
    except Exception as e:
        print_error(f"Миграции: {e}")
        errors.append("Миграции")
    
    async with async_session_maker() as session:
        try:
            # Шаг 2: Театр
            print_step(2, "Создание театра")
            theater_id = await create_theater(session)
            
            # Шаг 3: Роли и пользователи
            print_step(3, "Создание ролей и пользователей")
            users = await create_roles_and_users(session, theater_id)
            
            # Шаг 4: Категории и места хранения
            print_step(4, "Создание категорий и мест хранения")
            categories, locations = await create_categories_and_locations(session, theater_id)
            
            # Шаг 5: Инвентарь
            print_step(5, "Создание инвентаря")
            inventory = await create_inventory(session, theater_id, categories, locations)
            
            # Шаг 6: Спектакли
            print_step(6, "Создание спектаклей")
            performances = await create_performances(session, theater_id)
            
            # Шаг 7: Документы с реальными PDF
            print_step(7, "Создание документов (с PDF файлами)")
            try:
                documents = await create_documents(session, theater_id, performances)
            except Exception as e:
                print_error(f"Документы: {e}")
                import traceback
                traceback.print_exc()
                errors.append("Документы")
            
            # Шаг 8: Расписание
            print_step(8, "Создание расписания")
            try:
                events = await create_schedule(session, theater_id, performances, users)
            except Exception as e:
                print_error(f"Расписание: {e}")
                import traceback
                traceback.print_exc()
                errors.append("Расписание")
            
            # Шаг 9: Статистика
            print_step(9, "Сбор статистики")
            stats = await collect_stats(session, theater_id)
            
        except Exception as e:
            print_error(f"Критическая ошибка: {e}")
            import traceback
            traceback.print_exc()
            return
    
    # Результат
    elapsed = (datetime.now() - start_time).total_seconds()
    
    print_header("РЕЗУЛЬТАТ ИНИЦИАЛИЗАЦИИ")
    
    if errors:
        print(f"  [!] Завершено с ошибками: {', '.join(errors)}")
    else:
        print("  [OK] Успешно завершено!")
    
    print(f"  Время выполнения: {elapsed:.2f} сек")
    print()
    print("  Статистика:")
    print(f"    - Ролей: {stats.get('roles', 0)}")
    print(f"    - Пользователей: {stats.get('users', 0)}")
    print(f"    - Категорий инвентаря: {stats.get('categories', 0)}")
    print(f"    - Мест хранения: {stats.get('locations', 0)}")
    print(f"    - Предметов инвентаря: {stats.get('items', 0)}")
    print(f"    - Спектаклей: {stats.get('performances', 0)}")
    print(f"    - Документов: {stats.get('documents', 0)}")
    print(f"    - Событий расписания: {stats.get('events', 0)}")
    print(f"    - Стоимость инвентаря: {stats.get('inventory_value', 0):,.0f} руб.")
    print()
    print("  " + "-" * 50)
    print("  | Учётные данные для входа:                      |")
    print("  |                                                |")
    print("  |   Администратор:                               |")
    print("  |     Email:    admin@theatre.test               |")
    print("  |     Пароль:   Theatre2024!                     |")
    print("  |                                                |")
    print("  |   Режиссёр:                                    |")
    print("  |     Email:    director@theatre.test            |")
    print("  |     Пароль:   Theatre2024!                     |")
    print("  " + "-" * 50)
    print()


if __name__ == "__main__":
    asyncio.run(main())
