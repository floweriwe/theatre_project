/**
 * Вспомогательные функции для Theatre Management System
 */

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

/**
 * Форматирование даты в человекочитаемый формат (русская локаль).
 * 
 * @param date - Дата для форматирования
 * @param options - Опции форматирования
 * @returns Отформатированная строка
 * 
 * @example
 * formatDate(new Date()) // "25 декабря 2025"
 * formatDate(new Date(), { includeTime: true }) // "25 декабря 2025, 14:30"
 */
export function formatDate(
  date: Date | string,
  options: {
    includeTime?: boolean;
    short?: boolean;
  } = {}
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (options.short) {
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  }
  
  const dateStr = d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  if (options.includeTime) {
    const timeStr = d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr}, ${timeStr}`;
  }
  
  return dateStr;
}

/**
 * Форматирование относительного времени ("5 минут назад", "вчера").
 * 
 * @param date - Дата для форматирования
 * @returns Относительное время
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  
  return formatDate(d, { short: true });
}

/**
 * Форматирование числа с разделителями тысяч.
 * 
 * @param num - Число для форматирования
 * @returns Отформатированная строка
 * 
 * @example
 * formatNumber(1234567) // "1 234 567"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU');
}

/**
 * Форматирование денежной суммы.
 * 
 * @param amount - Сумма
 * @param currency - Код валюты (по умолчанию RUB)
 * @returns Отформатированная строка с валютой
 * 
 * @example
 * formatCurrency(1234.5) // "1 234,50 ₽"
 */
export function formatCurrency(amount: number, currency = 'RUB'): string {
  return amount.toLocaleString('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
}

/**
 * Форматирование размера файла в человекочитаемый формат.
 * 
 * @param bytes - Размер в байтах
 * @returns Отформатированная строка
 * 
 * @example
 * formatFileSize(1024) // "1 КБ"
 * formatFileSize(1048576) // "1 МБ"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Усечение текста с добавлением многоточия.
 * 
 * @param text - Исходный текст
 * @param maxLength - Максимальная длина
 * @returns Усечённый текст
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Склонение слова в зависимости от числа.
 * 
 * @param count - Число
 * @param words - Массив форм слова [1, 2-4, 5+]
 * @returns Правильная форма слова
 * 
 * @example
 * pluralize(1, ['элемент', 'элемента', 'элементов']) // "элемент"
 * pluralize(2, ['элемент', 'элемента', 'элементов']) // "элемента"
 * pluralize(5, ['элемент', 'элемента', 'элементов']) // "элементов"
 */
export function pluralize(count: number, words: [string, string, string]): string {
  const absCount = Math.abs(count) % 100;
  const lastDigit = absCount % 10;
  
  if (absCount > 10 && absCount < 20) return words[2];
  if (lastDigit > 1 && lastDigit < 5) return words[1];
  if (lastDigit === 1) return words[0];
  
  return words[2];
}

/**
 * Генерация инициалов из имени.
 * 
 * @param name - Полное имя
 * @returns Инициалы (1-2 буквы)
 * 
 * @example
 * getInitials("Иван Петров") // "ИП"
 * getInitials("Иван") // "И"
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Debounce функции.
 * 
 * @param fn - Функция для debounce
 * @param delay - Задержка в мс
 * @returns Debounced функция
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Генерация уникального ID.
 * 
 * @param prefix - Префикс для ID
 * @returns Уникальный ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Проверка, является ли объект пустым.
 */
export function isEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Безопасный доступ к вложенным свойствам объекта.
 * 
 * @param obj - Объект
 * @param path - Путь к свойству (через точку)
 * @param defaultValue - Значение по умолчанию
 */
export function get<T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }
  
  return (result as T) ?? defaultValue;
}

/**
 * Копирование текста в буфер обмена.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Скачивание файла по URL.
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Получение расширения файла.
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

/**
 * Проверка, является ли файл изображением.
 */
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
}

/**
 * Проверка, является ли файл документом для просмотра.
 */
export function isViewableDocument(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'odt', 'csv'].includes(ext);
}
