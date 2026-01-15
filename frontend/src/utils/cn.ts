import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Утилита для объединения Tailwind классов с поддержкой условий.
 * Использует clsx для условной логики и tailwind-merge для разрешения конфликтов.
 * 
 * @example
 * cn('px-4 py-2', isActive && 'bg-gold-500', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
