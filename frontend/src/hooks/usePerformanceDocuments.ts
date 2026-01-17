/**
 * React Query hooks для документов спектакля.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performanceDocumentService } from '@/services/performance_document_service';
import type { PerformanceDocumentUpdate } from '@/types/performance_document';

// Query keys
export const performanceDocumentKeys = {
  all: ['performance-documents'] as const,
  tree: (performanceId: number) =>
    [...performanceDocumentKeys.all, 'tree', performanceId] as const,
  detail: (performanceId: number, documentId: number) =>
    [...performanceDocumentKeys.all, 'detail', performanceId, documentId] as const,
  passportReadiness: (performanceId: number) =>
    [...performanceDocumentKeys.all, 'passport-readiness', performanceId] as const,
  sectionReadiness: (performanceId: number, section: string) =>
    [...performanceDocumentKeys.all, 'section-readiness', performanceId, section] as const,
};

/**
 * Получить дерево документов спектакля.
 */
export function usePerformanceDocuments(performanceId: number) {
  return useQuery({
    queryKey: performanceDocumentKeys.tree(performanceId),
    queryFn: () => performanceDocumentService.getDocuments(performanceId),
    enabled: !!performanceId,
  });
}

/**
 * Получить документ по ID.
 */
export function usePerformanceDocument(
  performanceId: number,
  documentId: number
) {
  return useQuery({
    queryKey: performanceDocumentKeys.detail(performanceId, documentId),
    queryFn: () =>
      performanceDocumentService.getDocument(performanceId, documentId),
    enabled: !!performanceId && !!documentId,
  });
}

/**
 * Загрузить документы.
 */
export function useUploadPerformanceDocuments(performanceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) =>
      performanceDocumentService.uploadDocuments(performanceId, files),
    onSuccess: () => {
      // Инвалидируем кэш документов
      queryClient.invalidateQueries({
        queryKey: performanceDocumentKeys.tree(performanceId),
      });
    },
  });
}

/**
 * Обновить документ.
 */
export function useUpdatePerformanceDocument(performanceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      data,
    }: {
      documentId: number;
      data: PerformanceDocumentUpdate;
    }) =>
      performanceDocumentService.updateDocument(performanceId, documentId, data),
    onSuccess: (_, { documentId }) => {
      // Инвалидируем кэш
      queryClient.invalidateQueries({
        queryKey: performanceDocumentKeys.tree(performanceId),
      });
      queryClient.invalidateQueries({
        queryKey: performanceDocumentKeys.detail(performanceId, documentId),
      });
    },
  });
}

/**
 * Удалить документ.
 */
export function useDeletePerformanceDocument(performanceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) =>
      performanceDocumentService.deleteDocument(performanceId, documentId),
    onSuccess: () => {
      // Инвалидируем кэш
      queryClient.invalidateQueries({
        queryKey: performanceDocumentKeys.tree(performanceId),
      });
    },
  });
}

/**
 * Получить дерево документов с категориями.
 */
export function useDocumentsTree(performanceId: number) {
  return useQuery({
    queryKey: performanceDocumentKeys.tree(performanceId),
    queryFn: () => performanceDocumentService.getDocumentsTree(performanceId),
    enabled: !!performanceId,
  });
}

/**
 * Получить готовность паспорта.
 */
export function usePassportReadiness(performanceId: number) {
  return useQuery({
    queryKey: performanceDocumentKeys.passportReadiness(performanceId),
    queryFn: () => performanceDocumentService.getPassportReadiness(performanceId),
    enabled: !!performanceId,
  });
}

/**
 * Получить детальную готовность раздела.
 */
export function useSectionReadiness(performanceId: number, section: string) {
  return useQuery({
    queryKey: performanceDocumentKeys.sectionReadiness(performanceId, section),
    queryFn: () => performanceDocumentService.getSectionReadiness(performanceId, section),
    enabled: !!performanceId && !!section,
  });
}
