/**
 * useTableFilters — Hook for managing table filters and presets
 *
 * Provides:
 * - Filter state management
 * - Search query handling
 * - Sort configuration
 * - Preset save/load with localStorage persistence
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { FilterChip, FilterPreset } from '@/components/ui/FilterBar';

// =============================================================================
// Types
// =============================================================================

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface UseTableFiltersOptions {
  /** Storage key for presets (enables localStorage persistence) */
  storageKey?: string;
  /** Initial filters */
  initialFilters?: FilterChip[];
  /** Initial search query */
  initialSearch?: string;
  /** Initial sort config */
  initialSort?: SortConfig;
  /** Multi-column sort support */
  multiSort?: boolean;
}

export interface UseTableFiltersReturn {
  // Filter state
  filters: FilterChip[];
  setFilters: (filters: FilterChip[]) => void;
  addFilter: (filter: FilterChip) => void;
  removeFilter: (filterId: string) => void;
  updateFilter: (filterId: string, update: Partial<FilterChip>) => void;
  clearFilters: () => void;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Sort state
  sortConfig: SortConfig[];
  setSortConfig: (config: SortConfig[]) => void;
  toggleSort: (field: string) => void;
  clearSort: () => void;

  // Preset management
  presets: FilterPreset[];
  savePreset: (name: string) => void;
  loadPreset: (preset: FilterPreset) => void;
  deletePreset: (presetId: string) => void;

  // Utilities
  hasActiveFilters: boolean;
  filterCount: number;
  reset: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useTableFilters(options: UseTableFiltersOptions = {}): UseTableFiltersReturn {
  const {
    storageKey,
    initialFilters = [],
    initialSearch = '',
    initialSort,
    multiSort = false,
  } = options;

  // State
  const [filters, setFilters] = useState<FilterChip[]>(initialFilters);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortConfig, setSortConfig] = useState<SortConfig[]>(
    initialSort ? [initialSort] : []
  );
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  // Load presets from localStorage
  useEffect(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`filters_presets_${storageKey}`);
        if (saved) {
          setPresets(JSON.parse(saved));
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [storageKey]);

  // Save presets to localStorage
  const persistPresets = useCallback((newPresets: FilterPreset[]) => {
    setPresets(newPresets);
    if (storageKey) {
      localStorage.setItem(`filters_presets_${storageKey}`, JSON.stringify(newPresets));
    }
  }, [storageKey]);

  // Add a filter
  const addFilter = useCallback((filter: FilterChip) => {
    setFilters(prev => {
      // Replace if same field exists
      const existing = prev.findIndex(f => f.field === filter.field);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = filter;
        return updated;
      }
      return [...prev, filter];
    });
  }, []);

  // Remove a filter
  const removeFilter = useCallback((filterId: string) => {
    setFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  // Update a filter
  const updateFilter = useCallback((filterId: string, update: Partial<FilterChip>) => {
    setFilters(prev => prev.map(f =>
      f.id === filterId ? { ...f, ...update } : f
    ));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  // Toggle sort on a field
  const toggleSort = useCallback((field: string) => {
    setSortConfig(prev => {
      const existingIndex = prev.findIndex(s => s.field === field);

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        if (existing.direction === 'asc') {
          // asc -> desc
          const updated = [...prev];
          updated[existingIndex] = { ...existing, direction: 'desc' };
          return updated;
        } else {
          // desc -> remove
          return prev.filter((_, i) => i !== existingIndex);
        }
      }

      // Add new sort
      const newSort: SortConfig = { field, direction: 'asc' };
      if (multiSort) {
        return [...prev, newSort];
      }
      return [newSort];
    });
  }, [multiSort]);

  // Clear sort
  const clearSort = useCallback(() => {
    setSortConfig([]);
  }, []);

  // Save current filters as preset
  const savePreset = useCallback((name: string) => {
    const newPreset: FilterPreset = {
      id: `preset_${Date.now()}`,
      name,
      filters: [...filters],
    };
    persistPresets([...presets, newPreset]);
  }, [filters, presets, persistPresets]);

  // Load a preset
  const loadPreset = useCallback((preset: FilterPreset) => {
    setFilters([...preset.filters]);
  }, []);

  // Delete a preset
  const deletePreset = useCallback((presetId: string) => {
    persistPresets(presets.filter(p => p.id !== presetId));
  }, [presets, persistPresets]);

  // Reset everything
  const reset = useCallback(() => {
    setFilters(initialFilters);
    setSearchQuery(initialSearch);
    setSortConfig(initialSort ? [initialSort] : []);
  }, [initialFilters, initialSearch, initialSort]);

  // Computed values
  const hasActiveFilters = useMemo(() =>
    filters.length > 0 || searchQuery.length > 0,
    [filters.length, searchQuery.length]
  );

  const filterCount = useMemo(() => filters.length, [filters.length]);

  return {
    // Filter state
    filters,
    setFilters,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,

    // Search state
    searchQuery,
    setSearchQuery,

    // Sort state
    sortConfig,
    setSortConfig,
    toggleSort,
    clearSort,

    // Preset management
    presets,
    savePreset,
    loadPreset,
    deletePreset,

    // Utilities
    hasActiveFilters,
    filterCount,
    reset,
  };
}

export default useTableFilters;
