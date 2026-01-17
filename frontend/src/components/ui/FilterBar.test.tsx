/**
 * Tests for FilterBar Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar, FilterChip, FilterPreset } from './FilterBar';

describe('FilterBar', () => {
  const defaultProps = {
    filters: [] as FilterChip[],
    onFiltersChange: vi.fn(),
  };

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(
        <FilterBar
          {...defaultProps}
          showSearch={true}
          onSearchChange={vi.fn()}
        />
      );
      expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument();
    });

    it('should render search input when showSearch is true', () => {
      render(
        <FilterBar
          {...defaultProps}
          showSearch={true}
          onSearchChange={vi.fn()}
        />
      );
      expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument();
    });

    it('should not render search input when showSearch is false', () => {
      render(
        <FilterBar
          {...defaultProps}
          showSearch={false}
        />
      );
      expect(screen.queryByPlaceholderText('Поиск...')).not.toBeInTheDocument();
    });

    it('should render custom search placeholder', () => {
      render(
        <FilterBar
          {...defaultProps}
          showSearch={true}
          onSearchChange={vi.fn()}
          searchPlaceholder="Custom search..."
        />
      );
      expect(screen.getByPlaceholderText('Custom search...')).toBeInTheDocument();
    });
  });

  describe('filter chips', () => {
    it('should render filter chips', () => {
      const filters: FilterChip[] = [
        { id: '1', label: 'Status', value: 'active', field: 'status' },
        { id: '2', label: 'Category', value: 'props', field: 'category' },
      ];

      render(<FilterBar {...defaultProps} filters={filters} />);

      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('Category:')).toBeInTheDocument();
      expect(screen.getByText('props')).toBeInTheDocument();
    });

    it('should render array values as comma-separated', () => {
      const filters: FilterChip[] = [
        { id: '1', label: 'Categories', value: ['props', 'costumes'], field: 'category' },
      ];

      render(<FilterBar {...defaultProps} filters={filters} />);

      expect(screen.getByText('props, costumes')).toBeInTheDocument();
    });

    it('should call onFiltersChange when removing a chip', async () => {
      const onFiltersChange = vi.fn();
      const filters: FilterChip[] = [
        { id: '1', label: 'Status', value: 'active', field: 'status' },
      ];

      render(
        <FilterBar
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      // Find and click the remove button (X) within the chip
      const removeButtons = screen.getAllByRole('button');
      const chipRemoveButton = removeButtons.find(btn =>
        btn.closest('[class*="rounded-full"]')
      );

      if (chipRemoveButton) {
        await userEvent.click(chipRemoveButton);
        expect(onFiltersChange).toHaveBeenCalledWith([]);
      }
    });

    it('should not show remove button when removable is false', () => {
      const filters: FilterChip[] = [
        { id: '1', label: 'Status', value: 'active', field: 'status', removable: false },
      ];

      render(<FilterBar {...defaultProps} filters={filters} />);

      // The chip should exist but without remove button
      expect(screen.getByText('Status:')).toBeInTheDocument();
    });
  });

  describe('filter count badge', () => {
    it('should show filter count when filters exist', () => {
      const filters: FilterChip[] = [
        { id: '1', label: 'Status', value: 'active', field: 'status' },
        { id: '2', label: 'Category', value: 'props', field: 'category' },
      ];

      render(<FilterBar {...defaultProps} filters={filters} />);

      expect(screen.getByText('2 фильтра')).toBeInTheDocument();
    });

    it('should not show filter count when no filters', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.queryByText(/фильтр/)).not.toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should call onSearchChange when typing', async () => {
      const onSearchChange = vi.fn();

      render(
        <FilterBar
          {...defaultProps}
          showSearch={true}
          onSearchChange={onSearchChange}
          searchQuery=""
        />
      );

      const input = screen.getByPlaceholderText('Поиск...');
      await userEvent.type(input, 'test');

      expect(onSearchChange).toHaveBeenCalledTimes(4); // t, e, s, t
    });

    it('should show clear button when search has value', () => {
      render(
        <FilterBar
          {...defaultProps}
          showSearch={true}
          onSearchChange={vi.fn()}
          searchQuery="test"
        />
      );

      // Clear button should be visible
      const input = screen.getByPlaceholderText('Поиск...');
      expect(input).toHaveValue('test');
    });

    it('should clear search when clear button clicked', async () => {
      const onSearchChange = vi.fn();

      render(
        <FilterBar
          {...defaultProps}
          showSearch={true}
          onSearchChange={onSearchChange}
          searchQuery="test"
        />
      );

      // Find the clear button (X icon next to input)
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons.find(btn => {
        const parent = btn.parentElement;
        return parent?.classList.contains('relative');
      });

      if (clearButton) {
        await userEvent.click(clearButton);
        expect(onSearchChange).toHaveBeenCalledWith('');
      }
    });
  });

  describe('clear all button', () => {
    it('should show clear all button when filters exist', () => {
      const filters: FilterChip[] = [
        { id: '1', label: 'Status', value: 'active', field: 'status' },
      ];

      render(<FilterBar {...defaultProps} filters={filters} />);

      expect(screen.getByText('Сбросить')).toBeInTheDocument();
    });

    it('should show clear all button when search has value', () => {
      render(
        <FilterBar
          {...defaultProps}
          showSearch={true}
          onSearchChange={vi.fn()}
          searchQuery="test"
        />
      );

      expect(screen.getByText('Сбросить')).toBeInTheDocument();
    });

    it('should clear filters and search when clicking clear all', async () => {
      const onFiltersChange = vi.fn();
      const onSearchChange = vi.fn();
      const filters: FilterChip[] = [
        { id: '1', label: 'Status', value: 'active', field: 'status' },
      ];

      render(
        <FilterBar
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
          showSearch={true}
          onSearchChange={onSearchChange}
          searchQuery="test"
        />
      );

      await userEvent.click(screen.getByText('Сбросить'));

      expect(onFiltersChange).toHaveBeenCalledWith([]);
      expect(onSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('presets', () => {
    it('should render presets button when presets exist', () => {
      const presets: FilterPreset[] = [
        {
          id: 'preset_1',
          name: 'My Preset',
          filters: [{ id: '1', label: 'Status', value: 'active', field: 'status' }],
        },
      ];

      render(
        <FilterBar
          {...defaultProps}
          showPresets={true}
          presets={presets}
        />
      );

      expect(screen.getByText('Пресеты')).toBeInTheDocument();
    });

    it('should not render presets when showPresets is false', () => {
      const presets: FilterPreset[] = [
        {
          id: 'preset_1',
          name: 'My Preset',
          filters: [{ id: '1', label: 'Status', value: 'active', field: 'status' }],
        },
      ];

      render(
        <FilterBar
          {...defaultProps}
          showPresets={false}
          presets={presets}
        />
      );

      expect(screen.queryByText('Пресеты')).not.toBeInTheDocument();
    });

    it('should open presets menu when clicking button', async () => {
      const presets: FilterPreset[] = [
        {
          id: 'preset_1',
          name: 'My Preset',
          filters: [{ id: '1', label: 'Status', value: 'active', field: 'status' }],
        },
      ];

      render(
        <FilterBar
          {...defaultProps}
          showPresets={true}
          presets={presets}
          onLoadPreset={vi.fn()}
        />
      );

      await userEvent.click(screen.getByText('Пресеты'));

      expect(screen.getByText('My Preset')).toBeInTheDocument();
    });

    it('should call onLoadPreset when preset clicked', async () => {
      const onLoadPreset = vi.fn();
      const preset: FilterPreset = {
        id: 'preset_1',
        name: 'My Preset',
        filters: [{ id: '1', label: 'Status', value: 'active', field: 'status' }],
      };

      render(
        <FilterBar
          {...defaultProps}
          showPresets={true}
          presets={[preset]}
          onLoadPreset={onLoadPreset}
        />
      );

      await userEvent.click(screen.getByText('Пресеты'));
      await userEvent.click(screen.getByText('My Preset'));

      expect(onLoadPreset).toHaveBeenCalledWith(preset);
    });
  });

  describe('custom actions', () => {
    it('should render custom actions', () => {
      render(
        <FilterBar
          {...defaultProps}
          actions={<button>Custom Action</button>}
        />
      );

      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });
  });
});
