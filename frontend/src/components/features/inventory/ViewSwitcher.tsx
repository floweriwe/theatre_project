/**
 * ViewSwitcher - компонент переключения режимов отображения инвентаря.
 *
 * Поддерживает:
 * - Grid (карточки)
 * - List (компактный список)
 * - Table (таблица с сортировкой)
 * - Gallery (фокус на изображениях)
 */
import { LayoutGrid, List, Table2, GalleryHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list' | 'table' | 'gallery';

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
  /** Скрыть определённые режимы */
  hideModes?: ViewMode[];
}

interface ViewOption {
  mode: ViewMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tooltip: string;
}

const viewOptions: ViewOption[] = [
  {
    mode: 'grid',
    icon: LayoutGrid,
    label: 'Сетка',
    tooltip: 'Карточки в сетке',
  },
  {
    mode: 'list',
    icon: List,
    label: 'Список',
    tooltip: 'Компактный список',
  },
  {
    mode: 'table',
    icon: Table2,
    label: 'Таблица',
    tooltip: 'Таблица с сортировкой',
  },
  {
    mode: 'gallery',
    icon: GalleryHorizontal,
    label: 'Галерея',
    tooltip: 'Фокус на изображениях',
  },
];

export function ViewSwitcher({
  value,
  onChange,
  className,
  hideModes = [],
}: ViewSwitcherProps) {
  const visibleOptions = viewOptions.filter(
    (opt) => !hideModes.includes(opt.mode)
  );

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-[#1A2332] rounded-lg border border-[#334155]',
        className
      )}
      role="group"
      aria-label="Выберите режим отображения"
    >
      {visibleOptions.map(({ mode, icon: Icon, label, tooltip }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          title={tooltip}
          aria-label={label}
          aria-pressed={value === mode}
          className={cn(
            'p-2 rounded-md transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:ring-offset-1 focus:ring-offset-[#1A2332]',
            value === mode
              ? 'bg-[#D4A574] text-[#0F1419]'
              : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#243044]'
          )}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}

/**
 * Hook для управления состоянием view mode с localStorage.
 */
import { useState, useEffect } from 'react';

const VIEW_MODE_STORAGE_KEY = 'inventory-view-mode';

export function useViewMode(defaultMode: ViewMode = 'grid') {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return defaultMode;
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored && ['grid', 'list', 'table', 'gallery'].includes(stored)) {
      return stored as ViewMode;
    }
    return defaultMode;
  });

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  return [viewMode, setViewMode] as const;
}

export default ViewSwitcher;
