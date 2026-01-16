/**
 * Типы модуля инвентаризации.
 */

/** Статус предмета инвентаря */
export type ItemStatus = 'in_stock' | 'reserved' | 'in_use' | 'repair' | 'written_off';

/** Тип перемещения */
export type MovementType =
  | 'receipt'
  | 'transfer'
  | 'reserve'
  | 'release'
  | 'issue'
  | 'return'
  | 'write_off'
  | 'repair_start'
  | 'repair_end';

/** Физическое состояние предмета */
export type InventoryCondition = 'new' | 'good' | 'fair' | 'poor' | 'broken';

/** Фотография предмета инвентаря */
export interface InventoryPhoto {
  id: number;
  itemId: number;
  filePath: string;
  isPrimary: boolean;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Категория инвентаря */
export interface InventoryCategory {
  id: number;
  name: string;
  code: string;
  description: string | null;
  parentId: number | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  theaterId: number | null;
  createdAt: string;
  updatedAt: string;
  children?: InventoryCategory[];
}

/** Место хранения */
export interface StorageLocation {
  id: number;
  name: string;
  code: string;
  description: string | null;
  parentId: number | null;
  address: string | null;
  sortOrder: number;
  isActive: boolean;
  theaterId: number | null;
  fullPath: string | null;
  createdAt: string;
  updatedAt: string;
  children?: StorageLocation[];
}

/** Предмет инвентаря (полный) */
export interface InventoryItem {
  id: number;
  name: string;
  inventoryNumber: string;
  description: string | null;
  categoryId: number | null;
  locationId: number | null;
  status: ItemStatus;
  quantity: number;
  purchasePrice: number | null;
  currentValue: number | null;
  purchaseDate: string | null;
  warrantyUntil: string | null;
  customFields: Record<string, unknown> | null;
  images: string[] | null;
  isActive: boolean;
  theaterId: number | null;
  createdAt: string;
  updatedAt: string;
  category: InventoryCategory | null;
  location: StorageLocation | null;
  // Физические характеристики
  dimensions: string | null;
  weight: number | null;
  condition: InventoryCondition | null;
  // Фотографии
  photos: InventoryPhoto[];
}

/** Предмет инвентаря (для списка) */
export interface InventoryItemList {
  id: number;
  name: string;
  inventoryNumber: string;
  status: ItemStatus;
  quantity: number;
  categoryId: number | null;
  categoryName: string | null;
  locationId: number | null;
  locationName: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Перемещение инвентаря */
export interface InventoryMovement {
  id: number;
  itemId: number;
  movementType: MovementType;
  fromLocationId: number | null;
  toLocationId: number | null;
  quantity: number;
  comment: string | null;
  performanceId: number | null;
  createdAt: string;
  createdById: number | null;
  fromLocation: StorageLocation | null;
  toLocation: StorageLocation | null;
}

/** Статистика инвентаря */
export interface InventoryStats {
  totalItems: number;
  inStock: number;
  reserved: number;
  inUse: number;
  inRepair: number;
  writtenOff: number;
  totalValue: number;
  categoriesCount: number;
  locationsCount: number;
}

// =============================================================================
// Request Types
// =============================================================================

/** Создание категории */
export interface CategoryCreateRequest {
  name: string;
  code: string;
  description?: string;
  parentId?: number;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

/** Обновление категории */
export interface CategoryUpdateRequest {
  name?: string;
  code?: string;
  description?: string;
  parentId?: number;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/** Создание места хранения */
export interface LocationCreateRequest {
  name: string;
  code: string;
  description?: string;
  parentId?: number;
  address?: string;
  sortOrder?: number;
}

/** Обновление места хранения */
export interface LocationUpdateRequest {
  name?: string;
  code?: string;
  description?: string;
  parentId?: number;
  address?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/** Создание предмета инвентаря */
export interface InventoryItemCreateRequest {
  name: string;
  inventoryNumber?: string;
  description?: string;
  categoryId?: number;
  locationId?: number;
  quantity?: number;
  purchasePrice?: number;
  currentValue?: number;
  purchaseDate?: string;
  warrantyUntil?: string;
  customFields?: Record<string, unknown>;
}

/** Обновление предмета инвентаря */
export interface InventoryItemUpdateRequest {
  name?: string;
  description?: string;
  categoryId?: number;
  locationId?: number;
  status?: ItemStatus;
  quantity?: number;
  purchasePrice?: number;
  currentValue?: number;
  purchaseDate?: string;
  warrantyUntil?: string;
  customFields?: Record<string, unknown>;
  isActive?: boolean;
}

// =============================================================================
// Response Types
// =============================================================================

/** Пагинированный ответ с предметами */
export interface PaginatedItems {
  items: InventoryItemList[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// =============================================================================
// Filter Types
// =============================================================================

/** Фильтры для списка предметов */
export interface InventoryFilters {
  search?: string;
  categoryId?: number;
  locationId?: number;
  status?: ItemStatus;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// =============================================================================
// UI Helpers
// =============================================================================

/** Метки статусов */
export const STATUS_LABELS: Record<ItemStatus, string> = {
  in_stock: 'На складе',
  reserved: 'Зарезервирован',
  in_use: 'В использовании',
  repair: 'На ремонте',
  written_off: 'Списан',
};

/** Цвета статусов */
export const STATUS_COLORS: Record<ItemStatus, string> = {
  in_stock: 'success',
  reserved: 'warning',
  in_use: 'primary',
  repair: 'error',
  written_off: 'default',
};

/** Метки типов перемещений */
export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  receipt: 'Поступление',
  transfer: 'Перемещение',
  reserve: 'Резервирование',
  release: 'Освобождение',
  issue: 'Выдача',
  return: 'Возврат',
  write_off: 'Списание',
  repair_start: 'В ремонт',
  repair_end: 'Из ремонта',
};

/** Метки физического состояния */
export const CONDITION_LABELS: Record<InventoryCondition, string> = {
  new: 'Новый',
  good: 'Хорошее',
  fair: 'Удовл.',
  poor: 'Плохое',
  broken: 'Сломан',
};

/** Варианты бейджа для состояния (используется с Badge variant) */
export const CONDITION_VARIANTS: Record<InventoryCondition, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  new: 'success',
  good: 'info',
  fair: 'warning',
  poor: 'error',
  broken: 'error',
};
