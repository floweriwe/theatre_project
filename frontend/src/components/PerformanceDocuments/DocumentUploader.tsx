/**
 * Компонент загрузки документов спектакля.
 *
 * Поддерживает:
 * - Drag & drop
 * - Множественный выбор файлов
 * - Прогресс загрузки
 * - Валидацию файлов
 */
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useUploadPerformanceDocuments } from '@/hooks/usePerformanceDocuments';
import { formatFileSize } from '@/types/performance_document';

interface DocumentUploaderProps {
  performanceId: number;
  onUploadComplete?: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx',
  ],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'video/mp4': ['.mp4'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
};

export function DocumentUploader({
  performanceId,
  onUploadComplete,
  disabled = false,
}: DocumentUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const uploadMutation = useUploadPerformanceDocuments(performanceId);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Фильтруем файлы по размеру
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`Файл ${file.name} слишком большой`);
          return false;
        }
        return true;
      });
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: disabled || uploadMutation.isPending,
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await uploadMutation.mutateAsync(selectedFiles);
      setSelectedFiles([]);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${
            isDragActive
              ? 'border-[#D4A574] bg-[#D4A574]/10'
              : 'border-[#D4A574]/30 hover:border-[#D4A574]/50 bg-[#1A2332]'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          <CloudArrowUpIcon className="w-12 h-12 text-[#D4A574] mb-3" />
          {isDragActive ? (
            <p className="text-[#F1F5F9] font-medium">Отпустите файлы здесь...</p>
          ) : (
            <>
              <p className="text-[#F1F5F9] font-medium mb-1">
                Перетащите файлы сюда
              </p>
              <p className="text-[#94A3B8] text-sm">
                или нажмите для выбора файлов
              </p>
              <p className="text-[#64748B] text-xs mt-2">
                PDF, DOC, DOCX, XLS, XLSX, изображения, аудио, видео (до 50 МБ)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Выбранные файлы */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-[#F1F5F9]">
              Выбрано файлов: {selectedFiles.length}
            </h4>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-[#94A3B8] hover:text-[#F1F5F9]"
            >
              Очистить всё
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-[#243044] rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <DocumentIcon className="w-5 h-5 text-[#94A3B8] flex-shrink-0" />
                  <span className="text-sm text-[#F1F5F9] truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-[#64748B] flex-shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-[#64748B] hover:text-[#F1F5F9] flex-shrink-0"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Кнопка загрузки */}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`
              w-full py-2.5 px-4 rounded-lg font-medium
              transition-colors
              ${
                isUploading
                  ? 'bg-[#D4A574]/50 text-[#0F1419] cursor-not-allowed'
                  : 'bg-[#D4A574] text-[#0F1419] hover:bg-[#E8C297]'
              }
            `}
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Загрузка...
              </span>
            ) : (
              `Загрузить ${selectedFiles.length} ${
                selectedFiles.length === 1 ? 'файл' : 'файлов'
              }`
            )}
          </button>

          {/* Ошибка */}
          {uploadMutation.isError && (
            <p className="text-sm text-red-400">
              Ошибка загрузки: {(uploadMutation.error as Error)?.message || 'Неизвестная ошибка'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentUploader;
