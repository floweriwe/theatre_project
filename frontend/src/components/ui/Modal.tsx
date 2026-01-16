/**
 * Компонент Modal (модальное окно) — Modern Theatre Elegance v3
 * 
 * Элегантные модальные окна с ТЁМНЫМ фоном и анимациями.
 */

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/helpers';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Callback закрытия */
  onClose: () => void;
  /** Заголовок */
  title?: string;
  /** Подзаголовок */
  subtitle?: string;
  /** Содержимое */
  children: ReactNode;
  /** Контент футера (кнопки) */
  footer?: ReactNode;
  /** Размер модального окна */
  size?: ModalSize;
  /** Закрывать по клику на overlay */
  closeOnOverlayClick?: boolean;
  /** Закрывать по Escape */
  closeOnEscape?: boolean;
  /** Показывать кнопку закрытия */
  showCloseButton?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-4xl',
};

/**
 * Компонент модального окна с элегантным тёмным дизайном.
 * 
 * @example
 * <Modal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   title="Подтверждение"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={onClose}>Отмена</Button>
 *       <Button variant="primary" onClick={onConfirm}>Подтвердить</Button>
 *     </>
 *   }
 * >
 *   <p>Вы уверены, что хотите продолжить?</p>
 * </Modal>
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Блокировка скролла body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay — тёмный с blur */}
      <div
        className={cn(
          'fixed inset-0',
          'bg-black/70 backdrop-blur-sm',
          'animate-fade-in'
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal positioning */}
      <div className="min-h-full flex items-center justify-center p-4">
        {/* Modal content — ТЁМНЫЙ ФОН */}
        <div
          className={cn(
            'relative w-full',
            sizeClasses[size],
            // КРИТИЧНО: bg-bg-overlay — тёмный фон модалки
            'bg-bg-overlay',
            'border border-border-default',
            'rounded-2xl shadow-2xl shadow-black/50',
            'animate-scale-in',
            'max-h-[85vh] flex flex-col'
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border-subtle">
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    className="font-display text-xl font-semibold text-text-primary"
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-lg',
                    'flex items-center justify-center',
                    'text-text-muted hover:text-text-primary',
                    'hover:bg-white/5 transition-colors'
                  )}
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Рендерим в portal для корректного z-index
  return createPortal(modalContent, document.body);
}

export default Modal;
