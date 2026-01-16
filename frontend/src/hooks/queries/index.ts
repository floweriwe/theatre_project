/**
 * Query Hooks — React Query integration
 *
 * Re-exports all domain-specific query hooks.
 */

// Inventory
export {
  useInventoryItems,
  useInventoryItem,
  useInventoryStats,
  useInventoryCategories,
  useStorageLocations,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useUploadInventoryPhoto,
  useDeleteInventoryPhoto,
  useTransferInventoryItem,
  useReserveInventoryItem,
  useReleaseInventoryItem,
} from './useInventory';

// Performances
export {
  usePerformances,
  useRepertoire,
  usePerformance,
  usePerformanceStats,
  useCreatePerformance,
  useUpdatePerformance,
  useDeletePerformance,
  usePerformanceInventory,
  useAddPerformanceInventory,
  usePerformanceSections,
} from './usePerformances';

// Schedule
export {
  useScheduleEvents,
  useScheduleEventsForPeriod,
  useUpcomingEvents,
  useScheduleEvent,
  useCreateScheduleEvent,
  useUpdateScheduleEvent,
  useDeleteScheduleEvent,
  useEventParticipants,
  useCalendar,
  useScheduleStats,
} from './useSchedule';
