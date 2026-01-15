/**
 * Компонент Spinner (индикатор загрузки) — Modern Theatre Elegance
 * 
 * Элегантный индикатор загрузки с золотым акцентом.
 */

import { cn } from '@/utils/helpers';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  /** Размер спиннера */
  size?: SpinnerSize;
  /** Дополнительные классы */
  className?: string;
  /** Цвет (по умолчанию золотой) */
  variant?: 'gold' | 'white' | 'primary';
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const variantClasses: Record<string, string> = {
  gold: 'text-gold',
  white: 'text-white',
  primary: 'text-primary',
};

/**
 * Индикатор загрузки.
 * 
 * @example
 * <Spinner />
 * <Spinner size="lg" />
 * <Spinner variant="white" />
 */
export function Spinner({ size = 'md', className, variant = 'gold' }: SpinnerProps) {
  return (
    <svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Спиннер на всю область контейнера.
 */
interface ContainerSpinnerProps {
  /** Текст под спиннером */
  text?: string;
  /** Размер */
  size?: SpinnerSize;
}

export function ContainerSpinner({ text, size = 'lg' }: ContainerSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Spinner size={size} />
      {text && (
        <p className="mt-4 text-sm text-text-secondary">{text}</p>
      )}
    </div>
  );
}

/**
 * Спиннер на весь экран.
 */
export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="xl" />
        <p className="mt-4 text-text-secondary">Загрузка...</p>
      </div>
    </div>
  );
}

export default Spinner;
