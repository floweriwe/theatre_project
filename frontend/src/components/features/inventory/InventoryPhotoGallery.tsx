/**
 * Галерея фотографий предмета инвентаря.
 *
 * Отображает фото в сетке с возможностью загрузки новых.
 */

import { useState, useRef } from 'react';
import { ImagePlus, Star, Loader2, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { InventoryPhoto } from '@/types';

interface InventoryPhotoGalleryProps {
  /** Список фотографий */
  photos: InventoryPhoto[];
  /** ID предмета для загрузки (для будущего использования) */
  itemId: number;
  /** Callback при загрузке фото */
  onUpload: (file: File) => Promise<void>;
  /** Флаг загрузки */
  isUploading?: boolean;
}

/**
 * Компонент галереи фотографий инвентаря.
 */
export function InventoryPhotoGallery({
  photos,
  itemId: _itemId,
  onUpload,
  isUploading = false,
}: InventoryPhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return;
    }

    await onUpload(file);

    // Сброс input для повторной загрузки того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  // Сортируем фото: primary первым
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return 0;
  });

  // Формируем URL для изображения
  const getImageUrl = (photo: InventoryPhoto) => {
    // Если путь начинается с http, это уже полный URL
    if (photo.filePath.startsWith('http')) {
      return photo.filePath;
    }
    // Иначе добавляем базовый URL API
    return `/api/storage/${photo.filePath}`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white">Фотографии</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <ImagePlus className="w-4 h-4 mr-2" />
              Добавить фото
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {sortedPhotos.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <ImagePlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Нет фотографий</p>
          <p className="text-sm mt-1">
            Нажмите &quot;Добавить фото&quot; для загрузки
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-bg-tertiary"
            >
              <img
                src={getImageUrl(photo)}
                alt={photo.caption || 'Фото инвентаря'}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onClick={() => setPreviewUrl(getImageUrl(photo))}
              />
              {photo.isPrimary && (
                <div className="absolute top-2 left-2 bg-gold/90 text-bg-primary px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Главное
                </div>
              )}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-white text-sm truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Превью модальное окно */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gold transition-colors"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={previewUrl}
            alt="Превью"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Card>
  );
}

export default InventoryPhotoGallery;
