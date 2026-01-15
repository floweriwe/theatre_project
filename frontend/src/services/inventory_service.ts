/**
 * API сервис модуля инвентаризации.
 * 
 * Методы для работы с:
 * - Предметами инвентаря
 * - Категориями
 * - Местами хранения
 * - Статистикой
 */

import api from './api';
import type {
  InventoryItem,
  InventoryItemList,
  InventoryCategory,
  StorageLocation,
  InventoryMovement,
  InventoryStats,
  PaginatedItems,
  InventoryFilters,
  InventoryItemCreateRequest,
  InventoryItemUpdateRequest,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  LocationCreateRequest,
  LocationUpdateRequest,
} from '@/types';

// =============================================================================
// Transformers (snake_case -> camelCase)
// =============================================================================

function transformItem(data: Record<string, unknown>): InventoryItem {
  return {
    id: data.id as number,
    name: data.name as string,
    inventoryNumber: data.inventory_number as string,
    description: data.description as string | null,
    categoryId: data.category_id as number | null,
    locationId: data.location_id as number | null,
    status: data.status as InventoryItem['status'],
    quantity: data.quantity as number,
    purchasePrice: data.purchase_price as number | null,
    currentValue: data.current_value as number | null,
    purchaseDate: data.purchase_date as string | null,
    warrantyUntil: data.warranty_until as string | null,
    customFields: data.custom_fields as Record<string, unknown> | null,
    images: data.images as string[] | null,
    isActive: data.is_active as boolean,
    theaterId: data.theater_id as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    category: data.category ? transformCategory(data.category as Record<string, unknown>) : null,
    location: data.location ? transformLocation(data.location as Record<string, unknown>) : null,
  };
}

function transformItemList(data: Record<string, unknown>): InventoryItemList {
  return {
    id: data.id as number,
    name: data.name as string,
    inventoryNumber: data.inventory_number as string,
    status: data.status as InventoryItemList['status'],
    quantity: data.quantity as number,
    categoryId: data.category_id as number | null,
    categoryName: data.category_name as string | null,
    locationId: data.location_id as number | null,
    locationName: data.location_name as string | null,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string,
  };
}

function transformCategory(data: Record<string, unknown>): InventoryCategory {
  return {
    id: data.id as number,
    name: data.name as string,
    code: data.code as string,
    description: data.description as string | null,
    parentId: data.parent_id as number | null,
    color: data.color as string | null,
    icon: data.icon as string | null,
    sortOrder: data.sort_order as number,
    isActive: data.is_active as boolean,
    theaterId: data.theater_id as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    children: data.children 
      ? (data.children as Record<string, unknown>[]).map(transformCategory)
      : undefined,
  };
}

function transformLocation(data: Record<string, unknown>): StorageLocation {
  return {
    id: data.id as number,
    name: data.name as string,
    code: data.code as string,
    description: data.description as string | null,
    parentId: data.parent_id as number | null,
    address: data.address as string | null,
    sortOrder: data.sort_order as number,
    isActive: data.is_active as boolean,
    theaterId: data.theater_id as number | null,
    fullPath: data.full_path as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    children: data.children 
      ? (data.children as Record<string, unknown>[]).map(transformLocation)
      : undefined,
  };
}

function transformMovement(data: Record<string, unknown>): InventoryMovement {
  return {
    id: data.id as number,
    itemId: data.item_id as number,
    movementType: data.movement_type as InventoryMovement['movementType'],
    fromLocationId: data.from_location_id as number | null,
    toLocationId: data.to_location_id as number | null,
    quantity: data.quantity as number,
    comment: data.comment as string | null,
    performanceId: data.performance_id as number | null,
    createdAt: data.created_at as string,
    createdById: data.created_by_id as number | null,
    fromLocation: data.from_location 
      ? transformLocation(data.from_location as Record<string, unknown>) 
      : null,
    toLocation: data.to_location 
      ? transformLocation(data.to_location as Record<string, unknown>) 
      : null,
  };
}

function transformStats(data: Record<string, unknown>): InventoryStats {
  return {
    totalItems: data.total_items as number,
    inStock: data.in_stock as number,
    reserved: data.reserved as number,
    inUse: data.in_use as number,
    inRepair: data.in_repair as number,
    writtenOff: data.written_off as number,
    totalValue: data.total_value as number,
    categoriesCount: data.categories_count as number,
    locationsCount: data.locations_count as number,
  };
}

// =============================================================================
// Request Transformers (camelCase -> snake_case)
// =============================================================================

function toSnakeCase<T extends object>(data: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    
    // camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = value;
  }
  
  return result;
}

// =============================================================================
// API Service
// =============================================================================

export const inventoryService = {
  // ===========================================================================
  // Items
  // ===========================================================================
  
  /**
   * Получить список предметов с фильтрацией.
   */
  async getItems(filters: InventoryFilters = {}): Promise<PaginatedItems> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('category_id', String(filters.categoryId));
    if (filters.locationId) params.append('location_id', String(filters.locationId));
    if (filters.status) params.append('status', filters.status);
    if (filters.isActive !== undefined) params.append('is_active', String(filters.isActive));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    
    const response = await api.get(`/inventory/items?${params.toString()}`);
    const data = response.data;
    
    return {
      items: data.items.map(transformItemList),
      total: data.total,
      page: data.page,
      limit: data.limit,
      pages: data.pages,
    };
  },
  
  /**
   * Получить предмет по ID.
   */
  async getItem(id: number): Promise<InventoryItem> {
    const response = await api.get(`/inventory/items/${id}`);
    return transformItem(response.data);
  },
  
  /**
   * Создать предмет.
   */
  async createItem(data: InventoryItemCreateRequest): Promise<InventoryItem> {
    const response = await api.post('/inventory/items', toSnakeCase(data));
    return transformItem(response.data);
  },
  
  /**
   * Обновить предмет.
   */
  async updateItem(id: number, data: InventoryItemUpdateRequest): Promise<InventoryItem> {
    const response = await api.patch(`/inventory/items/${id}`, toSnakeCase(data));
    return transformItem(response.data);
  },
  
  /**
   * Удалить предмет.
   */
  async deleteItem(id: number): Promise<void> {
    await api.delete(`/inventory/items/${id}`);
  },
  
  // ===========================================================================
  // Item Actions
  // ===========================================================================
  
  /**
   * Переместить предмет.
   */
  async transferItem(
    id: number, 
    toLocationId: number, 
    comment?: string
  ): Promise<InventoryItem> {
    const params = new URLSearchParams({ to_location_id: String(toLocationId) });
    if (comment) params.append('comment', comment);
    
    const response = await api.post(`/inventory/items/${id}/transfer?${params.toString()}`);
    return transformItem(response.data);
  },
  
  /**
   * Зарезервировать предмет.
   */
  async reserveItem(
    id: number, 
    performanceId?: number, 
    comment?: string
  ): Promise<InventoryItem> {
    const params = new URLSearchParams();
    if (performanceId) params.append('performance_id', String(performanceId));
    if (comment) params.append('comment', comment);
    
    const response = await api.post(`/inventory/items/${id}/reserve?${params.toString()}`);
    return transformItem(response.data);
  },
  
  /**
   * Освободить из резерва.
   */
  async releaseItem(id: number, comment?: string): Promise<InventoryItem> {
    const params = comment ? new URLSearchParams({ comment }) : '';
    const response = await api.post(`/inventory/items/${id}/release?${params}`);
    return transformItem(response.data);
  },
  
  /**
   * Списать предмет.
   */
  async writeOffItem(id: number, comment?: string): Promise<InventoryItem> {
    const params = comment ? new URLSearchParams({ comment }) : '';
    const response = await api.post(`/inventory/items/${id}/write-off?${params}`);
    return transformItem(response.data);
  },
  
  /**
   * Получить историю перемещений.
   */
  async getItemMovements(id: number): Promise<InventoryMovement[]> {
    const response = await api.get(`/inventory/items/${id}/movements`);
    return response.data.map(transformMovement);
  },
  
  // ===========================================================================
  // Categories
  // ===========================================================================
  
  /**
   * Получить список категорий.
   */
  async getCategories(): Promise<InventoryCategory[]> {
    const response = await api.get('/inventory/categories');
    return response.data.map(transformCategory);
  },
  
  /**
   * Получить дерево категорий.
   */
  async getCategoriesTree(): Promise<InventoryCategory[]> {
    const response = await api.get('/inventory/categories/tree');
    return response.data.map(transformCategory);
  },
  
  /**
   * Получить категорию по ID.
   */
  async getCategory(id: number): Promise<InventoryCategory> {
    const response = await api.get(`/inventory/categories/${id}`);
    return transformCategory(response.data);
  },
  
  /**
   * Создать категорию.
   */
  async createCategory(data: CategoryCreateRequest): Promise<InventoryCategory> {
    const response = await api.post('/inventory/categories', toSnakeCase(data));
    return transformCategory(response.data);
  },
  
  /**
   * Обновить категорию.
   */
  async updateCategory(id: number, data: CategoryUpdateRequest): Promise<InventoryCategory> {
    const response = await api.patch(`/inventory/categories/${id}`, toSnakeCase(data));
    return transformCategory(response.data);
  },
  
  /**
   * Удалить категорию.
   */
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/inventory/categories/${id}`);
  },
  
  // ===========================================================================
  // Locations
  // ===========================================================================
  
  /**
   * Получить список мест хранения.
   */
  async getLocations(): Promise<StorageLocation[]> {
    const response = await api.get('/inventory/locations');
    return response.data.map(transformLocation);
  },
  
  /**
   * Получить дерево мест хранения.
   */
  async getLocationsTree(): Promise<StorageLocation[]> {
    const response = await api.get('/inventory/locations/tree');
    return response.data.map(transformLocation);
  },
  
  /**
   * Получить место хранения по ID.
   */
  async getLocation(id: number): Promise<StorageLocation> {
    const response = await api.get(`/inventory/locations/${id}`);
    return transformLocation(response.data);
  },
  
  /**
   * Создать место хранения.
   */
  async createLocation(data: LocationCreateRequest): Promise<StorageLocation> {
    const response = await api.post('/inventory/locations', toSnakeCase(data));
    return transformLocation(response.data);
  },
  
  /**
   * Обновить место хранения.
   */
  async updateLocation(id: number, data: LocationUpdateRequest): Promise<StorageLocation> {
    const response = await api.patch(`/inventory/locations/${id}`, toSnakeCase(data));
    return transformLocation(response.data);
  },
  
  /**
   * Удалить место хранения.
   */
  async deleteLocation(id: number): Promise<void> {
    await api.delete(`/inventory/locations/${id}`);
  },
  
  // ===========================================================================
  // Stats
  // ===========================================================================
  
  /**
   * Получить статистику инвентаря.
   */
  async getStats(): Promise<InventoryStats> {
    const response = await api.get('/inventory/stats');
    return transformStats(response.data);
  },
};

export default inventoryService;
