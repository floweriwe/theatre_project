/**
 * Stack — Flexible spacing component
 * Modern Theatre Elegance v3
 *
 * Layout primitive for:
 * - Vertical stacking (default)
 * - Horizontal stacking
 * - Responsive direction changes
 * - Consistent spacing
 */

import { cn } from '@/utils/helpers';
import type { ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

type SpacingSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type Direction = 'vertical' | 'horizontal';
type Alignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

interface StackProps {
  children: ReactNode;
  /** Stack direction */
  direction?: Direction;
  /** Responsive direction: vertical on mobile, horizontal on larger screens */
  responsive?: boolean;
  /** Gap between items */
  gap?: SpacingSize;
  /** Cross-axis alignment */
  align?: Alignment;
  /** Main-axis justification */
  justify?: Justify;
  /** Allow wrapping */
  wrap?: boolean;
  /** Take full width */
  fullWidth?: boolean;
  /** Additional class names */
  className?: string;
  /** HTML element to render */
  as?: 'div' | 'section' | 'article' | 'nav' | 'ul' | 'ol';
}

// =============================================================================
// Mappings
// =============================================================================

const gapClasses: Record<SpacingSize, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
};

const alignClasses: Record<Alignment, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyClasses: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

// =============================================================================
// Component
// =============================================================================

export function Stack({
  children,
  direction = 'vertical',
  responsive = false,
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  fullWidth = false,
  className,
  as: Component = 'div',
}: StackProps) {
  const isHorizontal = direction === 'horizontal';

  return (
    <Component
      className={cn(
        'flex',
        responsive
          ? 'flex-col sm:flex-row'
          : isHorizontal
            ? 'flex-row'
            : 'flex-col',
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        fullWidth && 'w-full',
        className
      )}
    >
      {children}
    </Component>
  );
}

// =============================================================================
// Convenience Components
// =============================================================================

export function HStack(props: Omit<StackProps, 'direction'>) {
  return <Stack {...props} direction="horizontal" />;
}

export function VStack(props: Omit<StackProps, 'direction'>) {
  return <Stack {...props} direction="vertical" />;
}

export default Stack;
