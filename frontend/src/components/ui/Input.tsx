/**
 * Компонент текстового поля ввода — Modern Theatre Elegance v3
 * 
 * Элегантные поля ввода с золотым фокусом и тёмным фоном.
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Лейбл поля */
  label?: string;
  /** Текст ошибки */
  error?: string;
  /** Подсказка под полем */
  hint?: string;
  /** Иконка слева */
  leftIcon?: ReactNode;
  /** Иконка справа */
  rightIcon?: ReactNode;
  /** Занять всю ширину контейнера */
  fullWidth?: boolean;
}

/**
 * Компонент текстового поля ввода с элегантным тёмным дизайном.
 * 
 * @example
 * // Базовое поле
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="example@theatre.ru"
 * />
 * 
 * @example
 * // Поле с иконкой и ошибкой
 * <Input
 *   label="Поиск"
 *   leftIcon={<Search className="w-4 h-4" />}
 *   error="Минимум 3 символа"
 * />
 * 
 * @example
 * // Поле пароля с toggle
 * <Input
 *   label="Пароль"
 *   type="password"
 *   hint="Минимум 8 символов"
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      type,
      id,
      required,
      ...props
    },
    ref
  ) => {
    // Состояние для показа/скрытия пароля
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    
    // Генерируем ID если не передан
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const hasError = Boolean(error);

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {/* Лейбл */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        {/* Контейнер поля */}
        <div className="relative">
          {/* Левая иконка */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}

          {/* Поле ввода — ТЁМНЫЙ ФОН */}
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              // Базовые стили
              'w-full h-11 px-4 rounded-lg',
              'text-sm',
              'transition-all duration-200',
              // Тёмный фон
              'bg-bg-surface',
              'border border-border-default',
              'text-text-primary',
              'placeholder:text-text-placeholder',
              // Hover
              'hover:border-border-strong',
              // Focus — золотой ring
              'focus:outline-none',
              'focus:border-gold-300/50',
              'focus:ring-2 focus:ring-gold-300/20',
              // Error state
              hasError && 'border-error/50 focus:border-error focus:ring-error/20',
              // Отступы для иконок
              leftIcon && 'pl-11',
              (rightIcon || isPassword) && 'pr-11',
              // Disabled состояние
              'disabled:bg-bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60',
              className
            )}
            {...props}
          />

          {/* Правая иконка или toggle пароля */}
          {(rightIcon || isPassword) && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="text-text-muted">{rightIcon}</span>
              )}
            </div>
          )}
        </div>

        {/* Ошибка или подсказка */}
        {error ? (
          <p className="mt-2 text-sm text-error flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </p>
        ) : hint ? (
          <p className="mt-2 text-xs text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
