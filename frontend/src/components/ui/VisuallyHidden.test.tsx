/**
 * Tests for VisuallyHidden Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(
        <VisuallyHidden>
          Hidden text
        </VisuallyHidden>
      );
      expect(screen.getByText('Hidden text')).toBeInTheDocument();
    });

    it('should render as span by default', () => {
      render(
        <VisuallyHidden>
          Content
        </VisuallyHidden>
      );
      const element = screen.getByText('Content');
      expect(element.tagName).toBe('SPAN');
    });

    it('should render as specified element', () => {
      render(
        <VisuallyHidden as="div">
          Content
        </VisuallyHidden>
      );
      const element = screen.getByText('Content');
      expect(element.tagName).toBe('DIV');
    });
  });

  describe('accessibility', () => {
    it('should apply sr-only class', () => {
      render(
        <VisuallyHidden>
          Screen reader only
        </VisuallyHidden>
      );
      const element = screen.getByText('Screen reader only');
      expect(element.className).toContain('sr-only');
    });

    it('should be focusable when focusable prop is true', () => {
      render(
        <VisuallyHidden focusable>
          Focusable content
        </VisuallyHidden>
      );
      const element = screen.getByText('Focusable content');
      expect(element.className).toContain('focus:not-sr-only');
    });

    it('should not have focus styles when not focusable', () => {
      render(
        <VisuallyHidden>
          Not focusable
        </VisuallyHidden>
      );
      const element = screen.getByText('Not focusable');
      expect(element.className).not.toContain('focus:not-sr-only');
    });
  });
});
