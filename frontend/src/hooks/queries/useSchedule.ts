/**
 * Schedule Query Hooks — React Query integration
 *
 * Custom hooks for schedule data fetching with automatic caching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '@/services/schedule_service';
import { queryKeys } from '@/lib/queryClient';
import type { EventFilters, EventCreateRequest, EventUpdateRequest } from '@/types';

/**
 * Hook to fetch schedule events with filters
 */
export function useScheduleEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: queryKeys.schedule.events(),
    queryFn: () => scheduleService.getEvents(filters),
  });
}

/**
 * Hook to fetch schedule events for a specific period
 */
export function useScheduleEventsForPeriod(params: {
  startDate: string;
  endDate: string;
  eventType?: string;
  venueId?: number;
  performanceId?: number;
}) {
  return useQuery({
    queryKey: queryKeys.schedule.eventsForPeriod(params.startDate, params.endDate),
    queryFn: () => scheduleService.getEventsForPeriod(params),
    enabled: !!(params.startDate && params.endDate),
  });
}

/**
 * Hook to fetch upcoming events
 */
export function useUpcomingEvents(days: number = 7, limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.schedule.all, 'upcoming', { days, limit }] as const,
    queryFn: () => scheduleService.getUpcoming(days, limit),
  });
}

/**
 * Hook to fetch a single event by ID
 */
export function useScheduleEvent(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.schedule.event(id!),
    queryFn: () => scheduleService.getEvent(id!),
    enabled: !!id && !isNaN(id),
  });
}

/**
 * Hook to create a new schedule event
 */
export function useCreateScheduleEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EventCreateRequest) =>
      scheduleService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule.all });
    },
  });
}

/**
 * Hook to update a schedule event
 */
export function useUpdateScheduleEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EventUpdateRequest }) =>
      scheduleService.updateEvent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule.event(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule.events() });
    },
  });
}

/**
 * Hook to delete a schedule event
 */
export function useDeleteScheduleEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => scheduleService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule.all });
    },
  });
}

/**
 * Hook to fetch event participants
 */
export function useEventParticipants(eventId: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.schedule.event(eventId!), 'participants'] as const,
    queryFn: () => scheduleService.getParticipants(eventId!),
    enabled: !!eventId && !isNaN(eventId),
  });
}

/**
 * Hook to fetch calendar data for a month
 */
export function useCalendar(year: number, month: number) {
  return useQuery({
    queryKey: [...queryKeys.schedule.all, 'calendar', { year, month }] as const,
    queryFn: () => scheduleService.getCalendar(year, month),
  });
}

/**
 * Hook to fetch schedule statistics
 */
export function useScheduleStats() {
  return useQuery({
    queryKey: [...queryKeys.schedule.all, 'stats'] as const,
    queryFn: () => scheduleService.getStats(),
  });
}
