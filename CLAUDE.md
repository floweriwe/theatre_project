# Theatre Management System

## Обзор проекта
Информационная система автоматизации театра. FastAPI + React + PostgreSQL + Redis + MinIO.
Русский интерфейс, тёмная тема, MVP v0.1.0.

## Критические команды
```bash
# Запуск dev-окружения
docker-compose -f docker-compose.dev.yml up -d

# Инициализация БД с seed data
docker-compose -f docker-compose.dev.yml exec backend python -m scripts.init_db

# Проверка логов backend
docker-compose -f docker-compose.dev.yml logs -f backend

# Проверка типов frontend
cd frontend && npm run typecheck

# Тесты backend
docker-compose -f docker-compose.dev.yml exec backend pytest

# Миграции
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head
docker-compose -f docker-compose.dev.yml exec backend alembic revision --autogenerate -m "описание"
```

## Архитектура
- **Backend**: API Router → Service → Repository → Model (SQLAlchemy 2.0 async)
- **Frontend**: Pages → Components → Services → Store (Zustand)
- **Порты**: Frontend 5173, Backend 8000, PostgreSQL 5432, Redis 6379, MinIO 9000/9001

## Соглашения по коду

### Именование файлов
- Backend: `snake_case.py`
- Frontend services/types: `snake_case.ts`  
- Frontend components/pages: `PascalCase.tsx`

### Импорты TypeScript
```typescript
// ✅ Правильно
import { inventoryService } from '@/services/inventory_service';
import { Button } from '@/components/ui';

// ❌ Неправильно (с точками)
import { authService } from '@/services/auth.service';
```

### SQLAlchemy Enum (КРИТИЧНО!)
```python
# Всегда используй values_callable
status: Mapped[ItemStatus] = mapped_column(
    Enum(ItemStatus, values_callable=lambda x: [e.value for e in x]),
    default=ItemStatus.IN_STOCK
)
```

### PostgreSQL ENUM в миграциях
```python
# Создание типа с проверкой существования
op.execute("""
    DO $$ BEGIN 
        CREATE TYPE itemstatus AS ENUM ('in_stock', 'reserved'); 
    EXCEPTION 
        WHEN duplicate_object THEN null; 
    END $$;
""")

# В Column всегда create_type=False
sa.Column('status', postgresql.ENUM('in_stock', 'reserved', 
          name='itemstatus', create_type=False))
```

## Дизайн-система v3
```css
/* Фон */
--bg-primary: #0F1419;
--bg-secondary: #1A2332;
--bg-tertiary: #243044;

/* Акцент - золотой */
--gold: #D4A574;
--gold-light: #E8C297;

/* Текст */
--text-primary: #F1F5F9;
--text-secondary: #94A3B8;
--text-muted: #64748B;
```

### Tailwind классы
- Фон страницы: `bg-[#0F1419]`
- Карточки: `bg-[#1A2332]`
- Hover: `bg-[#243044]`
- Золотой акцент: `text-[#D4A574]` / `bg-[#D4A574]`
- Border: `border-[#D4A574]/20`

### Шрифты
- Заголовки: `font-['Cormorant_Garamond']`
- Текст: `font-['Inter']`

## Модули системы
1. **Инвентарь** — реквизит, декорации, оборудование с фото (blur: blue-500/10)
2. **Спектакли** — репертуар и паспорта (blur: purple-500/10)
3. **Расписание** — календарь в стиле АртМеханика (blur: amber-500/10)
4. **Документы** — хранение по цехам с версионированием (blur: emerald-500/10)
5. **Задачи** — чеклисты готовности к спектаклям

## Тестовые данные
- Email: `admin@theatre.test`
- Пароль: `Theatre2024!`

## НЕ ТРОГАТЬ
- Существующие файлы миграций в `alembic/versions/` — редактировать только через новые миграции
- Порты в docker-compose: 5173 (frontend), 8000 (backend)
- JWT_SECRET_KEY в production

## Документация проекта
Полная документация в `.claude/memory-bank/`:
- `@.claude/memory-bank/00_PROJECT_INSTRUCTIONS.md` — главные инструкции проекта
- `@.claude/memory-bank/01_PROJECT_CONTEXT.md` — бизнес-контекст, роли, цеха театра
- `@.claude/memory-bank/02_ARCHITECTURE.md` — архитектура, слои, паттерны
- `@.claude/memory-bank/03_DATABASE.md` — схема БД, таблицы, индексы
- `@.claude/memory-bank/04_DESIGN_SYSTEM.md` — дизайн-система v3, компоненты
- `@.claude/memory-bank/05_SEED_DATA_SPEC.md` — тестовые данные из реальных документов
- `@.claude/memory-bank/06_API_SPECIFICATION.md` — API endpoints
- `@.claude/memory-bank/07_ROADMAP_DEPLOYMENT.md` — roadmap, deployment, CI/CD

## Текущий статус
Глобальная переработка MVP. План в `docs/refactor-plan.md`.
Лог решений в `docs/decisions.md`.


<!-- BEGIN BRAINGRID INTEGRATION -->
## BrainGrid Integration

Spec-driven development: turn ideas into AI-ready tasks.

**Slash Commands:**

| Command                     | Description                   |
| --------------------------- | ----------------------------- |
| `/specify [prompt]`         | Create AI-refined requirement |
| `/breakdown [req-id]`       | Break into tasks              |
| `/build [req-id]`           | Get implementation plan       |
| `/save-requirement [title]` | Save plan as requirement      |

**Workflow:**

```bash
/specify "Add auth"  # → REQ-123
/breakdown REQ-123   # → tasks
/build REQ-123       # → plan
```

**Task Commands:**

```bash
braingrid task list -r REQ-123      # List tasks
braingrid task show TASK-456        # Show task details
braingrid task update TASK-456 --status COMPLETED
```

**Auto-detection:** Project from `.braingrid/project.json`, requirement from branch (`feature/REQ-123-*`).

**Full documentation:** [.braingrid/README.md](./.braingrid/README.md)

<!-- END BRAINGRID INTEGRATION -->
