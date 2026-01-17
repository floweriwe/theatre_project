/**
 * Tests for ResponsiveContainer Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsiveContainer } from './ResponsiveContainer';

describe('ResponsiveContainer', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(
        <ResponsiveContainer>
          <div>Test Content</div>
        </ResponsiveContainer>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render as div by default', () => {
      render(
        <ResponsiveContainer>
          <span data-testid="child">Content</span>
        </ResponsiveContainer>
      );
      const container = screen.getByTestId('child').parentElement;
      expect(container?.tagName).toBe('DIV');
    });

    it('should render as specified element', () => {
      render(
        <ResponsiveContainer as="section">
          <span data-testid="child">Content</span>
        </ResponsiveContainer>
      );
      const container = screen.getByTestId('child').parentElement;
      expect(container?.tagName).toBe('SECTION');
    });
  });

  describe('size variants', () => {
    it('should apply sm size class', () => {
      render(
        <ResponsiveContainer size="sm">
          <span data-testid="child">Content</span>
        </ResponsiveContainer>
      );
      const container = screen.getByTestId('child').parentElement;
      expect(container?.className).toContain('max-w-screen-sm');
    });

    it('should apply xl size class by default', () => {
      render(
        <ResponsiveContainer>
          <span data-testid="child">Content</span>
        </ResponsiveContainer>
      );
      const container = screen.getByTestId('child').parentElement;
      expect(container?.className).toContain('max-w-screen-xl');
    });

    it('should apply full size class', () => {
      render(
        <ResponsiveContainer size="full">
          <span data-testid="child">Content</span>
        </ResponsiveContainer>
      );
      const container = screen.getByTestId('child').parentElement;
      expect(container?.className).toContain('max-w-full');
    });
  });

  describe('padding', () => {
    it('should apply padding by default', () => {
      render(
        <ResponsiveContainer>
          <span data-testid="child">Content</span>
        </ResponsiveContainer>
      );
      const container = screen.getByTestId('child').parentElement;
      expect(container?.className).toContain('px-4');
    });

    it('should not apply padding when disabled', () => {
      render(
        <ResponsiveContainer padding={false}>
          <span data-testid="child">Content</span>
        </ResponsiveContainer>
      );
      const container = screen.getByTestId('child').parentElement;
      expect(container?.className).not.toContain('px-4');
    });
  });

  describe('centering', () => {
    it('should center by default', () => {
      render(
        <ResponsiveContainer>
          <span data-testid="child">Content</span>
        </ResponsiveContainer>
      );
      const container = screen.getByTestId('child').parentElement;
      expect(container?.className).toContain('mx-auto');
    });

    it('should not center when disabled', () => {
      render(
        <ResponsiveContainer centered={false}>
          <span data-testid="child">Content</span>
        </ResponsiveContainer>
      );
      const container = screen.getByTestId('child').parentElement;
      expect(container?.className).not.toContain('mx-auto');
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      render(
        <ResponsiveContainer className="custom-class">
          <span data-testid="child">Content</span>
        </ResponsiveContainer>
      );
      const container = screen.getByTestId('child').parentElement;
      expect(container?.className).toContain('custom-class');
    });
  });
});
