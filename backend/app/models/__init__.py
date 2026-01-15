"""
SQLAlchemy модели.

Все модели импортируются здесь для удобства
и для корректной работы Alembic autogenerate.
"""
from app.models.user import User, Role, UserRole
from app.models.theater import Theater
from app.models.inventory import (
    InventoryCategory,
    StorageLocation,
    InventoryItem,
    InventoryMovement,
    ItemStatus,
    MovementType,
)
from app.models.performance import (
    Performance,
    PerformanceSection,
    PerformanceStatus,
    SectionType,
)
from app.models.document import (
    DocumentCategory,
    Document,
    DocumentVersion,
    Tag,
    DocumentStatus,
    FileType,
)
from app.models.schedule import (
    ScheduleEvent,
    EventParticipant,
    EventType,
    EventStatus,
    ParticipantRole,
    ParticipantStatus,
)

__all__ = [
    # User
    "User",
    "Role",
    "UserRole",
    # Theater
    "Theater",
    # Inventory
    "InventoryCategory",
    "StorageLocation",
    "InventoryItem",
    "InventoryMovement",
    "ItemStatus",
    "MovementType",
    # Performances
    "Performance",
    "PerformanceSection",
    "PerformanceStatus",
    "SectionType",
    # Documents
    "DocumentCategory",
    "Document",
    "DocumentVersion",
    "Tag",
    "DocumentStatus",
    "FileType",
    # Schedule
    "ScheduleEvent",
    "EventParticipant",
    "EventType",
    "EventStatus",
    "ParticipantRole",
    "ParticipantStatus",
]
