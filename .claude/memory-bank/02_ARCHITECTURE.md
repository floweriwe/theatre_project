# Theatre Management System — Архитектура

## 🏗️ Обзор архитектуры

### Микросервисная архитектура

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NGINX (Reverse Proxy)                           │
│                           Port 80/443 (production)                           │
├────────────────────────────────┬────────────────────────────────────────────┤
│                                │                                            │
│   ┌────────────────────────┐   │   ┌────────────────────────────────────┐   │
│   │   Frontend (React)     │   │   │      API Gateway (FastAPI)         │   │
│   │   Port: 5173 (dev)     │   │   │      Port: 8000                    │   │
│   │   Static files (prod)  │   │   │      /api/v1/*                     │   │
│   └────────────────────────┘   │   └──────────────┬─────────────────────┘   │
│                                │                  │                         │
├────────────────────────────────┴──────────────────┼─────────────────────────┤
│                        INTERNAL SERVICE MESH                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │Auth Service │ │ Inventory   │ │Performances │ │ Schedule    │           │
│  │  (internal) │ │  Service    │ │  Service    │ │  Service    │           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘           │
│         │               │               │               │                   │
│  ┌──────┴───────┐ ┌─────┴─────┐ ┌───────┴───────┐ ┌─────┴─────┐           │
│  │ Documents    │ │  Tasks    │ │ Notifications │ │  Files    │           │
│  │  Service     │ │  Service  │ │   Service     │ │  Service  │           │
│  └──────────────┘ └───────────┘ └───────────────┘ └───────────┘           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           DATA LAYER                                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │   PostgreSQL   │  │     Redis      │  │     MinIO      │                │
│  │   Port: 5432   │  │   Port: 6379   │  │   Port: 9000   │                │
│  │   (Primary DB) │  │ (Cache/Queue)  │  │  (File Store)  │                │
│  └────────────────┘  └────────────────┘  └────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📦 Сервисы

### 1. API Gateway

**Ответственность**: Единая точка входа для всех API запросов

```python
# Роутинг
/api/v1/auth/*        → Auth Service
/api/v1/inventory/*   → Inventory Service
/api/v1/performances/* → Performances Service
/api/v1/schedule/*    → Schedule Service
/api/v1/documents/*   → Documents Service
/api/v1/tasks/*       → Tasks Service
/api/v1/notifications/* → Notifications Service
/api/v1/files/*       → Files Service
```

**Функции**:
- JWT валидация
- Rate limiting
- Request logging
- CORS handling
- Error transformation

### 2. Auth Service

**Ответственность**: Аутентификация и авторизация

**Эндпоинты**:
```
POST /auth/login          # Вход
POST /auth/refresh        # Обновление токена
POST /auth/logout         # Выход
GET  /auth/me             # Текущий пользователь
```

**Модели**:
- User
- UserRole
- RefreshToken

### 3. Inventory Service

**Ответственность**: Управление инвентарём

**Эндпоинты**:
```
GET    /inventory                    # Список с пагинацией и фильтрами
GET    /inventory/{id}               # Детали предмета
POST   /inventory                    # Создание
PUT    /inventory/{id}               # Обновление
DELETE /inventory/{id}               # Удаление (soft delete)
GET    /inventory/{id}/history       # История перемещений
GET    /inventory/{id}/schedule      # Расписание использования
GET    /inventory/categories         # Категории
GET    /inventory/locations          # Локации
POST   /inventory/{id}/photos        # Загрузка фото
GET    /inventory/analytics          # Аналитика использования
```

### 4. Performances Service

**Ответственность**: Спектакли и паспорта

**Эндпоинты**:
```
GET    /performances                  # Список спектаклей
GET    /performances/{id}             # Детали спектакля
POST   /performances                  # Создание
PUT    /performances/{id}             # Обновление
DELETE /performances/{id}             # Архивирование

# Паспорт спектакля
GET    /performances/{id}/passport              # Структура паспорта
GET    /performances/{id}/passport/sections     # Разделы
POST   /performances/{id}/passport/sections     # Добавление раздела
PUT    /performances/{id}/passport/sections/{section_id}

# Инвентарь спектакля
GET    /performances/{id}/inventory             # Привязанный инвентарь
POST   /performances/{id}/inventory             # Привязка инвентаря
DELETE /performances/{id}/inventory/{item_id}   # Отвязка

# Чеклисты
GET    /performances/{id}/checklists            # Чеклисты готовности
POST   /performances/{id}/checklists            # Создание чеклиста
PUT    /performances/{id}/checklists/{checklist_id}
```

### 5. Schedule Service

**Ответственность**: Расписание и события

**Эндпоинты**:
```
GET    /schedule                      # События с фильтрами по датам
GET    /schedule/{id}                 # Детали события
POST   /schedule                      # Создание события
PUT    /schedule/{id}                 # Обновление
DELETE /schedule/{id}                 # Удаление

# Участники
GET    /schedule/{id}/participants    # Список участников
POST   /schedule/{id}/participants    # Добавление участника
DELETE /schedule/{id}/participants/{user_id}
PUT    /schedule/{id}/participants/{user_id}/status  # Изменение статуса

# Подтверждение участия
POST   /schedule/{id}/confirm         # Подтвердить участие
POST   /schedule/{id}/decline         # Отклонить с комментарием

# Конфликты
GET    /schedule/conflicts            # Проверка конфликтов
GET    /schedule/availability         # Доступность площадки/участников

# Площадки
GET    /schedule/venues               # Список площадок
```

### 6. Documents Service

**Ответственность**: Управление документами

**Эндпоинты**:
```
GET    /documents                     # Список документов
GET    /documents/{id}                # Метаданные документа
POST   /documents                     # Загрузка документа
PUT    /documents/{id}                # Обновление метаданных
DELETE /documents/{id}                # Удаление
GET    /documents/{id}/download       # Скачивание
GET    /documents/{id}/preview        # Превью (для PDF/изображений)

# Версии
GET    /documents/{id}/versions       # История версий
POST   /documents/{id}/versions       # Загрузка новой версии
GET    /documents/{id}/versions/{version_id}/download

# Категории
GET    /documents/categories          # Категории документов
```

### 7. Tasks Service

**Ответственность**: Задачи и подзадачи

**Эндпоинты**:
```
GET    /tasks                         # Список задач с фильтрами
GET    /tasks/{id}                    # Детали задачи
POST   /tasks                         # Создание
PUT    /tasks/{id}                    # Обновление
DELETE /tasks/{id}                    # Удаление
PUT    /tasks/{id}/status             # Изменение статуса

# Подзадачи (чеклист внутри задачи)
GET    /tasks/{id}/subtasks
POST   /tasks/{id}/subtasks
PUT    /tasks/{id}/subtasks/{subtask_id}
DELETE /tasks/{id}/subtasks/{subtask_id}

# Комментарии
GET    /tasks/{id}/comments
POST   /tasks/{id}/comments
```

### 8. Notifications Service

**Ответственность**: In-app уведомления

**Эндпоинты**:
```
GET    /notifications                 # Список уведомлений пользователя
GET    /notifications/unread-count    # Количество непрочитанных
PUT    /notifications/{id}/read       # Отметить как прочитанное
PUT    /notifications/read-all        # Отметить все как прочитанные
DELETE /notifications/{id}            # Удалить уведомление
GET    /notifications/settings        # Настройки уведомлений
PUT    /notifications/settings        # Обновить настройки
```

### 9. Files Service

**Ответственность**: Хранение и обработка файлов (MinIO)

**Эндпоинты**:
```
POST   /files/upload                  # Загрузка файла
GET    /files/{id}                    # Скачивание
GET    /files/{id}/thumbnail          # Превью изображения
DELETE /files/{id}                    # Удаление
```

---

## 🗄️ Data Layer

### PostgreSQL

**Основная база данных**

```yaml
Version: 16+
Port: 5432
Databases:
  - theatre_main     # Основная БД
  - theatre_test     # Тестовая БД

Extensions:
  - uuid-ossp        # Генерация UUID
  - pgcrypto         # Шифрование
```

### Redis

**Кэширование и очереди**

```yaml
Version: 7+
Port: 6379
Usage:
  - Session storage (JWT refresh tokens)
  - Cache (списки, справочники)
  - Rate limiting counters
  - Pub/Sub для уведомлений
  
Key patterns:
  - session:{user_id}           # Сессии
  - cache:inventory:list        # Кэш списка инвентаря
  - cache:categories            # Кэш категорий
  - ratelimit:{ip}:{endpoint}   # Rate limiting
  - notifications:{user_id}     # Очередь уведомлений
```

### MinIO

**Файловое хранилище (S3-compatible)**

```yaml
Version: latest
Port: 9000 (API), 9001 (Console)

Buckets:
  - theatre-documents    # Документы
  - theatre-photos       # Фото инвентаря
  - theatre-media        # Аудио/видео
  - theatre-temp         # Временные файлы
  
Структура:
  theatre-photos/
    ├── inventory/
    │   ├── {inventory_id}/
    │   │   ├── main.jpg
    │   │   ├── thumb.jpg
    │   │   └── {photo_id}.jpg
    
  theatre-documents/
    ├── performances/
    │   ├── {performance_id}/
    │   │   ├── passport/
    │   │   │   ├── 1.0/{files}
    │   │   │   ├── 2.0/{files}
    │   │   │   └── 3.0/{files}
    ├── general/
    │   └── {document_id}/
```

---

## 🐳 Docker Compose

### Development (docker-compose.dev.yml)

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1
    depends_on:
      - backend

  # Backend (API Gateway + Services)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app:/app/app
      - ./backend/alembic:/app/alembic
    environment:
      - DATABASE_URL=postgresql+asyncpg://theatre:theatre@postgres:5432/theatre_main
      - REDIS_URL=redis://redis:6379/0
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - JWT_SECRET_KEY=dev-secret-key-change-in-production
      - CORS_ORIGINS=http://localhost:5173,http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_started
    command: >
      sh -c "alembic upgrade head && 
             uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=theatre
      - POSTGRES_PASSWORD=theatre
      - POSTGRES_DB=theatre_main
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U theatre -d theatre_main"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # MinIO
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  # MinIO setup (создание бакетов)
  minio-setup:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 5;
      mc alias set myminio http://minio:9000 minioadmin minioadmin;
      mc mb myminio/theatre-documents --ignore-existing;
      mc mb myminio/theatre-photos --ignore-existing;
      mc mb myminio/theatre-media --ignore-existing;
      mc mb myminio/theatre-temp --ignore-existing;
      mc anonymous set download myminio/theatre-photos;
      exit 0;
      "

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  default:
    name: theatre-network
```

### Production (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    # В production frontend собирается и раздаётся через nginx

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    expose:
      - "8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      - postgres
      - redis
      - minio
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      placement:
        constraints:
          - node.role == manager

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  minio:
    image: minio/minio:latest
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    command: server /data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

## 📁 Структура проекта

```
theatre-management-system/
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── README.md
│
├── backend/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── pyproject.toml
│   ├── alembic.ini
│   │
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application
│   │   ├── config.py               # Settings (Pydantic)
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py             # Dependencies (get_db, get_current_user)
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py       # Main router
│   │   │       ├── auth.py
│   │   │       ├── inventory.py
│   │   │       ├── performances.py
│   │   │       ├── schedule.py
│   │   │       ├── documents.py
│   │   │       ├── tasks.py
│   │   │       ├── notifications.py
│   │   │       └── files.py
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py         # JWT, password hashing
│   │   │   ├── permissions.py      # RBAC
│   │   │   ├── exceptions.py       # Custom exceptions
│   │   │   └── constants.py        # Enums, constants
│   │   │
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── base.py             # Base model
│   │   │   └── session.py          # Session factory
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── inventory.py
│   │   │   ├── performance.py
│   │   │   ├── schedule.py
│   │   │   ├── document.py
│   │   │   ├── task.py
│   │   │   └── notification.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── inventory.py
│   │   │   ├── performance.py
│   │   │   ├── schedule.py
│   │   │   ├── document.py
│   │   │   ├── task.py
│   │   │   └── notification.py
│   │   │
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── user_repository.py
│   │   │   ├── inventory_repository.py
│   │   │   ├── performance_repository.py
│   │   │   ├── schedule_repository.py
│   │   │   ├── document_repository.py
│   │   │   ├── task_repository.py
│   │   │   └── notification_repository.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── inventory_service.py
│   │   │   ├── performance_service.py
│   │   │   ├── schedule_service.py
│   │   │   ├── document_service.py
│   │   │   ├── task_service.py
│   │   │   ├── notification_service.py
│   │   │   ├── file_service.py       # MinIO operations
│   │   │   └── redis_service.py      # Cache operations
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py
│   │
│   ├── scripts/
│   │   ├── __init__.py
│   │   ├── init_db.py              # Initialize DB + seed data
│   │   ├── seed_data.py            # Generate test data
│   │   └── create_superuser.py
│   │
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_inventory.py
│       └── ...
│
├── frontend/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       │
│       ├── assets/
│       │   ├── fonts/
│       │   └── images/
│       │
│       ├── components/
│       │   ├── ui/                 # UI-kit
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── Table.tsx
│       │   │   ├── Tabs.tsx
│       │   │   ├── Calendar.tsx
│       │   │   ├── Toast.tsx
│       │   │   ├── Skeleton.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Dropdown.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── layout/
│       │   │   ├── MainLayout.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   └── index.ts
│       │   │
│       │   └── features/
│       │       ├── inventory/
│       │       │   ├── InventoryCard.tsx
│       │       │   ├── InventoryFilters.tsx
│       │       │   ├── InventoryGrid.tsx
│       │       │   └── index.ts
│       │       │
│       │       ├── schedule/
│       │       │   ├── CalendarView.tsx
│       │       │   ├── EventCard.tsx
│       │       │   ├── EventFormModal.tsx
│       │       │   └── index.ts
│       │       │
│       │       ├── tasks/
│       │       │   ├── TaskCard.tsx
│       │       │   ├── TaskChecklist.tsx
│       │       │   └── index.ts
│       │       │
│       │       └── notifications/
│       │           ├── NotificationCenter.tsx
│       │           └── index.ts
│       │
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── LoginPage.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── dashboard/
│       │   │   ├── DashboardPage.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── inventory/
│       │   │   ├── InventoryListPage.tsx
│       │   │   ├── InventoryItemPage.tsx
│       │   │   ├── InventoryFormPage.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── performances/
│       │   │   ├── PerformancesListPage.tsx
│       │   │   ├── PerformanceViewPage.tsx
│       │   │   ├── PerformanceFormPage.tsx
│       │   │   ├── PassportPage.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── schedule/
│       │   │   ├── SchedulePage.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── documents/
│       │   │   ├── DocumentsListPage.tsx
│       │   │   ├── DocumentViewPage.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── tasks/
│       │   │   ├── TasksListPage.tsx
│       │   │   ├── TaskDetailPage.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── admin/
│       │   │   ├── UsersListPage.tsx
│       │   │   ├── UserDetailPage.tsx
│       │   │   └── index.ts
│       │   │
│       │   └── error/
│       │       ├── NotFoundPage.tsx
│       │       └── index.ts
│       │
│       ├── services/
│       │   ├── api.ts              # Axios instance
│       │   ├── auth_service.ts
│       │   ├── inventory_service.ts
│       │   ├── performance_service.ts
│       │   ├── schedule_service.ts
│       │   ├── document_service.ts
│       │   ├── task_service.ts
│       │   ├── notification_service.ts
│       │   └── index.ts
│       │
│       ├── store/
│       │   ├── authStore.ts
│       │   ├── uiStore.ts
│       │   └── index.ts
│       │
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useInventory.ts
│       │   ├── useNotifications.ts
│       │   └── index.ts
│       │
│       ├── types/
│       │   ├── auth_types.ts
│       │   ├── inventory_types.ts
│       │   ├── performance_types.ts
│       │   ├── schedule_types.ts
│       │   ├── document_types.ts
│       │   ├── task_types.ts
│       │   ├── notification_types.ts
│       │   ├── common_types.ts
│       │   └── index.ts
│       │
│       ├── utils/
│       │   ├── cn.ts               # classnames helper
│       │   ├── constants.ts
│       │   ├── helpers.ts
│       │   ├── formatters.ts
│       │   └── index.ts
│       │
│       └── styles/
│           └── globals.css
│
├── nginx/
│   └── nginx.conf
│
├── docs/
│   ├── api/
│   │   └── README.md
│   ├── architecture/
│   │   └── README.md
│   └── deployment/
│       └── README.md
│
└── scripts/
    ├── init_all.sh
    ├── backup.sh
    └── test_all.sh
```

---

## 🔄 Паттерны и практики

### Repository Pattern

```python
# backend/app/repositories/base.py
from typing import Generic, TypeVar, Type, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session
    
    async def get(self, id: UUID) -> Optional[ModelType]:
        result = await self.session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        result = await self.session.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def create(self, obj_in: dict) -> ModelType:
        db_obj = self.model(**obj_in)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj
    
    async def update(self, id: UUID, obj_in: dict) -> Optional[ModelType]:
        await self.session.execute(
            update(self.model).where(self.model.id == id).values(**obj_in)
        )
        await self.session.commit()
        return await self.get(id)
    
    async def delete(self, id: UUID) -> bool:
        await self.session.execute(
            delete(self.model).where(self.model.id == id)
        )
        await self.session.commit()
        return True
```

### Service Layer

```python
# backend/app/services/inventory_service.py
from app.repositories.inventory_repository import InventoryRepository
from app.services.file_service import FileService
from app.services.notification_service import NotificationService

class InventoryService:
    def __init__(
        self,
        repository: InventoryRepository,
        file_service: FileService,
        notification_service: NotificationService
    ):
        self.repository = repository
        self.file_service = file_service
        self.notification_service = notification_service
    
    async def create_item(self, data: InventoryCreate, user_id: UUID):
        # Business logic here
        item = await self.repository.create(data.dict())
        
        # Upload photos if provided
        if data.photos:
            for photo in data.photos:
                await self.file_service.upload_inventory_photo(item.id, photo)
        
        return item
    
    async def get_item_with_schedule(self, item_id: UUID):
        item = await self.repository.get(item_id)
        schedule = await self.repository.get_usage_schedule(item_id)
        return {**item.__dict__, "schedule": schedule}
```

### Dependency Injection

```python
# backend/app/api/deps.py
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_session
from app.repositories.inventory_repository import InventoryRepository
from app.services.inventory_service import InventoryService

async def get_inventory_repository(
    session: AsyncSession = Depends(get_session)
) -> InventoryRepository:
    return InventoryRepository(session)

async def get_inventory_service(
    repo: InventoryRepository = Depends(get_inventory_repository),
    file_service: FileService = Depends(get_file_service),
    notification_service: NotificationService = Depends(get_notification_service)
) -> InventoryService:
    return InventoryService(repo, file_service, notification_service)
```

---

## 🔒 Безопасность

### JWT Authentication

```python
# Token structure
{
    "sub": "user_id",
    "role": "technical_director",
    "department": "light",  # если применимо
    "exp": 1234567890,
    "iat": 1234567800
}

# Access token: 15 минут
# Refresh token: 7 дней (хранится в Redis)
```

### RBAC (Role-Based Access Control)

```python
# backend/app/core/permissions.py
from enum import Enum
from functools import wraps

class Permission(Enum):
    # Inventory
    INVENTORY_READ = "inventory:read"
    INVENTORY_CREATE = "inventory:create"
    INVENTORY_UPDATE = "inventory:update"
    INVENTORY_DELETE = "inventory:delete"
    
    # Performances
    PERFORMANCE_READ = "performance:read"
    PERFORMANCE_CREATE = "performance:create"
    PERFORMANCE_UPDATE = "performance:update"
    
    # Schedule
    SCHEDULE_READ = "schedule:read"
    SCHEDULE_CREATE = "schedule:create"
    SCHEDULE_UPDATE = "schedule:update"
    
    # Tasks
    TASK_READ = "task:read"
    TASK_CREATE = "task:create"
    TASK_EXECUTE = "task:execute"
    
    # Admin
    USER_MANAGE = "user:manage"

ROLE_PERMISSIONS = {
    "admin": [Permission.USER_MANAGE, ...all permissions...],
    "technical_director": [...],
    "assistant_director": [...],
    "department_head": [...],
    "department_staff": [...],
    "actor": [Permission.SCHEDULE_READ, ...]
}
```

---

## 📊 Мониторинг (для production)

### Рекомендуемый стек

- **Prometheus** — метрики
- **Grafana** — визуализация
- **Loki** — логи
- **Sentry** — error tracking

### Health checks

```python
# backend/app/api/v1/health.py
@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_session),
    redis: Redis = Depends(get_redis)
):
    return {
        "status": "healthy",
        "database": await check_db(db),
        "redis": await check_redis(redis),
        "minio": await check_minio()
    }
```

---

*Документ обновлён: Январь 2026*
*Версия: 1.0*
