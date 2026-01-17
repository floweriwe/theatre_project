"""
Сервисы бизнес-логики.

Сервисы координируют работу репозиториев и реализуют
бизнес-правила приложения.
"""
from app.services.auth_service import AuthService
from app.services.minio_service import MinioService
from app.services.redis_service import RedisService
from app.services.document_tree_service import DocumentTreeService, document_tree_service
from app.services.bulk_operations_service import BulkOperationsService, BulkOperationResult
from app.services.qr_code_service import QRCodeService
from app.services.recurrence_service import RecurrenceService, RecurrencePattern
from app.services.conflict_detection_service import (
    ConflictDetectionService,
    ConflictSeverity,
    ConflictType,
    ScheduleConflict,
    ConflictCheckResult,
)
from app.services.resource_calendar_service import (
    ResourceCalendarService,
    ResourceSlot,
    ResourceDay,
    ResourceTimeline,
)

__all__ = [
    "AuthService",
    "MinioService",
    "RedisService",
    "DocumentTreeService",
    "document_tree_service",
    "BulkOperationsService",
    "BulkOperationResult",
    "QRCodeService",
    # Phase 14: Schedule Pro
    "RecurrenceService",
    "RecurrencePattern",
    "ConflictDetectionService",
    "ConflictSeverity",
    "ConflictType",
    "ScheduleConflict",
    "ConflictCheckResult",
    "ResourceCalendarService",
    "ResourceSlot",
    "ResourceDay",
    "ResourceTimeline",
]
