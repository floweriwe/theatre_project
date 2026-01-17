/**
 * useFocusManagement — Focus management utilities
 *
 * Hooks for managing focus in accessible applications:
 * - Route change focus
 * - Modal focus restoration
 * - Focus on element mount
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// =============================================================================
// useRouteFocus
// =============================================================================

/**
 * Manages focus on route changes for screen reader users.
 * Focuses the main content area or a specific element.
 *
 * @example
 * useRouteFocus(); // Focuses #main-content on route change
 * useRouteFocus({ targetId: 'page-heading' }); // Focuses specific element
 */
export function useRouteFocus({
  targetId = 'main-content',
  announceTitle = true,
}: {
  targetId?: string;
  announceTitle?: boolean;
} = {}) {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    // Only trigger on path changes
    if (previousPathRef.current === location.pathname) {
      return;
    }
    previousPathRef.current = location.pathname;

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) {
        // Make element focusable if it isn't
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: false });

        // Optionally announce page title
        if (announceTitle && document.title) {
          // The focus change will announce the focused element
          // which should be the page heading
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, targetId, announceTitle]);
}

// =============================================================================
// useFocusReturn
// =============================================================================

/**
 * Saves and restores focus when opening/closing modals.
 *
 * @example
 * const { saveFocus, restoreFocus } = useFocusReturn();
 *
 * const openModal = () => {
 *   saveFocus();
 *   setIsOpen(true);
 * };
 *
 * const closeModal = () => {
 *   setIsOpen(false);
 *   restoreFocus();
 * };
 */
export function useFocusReturn() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current?.focus) {
      // Small delay to ensure the modal is fully closed
      setTimeout(() => {
        previousFocusRef.current?.focus();
        previousFocusRef.current = null;
      }, 10);
    }
  }, []);

  return { saveFocus, restoreFocus, previousFocusRef };
}

// =============================================================================
// useFocusOnMount
// =============================================================================

/**
 * Focuses an element when it mounts.
 *
 * @example
 * const inputRef = useFocusOnMount<HTMLInputElement>();
 * return <input ref={inputRef} />;
 */
export function useFocusOnMount<T extends HTMLElement>({
  enabled = true,
  delay = 0,
}: {
  enabled?: boolean;
  delay?: number;
} = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const timeoutId = setTimeout(() => {
      ref.current?.focus();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [enabled, delay]);

  return ref;
}

// =============================================================================
// useAutoFocus
// =============================================================================

/**
 * Hook that returns a ref callback for auto-focusing elements.
 *
 * @example
 * const autoFocusRef = useAutoFocus({ enabled: isOpen });
 * return <input ref={autoFocusRef} />;
 */
export function useAutoFocus({
  enabled = true,
  delay = 0,
}: {
  enabled?: boolean;
  delay?: number;
} = {}) {
  const autoFocusRef = useCallback(
    (node: HTMLElement | null) => {
      if (!enabled || !node) return;

      if (delay > 0) {
        setTimeout(() => node.focus(), delay);
      } else {
        node.focus();
      }
    },
    [enabled, delay]
  );

  return autoFocusRef;
}

export default useFocusReturn;
