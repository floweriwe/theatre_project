/**
 * Иерархическое дерево документов спектакля.
 *
 * Отображает документы с группировкой по разделам и категориям:
 * - Раздел 1.0 Общая часть
 * - Раздел 2.0 Производство
 * - Раздел 3.0 Эксплуатация
 * - Раздел 4.0 Приложение
 *
 * Особенности:
 * - Сворачиваемые разделы с анимацией
 * - Счётчики документов для разделов и категорий
 * - Клик по документу открывает download_url
 * - Loading и empty states
 *
 * @example
 * <DocumentTree
 *   performanceId={1}
 *   tree={documentsTree}
 *   onDocumentClick={(doc) => window.open(doc.download_url)}
 * />
 */
import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentIcon,
  FolderIcon,
  FolderOpenIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import type {
  PerformanceDocumentsTree,
  PerformanceDocumentListItem,
  DocumentTreeSection,
  DocumentTreeCategory,
} from '@/types/performance_document';
import { formatFileSize, SECTION_COLORS } from '@/types/performance_document';

interface DocumentTreeProps {
  performanceId: number;
  tree: PerformanceDocumentsTree | null;
  isLoading?: boolean;
  onDocumentClick?: (document: PerformanceDocumentListItem) => void;
}

// Загрузочный skeleton для дерева
function TreeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          {/* Section header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-[#243044] rounded" />
            <div className="h-5 bg-[#243044] rounded w-48" />
            <div className="w-12 h-5 bg-[#243044] rounded ml-auto" />
          </div>
          {/* Categories */}
          <div className="ml-8 space-y-2">
            <div className="h-4 bg-[#243044] rounded w-full" />
            <div className="h-4 bg-[#243044] rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="text-center py-12">
      <FolderIcon className="w-16 h-16 text-[#64748B] mx-auto mb-4" />
      <p className="text-[#94A3B8] text-sm">Документы не найдены</p>
      <p className="text-[#64748B] text-xs mt-1">
        Загрузите документы для спектакля
      </p>
    </div>
  );
}

// Компонент документа в списке
interface DocumentRowProps {
  document: PerformanceDocumentListItem;
  onClick?: (document: PerformanceDocumentListItem) => void;
}

function DocumentRow({ document, onClick }: DocumentRowProps) {
  const uploadDate = new Date(document.uploaded_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleClick = () => {
    if (onClick) {
      onClick(document);
    } else if (document.download_url) {
      window.open(document.download_url, '_blank');
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#243044] cursor-pointer transition-colors"
    >
      {/* Иконка документа */}
      <DocumentIcon className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />

      {/* Название */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#F1F5F9] truncate group-hover:text-[#D4A574]">
          {document.display_name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[#64748B]">
            {formatFileSize(document.file_size)}
          </span>
          <span className="text-xs text-[#64748B]">•</span>
          <span className="text-xs text-[#64748B]">{uploadDate}</span>
        </div>
      </div>

      {/* Иконка скачивания (показывается при hover) */}
      <ArrowDownTrayIcon className="w-4 h-4 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}

// Компонент категории
interface CategoryRowProps {
  category: DocumentTreeCategory;
  sectionColor: string;
  onDocumentClick?: (document: PerformanceDocumentListItem) => void;
}

function CategoryRow({ category, sectionColor, onDocumentClick }: CategoryRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-2">
      {/* Заголовок категории */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1A2332] cursor-pointer transition-colors"
      >
        {/* Иконка папки */}
        {isExpanded ? (
          <FolderOpenIcon className="w-5 h-5 text-[#94A3B8] flex-shrink-0" />
        ) : (
          <FolderIcon className="w-5 h-5 text-[#94A3B8] flex-shrink-0" />
        )}

        {/* Название категории */}
        <span className="flex-1 text-sm text-[#F1F5F9] font-medium">
          {category.category_name}
        </span>

        {/* Счётчик документов */}
        <span
          className="px-2 py-0.5 text-xs rounded-full text-white flex-shrink-0"
          style={{ backgroundColor: sectionColor }}
        >
          {category.count}
        </span>

        {/* Иконка раскрытия */}
        {isExpanded ? (
          <ChevronDownIcon className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
        )}
      </div>

      {/* Список документов (с анимацией) */}
      {isExpanded && (
        <div className="ml-8 mt-1 space-y-0.5">
          {category.documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              onClick={onDocumentClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Компонент раздела
interface SectionRowProps {
  section: DocumentTreeSection;
  onDocumentClick?: (document: PerformanceDocumentListItem) => void;
}

function SectionRow({ section, onDocumentClick }: SectionRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const sectionColor = SECTION_COLORS[section.section];

  return (
    <div className="mb-4">
      {/* Заголовок раздела */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1A2332] hover:bg-[#243044] cursor-pointer transition-colors border-l-4"
        style={{ borderColor: sectionColor }}
      >
        {/* Иконка раскрытия */}
        {isExpanded ? (
          <ChevronDownIcon className="w-5 h-5 text-[#D4A574] flex-shrink-0" />
        ) : (
          <ChevronRightIcon className="w-5 h-5 text-[#D4A574] flex-shrink-0" />
        )}

        {/* Название раздела */}
        <h3 className="flex-1 text-base font-['Cormorant_Garamond'] font-semibold text-[#F1F5F9]">
          {section.section_name}
        </h3>

        {/* Счётчик документов */}
        <span
          className="px-3 py-1 text-sm font-medium rounded-full text-white flex-shrink-0"
          style={{ backgroundColor: sectionColor }}
        >
          {section.total_count}
        </span>
      </div>

      {/* Категории (с анимацией) */}
      {isExpanded && (
        <div className="ml-6 mt-2 space-y-1">
          {section.categories.map((category) => (
            <CategoryRow
              key={category.category}
              category={category}
              sectionColor={sectionColor}
              onDocumentClick={onDocumentClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Главный компонент дерева
export function DocumentTree({
  tree,
  isLoading = false,
  onDocumentClick,
}: DocumentTreeProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-[#1A2332] rounded-lg p-6">
        <TreeSkeleton />
      </div>
    );
  }

  // Empty state
  if (!tree || tree.total_documents === 0) {
    return (
      <div className="bg-[#1A2332] rounded-lg p-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bg-[#1A2332] rounded-lg p-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-['Cormorant_Garamond'] font-bold text-[#F1F5F9]">
          Структура документов
        </h2>
        <span className="text-sm text-[#94A3B8]">
          Всего документов: <span className="text-[#D4A574] font-medium">{tree.total_documents}</span>
        </span>
      </div>

      {/* Разделы */}
      <div className="space-y-3">
        {tree.sections.map((section) => (
          <SectionRow
            key={section.section}
            section={section}
            onDocumentClick={onDocumentClick}
          />
        ))}
      </div>
    </div>
  );
}

export default DocumentTree;
