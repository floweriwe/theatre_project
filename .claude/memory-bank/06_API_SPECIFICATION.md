# Theatre Management System — API Specification

## 🌐 Общие сведения

### Base URL
```
Development: http://localhost:8000/api/v1
Production:  https://api.theatre.local/api/v1
```

### Аутентификация

Все защищённые эндпоинты требуют JWT токен в заголовке:

```http
Authorization: Bearer <access_token>
```

### Формат ответов

```json
// Успешный ответ
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}

// Ошибка
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Описание ошибки",
    "details": { ... }
  }
}
```

### HTTP статусы

| Код | Описание |
|-----|----------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## 🔐 Auth API

### POST /auth/login

Авторизация пользователя

**Request:**
```json
{
  "email": "admin@theatre.local",
  "password": "Theatre2024!"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "admin@theatre.local",
    "full_name": "Администратор",
    "role": "admin",
    "department": null
  }
}
```

### POST /auth/refresh

Обновление access токена

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

### POST /auth/logout

Выход (инвалидация refresh токена)

**Response 204:** No content

### GET /auth/me

Получение текущего пользователя

**Response 200:**
```json
{
  "id": "uuid",
  "email": "admin@theatre.local",
  "full_name": "Администратор",
  "role": "admin",
  "department": null,
  "avatar_url": null,
  "phone": "+7 (999) 123-45-67",
  "notification_settings": {
    "email": false,
    "push": true
  },
  "created_at": "2024-01-01T00:00:00Z",
  "last_login_at": "2024-01-15T10:30:00Z"
}
```

---

## 📦 Inventory API

### GET /inventory

Список предметов инвентаря

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| page | int | Номер страницы (default: 1) |
| per_page | int | Элементов на странице (default: 20, max: 100) |
| search | string | Поиск по названию и описанию |
| category_id | uuid | Фильтр по категории |
| location_id | uuid | Фильтр по локации |
| status | string | Фильтр по статусу |
| department_id | uuid | Фильтр по цеху |
| performance_id | uuid | Только инвентарь спектакля |
| sort_by | string | Поле сортировки (name, created_at, inventory_number) |
| sort_order | string | asc / desc |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "inventory_number": "БСП-РЕК-001",
      "name": "Штоф",
      "description": "Штоф прямоугольной формы из прозрачного стекла",
      "category": {
        "id": "uuid",
        "name": "Реквизит",
        "code": "400_props"
      },
      "location": {
        "id": "uuid",
        "name": "Основной склад",
        "code": "warehouse_main"
      },
      "status": "in_stock",
      "quantity": 2,
      "unit": "шт",
      "main_photo_url": "https://...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  }
}
```

### GET /inventory/{id}

Детали предмета инвентаря

**Response 200:**
```json
{
  "id": "uuid",
  "inventory_number": "БСП-РЕК-001",
  "name": "Штоф",
  "description": "Штоф прямоугольной формы из прозрачного стекла",
  "technical_description": "Габариты (ШхВхГ): 6х26х6 см",
  "category": {
    "id": "uuid",
    "name": "Реквизит",
    "code": "400_props"
  },
  "location": {
    "id": "uuid",
    "name": "Основной склад",
    "code": "warehouse_main"
  },
  "status": "in_stock",
  "quantity": 2,
  "unit": "шт",
  "width": 6,
  "height": 26,
  "depth": 6,
  "weight": null,
  "serial_number": null,
  "manufacturer": null,
  "model": null,
  "purchase_date": null,
  "purchase_price": null,
  "condition": "good",
  "photos": [
    {
      "id": "uuid",
      "url": "https://...",
      "thumbnail_url": "https://...",
      "is_main": true
    }
  ],
  "performances": [
    {
      "id": "uuid",
      "title": "Бесприданница",
      "is_consumable": false
    }
  ],
  "created_by": {
    "id": "uuid",
    "full_name": "Администратор"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### POST /inventory

Создание предмета инвентаря

**Request:**
```json
{
  "inventory_number": "НОВ-001",
  "name": "Новый предмет",
  "description": "Описание",
  "technical_description": "Технические характеристики",
  "category_id": "uuid",
  "location_id": "uuid",
  "status": "in_stock",
  "quantity": 1,
  "unit": "шт",
  "width": 10,
  "height": 20,
  "depth": 5,
  "weight": 0.5,
  "serial_number": null,
  "manufacturer": null,
  "model": null,
  "purchase_date": null,
  "purchase_price": null
}
```

**Response 201:** Created item object

### PUT /inventory/{id}

Обновление предмета инвентаря

**Request:** Аналогично POST (все поля опциональны)

**Response 200:** Updated item object

### DELETE /inventory/{id}

Удаление предмета (soft delete)

**Response 204:** No content

### GET /inventory/{id}/history

История перемещений предмета

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "action": "moved",
      "from_location": {
        "id": "uuid",
        "name": "Основной склад"
      },
      "to_location": {
        "id": "uuid",
        "name": "Основная сцена"
      },
      "performance": {
        "id": "uuid",
        "title": "Бесприданница"
      },
      "comment": "Для спектакля 17.01",
      "created_by": {
        "id": "uuid",
        "full_name": "Матрусова Н.А."
      },
      "created_at": "2024-01-16T10:00:00Z"
    }
  ]
}
```

### GET /inventory/{id}/schedule

Расписание использования предмета

**Response 200:**
```json
{
  "data": [
    {
      "event_id": "uuid",
      "event_title": "Бесприданница",
      "event_type": "performance",
      "start_time": "2024-01-17T19:00:00Z",
      "end_time": "2024-01-17T22:00:00Z",
      "venue": "Основная сцена"
    }
  ]
}
```

### POST /inventory/{id}/photos

Загрузка фото предмета

**Request:** multipart/form-data
- file: image file (jpg, png, webp)
- is_main: boolean (optional)

**Response 201:**
```json
{
  "id": "uuid",
  "url": "https://...",
  "thumbnail_url": "https://...",
  "is_main": true
}
```

### DELETE /inventory/{id}/photos/{photo_id}

Удаление фото

**Response 204:** No content

### GET /inventory/categories

Список категорий инвентаря

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Мягкие декорации",
      "code": "100_soft_decor",
      "parent_id": null,
      "department": {
        "id": "uuid",
        "name": "МДЦ"
      },
      "children": [
        {
          "id": "uuid",
          "name": "Половики",
          "code": "100_soft_decor_floors"
        }
      ]
    }
  ]
}
```

### GET /inventory/locations

Список локаций хранения

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Основной склад",
      "code": "warehouse_main",
      "type": "warehouse",
      "is_active": true
    }
  ]
}
```

### GET /inventory/analytics

Аналитика использования оборудования

**Query Parameters:**
- period: month / quarter / year
- category_id: uuid (optional)
- min_price: decimal (фильтр по стоимости)

**Response 200:**
```json
{
  "data": [
    {
      "item": {
        "id": "uuid",
        "inventory_number": "СВЕТ-001",
        "name": "Проектор Panasonic PT-RZ120",
        "purchase_price": 13000000
      },
      "usage_count": 8,
      "usage_percentage": 27,
      "performances": [
        {
          "id": "uuid",
          "title": "Бесприданница",
          "count": 4
        },
        {
          "id": "uuid",
          "title": "Женитьба",
          "count": 3
        }
      ],
      "last_used": "2024-01-15T19:00:00Z"
    }
  ]
}
```

---

## 🎭 Performances API

### GET /performances

Список спектаклей

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| status | string | Фильтр по статусу |
| search | string | Поиск по названию |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Бесприданница",
      "author": "А.Н. Островский",
      "status": "active",
      "premiere_date": "2023-12-15",
      "poster_url": "https://...",
      "duration": 150,
      "next_show": "2024-01-17T19:00:00Z"
    }
  ]
}
```

### GET /performances/{id}

Детали спектакля

**Response 200:**
```json
{
  "id": "uuid",
  "title": "Бесприданница",
  "author": "А.Н. Островский",
  "director": "Художественный руководитель",
  "artist": "Главный художник",
  "composer": null,
  "description": "Драма в 4-х действиях",
  "premiere_date": "2023-12-15",
  "status": "active",
  "poster_url": "https://...",
  "video_url": "https://...",
  "duration": 150,
  "intermission_count": 1,
  "inventory_count": 45,
  "documents_count": 23,
  "upcoming_shows": [
    {
      "id": "uuid",
      "date": "2024-01-17T19:00:00Z",
      "venue": "Основная сцена"
    }
  ],
  "condition_history": [
    {
      "year": 2023,
      "condition": "good"
    },
    {
      "year": 2024,
      "condition": "good"
    }
  ],
  "created_at": "2023-10-01T00:00:00Z"
}
```

### POST /performances

Создание спектакля

**Request:**
```json
{
  "title": "Новый спектакль",
  "author": "Автор",
  "director": "Режиссёр",
  "artist": "Художник",
  "description": "Описание",
  "premiere_date": "2024-06-01",
  "duration": 120,
  "intermission_count": 1
}
```

**Response 201:** Created performance object

### PUT /performances/{id}

Обновление спектакля

### DELETE /performances/{id}

Архивирование спектакля

---

### Passport API (вложенный в Performances)

### GET /performances/{id}/passport

Структура паспорта спектакля

**Response 200:**
```json
{
  "performance_id": "uuid",
  "sections": [
    {
      "id": "uuid",
      "code": "1.0",
      "title": "Общая часть",
      "description": null,
      "department": null,
      "documents_count": 5,
      "children": [
        {
          "id": "uuid",
          "code": "1.1",
          "title": "Титульный лист",
          "documents_count": 1
        }
      ]
    }
  ]
}
```

### GET /performances/{id}/passport/sections/{section_id}

Детали раздела с документами

**Response 200:**
```json
{
  "id": "uuid",
  "code": "3.3",
  "title": "Монтировочная опись декораций",
  "department": {
    "id": "uuid",
    "name": "МДЦ"
  },
  "documents": [
    {
      "id": "uuid",
      "title": "Монтировочная опись Бесприданница",
      "file_name": "3_3_montazh_bespridannitsa.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "version": 2,
      "uploaded_by": {
        "id": "uuid",
        "full_name": "Бакулина А.Д."
      },
      "created_at": "2023-11-15T00:00:00Z"
    }
  ]
}
```

### POST /performances/{id}/passport/sections

Добавление раздела в паспорт

**Request:**
```json
{
  "code": "3.15",
  "title": "Новый раздел",
  "parent_id": "uuid",
  "department_id": "uuid"
}
```

---

### Performance Inventory API

### GET /performances/{id}/inventory

Инвентарь спектакля

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "inventory_item": {
        "id": "uuid",
        "inventory_number": "БСП-РЕК-001",
        "name": "Штоф",
        "main_photo_url": "https://..."
      },
      "quantity": 2,
      "is_consumable": false,
      "notes": "Используется в 2-м акте"
    }
  ],
  "consumables": [
    {
      "name": "Напиток безалкогольный",
      "quantity": "4 л"
    }
  ]
}
```

### POST /performances/{id}/inventory

Привязка инвентаря к спектаклю

**Request:**
```json
{
  "inventory_item_id": "uuid",
  "quantity": 1,
  "is_consumable": false,
  "notes": "Примечание"
}
```

### DELETE /performances/{id}/inventory/{item_id}

Отвязка инвентаря

---

### Performance Checklists API

### GET /performances/{id}/checklists

Чеклисты готовности

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Проверка декораций",
      "department": {
        "id": "uuid",
        "name": "МДЦ"
      },
      "items": [
        {
          "id": "uuid",
          "title": "Стены смонтированы",
          "is_completed": true,
          "completed_by": {
            "id": "uuid",
            "full_name": "Шутов Д.И."
          },
          "completed_at": "2024-01-16T14:00:00Z"
        }
      ],
      "progress": 80
    }
  ]
}
```

### POST /performances/{id}/checklists

Создание чеклиста

**Request:**
```json
{
  "title": "Проверка света",
  "department_id": "uuid",
  "items": [
    { "title": "Прожекторы установлены" },
    { "title": "Программа загружена" }
  ]
}
```

### PUT /performances/{id}/checklists/{checklist_id}/items/{item_id}

Отметка пункта чеклиста

**Request:**
```json
{
  "is_completed": true
}
```

---

## 📅 Schedule API

### GET /schedule

Получение событий расписания

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| start_date | date | Начало периода (обязательно) |
| end_date | date | Конец периода (обязательно) |
| venue_id | uuid | Фильтр по площадке |
| event_type | string | Фильтр по типу |
| performance_id | uuid | Фильтр по спектаклю |
| user_id | uuid | События с участием пользователя |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Бесприданница",
      "event_type": "performance",
      "start_time": "2024-01-17T19:00:00Z",
      "end_time": "2024-01-17T22:00:00Z",
      "venue": {
        "id": "uuid",
        "name": "Основная сцена",
        "code": "main_stage"
      },
      "performance": {
        "id": "uuid",
        "title": "Бесприданница"
      },
      "status": "confirmed",
      "stage_ready_time": "18:00",
      "participants_count": 12,
      "participants_confirmed": 10
    }
  ]
}
```

### GET /schedule/{id}

Детали события

**Response 200:**
```json
{
  "id": "uuid",
  "title": "Бесприданница",
  "description": null,
  "event_type": "performance",
  "start_time": "2024-01-17T19:00:00Z",
  "end_time": "2024-01-17T22:00:00Z",
  "venue": {
    "id": "uuid",
    "name": "Основная сцена"
  },
  "performance": {
    "id": "uuid",
    "title": "Бесприданница"
  },
  "status": "confirmed",
  "stage_ready_time": "18:00",
  "notes": null,
  "participants": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "full_name": "Анисимов Е.С.",
        "avatar_url": null
      },
      "role": "Паратов",
      "status": "confirmed",
      "confirmed_at": "2024-01-10T12:00:00Z"
    }
  ],
  "inventory": [
    {
      "id": "uuid",
      "inventory_number": "СВЕТ-001",
      "name": "Проектор Panasonic",
      "quantity": 1
    }
  ],
  "created_by": {
    "id": "uuid",
    "full_name": "Бакулина А.Д."
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

### POST /schedule

Создание события

**Request:**
```json
{
  "title": "Репетиция",
  "event_type": "rehearsal",
  "start_time": "2024-01-20T10:00:00Z",
  "end_time": "2024-01-20T14:00:00Z",
  "venue_id": "uuid",
  "performance_id": "uuid",
  "notes": "Прогон 2-го акта",
  "participants": [
    {
      "user_id": "uuid",
      "role": "Паратов"
    }
  ]
}
```

**Response 201:** Created event object

### PUT /schedule/{id}

Обновление события

### DELETE /schedule/{id}

Удаление события

---

### Participants API

### POST /schedule/{id}/participants

Добавление участника

**Request:**
```json
{
  "user_id": "uuid",
  "role": "Лариса"
}
```

### DELETE /schedule/{id}/participants/{user_id}

Удаление участника

### PUT /schedule/{id}/participants/{user_id}/status

Изменение статуса участника (планировщиком)

**Request:**
```json
{
  "status": "confirmed"
}
```

### POST /schedule/{id}/confirm

Подтверждение участия (самим участником)

**Response 200:**
```json
{
  "status": "confirmed",
  "confirmed_at": "2024-01-15T10:00:00Z"
}
```

### POST /schedule/{id}/decline

Отклонение участия (самим участником)

**Request:**
```json
{
  "reason": "Болен"
}
```

---

### Conflicts API

### GET /schedule/conflicts

Проверка конфликтов

**Query Parameters:**
- start_time: datetime
- end_time: datetime
- venue_id: uuid
- user_ids: array[uuid]
- inventory_ids: array[uuid]
- exclude_event_id: uuid (при редактировании)

**Response 200:**
```json
{
  "has_conflicts": true,
  "conflicts": [
    {
      "type": "venue",
      "message": "Площадка занята",
      "conflicting_event": {
        "id": "uuid",
        "title": "Технические работы"
      }
    },
    {
      "type": "participant",
      "message": "Участник занят в другом событии",
      "user": {
        "id": "uuid",
        "full_name": "Анисимов Е.С."
      },
      "conflicting_event": {
        "id": "uuid",
        "title": "Репетиция"
      }
    }
  ]
}
```

### GET /schedule/venues

Список площадок

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Основная сцена",
      "code": "main_stage",
      "type": "stage",
      "capacity": 500,
      "is_active": true
    }
  ]
}
```

---

## 📄 Documents API

### GET /documents

Список документов

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| category | string | Фильтр по категории |
| department_id | uuid | Фильтр по цеху |
| performance_id | uuid | Документы спектакля |
| search | string | Поиск по названию |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Монтировочная опись Бесприданница",
      "category": "technical_spec",
      "department": {
        "id": "uuid",
        "name": "МДЦ"
      },
      "performance": {
        "id": "uuid",
        "title": "Бесприданница"
      },
      "file_name": "3_3_montazh.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "version": 2,
      "uploaded_by": {
        "id": "uuid",
        "full_name": "Бакулина А.Д."
      },
      "created_at": "2023-11-15T00:00:00Z"
    }
  ]
}
```

### GET /documents/{id}

Метаданные документа

### GET /documents/{id}/download

Скачивание документа

**Response:** File stream with appropriate Content-Type

### GET /documents/{id}/preview

Превью документа (для PDF и изображений)

**Response:** Rendered preview or redirect to file

### POST /documents

Загрузка документа

**Request:** multipart/form-data
- file: файл
- title: string
- category: string
- department_id: uuid (optional)
- performance_id: uuid (optional)
- description: string (optional)

**Response 201:** Created document object

### POST /documents/{id}/versions

Загрузка новой версии документа

**Request:** multipart/form-data
- file: файл

**Response 201:**
```json
{
  "id": "uuid",
  "version": 2,
  "previous_version": {
    "id": "uuid",
    "version": 1
  }
}
```

### GET /documents/{id}/versions

История версий документа

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "version": 2,
      "file_size": 1024000,
      "uploaded_by": {
        "id": "uuid",
        "full_name": "Бакулина А.Д."
      },
      "created_at": "2024-01-15T00:00:00Z"
    },
    {
      "id": "uuid",
      "version": 1,
      "file_size": 980000,
      "uploaded_by": {
        "id": "uuid",
        "full_name": "Бакулина А.Д."
      },
      "created_at": "2023-11-15T00:00:00Z"
    }
  ]
}
```

### DELETE /documents/{id}

Удаление документа

---

## ✅ Tasks API

### GET /tasks

Список задач

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| status | string | Фильтр по статусу |
| priority | string | Фильтр по приоритету |
| assignee_id | uuid | Задачи исполнителя |
| department_id | uuid | Задачи цеха |
| performance_id | uuid | Задачи спектакля |
| created_by | uuid | Созданные пользователем |
| overdue | boolean | Только просроченные |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Проверить кольт с дымом",
      "status": "in_progress",
      "priority": "high",
      "deadline": "2024-01-17T18:00:00Z",
      "performance": {
        "id": "uuid",
        "title": "Бесприданница"
      },
      "department": {
        "id": "uuid",
        "name": "Костюмерный цех"
      },
      "assignee": {
        "id": "uuid",
        "full_name": "Матрусова Н.А."
      },
      "subtasks_progress": {
        "completed": 2,
        "total": 3
      },
      "is_overdue": false,
      "created_at": "2024-01-10T00:00:00Z"
    }
  ]
}
```

### GET /tasks/{id}

Детали задачи

**Response 200:**
```json
{
  "id": "uuid",
  "title": "Проверить кольт с дымом",
  "description": "Проверить систему выпускания дыма, заправить жидкость",
  "status": "in_progress",
  "priority": "high",
  "deadline": "2024-01-17T18:00:00Z",
  "event_date": "2024-01-17",
  "performance": {
    "id": "uuid",
    "title": "Бесприданница"
  },
  "department": {
    "id": "uuid",
    "name": "Костюмерный цех"
  },
  "assignee": {
    "id": "uuid",
    "full_name": "Матрусова Н.А."
  },
  "subtasks": [
    {
      "id": "uuid",
      "title": "Проверить механизм кнопки",
      "is_completed": true,
      "completed_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "title": "Заправить жидкость",
      "is_completed": true,
      "completed_at": "2024-01-15T11:00:00Z"
    },
    {
      "id": "uuid",
      "title": "Тестовый запуск",
      "is_completed": false
    }
  ],
  "attachments": [],
  "comments": [
    {
      "id": "uuid",
      "content": "Заказала жидкость, привезут завтра",
      "author": {
        "id": "uuid",
        "full_name": "Матрусова Н.А."
      },
      "created_at": "2024-01-14T14:00:00Z"
    }
  ],
  "created_by": {
    "id": "uuid",
    "full_name": "Бакулина А.Д."
  },
  "created_at": "2024-01-10T00:00:00Z",
  "completed_at": null
}
```

### POST /tasks

Создание задачи

**Request:**
```json
{
  "title": "Новая задача",
  "description": "Описание",
  "performance_id": "uuid",
  "department_id": "uuid",
  "assignee_id": "uuid",
  "deadline": "2024-01-20T18:00:00Z",
  "priority": "medium",
  "subtasks": [
    { "title": "Подзадача 1" },
    { "title": "Подзадача 2" }
  ]
}
```

### PUT /tasks/{id}

Обновление задачи

### PUT /tasks/{id}/status

Изменение статуса задачи

**Request:**
```json
{
  "status": "completed"
}
```

### DELETE /tasks/{id}

Удаление задачи

---

### Subtasks API

### POST /tasks/{id}/subtasks

Добавление подзадачи

**Request:**
```json
{
  "title": "Новая подзадача"
}
```

### PUT /tasks/{id}/subtasks/{subtask_id}

Обновление подзадачи (отметка выполнения)

**Request:**
```json
{
  "is_completed": true
}
```

### DELETE /tasks/{id}/subtasks/{subtask_id}

Удаление подзадачи

---

### Comments API

### POST /tasks/{id}/comments

Добавление комментария

**Request:**
```json
{
  "content": "Текст комментария"
}
```

---

## 🔔 Notifications API

### GET /notifications

Список уведомлений текущего пользователя

**Query Parameters:**
- is_read: boolean
- limit: int (default: 20)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "event_assigned",
      "title": "Вас добавили в событие",
      "message": "Вы назначены на репетицию \"Бесприданница\" 17.01",
      "entity_type": "event",
      "entity_id": "uuid",
      "is_read": false,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "unread_count": 5
}
```

### GET /notifications/unread-count

Количество непрочитанных уведомлений

**Response 200:**
```json
{
  "count": 5
}
```

### PUT /notifications/{id}/read

Отметить уведомление как прочитанное

### PUT /notifications/read-all

Отметить все уведомления как прочитанные

### DELETE /notifications/{id}

Удалить уведомление

### GET /notifications/settings

Настройки уведомлений пользователя

**Response 200:**
```json
{
  "event_assigned": true,
  "event_reminder": true,
  "task_assigned": true,
  "task_overdue": true,
  "schedule_conflict": true
}
```

### PUT /notifications/settings

Обновить настройки уведомлений

---

## 📁 Files API

### POST /files/upload

Загрузка файла

**Request:** multipart/form-data
- file: файл
- bucket: string (documents, photos, media)

**Response 201:**
```json
{
  "id": "uuid",
  "file_path": "photos/inventory/uuid/main.jpg",
  "url": "https://...",
  "thumbnail_url": "https://...",
  "file_size": 1024000,
  "mime_type": "image/jpeg"
}
```

### GET /files/{id}

Скачивание файла

### DELETE /files/{id}

Удаление файла

---

## 👤 Users API (Admin)

### GET /users

Список пользователей (только admin)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "actor1@theatre.local",
      "full_name": "Анисимов Е.С.",
      "role": "actor",
      "department": null,
      "is_active": true,
      "last_login_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /users

Создание пользователя

### PUT /users/{id}

Обновление пользователя

### DELETE /users/{id}

Деактивация пользователя

---

## 🏢 Departments API

### GET /departments

Список цехов

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Осветительный цех",
      "code": "light",
      "head": {
        "id": "uuid",
        "full_name": "Баскаков М.А."
      },
      "members_count": 5
    }
  ]
}
```

---

*Документ обновлён: Январь 2026*
*Версия: 1.0*
