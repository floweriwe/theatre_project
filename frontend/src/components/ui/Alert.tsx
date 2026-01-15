/**
 * Компонент Alert (уведомление) — Modern Theatre Elegance v3
 * 
 * Элегантные уведомления для тёмной темы.
 */

import { type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/utils/helpers';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  /** Содержимое уведомления */
  children: ReactNode;
  /** Вариант стилизации */
  variant?: AlertVariant;
  /** Заголовок */
  title?: string;
  /** Callback закрытия */
  onClose?: () => void;
  /** Дополнительные классы */
  className?: string;
}

/** Конфигурация вариантов — тёмная тема */
const variantConfig: Record<AlertVariant, {
  bg: string;
  border: string;
  icon: typeof Info;
  iconColor: string;
  titleColor: string;
}> = {
  info: {
    bg: 'bg-info/10',
    border: 'border-info/20',
    icon: Info,
    iconColor: 'text-info',
    titleColor: 'text-info',
  },
  success: {
    bg: 'bg-success/10',
    border: 'border-success/20',
    icon: CheckCircle,
    iconColor: 'text-success',
    titleColor: 'text-success',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    icon: AlertTriangle,
    iconColor: 'text-warning',
    titleColor: 'text-warning',
  },
  error: {
    bg: 'bg-error/10',
    border: 'border-error/20',
    icon: AlertCircle,
    iconColor: 'text-error',
    titleColor: 'text-error',
  },
};

/**
 * Компонент Alert для отображения уведомлений.
 * 
 * @example
 * // Базовое уведомление
 * <Alert variant="success">
 *   Данные успешно сохранены
 * </Alert>
 * 
 * @example
 * // Уведомление с заголовком и кнопкой закрытия
 * <Alert 
 *   variant="error" 
 *   title="Ошибка"
 *   onClose={() => setError(null)}
 * >
 *   Не удалось загрузить данные
 * </Alert>
 */
export function Alert({
  children,
  variant = 'info',
  title,
  onClose,
  className,
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'relative rounded-xl p-4',
        'border',
        config.bg,
        config.border,
        'animate-fade-in',
        className
      )}
    >
      <div className="flex gap-3">
        {/* Иконка */}
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        
        {/* Контент */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('font-medium mb-1', config.titleColor)}>
              {title}
            </h4>
          )}
          <div className="text-sm text-text-secondary">
            {children}
          </div>
        </div>
        
        {/* Кнопка закрытия */}
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-lg',
              'flex items-center justify-center',
              'text-text-muted hover:text-text-primary',
              'hover:bg-white/5 transition-colors'
            )}
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;
