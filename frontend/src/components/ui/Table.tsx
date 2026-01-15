/**
 * Компонент Table — стилизованная таблица данных.
 * 
 * Поддерживает сортировку, hover эффекты и различные варианты оформления.
 */

import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface Column<T> {
  /** Уникальный ключ колонки */
  key: string;
  /** Заголовок колонки */
  header: React.ReactNode;
  /** Функция рендера ячейки */
  render?: (item: T, index: number) => React.ReactNode;
  /** Ширина колонки */
  width?: string;
  /** Выравнивание */
  align?: 'left' | 'center' | 'right';
  /** Возможность сортировки */
  sortable?: boolean;
  /** Скрыть на мобильных */
  hideOnMobile?: boolean;
  /** Скрыть на планшетах */
  hideOnTablet?: boolean;
  /** Дополнительные классы */
  className?: string;
}

export interface TableProps<T> {
  /** Данные таблицы */
  data: T[];
  /** Определения колонок */
  columns: Column<T>[];
  /** Функция получения ключа строки */
  rowKey: (item: T, index: number) => string | number;
  /** Вариант отображения */
  variant?: 'default' | 'striped' | 'bordered';
  /** Размер */
  size?: 'sm' | 'md' | 'lg';
  /** Фиксированный заголовок */
  stickyHeader?: boolean;
  /** Hover эффект на строках */
  hoverable?: boolean;
  /** Клик по строке */
  onRowClick?: (item: T, index: number) => void;
  /** Текущая сортировка */
  sortBy?: string;
  /** Направление сортировки */
  sortOrder?: 'asc' | 'desc';
  /** Обработчик сортировки */
  onSort?: (key: string) => void;
  /** Кастомный контент для пустого состояния */
  emptyContent?: React.ReactNode;
  /** Загрузка */
  loading?: boolean;
  /** Дополнительные классы для контейнера */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

function Table<T>({
  data,
  columns,
  rowKey,
  variant = 'default',
  size = 'md',
  stickyHeader = false,
  hoverable = true,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  emptyContent,
  loading = false,
  className = '',
}: TableProps<T>) {
  // Size styles
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const cellPadding = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-5 py-4',
  };

  // Get alignment class
  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  // Get visibility classes
  const getVisibilityClass = (column: Column<T>) => {
    const classes: string[] = [];
    if (column.hideOnMobile) classes.push('hidden sm:table-cell');
    if (column.hideOnTablet) classes.push('hidden lg:table-cell');
    return classes.join(' ');
  };

  // Render sort icon
  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    const isActive = sortBy === column.key;
    const iconClass = `w-4 h-4 transition-colors ${
      isActive ? 'text-gold' : 'text-text-muted'
    }`;

    if (!isActive) {
      return <ChevronsUpDown className={iconClass} />;
    }

    return sortOrder === 'asc' ? (
      <ChevronUp className={iconClass} />
    ) : (
      <ChevronDown className={iconClass} />
    );
  };

  // Handle header click
  const handleHeaderClick = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`w-full ${sizeStyles[size]}`}>
        {/* Header */}
        <thead
          className={`
            bg-surface-100
            ${stickyHeader ? 'sticky top-0 z-10' : ''}
          `}
        >
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  ${cellPadding[size]}
                  ${getAlignClass(column.align)}
                  ${getVisibilityClass(column)}
                  font-semibold text-text-primary
                  border-b border-surface-200
                  ${column.sortable ? 'cursor-pointer select-none hover:bg-surface-200 transition-colors' : ''}
                  ${column.className || ''}
                `}
                style={column.width ? { width: column.width } : undefined}
                onClick={() => handleHeaderClick(column)}
              >
                <div
                  className={`
                    flex items-center gap-2
                    ${column.align === 'right' ? 'justify-end' : ''}
                    ${column.align === 'center' ? 'justify-center' : ''}
                  `}
                >
                  {column.header}
                  {renderSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-surface-200">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      ${cellPadding[size]}
                      ${getVisibilityClass(column)}
                    `}
                  >
                    <div className="h-4 bg-surface-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Empty state
            <tr>
              <td colSpan={columns.length} className={cellPadding[size]}>
                {emptyContent || (
                  <div className="text-center py-8 text-text-muted">
                    Нет данных для отображения
                  </div>
                )}
              </td>
            </tr>
          ) : (
            // Data rows
            data.map((item, index) => (
              <tr
                key={rowKey(item, index)}
                className={`
                  transition-colors
                  ${variant === 'striped' && index % 2 === 1 ? 'bg-surface-50' : 'bg-white'}
                  ${hoverable ? 'hover:bg-gold-50/50' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      ${cellPadding[size]}
                      ${getAlignClass(column.align)}
                      ${getVisibilityClass(column)}
                      ${column.className || ''}
                    `}
                  >
                    {column.render
                      ? column.render(item, index)
                      : (item as Record<string, unknown>)[column.key]?.toString() || '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// Pagination Component
// =============================================================================

interface PaginationProps {
  /** Текущая страница */
  page: number;
  /** Всего страниц */
  totalPages: number;
  /** Всего элементов */
  totalItems: number;
  /** Элементов на текущей странице */
  itemsOnPage: number;
  /** Обработчик смены страницы */
  onPageChange: (page: number) => void;
  /** Размер */
  size?: 'sm' | 'md';
}

function Pagination({
  page,
  totalPages,
  totalItems,
  itemsOnPage,
  onPageChange,
  size = 'md',
}: PaginationProps) {
  const buttonClass = `
    px-3 py-1.5 rounded-lg border border-surface-300
    font-medium transition-all duration-200
    hover:border-gold hover:text-gold
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-surface-300 disabled:hover:text-text-primary
    ${size === 'sm' ? 'text-sm' : 'text-base'}
  `;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className={`text-text-secondary ${size === 'sm' ? 'text-sm' : ''}`}>
        Показано <span className="font-medium text-text-primary">{itemsOnPage}</span> из{' '}
        <span className="font-medium text-text-primary">{totalItems}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={buttonClass}
        >
          Назад
        </button>

        <span className={`px-3 ${size === 'sm' ? 'text-sm' : ''}`}>
          <span className="font-medium text-text-primary">{page}</span>
          <span className="text-text-muted"> / {totalPages}</span>
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={buttonClass}
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}

export { Table, Pagination };
