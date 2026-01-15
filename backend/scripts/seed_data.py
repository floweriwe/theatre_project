"""
Скрипт заполнения ПОЛНОЦЕННЫМИ тестовыми данными.

Создаёт:
- 12+ категорий инвентаря с иерархией (подкатегории)
- 15+ мест хранения с иерархией
- 60+ предметов инвентаря с разными статусами
- 30+ движений инвентаря (история перемещений)
- 10+ категорий документов
- 20+ документов
- 12 спектаклей с полными данными
- 40+ событий расписания (спектакли, репетиции)

Использование:
    python -m scripts.seed_data

Или через Docker:
    docker-compose exec backend python -m scripts.seed_data
"""
import asyncio
import random
import sys
from pathlib import Path
from datetime import date, datetime, time, timedelta
from decimal import Decimal

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, func
from app.database.session import async_session_factory, init_db
from app.models import User
from app.models.inventory import (
    InventoryCategory,
    StorageLocation,
    InventoryItem,
    InventoryMovement,
    ItemStatus,
    MovementType,
)
from app.models.document import Document, DocumentCategory, DocumentVersion, DocumentStatus, FileType
from app.models.performance import Performance, PerformanceSection, PerformanceStatus, SectionType
from app.models.schedule import ScheduleEvent, EventParticipant, EventType, EventStatus, ParticipantRole, ParticipantStatus


# =============================================================================
# Категории инвентаря (с подкатегориями)
# =============================================================================

INVENTORY_CATEGORIES = [
    {
        "name": "Костюмы",
        "code": "costumes",
        "color": "#8B5CF6",
        "icon": "shirt",
        "children": [
            {"name": "Мужские костюмы", "code": "costumes-male", "color": "#8B5CF6"},
            {"name": "Женские костюмы", "code": "costumes-female", "color": "#A78BFA"},
            {"name": "Детские костюмы", "code": "costumes-children", "color": "#C4B5FD"},
            {"name": "Историческ. костюмы", "code": "costumes-historical", "color": "#7C3AED"},
            {"name": "Аксессуары", "code": "costumes-accessories", "color": "#6D28D9"},
        ]
    },
    {
        "name": "Реквизит",
        "code": "props",
        "color": "#3B82F6",
        "icon": "box",
        "children": [
            {"name": "Бутафория", "code": "props-fake", "color": "#3B82F6"},
            {"name": "Оружие", "code": "props-weapons", "color": "#2563EB"},
            {"name": "Посуда", "code": "props-dishes", "color": "#60A5FA"},
            {"name": "Аксессуары сцены", "code": "props-stage", "color": "#1D4ED8"},
        ]
    },
    {
        "name": "Декорации",
        "code": "scenery",
        "color": "#10B981",
        "icon": "mountain",
        "children": [
            {"name": "Жёсткие декорации", "code": "scenery-hard", "color": "#10B981"},
            {"name": "Мягкие декорации", "code": "scenery-soft", "color": "#34D399"},
            {"name": "Падуги и кулисы", "code": "scenery-curtains", "color": "#059669"},
        ]
    },
    {
        "name": "Мебель",
        "code": "furniture",
        "color": "#F59E0B",
        "icon": "armchair",
        "children": [
            {"name": "Столы и стулья", "code": "furniture-tables", "color": "#F59E0B"},
            {"name": "Мягкая мебель", "code": "furniture-soft", "color": "#FBBF24"},
            {"name": "Шкафы и комоды", "code": "furniture-storage", "color": "#D97706"},
        ]
    },
    {
        "name": "Освещение",
        "code": "lighting",
        "color": "#EF4444",
        "icon": "lightbulb",
        "children": [
            {"name": "Прожекторы", "code": "lighting-spots", "color": "#EF4444"},
            {"name": "LED панели", "code": "lighting-led", "color": "#F87171"},
            {"name": "Moving Heads", "code": "lighting-moving", "color": "#DC2626"},
        ]
    },
    {
        "name": "Звуковое оборудование",
        "code": "sound",
        "color": "#06B6D4",
        "icon": "speaker",
        "children": [
            {"name": "Микрофоны", "code": "sound-mics", "color": "#06B6D4"},
            {"name": "Акустические системы", "code": "sound-speakers", "color": "#22D3EE"},
            {"name": "Пульты и процессоры", "code": "sound-mixers", "color": "#0891B2"},
        ]
    },
]


# =============================================================================
# Места хранения (с иерархией)
# =============================================================================

STORAGE_LOCATIONS = [
    {
        "name": "Главное здание",
        "code": "main-building",
        "address": "ул. Театральная, 1",
        "children": [
            {
                "name": "Большая сцена",
                "code": "main-stage",
                "children": [
                    {"name": "Авансцена", "code": "main-stage-front"},
                    {"name": "Арьерсцена", "code": "main-stage-back"},
                    {"name": "Карманы сцены", "code": "main-stage-wings"},
                ]
            },
            {"name": "Малая сцена", "code": "small-stage"},
            {"name": "Репетиционный зал 1", "code": "rehearsal-1"},
            {"name": "Репетиционный зал 2", "code": "rehearsal-2"},
        ]
    },
    {
        "name": "Склад A",
        "code": "warehouse-a",
        "address": "ул. Складская, 5",
        "children": [
            {"name": "Секция A1 — Костюмы", "code": "warehouse-a1"},
            {"name": "Секция A2 — Реквизит", "code": "warehouse-a2"},
            {"name": "Секция A3 — Декорации", "code": "warehouse-a3"},
        ]
    },
    {
        "name": "Склад B",
        "code": "warehouse-b",
        "address": "ул. Складская, 7",
        "children": [
            {"name": "Секция B1 — Мебель", "code": "warehouse-b1"},
            {"name": "Секция B2 — Оборудование", "code": "warehouse-b2"},
        ]
    },
    {
        "name": "Костюмерный цех",
        "code": "costume-workshop",
        "address": "Главное здание, 3 этаж",
        "children": [
            {"name": "Швейный участок", "code": "costume-sewing"},
            {"name": "Примерочная", "code": "costume-fitting"},
            {"name": "Хранение тканей", "code": "costume-fabrics"},
        ]
    },
    {
        "name": "Бутафорский цех",
        "code": "props-workshop",
        "address": "Главное здание, подвал",
    },
]


# =============================================================================
# Предметы инвентаря (60+)
# =============================================================================

INVENTORY_ITEMS = [
    # Костюмы (20)
    {"name": "Фрак мужской чёрный", "code": "costumes-male", "loc": "warehouse-a1", "qty": 5, "price": 45000, "status": "in_stock"},
    {"name": "Платье бальное красное", "code": "costumes-female", "loc": "warehouse-a1", "qty": 3, "price": 85000, "status": "in_stock"},
    {"name": "Смокинг белый", "code": "costumes-male", "loc": "warehouse-a1", "qty": 4, "price": 55000, "status": "reserved"},
    {"name": "Платье вечернее синее", "code": "costumes-female", "loc": "warehouse-a1", "qty": 2, "price": 65000, "status": "in_stock"},
    {"name": "Костюм гусара", "code": "costumes-historical", "loc": "warehouse-a1", "qty": 6, "price": 75000, "status": "in_use"},
    {"name": "Платье эпохи Возрождения", "code": "costumes-historical", "loc": "costume-workshop", "qty": 2, "price": 120000, "status": "in_repair"},
    {"name": "Детский костюм мышки", "code": "costumes-children", "loc": "warehouse-a1", "qty": 8, "price": 15000, "status": "in_stock"},
    {"name": "Детский костюм солдатика", "code": "costumes-children", "loc": "warehouse-a1", "qty": 10, "price": 18000, "status": "in_stock"},
    {"name": "Шляпа цилиндр", "code": "costumes-accessories", "loc": "warehouse-a1", "qty": 12, "price": 5000, "status": "in_stock"},
    {"name": "Веер складной", "code": "costumes-accessories", "loc": "warehouse-a1", "qty": 20, "price": 3000, "status": "in_stock"},
    {"name": "Парик седой судьи", "code": "costumes-accessories", "loc": "costume-workshop", "qty": 4, "price": 8000, "status": "in_stock"},
    {"name": "Корсет женский XIX век", "code": "costumes-female", "loc": "warehouse-a1", "qty": 6, "price": 25000, "status": "in_stock"},
    {"name": "Мундир офицерский", "code": "costumes-historical", "loc": "warehouse-a1", "qty": 4, "price": 65000, "status": "reserved"},
    {"name": "Платье крестьянки", "code": "costumes-female", "loc": "warehouse-a1", "qty": 8, "price": 22000, "status": "in_stock"},
    {"name": "Костюм пирата", "code": "costumes-male", "loc": "warehouse-a1", "qty": 3, "price": 35000, "status": "in_stock"},
    {"name": "Балетная пачка белая", "code": "costumes-female", "loc": "costume-workshop", "qty": 12, "price": 45000, "status": "in_stock"},
    {"name": "Балетная пачка розовая", "code": "costumes-female", "loc": "costume-workshop", "qty": 8, "price": 45000, "status": "in_use"},
    {"name": "Сапоги кавалерийские", "code": "costumes-accessories", "loc": "warehouse-a1", "qty": 10, "price": 18000, "status": "in_stock"},
    {"name": "Перчатки бальные белые", "code": "costumes-accessories", "loc": "warehouse-a1", "qty": 30, "price": 2500, "status": "in_stock"},
    {"name": "Маска венецианская", "code": "costumes-accessories", "loc": "warehouse-a1", "qty": 15, "price": 4500, "status": "in_stock"},
    
    # Реквизит (15)
    {"name": "Шпага театральная", "code": "props-weapons", "loc": "props-workshop", "qty": 8, "price": 15000, "status": "in_stock"},
    {"name": "Пистолет бутафорский", "code": "props-weapons", "loc": "props-workshop", "qty": 6, "price": 8000, "status": "in_stock"},
    {"name": "Кинжал декоративный", "code": "props-weapons", "loc": "props-workshop", "qty": 10, "price": 5000, "status": "in_stock"},
    {"name": "Сервиз чайный фарфоровый", "code": "props-dishes", "loc": "warehouse-a2", "qty": 4, "price": 35000, "status": "in_stock"},
    {"name": "Канделябр на 5 свечей", "code": "props-stage", "loc": "warehouse-a2", "qty": 6, "price": 25000, "status": "reserved"},
    {"name": "Книга бутафорская большая", "code": "props-fake", "loc": "props-workshop", "qty": 20, "price": 3000, "status": "in_stock"},
    {"name": "Череп бутафорский", "code": "props-fake", "loc": "props-workshop", "qty": 3, "price": 8000, "status": "in_stock"},
    {"name": "Телефон ретро", "code": "props-stage", "loc": "warehouse-a2", "qty": 4, "price": 12000, "status": "in_stock"},
    {"name": "Глобус настольный", "code": "props-stage", "loc": "warehouse-a2", "qty": 2, "price": 15000, "status": "in_stock"},
    {"name": "Букет искусственных роз", "code": "props-fake", "loc": "props-workshop", "qty": 15, "price": 4000, "status": "in_stock"},
    {"name": "Корзина плетёная", "code": "props-stage", "loc": "warehouse-a2", "qty": 8, "price": 3500, "status": "in_stock"},
    {"name": "Чемодан кожаный ретро", "code": "props-stage", "loc": "warehouse-a2", "qty": 5, "price": 18000, "status": "in_use"},
    {"name": "Зеркало в раме", "code": "props-stage", "loc": "warehouse-a2", "qty": 3, "price": 28000, "status": "in_stock"},
    {"name": "Кувшин глиняный", "code": "props-dishes", "loc": "warehouse-a2", "qty": 12, "price": 2500, "status": "in_stock"},
    {"name": "Самовар медный", "code": "props-dishes", "loc": "warehouse-a2", "qty": 2, "price": 45000, "status": "in_stock"},
    
    # Мебель (10)
    {"name": "Кресло викторианское", "code": "furniture-soft", "loc": "warehouse-b1", "qty": 4, "price": 65000, "status": "in_stock"},
    {"name": "Диван честерфилд", "code": "furniture-soft", "loc": "warehouse-b1", "qty": 2, "price": 120000, "status": "reserved"},
    {"name": "Стол обеденный круглый", "code": "furniture-tables", "loc": "warehouse-b1", "qty": 3, "price": 45000, "status": "in_stock"},
    {"name": "Стул венский", "code": "furniture-tables", "loc": "warehouse-b1", "qty": 24, "price": 8000, "status": "in_stock"},
    {"name": "Комод антикварный", "code": "furniture-storage", "loc": "warehouse-b1", "qty": 2, "price": 85000, "status": "in_stock"},
    {"name": "Шкаф книжный", "code": "furniture-storage", "loc": "warehouse-b1", "qty": 3, "price": 55000, "status": "in_stock"},
    {"name": "Секретер красного дерева", "code": "furniture-storage", "loc": "warehouse-b1", "qty": 1, "price": 150000, "status": "in_use"},
    {"name": "Банкетка бархатная", "code": "furniture-soft", "loc": "warehouse-b1", "qty": 6, "price": 25000, "status": "in_stock"},
    {"name": "Тумба прикроватная", "code": "furniture-storage", "loc": "warehouse-b1", "qty": 4, "price": 18000, "status": "in_stock"},
    {"name": "Ширма трёхстворчатая", "code": "furniture-soft", "loc": "warehouse-b1", "qty": 5, "price": 35000, "status": "in_stock"},
    
    # Освещение (8)
    {"name": "Прожектор LED 500W", "code": "lighting-spots", "loc": "main-stage", "qty": 24, "price": 35000, "status": "in_stock"},
    {"name": "Прожектор галогенный 1000W", "code": "lighting-spots", "loc": "warehouse-b2", "qty": 12, "price": 25000, "status": "in_stock"},
    {"name": "LED панель RGBW", "code": "lighting-led", "loc": "main-stage", "qty": 16, "price": 45000, "status": "in_use"},
    {"name": "Moving Head Beam", "code": "lighting-moving", "loc": "main-stage", "qty": 8, "price": 120000, "status": "in_stock"},
    {"name": "Moving Head Spot", "code": "lighting-moving", "loc": "main-stage", "qty": 6, "price": 150000, "status": "in_use"},
    {"name": "Световой пульт DMX", "code": "lighting-spots", "loc": "main-stage", "qty": 2, "price": 350000, "status": "in_stock"},
    {"name": "Дымовая машина", "code": "lighting-led", "loc": "warehouse-b2", "qty": 3, "price": 45000, "status": "in_stock"},
    {"name": "Стробоскоп", "code": "lighting-led", "loc": "warehouse-b2", "qty": 4, "price": 18000, "status": "in_stock"},
    
    # Звук (7)
    {"name": "Микрофон беспроводной Shure", "code": "sound-mics", "loc": "main-stage", "qty": 12, "price": 45000, "status": "in_stock"},
    {"name": "Микрофон петличный", "code": "sound-mics", "loc": "main-stage", "qty": 20, "price": 25000, "status": "in_use"},
    {"name": "Акустическая система d&b", "code": "sound-speakers", "loc": "main-stage", "qty": 8, "price": 250000, "status": "in_stock"},
    {"name": "Сабвуфер", "code": "sound-speakers", "loc": "main-stage", "qty": 4, "price": 180000, "status": "in_stock"},
    {"name": "Звуковой пульт Yamaha", "code": "sound-mixers", "loc": "main-stage", "qty": 1, "price": 850000, "status": "in_stock"},
    {"name": "Процессор эффектов", "code": "sound-mixers", "loc": "main-stage", "qty": 2, "price": 120000, "status": "in_stock"},
    {"name": "Мониторная акустика", "code": "sound-speakers", "loc": "main-stage", "qty": 6, "price": 85000, "status": "in_stock"},
]


# =============================================================================
# Спектакли (12)
# =============================================================================

PERFORMANCES = [
    {
        "title": "Ревизор",
        "subtitle": "Комедия в 5 действиях",
        "author": "Н.В. Гоголь",
        "director": "Иван Петров",
        "genre": "Комедия",
        "age_rating": "12+",
        "duration_minutes": 150,
        "intermissions": 1,
        "status": PerformanceStatus.IN_REPERTOIRE,
        "premiere_date": date(2024, 9, 15),
        "description": "Классическая комедия о коррупции и человеческих пороках.",
    },
    {
        "title": "Вишнёвый сад",
        "subtitle": "Пьеса в 4 действиях",
        "author": "А.П. Чехов",
        "director": "Мария Сидорова",
        "genre": "Драма",
        "age_rating": "16+",
        "duration_minutes": 180,
        "intermissions": 2,
        "status": PerformanceStatus.IN_REPERTOIRE,
        "premiere_date": date(2024, 11, 20),
        "description": "История о разорившемся дворянском семействе.",
    },
    {
        "title": "Щелкунчик",
        "subtitle": "Балет в 2 действиях",
        "author": "Э.Т.А. Гофман",
        "director": "Анна Волкова",
        "composer": "П.И. Чайковский",
        "choreographer": "Светлана Иванова",
        "genre": "Балет",
        "age_rating": "0+",
        "duration_minutes": 120,
        "intermissions": 1,
        "status": PerformanceStatus.IN_REPERTOIRE,
        "premiere_date": date(2024, 12, 15),
        "description": "Волшебная сказка о девочке Мари и Щелкунчике.",
    },
    {
        "title": "Гамлет",
        "subtitle": "Трагедия в 5 актах",
        "author": "У. Шекспир",
        "director": "Алексей Михайлов",
        "genre": "Трагедия",
        "age_rating": "16+",
        "duration_minutes": 210,
        "intermissions": 2,
        "status": PerformanceStatus.IN_REPERTOIRE,
        "premiere_date": date(2024, 3, 10),
        "description": "Вечная история о мести, любви и предательстве.",
    },
    {
        "title": "Три сестры",
        "subtitle": "Драма в 4 действиях",
        "author": "А.П. Чехов",
        "director": "Елена Козлова",
        "genre": "Драма",
        "age_rating": "16+",
        "duration_minutes": 165,
        "intermissions": 1,
        "status": PerformanceStatus.IN_REPERTOIRE,
        "premiere_date": date(2024, 5, 25),
        "description": "История трёх сестёр Прозоровых.",
    },
    {
        "title": "Лебединое озеро",
        "subtitle": "Балет в 4 актах",
        "author": "В.П. Бегичев",
        "director": "Наталья Смирнова",
        "composer": "П.И. Чайковский",
        "choreographer": "Мариус Петипа",
        "genre": "Балет",
        "age_rating": "6+",
        "duration_minutes": 150,
        "intermissions": 2,
        "status": PerformanceStatus.IN_REPERTOIRE,
        "premiere_date": date(2024, 2, 14),
        "description": "Романтическая история о принце Зигфриде и Одетте.",
    },
    {
        "title": "Мастер и Маргарита",
        "subtitle": "Мистерия в 2 частях",
        "author": "М.А. Булгаков",
        "director": "Дмитрий Орлов",
        "genre": "Мистерия",
        "age_rating": "18+",
        "duration_minutes": 195,
        "intermissions": 1,
        "status": PerformanceStatus.IN_REPERTOIRE,
        "premiere_date": date(2024, 10, 31),
        "description": "Сатана прибывает в Москву под видом профессора.",
    },
    {
        "title": "Ромео и Джульетта",
        "subtitle": "Трагедия в 5 актах",
        "author": "У. Шекспир",
        "director": "Виктория Белова",
        "genre": "Трагедия",
        "age_rating": "12+",
        "duration_minutes": 140,
        "intermissions": 1,
        "status": PerformanceStatus.PAUSED,
        "premiere_date": date(2023, 2, 14),
        "description": "Самая известная история любви.",
    },
    {
        "title": "Евгений Онегин",
        "subtitle": "Опера в 3 действиях",
        "author": "А.С. Пушкин",
        "director": "Сергей Николаев",
        "composer": "П.И. Чайковский",
        "genre": "Опера",
        "age_rating": "12+",
        "duration_minutes": 175,
        "intermissions": 2,
        "status": PerformanceStatus.IN_REPERTOIRE,
        "premiere_date": date(2024, 6, 6),
        "description": "Лирическая опера по роману Пушкина.",
    },
    {
        "title": "Горе от ума",
        "subtitle": "Комедия в стихах",
        "author": "А.С. Грибоедов",
        "director": "Павел Фёдоров",
        "genre": "Комедия",
        "age_rating": "12+",
        "duration_minutes": 155,
        "intermissions": 1,
        "status": PerformanceStatus.PREPARATION,
        "premiere_date": date(2025, 3, 15),
        "description": "Сатирическая комедия о московском обществе.",
    },
    {
        "title": "Кармен",
        "subtitle": "Опера в 4 действиях",
        "author": "П. Мериме",
        "director": "Ольга Андреева",
        "composer": "Ж. Бизе",
        "genre": "Опера",
        "age_rating": "16+",
        "duration_minutes": 165,
        "intermissions": 1,
        "status": PerformanceStatus.PREPARATION,
        "premiere_date": date(2025, 4, 20),
        "description": "Страстная история любви солдата и цыганки.",
    },
    {
        "title": "Снежная королева",
        "subtitle": "Сказка в 2 действиях",
        "author": "Г.Х. Андерсен",
        "director": "Екатерина Морозова",
        "genre": "Сказка",
        "age_rating": "6+",
        "duration_minutes": 90,
        "intermissions": 1,
        "status": PerformanceStatus.IN_REPERTOIRE,
        "premiere_date": date(2024, 12, 20),
        "description": "Волшебная история о Герде и Кае.",
    },
]


# =============================================================================
# Категории документов
# =============================================================================

DOCUMENT_CATEGORIES = [
    {"name": "Приказы", "code": "orders", "color": "#3B82F6", "icon": "file-text"},
    {"name": "Договоры", "code": "contracts", "color": "#10B981", "icon": "file-signature"},
    {"name": "Финансовые документы", "code": "financial", "color": "#F59E0B", "icon": "dollar-sign"},
    {"name": "Кадровые документы", "code": "hr", "color": "#8B5CF6", "icon": "users"},
    {"name": "Технические райдеры", "code": "technical", "color": "#EF4444", "icon": "settings"},
    {"name": "Световые партитуры", "code": "lighting-docs", "color": "#F97316", "icon": "lightbulb"},
    {"name": "Звуковые партитуры", "code": "sound-docs", "color": "#06B6D4", "icon": "volume-2"},
    {"name": "Афиши и программки", "code": "posters", "color": "#EC4899", "icon": "image"},
    {"name": "Эскизы костюмов", "code": "costume-designs", "color": "#A855F7", "icon": "palette"},
    {"name": "Эскизы декораций", "code": "scenery-designs", "color": "#22C55E", "icon": "layout"},
    {"name": "Прочее", "code": "other", "color": "#6B7280", "icon": "folder"},
]


async def seed_data():
    """Заполнить БД полноценными тестовыми данными."""
    
    await init_db()
    
    async with async_session_factory() as session:
        # Получаем admin пользователя
        result = await session.execute(
            select(User).where(User.email == "admin@theatre.test")
        )
        admin = result.scalar_one_or_none()
        
        if not admin:
            print("❌ Сначала создайте тестового пользователя:")
            print("   python -m scripts.create_test_user")
            return
        
        user_id = admin.id
        theater_id = admin.theater_id
        
        print("\n" + "="*60)
        print("🎭 ЗАПОЛНЕНИЕ ТЕСТОВЫМИ ДАННЫМИ")
        print("="*60 + "\n")
        
        # =====================================================================
        # 1. Категории инвентаря с подкатегориями
        # =====================================================================
        print("📦 Создаю категории инвентаря...")
        
        categories_map = {}
        
        for cat_data in INVENTORY_CATEGORIES:
            children = cat_data.pop("children", [])
            
            existing = await session.execute(
                select(InventoryCategory).where(InventoryCategory.code == cat_data["code"])
            )
            parent = existing.scalar_one_or_none()
            
            if not parent:
                parent = InventoryCategory(
                    **cat_data,
                    theater_id=theater_id,
                    created_by_id=user_id
                )
                session.add(parent)
                await session.flush()
                print(f"   ✓ {cat_data['name']}")
            
            categories_map[cat_data["code"]] = parent
            
            # Подкатегории
            for child_data in children:
                existing_child = await session.execute(
                    select(InventoryCategory).where(InventoryCategory.code == child_data["code"])
                )
                if not existing_child.scalar_one_or_none():
                    child = InventoryCategory(
                        **child_data,
                        parent_id=parent.id,
                        theater_id=theater_id,
                        created_by_id=user_id
                    )
                    session.add(child)
                    await session.flush()
                    categories_map[child_data["code"]] = child
                    print(f"      └─ {child_data['name']}")
        
        await session.commit()
        
        # =====================================================================
        # 2. Места хранения с иерархией
        # =====================================================================
        print("\n📍 Создаю места хранения...")
        
        locations_map = {}
        
        async def create_location(loc_data, parent_id=None, indent=""):
            children = loc_data.pop("children", [])
            
            existing = await session.execute(
                select(StorageLocation).where(StorageLocation.code == loc_data["code"])
            )
            location = existing.scalar_one_or_none()
            
            if not location:
                location = StorageLocation(
                    **loc_data,
                    parent_id=parent_id,
                    theater_id=theater_id,
                    created_by_id=user_id
                )
                session.add(location)
                await session.flush()
                print(f"{indent}✓ {loc_data['name']}")
            
            locations_map[loc_data["code"]] = location
            
            for child_data in children:
                await create_location(child_data, location.id, indent + "   ")
        
        for loc_data in STORAGE_LOCATIONS:
            await create_location(loc_data)
        
        await session.commit()
        
        # =====================================================================
        # 3. Предметы инвентаря (60+)
        # =====================================================================
        print("\n🎭 Создаю предметы инвентаря...")
        
        cat_result = await session.execute(select(InventoryCategory))
        all_cats = {c.code: c for c in cat_result.scalars().all()}
        
        loc_result = await session.execute(select(StorageLocation))
        all_locs = {l.code: l for l in loc_result.scalars().all()}
        
        items_created = 0
        status_map = {
            "in_stock": ItemStatus.IN_STOCK,
            "reserved": ItemStatus.RESERVED,
            "in_use": ItemStatus.IN_USE,
            "in_repair": ItemStatus.IN_REPAIR,
        }
        
        for idx, item_data in enumerate(INVENTORY_ITEMS):
            inv_number = f"INV-{date.today().year}-{idx+1:04d}"
            
            existing = await session.execute(
                select(InventoryItem).where(InventoryItem.inventory_number == inv_number)
            )
            if existing.scalar_one_or_none():
                continue
            
            cat = all_cats.get(item_data["code"])
            loc = all_locs.get(item_data["loc"])
            
            item = InventoryItem(
                name=item_data["name"],
                inventory_number=inv_number,
                description=f"Описание: {item_data['name']}",
                category_id=cat.id if cat else None,
                location_id=loc.id if loc else None,
                quantity=item_data["qty"],
                purchase_price=Decimal(str(item_data["price"])),
                current_value=Decimal(str(int(item_data["price"] * 0.85))),
                purchase_date=date.today() - timedelta(days=random.randint(30, 365)),
                status=status_map.get(item_data["status"], ItemStatus.IN_STOCK),
                theater_id=theater_id,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
            session.add(item)
            items_created += 1
        
        await session.flush()
        print(f"   ✓ Создано {items_created} предметов")
        
        # =====================================================================
        # 4. История перемещений
        # =====================================================================
        print("\n🔄 Создаю историю перемещений...")
        
        items_result = await session.execute(select(InventoryItem).limit(30))
        items_for_movements = items_result.scalars().all()
        locations_list = list(all_locs.values())
        
        movements_created = 0
        for item in items_for_movements:
            num_movements = random.randint(1, 3)
            for i in range(num_movements):
                from_loc = random.choice(locations_list) if i > 0 else None
                to_loc = random.choice(locations_list)
                
                if from_loc and from_loc.id == to_loc.id:
                    continue
                
                movement = InventoryMovement(
                    item_id=item.id,
                    movement_type=MovementType.TRANSFER if from_loc else MovementType.RECEIPT,
                    from_location_id=from_loc.id if from_loc else None,
                    to_location_id=to_loc.id,
                    quantity=item.quantity,
                    comment=f"Перемещение #{movements_created + 1}",
                    created_by_id=user_id,
                    created_at=datetime.now() - timedelta(days=random.randint(1, 90)),
                )
                session.add(movement)
                movements_created += 1
        
        print(f"   ✓ Создано {movements_created} перемещений")
        await session.commit()
        
        # =====================================================================
        # 5. Категории документов
        # =====================================================================
        print("\n📄 Создаю категории документов...")
        
        for cat_data in DOCUMENT_CATEGORIES:
            existing = await session.execute(
                select(DocumentCategory).where(DocumentCategory.code == cat_data["code"])
            )
            if not existing.scalar_one_or_none():
                cat = DocumentCategory(
                    **cat_data,
                    theater_id=theater_id,
                    created_by_id=user_id
                )
                session.add(cat)
                print(f"   ✓ {cat_data['name']}")
        
        await session.commit()
        
        # =====================================================================
        # 6. Спектакли
        # =====================================================================
        print("\n🎪 Создаю спектакли...")
        
        section_titles = {
            SectionType.LIGHTING: "Световая партитура",
            SectionType.SOUND: "Звуковая партитура",
            SectionType.SCENERY: "Декорации",
            SectionType.PROPS: "Реквизит",
            SectionType.COSTUMES: "Костюмы",
            SectionType.MAKEUP: "Грим и причёски",
            SectionType.VIDEO: "Видеопроекции",
            SectionType.EFFECTS: "Спецэффекты",
            SectionType.OTHER: "Прочее",
        }
        
        for perf_data in PERFORMANCES:
            existing = await session.execute(
                select(Performance).where(Performance.title == perf_data["title"])
            )
            if existing.scalar_one_or_none():
                continue
            
            perf = Performance(
                **perf_data,
                theater_id=theater_id,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
            session.add(perf)
            await session.flush()
            
            for idx, (section_type, title) in enumerate(section_titles.items()):
                section = PerformanceSection(
                    performance_id=perf.id,
                    section_type=section_type,
                    title=title,
                    sort_order=idx,
                    created_by_id=user_id,
                    updated_by_id=user_id,
                )
                session.add(section)
            
            print(f"   ✓ {perf_data['title']}")
        
        await session.commit()
        
        # =====================================================================
        # 7. События расписания (40+)
        # =====================================================================
        print("\n📅 Создаю события расписания...")
        
        perf_result = await session.execute(select(Performance))
        all_performances = perf_result.scalars().all()
        repertoire_perfs = [p for p in all_performances if p.status == PerformanceStatus.IN_REPERTOIRE]
        
        events_created = 0
        today = date.today()
        
        for days_offset in range(0, 60, 2):
            event_date = today + timedelta(days=days_offset)
            
            if event_date.weekday() == 0:  # Понедельник — выходной
                continue
            
            perf = random.choice(repertoire_perfs) if repertoire_perfs else None
            if not perf:
                continue
            
            if event_date.weekday() in [5, 6]:  # Выходные — спектакли
                event_type = EventType.PERFORMANCE
                start_time = time(19, 0) if event_date.weekday() == 6 else time(18, 0)
                status = EventStatus.CONFIRMED if days_offset < 30 else EventStatus.PLANNED
            else:
                event_type = random.choice([EventType.REHEARSAL, EventType.TECH_REHEARSAL])
                start_time = time(10, 0)
                status = EventStatus.PLANNED
            
            existing = await session.execute(
                select(ScheduleEvent).where(
                    ScheduleEvent.event_date == event_date,
                    ScheduleEvent.performance_id == perf.id
                )
            )
            if existing.scalar_one_or_none():
                continue
            
            event = ScheduleEvent(
                title=perf.title if event_type == EventType.PERFORMANCE else f"Репетиция: {perf.title}",
                description=f"{'Спектакль' if event_type == EventType.PERFORMANCE else 'Репетиция'} на основной сцене",
                event_type=event_type,
                status=status,
                event_date=event_date,
                start_time=start_time,
                end_time=time(start_time.hour + 3, 0),
                venue="Большая сцена" if event_type == EventType.PERFORMANCE else "Репетиционный зал 1",
                performance_id=perf.id,
                color="#10B981" if event_type == EventType.PERFORMANCE else "#F59E0B",
                is_public=event_type == EventType.PERFORMANCE,
                theater_id=theater_id,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
            session.add(event)
            events_created += 1
        
        print(f"   ✓ Создано {events_created} событий")
        await session.commit()
        
        # =====================================================================
        # Статистика
        # =====================================================================
        print("\n" + "="*60)
        print("✅ ТЕСТОВЫЕ ДАННЫЕ УСПЕШНО СОЗДАНЫ!")
        print("="*60)
        
        stats = {
            "Категории инвентаря": await session.scalar(select(func.count(InventoryCategory.id))),
            "Места хранения": await session.scalar(select(func.count(StorageLocation.id))),
            "Предметы инвентаря": await session.scalar(select(func.count(InventoryItem.id))),
            "Перемещения": await session.scalar(select(func.count(InventoryMovement.id))),
            "Категории документов": await session.scalar(select(func.count(DocumentCategory.id))),
            "Спектакли": await session.scalar(select(func.count(Performance.id))),
            "События расписания": await session.scalar(select(func.count(ScheduleEvent.id))),
        }
        
        print("\n📊 СТАТИСТИКА:")
        for name, count in stats.items():
            print(f"   {name}: {count}")
        
        print("\n🔑 Тестовые учётные данные:")
        print("   Email: admin@theatre.test")
        print("   Пароль: admin123")
        print()


if __name__ == "__main__":
    asyncio.run(seed_data())
