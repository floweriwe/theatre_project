/**
 * Skeleton Components — Modern Theatre Elegance v3
 *
 * Loading state components that mimic content layout.
 * Uses dark theme with subtle animation.
 */

import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

/**
 * Base Skeleton component for loading states.
 * Supports various shapes and sizes.
 *
 * @example
 * // Simple text skeleton
 * <Skeleton />
 *
 * @example
 * // Circular avatar skeleton
 * <Skeleton variant="circular" width={48} height={48} />
 *
 * @example
 * // Multiple lines
 * <Skeleton lines={3} />
 */
export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-white/5 rounded';

  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'circular' ? width : undefined),
  };

  if (lines > 1 && variant === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseStyles, variantStyles.text)}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  );
}

/* ============================================================================
 * Preset Skeletons — for common UI patterns
 * ============================================================================ */

/**
 * SkeletonCard - mimics a Card component during loading
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-bg-surface rounded-xl border border-border-subtle p-6 space-y-4',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <Skeleton lines={3} />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  );
}

/**
 * SkeletonTable - mimics a data table during loading
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="bg-bg-surface rounded-xl border border-border-subtle overflow-hidden">
      {/* Header */}
      <div className="bg-bg-surface-hover px-6 py-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width={`${100 / columns}%`} height={16} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="px-6 py-4 flex gap-4 border-t border-border-subtle"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width={`${100 / columns}%`} height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonList - mimics a list of items during loading
 */
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="bg-bg-surface rounded-xl border border-border-subtle p-4 flex items-center gap-4"
        >
          <Skeleton variant="rounded" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={18} />
            <Skeleton width="60%" height={14} />
          </div>
          <Skeleton variant="rounded" width={80} height={32} />
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonStats - mimics stats cards during loading
 */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-bg-surface rounded-xl border border-border-subtle p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="rounded" width={60} height={24} />
          </div>
          <Skeleton width="50%" height={32} className="mb-2" />
          <Skeleton width="70%" height={14} />
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonInventoryGrid - mimics the inventory cards grid
 */
export function SkeletonInventoryGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-bg-surface rounded-xl border border-border-subtle p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <Skeleton width="70%" height={20} />
            <Skeleton variant="rounded" width={80} height={24} />
          </div>
          <Skeleton width="50%" height={14} className="mb-3" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton width="60%" height={14} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton width="40%" height={14} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
