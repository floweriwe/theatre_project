/**
 * Сервис для работы с документами спектакля.
 */
import api from './api';
import type {
  PerformanceDocument,
  PerformanceDocumentsTree,
  PerformanceDocumentUpdate,
} from '@/types/performance_document';

const BASE_URL = '/performances';

export const performanceDocumentService = {
  /**
   * Получить документы спектакля (дерево по разделам).
   */
  async getDocuments(performanceId: number): Promise<PerformanceDocumentsTree> {
    const response = await api.get<PerformanceDocumentsTree>(
      `${BASE_URL}/${performanceId}/documents`
    );
    return response.data;
  },

  /**
   * Получить документ по ID.
   */
  async getDocument(
    performanceId: number,
    documentId: number
  ): Promise<PerformanceDocument> {
    const response = await api.get<PerformanceDocument>(
      `${BASE_URL}/${performanceId}/documents/${documentId}`
    );
    return response.data;
  },

  /**
   * Загрузить документы.
   */
  async uploadDocuments(
    performanceId: number,
    files: File[]
  ): Promise<PerformanceDocument[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post<PerformanceDocument[]>(
      `${BASE_URL}/${performanceId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Обновить метаданные документа.
   */
  async updateDocument(
    performanceId: number,
    documentId: number,
    data: PerformanceDocumentUpdate
  ): Promise<PerformanceDocument> {
    const response = await api.patch<PerformanceDocument>(
      `${BASE_URL}/${performanceId}/documents/${documentId}`,
      data
    );
    return response.data;
  },

  /**
   * Удалить документ.
   */
  async deleteDocument(
    performanceId: number,
    documentId: number
  ): Promise<void> {
    await api.delete(
      `${BASE_URL}/${performanceId}/documents/${documentId}`
    );
  },

  /**
   * Скачать документ (открывает presigned URL).
   */
  downloadDocument(downloadUrl: string): void {
    window.open(downloadUrl, '_blank');
  },
};

export default performanceDocumentService;
