/**
 * Вкладка документов спектакля.
 *
 * Отображает:
 * - Готовность паспорта (PassportReadinessCard)
 * - Дерево документов (DocumentTree)
 * - Загрузчик документов (DocumentUploader)
 */
import { FolderIcon } from '@heroicons/react/24/outline';
import { DocumentUploader } from './DocumentUploader';
import { DocumentTree } from './DocumentTree';
import { PassportReadinessCard } from './PassportReadinessCard';
import {
  useDocumentsTree,
  usePassportReadiness,
  performanceDocumentKeys,
} from '@/hooks/usePerformanceDocuments';
import { useQueryClient } from '@tanstack/react-query';
import type { PerformanceDocumentListItem } from '@/types/performance_document';

interface PerformanceDocumentsTabProps {
  performanceId: number;
  canEdit?: boolean;
}

export function PerformanceDocumentsTab({
  performanceId,
  canEdit = false,
}: PerformanceDocumentsTabProps) {
  const queryClient = useQueryClient();

  // Дерево документов
  const {
    data: documentsTree,
    isLoading: isTreeLoading,
    isError: isTreeError,
    error: treeError,
  } = useDocumentsTree(performanceId);

  // Готовность паспорта
  const {
    data: passportReadiness,
    isLoading: isReadinessLoading,
  } = usePassportReadiness(performanceId);

  const handleUploadComplete = () => {
    // Обновляем оба запроса
    queryClient.invalidateQueries({
      queryKey: performanceDocumentKeys.tree(performanceId),
    });
    queryClient.invalidateQueries({
      queryKey: performanceDocumentKeys.passportReadiness(performanceId),
    });
  };

  const handleDocumentClick = (document: PerformanceDocumentListItem) => {
    if (document.download_url) {
      window.open(document.download_url, '_blank');
    }
  };

  const handleSectionClick = (section: string) => {
    // Можно добавить скролл к разделу или фильтрацию
    console.log('Section clicked:', section);
  };

  // Error state
  if (isTreeError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">
          Ошибка загрузки документов: {(treeError as Error)?.message || 'Неизвестная ошибка'}
        </p>
        <button
          onClick={() => queryClient.invalidateQueries({
            queryKey: performanceDocumentKeys.tree(performanceId),
          })}
          className="px-4 py-2 bg-[#D4A574] text-[#0F1419] rounded-lg hover:bg-[#E8C297]"
        >
          Повторить
        </button>
      </div>
    );
  }

  const hasDocuments = documentsTree && documentsTree.total_documents > 0;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-['Cormorant_Garamond'] font-semibold text-[#F1F5F9]">
          Документы спектакля
          {documentsTree && (
            <span className="ml-2 text-[#94A3B8] font-normal">
              ({documentsTree.total_documents})
            </span>
          )}
        </h3>
      </div>

      {/* Uploader (если есть права на редактирование) */}
      {canEdit && (
        <DocumentUploader
          performanceId={performanceId}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Основной контент: готовность + дерево */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Готовность паспорта (левая колонка) */}
        <div className="lg:col-span-1">
          <PassportReadinessCard
            performanceId={performanceId}
            readiness={passportReadiness || null}
            isLoading={isReadinessLoading}
            onSectionClick={handleSectionClick}
          />
        </div>

        {/* Дерево документов (правая колонка) */}
        <div className="lg:col-span-2">
          {hasDocuments || isTreeLoading ? (
            <DocumentTree
              performanceId={performanceId}
              tree={documentsTree || null}
              isLoading={isTreeLoading}
              onDocumentClick={handleDocumentClick}
            />
          ) : (
            <div className="bg-[#1A2332] rounded-lg p-6">
              <div className="text-center py-12">
                <FolderIcon className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
                <p className="text-[#94A3B8]">Документы ещё не загружены</p>
                {canEdit && (
                  <p className="text-sm text-[#64748B] mt-1">
                    Перетащите файлы в область выше или нажмите для выбора
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerformanceDocumentsTab;
