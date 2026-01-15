/**
 * Константы приложения Theatre Management System
 */

/** Маршруты приложения */
export const ROUTES = {
  // Главная
  DASHBOARD: '/',
  
  // Аутентификация
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  
  // Инвентарь
  INVENTORY: '/inventory',
  INVENTORY_NEW: '/inventory/new',
  INVENTORY_ITEM: (id: string | number) => `/inventory/${id}`,
  INVENTORY_EDIT: (id: string | number) => `/inventory/${id}/edit`,
  
  // Документы
  DOCUMENTS: '/documents',
  DOCUMENTS_UPLOAD: '/documents/upload',
  DOCUMENT_VIEW: (id: string | number) => `/documents/${id}`,
  DOCUMENT_EDIT: (id: string | number) => `/documents/${id}/edit`,
  
  // Спектакли
  PERFORMANCES: '/performances',
  PERFORMANCES_NEW: '/performances/new',
  PERFORMANCE_VIEW: (id: string | number) => `/performances/${id}`,
  PERFORMANCE_EDIT: (id: string | number) => `/performances/${id}/edit`,
  
  // Расписание
  SCHEDULE: '/schedule',
  
  // Профиль и настройки
  PROFILE: '/profile',
  SETTINGS: '/settings',
  
  // Отчёты
  REPORTS: '/reports',
  
  // Администрирование
  ADMIN_USERS: '/admin/users',
  ADMIN_USER: (id: string | number) => `/admin/users/${id}`,
  ADMIN_USER_EDIT: (id: string | number) => `/admin/users/${id}/edit`,
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_AUDIT: '/admin/audit',
  
  // Справка
  HELP: '/help',
} as const;

/** Ключи для localStorage */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  ACCESS_TOKEN: 'theatre_access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  LANGUAGE: 'language',
} as const;

/** Параметры пагинации */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/** Категории инвентаря */
export const INVENTORY_CATEGORIES = [
  { value: 'props', label: 'Реквизит' },
  { value: 'costumes', label: 'Костюмы' },
  { value: 'scenery', label: 'Декорации' },
  { value: 'equipment', label: 'Оборудование' },
  { value: 'furniture', label: 'Мебель' },
  { value: 'lighting', label: 'Свет' },
  { value: 'sound', label: 'Звук' },
  { value: 'other', label: 'Прочее' },
] as const;

/** Статусы инвентаря */
export const INVENTORY_STATUSES = [
  { value: 'in_stock', label: 'На складе', color: 'success' },
  { value: 'reserved', label: 'Зарезервировано', color: 'warning' },
  { value: 'in_use', label: 'Используется', color: 'info' },
  { value: 'repair', label: 'На ремонте', color: 'error' },
  { value: 'written_off', label: 'Списано', color: 'default' },
] as const;

/** Статусы спектакля */
export const PERFORMANCE_STATUSES = [
  { value: 'preparation', label: 'Подготовка', color: 'warning' },
  { value: 'in_repertoire', label: 'В репертуаре', color: 'success' },
  { value: 'paused', label: 'На паузе', color: 'default' },
  { value: 'archived', label: 'В архиве', color: 'info' },
] as const;

/** Роли пользователей */
export const USER_ROLES = [
  { value: 'admin', label: 'Администратор', color: 'red' },
  { value: 'director', label: 'Руководитель', color: 'purple' },
  { value: 'tech_director', label: 'Технический директор', color: 'blue' },
  { value: 'department_head', label: 'Зав. цехом', color: 'green' },
  { value: 'accountant', label: 'Бухгалтер', color: 'amber' },
  { value: 'performer', label: 'Исполнитель', color: 'cyan' },
] as const;

/** Типы событий в расписании */
export const EVENT_TYPES = [
  { value: 'performance', label: 'Спектакль', color: 'gold' },
  { value: 'rehearsal', label: 'Репетиция', color: 'blue' },
  { value: 'technical', label: 'Технические работы', color: 'slate' },
  { value: 'meeting', label: 'Совещание', color: 'purple' },
  { value: 'other', label: 'Другое', color: 'gray' },
] as const;

/** Поддерживаемые форматы документов для просмотра */
export const VIEWABLE_DOCUMENT_FORMATS = [
  'pdf',
  'docx',
  'doc',
  'odt',
  'txt',
  'xlsx',
  'xls',
  'csv',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
] as const;

/** Максимальные размеры файлов (в байтах) */
export const FILE_SIZE_LIMITS = {
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  AVATAR: 5 * 1024 * 1024, // 5MB
} as const;

/** API endpoints */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  
  // Users
  USERS: '/users',
  USER: (id: string | number) => `/users/${id}`,
  
  // Inventory
  INVENTORY: '/inventory',
  INVENTORY_ITEM: (id: string | number) => `/inventory/${id}`,
  INVENTORY_RESERVE: (id: string | number) => `/inventory/${id}/reserve`,
  INVENTORY_WRITE_OFF: (id: string | number) => `/inventory/${id}/write-off`,
  
  // Documents
  DOCUMENTS: '/documents',
  DOCUMENT: (id: string | number) => `/documents/${id}`,
  DOCUMENT_UPLOAD: '/documents/upload',
  DOCUMENT_DOWNLOAD: (id: string | number) => `/documents/${id}/download`,
  
  // Performances
  PERFORMANCES: '/performances',
  PERFORMANCE: (id: string | number) => `/performances/${id}`,
  
  // Schedule
  SCHEDULE: '/schedule',
  SCHEDULE_EVENT: (id: string | number) => `/schedule/${id}`,
  
  // Categories
  CATEGORIES: '/categories',
  
  // Audit
  AUDIT_LOG: '/audit',
} as const;
