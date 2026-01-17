/**
 * SearchableSelect — Выпадающий список с поиском и группировкой
 * Modern Theatre Elegance v3
 *
 * Поддерживает:
 * - Поиск по опциям
 * - Группировка опций
 * - Keyboard navigation
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/utils/helpers';

// =============================================================================
// Types
// =============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SearchableSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SearchableSelect({
  value,
  onChange,
  options = [],
  groups = [],
  placeholder = 'Выберите...',
  searchPlaceholder = 'Поиск...',
  label,
  error,
  hint,
  disabled = false,
  clearable = false,
  size = 'md',
  fullWidth = true,
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Combine options from both sources
  const allOptions = useMemo(() => {
    if (groups.length > 0) {
      return groups.flatMap((g) => g.options);
    }
    return options;
  }, [options, groups]);

  // Filter options by search
  const filteredOptions = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return allOptions;
    return allOptions.filter((opt) =>
      opt.label.toLowerCase().includes(searchLower) ||
      opt.value.toLowerCase().includes(searchLower)
    );
  }, [allOptions, search]);

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (groups.length === 0) return [];
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return groups;

    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(searchLower) ||
            opt.value.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, search]);

  // Find selected option
  const selectedOption = useMemo(() => {
    return allOptions.find((opt) => opt.value === value);
  }, [allOptions, value]);

  // Size styles
  const sizeStyles = {
    sm: 'h-8 text-sm px-3',
    md: 'h-10 text-sm px-4',
    lg: 'h-12 text-base px-4',
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

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            Math.min(prev + 1, filteredOptions.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearch('');
          break;
      }
    },
    [isOpen, filteredOptions, highlightedIndex]
  );

  // Select handler
  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearch('');
    },
    [onChange]
  );

  // Clear handler
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
    },
    [onChange]
  );

  // Render options
  const renderOptions = () => {
    if (filteredGroups.length > 0) {
      return filteredGroups.map((group) => (
        <div key={group.label}>
          <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider bg-bg-surface-hover">
            {group.label}
          </div>
          {group.options.map((opt) => {
            const globalIndex = filteredOptions.findIndex((o) => o.value === opt.value);
            return renderOption(opt, globalIndex);
          })}
        </div>
      ));
    }

    return filteredOptions.map((opt, idx) => renderOption(opt, idx));
  };

  const renderOption = (opt: SelectOption, index: number) => {
    const isSelected = opt.value === value;
    const isHighlighted = index === highlightedIndex;

    return (
      <div
        key={opt.value}
        className={cn(
          'flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors',
          isHighlighted && 'bg-bg-surface-hover',
          isSelected && 'text-gold-300',
          opt.disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !opt.disabled && handleSelect(opt.value)}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        <span className="truncate">{opt.label}</span>
        {isSelected && <Check className="w-4 h-4 text-gold-300 flex-shrink-0" />}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(fullWidth ? 'w-full' : 'inline-block', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between',
            'bg-bg-surface border border-border-default rounded-lg',
            'text-left transition-all duration-200',
            'hover:border-border-strong',
            'focus:outline-none focus:border-gold-300/50 focus:ring-2 focus:ring-gold-300/20',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            error && 'border-error/50 focus:border-error focus:ring-error/20',
            sizeStyles[size]
          )}
        >
          <span className={cn('truncate', !selectedOption && 'text-text-muted')}>
            {selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {clearable && value && (
              <span
                role="button"
                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                onClick={handleClear}
              >
                <X className="w-4 h-4 text-text-muted" />
              </span>
            )}
            <ChevronDown
              className={cn(
                'w-5 h-5 text-text-muted transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

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

            {/* Options list */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto py-1 scrollbar-thin"
            >
              {filteredOptions.length > 0 ? (
                renderOptions()
              ) : (
                <div className="px-4 py-3 text-sm text-text-muted text-center">
                  Ничего не найдено
                </div>
              )}
            </div>
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

export default SearchableSelect;
