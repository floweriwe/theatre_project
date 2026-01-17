/**
 * LiveAnnouncer — Screen reader announcements
 * Modern Theatre Elegance v3
 *
 * Provides ARIA live region for dynamic content announcements.
 * Use for notifying screen reader users of state changes.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

type Politeness = 'polite' | 'assertive' | 'off';

interface Announcement {
  message: string;
  politeness: Politeness;
  id: number;
}

interface LiveAnnouncerContextValue {
  /** Announce a message to screen readers */
  announce: (message: string, politeness?: Politeness) => void;
  /** Clear all announcements */
  clear: () => void;
}

// =============================================================================
// Context
// =============================================================================

const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface LiveAnnouncerProviderProps {
  children: ReactNode;
}

export function LiveAnnouncerProvider({ children }: LiveAnnouncerProviderProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  let idCounter = 0;

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    const id = ++idCounter;
    setAnnouncements(prev => [...prev, { message, politeness, id }]);

    // Clear after announcement is read (3 seconds)
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 3000);
  }, []);

  const clear = useCallback(() => {
    setAnnouncements([]);
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={{ announce, clear }}>
      {children}

      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter(a => a.politeness === 'polite')
          .map(a => (
            <p key={a.id}>{a.message}</p>
          ))}
      </div>

      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter(a => a.politeness === 'assertive')
          .map(a => (
            <p key={a.id}>{a.message}</p>
          ))}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useLiveAnnouncer() {
  const context = useContext(LiveAnnouncerContext);

  if (!context) {
    // Return no-op functions if provider is missing
    return {
      announce: () => {},
      clear: () => {},
    };
  }

  return context;
}

export default LiveAnnouncerProvider;
