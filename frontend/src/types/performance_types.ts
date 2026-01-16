/**
 * Типы модуля спектаклей.
 */

/** Статус спектакля */
export type PerformanceStatus = 'preparation' | 'in_repertoire' | 'paused' | 'archived';

/** Тип раздела паспорта */
export type SectionType = 
  | 'lighting' 
  | 'sound' 
  | 'scenery' 
  | 'props' 
  | 'costumes' 
  | 'makeup' 
  | 'video' 
  | 'effects' 
  | 'other';

/** Раздел паспорта */
export interface PerformanceSection {
  id: number;
  performanceId: number;
  sectionType: SectionType;
  title: string;
  content: string | null;
  responsibleId: number | null;
  data: Record<string, unknown> | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Спектакль (полный) */
export interface Performance {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string | null;
  director: string | null;
  composer: string | null;
  choreographer: string | null;
  genre: string | null;
  ageRating: string | null;
  durationMinutes: number | null;
  intermissions: number;
  premiereDate: string | null;
  status: PerformanceStatus;
  posterPath: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  theaterId: number | null;
  createdAt: string;
  updatedAt: string;
  sections: PerformanceSection[];
}

/** Спектакль (для списка) */
export interface PerformanceListItem {
  id: number;
  title: string;
  subtitle: string | null;
  author: string | null;
  director: string | null;
  genre: string | null;
  ageRating: string | null;
  durationMinutes: number | null;
  status: PerformanceStatus;
  premiereDate: string | null;
  posterPath: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Статистика спектаклей */
export interface PerformanceStats {
  totalPerformances: number;
  preparation: number;
  inRepertoire: number;
  paused: number;
  archived: number;
  genres: Array<{ genre: string; count: number }>;
}

/** Предмет инвентаря, привязанный к спектаклю */
export interface PerformanceInventoryItem {
  itemId: number;
  itemName: string;
  itemInventoryNumber: string;
  itemStatus: string;
  note: string | null;
  quantityRequired: number;
  createdAt: string;
}

/** Ответ со списком инвентаря спектакля */
export interface PerformanceInventoryResponse {
  performanceId: number;
  items: PerformanceInventoryItem[];
}

/** Запрос на привязку инвентаря к спектаклю */
export interface AddPerformanceInventoryRequest {
  itemId: number;
  note?: string;
  quantityRequired?: number;
}

// =============================================================================
// Request Types
// =============================================================================

/** Создание спектакля */
export interface PerformanceCreateRequest {
  title: string;
  subtitle?: string;
  description?: string;
  author?: string;
  director?: string;
  composer?: string;
  choreographer?: string;
  genre?: string;
  ageRating?: string;
  durationMinutes?: number;
  intermissions?: number;
  premiereDate?: string;
}

/** Обновление спектакля */
export interface PerformanceUpdateRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  author?: string;
  director?: string;
  composer?: string;
  choreographer?: string;
  genre?: string;
  ageRating?: string;
  durationMinutes?: number;
  intermissions?: number;
  premiereDate?: string;
  status?: PerformanceStatus;
}

/** Создание раздела */
export interface SectionCreateRequest {
  sectionType: SectionType;
  title: string;
  content?: string;
  responsibleId?: number;
  sortOrder?: number;
}

/** Обновление раздела */
export interface SectionUpdateRequest {
  title?: string;
  content?: string;
  responsibleId?: number;
  sortOrder?: number;
}

/** Фильтры для спектаклей */
export interface PerformanceFilters {
  search?: string;
  status?: PerformanceStatus;
  genre?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// Response Types
// =============================================================================

/** Пагинированный ответ со спектаклями */
export interface PaginatedPerformances {
  items: PerformanceListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// =============================================================================
// UI Helpers
// =============================================================================

/** Метки статусов */
export const PERFORMANCE_STATUS_LABELS: Record<PerformanceStatus, string> = {
  preparation: 'Подготовка',
  in_repertoire: 'В репертуаре',
  paused: 'На паузе',
  archived: 'В архиве',
};

/** Цвета статусов */
export const PERFORMANCE_STATUS_COLORS: Record<PerformanceStatus, string> = {
  preparation: 'warning',
  in_repertoire: 'success',
  paused: 'default',
  archived: 'default',
};

/** Метки типов разделов */
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  lighting: 'Свет',
  sound: 'Звук',
  scenery: 'Декорации',
  props: 'Реквизит',
  costumes: 'Костюмы',
  makeup: 'Грим',
  video: 'Видео',
  effects: 'Спецэффекты',
  other: 'Прочее',
};

/** Иконки типов разделов */
export const SECTION_TYPE_ICONS: Record<SectionType, string> = {
  lighting: 'lightbulb',
  sound: 'volume-2',
  scenery: 'layout',
  props: 'box',
  costumes: 'shirt',
  makeup: 'palette',
  video: 'video',
  effects: 'sparkles',
  other: 'more-horizontal',
};

/**
 * Форматирование длительности.
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} мин`;
  if (mins === 0) return `${hours} ч`;
  return `${hours} ч ${mins} мин`;
}
