/**
 * ResponsiveContainer — Responsive layout wrapper
 * Modern Theatre Elegance v3
 *
 * Provides consistent responsive behavior with:
 * - Max-width constraints
 * - Responsive padding
 * - Optional centering
 */

import { cn } from '@/utils/helpers';
import type { ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface ResponsiveContainerProps {
  children: ReactNode;
  /** Maximum width constraint */
  size?: ContainerSize;
  /** Add horizontal padding */
  padding?: boolean;
  /** Center the container */
  centered?: boolean;
  /** Additional class names */
  className?: string;
  /** HTML element to render */
  as?: 'div' | 'section' | 'article' | 'main';
}

// =============================================================================
// Size Mappings
// =============================================================================

const sizeClasses: Record<ContainerSize, string> = {
  sm: 'max-w-screen-sm',      // 640px
  md: 'max-w-screen-md',      // 768px
  lg: 'max-w-screen-lg',      // 1024px
  xl: 'max-w-screen-xl',      // 1280px
  '2xl': 'max-w-screen-2xl',  // 1536px
  full: 'max-w-full',
};

// =============================================================================
// Component
// =============================================================================

export function ResponsiveContainer({
  children,
  size = 'xl',
  padding = true,
  centered = true,
  className,
  as: Component = 'div',
}: ResponsiveContainerProps) {
  return (
    <Component
      className={cn(
        'w-full',
        sizeClasses[size],
        padding && 'px-4 sm:px-6 lg:px-8',
        centered && 'mx-auto',
        className
      )}
    >
      {children}
    </Component>
  );
}

export default ResponsiveContainer;
