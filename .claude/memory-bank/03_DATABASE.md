# Theatre Management System — База данных

## 🗄️ Обзор

- **СУБД**: PostgreSQL 16+
- **ORM**: SQLAlchemy 2.0+ (async)
- **Миграции**: Alembic
- **Кодировка**: UTF-8 (поддержка кириллицы)

---

## 📊 ER-диаграмма (упрощённая)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   users     │────▶│  user_roles  │     │   departments   │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                                          │
       │    ┌──────────────────────────────────────
       │    │
       ▼    ▼
┌─────────────────┐     ┌─────────────────────┐
│ inventory_items │────▶│ inventory_categories│
└─────────────────┘     └─────────────────────┘
       │
       │    ┌────────────────────┐
       │───▶│ inventory_photos   │
       │    └────────────────────┘
       │
       │    ┌────────────────────┐
       │───▶│ inventory_history  │
       │    └────────────────────┘
       │
       ▼
┌─────────────────┐     ┌─────────────────────┐
│  performances   │────▶│ passport_sections   │
└─────────────────┘     └─────────────────────┘
       │                          │
       │                          ▼
       │                ┌─────────────────────┐
       │                │ passport_documents  │
       │                └─────────────────────┘
       │
       │    ┌────────────────────────────┐
       │───▶│ performance_inventory      │
       │    └────────────────────────────┘
       │
       │    ┌────────────────────────────┐
       │───▶│ performance_checklists     │
       │    └────────────────────────────┘
       │              │
       │              ▼
       │    ┌────────────────────────────┐
       │    │ checklist_items            │
       │    └────────────────────────────┘
       │
       ▼
┌─────────────────┐     ┌─────────────────────┐
│ schedule_events │────▶│      venues         │
└─────────────────┘     └─────────────────────┘
       │
       │    ┌────────────────────────────┐
       │───▶│ event_participants         │
       │    └────────────────────────────┘
       │
       │    ┌────────────────────────────┐
       │───▶│ event_inventory            │
       │    └────────────────────────────┘

┌─────────────────┐     ┌─────────────────────┐
│    documents    │────▶│ document_versions   │
└─────────────────┘     └─────────────────────┘

┌─────────────────┐     ┌─────────────────────┐
│     tasks       │────▶│   task_subtasks     │
└─────────────────┘     └─────────────────────┘
       │
       │    ┌────────────────────────────┐
       │───▶│ task_comments              │
       │    └────────────────────────────┘
       │
       │    ┌────────────────────────────┐
       └───▶│ task_attachments           │
            └────────────────────────────┘

┌─────────────────┐
│  notifications  │
└─────────────────┘
```

---

## 📋 Таблицы

### users

Пользователи системы

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    
    role VARCHAR(50) NOT NULL DEFAULT 'actor',
    -- 'admin', 'technical_director', 'assistant_director', 
    -- 'department_head', 'department_staff', 'actor'
    
    department_id UUID REFERENCES departments(id),
    
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    notification_settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
```

### departments

Цеха театра

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    -- 'light', 'sound', 'machinery', 'costume', 'makeup', 'video'
    description TEXT,
    head_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### inventory_categories

Категории инвентаря

```sql
CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    -- '100_soft_decor', '200_hard_decor', '300_furniture', etc.
    parent_id UUID REFERENCES inventory_categories(id),
    department_id UUID REFERENCES departments(id),
    
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50), -- для UI
    color VARCHAR(20), -- для UI
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inv_categories_parent ON inventory_categories(parent_id);
CREATE INDEX idx_inv_categories_department ON inventory_categories(department_id);
```

### inventory_locations

Местоположения инвентаря

```sql
CREATE TABLE inventory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    -- 'warehouse_main', 'warehouse_2', 'main_stage', 'rehearsal_1', etc.
    type VARCHAR(50) NOT NULL,
    -- 'warehouse', 'stage', 'rehearsal', 'tour'
    
    address TEXT, -- для гастрольных локаций
    city VARCHAR(100),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### inventory_items

Предметы инвентаря

```sql
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Основные
    inventory_number VARCHAR(100) UNIQUE NOT NULL, -- из 1С
    name VARCHAR(255) NOT NULL,
    description TEXT,
    technical_description TEXT,
    
    -- Классификация
    category_id UUID NOT NULL REFERENCES inventory_categories(id),
    
    -- Местоположение и статус
    location_id UUID NOT NULL REFERENCES inventory_locations(id),
    status VARCHAR(50) NOT NULL DEFAULT 'in_stock',
    -- 'in_stock', 'on_stage', 'reserved', 'on_tour', 'in_repair', 'decommissioned'
    
    -- Количество
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'шт',
    -- 'шт', 'компл', 'пара', 'м', 'кг'
    
    -- Габариты (в см)
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    depth DECIMAL(10, 2),
    weight DECIMAL(10, 2), -- в кг
    
    -- Для оборудования
    serial_number VARCHAR(100),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    purchase_date DATE,
    purchase_price DECIMAL(15, 2),
    condition VARCHAR(50) DEFAULT 'good',
    -- 'good', 'fair', 'poor', 'needs_repair'
    
    -- Метаданные
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- soft delete
);

CREATE INDEX idx_inventory_number ON inventory_items(inventory_number);
CREATE INDEX idx_inventory_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_location ON inventory_items(location_id);
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_deleted ON inventory_items(deleted_at);

-- Полнотекстовый поиск
CREATE INDEX idx_inventory_search ON inventory_items 
    USING GIN (to_tsvector('russian', name || ' ' || COALESCE(description, '')));
```

### inventory_photos

Фотографии инвентаря

```sql
CREATE TABLE inventory_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    file_path VARCHAR(500) NOT NULL, -- путь в MinIO
    thumbnail_path VARCHAR(500),
    
    is_main BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inv_photos_item ON inventory_photos(inventory_item_id);
```

### inventory_history

История перемещений инвентаря

```sql
CREATE TABLE inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    action VARCHAR(50) NOT NULL,
    -- 'created', 'moved', 'status_changed', 'reserved', 'returned', 'updated'
    
    from_location_id UUID REFERENCES inventory_locations(id),
    to_location_id UUID REFERENCES inventory_locations(id),
    
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    
    performance_id UUID REFERENCES performances(id), -- если связано со спектаклем
    event_id UUID REFERENCES schedule_events(id), -- если связано с событием
    
    comment TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inv_history_item ON inventory_history(inventory_item_id);
CREATE INDEX idx_inv_history_date ON inventory_history(created_at);
```

### performances

Спектакли

```sql
CREATE TABLE performances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Основные
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255), -- автор пьесы
    director VARCHAR(255),
    artist VARCHAR(255), -- художник-постановщик
    composer VARCHAR(255),
    
    description TEXT,
    premiere_date DATE,
    
    -- Статус
    status VARCHAR(50) NOT NULL DEFAULT 'in_development',
    -- 'in_development', 'premiere', 'active', 'paused', 'archived'
    
    -- Медиа
    poster_url VARCHAR(500),
    video_url VARCHAR(500), -- видеозапись спектакля
    
    -- Продолжительность (в минутах)
    duration INTEGER,
    intermission_count INTEGER DEFAULT 1,
    
    -- Метаданные
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_performances_status ON performances(status);
CREATE INDEX idx_performances_title ON performances USING GIN (to_tsvector('russian', title));
```

### passport_sections

Разделы паспорта спектакля

```sql
CREATE TABLE passport_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performance_id UUID NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
    
    code VARCHAR(50) NOT NULL, -- '1.0', '2.1', '3.3', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    parent_id UUID REFERENCES passport_sections(id),
    department_id UUID REFERENCES departments(id), -- ответственный цех
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(performance_id, code)
);

CREATE INDEX idx_passport_sections_perf ON passport_sections(performance_id);
```

### passport_documents

Документы в паспорте спектакля

```sql
CREATE TABLE passport_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES passport_sections(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id),
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_passport_docs_section ON passport_documents(section_id);
```

### performance_inventory

Связь спектаклей и инвентаря

```sql
CREATE TABLE performance_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performance_id UUID NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    
    quantity INTEGER DEFAULT 1,
    notes TEXT, -- примечания по использованию
    
    is_consumable BOOLEAN DEFAULT FALSE, -- исходящий реквизит
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(performance_id, inventory_item_id)
);

CREATE INDEX idx_perf_inv_performance ON performance_inventory(performance_id);
CREATE INDEX idx_perf_inv_item ON performance_inventory(inventory_item_id);
```

### performance_checklists

Чеклисты готовности к спектаклю

```sql
CREATE TABLE performance_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performance_id UUID NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    
    is_template BOOLEAN DEFAULT FALSE, -- шаблон для копирования
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checklists_perf ON performance_checklists(performance_id);
```

### checklist_items

Пункты чеклистов

```sql
CREATE TABLE checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES performance_checklists(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checklist_items_list ON checklist_items(checklist_id);
```

### performance_condition

Состояние спектакля по годам

```sql
CREATE TABLE performance_condition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performance_id UUID NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
    
    year INTEGER NOT NULL,
    condition VARCHAR(50) NOT NULL,
    -- 'good', 'fair', 'poor', 'critical'
    
    notes TEXT,
    
    assessed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(performance_id, year)
);
```

### venues

Площадки

```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    -- 'main_stage', 'rehearsal_1', 'rehearsal_2', 'tour'
    
    type VARCHAR(50) NOT NULL,
    -- 'stage', 'rehearsal', 'tour'
    
    capacity INTEGER,
    address TEXT,
    city VARCHAR(100),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### schedule_events

События расписания

```sql
CREATE TABLE schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Основные
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    event_type VARCHAR(50) NOT NULL,
    -- 'performance', 'rehearsal', 'technical', 'run_through', 'premiere', 'tour'
    
    -- Время
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Привязки
    venue_id UUID NOT NULL REFERENCES venues(id),
    performance_id UUID REFERENCES performances(id), -- если связано со спектаклем
    
    -- Для гастролей
    tour_city VARCHAR(100),
    tour_venue_name VARCHAR(255),
    
    -- Статусы
    status VARCHAR(50) DEFAULT 'scheduled',
    -- 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'
    
    -- Готовность сцены
    stage_ready_time TIME, -- время готовности сцены (из АртМеханика)
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_dates ON schedule_events(start_time, end_time);
CREATE INDEX idx_events_venue ON schedule_events(venue_id);
CREATE INDEX idx_events_performance ON schedule_events(performance_id);
CREATE INDEX idx_events_type ON schedule_events(event_type);
```

### event_participants

Участники событий

```sql
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    role VARCHAR(100), -- роль в событии (например, название персонажа)
    
    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'confirmed', 'declined'
    
    decline_reason TEXT,
    
    confirmed_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_participants_event ON event_participants(event_id);
CREATE INDEX idx_participants_user ON event_participants(user_id);
CREATE INDEX idx_participants_status ON event_participants(status);
```

### event_inventory

Инвентарь для событий

```sql
CREATE TABLE event_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    
    quantity INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, inventory_item_id)
);

CREATE INDEX idx_event_inv_event ON event_inventory(event_id);
```

### documents

Документы

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Основные
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Классификация
    category VARCHAR(100) NOT NULL,
    -- 'technical_spec', 'partition', 'layout', 'instruction', 
    -- 'estimate', 'act', 'certificate', 'contract', 'other'
    
    department_id UUID REFERENCES departments(id),
    
    -- Файл
    file_path VARCHAR(500) NOT NULL, -- путь в MinIO
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Привязка к спектаклю (опционально)
    performance_id UUID REFERENCES performances(id),
    
    -- Версионирование
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES documents(id),
    
    -- Метаданные
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_department ON documents(department_id);
CREATE INDEX idx_documents_performance ON documents(performance_id);
CREATE INDEX idx_documents_search ON documents 
    USING GIN (to_tsvector('russian', title || ' ' || COALESCE(description, '')));
```

### tasks

Задачи

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Основные
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Привязки
    performance_id UUID REFERENCES performances(id),
    department_id UUID REFERENCES departments(id),
    
    -- Исполнение
    assignee_id UUID REFERENCES users(id),
    
    -- Сроки
    deadline TIMESTAMP WITH TIME ZONE,
    event_date DATE, -- дата связанного спектакля
    
    -- Статус и приоритет
    status VARCHAR(50) DEFAULT 'created',
    -- 'created', 'assigned', 'in_progress', 'review', 'completed', 'rejected'
    
    priority VARCHAR(20) DEFAULT 'medium',
    -- 'low', 'medium', 'high', 'critical'
    
    -- Метаданные
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_performance ON tasks(performance_id);
CREATE INDEX idx_tasks_department ON tasks(department_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
```

### task_subtasks

Подзадачи (чеклист внутри задачи)

```sql
CREATE TABLE task_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subtasks_task ON task_subtasks(task_id);
```

### task_comments

Комментарии к задачам

```sql
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    
    author_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_task ON task_comments(task_id);
```

### task_attachments

Вложения к задачам

```sql
CREATE TABLE task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_attachments_task ON task_attachments(task_id);
```

### notifications

Уведомления

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(100) NOT NULL,
    -- 'event_assigned', 'event_declined', 'task_assigned', 
    -- 'task_overdue', 'task_completed', 'schedule_conflict', 
    -- 'event_reminder'
    
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Ссылка на связанную сущность
    entity_type VARCHAR(50), -- 'event', 'task', 'performance', etc.
    entity_id UUID,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### refresh_tokens

Refresh токены для JWT

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

---

## 🔧 Миграции Alembic

### Начальная миграция

```python
# alembic/versions/001_initial.py

def upgrade():
    # 1. Enum types
    op.execute("""
        CREATE TYPE user_role AS ENUM (
            'admin', 'technical_director', 'assistant_director',
            'department_head', 'department_staff', 'actor'
        );
        
        CREATE TYPE inventory_status AS ENUM (
            'in_stock', 'on_stage', 'reserved', 'on_tour', 
            'in_repair', 'decommissioned'
        );
        
        CREATE TYPE performance_status AS ENUM (
            'in_development', 'premiere', 'active', 'paused', 'archived'
        );
        
        CREATE TYPE event_type AS ENUM (
            'performance', 'rehearsal', 'technical', 
            'run_through', 'premiere', 'tour'
        );
        
        CREATE TYPE participant_status AS ENUM (
            'pending', 'confirmed', 'declined'
        );
        
        CREATE TYPE task_status AS ENUM (
            'created', 'assigned', 'in_progress', 
            'review', 'completed', 'rejected'
        );
        
        CREATE TYPE task_priority AS ENUM (
            'low', 'medium', 'high', 'critical'
        );
    """)
    
    # 2. Create tables in order...
    # (см. SQL выше)

def downgrade():
    # Drop tables in reverse order
    # Drop enum types
    pass
```

### Порядок создания таблиц

1. `departments`
2. `users`
3. `inventory_categories`
4. `inventory_locations`
5. `venues`
6. `inventory_items`
7. `inventory_photos`
8. `inventory_history`
9. `performances`
10. `passport_sections`
11. `documents`
12. `passport_documents`
13. `performance_inventory`
14. `performance_checklists`
15. `checklist_items`
16. `performance_condition`
17. `schedule_events`
18. `event_participants`
19. `event_inventory`
20. `tasks`
21. `task_subtasks`
22. `task_comments`
23. `task_attachments`
24. `notifications`
25. `refresh_tokens`

---

## 📊 Индексы для производительности

### Составные индексы

```sql
-- Поиск событий по дате и площадке
CREATE INDEX idx_events_venue_dates ON schedule_events(venue_id, start_time, end_time);

-- Поиск инвентаря по категории и статусу
CREATE INDEX idx_inventory_cat_status ON inventory_items(category_id, status);

-- Поиск задач по исполнителю и статусу
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);

-- Непрочитанные уведомления пользователя
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) 
    WHERE is_read = FALSE;
```

### Частичные индексы

```sql
-- Только активные предметы инвентаря
CREATE INDEX idx_inventory_active ON inventory_items(category_id, location_id)
    WHERE deleted_at IS NULL AND status != 'decommissioned';

-- Только предстоящие события
CREATE INDEX idx_events_upcoming ON schedule_events(start_time)
    WHERE start_time > NOW() AND status != 'cancelled';
```

---

## 🗃️ Начальные данные (Seed)

### Цеха

```sql
INSERT INTO departments (id, name, code) VALUES
    (gen_random_uuid(), 'Осветительный цех', 'light'),
    (gen_random_uuid(), 'Звуковой цех', 'sound'),
    (gen_random_uuid(), 'Машинно-декорационный цех', 'machinery'),
    (gen_random_uuid(), 'Костюмерно-реквизиторский цех', 'costume'),
    (gen_random_uuid(), 'Гримёрный цех', 'makeup'),
    (gen_random_uuid(), 'Видеоцех', 'video');
```

### Категории инвентаря

```sql
INSERT INTO inventory_categories (id, name, code, sort_order) VALUES
    (gen_random_uuid(), 'Мягкие декорации', '100_soft_decor', 100),
    (gen_random_uuid(), 'Жёсткие декорации', '200_hard_decor', 200),
    (gen_random_uuid(), 'Мебель', '300_furniture', 300),
    (gen_random_uuid(), 'Реквизит', '400_props', 400),
    (gen_random_uuid(), 'Исходящий реквизит', '500_consumables', 500),
    (gen_random_uuid(), 'Костюмы', '600_costumes', 600),
    (gen_random_uuid(), 'Световое оборудование', '700_lighting', 700),
    (gen_random_uuid(), 'Звуковое оборудование', '800_sound', 800),
    (gen_random_uuid(), 'Видеооборудование', '900_video', 900),
    (gen_random_uuid(), 'Грим и парики', '1000_makeup', 1000);
```

### Площадки

```sql
INSERT INTO venues (id, name, code, type, capacity) VALUES
    (gen_random_uuid(), 'Основная сцена', 'main_stage', 'stage', 500),
    (gen_random_uuid(), 'Репетиционный зал 1', 'rehearsal_1', 'rehearsal', 50),
    (gen_random_uuid(), 'Репетиционный зал 2', 'rehearsal_2', 'rehearsal', 30);
```

### Локации хранения

```sql
INSERT INTO inventory_locations (id, name, code, type) VALUES
    (gen_random_uuid(), 'Основной склад', 'warehouse_main', 'warehouse'),
    (gen_random_uuid(), 'Склад №2', 'warehouse_2', 'warehouse'),
    (gen_random_uuid(), 'Склад №3', 'warehouse_3', 'warehouse'),
    (gen_random_uuid(), 'Основная сцена', 'main_stage', 'stage'),
    (gen_random_uuid(), 'Репетиционный зал 1', 'rehearsal_1', 'rehearsal'),
    (gen_random_uuid(), 'Репетиционный зал 2', 'rehearsal_2', 'rehearsal');
```

---

*Документ обновлён: Январь 2026*
*Версия: 1.0*
