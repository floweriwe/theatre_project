/**
 * BreakpointIndicator — Development helper
 * Modern Theatre Elegance v3
 *
 * Shows current responsive breakpoint.
 * Only visible in development mode.
 */

import { cn } from '@/utils/helpers';

interface BreakpointIndicatorProps {
  /** Show in all environments (default: dev only) */
  alwaysShow?: boolean;
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
};

export function BreakpointIndicator({
  alwaysShow = false,
  position = 'bottom-right',
}: BreakpointIndicatorProps) {
  // Only show in development unless alwaysShow is true
  if (!alwaysShow && import.meta.env.PROD) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-[9999] pointer-events-none',
        positionClasses[position]
      )}
    >
      <div className={cn(
        'px-2 py-1 rounded-md text-xs font-mono font-medium',
        'bg-black/80 text-white backdrop-blur-sm',
        'border border-white/20'
      )}>
        {/* XS (< 640px) */}
        <span className="sm:hidden">XS</span>
        {/* SM (640px - 768px) */}
        <span className="hidden sm:inline md:hidden">SM</span>
        {/* MD (768px - 1024px) */}
        <span className="hidden md:inline lg:hidden">MD</span>
        {/* LG (1024px - 1280px) */}
        <span className="hidden lg:inline xl:hidden">LG</span>
        {/* XL (1280px - 1536px) */}
        <span className="hidden xl:inline 2xl:hidden">XL</span>
        {/* 2XL (>= 1536px) */}
        <span className="hidden 2xl:inline">2XL</span>
      </div>
    </div>
  );
}

export default BreakpointIndicator;
