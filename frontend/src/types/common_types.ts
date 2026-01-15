/**
 * Общие типы приложения.
 */

/** Ответ API с пагинацией */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Параметры пагинации */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Ответ API с сообщением */
export interface MessageResponse {
  message: string;
  success: boolean;
}

/** Ошибка API */
export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
}

/** Статус загрузки */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** Базовая сущность с аудитом */
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdById: number | null;
  updatedById: number | null;
}
