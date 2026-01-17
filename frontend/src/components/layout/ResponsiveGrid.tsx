/**
 * ResponsiveGrid — Adaptive grid layout
 * Modern Theatre Elegance v3
 *
 * Flexible grid system with:
 * - Auto-fit columns with min-width
 * - Fixed column count options
 * - Responsive gap sizing
 */

import { cn } from '@/utils/helpers';
import type { ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

type GapSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Columns = 1 | 2 | 3 | 4 | 5 | 6 | 'auto';

interface ResponsiveGridProps {
  children: ReactNode;
  /**
   * Number of columns or 'auto' for auto-fit
   * - Number: fixed column count (responsive)
   * - 'auto': auto-fit with minChildWidth
   */
  columns?: Columns;
  /** Minimum child width for auto-fit mode */
  minChildWidth?: string;
  /** Gap between items */
  gap?: GapSize;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Mappings
// =============================================================================

const gapClasses: Record<GapSize, string> = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8',
  xl: 'gap-8 sm:gap-10',
};

const columnClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
};

// =============================================================================
// Component
// =============================================================================

export function ResponsiveGrid({
  children,
  columns = 'auto',
  minChildWidth = '280px',
  gap = 'md',
  className,
}: ResponsiveGridProps) {
  const isAutoFit = columns === 'auto';

  return (
    <div
      className={cn(
        'grid',
        gapClasses[gap],
        !isAutoFit && typeof columns === 'number' && columnClasses[columns],
        className
      )}
      style={isAutoFit ? {
        gridTemplateColumns: `repeat(auto-fit, minmax(${minChildWidth}, 1fr))`,
      } : undefined}
    >
      {children}
    </div>
  );
}

export default ResponsiveGrid;
