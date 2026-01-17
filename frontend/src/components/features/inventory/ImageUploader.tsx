/**
 * ImageUploader - компонент загрузки изображений с превью.
 *
 * Возможности:
 * - Drag & Drop загрузка
 * - Множественная загрузка
 * - Превью перед отправкой
 * - Поворот изображений
 * - Удаление из очереди
 */
import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  RotateCw,
  RotateCcw,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  rotation: number;
  isPrimary: boolean;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface ImageUploaderProps {
  onUpload: (file: File, isPrimary: boolean) => Promise<void>;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  /** Существующие фото (для показа счётчика) */
  existingCount?: number;
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function rotateImage(
  imageUrl: string,
  degrees: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Swap dimensions if rotating 90 or 270 degrees
      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      // Move to center, rotate, draw image
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageUrl;
  });
}

export function ImageUploader({
  onUpload,
  maxFiles = 10,
  maxSizeMB = 10,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className,
  existingCount = 0,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = maxFiles - existingCount - files.length;

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: ImageFile[] = [];

      Array.from(fileList).forEach((file) => {
        // Validate type
        if (!acceptedTypes.includes(file.type)) {
          console.warn(`Invalid file type: ${file.type}`);
          return;
        }

        // Validate size
        if (file.size > maxSizeMB * 1024 * 1024) {
          console.warn(`File too large: ${file.name}`);
          return;
        }

        // Check remaining slots
        if (newFiles.length >= remainingSlots) {
          console.warn('Max files limit reached');
          return;
        }

        newFiles.push({
          id: generateId(),
          file,
          preview: URL.createObjectURL(file),
          rotation: 0,
          isPrimary: existingCount === 0 && files.length === 0 && newFiles.length === 0,
          status: 'pending',
        });
      });

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [acceptedTypes, maxSizeMB, remainingSlots, existingCount, files.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      // Revoke object URL
      const removed = prev.find((f) => f.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  }, []);

  const rotateFile = useCallback(async (id: string, direction: 'cw' | 'ccw') => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const delta = direction === 'cw' ? 90 : -90;
        const newRotation = (f.rotation + delta + 360) % 360;
        return { ...f, rotation: newRotation };
      })
    );
  }, []);

  const setPrimary = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => ({ ...f, isPrimary: f.id === id }))
    );
  }, []);

  const uploadAll = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      if (file.status !== 'pending') continue;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: 'uploading' } : f
        )
      );

      try {
        // Apply rotation if needed
        let fileToUpload = file.file;
        if (file.rotation !== 0) {
          const rotatedDataUrl = await rotateImage(file.preview, file.rotation);
          const response = await fetch(rotatedDataUrl);
          const blob = await response.blob();
          fileToUpload = new File([blob], file.file.name, { type: 'image/jpeg' });
        }

        await onUpload(fileToUpload, file.isPrimary);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: 'success' } : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'error', error: 'Ошибка загрузки' }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    // Remove successful uploads
    setTimeout(() => {
      setFiles((prev) => prev.filter((f) => f.status !== 'success'));
    }, 1500);
  }, [files, onUpload]);

  const clearAll = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  }, [files]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-[#D4A574] bg-[#D4A574]/10'
            : 'border-[#334155] hover:border-[#475569] bg-[#1A2332]',
          remainingSlots <= 0 && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={remainingSlots <= 0}
        />

        <Upload
          className={cn(
            'w-12 h-12 mx-auto mb-4',
            isDragging ? 'text-[#D4A574]' : 'text-[#64748B]'
          )}
        />
        <p className="text-[#F1F5F9] font-medium mb-1">
          {isDragging ? 'Отпустите файлы' : 'Перетащите изображения сюда'}
        </p>
        <p className="text-sm text-[#64748B]">
          или кликните для выбора файлов
        </p>
        <p className="text-xs text-[#64748B] mt-2">
          {acceptedTypes.map((t) => t.split('/')[1]).join(', ')} до {maxSizeMB}MB
          {remainingSlots > 0 && ` • Осталось ${remainingSlots} из ${maxFiles}`}
        </p>
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#94A3B8]">
              {files.length} файл(ов) к загрузке
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-[#64748B] hover:text-red-400 transition-colors"
              >
                Очистить
              </button>
              <button
                type="button"
                onClick={uploadAll}
                disabled={isUploading || files.every((f) => f.status !== 'pending')}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  'bg-[#D4A574] text-[#0F1419] hover:bg-[#E8C297]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Загрузка...
                  </span>
                ) : (
                  'Загрузить все'
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden bg-[#243044] border-2',
                  file.isPrimary
                    ? 'border-[#D4A574]'
                    : 'border-transparent',
                  file.status === 'uploading' && 'opacity-70',
                  file.status === 'error' && 'border-red-500'
                )}
              >
                {/* Image */}
                <img
                  src={file.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  style={{ transform: `rotate(${file.rotation}deg)` }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => rotateFile(file.id, 'ccw')}
                      className="p-1.5 bg-black/50 rounded hover:bg-black/70 transition-colors"
                      title="Повернуть влево"
                    >
                      <RotateCcw className="w-4 h-4 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateFile(file.id, 'cw')}
                      className="p-1.5 bg-black/50 rounded hover:bg-black/70 transition-colors"
                      title="Повернуть вправо"
                    >
                      <RotateCw className="w-4 h-4 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 bg-red-500/80 rounded hover:bg-red-500 transition-colors"
                      title="Удалить"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Primary badge */}
                  <button
                    type="button"
                    onClick={() => setPrimary(file.id)}
                    className={cn(
                      'absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                      file.isPrimary
                        ? 'bg-[#D4A574] text-[#0F1419]'
                        : 'bg-black/50 text-white hover:bg-black/70'
                    )}
                    title={file.isPrimary ? 'Основное фото' : 'Сделать основным'}
                  >
                    <Star
                      className={cn(
                        'w-3 h-3',
                        file.isPrimary && 'fill-current'
                      )}
                    />
                    {file.isPrimary ? 'Основное' : 'Сделать основным'}
                  </button>
                </div>

                {/* Status overlay */}
                {file.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="w-8 h-8 text-[#D4A574] animate-spin" />
                  </div>
                )}

                {file.status === 'success' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/60">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                )}

                {file.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/60 p-2">
                    <AlertCircle className="w-8 h-8 text-white mb-1" />
                    <span className="text-xs text-white text-center">
                      {file.error}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
