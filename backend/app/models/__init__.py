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
    InventoryCondition,
)
from app.models.inventory_photo import InventoryPhoto
from app.models.performance_inventory import PerformanceInventory
from app.models.performance import (
    Performance,
    PerformanceSection,
    PerformanceStatus,
    SectionType,
)
from app.models.checklist import (
    PerformanceChecklist,
    ChecklistItem,
)
from app.models.document import (
    DocumentCategory,
    Document,
    DocumentVersion,
    Tag,
    DocumentStatus,
    FileType,
)
from app.models.document_template import (
    DocumentTemplate,
    DocumentTemplateVariable,
    TemplateType,
    VariableType,
)
from app.models.schedule import (
    ScheduleEvent,
    EventParticipant,
    EventType,
    EventStatus,
    ParticipantRole,
    ParticipantStatus,
)
from app.models.department import Department, DepartmentType
from app.models.venue import Venue, VenueType

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
    "InventoryPhoto",
    "ItemStatus",
    "MovementType",
    "InventoryCondition",
    # Performances
    "Performance",
    "PerformanceInventory",
    "PerformanceSection",
    "PerformanceStatus",
    "SectionType",
    # Checklists
    "PerformanceChecklist",
    "ChecklistItem",
    # Documents
    "DocumentCategory",
    "Document",
    "DocumentVersion",
    "Tag",
    "DocumentStatus",
    "FileType",
    # Document Templates
    "DocumentTemplate",
    "DocumentTemplateVariable",
    "TemplateType",
    "VariableType",
    # Schedule
    "ScheduleEvent",
    "EventParticipant",
    "EventType",
    "EventStatus",
    "ParticipantRole",
    "ParticipantStatus",
    # Department
    "Department",
    "DepartmentType",
    # Venue
    "Venue",
    "VenueType",
]
