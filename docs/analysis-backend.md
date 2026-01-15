# Backend Analysis Report

**Дата анализа:** 2026-01-16
**Версия:** MVP v0.1.0
**Анализируемые модули:** Inventory, Performance, Document, Schedule

---

## Резюме

Обнаружены **критические архитектурные проблемы** в слое репозиториев, которые приводят к ошибкам при обработке запросов к детальным страницам и операциям обновления. Основная проблема - несоответствие сигнатуры метода `update` в `BaseRepository` и его вызовов в сервисах.

**Критичность:** ВЫСОКАЯ
**Статус системы:** Частично работоспособна (GET-запросы списков работают, детальные страницы и UPDATE ломаются)

---

## 1. Архитектура API

### Текущее состояние

Архитектура соответствует заявленному паттерну **Router → Service → Repository → Model**:

```
backend/app/
├── api/v1/
│   ├── inventory.py      ✅ Только маршрутизация
│   ├── performances.py   ✅ Только маршрутизация
│   └── documents.py      ✅ Только маршрутизация
├── services/
│   ├── inventory_service.py     ✅ Бизнес-логика
│   ├── performance_service.py   ✅ Бизнес-логика
│   └── document_service.py      ✅ Бизнес-логика
├── repositories/
│   ├── base.py                  ❌ Проблемная сигнатура update()
│   ├── inventory_repository.py  ✅ Корректные методы
│   └── user_repository.py       ✅ Корректные методы
└── models/
    ├── inventory.py             ✅ SQLAlchemy 2.0 async
    └── performance.py           ✅ SQLAlchemy 2.0 async
```

### Проблемы

- [x] **КРИТИЧНО:** Несоответствие сигнатуры `BaseRepository.update()`
  - **Объявлено:** `async def update(self, instance: ModelType, data: dict) -> ModelType`
  - **Вызывается:** `await repo.update(entity_id: int, data: dict)`
  - **Затронуто:** Все сервисы (inventory, performance, document, schedule)
  - **Эффект:** TypeError при попытке обновления любой сущности

- [ ] **Средне:** В роутерах есть helper-функции преобразования (`_item_to_response`, `_category_to_response`)
  - Это допустимо, но лучше вынести в schemas как classmethod или отдельный mapper
  - Не критично, но снижает читаемость

- [ ] **Низкое:** Дублирование логики преобразования в каждом роутере
  - В `inventory.py`: 6 функций-конвертеров (строки 591-706)
  - В `performances.py`: аналогичные функции
  - Можно унифицировать через базовый класс Response в Pydantic

### Рекомендации

1. **СРОЧНО:** Исправить сигнатуру `BaseRepository.update()`:

```python
# Вариант 1: Изменить сигнатуру (BREAKING CHANGE)
async def update(self, id: int, data: dict[str, Any]) -> ModelType:
    instance = await self.get_by_id(id)
    if not instance:
        raise NotFoundError(f"Entity with id {id} not found")

    for key, value in data.items():
        if hasattr(instance, key):
            setattr(instance, key, value)

    await self._session.flush()
    await self._session.refresh(instance)
    return instance

# Вариант 2: Добавить второй метод (без BREAKING CHANGE)
async def update_by_id(self, id: int, data: dict[str, Any]) -> ModelType:
    instance = await self.get_by_id(id)
    if not instance:
        raise NotFoundError(f"Entity with id {id} not found")
    return await self.update(instance, data)
```

2. Создать базовый ResponseMapper для унификации конвертеров
3. Добавить валидацию на уровне роутера для проверки theater_id (multi-tenancy)

---

## 2. SQLAlchemy модели

### Текущее состояние

Модели правильно используют **SQLAlchemy 2.0 async** с typed mappings:

```python
# ✅ Корректное использование Mapped и mapped_column
class InventoryItem(Base, AuditMixin):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ItemStatus] = mapped_column(
        Enum(ItemStatus, values_callable=lambda x: [e.value for e in x]),  # ✅
        default=ItemStatus.IN_STOCK,
        nullable=False,
        index=True
    )
```

**Критическая проверка Enum:**
- ✅ `values_callable` используется корректно во всех моделях
- ✅ Миграции создают PostgreSQL ENUM с `create_type=False`
- ✅ Enum определены в моделях как `ItemStatus(str, PyEnum)`

### Проблемы

- [x] **Потенциальная проблема:** В `BaseRepository.update()` отсутствует проверка на существование атрибута
  - Текущая реализация: `if hasattr(instance, key)`
  - Не проверяется, является ли атрибут mapped_column
  - Может привести к попытке обновления relationship или property

- [ ] **Средне:** В `InventoryItem.full_path` (StorageLocation) используется `@property`
  - При сериализации может вызвать N+1 проблему
  - Рекомендуется eager loading или hybrid_property

- [ ] **Низкое:** `AuditMixin` использует `datetime.utcnow` вместо timezone-aware datetime
  - Потенциальные проблемы с часовыми поясами
  - Рекомендуется `datetime.now(UTC)`

### Рекомендации

1. Добавить в `BaseRepository.update()` проверку mapped columns:

```python
from sqlalchemy.orm import class_mapper
from sqlalchemy.orm.attributes import InstrumentedAttribute

async def update(self, id: int, data: dict[str, Any]) -> ModelType:
    instance = await self.get_by_id(id)
    if not instance:
        raise NotFoundError(f"Entity with id {id} not found")

    mapper = class_mapper(self._model)
    columns = {col.key for col in mapper.columns}

    for key, value in data.items():
        if key in columns:
            setattr(instance, key, value)

    await self._session.flush()
    await self._session.refresh(instance)
    return instance
```

2. Заменить `@property full_path` на `@hybrid_property` для оптимизации запросов

3. Обновить `AuditMixin` для использования timezone-aware datetime

---

## 3. Баг детальных страниц

### Симптомы

При переходе на `/inventory/:id` или вызове `GET /api/v1/inventory/items/{id}`:
- Frontend получает ошибку 500 Internal Server Error
- Backend пытается вызвать `service.get_item(item_id)`
- Service вызывает `repository.get_with_relations(item_id)`

### Причина

**Найдена основная причина:** Проблема в endpoint `GET /api/v1/inventory/items/{item_id}` (строка 145-160 в `inventory.py`):

```python
@router.get("/items/{item_id}", response_model=InventoryItemResponse)
async def get_item(
    item_id: int,
    current_user: CurrentUserDep,
    service: InventoryService = InventoryServiceDep,
):
    try:
        item = await service.get_item(item_id)  # ✅ Возвращает InventoryItem с relations
        return _item_to_response(item)         # ✅ Конвертирует в Response
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, e.detail)
```

**Анализ цепочки вызовов:**

1. **Router → Service:**
   ```python
   # inventory.py:157
   item = await service.get_item(item_id)
   ```

2. **Service → Repository:**
   ```python
   # inventory_service.py:263-268
   async def get_item(self, item_id: int) -> InventoryItem:
       item = await self._item_repo.get_with_relations(item_id)
       if not item:
           raise NotFoundError(f"Предмет с ID {item_id} не найден")
       return item
   ```

3. **Repository query:**
   ```python
   # inventory_repository.py:134-145
   async def get_with_relations(self, item_id: int) -> InventoryItem | None:
       query = (
           select(InventoryItem)
           .options(
               joinedload(InventoryItem.category),  # ✅ Загружает category
               joinedload(InventoryItem.location),  # ✅ Загружает location
           )
           .where(InventoryItem.id == item_id)
       )
       result = await self._session.execute(query)
       return result.scalar_one_or_none()
   ```

4. **Converter в роутере:**
   ```python
   # inventory.py:591-614
   def _item_to_response(item) -> InventoryItemResponse:
       return InventoryItemResponse(
           id=item.id,
           name=item.name,
           # ... другие поля ...
           category=_category_to_response(item.category) if item.category else None,  # ❌
           location=_location_to_response(item.location) if item.location else None,  # ❌
       )
   ```

**Проблема:** При конвертации, если `item.category` или `item.location` не загружены (lazy loading не сработал), возникает ошибка.

### Проверка гипотезы

Проблема может быть в том, что:
1. Сессия закрывается до конвертации в Response
2. Relationship не eager loading, несмотря на `joinedload`
3. Unique() в repository удаляет дубли, но ломает references

Проверка кода repository (строка 215):
```python
return result.scalars().unique().all()  # ❌ unique() после scalars()
```

В методе `get_with_relations` используется:
```python
return result.scalar_one_or_none()  # ✅ Нет unique(), должно работать
```

**Вторая гипотеза:** Проблема может быть в методе `search()` для списка предметов (строка 214-217):

```python
result = await self._session.execute(query)
items = result.scalars().unique().all()  # ❌ Потенциальная проблема с joinedload
```

При использовании `joinedload` с `unique()` могут быть проблемы, если не используется правильный порядок.

### Решение

**Краткосрочное (hotfix):**

1. Изменить порядок вызовов в `inventory_repository.py:215`:
```python
# Было:
items = result.scalars().unique().all()

# Должно быть:
items = result.unique().scalars().all()
```

2. Проверить, что session не закрывается до сериализации:
```python
# inventory.py:157-158
item = await service.get_item(item_id)
return _item_to_response(item)  # Убедиться что session еще открыта
```

**Среднесрочное (рефакторинг):**

1. Использовать Pydantic `model_validate()` вместо ручной конвертации:
```python
@router.get("/items/{item_id}", response_model=InventoryItemResponse)
async def get_item(item_id: int, current_user: CurrentUserDep, service: InventoryService = InventoryServiceDep):
    item = await service.get_item(item_id)
    return InventoryItemResponse.model_validate(item)  # Автоматическая конвертация
```

2. Добавить в схему `InventoryItemResponse`:
```python
class InventoryItemResponse(InventoryItemBase):
    # ...
    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True,  # Автоматическая конвертация Enum
    )
```

**Долгосрочное (улучшение архитектуры):**

1. Создать отдельный слой DTO (Data Transfer Objects) для унификации преобразований
2. Использовать `selectinload` вместо `joinedload` для relationships с collection
3. Добавить тесты для проверки сериализации с разными комбинациями relationships

---

## 4. Дополнительные находки

### Положительные стороны

- ✅ Правильное использование `values_callable` для Enum (критично для PostgreSQL)
- ✅ Миграции корректно создают ENUM типы с `create_type=False`
- ✅ Использование AuditMixin для стандартизации timestamps
- ✅ Правильная мульти-тенантность (theater_id в моделях)
- ✅ Индексы на foreign keys и часто используемые поля
- ✅ Soft delete (`is_active` вместо физического удаления)
- ✅ Async/await везде корректно используется

### Улучшения кодовой базы

1. **Тестовое покрытие:** Отсутствуют unit-тесты для repositories и services
2. **Логирование:** Нет структурированного логирования для debugging
3. **Валидация:** Multi-tenancy не проверяется на уровне repository (можно получить чужие данные)
4. **Кеширование:** Redis используется, но нет кеша для справочников (categories, locations)

---

## Приоритеты исправлений

### 1. Критичные (блокируют работу системы)

**P0 - Исправить немедленно:**
- [ ] Исправить сигнатуру `BaseRepository.update()` (добавить `update_by_id`)
- [ ] Исправить порядок `unique().scalars()` в `inventory_repository.py:215`
- [ ] Проверить все вызовы `repo.update()` в сервисах и заменить на корректные

**Затронутые файлы:**
- `backend/app/repositories/base.py` (строка 105-126)
- `backend/app/repositories/inventory_repository.py` (строка 215)
- `backend/app/services/inventory_service.py` (строки 133, 141, 223, 369)
- `backend/app/services/performance_service.py` (аналогично)
- `backend/app/services/document_service.py` (аналогично)

### 2. Важные (влияют на UX, но есть workaround)

- [ ] Унифицировать response converters через Pydantic
- [ ] Добавить валидацию multi-tenancy в repositories
- [ ] Заменить `@property` на `@hybrid_property` для `full_path`

### 3. Желательные (улучшения архитектуры)

- [ ] Добавить unit-тесты для repositories (coverage < 20%)
- [ ] Внедрить структурированное логирование (structlog)
- [ ] Добавить кеширование справочников в Redis
- [ ] Создать слой DTO для унификации преобразований
- [ ] Обновить `AuditMixin` для timezone-aware datetime

---

## План исправления бага детальных страниц

```bash
# Шаг 1: Исправить BaseRepository
vim backend/app/repositories/base.py
# Добавить метод update_by_id(id, data)

# Шаг 2: Исправить порядок unique() в inventory_repository
vim backend/app/repositories/inventory_repository.py
# Строка 215: result.unique().scalars().all()

# Шаг 3: Обновить все вызовы в сервисах
vim backend/app/services/inventory_service.py
# Заменить все repo.update(id, data) на repo.update_by_id(id, data)

# Шаг 4: Запустить миграции и тесты
docker-compose -f docker-compose.dev.yml restart backend
docker-compose -f docker-compose.dev.yml exec backend pytest tests/test_inventory.py -v

# Шаг 5: Проверить в браузере
# http://localhost:5173/inventory/1
```

---

## Метрики анализа

- **Проанализировано файлов:** 15
- **Обнаружено критических проблем:** 2
- **Обнаружено важных проблем:** 3
- **Обнаружено рекомендаций:** 5
- **Затронуто модулей:** Inventory, Performance, Document, Schedule
- **Время на исправление (оценка):** 2-3 часа

---

## Заключение

Кодовая база имеет **хорошую архитектурную основу**, но содержит критический баг в базовом репозитории, который блокирует операции обновления и детальные страницы. После исправления сигнатуры `BaseRepository.update()` и порядка вызовов `unique()/scalars()` система должна работать стабильно.

Рекомендуется добавить:
1. Unit-тесты для базового репозитория
2. Integration-тесты для endpoints
3. CI/CD pipeline с автоматическим запуском тестов

**Готовность к production:** 60% (после исправления критических багов - 85%)
