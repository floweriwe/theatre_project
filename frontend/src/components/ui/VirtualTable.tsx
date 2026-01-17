/**
 * VirtualTable — Виртуализированная таблица для больших данных
 * Modern Theatre Elegance v3
 *
 * Поддерживает:
 * - Виртуализация для 1000+ строк (60fps)
 * - Ресайз колонок
 * - Sticky header и первая колонка
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronUp, ChevronDown, ChevronsUpDown, GripVertical } from 'lucide-react';
import { cn } from '@/utils/helpers';

// =============================================================================
// Types
// =============================================================================

export interface VirtualColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sticky?: boolean;
  resizable?: boolean;
  className?: string;
}

export interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualColumn<T>[];
  rowKey: (item: T, index: number) => string | number;
  rowHeight?: number;
  maxHeight?: number;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  hoverable?: boolean;
  onRowClick?: (item: T, index: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyContent?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

function VirtualTable<T>({
  data,
  columns,
  rowKey,
  rowHeight = 52,
  maxHeight = 600,
  stickyHeader = true,
  stickyFirstColumn = false,
  hoverable = true,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  emptyContent,
  loading = false,
  className = '',
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    columns.forEach((col) => {
      widths[col.key] = col.width || 150;
    });
    return widths;
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Column resize handlers
  const handleResizeStart = useCallback((columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);

    const startX = e.clientX;
    const startWidth = columnWidths[columnKey];
    const column = columns.find((c) => c.key === columnKey);
    const minWidth = column?.minWidth || 50;
    const maxWidth = column?.maxWidth || 500;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + diff));
      setColumnWidths((prev) => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths, columns]);

  // Sort icon
  const renderSortIcon = useCallback((column: VirtualColumn<T>) => {
    if (!column.sortable) return null;

    const isActive = sortBy === column.key;
    const iconClass = cn(
      'w-4 h-4 transition-colors',
      isActive ? 'text-gold-300' : 'text-text-muted'
    );

    if (!isActive) return <ChevronsUpDown className={iconClass} />;
    return sortOrder === 'asc'
      ? <ChevronUp className={iconClass} />
      : <ChevronDown className={iconClass} />;
  }, [sortBy, sortOrder]);

  // Calculate total width
  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + (columnWidths[col.key] || 150), 0);
  }, [columns, columnWidths]);

  // Get sticky column offset
  const getStickyOffset = useCallback((columnIndex: number) => {
    if (!stickyFirstColumn || columnIndex !== 0) return undefined;
    return 0;
  }, [stickyFirstColumn]);

  if (loading) {
    return (
      <div className={cn('bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden', className)}>
        <div className="animate-pulse">
          <div className="h-12 bg-bg-surface-hover border-b border-border-subtle" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[52px] border-b border-border-subtle flex items-center px-4">
              <div className="h-4 bg-bg-surface-hover rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden', className)}>
        <div className="h-12 bg-bg-surface-hover border-b border-border-subtle" />
        <div className="p-8 text-center text-text-muted">
          {emptyContent || 'Нет данных для отображения'}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden', className)}>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <div style={{ width: totalWidth, minWidth: '100%' }}>
          {/* Header */}
          <div
            className={cn(
              'flex bg-bg-surface-hover border-b border-border-subtle',
              stickyHeader && 'sticky top-0 z-20'
            )}
          >
            {columns.map((column, colIndex) => (
              <div
                key={column.key}
                className={cn(
                  'relative flex items-center px-4 py-3',
                  'font-semibold text-sm text-text-secondary',
                  'border-r border-border-subtle last:border-r-0',
                  column.sortable && 'cursor-pointer hover:bg-bg-overlay transition-colors',
                  column.align === 'center' && 'justify-center',
                  column.align === 'right' && 'justify-end',
                  stickyFirstColumn && colIndex === 0 && 'sticky left-0 z-10 bg-bg-surface-hover',
                  column.className
                )}
                style={{
                  width: columnWidths[column.key],
                  minWidth: column.minWidth || 50,
                  left: getStickyOffset(colIndex),
                }}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <span className="truncate">{column.header}</span>
                {renderSortIcon(column)}

                {/* Resize handle */}
                {column.resizable !== false && (
                  <div
                    className={cn(
                      'absolute right-0 top-0 bottom-0 w-4 cursor-col-resize',
                      'flex items-center justify-center',
                      'opacity-0 hover:opacity-100 transition-opacity',
                      resizingColumn === column.key && 'opacity-100'
                    )}
                    onMouseDown={(e) => handleResizeStart(column.key, e)}
                  >
                    <GripVertical className="w-3 h-3 text-text-muted" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Virtual rows */}
          <div
            style={{
              height: totalSize,
              position: 'relative',
            }}
          >
            {virtualRows.map((virtualRow) => {
              const item = data[virtualRow.index];
              return (
                <div
                  key={rowKey(item, virtualRow.index)}
                  className={cn(
                    'absolute top-0 left-0 w-full flex',
                    'border-b border-border-subtle',
                    hoverable && 'hover:bg-bg-surface-hover transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  style={{
                    height: rowHeight,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => onRowClick?.(item, virtualRow.index)}
                >
                  {columns.map((column, colIndex) => (
                    <div
                      key={column.key}
                      className={cn(
                        'flex items-center px-4',
                        'text-sm text-text-primary',
                        'border-r border-border-subtle last:border-r-0',
                        column.align === 'center' && 'justify-center',
                        column.align === 'right' && 'justify-end',
                        stickyFirstColumn && colIndex === 0 && 'sticky left-0 z-10 bg-bg-surface',
                        column.className
                      )}
                      style={{
                        width: columnWidths[column.key],
                        minWidth: column.minWidth || 50,
                        left: getStickyOffset(colIndex),
                      }}
                    >
                      <span className="truncate">
                        {column.render
                          ? column.render(item, virtualRow.index)
                          : (item as Record<string, unknown>)[column.key]?.toString() || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { VirtualTable };
export default VirtualTable;
