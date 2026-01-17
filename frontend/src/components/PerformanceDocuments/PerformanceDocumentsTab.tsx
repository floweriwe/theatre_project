/**
 * Вкладка документов спектакля.
 *
 * Отображает документы сгруппированные по разделам паспорта
 * с возможностью загрузки и удаления.
 */
import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, FolderIcon } from '@heroicons/react/24/outline';
import { DocumentUploader } from './DocumentUploader';
import { DocumentCard } from './DocumentCard';
import {
  usePerformanceDocuments,
  useDeletePerformanceDocument,
} from '@/hooks/usePerformanceDocuments';
import type { PerformanceDocumentListItem, DocumentTreeSection } from '@/types/performance_document';
import { SECTION_COLORS } from '@/types/performance_document';

interface PerformanceDocumentsTabProps {
  performanceId: number;
  canEdit?: boolean;
}

// Аккордеон раздела
function SectionAccordion({
  section,
  canEdit,
  onDelete,
  onPreview,
}: {
  section: DocumentTreeSection;
  canEdit: boolean;
  onDelete: (documentId: number) => void;
  onPreview: (document: PerformanceDocumentListItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const sectionColor = SECTION_COLORS[section.section] || '#64748B';

  return (
    <div className="border border-[#D4A574]/20 rounded-lg overflow-hidden">
      {/* Заголовок раздела */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#1A2332] hover:bg-[#243044] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-8 rounded-full"
            style={{ backgroundColor: sectionColor }}
          />
          <FolderIcon className="w-5 h-5 text-[#94A3B8]" />
          <span className="font-medium text-[#F1F5F9]">{section.section_name}</span>
          <span className="text-sm text-[#64748B]">
            ({section.total_count} {section.total_count === 1 ? 'документ' : 'документов'})
          </span>
        </div>
        {isOpen ? (
          <ChevronDownIcon className="w-5 h-5 text-[#94A3B8]" />
        ) : (
          <ChevronRightIcon className="w-5 h-5 text-[#94A3B8]" />
        )}
      </button>

      {/* Содержимое раздела */}
      {isOpen && (
        <div className="p-4 bg-[#0F1419] space-y-4">
          {section.categories.map((category) => (
            <div key={category.category}>
              {/* Название категории */}
              <h4 className="text-sm font-medium text-[#94A3B8] mb-2">
                {category.category_name}
                <span className="ml-2 text-[#64748B]">({category.count})</span>
              </h4>

              {/* Документы категории */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {category.documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    canDelete={canEdit}
                    onDelete={onDelete}
                    onPreview={onPreview}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PerformanceDocumentsTab({
  performanceId,
  canEdit = false,
}: PerformanceDocumentsTabProps) {
  const {
    data: documentsTree,
    isLoading,
    isError,
    error,
    refetch,
  } = usePerformanceDocuments(performanceId);

  const deleteMutation = useDeletePerformanceDocument(performanceId);

  const handleDelete = async (documentId: number) => {
    await deleteMutation.mutateAsync(documentId);
  };

  const handlePreview = (document: PerformanceDocumentListItem) => {
    // Для изображений, PDF, аудио, видео — открываем превью
    if (document.download_url) {
      window.open(document.download_url, '_blank');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Skeleton для uploader */}
        {canEdit && (
          <div className="h-32 bg-[#1A2332] rounded-lg animate-pulse" />
        )}
        {/* Skeleton для секций */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-[#1A2332] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">
          Ошибка загрузки документов: {(error as Error)?.message || 'Неизвестная ошибка'}
        </p>
        <button
          onClick={() => refetch()}
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
      {/* Заголовок с количеством */}
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
          onUploadComplete={() => refetch()}
        />
      )}

      {/* Дерево документов */}
      {hasDocuments ? (
        <div className="space-y-3">
          {documentsTree?.sections.map((section) => (
            <SectionAccordion
              key={section.section}
              section={section}
              canEdit={canEdit}
              onDelete={handleDelete}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#1A2332] rounded-lg">
          <FolderIcon className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
          <p className="text-[#94A3B8]">Документы ещё не загружены</p>
          {canEdit && (
            <p className="text-sm text-[#64748B] mt-1">
              Перетащите файлы в область выше или нажмите для выбора
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PerformanceDocumentsTab;
