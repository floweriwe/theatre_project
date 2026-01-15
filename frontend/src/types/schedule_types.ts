/**
 * Типы модуля расписания.
 */

/** Тип события */
export type EventType = 
  | 'performance' 
  | 'rehearsal' 
  | 'tech_rehearsal' 
  | 'dress_rehearsal' 
  | 'meeting' 
  | 'maintenance' 
  | 'other';

/** Статус события */
export type EventStatus = 
  | 'planned' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

/** Роль участника */
export type ParticipantRole = 
  | 'performer' 
  | 'technician' 
  | 'manager' 
  | 'guest' 
  | 'other';

/** Статус участия */
export type ParticipantStatus = 
  | 'invited' 
  | 'confirmed' 
  | 'declined' 
  | 'tentative';

/** Участник события */
export interface EventParticipant {
  id: number;
  eventId: number;
  userId: number;
  role: ParticipantRole;
  status: ParticipantStatus;
  note: string | null;
  userName: string | null;
}

/** Событие (полное) */
export interface ScheduleEvent {
  id: number;
  title: string;
  description: string | null;
  eventType: EventType;
  status: EventStatus;
  eventDate: string;
  startTime: string;
  endTime: string | null;
  venue: string | null;
  performanceId: number | null;
  color: string | null;
  metadata: Record<string, unknown> | null;
  isPublic: boolean;
  isActive: boolean;
  theaterId: number | null;
  createdAt: string;
  updatedAt: string;
  performanceTitle: string | null;
  participants: EventParticipant[];
}

/** Событие (для списка) */
export interface ScheduleEventListItem {
  id: number;
  title: string;
  eventType: EventType;
  status: EventStatus;
  eventDate: string;
  startTime: string;
  endTime: string | null;
  venue: string | null;
  color: string | null;
  isPublic: boolean;
  performanceId: number | null;
  performanceTitle: string | null;
  participantsCount: number;
}

/** Событие для календаря */
export interface CalendarEvent {
  id: number;
  title: string;
  eventType: EventType;
  status: EventStatus;
  date: string;
  start: string;
  end: string | null;
  color: string | null;
  performanceId: number | null;
}

/** День календаря */
export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
}

/** Статистика расписания */
export interface ScheduleStats {
  totalEvents: number;
  planned: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  performancesCount: number;
  rehearsalsCount: number;
  otherCount: number;
  upcomingEvents: number;
}

// =============================================================================
// Request Types
// =============================================================================

/** Создание участника */
export interface ParticipantCreateRequest {
  userId: number;
  role?: ParticipantRole;
  status?: ParticipantStatus;
  note?: string;
}

/** Создание события */
export interface EventCreateRequest {
  title: string;
  description?: string;
  eventType?: EventType;
  eventDate: string;
  startTime: string;
  endTime?: string;
  venue?: string;
  performanceId?: number;
  color?: string;
  isPublic?: boolean;
  participants?: ParticipantCreateRequest[];
}

/** Обновление события */
export interface EventUpdateRequest {
  title?: string;
  description?: string;
  eventType?: EventType;
  status?: EventStatus;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  performanceId?: number;
  color?: string;
  isPublic?: boolean;
}

/** Фильтры для событий */
export interface EventFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  eventType?: EventType;
  status?: EventStatus;
  performanceId?: number;
  page?: number;
  limit?: number;
}

// =============================================================================
// Response Types
// =============================================================================

/** Пагинированный ответ с событиями */
export interface PaginatedEvents {
  items: ScheduleEventListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// =============================================================================
// UI Helpers
// =============================================================================

/** Метки типов событий */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  performance: 'Спектакль',
  rehearsal: 'Репетиция',
  tech_rehearsal: 'Техническая репетиция',
  dress_rehearsal: 'Генеральная репетиция',
  meeting: 'Совещание',
  maintenance: 'Техобслуживание',
  other: 'Прочее',
};

/** Цвета типов событий (по умолчанию) */
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  performance: '#8B5CF6',  // Фиолетовый
  rehearsal: '#3B82F6',    // Синий
  tech_rehearsal: '#F59E0B', // Оранжевый
  dress_rehearsal: '#EC4899', // Розовый
  meeting: '#6B7280',      // Серый
  maintenance: '#10B981',  // Зелёный
  other: '#9CA3AF',        // Светло-серый
};

/** Метки статусов событий */
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  planned: 'Запланировано',
  confirmed: 'Подтверждено',
  in_progress: 'В процессе',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

/** Цвета статусов */
export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  planned: 'warning',
  confirmed: 'success',
  in_progress: 'primary',
  completed: 'default',
  cancelled: 'error',
};

/** Метки ролей участников */
export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, string> = {
  performer: 'Исполнитель',
  technician: 'Техник',
  manager: 'Организатор',
  guest: 'Гость',
  other: 'Прочее',
};

/** Метки статусов участия */
export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  invited: 'Приглашён',
  confirmed: 'Подтвердил',
  declined: 'Отказался',
  tentative: 'Под вопросом',
};

/**
 * Форматирование времени.
 */
export function formatTime(time: string): string {
  if (!time) return '';
  // Если время в формате HH:MM:SS, берём только HH:MM
  return time.substring(0, 5);
}

/**
 * Получить цвет события (использует цвет из данных или по умолчанию по типу).
 */
export function getEventColor(event: { eventType: EventType; color?: string | null }): string {
  return event.color || EVENT_TYPE_COLORS[event.eventType] || '#9CA3AF';
}
