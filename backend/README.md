# Theatre Backend

API сервер для системы управления театром.

## Технологии

- **Python 3.12+**
- **FastAPI** — веб-фреймворк
- **SQLAlchemy 2.0** — ORM (async)
- **PostgreSQL 16** — база данных
- **Redis 7** — кэш и сессии
- **Alembic** — миграции БД
- **Pydantic 2.0** — валидация данных

## Быстрый старт

### 1. Запуск через Docker (рекомендуется)

```bash
# Из корня проекта
docker-compose -f docker-compose.dev.yml up -d

# Применить миграции
docker-compose exec backend alembic upgrade head

# Создать суперпользователя
docker-compose exec backend python -m scripts.create_superuser
```

### 2. Локальный запуск

```bash
# Создать виртуальное окружение
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# или
.venv\Scripts\activate  # Windows

# Установить зависимости
pip install -e ".[dev]"

# Настроить переменные окружения
cp ../.env.example ../.env
# Отредактировать .env

# Применить миграции
alembic upgrade head

# Запустить сервер
uvicorn app.main:app --reload
```

## API документация

После запуска доступна по адресам:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Структура проекта

```
backend/
├── alembic/              # Миграции БД
│   └── versions/         # Файлы миграций
├── app/
│   ├── api/              # API endpoints
│   │   └── v1/           # Версия 1 API
│   ├── core/             # Ядро (security, permissions, exceptions)
│   ├── database/         # Подключение к БД
│   ├── models/           # SQLAlchemy модели
│   ├── repositories/     # Паттерн Repository
│   ├── schemas/          # Pydantic схемы
│   ├── services/         # Бизнес-логика
│   └── utils/            # Утилиты
├── scripts/              # Скрипты управления
├── tests/                # Тесты
└── pyproject.toml        # Зависимости и настройки
```

## Тестирование

```bash
# Запуск всех тестов
pytest

# С покрытием
pytest --cov=app

# Конкретный тест
pytest tests/test_auth.py -v
```

## Миграции

```bash
# Создать новую миграцию
alembic revision --autogenerate -m "описание изменений"

# Применить миграции
alembic upgrade head

# Откатить последнюю миграцию
alembic downgrade -1

# Показать текущую ревизию
alembic current
```

## API Endpoints

### Аутентификация (`/api/v1/auth`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/register` | Регистрация пользователя |
| POST | `/login` | Вход в систему |
| POST | `/refresh` | Обновление токенов |
| POST | `/logout` | Выход из системы |
| GET | `/me` | Текущий пользователь |

### Health Check

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Проверка работоспособности |

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `ENVIRONMENT` | Окружение (development/staging/production) | development |
| `DEBUG` | Режим отладки | false |
| `SECRET_KEY` | Секретный ключ для JWT | - |
| `DATABASE_URL` | URL PostgreSQL | - |
| `REDIS_URL` | URL Redis | - |
| `CORS_ORIGINS` | Разрешённые origins | http://localhost:3000 |

## Разрешения

Система использует RBAC (Role-Based Access Control):

### Роли

- `admin` — полный доступ
- `sysadmin` — управление пользователями
- `director` — просмотр всего
- `tech_director` — управление инвентарём
- `producer` — спектакли и расписание
- `department_head` — работа с подразделением
- `accountant` — документы и финансы
- `performer` — расписание и спектакли
- `viewer` — только просмотр

### Разрешения

- `inventory:view`, `inventory:create`, `inventory:edit`, `inventory:delete`
- `documents:view`, `documents:view_financial`, `documents:create`, `documents:edit`
- `performance:view`, `performance:create`, `performance:edit`
- `schedule:view`, `schedule:edit`
- `users:view`, `users:create`, `users:edit`, `users:delete`
- `admin:full`, `system:settings`
