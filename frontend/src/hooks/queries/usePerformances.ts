/**
 * Performances Query Hooks — React Query integration
 *
 * Custom hooks for performances data fetching with automatic caching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performanceService } from '@/services/performance_service';
import { queryKeys } from '@/lib/queryClient';
import type {
  PerformanceFilters,
  PerformanceCreateRequest,
  PerformanceUpdateRequest,
  AddPerformanceInventoryRequest,
} from '@/types';

/**
 * Hook to fetch performances list
 */
export function usePerformances(filters: PerformanceFilters = {}) {
  return useQuery({
    queryKey: queryKeys.performances.list(filters as unknown as Record<string, unknown>),
    queryFn: () => performanceService.getPerformances(filters),
  });
}

/**
 * Hook to fetch repertoire (active performances)
 */
export function useRepertoire() {
  return useQuery({
    queryKey: [...queryKeys.performances.all, 'repertoire'] as const,
    queryFn: () => performanceService.getRepertoire(),
  });
}

/**
 * Hook to fetch a single performance by ID
 */
export function usePerformance(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.performances.detail(id!),
    queryFn: () => performanceService.getPerformance(id!),
    enabled: !!id && !isNaN(id),
  });
}

/**
 * Hook to fetch performance statistics
 */
export function usePerformanceStats() {
  return useQuery({
    queryKey: queryKeys.performances.stats(),
    queryFn: () => performanceService.getStats(),
  });
}

/**
 * Hook to create a new performance
 */
export function useCreatePerformance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PerformanceCreateRequest) =>
      performanceService.createPerformance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.performances.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.performances.stats() });
    },
  });
}

/**
 * Hook to update a performance
 */
export function useUpdatePerformance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PerformanceUpdateRequest }) =>
      performanceService.updatePerformance(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.performances.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.performances.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.performances.stats() });
    },
  });
}

/**
 * Hook to delete a performance
 */
export function useDeletePerformance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => performanceService.deletePerformance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.performances.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.performances.stats() });
    },
  });
}

/**
 * Hook to fetch performance inventory
 */
export function usePerformanceInventory(performanceId: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.performances.detail(performanceId!), 'inventory'] as const,
    queryFn: () => performanceService.getInventory(performanceId!),
    enabled: !!performanceId && !isNaN(performanceId),
  });
}

/**
 * Hook to add inventory item to performance
 */
export function useAddPerformanceInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      data,
    }: {
      performanceId: number;
      data: AddPerformanceInventoryRequest;
    }) => performanceService.addInventory(performanceId, data),
    onSuccess: (_, { performanceId }) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.performances.detail(performanceId), 'inventory'] as const,
      });
    },
  });
}

/**
 * Hook to fetch performance sections (technical passport)
 */
export function usePerformanceSections(performanceId: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.performances.detail(performanceId!), 'sections'] as const,
    queryFn: () => performanceService.getSections(performanceId!),
    enabled: !!performanceId && !isNaN(performanceId),
  });
}
