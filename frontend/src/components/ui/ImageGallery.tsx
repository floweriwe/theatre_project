/**
 * ImageGallery — Галерея изображений с лайтбоксом
 * Modern Theatre Elegance v3
 *
 * Grid thumbnails с модальным просмотром.
 */

import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/helpers';

// =============================================================================
// Types
// =============================================================================

export interface GalleryImage {
  id: string;
  src: string;
  alt?: string;
  thumbnail?: string;
}

export interface ImageGalleryProps {
  images: GalleryImage[];
  columns?: 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  aspectRatio?: 'square' | '4:3' | '16:9' | 'auto';
  onImageClick?: (image: GalleryImage, index: number) => void;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ImageGallery({
  images,
  columns = 4,
  gap = 'md',
  aspectRatio = 'square',
  onImageClick,
  className,
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const gapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const columnStyles = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
  };

  const aspectStyles = {
    square: 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    auto: '',
  };

  const handleImageClick = useCallback((image: GalleryImage, index: number) => {
    if (onImageClick) {
      onImageClick(image, index);
    } else {
      setCurrentIndex(index);
      setLightboxOpen(true);
    }
  }, [onImageClick]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleClose = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, handlePrevious, handleNext, handleClose]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  if (images.length === 0) {
    return (
      <div className={cn('text-center py-8 text-text-muted', className)}>
        Нет изображений
      </div>
    );
  }

  return (
    <>
      {/* Grid */}
      <div
        className={cn(
          'grid',
          columnStyles[columns],
          gapStyles[gap],
          className
        )}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            onClick={() => handleImageClick(image, index)}
            className={cn(
              'group relative cursor-pointer overflow-hidden rounded-xl',
              'bg-bg-surface border border-border-subtle',
              'transition-all duration-200',
              'hover:border-gold-300/30 hover:shadow-lg hover:shadow-black/20',
              aspectStyles[aspectRatio]
            )}
          >
            <img
              src={image.thumbnail || image.src}
              alt={image.alt || `Image ${index + 1}`}
              className={cn(
                'w-full h-full object-cover',
                'transition-transform duration-300',
                'group-hover:scale-105'
              )}
            />

            {/* Hover overlay */}
            <div className={cn(
              'absolute inset-0 bg-black/50 opacity-0',
              'flex items-center justify-center',
              'transition-opacity duration-200',
              'group-hover:opacity-100'
            )}>
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && createPortal(
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 animate-fade-in"
            onClick={handleClose}
          />

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* Close button */}
            <button
              onClick={handleClose}
              className={cn(
                'absolute top-4 right-4 z-10',
                'w-10 h-10 rounded-full',
                'bg-white/10 hover:bg-white/20',
                'flex items-center justify-center',
                'transition-colors'
              )}
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Previous button */}
            {images.length > 1 && (
              <button
                onClick={handlePrevious}
                className={cn(
                  'absolute left-4 z-10',
                  'w-12 h-12 rounded-full',
                  'bg-white/10 hover:bg-white/20',
                  'flex items-center justify-center',
                  'transition-colors'
                )}
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
            )}

            {/* Image */}
            <img
              src={images[currentIndex].src}
              alt={images[currentIndex].alt || `Image ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain animate-scale-in"
            />

            {/* Next button */}
            {images.length > 1 && (
              <button
                onClick={handleNext}
                className={cn(
                  'absolute right-4 z-10',
                  'w-12 h-12 rounded-full',
                  'bg-white/10 hover:bg-white/20',
                  'flex items-center justify-center',
                  'transition-colors'
                )}
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            )}

            {/* Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default ImageGallery;
