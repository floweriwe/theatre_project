/**
 * Типы модуля документооборота.
 */

// Tag and TagCreateRequest types are defined in inventory_types.ts
import type { Tag } from './inventory_types';

/** Статус документа */
export type DocumentStatus = 'draft' | 'active' | 'archived';

/** Тип файла */
export type FileType = 'pdf' | 'document' | 'spreadsheet' | 'image' | 'other';

/** Категория документов */
export interface DocumentCategory {
  id: number;
  name: string;
  code: string;
  description: string | null;
  parentId: number | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  requiredPermissions: string[] | null;
  isActive: boolean;
  theaterId: number | null;
  createdAt: string;
  updatedAt: string;
  children?: DocumentCategory[];
}

/** Версия документа */
export interface DocumentVersion {
  id: number;
  documentId: number;
  version: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  comment: string | null;
  createdAt: string;
  createdById: number | null;
}

/** Документ (полный) */
export interface Document {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  isPublic: boolean;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: FileType;
  currentVersion: number;
  status: DocumentStatus;
  performanceId: number | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  theaterId: number | null;
  createdAt: string;
  updatedAt: string;
  category: DocumentCategory | null;
  tags: Tag[];
}

/** Документ (для списка) */
export interface DocumentListItem {
  id: number;
  name: string;
  fileName: string;
  fileSize: number;
  fileType: FileType;
  status: DocumentStatus;
  categoryId: number | null;
  categoryName: string | null;
  currentVersion: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Статистика документов */
export interface DocumentStats {
  totalDocuments: number;
  active: number;
  draft: number;
  archived: number;
  totalSize: number;
  categoriesCount: number;
  tagsCount: number;
  pdfCount: number;
  documentCount: number;
  spreadsheetCount: number;
  imageCount: number;
  otherCount: number;
}

// =============================================================================
// Request Types
// =============================================================================

/** Создание категории */
export interface DocCategoryCreateRequest {
  name: string;
  code: string;
  description?: string;
  parentId?: number;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

// TagCreateRequest is defined in inventory_types.ts (with icon and description fields)

/** Фильтры для документов */
export interface DocumentFilters {
  search?: string;
  categoryId?: number;
  status?: DocumentStatus;
  fileType?: FileType;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

// =============================================================================
// Response Types
// =============================================================================

/** Пагинированный ответ с документами */
export interface PaginatedDocuments {
  items: DocumentListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// =============================================================================
// UI Helpers
// =============================================================================

/** Метки статусов */
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Черновик',
  active: 'Активный',
  archived: 'В архиве',
};

/** Цвета статусов */
export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'warning',
  active: 'success',
  archived: 'default',
};

/** Метки типов файлов */
export const FILE_TYPE_LABELS: Record<FileType, string> = {
  pdf: 'PDF',
  document: 'Документ',
  spreadsheet: 'Таблица',
  image: 'Изображение',
  other: 'Другое',
};

/** Иконки типов файлов */
export const FILE_TYPE_ICONS: Record<FileType, string> = {
  pdf: 'file-text',
  document: 'file',
  spreadsheet: 'table',
  image: 'image',
  other: 'file-question',
};

/**
 * Форматирование размера файла.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
