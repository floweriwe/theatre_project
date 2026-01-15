"""
Репозитории для работы с базой данных.

Паттерн Repository инкапсулирует логику доступа к данным,
отделяя её от бизнес-логики сервисов.
"""
from app.repositories.base import BaseRepository
from app.repositories.user_repository import UserRepository
from app.repositories.inventory_repository import (
    InventoryCategoryRepository,
    StorageLocationRepository,
    InventoryItemRepository,
    InventoryMovementRepository,
)
from app.repositories.document_repository import (
    DocumentCategoryRepository,
    DocumentRepository,
    DocumentVersionRepository,
    TagRepository,
)
from app.repositories.performance_repository import (
    PerformanceRepository,
    PerformanceSectionRepository,
)
from app.repositories.schedule_repository import (
    ScheduleEventRepository,
    EventParticipantRepository,
)

__all__ = [
    "BaseRepository",
    "UserRepository",
    # Inventory
    "InventoryCategoryRepository",
    "StorageLocationRepository",
    "InventoryItemRepository",
    "InventoryMovementRepository",
    # Documents
    "DocumentCategoryRepository",
    "DocumentRepository",
    "DocumentVersionRepository",
    "TagRepository",
    # Performances
    "PerformanceRepository",
    "PerformanceSectionRepository",
    # Schedule
    "ScheduleEventRepository",
    "EventParticipantRepository",
]
