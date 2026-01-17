/**
 * Карточка документа спектакля.
 *
 * Отображает информацию о документе с возможностью:
 * - Скачивания
 * - Удаления
 * - Просмотра превью (для изображений и PDF)
 */
import { useState } from 'react';
import {
  DocumentIcon,
  PhotoIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  TableCellsIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import type { PerformanceDocumentListItem } from '@/types/performance_document';
import { formatFileSize, CATEGORY_NAMES } from '@/types/performance_document';

interface DocumentCardProps {
  document: PerformanceDocumentListItem;
  canDelete?: boolean;
  onDelete?: (documentId: number) => void;
  onPreview?: (document: PerformanceDocumentListItem) => void;
}

// Иконка по MIME типу
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return PhotoIcon;
  if (mimeType.startsWith('audio/')) return MusicalNoteIcon;
  if (mimeType.startsWith('video/')) return VideoCameraIcon;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return TableCellsIcon;
  if (mimeType === 'application/pdf') return DocumentIcon;
  return PaperClipIcon;
}

// Цвет иконки по MIME типу
function getIconColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'text-emerald-400';
  if (mimeType.startsWith('audio/')) return 'text-purple-400';
  if (mimeType.startsWith('video/')) return 'text-pink-400';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return 'text-green-400';
  if (mimeType === 'application/pdf') return 'text-red-400';
  return 'text-[#94A3B8]';
}

// Можно ли превьюшить файл
function canPreview(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('audio/') ||
    mimeType.startsWith('video/')
  );
}

export function DocumentCard({
  document,
  canDelete = false,
  onDelete,
  onPreview,
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const FileIcon = getFileIcon(document.mime_type);
  const iconColor = getIconColor(document.mime_type);
  const hasPreview = canPreview(document.mime_type);

  const handleDownload = () => {
    if (document.download_url) {
      window.open(document.download_url, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(document.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePreview = () => {
    if (hasPreview && onPreview) {
      onPreview(document);
    } else {
      handleDownload();
    }
  };

  // Форматирование даты
  const uploadDate = new Date(document.uploaded_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="group relative bg-[#243044] rounded-lg p-3 hover:bg-[#2d3a4f] transition-colors">
      <div className="flex items-start gap-3">
        {/* Иконка */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg bg-[#1A2332] flex items-center justify-center ${iconColor}`}
        >
          <FileIcon className="w-5 h-5" />
        </div>

        {/* Информация */}
        <div className="flex-1 min-w-0">
          <h4
            className="text-sm font-medium text-[#F1F5F9] truncate cursor-pointer hover:text-[#D4A574]"
            onClick={handlePreview}
            title={document.display_name}
          >
            {document.display_name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[#64748B]">
              {formatFileSize(document.file_size)}
            </span>
            <span className="text-xs text-[#64748B]">•</span>
            <span className="text-xs text-[#64748B]">{uploadDate}</span>
          </div>
          <div className="mt-1">
            <span className="inline-block text-xs px-2 py-0.5 rounded bg-[#1A2332] text-[#94A3B8]">
              {CATEGORY_NAMES[document.category] || document.category}
            </span>
          </div>
        </div>

        {/* Действия */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasPreview && onPreview && (
            <button
              onClick={handlePreview}
              className="p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1A2332] rounded"
              title="Просмотр"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1A2332] rounded"
            title="Скачать"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-[#94A3B8] hover:text-red-400 hover:bg-[#1A2332] rounded"
              title="Удалить"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Диалог подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-[#243044]/95 rounded-lg flex items-center justify-center p-3 z-10">
          <div className="text-center">
            <p className="text-sm text-[#F1F5F9] mb-3">Удалить документ?</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm text-[#94A3B8] hover:text-[#F1F5F9] bg-[#1A2332] rounded"
                disabled={isDeleting}
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentCard;
