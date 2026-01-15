"""
Pydantic схемы для валидации и сериализации.

Схемы разделены по доменам: auth, user, theater и т.д.
"""
from app.schemas.base import BaseSchema, PaginatedResponse, MessageResponse
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest,
)
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserInDB,
)
from app.schemas.inventory import (
    # Categories
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryWithChildren,
    PaginatedCategories,
    # Locations
    LocationCreate,
    LocationUpdate,
    LocationResponse,
    LocationWithChildren,
    PaginatedLocations,
    # Items
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    InventoryItemListResponse,
    PaginatedItems,
    # Movements
    MovementCreate,
    MovementResponse,
    PaginatedMovements,
    # Stats & Filters
    InventoryStats,
    InventoryFilter,
    # Enums
    ItemStatus,
    MovementType,
)
from app.schemas.document import (
    # Tags
    TagCreate,
    TagResponse,
    # Categories
    DocCategoryCreate,
    DocCategoryUpdate,
    DocCategoryResponse,
    DocCategoryWithChildren,
    PaginatedDocCategories,
    # Documents
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListResponse,
    PaginatedDocuments,
    # Versions
    DocumentVersionResponse,
    # Stats & Filters
    DocumentStats,
    DocumentFilter,
    FileUploadResponse,
    # Enums
    DocumentStatus,
    FileType,
)
from app.schemas.performance import (
    # Sections
    SectionCreate,
    SectionUpdate,
    SectionResponse,
    # Performances
    PerformanceCreate,
    PerformanceUpdate,
    PerformanceResponse,
    PerformanceListResponse,
    PaginatedPerformances,
    # Stats & Filters
    PerformanceStats,
    PerformanceFilter,
    # Enums
    PerformanceStatus,
    SectionType,
)

__all__ = [
    # Base
    "BaseSchema",
    "PaginatedResponse",
    "MessageResponse",
    # Auth
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserInDB",
    # Inventory
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "CategoryWithChildren",
    "PaginatedCategories",
    "LocationCreate",
    "LocationUpdate",
    "LocationResponse",
    "LocationWithChildren",
    "PaginatedLocations",
    "InventoryItemCreate",
    "InventoryItemUpdate",
    "InventoryItemResponse",
    "InventoryItemListResponse",
    "PaginatedItems",
    "MovementCreate",
    "MovementResponse",
    "PaginatedMovements",
    "InventoryStats",
    "InventoryFilter",
    "ItemStatus",
    "MovementType",
    # Documents
    "TagCreate",
    "TagResponse",
    "DocCategoryCreate",
    "DocCategoryUpdate",
    "DocCategoryResponse",
    "DocCategoryWithChildren",
    "PaginatedDocCategories",
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentResponse",
    "DocumentListResponse",
    "PaginatedDocuments",
    "DocumentVersionResponse",
    "DocumentStats",
    "DocumentFilter",
    "FileUploadResponse",
    "DocumentStatus",
    "FileType",
    # Performances
    "SectionCreate",
    "SectionUpdate",
    "SectionResponse",
    "PerformanceCreate",
    "PerformanceUpdate",
    "PerformanceResponse",
    "PerformanceListResponse",
    "PaginatedPerformances",
    "PerformanceStats",
    "PerformanceFilter",
    "PerformanceStatus",
    "SectionType",
]
