/**
 * Schedule Service — API сервис для работы с расписанием.
 * 
 * Работает с реальным backend API /schedule.
 */

import api from './api';
import type {
  ScheduleEvent,
  ScheduleEventListItem,
  EventParticipant,
  PaginatedEvents,
  EventFilters,
  EventCreateRequest,
  EventUpdateRequest,
  CalendarDay,
  ScheduleStats,
} from '@/types';

// =============================================================================
// Transformers (snake_case -> camelCase)
// =============================================================================

/**
 * Преобразовать участника из API формата.
 */
function transformParticipant(data: Record<string, unknown>): EventParticipant {
  return {
    id: data.id as number,
    eventId: data.event_id as number,
    userId: data.user_id as number,
    role: data.role as EventParticipant['role'],
    status: data.status as EventParticipant['status'],
    note: data.note as string | null,
    userName: data.user_name as string | null,
  };
}

/**
 * Преобразовать событие (полное) из API формата.
 */
function transformEvent(data: Record<string, unknown>): ScheduleEvent {
  return {
    id: data.id as number,
    title: data.title as string,
    description: data.description as string | null,
    eventType: data.event_type as ScheduleEvent['eventType'],
    status: data.status as ScheduleEvent['status'],
    eventDate: data.event_date as string,
    startTime: data.start_time as string,
    endTime: data.end_time as string | null,
    venue: data.venue as string | null,
    performanceId: data.performance_id as number | null,
    color: data.color as string | null,
    metadata: data.metadata as Record<string, unknown> | null,
    isPublic: data.is_public as boolean,
    isActive: data.is_active as boolean,
    theaterId: data.theater_id as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    performanceTitle: data.performance_title as string | null,
    participants: data.participants 
      ? (data.participants as Record<string, unknown>[]).map(transformParticipant)
      : [],
  };
}

/**
 * Преобразовать событие для списка из API формата.
 */
function transformEventListItem(data: Record<string, unknown>): ScheduleEventListItem {
  return {
    id: data.id as number,
    title: data.title as string,
    eventType: data.event_type as ScheduleEventListItem['eventType'],
    status: data.status as ScheduleEventListItem['status'],
    eventDate: data.event_date as string,
    startTime: data.start_time as string,
    endTime: data.end_time as string | null,
    venue: data.venue as string | null,
    color: data.color as string | null,
    isPublic: data.is_public as boolean,
    performanceId: data.performance_id as number | null,
    performanceTitle: data.performance_title as string | null,
    participantsCount: data.participants_count as number,
  };
}

/**
 * Преобразовать статистику из API формата.
 */
function transformStats(data: Record<string, unknown>): ScheduleStats {
  return {
    totalEvents: data.total_events as number,
    planned: data.planned as number,
    confirmed: data.confirmed as number,
    completed: data.completed as number,
    cancelled: data.cancelled as number,
    performancesCount: data.performances_count as number,
    rehearsalsCount: data.rehearsals_count as number,
    otherCount: data.other_count as number,
    upcomingEvents: data.upcoming_events as number,
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

export const scheduleService = {
  // ===========================================================================
  // Events CRUD
  // ===========================================================================
  
  /**
   * Получить список событий с фильтрацией и пагинацией.
   */
  async getEvents(filters: EventFilters = {}): Promise<PaginatedEvents> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.eventType) params.append('event_type', filters.eventType);
    if (filters.status) params.append('status', filters.status);
    if (filters.performanceId) params.append('performance_id', String(filters.performanceId));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    
    const response = await api.get(`/schedule?${params.toString()}`);
    const data = response.data;
    
    return {
      items: data.items.map(transformEventListItem),
      total: data.total,
      page: data.page,
      limit: data.limit,
      pages: data.pages,
    };
  },

  /**
   * Получить события за период (для календаря).
   * Возвращает массив событий вместо пагинированного ответа.
   */
  async getEventsForPeriod(params: {
    startDate: string;
    endDate: string;
    performanceId?: number;
    eventType?: string;
  }): Promise<ScheduleEvent[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('date_from', params.startDate.split('T')[0]);
    queryParams.append('date_to', params.endDate.split('T')[0]);
    queryParams.append('limit', '100'); // Достаточно для месячного view
    
    if (params.performanceId) {
      queryParams.append('performance_id', String(params.performanceId));
    }
    if (params.eventType) {
      queryParams.append('event_type', params.eventType);
    }
    
    const response = await api.get(`/schedule?${queryParams.toString()}`);
    const data = response.data;
    
    // Преобразуем items из списочного формата в полный формат
    // Для календаря нам достаточно базовых полей
    return data.items.map((item: Record<string, unknown>) => ({
      id: item.id as number,
      title: item.title as string,
      description: null,
      eventType: item.event_type as ScheduleEvent['eventType'],
      status: item.status as ScheduleEvent['status'],
      eventDate: item.event_date as string,
      startTime: item.start_time as string,
      endTime: item.end_time as string | null,
      venue: item.venue as string | null,
      performanceId: item.performance_id as number | null,
      color: item.color as string | null,
      metadata: null,
      isPublic: item.is_public as boolean,
      isActive: true,
      theaterId: null,
      createdAt: '',
      updatedAt: '',
      performanceTitle: item.performance_title as string | null,
      participants: [],
    }));
  },

  /**
   * Получить предстоящие события.
   */
  async getUpcoming(days: number = 7, limit: number = 10): Promise<ScheduleEventListItem[]> {
    const params = new URLSearchParams({
      days: String(days),
      limit: String(limit),
    });
    
    const response = await api.get(`/schedule/upcoming?${params.toString()}`);
    return response.data.map(transformEventListItem);
  },

  /**
   * Получить событие по ID.
   */
  async getEvent(id: number): Promise<ScheduleEvent> {
    const response = await api.get(`/schedule/${id}`);
    return transformEvent(response.data);
  },

  /**
   * Создать событие.
   */
  async createEvent(data: EventCreateRequest): Promise<ScheduleEvent> {
    const response = await api.post('/schedule', toSnakeCase(data));
    return transformEvent(response.data);
  },

  /**
   * Обновить событие.
   */
  async updateEvent(id: number, data: EventUpdateRequest): Promise<ScheduleEvent> {
    const response = await api.patch(`/schedule/${id}`, toSnakeCase(data));
    return transformEvent(response.data);
  },

  /**
   * Удалить событие.
   */
  async deleteEvent(id: number): Promise<void> {
    await api.delete(`/schedule/${id}`);
  },

  // ===========================================================================
  // Status Actions
  // ===========================================================================

  /**
   * Подтвердить событие.
   */
  async confirmEvent(id: number): Promise<ScheduleEvent> {
    const response = await api.post(`/schedule/${id}/confirm`);
    return transformEvent(response.data);
  },

  /**
   * Начать событие.
   */
  async startEvent(id: number): Promise<ScheduleEvent> {
    const response = await api.post(`/schedule/${id}/start`);
    return transformEvent(response.data);
  },

  /**
   * Завершить событие.
   */
  async completeEvent(id: number): Promise<ScheduleEvent> {
    const response = await api.post(`/schedule/${id}/complete`);
    return transformEvent(response.data);
  },

  /**
   * Отменить событие.
   */
  async cancelEvent(id: number): Promise<ScheduleEvent> {
    const response = await api.post(`/schedule/${id}/cancel`);
    return transformEvent(response.data);
  },

  // ===========================================================================
  // Participants
  // ===========================================================================

  /**
   * Получить участников события.
   */
  async getParticipants(eventId: number): Promise<EventParticipant[]> {
    const response = await api.get(`/schedule/${eventId}/participants`);
    return response.data.map(transformParticipant);
  },

  /**
   * Добавить участника.
   */
  async addParticipant(
    eventId: number,
    data: { userId: number; role?: string; note?: string }
  ): Promise<EventParticipant> {
    const response = await api.post(`/schedule/${eventId}/participants`, toSnakeCase(data));
    return transformParticipant(response.data);
  },

  /**
   * Удалить участника.
   */
  async removeParticipant(participantId: number): Promise<void> {
    await api.delete(`/schedule/participants/${participantId}`);
  },

  /**
   * Ответить на приглашение.
   */
  async respondToEvent(
    eventId: number,
    status: 'confirmed' | 'declined' | 'tentative'
  ): Promise<EventParticipant> {
    const response = await api.post(`/schedule/${eventId}/respond?status=${status}`);
    return transformParticipant(response.data);
  },

  // ===========================================================================
  // Calendar
  // ===========================================================================

  /**
   * Получить календарь на месяц.
   */
  async getCalendar(year: number, month: number): Promise<CalendarDay[]> {
    const response = await api.get(`/schedule/calendar/${year}/${month}`);
    
    return response.data.map((day: Record<string, unknown>) => ({
      date: day.date as string,
      events: (day.events as Record<string, unknown>[]).map((e) => ({
        id: e.id as number,
        title: e.title as string,
        eventType: e.event_type as string,
        status: e.status as string,
        date: e.date as string,
        start: e.start as string,
        end: e.end as string | null,
        color: e.color as string | null,
        performanceId: e.performance_id as number | null,
      })),
    }));
  },

  // ===========================================================================
  // Stats
  // ===========================================================================

  /**
   * Получить статистику расписания.
   */
  async getStats(): Promise<ScheduleStats> {
    const response = await api.get('/schedule/stats/');
    return transformStats(response.data);
  },
};

export default scheduleService;
