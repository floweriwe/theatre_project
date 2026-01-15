# 📚 Theatre API Documentation

Полная документация REST API системы управления театром.

## Содержание

- [Общая информация](#общая-информация)
- [Аутентификация](#аутентификация)
- [Модуль инвентаризации](#модуль-инвентаризации)
- [Модуль документооборота](#модуль-документооборота)
- [Модуль спектаклей](#модуль-спектаклей)
- [Модуль расписания](#модуль-расписания)
- [Коды ошибок](#коды-ошибок)

---

## Общая информация

### Базовый URL

```
Development: http://localhost:8000/api/v1
Production:  https://theatre.example.com/api/v1
```

### Формат данных

- Все запросы и ответы в формате JSON
- Даты в формате ISO 8601: `2025-01-15T10:30:00Z`
- Кодировка UTF-8

### Заголовки запросов

| Заголовок | Значение | Обязательный |
|-----------|----------|--------------|
| `Content-Type` | `application/json` | Да (для POST/PATCH/PUT) |
| `Authorization` | `Bearer <access_token>` | Да (для защищённых эндпоинтов) |
| `Accept-Language` | `ru` / `en` | Нет |

### Пагинация

Все списочные эндпоинты поддерживают пагинацию:

```
GET /api/v1/inventory/items?page=1&limit=20
```

Ответ включает метаданные:

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

---

## Аутентификация

### Регистрация

```http
POST /api/v1/auth/register
```

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "Иван",
  "last_name": "Петров"
}
```

**Ответ (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Иван",
  "last_name": "Петров",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Авторизация (Login)

```http
POST /api/v1/auth/login
```

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Ответ (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Обновление токена

```http
POST /api/v1/auth/refresh
```

**Тело запроса:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Текущий пользователь

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Ответ (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Иван",
  "last_name": "Петров",
  "roles": [
    {
      "code": "tech_director",
      "name": "Технический директор"
    }
  ],
  "permissions": [
    "inventory:view",
    "inventory:create",
    "inventory:edit",
    "documents:view"
  ],
  "theater_id": 1
}
```

### Выход (Logout)

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Модуль инвентаризации

### Права доступа

| Право | Описание |
|-------|----------|
| `inventory:view` | Просмотр инвентаря |
| `inventory:create` | Создание предметов |
| `inventory:edit` | Редактирование предметов |
| `inventory:delete` | Удаление предметов |
| `inventory:write_off` | Списание предметов |

### Категории

#### Список категорий

```http
GET /api/v1/inventory/categories
```

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "Реквизит",
    "code": "props",
    "color": "#3B82F6",
    "items_count": 45
  }
]
```

#### Создание категории

```http
POST /api/v1/inventory/categories
```

**Тело запроса:**
```json
{
  "name": "Костюмы",
  "code": "costumes",
  "color": "#8B5CF6",
  "description": "Театральные костюмы"
}
```

#### Обновление категории

```http
PATCH /api/v1/inventory/categories/{id}
```

#### Удаление категории

```http
DELETE /api/v1/inventory/categories/{id}
```

### Места хранения

#### Список мест хранения

```http
GET /api/v1/inventory/locations
```

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "Основной склад",
    "code": "main-warehouse",
    "address": "Корпус А, этаж -1",
    "items_count": 120
  }
]
```

#### CRUD операции

```http
POST   /api/v1/inventory/locations
PATCH  /api/v1/inventory/locations/{id}
DELETE /api/v1/inventory/locations/{id}
```

### Предметы инвентаря

#### Список предметов

```http
GET /api/v1/inventory/items?category_id=1&status=in_stock&search=шпага&page=1&limit=20
```

**Параметры запроса:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `category_id` | int | Фильтр по категории |
| `location_id` | int | Фильтр по месту хранения |
| `status` | string | Статус: `in_stock`, `reserved`, `in_use`, `repair`, `written_off` |
| `search` | string | Поиск по названию |
| `page` | int | Номер страницы (default: 1) |
| `limit` | int | Элементов на странице (default: 20, max: 100) |

**Ответ:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Шпага театральная",
      "inventory_number": "REQ-2025-00001",
      "description": "Металлическая шпага для дуэльных сцен",
      "category_id": 1,
      "category_name": "Реквизит",
      "location_id": 3,
      "location_name": "Бутафорский цех",
      "status": "in_stock",
      "quantity": 5,
      "purchase_price": 15000.00,
      "current_value": 12000.00,
      "purchase_date": "2024-06-15",
      "created_at": "2025-01-10T14:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

#### Получение предмета

```http
GET /api/v1/inventory/items/{id}
```

#### Создание предмета

```http
POST /api/v1/inventory/items
```

**Тело запроса:**
```json
{
  "name": "Шпага театральная",
  "description": "Металлическая шпага для дуэльных сцен",
  "category_id": 1,
  "location_id": 3,
  "quantity": 5,
  "purchase_price": 15000.00,
  "purchase_date": "2024-06-15",
  "warranty_until": "2026-06-15"
}
```

#### Обновление предмета

```http
PATCH /api/v1/inventory/items/{id}
```

#### Удаление предмета

```http
DELETE /api/v1/inventory/items/{id}
```

### Перемещения

#### Переместить предмет

```http
POST /api/v1/inventory/items/{id}/transfer
```

**Тело запроса:**
```json
{
  "to_location_id": 4,
  "quantity": 2,
  "reason": "Перемещение на сцену для репетиции"
}
```

#### История перемещений

```http
GET /api/v1/inventory/items/{id}/movements
```

**Ответ:**
```json
[
  {
    "id": 1,
    "movement_type": "transfer",
    "from_location_id": 3,
    "from_location_name": "Бутафорский цех",
    "to_location_id": 4,
    "to_location_name": "Сцена (основная)",
    "quantity": 2,
    "reason": "Перемещение на сцену для репетиции",
    "performed_by": "Иван Петров",
    "created_at": "2025-01-15T09:00:00Z"
  }
]
```

### Статистика

```http
GET /api/v1/inventory/stats
```

**Ответ:**
```json
{
  "total_items": 450,
  "total_value": 2500000.00,
  "by_status": {
    "in_stock": 380,
    "reserved": 45,
    "in_use": 20,
    "repair": 5
  },
  "by_category": [
    {"category": "Реквизит", "count": 150},
    {"category": "Костюмы", "count": 200}
  ],
  "recent_movements": 25
}
```

---

## Модуль документооборота

### Права доступа

| Право | Описание |
|-------|----------|
| `documents:view` | Просмотр документов |
| `documents:view_financial` | Просмотр финансовых документов |
| `documents:create` | Создание документов |
| `documents:edit` | Редактирование документов |
| `documents:delete` | Удаление документов |

### Категории документов

```http
GET    /api/v1/documents/categories
POST   /api/v1/documents/categories
PATCH  /api/v1/documents/categories/{id}
DELETE /api/v1/documents/categories/{id}
```

### Теги

```http
GET    /api/v1/documents/tags
POST   /api/v1/documents/tags
DELETE /api/v1/documents/tags/{id}
```

### Документы

#### Список документов

```http
GET /api/v1/documents?category_id=1&status=active&search=договор&page=1&limit=20
```

**Параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `category_id` | int | Фильтр по категории |
| `status` | string | `active`, `archived` |
| `tag_ids` | string | ID тегов через запятую |
| `file_type` | string | `pdf`, `docx`, `xlsx`, etc. |
| `search` | string | Поиск по названию |

#### Загрузка документа

```http
POST /api/v1/documents/upload
Content-Type: multipart/form-data
```

**Параметры формы:**

| Поле | Тип | Описание |
|------|-----|----------|
| `file` | File | Файл документа (max 50MB) |
| `name` | string | Название документа |
| `category_id` | int | ID категории |
| `description` | string | Описание (опционально) |
| `tag_ids` | string | ID тегов через запятую |

**Ответ (201 Created):**
```json
{
  "id": 1,
  "name": "Договор аренды",
  "file_name": "dogovor_arendy.pdf",
  "file_type": "pdf",
  "file_size": 1245678,
  "category_id": 2,
  "category_name": "Договоры",
  "status": "active",
  "current_version": 1,
  "tags": [
    {"id": 1, "name": "Аренда"},
    {"id": 2, "name": "2025"}
  ],
  "created_at": "2025-01-15T11:00:00Z"
}
```

#### Скачивание документа

```http
GET /api/v1/documents/{id}/download
```

#### Новая версия документа

```http
POST /api/v1/documents/{id}/upload-version
Content-Type: multipart/form-data
```

#### Архивация/Восстановление

```http
POST /api/v1/documents/{id}/archive
POST /api/v1/documents/{id}/restore
```

### Статистика документов

```http
GET /api/v1/documents/stats
```

---

## Модуль спектаклей

### Права доступа

| Право | Описание |
|-------|----------|
| `performance:view` | Просмотр спектаклей |
| `performance:create` | Создание спектаклей |
| `performance:edit` | Редактирование спектаклей |

### Спектакли

#### Список спектаклей

```http
GET /api/v1/performances?status=in_repertoire&genre=Комедия&search=ревизор
```

**Параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `status` | string | `preparation`, `in_repertoire`, `paused`, `archived` |
| `genre` | string | Жанр |
| `search` | string | Поиск по названию |

**Ответ:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Ревизор",
      "subtitle": "Комедия в 5 действиях",
      "author": "Н.В. Гоголь",
      "director": "Иван Петров",
      "genre": "Комедия",
      "age_rating": "12+",
      "status": "in_repertoire",
      "duration_minutes": 150,
      "intermissions": 1,
      "premiere_date": "2024-09-15",
      "poster_url": "/storage/performances/1/poster.jpg"
    }
  ],
  "total": 15
}
```

#### Текущий репертуар

```http
GET /api/v1/performances/repertoire
```

#### Создание спектакля

```http
POST /api/v1/performances
```

**Тело запроса:**
```json
{
  "title": "Ревизор",
  "subtitle": "Комедия в 5 действиях",
  "description": "Классическая комедия Н.В. Гоголя...",
  "author": "Н.В. Гоголь",
  "director": "Иван Петров",
  "composer": null,
  "choreographer": null,
  "genre": "Комедия",
  "age_rating": "12+",
  "duration_minutes": 150,
  "intermissions": 1,
  "premiere_date": "2024-09-15"
}
```

#### Управление статусами

```http
POST /api/v1/performances/{id}/to-repertoire  # В репертуар
POST /api/v1/performances/{id}/pause          # На паузу
POST /api/v1/performances/{id}/archive        # В архив
POST /api/v1/performances/{id}/restore        # Восстановить
```

#### Загрузка постера

```http
POST /api/v1/performances/{id}/poster
Content-Type: multipart/form-data
```

**Параметры:**
- `file`: Изображение (PNG, JPEG, WebP, max 5MB)

### Паспорт спектакля (разделы)

#### Список разделов

```http
GET /api/v1/performances/{id}/sections
```

**Ответ:**
```json
[
  {
    "id": 1,
    "section_type": "lighting",
    "title": "Световая партитура",
    "content": "1. Начало спектакля - общий свет 50%...",
    "responsible_id": 5,
    "responsible_name": "Александр Светов",
    "sort_order": 0
  },
  {
    "id": 2,
    "section_type": "sound",
    "title": "Звуковая партитура",
    "content": "Фоновая музыка: трек 1...",
    "sort_order": 1
  }
]
```

**Типы разделов:**
- `lighting` - Свет
- `sound` - Звук
- `scenery` - Декорации
- `props` - Реквизит
- `costumes` - Костюмы
- `makeup` - Грим
- `video` - Видео
- `effects` - Спецэффекты
- `other` - Прочее

#### Создание раздела

```http
POST /api/v1/performances/{id}/sections
```

**Тело:**
```json
{
  "section_type": "lighting",
  "title": "Световая партитура",
  "content": "Описание световых эффектов...",
  "responsible_id": 5
}
```

#### Обновление раздела

```http
PATCH /api/v1/performances/sections/{section_id}
```

### Статистика

```http
GET /api/v1/performances/stats/
```

**Ответ:**
```json
{
  "total": 25,
  "by_status": {
    "preparation": 3,
    "in_repertoire": 15,
    "paused": 2,
    "archived": 5
  },
  "top_genres": [
    {"genre": "Драма", "count": 8},
    {"genre": "Комедия", "count": 6}
  ]
}
```

---

## Модуль расписания

### Права доступа

| Право | Описание |
|-------|----------|
| `schedule:view` | Просмотр расписания |
| `schedule:edit` | Редактирование расписания |

### Календарь

```http
GET /api/v1/schedule/calendar?year=2025&month=1
```

**Ответ:**
```json
{
  "year": 2025,
  "month": 1,
  "days": [
    {
      "date": "2025-01-15",
      "is_today": true,
      "events": [
        {
          "id": 1,
          "title": "Ревизор",
          "event_type": "performance",
          "start_time": "19:00",
          "end_time": "22:00",
          "venue_id": 1,
          "venue_name": "Основная сцена",
          "status": "scheduled"
        },
        {
          "id": 2,
          "title": "Репетиция 'Вишнёвый сад'",
          "event_type": "rehearsal",
          "start_time": "10:00",
          "end_time": "13:00",
          "status": "scheduled"
        }
      ]
    }
  ]
}
```

### События

#### Создание события

```http
POST /api/v1/schedule/events
```

**Тело:**
```json
{
  "title": "Ревизор",
  "event_type": "performance",
  "event_date": "2025-01-20",
  "start_time": "19:00",
  "end_time": "22:00",
  "venue_id": 1,
  "performance_id": 1,
  "description": "Премьерный показ"
}
```

**Типы событий:**
- `performance` - Спектакль
- `rehearsal` - Репетиция
- `technical` - Техническое обслуживание
- `meeting` - Совещание
- `other` - Прочее

#### Обновление события

```http
PATCH /api/v1/schedule/events/{id}
```

#### Удаление события

```http
DELETE /api/v1/schedule/events/{id}
```

### Статистика расписания

```http
GET /api/v1/schedule/stats?year=2025&month=1
```

---

## Коды ошибок

### HTTP статусы

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 201 | Ресурс создан |
| 204 | Успешно, нет содержимого |
| 400 | Неверный запрос |
| 401 | Не авторизован |
| 403 | Доступ запрещён |
| 404 | Ресурс не найден |
| 409 | Конфликт (например, дубликат) |
| 422 | Ошибка валидации |
| 429 | Слишком много запросов |
| 500 | Внутренняя ошибка сервера |

### Формат ошибки

```json
{
  "detail": "Описание ошибки",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "Некорректный формат email"
    }
  ]
}
```

### Коды ошибок приложения

| Код | Описание |
|-----|----------|
| `AUTH_INVALID_CREDENTIALS` | Неверный email или пароль |
| `AUTH_TOKEN_EXPIRED` | Токен истёк |
| `AUTH_TOKEN_INVALID` | Недействительный токен |
| `AUTH_PERMISSION_DENIED` | Недостаточно прав |
| `RESOURCE_NOT_FOUND` | Ресурс не найден |
| `RESOURCE_ALREADY_EXISTS` | Ресурс уже существует |
| `VALIDATION_ERROR` | Ошибка валидации данных |
| `FILE_TOO_LARGE` | Файл слишком большой |
| `FILE_TYPE_NOT_ALLOWED` | Тип файла не разрешён |

---

## Интерактивная документация

После запуска backend доступны:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json
