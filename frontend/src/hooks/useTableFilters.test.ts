/**
 * Tests for useTableFilters hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableFilters } from './useTableFilters';
import type { FilterChip, FilterPreset } from '@/components/ui/FilterBar';

describe('useTableFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should initialize with empty filters', () => {
      const { result } = renderHook(() => useTableFilters());
      expect(result.current.filters).toEqual([]);
    });

    it('should initialize with empty search query', () => {
      const { result } = renderHook(() => useTableFilters());
      expect(result.current.searchQuery).toBe('');
    });

    it('should initialize with empty sort config', () => {
      const { result } = renderHook(() => useTableFilters());
      expect(result.current.sortConfig).toEqual([]);
    });

    it('should accept initial filters', () => {
      const initialFilters: FilterChip[] = [
        { id: '1', label: 'Status', value: 'active', field: 'status' },
      ];
      const { result } = renderHook(() =>
        useTableFilters({ initialFilters })
      );
      expect(result.current.filters).toEqual(initialFilters);
    });

    it('should accept initial search query', () => {
      const { result } = renderHook(() =>
        useTableFilters({ initialSearch: 'test' })
      );
      expect(result.current.searchQuery).toBe('test');
    });

    it('should accept initial sort config', () => {
      const { result } = renderHook(() =>
        useTableFilters({ initialSort: { field: 'name', direction: 'asc' } })
      );
      expect(result.current.sortConfig).toEqual([{ field: 'name', direction: 'asc' }]);
    });
  });

  describe('filter management', () => {
    it('should add a filter', () => {
      const { result } = renderHook(() => useTableFilters());
      const filter: FilterChip = {
        id: '1',
        label: 'Category',
        value: 'props',
        field: 'category',
      };

      act(() => {
        result.current.addFilter(filter);
      });

      expect(result.current.filters).toContainEqual(filter);
    });

    it('should replace filter with same field', () => {
      const { result } = renderHook(() => useTableFilters());
      const filter1: FilterChip = {
        id: '1',
        label: 'Status',
        value: 'active',
        field: 'status',
      };
      const filter2: FilterChip = {
        id: '2',
        label: 'Status',
        value: 'inactive',
        field: 'status',
      };

      act(() => {
        result.current.addFilter(filter1);
        result.current.addFilter(filter2);
      });

      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filters[0].value).toBe('inactive');
    });

    it('should remove a filter', () => {
      const filter: FilterChip = {
        id: '1',
        label: 'Status',
        value: 'active',
        field: 'status',
      };
      const { result } = renderHook(() =>
        useTableFilters({ initialFilters: [filter] })
      );

      act(() => {
        result.current.removeFilter('1');
      });

      expect(result.current.filters).toHaveLength(0);
    });

    it('should update a filter', () => {
      const filter: FilterChip = {
        id: '1',
        label: 'Status',
        value: 'active',
        field: 'status',
      };
      const { result } = renderHook(() =>
        useTableFilters({ initialFilters: [filter] })
      );

      act(() => {
        result.current.updateFilter('1', { value: 'inactive' });
      });

      expect(result.current.filters[0].value).toBe('inactive');
    });

    it('should clear all filters', () => {
      const filters: FilterChip[] = [
        { id: '1', label: 'Status', value: 'active', field: 'status' },
        { id: '2', label: 'Category', value: 'props', field: 'category' },
      ];
      const { result } = renderHook(() =>
        useTableFilters({ initialFilters: filters })
      );

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toHaveLength(0);
    });
  });

  describe('search query', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useTableFilters());

      act(() => {
        result.current.setSearchQuery('test search');
      });

      expect(result.current.searchQuery).toBe('test search');
    });
  });

  describe('sorting', () => {
    it('should toggle sort ascending', () => {
      const { result } = renderHook(() => useTableFilters());

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.sortConfig).toEqual([{ field: 'name', direction: 'asc' }]);
    });

    it('should toggle from ascending to descending', () => {
      const { result } = renderHook(() =>
        useTableFilters({ initialSort: { field: 'name', direction: 'asc' } })
      );

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.sortConfig).toEqual([{ field: 'name', direction: 'desc' }]);
    });

    it('should remove sort when toggling from descending', () => {
      const { result } = renderHook(() =>
        useTableFilters({ initialSort: { field: 'name', direction: 'desc' } })
      );

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.sortConfig).toHaveLength(0);
    });

    it('should support multi-column sort when enabled', () => {
      const { result } = renderHook(() =>
        useTableFilters({ multiSort: true })
      );

      act(() => {
        result.current.toggleSort('name');
        result.current.toggleSort('date');
      });

      expect(result.current.sortConfig).toHaveLength(2);
      expect(result.current.sortConfig[0].field).toBe('name');
      expect(result.current.sortConfig[1].field).toBe('date');
    });

    it('should clear sort', () => {
      const { result } = renderHook(() =>
        useTableFilters({ initialSort: { field: 'name', direction: 'asc' } })
      );

      act(() => {
        result.current.clearSort();
      });

      expect(result.current.sortConfig).toHaveLength(0);
    });
  });

  describe('presets', () => {
    it('should save preset', () => {
      const filters: FilterChip[] = [
        { id: '1', label: 'Status', value: 'active', field: 'status' },
      ];
      const { result } = renderHook(() =>
        useTableFilters({ initialFilters: filters, storageKey: 'test' })
      );

      act(() => {
        result.current.savePreset('My Preset');
      });

      expect(result.current.presets).toHaveLength(1);
      expect(result.current.presets[0].name).toBe('My Preset');
      expect(result.current.presets[0].filters).toEqual(filters);
    });

    it('should load preset', () => {
      const preset: FilterPreset = {
        id: 'preset_1',
        name: 'Test Preset',
        filters: [{ id: '1', label: 'Status', value: 'active', field: 'status' }],
      };
      const { result } = renderHook(() => useTableFilters());

      act(() => {
        result.current.loadPreset(preset);
      });

      expect(result.current.filters).toEqual(preset.filters);
    });

    it('should delete preset', () => {
      const { result } = renderHook(() =>
        useTableFilters({
          initialFilters: [{ id: '1', label: 'Status', value: 'active', field: 'status' }],
          storageKey: 'test',
        })
      );

      act(() => {
        result.current.savePreset('To Delete');
      });

      const presetId = result.current.presets[0].id;

      act(() => {
        result.current.deletePreset(presetId);
      });

      expect(result.current.presets).toHaveLength(0);
    });
  });

  describe('utilities', () => {
    it('should report hasActiveFilters correctly', () => {
      const { result } = renderHook(() => useTableFilters());

      expect(result.current.hasActiveFilters).toBe(false);

      act(() => {
        result.current.addFilter({ id: '1', label: 'Status', value: 'active', field: 'status' });
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should report hasActiveFilters with search query', () => {
      const { result } = renderHook(() => useTableFilters());

      act(() => {
        result.current.setSearchQuery('test');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should report correct filter count', () => {
      const { result } = renderHook(() => useTableFilters());

      expect(result.current.filterCount).toBe(0);

      act(() => {
        result.current.addFilter({ id: '1', label: 'Status', value: 'active', field: 'status' });
        result.current.addFilter({ id: '2', label: 'Category', value: 'props', field: 'category' });
      });

      expect(result.current.filterCount).toBe(2);
    });

    it('should reset to initial state', () => {
      const initialFilters: FilterChip[] = [
        { id: '1', label: 'Status', value: 'active', field: 'status' },
      ];
      const { result } = renderHook(() =>
        useTableFilters({
          initialFilters,
          initialSearch: 'initial',
          initialSort: { field: 'name', direction: 'asc' },
        })
      );

      act(() => {
        result.current.addFilter({ id: '2', label: 'Category', value: 'props', field: 'category' });
        result.current.setSearchQuery('changed');
        result.current.toggleSort('date');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.searchQuery).toBe('initial');
      expect(result.current.sortConfig).toEqual([{ field: 'name', direction: 'asc' }]);
    });
  });
});
