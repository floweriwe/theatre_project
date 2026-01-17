/**
 * MultiSelect — Множественный выбор с тегами
 * Modern Theatre Elegance v3
 *
 * Поддерживает:
 * - Выбор нескольких опций
 * - Отображение выбранных как теги/chips
 * - Поиск по опциям
 * - Select All
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, ChevronDown, X, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/utils/helpers';

// =============================================================================
// Types
// =============================================================================

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  value: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  maxItems?: number;
  showSelectAll?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function MultiSelect({
  value = [],
  onChange,
  options = [],
  placeholder = 'Выберите...',
  searchPlaceholder = 'Поиск...',
  label,
  error,
  hint,
  disabled = false,
  maxItems,
  showSelectAll = true,
  size = 'md',
  fullWidth = true,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options by search
  const filteredOptions = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchLower) ||
      opt.value.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  // Selected options
  const selectedOptions = useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  // Check if all visible are selected
  const allSelected = useMemo(() => {
    const availableOptions = filteredOptions.filter((opt) => !opt.disabled);
    return availableOptions.length > 0 && availableOptions.every((opt) => value.includes(opt.value));
  }, [filteredOptions, value]);

  // Can add more
  const canAddMore = !maxItems || value.length < maxItems;

  // Size styles
  const sizeStyles = {
    sm: 'min-h-[32px] text-sm px-2 py-1',
    md: 'min-h-[40px] text-sm px-3 py-1.5',
    lg: 'min-h-[48px] text-base px-4 py-2',
  };

  const tagSizeStyles = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1',
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Toggle option
  const toggleOption = useCallback(
    (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else if (canAddMore) {
        onChange([...value, optionValue]);
      }
    },
    [value, onChange, canAddMore]
  );

  // Remove tag
  const removeTag = useCallback(
    (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter((v) => v !== optionValue));
    },
    [value, onChange]
  );

  // Select all
  const handleSelectAll = useCallback(() => {
    const availableOptions = filteredOptions.filter((opt) => !opt.disabled);
    if (allSelected) {
      // Deselect all filtered
      const filteredValues = availableOptions.map((opt) => opt.value);
      onChange(value.filter((v) => !filteredValues.includes(v)));
    } else {
      // Select all filtered (up to max)
      const newValues = new Set(value);
      for (const opt of availableOptions) {
        if (maxItems && newValues.size >= maxItems) break;
        newValues.add(opt.value);
      }
      onChange(Array.from(newValues));
    }
  }, [filteredOptions, allSelected, value, onChange, maxItems]);

  return (
    <div
      ref={containerRef}
      className={cn(fullWidth ? 'w-full' : 'inline-block', className)}
    >
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'flex flex-wrap items-center gap-1.5 cursor-pointer',
            'bg-bg-surface border border-border-default rounded-lg',
            'transition-all duration-200',
            'hover:border-border-strong',
            isOpen && 'border-gold-300/50 ring-2 ring-gold-300/20',
            disabled && 'opacity-60 cursor-not-allowed',
            error && 'border-error/50',
            sizeStyles[size]
          )}
        >
          {/* Selected tags */}
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className={cn(
                'inline-flex items-center gap-1',
                'bg-gold-300/10 text-gold-300 rounded',
                tagSizeStyles[size]
              )}
            >
              <span className="truncate max-w-[100px]">{opt.label}</span>
              <button
                type="button"
                onClick={(e) => removeTag(opt.value, e)}
                className="hover:bg-gold-300/20 rounded p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Placeholder */}
          {selectedOptions.length === 0 && (
            <span className="text-text-muted">{placeholder}</span>
          )}

          {/* Chevron */}
          <ChevronDown
            className={cn(
              'w-5 h-5 text-text-muted ml-auto transition-transform flex-shrink-0',
              isOpen && 'rotate-180'
            )}
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            className={cn(
              'absolute z-50 w-full mt-1',
              'bg-bg-overlay border border-border-default rounded-xl',
              'shadow-2xl shadow-black/40',
              'animate-fade-in'
            )}
          >
            {/* Search input */}
            <div className="p-2 border-b border-border-subtle">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={cn(
                    'w-full pl-9 pr-3 py-2',
                    'bg-bg-surface border border-border-default rounded-lg',
                    'text-sm text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:border-gold-300/50 focus:ring-2 focus:ring-gold-300/20'
                  )}
                />
              </div>
            </div>

            {/* Select All */}
            {showSelectAll && filteredOptions.length > 0 && (
              <div
                onClick={handleSelectAll}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 cursor-pointer',
                  'border-b border-border-subtle',
                  'hover:bg-bg-surface-hover transition-colors'
                )}
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-gold-300" />
                ) : (
                  <Square className="w-4 h-4 text-text-muted" />
                )}
                <span className="text-sm font-medium text-text-primary">
                  Выбрать все
                </span>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = value.includes(opt.value);
                  const isDisabled = opt.disabled || (!isSelected && !canAddMore);

                  return (
                    <div
                      key={opt.value}
                      onClick={() => !isDisabled && toggleOption(opt.value)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors',
                        'hover:bg-bg-surface-hover',
                        isSelected && 'bg-gold-300/5',
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-gold-300 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-text-muted flex-shrink-0" />
                      )}
                      <span className={cn('truncate text-sm', isSelected && 'text-gold-300')}>
                        {opt.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-sm text-text-muted text-center">
                  Ничего не найдено
                </div>
              )}
            </div>

            {/* Max items hint */}
            {maxItems && (
              <div className="px-4 py-2 border-t border-border-subtle text-xs text-text-muted">
                Выбрано {value.length} из {maxItems}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-error">{error}</p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="mt-2 text-xs text-text-muted">{hint}</p>
      )}
    </div>
  );
}

export default MultiSelect;
