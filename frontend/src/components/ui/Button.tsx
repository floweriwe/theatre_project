/**
 * Компонент кнопки — Modern Theatre Elegance v3
 * 
 * Элегантные кнопки с золотыми акцентами и плавными переходами.
 * Тёмная тема.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type ReactElement, cloneElement, isValidElement } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers';

/** Варианты стилизации кнопки */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold-outline';

/** Размеры кнопки */
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Вариант стилизации */
  variant?: ButtonVariant;
  /** Размер кнопки */
  size?: ButtonSize;
  /** Состояние загрузки */
  loading?: boolean;
  /** Иконка слева */
  leftIcon?: ReactNode;
  /** Иконка справа */
  rightIcon?: ReactNode;
  /** Занять всю ширину контейнера */
  fullWidth?: boolean;
  /** Рендерить как дочерний элемент (для Link и др.) */
  asChild?: boolean;
}

/** Стили для вариантов — тёмная тема */
const variantStyles: Record<ButtonVariant, string> = {
  // Primary — золотой градиент (ТОЛЬКО для главного CTA)
  primary: cn(
    'bg-gradient-to-r from-gold-300 to-gold-400',
    'text-bg-base font-semibold',
    'shadow-lg shadow-gold-300/20',
    'hover:from-gold-200 hover:to-gold-300',
    'active:from-gold-400 active:to-gold-500',
    'focus-visible:ring-gold-300/50'
  ),
  // Secondary — прозрачная с границей
  secondary: cn(
    'bg-transparent',
    'border border-border-default',
    'text-text-primary',
    'hover:bg-bg-surface-hover hover:border-border-strong',
    'active:bg-bg-overlay',
    'focus-visible:ring-white/20'
  ),
  // Outline — алиас для secondary
  outline: cn(
    'bg-transparent',
    'border border-border-default',
    'text-text-primary',
    'hover:bg-bg-surface-hover hover:border-border-strong',
    'active:bg-bg-overlay',
    'focus-visible:ring-white/20'
  ),
  // Ghost — прозрачная без границы
  ghost: cn(
    'bg-transparent',
    'text-text-secondary',
    'hover:bg-bg-surface hover:text-text-primary',
    'active:bg-bg-surface-hover',
    'focus-visible:ring-white/20'
  ),
  // Danger — для удаления
  danger: cn(
    'bg-error/10',
    'border border-error/20',
    'text-error',
    'hover:bg-error/20 hover:border-error/30',
    'active:bg-error/30',
    'focus-visible:ring-error/30'
  ),
  // Gold Outline — элегантная золотая обводка
  'gold-outline': cn(
    'bg-transparent',
    'border border-gold-300/50',
    'text-gold-300',
    'hover:bg-gold-300/10 hover:border-gold-300',
    'active:bg-gold-300/20',
    'focus-visible:ring-gold-300/30'
  ),
};

/** Стили для размеров */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
  xl: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

/** Размеры иконки загрузки */
const loaderSizes: Record<ButtonSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

/**
 * Универсальный компонент кнопки с элегантным театральным дизайном.
 * 
 * @example
 * // Основная кнопка с золотым градиентом (для главного действия)
 * <Button variant="primary" onClick={handleClick}>
 *   Сохранить
 * </Button>
 * 
 * @example
 * // Вторичная кнопка с границей
 * <Button variant="secondary">
 *   Отмена
 * </Button>
 * 
 * @example
 * // Кнопка с иконкой и состоянием загрузки
 * <Button variant="primary" loading leftIcon={<Plus />}>
 *   Добавить спектакль
 * </Button>
 * 
 * @example
 * // Элегантная золотая обводка
 * <Button variant="gold-outline" size="lg">
 *   Премьера
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const buttonClasses = cn(
      // Базовые стили
      'inline-flex items-center justify-center',
      'font-medium',
      'transition-all duration-200 ease-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'select-none',
      // Вариант и размер
      variantStyles[variant],
      sizeStyles[size],
      // Полная ширина
      fullWidth && 'w-full',
      className
    );

    const content = (
      <>
        {/* Иконка загрузки или левая иконка */}
        {loading ? (
          <Loader2 className={cn(loaderSizes[size], 'animate-spin')} />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}

        {/* Текст кнопки */}
        <span className={cn(loading && 'opacity-70')}>{asChild ? null : children}</span>

        {/* Правая иконка */}
        {rightIcon && !loading && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </>
    );

    // Если asChild, клонируем дочерний элемент с нашими стилями
    if (asChild && isValidElement(children)) {
      return cloneElement(children as ReactElement<any>, {
        className: cn(buttonClasses, (children as ReactElement<any>).props.className),
        ref,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isDisabled}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
