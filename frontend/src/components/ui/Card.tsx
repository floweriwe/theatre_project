/**
 * Компонент карточки — Modern Theatre Elegance v3
 * 
 * Элегантные карточки с тёмным фоном и золотыми акцентами.
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Заголовок карточки */
  title?: string;
  /** Подзаголовок */
  subtitle?: string;
  /** Контент в правом верхнем углу */
  action?: ReactNode;
  /** Убрать внутренние отступы */
  noPadding?: boolean;
  /** Вариант стилизации */
  variant?: 'default' | 'elevated' | 'interactive' | 'glass' | 'bordered';
  /** Иконка рядом с заголовком */
  icon?: ReactNode;
  /** Декоративная полоска сверху */
  accent?: boolean;
}

/** Стили вариантов — тёмная тема */
const variantStyles = {
  default: cn(
    'bg-bg-surface',
    'border border-border-subtle',
    'rounded-2xl'
  ),
  elevated: cn(
    'bg-bg-surface',
    'border border-border-default',
    'rounded-2xl',
    'shadow-xl shadow-black/30'
  ),
  interactive: cn(
    'bg-bg-surface',
    'border border-border-subtle',
    'rounded-2xl',
    'cursor-pointer',
    'transition-all duration-200',
    'hover:bg-bg-surface-hover hover:border-gold/50',
    'hover:shadow-lg hover:shadow-black/20',
    'hover:-translate-y-1'
  ),
  glass: cn(
    'bg-bg-overlay/80',
    'backdrop-blur-xl',
    'border border-border-default',
    'rounded-2xl'
  ),
  bordered: cn(
    'bg-bg-surface',
    'border-2 border-gold-300/30',
    'rounded-2xl',
    'hover:border-gold-300/50',
    'transition-colors duration-200'
  ),
};

/**
 * Компонент карточки для группировки контента.
 * 
 * @example
 * // Базовая карточка
 * <Card title="Инвентарь" subtitle="Управление предметами">
 *   <p>Содержимое карточки</p>
 * </Card>
 * 
 * @example
 * // Карточка с золотым акцентом
 * <Card variant="elevated" accent title="Премьера">
 *   <PerformanceInfo />
 * </Card>
 * 
 * @example
 * // Интерактивная карточка
 * <Card variant="interactive" onClick={handleClick}>
 *   <ModulePreview />
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      title,
      subtitle,
      action,
      noPadding = false,
      variant = 'default',
      icon,
      accent = false,
      children,
      ...props
    },
    ref
  ) => {
    const hasHeader = title || subtitle || action;

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {/* Декоративная золотая полоска сверху */}
        {accent && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-300 to-gold-400" />
        )}
        
        {/* Заголовок */}
        {hasHeader && (
          <div className={cn(
            'flex items-start justify-between gap-4',
            'px-6 py-5',
            'border-b border-border-subtle'
          )}>
            <div className="flex items-start gap-3 min-w-0">
              {/* Иконка — всегда золотая */}
              {icon && (
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gold-300/10 flex items-center justify-center">
                  <span className="text-gold-300">{icon}</span>
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="font-display text-lg font-semibold text-text-primary truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-text-secondary mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        )}

        {/* Контент */}
        <div className={cn(!noPadding && 'p-6')}>
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';

// =============================================================================
// Card Stat — для статистики (все иконки золотые)
// =============================================================================

interface CardStatProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function CardStat({ label, value, icon, trend, className }: CardStatProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Иконка — ВСЕГДА золотая */}
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-gold-300/10 flex items-center justify-center flex-shrink-0">
          <span className="text-gold-300">{icon}</span>
        </div>
      )}
      <div>
        <p className="text-2xl font-semibold text-text-primary">
          {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">{label}</span>
          {trend && (
            <span className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-error'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Card Divider
// =============================================================================

export function CardDivider({ className }: { className?: string }) {
  return (
    <div className={cn('h-px bg-border-subtle -mx-6', className)} />
  );
}

// =============================================================================
// Card Header — для гибкой компоновки
// =============================================================================

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        'px-6 py-5',
        'border-b border-border-subtle',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Card Title
// =============================================================================

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'font-display text-lg font-semibold text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

// =============================================================================
// Card Content
// =============================================================================

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

// =============================================================================
// Card Footer
// =============================================================================

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        'px-6 py-4',
        'border-t border-border-subtle',
        'flex items-center justify-end gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
