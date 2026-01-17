/**
 * AccessibleIcon — Accessible icon wrapper
 * Modern Theatre Elegance v3
 *
 * Wraps icons with proper accessibility attributes.
 * - Decorative icons: hidden from screen readers
 * - Meaningful icons: labeled for screen readers
 */

import type { ReactNode } from 'react';
import { VisuallyHidden } from './VisuallyHidden';

// =============================================================================
// Types
// =============================================================================

interface AccessibleIconProps {
  /** The icon element to render */
  children: ReactNode;
  /**
   * Accessible label for the icon.
   * If not provided, icon is treated as decorative.
   */
  label?: string;
  /** Additional class names for the wrapper */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Accessible icon wrapper.
 *
 * @example
 * // Decorative icon (hidden from screen readers)
 * <AccessibleIcon>
 *   <CheckIcon />
 * </AccessibleIcon>
 *
 * // Meaningful icon (announced to screen readers)
 * <AccessibleIcon label="Success">
 *   <CheckIcon />
 * </AccessibleIcon>
 */
export function AccessibleIcon({ children, label, className }: AccessibleIconProps) {
  if (label) {
    // Meaningful icon with label
    return (
      <span className={className} role="img" aria-label={label}>
        {children}
      </span>
    );
  }

  // Decorative icon (hidden from screen readers)
  return (
    <span className={className} aria-hidden="true">
      {children}
    </span>
  );
}

/**
 * Icon button wrapper for accessible icon-only buttons.
 *
 * @example
 * <IconButton label="Close menu" onClick={onClose}>
 *   <XIcon />
 * </IconButton>
 */
interface IconButtonProps {
  /** The icon element */
  children: ReactNode;
  /** Required label for screen readers */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Additional class names */
  className?: string;
}

export function IconButton({
  children,
  label,
  onClick,
  disabled = false,
  type = 'button',
  className,
}: IconButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={label}
    >
      <span aria-hidden="true">{children}</span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </button>
  );
}

export default AccessibleIcon;
