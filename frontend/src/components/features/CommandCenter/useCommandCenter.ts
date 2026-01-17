/**
 * useCommandCenter — Hook для управления Command Center
 *
 * Обрабатывает глобальные сочетания клавиш:
 * - Cmd+K (macOS) / Ctrl+K (Windows/Linux) — открыть
 * - Escape — закрыть
 */

import { useEffect, useCallback } from 'react';
import { useCommandCenterStore } from '@/store/commandCenterStore';

export function useCommandCenter() {
  const { isOpen, open, close, toggle } = useCommandCenterStore();

  // Global keyboard shortcut handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+K (macOS) or Ctrl+K (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggle();
      return;
    }

    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      close();
    }
  }, [isOpen, toggle, close]);

  // Attach global listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

export default useCommandCenter;
