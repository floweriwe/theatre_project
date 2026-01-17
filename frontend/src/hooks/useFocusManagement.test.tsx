/**
 * Tests for useFocusManagement hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  useFocusReturn,
  useFocusOnMount,
  useAutoFocus,
} from './useFocusManagement';

// Wrapper for router context
const RouterWrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
);

describe('useFocusReturn', () => {
  let button: HTMLButtonElement;

  beforeEach(() => {
    button = document.createElement('button');
    document.body.appendChild(button);
  });

  afterEach(() => {
    document.body.removeChild(button);
  });

  it('should save and restore focus', async () => {
    button.focus();
    expect(document.activeElement).toBe(button);

    const { result } = renderHook(() => useFocusReturn());

    // Save focus
    act(() => {
      result.current.saveFocus();
    });

    // Blur button
    button.blur();

    // Restore focus
    act(() => {
      result.current.restoreFocus();
    });

    // Need to wait for setTimeout
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(document.activeElement).toBe(button);
  });

  it('should have previousFocusRef', () => {
    const { result } = renderHook(() => useFocusReturn());
    expect(result.current.previousFocusRef).toBeDefined();
  });
});

describe('useFocusOnMount', () => {
  it('should return a ref', () => {
    const { result } = renderHook(() => useFocusOnMount<HTMLInputElement>());
    expect(result.current).toBeDefined();
    expect(result.current.current).toBe(null);
  });

  it('should not focus when disabled', () => {
    const { result } = renderHook(() =>
      useFocusOnMount<HTMLInputElement>({ enabled: false })
    );
    expect(result.current.current).toBe(null);
  });
});

describe('useAutoFocus', () => {
  it('should return a ref callback', () => {
    const { result } = renderHook(() => useAutoFocus());
    expect(typeof result.current).toBe('function');
  });

  it('should focus element when callback is called', () => {
    const { result } = renderHook(() => useAutoFocus());

    const input = document.createElement('input');
    document.body.appendChild(input);

    const focusSpy = vi.spyOn(input, 'focus');

    act(() => {
      result.current(input);
    });

    expect(focusSpy).toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should not focus when disabled', () => {
    const { result } = renderHook(() => useAutoFocus({ enabled: false }));

    const input = document.createElement('input');
    document.body.appendChild(input);

    const focusSpy = vi.spyOn(input, 'focus');

    act(() => {
      result.current(input);
    });

    expect(focusSpy).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should handle null node', () => {
    const { result } = renderHook(() => useAutoFocus());

    // Should not throw
    act(() => {
      result.current(null);
    });
  });

  it('should focus with delay', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useAutoFocus({ delay: 100 }));

    const input = document.createElement('input');
    document.body.appendChild(input);

    const focusSpy = vi.spyOn(input, 'focus');

    act(() => {
      result.current(input);
    });

    expect(focusSpy).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(focusSpy).toHaveBeenCalled();

    document.body.removeChild(input);
    vi.useRealTimers();
  });
});
