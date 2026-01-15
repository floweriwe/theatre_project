/**
 * Компонент Badge (метка/бейдж) — Modern Theatre Elegance v3
 * 
 * Элегантные метки для статусов и категорий — тёмная тема.
 */

import { type ReactNode } from 'react';
import { cn } from '@/utils/helpers';

type BadgeVariant = 'default' | 'gold' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  /** Содержимое */
  children: ReactNode;
  /** Вариант стилизации */
  variant?: BadgeVariant;
  /** Размер */
  size?: BadgeSize;
  /** Иконка слева */
  icon?: ReactNode;
  /** Дополнительные классы */
  className?: string;
  /** Точка-индикатор вместо текста */
  dot?: boolean;
}

/** Стили вариантов — тёмная тема с полупрозрачным фоном */
const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-text-secondary',
  gold: 'bg-gold-300/10 text-gold-300',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
};

/** Цвета точки */
const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-text-muted',
  gold: 'bg-gold-300',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const dotSizes: Record<BadgeSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

/**
 * Компонент Badge для отображения статусов и меток.
 * 
 * @example
 * // Базовый badge
 * <Badge>Новый</Badge>
 * 
 * @example
 * // Badge с вариантом и иконкой
 * <Badge variant="success" icon={<Check />}>
 *   Активен
 * </Badge>
 * 
 * @example
 * // Золотой badge
 * <Badge variant="gold" size="lg">
 *   Премьера
 * </Badge>
 * 
 * @example
 * // Badge с точкой
 * <Badge variant="success" dot>
 *   В репертуаре
 * </Badge>
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className,
  dot,
}: BadgeProps) {
  // Режим с точкой-индикатором
  if (dot) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <span
          className={cn(
            'rounded-full',
            dotSizes[size],
            dotColors[variant]
          )}
        />
        <span className="text-text-secondary text-sm">{children}</span>
      </span>
    );
  }

  // Обычный badge
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'rounded-full font-medium',
        'whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

export default Badge;
