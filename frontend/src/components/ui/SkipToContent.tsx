/**
 * SkipToContent Component — Accessibility
 *
 * A skip link that allows keyboard users to bypass navigation
 * and jump directly to main content.
 */

import { cn } from '@/utils/helpers';

interface SkipToContentProps {
  /** ID of the main content element to skip to */
  targetId?: string;
  /** Link text */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skip to content link for keyboard accessibility.
 * Hidden until focused, then appears at top of page.
 *
 * @example
 * // In your App or Layout component:
 * <SkipToContent />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 */
export function SkipToContent({
  targetId = 'main-content',
  text = 'Перейти к основному содержимому',
  className,
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // Hidden by default
        'sr-only',
        // Visible when focused
        'focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
        // Styling
        'px-4 py-2 rounded-lg',
        'bg-gold text-bg-base font-medium',
        'shadow-lg shadow-gold/25',
        // Focus ring
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        // Transition
        'transition-opacity duration-150',
        className
      )}
    >
      {text}
    </a>
  );
}

export default SkipToContent;
