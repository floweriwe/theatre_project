/**
 * VisuallyHidden — Accessible hidden content
 * Modern Theatre Elegance v3
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Use for accessible labels that shouldn't be visible.
 */

import type { ReactNode, ElementType } from 'react';

interface VisuallyHiddenProps {
  children: ReactNode;
  /** HTML element to render */
  as?: ElementType;
  /** Make visible when focused (for skip links) */
  focusable?: boolean;
}

export function VisuallyHidden({
  children,
  as: Component = 'span',
  focusable = false,
}: VisuallyHiddenProps) {
  return (
    <Component
      className={focusable ? 'sr-only focus:not-sr-only' : 'sr-only'}
    >
      {children}
    </Component>
  );
}

export default VisuallyHidden;
