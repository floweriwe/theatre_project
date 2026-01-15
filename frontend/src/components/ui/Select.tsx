/**
 * Компонент Select — стилизованный выпадающий список.
 * Modern Theatre Elegance v3 — тёмная тема.
 * 
 * Поддерживает варианты оформления, иконки и состояние ошибки.
 * Можно использовать либо options prop, либо children.
 */

import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Варианты отображения */
  variant?: 'default' | 'filled';
  /** Размер */
  size?: 'sm' | 'md' | 'lg';
  /** Подпись поля */
  label?: string;
  /** Сообщение об ошибке */
  error?: string;
  /** Подсказка */
  hint?: string;
  /** Иконка слева */
  leftIcon?: React.ReactNode;
  /** Плейсхолдер (первый пустой option) */
  placeholder?: string;
  /** Опции для выбора (альтернатива children) */
  options?: SelectOption[];
  /** Полная ширина */
  fullWidth?: boolean;
  /** Children (option элементы) */
  children?: React.ReactNode;
}

const variantStyles = {
  // Default — тёмный фон для тёмной темы
  default: cn(
    'bg-bg-surface border-border-default text-text-primary',
    'hover:border-border-strong',
    'focus:border-gold-300/50 focus:ring-gold-300/20',
    'disabled:bg-bg-surface-hover disabled:opacity-60',
    // Стилизация option для тёмной темы
    '[&>option]:bg-bg-overlay [&>option]:text-text-primary'
  ),
  // Filled — чуть светлее
  filled: cn(
    'bg-bg-surface-hover border-transparent text-text-primary',
    'hover:bg-bg-overlay',
    'focus:bg-bg-surface focus:border-gold-300/50 focus:ring-gold-300/20',
    'disabled:opacity-60',
    '[&>option]:bg-bg-overlay [&>option]:text-text-primary'
  ),
};

const sizeStyles = {
  sm: 'h-8 text-sm pl-3 pr-8',
  md: 'h-10 text-sm pl-4 pr-10',
  lg: 'h-12 text-base pl-4 pr-12',
};

const iconSizeStyles = {
  sm: 'left-2',
  md: 'left-3',
  lg: 'left-4',
};

const chevronSizeStyles = {
  sm: 'right-2 w-4 h-4',
  md: 'right-3 w-5 h-5',
  lg: 'right-4 w-5 h-5',
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = 'default',
      size = 'md',
      label,
      error,
      hint,
      leftIcon,
      placeholder,
      options,
      fullWidth = true,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const hasLeftIcon = !!leftIcon;
    
    const selectClasses = cn(
      // Базовые стили
      'appearance-none',
      'rounded-lg border',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2',
      'disabled:cursor-not-allowed',
      'cursor-pointer',
      // Вариант
      variantStyles[variant],
      // Размер
      sizeStyles[size],
      // Отступ для иконки
      hasLeftIcon && (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10'),
      // Ошибка
      error && 'border-error/50 focus:border-error focus:ring-error/20',
      // Ширина
      fullWidth && 'w-full',
      className
    );

    return (
      <div className={fullWidth ? 'w-full' : 'inline-block'}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}

        {/* Select wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-text-muted pointer-events-none',
                iconSizeStyles[size]
              )}
            >
              {leftIcon}
            </span>
          )}

          {/* Select element */}
          <select
            ref={ref}
            disabled={disabled}
            className={selectClasses}
            {...props}
          >
            {placeholder && !children && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {/* Используем children если переданы, иначе options */}
            {children ? children : (options || []).map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Chevron icon */}
          <span
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-text-muted pointer-events-none',
              chevronSizeStyles[size]
            )}
          >
            <ChevronDown />
          </span>

          {/* Error icon */}
          {error && (
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-error pointer-events-none',
                size === 'sm' ? 'right-7' : size === 'lg' ? 'right-11' : 'right-9'
              )}
            >
              <AlertCircle className="w-4 h-4" />
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-2 text-sm text-error flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </p>
        )}

        {/* Hint */}
        {hint && !error && (
          <p className="mt-2 text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption };
