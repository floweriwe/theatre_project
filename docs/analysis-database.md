# Database Schema Analysis

## Executive Summary

| Metric | Value |
|--------|-------|
| **Tables in documentation (03_DATABASE.md)** | 25 |
| **Tables implemented** | 14 |
| **Coverage** | 56% |
| **Critical GAPs** | 11 tables |
| **Missing ENUM types** | 3 |
| **Missing indexes (key)** | ~15 |

### Key Findings

1. **Core modules implemented**: Users, Inventory, Performances, Documents, Schedule
2. **Missing entirely**: Departments, Venues, Tasks, Notifications, Refresh Tokens
3. **Critical for MVP**: `departments`, `venues` (FK dependencies)
4. **Architecture difference**: Current uses `Integer` PK, documentation specifies `UUID`

---

## 1. Current Models Inventory

### Summary Table

| Model | File | Fields | Relationships | Indexes |
|-------|------|--------|---------------|---------|
| User | user.py | 14 | 2 | 2 |
| Role | user.py | 7 | 1 | 2 |
| UserRole | user.py | 5 | 2 | 3 |
| Theater | theater.py | 10 | 1 | 1 |
| InventoryCategory | inventory.py | 12 | 4 | 3 |
| StorageLocation | inventory.py | 11 | 4 | 3 |
| InventoryItem | inventory.py | 18 | 5 | 6 |
| InventoryMovement | inventory.py | 11 | 4 | 2 |
| Performance | performance.py | 17 | 1 | 3 |
| PerformanceSection | performance.py | 10 | 2 | 1 |
| DocumentCategory | document.py | 13 | 3 | 2 |
| Document | document.py | 18 | 4 | 4 |
| DocumentVersion | document.py | 8 | 2 | 1 |
| Tag | document.py | 4 | 1 | 1 |
| ScheduleEvent | schedule.py | 16 | 2 | 5 |
| EventParticipant | schedule.py | 6 | 2 | 2 |

### Model Details

#### User (`backend/app/models/user.py`)

**Fields:**
- `id`: Integer (PK, autoincrement)
- `email`: String(255), unique, not null, indexed
- `hashed_password`: String(255), not null
- `first_name`: String(100), not null
- `last_name`: String(100), not null
- `patronymic`: String(100), nullable
- `phone`: String(20), nullable
- `is_active`: Boolean, default True
- `is_verified`: Boolean, default False
- `is_superuser`: Boolean, default False
- `theater_id`: Integer FK, nullable, indexed
- `last_login_at`: DateTime(tz), nullable
- `created_at`: DateTime(tz), auto
- `updated_at`: DateTime(tz), auto

**Relationships:**
- `theater`: Theater (FK)
- `user_roles`: list[UserRole]

**Indexes:**
- `ix_users_email` (unique)
- `ix_users_theater_id`

---

#### Role (`backend/app/models/user.py`)

**Fields:**
- `id`: Integer (PK)
- `name`: String(100), not null
- `code`: String(50), unique, indexed
- `description`: Text, nullable
- `permissions`: ARRAY(String), not null
- `is_system`: Boolean, default False
- `theater_id`: Integer FK, nullable
- `created_at`, `updated_at`: DateTime(tz)

**Relationships:**
- `user_roles`: list[UserRole]

---

#### InventoryCategory (`backend/app/models/inventory.py`)

**Fields:**
- `id`: Integer (PK)
- `name`: String(100), not null
- `code`: String(50), not null
- `description`: Text, nullable
- `parent_id`: Integer FK (self-ref)
- `color`: String(7), nullable
- `icon`: String(50), nullable
- `is_active`: Boolean, default True
- `sort_order`: Integer, default 0
- `theater_id`: Integer FK
- AuditMixin: `created_at`, `updated_at`, `created_by_id`, `updated_by_id`

**Relationships:**
- `parent`: InventoryCategory (self)
- `children`: list[InventoryCategory]
- `items`: list[InventoryItem]
- `theater`: Theater

---

#### StorageLocation (`backend/app/models/inventory.py`)

**Fields:**
- `id`: Integer (PK)
- `name`: String(100), not null
- `code`: String(50), not null
- `description`: Text, nullable
- `parent_id`: Integer FK (self-ref)
- `address`: String(255), nullable
- `is_active`: Boolean, default True
- `sort_order`: Integer, default 0
- `theater_id`: Integer FK
- AuditMixin fields

**Relationships:**
- `parent`, `children`: StorageLocation (self)
- `items`: list[InventoryItem]
- `theater`: Theater

---

#### InventoryItem (`backend/app/models/inventory.py`)

**Fields:**
- `id`: Integer (PK)
- `name`: String(255), not null, indexed
- `inventory_number`: String(50), unique, indexed
- `description`: Text, nullable
- `category_id`: Integer FK, indexed
- `location_id`: Integer FK, indexed
- `status`: Enum ItemStatus, indexed
- `quantity`: Integer, default 1
- `purchase_price`: Numeric(12,2)
- `current_value`: Numeric(12,2)
- `purchase_date`: DateTime
- `warranty_until`: DateTime
- `custom_fields`: JSONB
- `images`: JSONB
- `is_active`: Boolean
- `theater_id`: Integer FK, indexed
- AuditMixin fields

**ENUM ItemStatus:**
- `in_stock`, `reserved`, `in_use`, `repair`, `written_off`

---

#### InventoryMovement (`backend/app/models/inventory.py`)

**Fields:**
- `id`: Integer (PK)
- `item_id`: Integer FK, indexed
- `movement_type`: Enum MovementType
- `from_location_id`: Integer FK
- `to_location_id`: Integer FK
- `quantity`: Integer
- `comment`: Text
- `performance_id`: Integer FK
- `created_at`: DateTime
- `created_by_id`: Integer FK

---

#### Performance (`backend/app/models/performance.py`)

**Fields:**
- `id`: Integer (PK)
- `title`: String(255), indexed
- `subtitle`: String(255)
- `description`: Text
- `author`, `director`, `composer`, `choreographer`: String(255)
- `genre`: String(100)
- `age_rating`: String(10)
- `duration_minutes`: Integer
- `intermissions`: Integer
- `premiere_date`: Date
- `status`: Enum PerformanceStatus, indexed
- `poster_path`: String(500)
- `extra_data`: JSONB
- `is_active`: Boolean
- `theater_id`: Integer FK, indexed
- AuditMixin fields

---

#### PerformanceSection (`backend/app/models/performance.py`)

**Fields:**
- `id`: Integer (PK)
- `performance_id`: Integer FK, indexed
- `section_type`: Enum SectionType
- `title`: String(100)
- `content`: Text
- `responsible_id`: Integer FK
- `data`: JSONB
- `sort_order`: Integer
- AuditMixin fields

---

#### Document (`backend/app/models/document.py`)

**Fields:**
- `id`: Integer (PK)
- `name`: String(255), indexed
- `description`: Text
- `category_id`: Integer FK, indexed
- `file_path`: String(500)
- `file_name`: String(255)
- `file_size`: BigInteger
- `mime_type`: String(100)
- `file_type`: Enum FileType
- `current_version`: Integer
- `status`: Enum DocumentStatus, indexed
- `performance_id`: Integer FK
- `extra_data`: JSONB
- `is_public`: Boolean
- `is_active`: Boolean
- `theater_id`: Integer FK, indexed
- AuditMixin fields

---

#### ScheduleEvent (`backend/app/models/schedule.py`)

**Fields:**
- `id`: Integer (PK)
- `title`: String(255)
- `description`: Text
- `event_type`: Enum EventType, indexed
- `status`: Enum EventStatus, indexed
- `event_date`: Date, indexed
- `start_time`: Time
- `end_time`: Time
- `venue`: String(255) - **TEXT field, not FK!**
- `performance_id`: Integer FK, indexed
- `color`: String(7)
- `extra_data`: JSONB
- `is_public`: Boolean
- `is_active`: Boolean
- `theater_id`: Integer FK, indexed
- AuditMixin fields

---

## 2. Comparison with Documentation

### Table Correspondence Matrix

| Table (03_DATABASE.md) | Current Model | Status | Field Coverage | Notes |
|------------------------|---------------|--------|----------------|-------|
| `users` | User | PARTIAL | 80% | Missing: `full_name` (computed), `avatar_url`, `department_id`, `notification_settings` |
| `departments` | - | MISSING | 0% | Critical for user/category assignments |
| `inventory_categories` | InventoryCategory | PARTIAL | 85% | Missing: `department_id` FK |
| `inventory_locations` | StorageLocation | PARTIAL | 70% | Missing: `type`, `city` fields |
| `inventory_items` | InventoryItem | PARTIAL | 60% | Missing many fields (see below) |
| `inventory_photos` | - | MISSING | 0% | Currently using JSONB `images` field |
| `inventory_history` | InventoryMovement | PARTIAL | 80% | Different name, similar structure |
| `performances` | Performance | PARTIAL | 75% | Missing: `artist`, `video_url` |
| `passport_sections` | PerformanceSection | PARTIAL | 60% | Different structure |
| `passport_documents` | - | MISSING | 0% | Links sections to documents |
| `performance_inventory` | - | MISSING | 0% | Links performances to inventory |
| `performance_checklists` | - | MISSING | 0% | Checklist templates |
| `checklist_items` | - | MISSING | 0% | Checklist items |
| `performance_condition` | - | MISSING | 0% | Yearly condition tracking |
| `venues` | - | MISSING | 0% | Currently `venue` is text field |
| `schedule_events` | ScheduleEvent | PARTIAL | 70% | Missing: `venue_id` FK, `stage_ready_time`, tour fields |
| `event_participants` | EventParticipant | OK | 90% | Minor differences |
| `event_inventory` | - | MISSING | 0% | Inventory for events |
| `documents` | Document | PARTIAL | 85% | Minor differences |
| `tasks` | - | MISSING | 0% | Task management |
| `task_subtasks` | - | MISSING | 0% | Task subtasks |
| `task_comments` | - | MISSING | 0% | Task comments |
| `task_attachments` | - | MISSING | 0% | Task attachments |
| `notifications` | - | MISSING | 0% | User notifications |
| `refresh_tokens` | - | MISSING | 0% | JWT refresh tokens |

---

## 3. GAP Analysis

### 3.1 Missing Tables (11 total)

#### departments (CRITICAL - MUST HAVE)

**Description from documentation:**
Цеха театра - organizational units responsible for specific areas (light, sound, machinery, costume, makeup, video)

**Required SQLAlchemy Model:**
```python
# backend/app/models/department.py
"""Модель цехов театра."""
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class Department(Base, TimestampMixin):
    """Цех театра."""

    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    head_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True
    )

    # Relationships
    head: Mapped["User | None"] = relationship("User", foreign_keys=[head_id])
    users: Mapped[list["User"]] = relationship("User", back_populates="department")
    categories: Mapped[list["InventoryCategory"]] = relationship(
        "InventoryCategory", back_populates="department"
    )
```

**Migration SQL:**
```python
def upgrade():
    op.create_table(
        'departments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('head_id', sa.Integer(), nullable=True),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('code'),
        sa.ForeignKeyConstraint(['head_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_departments_code', 'departments', ['code'])

    # Seed data
    op.execute("""
        INSERT INTO departments (name, code, description) VALUES
        ('Осветительный цех', 'light', 'Работа со световым оборудованием'),
        ('Звуковой цех', 'sound', 'Работа со звуковым оборудованием'),
        ('Машинно-декорационный цех', 'machinery', 'Работа с декорациями и механизмами'),
        ('Костюмерно-реквизиторский цех', 'costume', 'Костюмы и реквизит'),
        ('Гримёрный цех', 'makeup', 'Грим и парики'),
        ('Видеоцех', 'video', 'Видеооборудование и проекции')
    """)
```

---

#### venues (CRITICAL - MUST HAVE)

**Description from documentation:**
Площадки - physical locations for events (main stage, rehearsal rooms, tour venues)

**Required SQLAlchemy Model:**
```python
# backend/app/models/venue.py
"""Модель площадок."""
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class VenueType(str, Enum):
    """Тип площадки."""
    STAGE = "stage"
    REHEARSAL = "rehearsal"
    TOUR = "tour"


class Venue(Base, TimestampMixin):
    """Площадка."""

    __tablename__ = "venues"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    type: Mapped[VenueType] = mapped_column(
        Enum(VenueType, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True
    )

    # Relationships
    events: Mapped[list["ScheduleEvent"]] = relationship(
        "ScheduleEvent", back_populates="venue_ref"
    )
```

**Migration SQL:**
```python
def upgrade():
    op.execute("DO $$ BEGIN CREATE TYPE venuetype AS ENUM ('stage', 'rehearsal', 'tour'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    op.create_table(
        'venues',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('type', postgresql.ENUM('stage', 'rehearsal', 'tour', name='venuetype', create_type=False), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
    )

    # Seed data
    op.execute("""
        INSERT INTO venues (name, code, type, capacity) VALUES
        ('Основная сцена', 'main_stage', 'stage', 500),
        ('Репетиционный зал 1', 'rehearsal_1', 'rehearsal', 50),
        ('Репетиционный зал 2', 'rehearsal_2', 'rehearsal', 30)
    """)
```

---

#### inventory_photos (SHOULD HAVE)

**Description from documentation:**
Фотографии инвентаря - separate table for inventory item photos with MinIO paths

**Current implementation:** Uses JSONB `images` field in `inventory_items`

**Required SQLAlchemy Model:**
```python
# Add to backend/app/models/inventory.py
class InventoryPhoto(Base):
    """Фотография предмета инвентаря."""

    __tablename__ = "inventory_photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    inventory_item_id: Mapped[int] = mapped_column(
        ForeignKey("inventory_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_main: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    item: Mapped["InventoryItem"] = relationship("InventoryItem", back_populates="photos")
    uploaded_by: Mapped["User | None"] = relationship("User")
```

---

#### performance_inventory (SHOULD HAVE)

**Description from documentation:**
Связь спектаклей и инвентаря - which inventory items are used in which performances

**Required SQLAlchemy Model:**
```python
# Add to backend/app/models/performance.py
class PerformanceInventory(Base):
    """Связь спектакля и инвентаря."""

    __tablename__ = "performance_inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    performance_id: Mapped[int] = mapped_column(
        ForeignKey("performances.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    inventory_item_id: Mapped[int] = mapped_column(
        ForeignKey("inventory_items.id"),
        nullable=False,
        index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_consumable: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    __table_args__ = (
        sa.UniqueConstraint('performance_id', 'inventory_item_id'),
    )
```

---

#### tasks (NICE TO HAVE for MVP, but CRITICAL for full app)

**Required SQLAlchemy Model:**
```python
# backend/app/models/task.py
"""Модели модуля задач."""
from datetime import datetime, date
from enum import Enum as PyEnum
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, AuditMixin


class TaskStatus(str, PyEnum):
    CREATED = "created"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    REJECTED = "rejected"


class TaskPriority(str, PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(Base, AuditMixin):
    """Задача."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    performance_id: Mapped[int | None] = mapped_column(
        ForeignKey("performances.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    assignee_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, values_callable=lambda x: [e.value for e in x]),
        default=TaskStatus.CREATED,
        nullable=False,
        index=True
    )
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority, values_callable=lambda x: [e.value for e in x]),
        default=TaskPriority.MEDIUM,
        nullable=False
    )
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    performance: Mapped["Performance | None"] = relationship("Performance")
    department: Mapped["Department | None"] = relationship("Department")
    assignee: Mapped["User | None"] = relationship("User", foreign_keys=[assignee_id])
    subtasks: Mapped[list["TaskSubtask"]] = relationship("TaskSubtask", back_populates="task", cascade="all, delete-orphan")
    comments: Mapped[list["TaskComment"]] = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    attachments: Mapped[list["TaskAttachment"]] = relationship("TaskAttachment", back_populates="task", cascade="all, delete-orphan")


class TaskSubtask(Base):
    """Подзадача."""

    __tablename__ = "task_subtasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    task: Mapped["Task"] = relationship("Task", back_populates="subtasks")


class TaskComment(Base):
    """Комментарий к задаче."""

    __tablename__ = "task_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    task: Mapped["Task"] = relationship("Task", back_populates="comments")
    author: Mapped["User"] = relationship("User")


class TaskAttachment(Base):
    """Вложение к задаче."""

    __tablename__ = "task_attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    uploaded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    task: Mapped["Task"] = relationship("Task", back_populates="attachments")
    uploaded_by: Mapped["User | None"] = relationship("User")
```

---

#### notifications (NICE TO HAVE)

```python
# backend/app/models/notification.py
class Notification(Base):
    """Уведомление."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)

    user: Mapped["User"] = relationship("User")
```

---

#### refresh_tokens (NICE TO HAVE for production)

```python
# backend/app/models/auth.py
class RefreshToken(Base):
    """Refresh токен для JWT."""

    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    device_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)

    user: Mapped["User"] = relationship("User")
```

---

### 3.2 Missing Fields in Existing Tables

#### users

| Field | Type | Description | Priority |
|-------|------|-------------|----------|
| `department_id` | Integer FK | Link to departments | MUST |
| `avatar_url` | String(500) | User avatar path | SHOULD |
| `notification_settings` | JSONB | Notification preferences | NICE |

**Migration:**
```python
# Add to users table
op.add_column('users', sa.Column('department_id', sa.Integer(), nullable=True))
op.add_column('users', sa.Column('avatar_url', sa.String(500), nullable=True))
op.add_column('users', sa.Column('notification_settings', postgresql.JSONB(), nullable=True, server_default='{}'))
op.create_foreign_key('fk_users_department_id', 'users', 'departments', ['department_id'], ['id'], ondelete='SET NULL')
op.create_index('ix_users_department_id', 'users', ['department_id'])
```

---

#### inventory_categories

| Field | Type | Description | Priority |
|-------|------|-------------|----------|
| `department_id` | Integer FK | Link to responsible department | SHOULD |

**Migration:**
```python
op.add_column('inventory_categories', sa.Column('department_id', sa.Integer(), nullable=True))
op.create_foreign_key('fk_inv_cat_department_id', 'inventory_categories', 'departments', ['department_id'], ['id'], ondelete='SET NULL')
op.create_index('ix_inv_categories_department_id', 'inventory_categories', ['department_id'])
```

---

#### inventory_items

| Field | Type | Description | Priority |
|-------|------|-------------|----------|
| `technical_description` | Text | Technical specs | SHOULD |
| `unit` | String(50) | Unit of measure (шт, компл, м) | SHOULD |
| `width` | Decimal(10,2) | Width in cm | NICE |
| `height` | Decimal(10,2) | Height in cm | NICE |
| `depth` | Decimal(10,2) | Depth in cm | NICE |
| `weight` | Decimal(10,2) | Weight in kg | NICE |
| `serial_number` | String(100) | Serial number | SHOULD |
| `manufacturer` | String(255) | Manufacturer | SHOULD |
| `model` | String(255) | Model | SHOULD |
| `condition` | String(50) | Condition (good/fair/poor) | SHOULD |
| `deleted_at` | DateTime | Soft delete timestamp | SHOULD |

**Missing ENUM values in ItemStatus:**
- `on_stage` (doc) vs `in_use` (current)
- `on_tour` (missing)
- `in_repair` (doc) vs `repair` (current)
- `decommissioned` (doc) vs `written_off` (current)

---

#### inventory_locations (storage_locations)

| Field | Type | Description | Priority |
|-------|------|-------------|----------|
| `type` | String(50) | Location type (warehouse, stage, rehearsal, tour) | SHOULD |
| `city` | String(100) | City for tour locations | NICE |

---

#### performances

| Field | Type | Description | Priority |
|-------|------|-------------|----------|
| `artist` | String(255) | Set designer | SHOULD |
| `video_url` | String(500) | Performance video URL | NICE |
| `archived_at` | DateTime | Archive timestamp | NICE |

**ENUM difference:**
- Documentation: `in_development`, `premiere`, `active`, `paused`, `archived`
- Current: `preparation`, `in_repertoire`, `paused`, `archived`

---

#### schedule_events

| Field | Type | Description | Priority |
|-------|------|-------------|----------|
| `venue_id` | Integer FK | Link to venues table | MUST |
| `tour_city` | String(100) | Tour city | SHOULD |
| `tour_venue_name` | String(255) | Tour venue name | SHOULD |
| `stage_ready_time` | Time | Stage ready time | NICE |

**ENUM differences:**
- Documentation: `performance`, `rehearsal`, `technical`, `run_through`, `premiere`, `tour`
- Current: `performance`, `rehearsal`, `tech_rehearsal`, `dress_rehearsal`, `meeting`, `maintenance`, `other`

---

### 3.3 Missing Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `users` | `idx_users_role` | role | Fast role filtering |
| `users` | `idx_users_department` | department_id | After adding FK |
| `inventory_items` | `idx_inventory_search` | GIN(to_tsvector) | Full-text search |
| `inventory_items` | `idx_inventory_deleted` | deleted_at | Soft delete filter |
| `inventory_items` | `idx_inventory_cat_status` | category_id, status | Compound index |
| `schedule_events` | `idx_events_venue_dates` | venue_id, start_time, end_time | Event lookup |
| `schedule_events` | `idx_events_upcoming` | start_time (partial) | Upcoming events |
| `notifications` | `idx_notifications_unread` | user_id, is_read (partial) | Unread count |

---

### 3.4 Missing ENUM Types

| ENUM | Values | Used In | Priority |
|------|--------|---------|----------|
| `venue_type` | stage, rehearsal, tour | venues.type | MUST |
| `task_status` | created, assigned, in_progress, review, completed, rejected | tasks.status | NICE |
| `task_priority` | low, medium, high, critical | tasks.priority | NICE |

---

## 4. Migration Plan for MVP

### Phase 1: MUST HAVE (Critical for MVP)

#### Migration 005: departments

**File:** `backend/alembic/versions/20250116_0001_005_departments.py`

```python
"""005_departments

Добавляет таблицу departments (цеха театра).

Revision ID: 005_departments
Revises: 004_schedule
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_departments'
down_revision: Union[str, None] = '004_schedule'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'departments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('head_id', sa.Integer(), nullable=True),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('code'),
        sa.ForeignKeyConstraint(['head_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_departments_code', 'departments', ['code'])
    op.create_index('ix_departments_theater_id', 'departments', ['theater_id'])

    # Add department_id to users
    op.add_column('users', sa.Column('department_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_department_id', 'users', 'departments', ['department_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_users_department_id', 'users', ['department_id'])

    # Add department_id to inventory_categories
    op.add_column('inventory_categories', sa.Column('department_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_inv_cat_department_id', 'inventory_categories', 'departments', ['department_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_inv_categories_department_id', 'inventory_categories', ['department_id'])

    # Seed data
    op.execute("""
        INSERT INTO departments (name, code, description) VALUES
        ('Осветительный цех', 'light', 'Работа со световым оборудованием'),
        ('Звуковой цех', 'sound', 'Работа со звуковым оборудованием'),
        ('Машинно-декорационный цех', 'machinery', 'Работа с декорациями и механизмами сцены'),
        ('Костюмерно-реквизиторский цех', 'costume', 'Костюмы и реквизит'),
        ('Гримёрный цех', 'makeup', 'Грим и парики'),
        ('Видеоцех', 'video', 'Видеооборудование и проекции')
    """)


def downgrade() -> None:
    op.drop_index('ix_inv_categories_department_id', table_name='inventory_categories')
    op.drop_constraint('fk_inv_cat_department_id', 'inventory_categories', type_='foreignkey')
    op.drop_column('inventory_categories', 'department_id')

    op.drop_index('ix_users_department_id', table_name='users')
    op.drop_constraint('fk_users_department_id', 'users', type_='foreignkey')
    op.drop_column('users', 'department_id')

    op.drop_index('ix_departments_theater_id', table_name='departments')
    op.drop_index('ix_departments_code', table_name='departments')
    op.drop_table('departments')
```

---

#### Migration 006: venues

**File:** `backend/alembic/versions/20250116_0002_006_venues.py`

```python
"""006_venues

Добавляет таблицу venues и связывает с schedule_events.

Revision ID: 006_venues
Revises: 005_departments
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '006_venues'
down_revision: Union[str, None] = '005_departments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUM type
    op.execute("DO $$ BEGIN CREATE TYPE venuetype AS ENUM ('stage', 'rehearsal', 'tour'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    op.create_table(
        'venues',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('type', postgresql.ENUM('stage', 'rehearsal', 'tour', name='venuetype', create_type=False), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_venues_code', 'venues', ['code'])
    op.create_index('ix_venues_type', 'venues', ['type'])

    # Add venue_id to schedule_events
    op.add_column('schedule_events', sa.Column('venue_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_events_venue_id', 'schedule_events', 'venues', ['venue_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_schedule_events_venue_id', 'schedule_events', ['venue_id'])

    # Add tour fields to schedule_events
    op.add_column('schedule_events', sa.Column('tour_city', sa.String(100), nullable=True))
    op.add_column('schedule_events', sa.Column('tour_venue_name', sa.String(255), nullable=True))
    op.add_column('schedule_events', sa.Column('stage_ready_time', sa.Time(), nullable=True))

    # Seed data
    op.execute("""
        INSERT INTO venues (name, code, type, capacity) VALUES
        ('Основная сцена', 'main_stage', 'stage', 500),
        ('Репетиционный зал 1', 'rehearsal_1', 'rehearsal', 50),
        ('Репетиционный зал 2', 'rehearsal_2', 'rehearsal', 30)
    """)

    # Migrate existing venue text to venue_id where possible
    op.execute("""
        UPDATE schedule_events se
        SET venue_id = v.id
        FROM venues v
        WHERE LOWER(se.venue) LIKE '%' || v.code || '%'
           OR LOWER(se.venue) LIKE '%' || LOWER(v.name) || '%'
    """)


def downgrade() -> None:
    op.drop_column('schedule_events', 'stage_ready_time')
    op.drop_column('schedule_events', 'tour_venue_name')
    op.drop_column('schedule_events', 'tour_city')

    op.drop_index('ix_schedule_events_venue_id', table_name='schedule_events')
    op.drop_constraint('fk_events_venue_id', 'schedule_events', type_='foreignkey')
    op.drop_column('schedule_events', 'venue_id')

    op.drop_index('ix_venues_type', table_name='venues')
    op.drop_index('ix_venues_code', table_name='venues')
    op.drop_table('venues')

    op.execute('DROP TYPE IF EXISTS venuetype')
```

---

### Phase 2: SHOULD HAVE (Important for full functionality)

#### Migration 007: inventory_photos

```python
"""007_inventory_photos

Добавляет таблицу inventory_photos для фотографий инвентаря.

Revision ID: 007_inventory_photos
Revises: 006_venues
"""
# ... standard migration structure ...

def upgrade() -> None:
    op.create_table(
        'inventory_photos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('inventory_item_id', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('thumbnail_path', sa.String(500), nullable=True),
        sa.Column('is_main', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_inv_photos_item', 'inventory_photos', ['inventory_item_id'])
```

---

#### Migration 008: performance_inventory

```python
"""008_performance_inventory

Добавляет таблицу performance_inventory для связи спектаклей и инвентаря.

Revision ID: 008_performance_inventory
Revises: 007_inventory_photos
"""

def upgrade() -> None:
    op.create_table(
        'performance_inventory',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('performance_id', sa.Integer(), nullable=False),
        sa.Column('inventory_item_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_consumable', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('performance_id', 'inventory_item_id'),
        sa.ForeignKeyConstraint(['performance_id'], ['performances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id']),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_perf_inv_performance', 'performance_inventory', ['performance_id'])
    op.create_index('ix_perf_inv_item', 'performance_inventory', ['inventory_item_id'])
```

---

#### Migration 009: inventory_items_extensions

```python
"""009_inventory_items_extensions

Добавляет дополнительные поля в inventory_items.

Revision ID: 009_inventory_items_ext
Revises: 008_performance_inventory
"""

def upgrade() -> None:
    # Add missing fields
    op.add_column('inventory_items', sa.Column('technical_description', sa.Text(), nullable=True))
    op.add_column('inventory_items', sa.Column('unit', sa.String(50), nullable=True, server_default='шт'))
    op.add_column('inventory_items', sa.Column('width', sa.Numeric(10, 2), nullable=True))
    op.add_column('inventory_items', sa.Column('height', sa.Numeric(10, 2), nullable=True))
    op.add_column('inventory_items', sa.Column('depth', sa.Numeric(10, 2), nullable=True))
    op.add_column('inventory_items', sa.Column('weight', sa.Numeric(10, 2), nullable=True))
    op.add_column('inventory_items', sa.Column('serial_number', sa.String(100), nullable=True))
    op.add_column('inventory_items', sa.Column('manufacturer', sa.String(255), nullable=True))
    op.add_column('inventory_items', sa.Column('model', sa.String(255), nullable=True))
    op.add_column('inventory_items', sa.Column('condition', sa.String(50), nullable=True, server_default='good'))
    op.add_column('inventory_items', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    # Add indexes
    op.create_index('ix_inventory_items_deleted', 'inventory_items', ['deleted_at'])
    op.create_index('ix_inventory_items_cat_status', 'inventory_items', ['category_id', 'status'])
```

---

### Phase 3: NICE TO HAVE (Future enhancements)

#### Migration 010: tasks_module
#### Migration 011: notifications
#### Migration 012: refresh_tokens
#### Migration 013: checklists

---

## 5. Models to Create

### File Structure

```
backend/app/models/
├── __init__.py          # Update with new models
├── user.py              # Existing
├── theater.py           # Existing
├── inventory.py         # Existing (add InventoryPhoto)
├── performance.py       # Existing (add PerformanceInventory)
├── document.py          # Existing
├── schedule.py          # Existing (add venue relationship)
├── department.py        # NEW
├── venue.py             # NEW
├── task.py              # NEW (Phase 3)
├── notification.py      # NEW (Phase 3)
└── auth.py              # NEW (Phase 3, RefreshToken)
```

---

## 6. Effort Estimation

| Task | Complexity | Hours |
|------|------------|-------|
| **Phase 1: MUST HAVE** | | |
| Model: Department | Low | 1h |
| Model: Venue | Low | 1h |
| Migration: departments (005) | Medium | 2h |
| Migration: venues (006) | Medium | 2h |
| Update __init__.py and imports | Low | 0.5h |
| Update existing models (relationships) | Medium | 2h |
| **Subtotal Phase 1** | | **8.5h** |
| | | |
| **Phase 2: SHOULD HAVE** | | |
| Model: InventoryPhoto | Low | 0.5h |
| Model: PerformanceInventory | Low | 0.5h |
| Migration: inventory_photos (007) | Low | 1h |
| Migration: performance_inventory (008) | Low | 1h |
| Migration: inventory_items_ext (009) | Medium | 1.5h |
| **Subtotal Phase 2** | | **4.5h** |
| | | |
| **Phase 3: NICE TO HAVE** | | |
| Model: Task + Subtask + Comment + Attachment | Medium | 3h |
| Model: Notification | Low | 1h |
| Model: RefreshToken | Low | 0.5h |
| Migration: tasks_module (010) | High | 3h |
| Migration: notifications (011) | Low | 1h |
| Migration: refresh_tokens (012) | Low | 0.5h |
| Migration: checklists (013) | Medium | 2h |
| **Subtotal Phase 3** | | **11h** |
| | | |
| **TOTAL** | | **24h** |

---

## 7. Recommended Order of Implementation

### Week 1: Core Infrastructure (MUST HAVE)
1. Create `department.py` model
2. Create `venue.py` model
3. Create and apply migration 005_departments
4. Create and apply migration 006_venues
5. Update existing models with new relationships
6. Update `__init__.py` exports
7. Test all existing functionality

### Week 2: Data Extensions (SHOULD HAVE)
8. Create InventoryPhoto model (in inventory.py)
9. Create PerformanceInventory model (in performance.py)
10. Create and apply migration 007_inventory_photos
11. Create and apply migration 008_performance_inventory
12. Create and apply migration 009_inventory_items_ext
13. Migrate existing JSONB images to inventory_photos table

### Week 3+: Enhanced Features (NICE TO HAVE)
14. Create task.py with all task-related models
15. Create notification.py
16. Create auth.py with RefreshToken
17. Create remaining migrations
18. Implement checklist functionality

---

## 8. Risks and Mitigations

### Risk 1: Breaking Existing Functionality
**Impact:** High
**Probability:** Medium
**Mitigation:**
- Create comprehensive backup before each migration
- Run migrations on dev/staging first
- Write rollback scripts for each migration
- Maintain old text `venue` field while transitioning to `venue_id`

### Risk 2: Data Migration Complexity
**Impact:** Medium
**Probability:** Medium
**Mitigation:**
- Inventory photos: Keep JSONB `images` field during transition
- Schedule venues: Migrate text to FK gradually
- Add new fields as nullable, set defaults later

### Risk 3: Performance Impact of New Indexes
**Impact:** Low
**Probability:** Low
**Mitigation:**
- Create indexes during low-traffic periods
- Use CONCURRENTLY option for production indexes
- Monitor query performance after changes

### Risk 4: UUID vs Integer Primary Keys
**Impact:** High (if changing)
**Probability:** Low (recommend keeping Integer)
**Recommendation:**
- **Keep Integer PKs** for MVP simplicity
- UUID migration can be done post-MVP if needed
- Document the deviation from spec in architecture docs

### Risk 5: ENUM Type Changes
**Impact:** Medium
**Probability:** Medium
**Mitigation:**
- PostgreSQL ENUM changes require careful handling
- Use ALTER TYPE ... ADD VALUE for new values
- For value renames, create migration mapping

---

## 9. Architecture Notes

### Key Differences from Documentation

| Aspect | Documentation | Implementation | Decision |
|--------|--------------|----------------|----------|
| Primary Keys | UUID | Integer | Keep Integer for MVP |
| User full_name | Column | Computed property | Keep as property |
| inventory_locations | Separate table | storage_locations | Rename for consistency |
| venue | FK to venues | Text field | Migrate to FK |
| ItemStatus values | 6 values | 5 values | Add missing values |

### Multi-tenancy Pattern

Current implementation uses `theater_id` FK on all major tables. This is consistent with the documentation and provides good isolation.

### Soft Delete Pattern

Documentation specifies `deleted_at` for soft delete. Currently:
- `inventory_items`: uses `is_active` boolean
- Recommendation: Add `deleted_at` and keep `is_active` for backward compatibility

---

*Document generated: 2026-01-16*
*Based on: 03_DATABASE.md (v1.0) and current SQLAlchemy models*
