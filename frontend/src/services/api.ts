/**
 * API Client — базовый клиент для работы с backend API.
 * 
 * Использует axios с интерсепторами для авторизации и обработки ошибок.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// =============================================================================
// API Instance
// =============================================================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// Token Helper
// =============================================================================

/**
 * Получить access token из Zustand persist storage.
 * Zustand хранит состояние как JSON объект.
 */
function getAccessToken(): string | null {
  try {
    // Zustand persist хранит данные как JSON в ключе 'theatre'
    const stored = localStorage.getItem('theatre');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.accessToken || null;
    }
  } catch {
    // Fallback для старого формата
    return localStorage.getItem('auth_token');
  }
  return null;
}

// =============================================================================
// Request Interceptor
// =============================================================================

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================================================
// Response Interceptor
// =============================================================================

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 401 - unauthorized
    if (error.response?.status === 401) {
      // Очищаем Zustand persist storage
      localStorage.removeItem('theatre');
      // Fallback для старого формата
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      // Редирект только если не на странице логина
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// =============================================================================
// Types
// =============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Извлечь сообщение об ошибке из ответа API.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.data?.details) {
      const details = axiosError.response.data.details;
      const firstKey = Object.keys(details)[0];
      if (firstKey && details[firstKey]?.[0]) {
        return details[firstKey][0];
      }
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Произошла неизвестная ошибка';
}

// =============================================================================
// Export
// =============================================================================

export default api;
export { api };
