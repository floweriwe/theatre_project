/**
 * React Query Configuration — Theatre Management System
 *
 * Centralized QueryClient configuration with caching settings
 * optimized for the theatre management workflows.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient instance with default configuration:
 * - staleTime: 5 minutes - data stays fresh for 5 minutes
 * - gcTime: 10 minutes - unused cache garbage collected after 10 minutes
 * - refetchOnWindowFocus: false - don't refetch when window gains focus
 * - retry: 1 - retry failed requests once
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Query key factory for consistent key generation
 */
export const queryKeys = {
  // Inventory
  inventory: {
    all: ['inventory'] as const,
    lists: () => [...queryKeys.inventory.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.inventory.lists(), filters] as const,
    details: () => [...queryKeys.inventory.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.inventory.details(), id] as const,
    stats: () => [...queryKeys.inventory.all, 'stats'] as const,
    categories: () => [...queryKeys.inventory.all, 'categories'] as const,
    locations: () => [...queryKeys.inventory.all, 'locations'] as const,
  },

  // Performances
  performances: {
    all: ['performances'] as const,
    lists: () => [...queryKeys.performances.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.performances.lists(), filters] as const,
    details: () => [...queryKeys.performances.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.performances.details(), id] as const,
    stats: () => [...queryKeys.performances.all, 'stats'] as const,
  },

  // Schedule
  schedule: {
    all: ['schedule'] as const,
    events: () => [...queryKeys.schedule.all, 'events'] as const,
    eventsForPeriod: (startDate: string, endDate: string) =>
      [...queryKeys.schedule.events(), { startDate, endDate }] as const,
    event: (id: number) => [...queryKeys.schedule.all, 'event', id] as const,
    conflicts: () => [...queryKeys.schedule.all, 'conflicts'] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.documents.lists(), filters] as const,
    details: () => [...queryKeys.documents.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.documents.details(), id] as const,
    stats: () => [...queryKeys.documents.all, 'stats'] as const,
  },

  // Users / Staff
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
  },

  // Reference data
  departments: () => ['departments'] as const,
  venues: () => ['venues'] as const,
};

export default queryClient;
