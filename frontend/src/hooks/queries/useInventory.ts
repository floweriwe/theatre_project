/**
 * Inventory Query Hooks — React Query integration
 *
 * Custom hooks for inventory data fetching with automatic caching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventory_service';
import { queryKeys } from '@/lib/queryClient';
import type {
  InventoryFilters,
  InventoryItemCreateRequest,
  InventoryItemUpdateRequest,
} from '@/types';

/**
 * Hook to fetch paginated inventory items list
 */
export function useInventoryItems(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.list(filters as unknown as Record<string, unknown>),
    queryFn: () => inventoryService.getItems(filters),
  });
}

/**
 * Hook to fetch a single inventory item by ID
 */
export function useInventoryItem(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.inventory.detail(id!),
    queryFn: () => inventoryService.getItem(id!),
    enabled: !!id && !isNaN(id),
  });
}

/**
 * Hook to fetch inventory statistics
 */
export function useInventoryStats() {
  return useQuery({
    queryKey: queryKeys.inventory.stats(),
    queryFn: () => inventoryService.getStats(),
  });
}

/**
 * Hook to fetch inventory categories
 */
export function useInventoryCategories() {
  return useQuery({
    queryKey: queryKeys.inventory.categories(),
    queryFn: () => inventoryService.getCategories(),
  });
}

/**
 * Hook to fetch storage locations
 */
export function useStorageLocations() {
  return useQuery({
    queryKey: queryKeys.inventory.locations(),
    queryFn: () => inventoryService.getLocations(),
  });
}

/**
 * Hook to create a new inventory item
 */
export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InventoryItemCreateRequest) =>
      inventoryService.createItem(data),
    onSuccess: () => {
      // Invalidate all inventory lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.stats() });
    },
  });
}

/**
 * Hook to update an existing inventory item
 */
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: InventoryItemUpdateRequest }) =>
      inventoryService.updateItem(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate the specific item and lists
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.stats() });
    },
  });
}

/**
 * Hook to delete an inventory item
 */
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inventoryService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.stats() });
    },
  });
}

/**
 * Hook to upload a photo to an inventory item
 */
export function useUploadInventoryPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, file, caption }: { itemId: number; file: File; caption?: string }) =>
      inventoryService.uploadPhoto(itemId, file, caption),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(itemId) });
    },
  });
}

/**
 * Hook to delete a photo from an inventory item
 */
export function useDeleteInventoryPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoId }: { photoId: number; itemId: number }) =>
      inventoryService.deletePhoto(photoId),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(itemId) });
    },
  });
}

/**
 * Hook to transfer an inventory item to a new location
 */
export function useTransferInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      toLocationId,
      comment,
    }: {
      itemId: number;
      toLocationId: number;
      comment?: string;
    }) => inventoryService.transferItem(itemId, toLocationId, comment),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(itemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
    },
  });
}

/**
 * Hook to reserve an inventory item
 */
export function useReserveInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      performanceId,
      comment,
    }: {
      itemId: number;
      performanceId?: number;
      comment?: string;
    }) => inventoryService.reserveItem(itemId, performanceId, comment),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(itemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.stats() });
    },
  });
}

/**
 * Hook to release an inventory item from reservation
 */
export function useReleaseInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, comment }: { itemId: number; comment?: string }) =>
      inventoryService.releaseItem(itemId, comment),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(itemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.stats() });
    },
  });
}
