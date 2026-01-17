/**
 * FilterBar — Панель фильтрации с чипами и пресетами
 * Modern Theatre Elegance v3
 *
 * Поддерживает:
 * - Активные фильтры как теги/chips
 * - Сохранение и загрузка пресетов
 * - Быстрая очистка всех фильтров
 * - Поиск по тексту
 */

import { useState, useCallback, useMemo } from 'react';
import { Search, X, Filter, ChevronDown, Save, Bookmark, Trash2 } from 'lucide-react';
import { cn } from '@/utils/helpers';

// =============================================================================
// Types
// =============================================================================

export interface FilterChip {
  id: string;
  label: string;
  value: string | string[];
  field: string;
  removable?: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterChip[];
}

export interface FilterBarProps {
  /** Active filter chips */
  filters: FilterChip[];
  /** Callback when filters change */
  onFiltersChange: (filters: FilterChip[]) => void;
  /** Search query */
  searchQuery?: string;
  /** Callback when search changes */
  onSearchChange?: (query: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Saved presets */
  presets?: FilterPreset[];
  /** Callback to save preset */
  onSavePreset?: (name: string, filters: FilterChip[]) => void;
  /** Callback to load preset */
  onLoadPreset?: (preset: FilterPreset) => void;
  /** Callback to delete preset */
  onDeletePreset?: (presetId: string) => void;
  /** Show search input */
  showSearch?: boolean;
  /** Show preset management */
  showPresets?: boolean;
  /** Additional actions slot */
  actions?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function FilterBar({
  filters,
  onFiltersChange,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Поиск...',
  presets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  showSearch = true,
  showPresets = true,
  actions,
  className,
}: FilterBarProps) {
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Count active filters
  const activeFilterCount = useMemo(() => filters.length, [filters]);

  // Remove a single filter
  const handleRemoveFilter = useCallback((filterId: string) => {
    onFiltersChange(filters.filter(f => f.id !== filterId));
  }, [filters, onFiltersChange]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    onFiltersChange([]);
    if (onSearchChange) {
      onSearchChange('');
    }
  }, [onFiltersChange, onSearchChange]);

  // Save current filters as preset
  const handleSavePreset = useCallback(() => {
    if (newPresetName.trim() && onSavePreset) {
      onSavePreset(newPresetName.trim(), filters);
      setNewPresetName('');
      setIsSaveDialogOpen(false);
    }
  }, [newPresetName, filters, onSavePreset]);

  // Load a preset
  const handleLoadPreset = useCallback((preset: FilterPreset) => {
    if (onLoadPreset) {
      onLoadPreset(preset);
    }
    setIsPresetMenuOpen(false);
  }, [onLoadPreset]);

  // Delete a preset
  const handleDeletePreset = useCallback((e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    if (onDeletePreset) {
      onDeletePreset(presetId);
    }
  }, [onDeletePreset]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        {showSearch && onSearchChange && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                'w-full pl-10 pr-4 py-2',
                'bg-bg-surface border border-border-default rounded-lg',
                'text-sm text-text-primary placeholder:text-text-muted',
                'focus:outline-none focus:border-gold-300/50 focus:ring-2 focus:ring-gold-300/20',
                'transition-all duration-200'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Filter Count Badge */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gold-300/10 text-gold-300 rounded-lg text-sm">
            <Filter className="w-4 h-4" />
            <span>{activeFilterCount} фильтр{activeFilterCount > 1 ? 'а' : ''}</span>
          </div>
        )}

        {/* Preset Menu */}
        {showPresets && (presets.length > 0 || onSavePreset) && (
          <div className="relative">
            <button
              onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
              className={cn(
                'flex items-center gap-2 px-3 py-2',
                'bg-bg-surface border border-border-default rounded-lg',
                'text-sm text-text-secondary hover:text-text-primary',
                'hover:border-border-strong transition-colors'
              )}
            >
              <Bookmark className="w-4 h-4" />
              <span>Пресеты</span>
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform',
                isPresetMenuOpen && 'rotate-180'
              )} />
            </button>

            {isPresetMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsPresetMenuOpen(false)}
                />
                <div className={cn(
                  'absolute right-0 top-full mt-2 w-64 z-50',
                  'bg-bg-overlay border border-border-default rounded-xl',
                  'shadow-2xl shadow-black/40 overflow-hidden',
                  'animate-fade-in'
                )}>
                  {/* Save Current */}
                  {onSavePreset && filters.length > 0 && (
                    <div className="p-2 border-b border-border-subtle">
                      {!isSaveDialogOpen ? (
                        <button
                          onClick={() => setIsSaveDialogOpen(true)}
                          className={cn(
                            'flex items-center gap-2 w-full px-3 py-2 rounded-lg',
                            'text-sm text-text-secondary hover:text-text-primary',
                            'hover:bg-bg-surface-hover transition-colors'
                          )}
                        >
                          <Save className="w-4 h-4" />
                          Сохранить текущие фильтры
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="Название пресета"
                            className={cn(
                              'flex-1 px-3 py-1.5',
                              'bg-bg-surface border border-border-default rounded-lg',
                              'text-sm text-text-primary placeholder:text-text-muted',
                              'focus:outline-none focus:border-gold-300/50'
                            )}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSavePreset();
                              if (e.key === 'Escape') setIsSaveDialogOpen(false);
                            }}
                          />
                          <button
                            onClick={handleSavePreset}
                            disabled={!newPresetName.trim()}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-sm font-medium',
                              'bg-gold-300 text-bg-primary',
                              'hover:bg-gold-200 transition-colors',
                              'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                          >
                            ОК
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preset List */}
                  {presets.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin">
                      {presets.map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => handleLoadPreset(preset)}
                          className={cn(
                            'flex items-center justify-between px-4 py-2.5',
                            'cursor-pointer hover:bg-bg-surface-hover transition-colors'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Bookmark className="w-4 h-4 text-gold-300 flex-shrink-0" />
                            <span className="text-sm text-text-primary truncate">
                              {preset.name}
                            </span>
                            <span className="text-xs text-text-muted">
                              ({preset.filters.length})
                            </span>
                          </div>
                          {onDeletePreset && (
                            <button
                              onClick={(e) => handleDeletePreset(e, preset.id)}
                              className="p-1 text-text-muted hover:text-error transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-text-muted text-sm">
                      Нет сохранённых пресетов
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Clear All Button */}
        {(activeFilterCount > 0 || searchQuery) && (
          <button
            onClick={handleClearAll}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2',
              'text-sm text-text-muted hover:text-text-primary',
              'hover:bg-white/5 rounded-lg transition-colors'
            )}
          >
            <X className="w-4 h-4" />
            Сбросить
          </button>
        )}

        {/* Additional Actions */}
        {actions && (
          <div className="ml-auto flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5',
                'bg-bg-surface border border-border-default rounded-full',
                'text-sm'
              )}
            >
              <span className="text-text-muted">{filter.label}:</span>
              <span className="text-text-primary font-medium">
                {Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
              </span>
              {filter.removable !== false && (
                <button
                  onClick={() => handleRemoveFilter(filter.id)}
                  className="ml-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
