/**
 * API Ã‘ÂÃÂµÃ‘â‚¬ÃÂ²ÃÂ¸Ã‘Â ÃÂ¼ÃÂ¾ÃÂ´Ã‘Æ’ÃÂ»Ã‘Â ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€šÃÂ¾ÃÂ¾ÃÂ±ÃÂ¾Ã‘â‚¬ÃÂ¾Ã‘â€šÃÂ°.
 */

import api from './api';
import type {
  Document,
  DocumentListItem,
  DocumentCategory,
  DocumentVersion,
  Tag,
  DocumentStats,
  PaginatedDocuments,
  DocumentFilters,
  DocCategoryCreateRequest,
  TagCreateRequest,
} from '@/types';

// =============================================================================
// Transformers
// =============================================================================

function transformDocument(data: Record<string, unknown>): Document {
  return {
    id: data.id as number,
    name: data.name as string,
    description: data.description as string | null,
    categoryId: data.category_id as number | null,
    isPublic: data.is_public as boolean,
    filePath: data.file_path as string,
    fileName: data.file_name as string,
    fileSize: data.file_size as number,
    mimeType: data.mime_type as string,
    fileType: data.file_type as Document['fileType'],
    currentVersion: data.current_version as number,
    status: data.status as Document['status'],
    performanceId: data.performance_id as number | null,
    metadata: data.metadata as Record<string, unknown> | null,
    isActive: data.is_active as boolean,
    theaterId: data.theater_id as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    category: data.category ? transformCategory(data.category as Record<string, unknown>) : null,
    tags: data.tags ? (data.tags as Record<string, unknown>[]).map(transformTag) : [],
  };
}

function transformDocumentList(data: Record<string, unknown>): DocumentListItem {
  return {
    id: data.id as number,
    name: data.name as string,
    fileName: data.file_name as string,
    fileSize: data.file_size as number,
    fileType: data.file_type as DocumentListItem['fileType'],
    status: data.status as DocumentListItem['status'],
    categoryId: data.category_id as number | null,
    categoryName: data.category_name as string | null,
    currentVersion: data.current_version as number,
    isPublic: data.is_public as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function transformCategory(data: Record<string, unknown>): DocumentCategory {
  return {
    id: data.id as number,
    name: data.name as string,
    code: data.code as string,
    description: data.description as string | null,
    parentId: data.parent_id as number | null,
    color: data.color as string | null,
    icon: data.icon as string | null,
    sortOrder: data.sort_order as number,
    requiredPermissions: data.required_permissions as string[] | null,
    isActive: data.is_active as boolean,
    theaterId: data.theater_id as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    children: data.children 
      ? (data.children as Record<string, unknown>[]).map(transformCategory) 
      : undefined,
  };
}

function transformTag(data: Record<string, unknown>): Tag {
  return {
    id: data.id as number,
    name: data.name as string,
    color: data.color as string | null,
    icon: data.icon as string | null,
    description: data.description as string | null,
    theaterId: data.theater_id as number | null,
  };
}

function transformVersion(data: Record<string, unknown>): DocumentVersion {
  return {
    id: data.id as number,
    documentId: data.document_id as number,
    version: data.version as number,
    filePath: data.file_path as string,
    fileName: data.file_name as string,
    fileSize: data.file_size as number,
    comment: data.comment as string | null,
    createdAt: data.created_at as string,
    createdById: data.created_by_id as number | null,
  };
}

function transformStats(data: Record<string, unknown>): DocumentStats {
  return {
    totalDocuments: data.total_documents as number,
    active: data.active as number,
    draft: data.draft as number,
    archived: data.archived as number,
    totalSize: data.total_size as number,
    categoriesCount: data.categories_count as number,
    tagsCount: data.tags_count as number,
    pdfCount: data.pdf_count as number,
    documentCount: data.document_count as number,
    spreadsheetCount: data.spreadsheet_count as number,
    imageCount: data.image_count as number,
    otherCount: data.other_count as number,
  };
}

// =============================================================================
// API Service
// =============================================================================

export const documentService = {
  // ===========================================================================
  // Documents
  // ===========================================================================
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘ÂÃÂ¿ÃÂ¸Ã‘ÂÃÂ¾ÃÂº ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€šÃÂ¾ÃÂ².
   */
  async getDocuments(filters: DocumentFilters = {}): Promise<PaginatedDocuments> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('category_id', String(filters.categoryId));
    if (filters.status) params.append('status', filters.status);
    if (filters.fileType) params.append('file_type', filters.fileType);
    if (filters.isPublic !== undefined) params.append('is_public', String(filters.isPublic));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    
    const response = await api.get(`/documents?${params.toString()}`);
    const data = response.data;
    
    return {
      items: data.items.map(transformDocumentList),
      total: data.total,
      page: data.page,
      limit: data.limit,
      pages: data.pages,
    };
  },
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€š ÃÂ¿ÃÂ¾ ID.
   */
  async getDocument(id: number): Promise<Document> {
    const response = await api.get(`/documents/${id}`);
    return transformDocument(response.data);
  },
  
  /**
   * Ãâ€”ÃÂ°ÃÂ³Ã‘â‚¬Ã‘Æ’ÃÂ·ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€š.
   */
  async uploadDocument(
    file: File,
    data: {
      name: string;
      description?: string;
      categoryId?: number;
      isPublic?: boolean;
    }
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.categoryId) formData.append('category_id', String(data.categoryId));
    if (data.isPublic !== undefined) formData.append('is_public', String(data.isPublic));
    
    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return transformDocument(response.data);
  },
  
  /**
   * ÃÅ¾ÃÂ±ÃÂ½ÃÂ¾ÃÂ²ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€š.
   */
  async updateDocument(
    id: number,
    data: {
      name?: string;
      description?: string;
      categoryId?: number;
      isPublic?: boolean;
    },
    file?: File
  ): Promise<Document> {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.categoryId !== undefined) formData.append('category_id', String(data.categoryId));
    if (data.isPublic !== undefined) formData.append('is_public', String(data.isPublic));
    if (file) formData.append('file', file);
    
    const response = await api.patch(`/documents/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return transformDocument(response.data);
  },
  
  /**
   * ÃÂ£ÃÂ´ÃÂ°ÃÂ»ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€š.
   */
  async deleteDocument(id: number): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
  
  /**
   * ÃÂÃ‘â‚¬Ã‘â€¦ÃÂ¸ÃÂ²ÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’ ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€š.
   */
  async archiveDocument(id: number): Promise<Document> {
    const response = await api.post(`/documents/${id}/archive`);
    return transformDocument(response.data);
  },
  
  /**
   * Ãâ€™ÃÂ¾Ã‘ÂÃ‘ÂÃ‘â€šÃÂ°ÃÂ½ÃÂ¾ÃÂ²ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ¸ÃÂ· ÃÂ°Ã‘â‚¬Ã‘â€¦ÃÂ¸ÃÂ²ÃÂ°.
   */
  async restoreDocument(id: number): Promise<Document> {
    const response = await api.post(`/documents/${id}/restore`);
    return transformDocument(response.data);
  },
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ²ÃÂµÃ‘â‚¬Ã‘ÂÃÂ¸ÃÂ¸ ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€šÃÂ°.
   */
  async getDocumentVersions(id: number): Promise<DocumentVersion[]> {
    const response = await api.get(`/documents/${id}/versions`);
    return response.data.map(transformVersion);
  },
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ URL ÃÂ´ÃÂ»Ã‘Â Ã‘ÂÃÂºÃÂ°Ã‘â€¡ÃÂ¸ÃÂ²ÃÂ°ÃÂ½ÃÂ¸Ã‘Â.
   */
  getDownloadUrl(id: number): string {
    return `${api.defaults.baseURL}/documents/${id}/download`;
  },
  
  // ===========================================================================
  // Categories
  // ===========================================================================
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘ÂÃÂ¿ÃÂ¸Ã‘ÂÃÂ¾ÃÂº ÃÂºÃÂ°Ã‘â€šÃÂµÃÂ³ÃÂ¾Ã‘â‚¬ÃÂ¸ÃÂ¹.
   */
  async getCategories(): Promise<DocumentCategory[]> {
    const response = await api.get('/documents/categories/');
    return response.data.map(transformCategory);
  },
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ´ÃÂµÃ‘â‚¬ÃÂµÃÂ²ÃÂ¾ ÃÂºÃÂ°Ã‘â€šÃÂµÃÂ³ÃÂ¾Ã‘â‚¬ÃÂ¸ÃÂ¹.
   */
  async getCategoriesTree(): Promise<DocumentCategory[]> {
    const response = await api.get('/documents/categories/tree');
    return response.data.map(transformCategory);
  },
  
  /**
   * ÃÂ¡ÃÂ¾ÃÂ·ÃÂ´ÃÂ°Ã‘â€šÃ‘Å’ ÃÂºÃÂ°Ã‘â€šÃÂµÃÂ³ÃÂ¾Ã‘â‚¬ÃÂ¸Ã‘Å½.
   */
  async createCategory(data: DocCategoryCreateRequest): Promise<DocumentCategory> {
    const snakeData = {
      name: data.name,
      code: data.code,
      description: data.description,
      parent_id: data.parentId,
      color: data.color,
      icon: data.icon,
      sort_order: data.sortOrder,
    };
    const response = await api.post('/documents/categories/', snakeData);
    return transformCategory(response.data);
  },
  
  /**
   * ÃÂ£ÃÂ´ÃÂ°ÃÂ»ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂºÃÂ°Ã‘â€šÃÂµÃÂ³ÃÂ¾Ã‘â‚¬ÃÂ¸Ã‘Å½.
   */
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/documents/categories/${id}`);
  },
  
  // ===========================================================================
  // Tags
  // ===========================================================================
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘ÂÃÂ¿ÃÂ¸Ã‘ÂÃÂ¾ÃÂº Ã‘â€šÃÂµÃÂ³ÃÂ¾ÃÂ².
   */
  async getTags(): Promise<Tag[]> {
    const response = await api.get('/documents/tags/');
    return response.data.map(transformTag);
  },
  
  /**
   * ÃÂ¡ÃÂ¾ÃÂ·ÃÂ´ÃÂ°Ã‘â€šÃ‘Å’ Ã‘â€šÃÂµÃÂ³.
   */
  async createTag(data: TagCreateRequest): Promise<Tag> {
    const response = await api.post('/documents/tags/', data);
    return transformTag(response.data);
  },
  
  /**
   * ÃÂ£ÃÂ´ÃÂ°ÃÂ»ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘â€šÃÂµÃÂ³.
   */
  async deleteTag(id: number): Promise<void> {
    await api.delete(`/documents/tags/${id}`);
  },
  
  // ===========================================================================
  // Stats
  // ===========================================================================
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘ÂÃ‘â€šÃÂ°Ã‘â€šÃÂ¸Ã‘ÂÃ‘â€šÃÂ¸ÃÂºÃ‘Æ’ ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€šÃÂ¾ÃÂ².
   */
  async getStats(): Promise<DocumentStats> {
    const response = await api.get('/documents/stats/');
    return transformStats(response.data);
  },
};

export default documentService;
