"""
Pydantic схемы модуля инвентаризации.

Содержит схемы для:
- Категорий инвентаря
- Мест хранения
- Предметов инвентаря
- Истории перемещений
"""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict

from app.schemas.base import PaginatedResponse


# =============================================================================
# Enums
# =============================================================================

class ItemStatus(str, Enum):
    """Статус предмета инвентаря."""
    
    IN_STOCK = "in_stock"
    RESERVED = "reserved"
    IN_USE = "in_use"
    REPAIR = "repair"
    WRITTEN_OFF = "written_off"


class MovementType(str, Enum):
    """Тип перемещения."""
    
    RECEIPT = "receipt"
    TRANSFER = "transfer"
    RESERVE = "reserve"
    RELEASE = "release"
    ISSUE = "issue"
    RETURN = "return"
    WRITE_OFF = "write_off"
    REPAIR_START = "repair_start"
    REPAIR_END = "repair_end"


# =============================================================================
# Category Schemas
# =============================================================================

class CategoryBase(BaseModel):
    """Базовая схема категории."""
    
    name: str = Field(..., min_length=1, max_length=100, description="Название категории")
    code: str = Field(..., min_length=1, max_length=50, description="Код категории")
    description: str | None = Field(None, max_length=2000, description="Описание")
    parent_id: int | None = Field(None, description="ID родительской категории")
    color: str | None = Field(None, max_length=7, description="HEX цвет")
    icon: str | None = Field(None, max_length=50, description="Название иконки")
    sort_order: int = Field(0, ge=0, description="Порядок сортировки")


class CategoryCreate(CategoryBase):
    """Схема создания категории."""
    pass


class CategoryUpdate(BaseModel):
    """Схема обновления категории."""
    
    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None
    parent_id: int | None = None
    color: str | None = None
    icon: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class CategoryResponse(CategoryBase):
    """Схема ответа категории."""
    
    id: int
    is_active: bool
    theater_id: int | None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CategoryWithChildren(CategoryResponse):
    """Категория с дочерними элементами."""
    
    children: list["CategoryWithChildren"] = []


# =============================================================================
# Location Schemas
# =============================================================================

class LocationBase(BaseModel):
    """Базовая схема места хранения."""
    
    name: str = Field(..., min_length=1, max_length=100, description="Название")
    code: str = Field(..., min_length=1, max_length=50, description="Код")
    description: str | None = Field(None, max_length=2000, description="Описание")
    parent_id: int | None = Field(None, description="ID родительского места")
    address: str | None = Field(None, max_length=255, description="Адрес")
    sort_order: int = Field(0, ge=0, description="Порядок сортировки")


class LocationCreate(LocationBase):
    """Схема создания места хранения."""
    pass


class LocationUpdate(BaseModel):
    """Схема обновления места хранения."""
    
    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None
    parent_id: int | None = None
    address: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class LocationResponse(LocationBase):
    """Схема ответа места хранения."""
    
    id: int
    is_active: bool
    theater_id: int | None
    full_path: str | None = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class LocationWithChildren(LocationResponse):
    """Место хранения с дочерними элементами."""
    
    children: list["LocationWithChildren"] = []


# =============================================================================
# Inventory Item Schemas
# =============================================================================

class InventoryItemBase(BaseModel):
    """Базовая схема предмета инвентаря."""
    
    name: str = Field(..., min_length=1, max_length=255, description="Название")
    description: str | None = Field(None, max_length=5000, description="Описание")
    category_id: int | None = Field(None, description="ID категории")
    location_id: int | None = Field(None, description="ID места хранения")
    quantity: int = Field(1, ge=1, description="Количество")
    purchase_price: float | None = Field(None, ge=0, description="Цена покупки")
    current_value: float | None = Field(None, ge=0, description="Текущая стоимость")
    purchase_date: datetime | None = Field(None, description="Дата покупки")
    warranty_until: datetime | None = Field(None, description="Гарантия до")
    custom_fields: dict | None = Field(None, description="Кастомные поля")


class InventoryItemCreate(InventoryItemBase):
    """Схема создания предмета инвентаря."""
    
    inventory_number: str | None = Field(
        None,
        min_length=1,
        max_length=50,
        description="Инвентарный номер (генерируется автоматически если не указан)"
    )


class InventoryItemUpdate(BaseModel):
    """Схема обновления предмета инвентаря."""
    
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    category_id: int | None = None
    location_id: int | None = None
    status: ItemStatus | None = None
    quantity: int | None = Field(None, ge=1)
    purchase_price: float | None = None
    current_value: float | None = None
    purchase_date: datetime | None = None
    warranty_until: datetime | None = None
    custom_fields: dict | None = None
    is_active: bool | None = None


class InventoryItemResponse(InventoryItemBase):
    """Схема ответа предмета инвентаря."""
    
    id: int
    inventory_number: str
    status: ItemStatus
    is_active: bool
    theater_id: int | None
    images: list[str] | None
    created_at: datetime
    updated_at: datetime
    
    # Вложенные объекты
    category: CategoryResponse | None = None
    location: LocationResponse | None = None
    
    model_config = ConfigDict(from_attributes=True)


class InventoryItemListResponse(BaseModel):
    """Схема для списка предметов (облегчённая)."""
    
    id: int
    name: str
    inventory_number: str
    status: ItemStatus
    quantity: int
    category_id: int | None
    category_name: str | None = None
    location_id: int | None
    location_name: str | None = None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Movement Schemas
# =============================================================================

class MovementCreate(BaseModel):
    """Схема создания перемещения."""
    
    item_id: int = Field(..., description="ID предмета")
    movement_type: MovementType = Field(..., description="Тип перемещения")
    to_location_id: int | None = Field(None, description="ID места назначения")
    quantity: int = Field(1, ge=1, description="Количество")
    comment: str | None = Field(None, max_length=1000, description="Комментарий")
    performance_id: int | None = Field(None, description="ID спектакля (для резервирования)")


class MovementResponse(BaseModel):
    """Схема ответа перемещения."""
    
    id: int
    item_id: int
    movement_type: MovementType
    from_location_id: int | None
    to_location_id: int | None
    quantity: int
    comment: str | None
    performance_id: int | None
    created_at: datetime
    created_by_id: int | None
    
    # Вложенные объекты
    from_location: LocationResponse | None = None
    to_location: LocationResponse | None = None
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Paginated Responses
# =============================================================================

class PaginatedItems(PaginatedResponse):
    """Постраничный список предметов."""
    
    items: list[InventoryItemListResponse]


class PaginatedCategories(PaginatedResponse):
    """Постраничный список категорий."""
    
    items: list[CategoryResponse]


class PaginatedLocations(PaginatedResponse):
    """Постраничный список мест хранения."""
    
    items: list[LocationResponse]


class PaginatedMovements(PaginatedResponse):
    """Постраничный список перемещений."""
    
    items: list[MovementResponse]


# =============================================================================
# Filter/Search Schemas
# =============================================================================

class InventoryFilter(BaseModel):
    """Фильтры для поиска предметов."""
    
    search: str | None = Field(None, description="Поиск по названию/номеру")
    category_id: int | None = Field(None, description="Фильтр по категории")
    location_id: int | None = Field(None, description="Фильтр по месту хранения")
    status: ItemStatus | None = Field(None, description="Фильтр по статусу")
    is_active: bool | None = Field(None, description="Фильтр по активности")


# =============================================================================
# Statistics
# =============================================================================

class InventoryStats(BaseModel):
    """Статистика инвентаря."""
    
    total_items: int = Field(..., description="Всего предметов")
    in_stock: int = Field(..., description="На складе")
    reserved: int = Field(..., description="Зарезервировано")
    in_use: int = Field(..., description="В использовании")
    in_repair: int = Field(..., description="В ремонте")
    written_off: int = Field(..., description="Списано")
    total_value: float = Field(..., description="Общая стоимость")
    categories_count: int = Field(..., description="Количество категорий")
    locations_count: int = Field(..., description="Количество мест хранения")
