/**
 * Keyboard Navigation Hook — Theatre Management System
 *
 * Custom hooks for accessible keyboard navigation patterns.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for arrow key navigation in lists.
 * Manages focus between items using up/down/left/right arrow keys.
 *
 * @example
 * const { focusedIndex, handleKeyDown, setFocusedIndex } = useArrowNavigation({
 *   itemCount: items.length,
 *   onSelect: (index) => handleSelect(items[index]),
 * });
 *
 * return items.map((item, index) => (
 *   <button
 *     key={item.id}
 *     ref={(el) => (refs.current[index] = el)}
 *     tabIndex={focusedIndex === index ? 0 : -1}
 *     onKeyDown={handleKeyDown}
 *     onFocus={() => setFocusedIndex(index)}
 *   >
 *     {item.name}
 *   </button>
 * ));
 */
export function useArrowNavigation({
  itemCount,
  onSelect,
  orientation = 'vertical',
  loop = true,
  initialIndex = 0,
}: {
  itemCount: number;
  onSelect?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  initialIndex?: number;
}) {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const refs = useRef<(HTMLElement | null)[]>([]);

  // Reset when item count changes
  useEffect(() => {
    if (focusedIndex >= itemCount) {
      setFocusedIndex(Math.max(0, itemCount - 1));
    }
  }, [itemCount, focusedIndex]);

  // Focus the element when index changes
  useEffect(() => {
    refs.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event;
      let newIndex = focusedIndex;
      let handled = false;

      // Vertical navigation
      if (orientation === 'vertical' || orientation === 'both') {
        if (key === 'ArrowDown') {
          newIndex = loop
            ? (focusedIndex + 1) % itemCount
            : Math.min(focusedIndex + 1, itemCount - 1);
          handled = true;
        } else if (key === 'ArrowUp') {
          newIndex = loop
            ? (focusedIndex - 1 + itemCount) % itemCount
            : Math.max(focusedIndex - 1, 0);
          handled = true;
        }
      }

      // Horizontal navigation
      if (orientation === 'horizontal' || orientation === 'both') {
        if (key === 'ArrowRight') {
          newIndex = loop
            ? (focusedIndex + 1) % itemCount
            : Math.min(focusedIndex + 1, itemCount - 1);
          handled = true;
        } else if (key === 'ArrowLeft') {
          newIndex = loop
            ? (focusedIndex - 1 + itemCount) % itemCount
            : Math.max(focusedIndex - 1, 0);
          handled = true;
        }
      }

      // Home/End navigation
      if (key === 'Home') {
        newIndex = 0;
        handled = true;
      } else if (key === 'End') {
        newIndex = itemCount - 1;
        handled = true;
      }

      // Selection
      if (key === 'Enter' || key === ' ') {
        onSelect?.(focusedIndex);
        handled = true;
      }

      if (handled) {
        event.preventDefault();
        setFocusedIndex(newIndex);
      }
    },
    [focusedIndex, itemCount, orientation, loop, onSelect]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    refs,
  };
}

/**
 * Hook for focus trap within a container (e.g., modals, dialogs).
 *
 * @example
 * const trapRef = useFocusTrap({ enabled: isOpen });
 * return <div ref={trapRef}>...</div>;
 */
export function useFocusTrap({ enabled = true }: { enabled?: boolean } = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  return containerRef;
}

/**
 * Hook to handle Escape key to close modals/dropdowns.
 *
 * @example
 * useEscapeKey(() => setIsOpen(false), { enabled: isOpen });
 */
export function useEscapeKey(
  callback: () => void,
  { enabled = true }: { enabled?: boolean } = {}
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback, enabled]);
}

/**
 * Focus style classes for consistent focus rings.
 * Use with Tailwind's focus-visible: modifier.
 */
export const focusRingClasses = {
  /** Default gold focus ring */
  default:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',

  /** Subtle focus ring (for inputs) */
  subtle:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:border-gold',

  /** Inset focus ring (for buttons) */
  inset:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/50',

  /** No focus ring (for custom indicators) */
  none: 'focus:outline-none focus-visible:outline-none',
};

export default useArrowNavigation;
