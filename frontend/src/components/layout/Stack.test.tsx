/**
 * Tests for Stack Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stack, HStack, VStack } from './Stack';

describe('Stack', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(
        <Stack>
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render as div by default', () => {
      render(
        <Stack data-testid="stack">
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.tagName).toBe('DIV');
    });

    it('should render as specified element', () => {
      render(
        <Stack as="nav">
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.tagName).toBe('NAV');
    });
  });

  describe('direction', () => {
    it('should be vertical by default (flex-col)', () => {
      render(
        <Stack>
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('flex-col');
    });

    it('should apply horizontal direction', () => {
      render(
        <Stack direction="horizontal">
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('flex-row');
    });

    it('should apply responsive direction', () => {
      render(
        <Stack responsive>
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('flex-col');
      expect(container?.className).toContain('sm:flex-row');
    });
  });

  describe('gap', () => {
    it('should apply default gap (md)', () => {
      render(
        <Stack>
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('gap-4');
    });

    it('should apply specified gap', () => {
      render(
        <Stack gap="lg">
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('gap-6');
    });

    it('should apply no gap', () => {
      render(
        <Stack gap="none">
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('gap-0');
    });
  });

  describe('alignment', () => {
    it('should apply default alignment (stretch)', () => {
      render(
        <Stack>
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('items-stretch');
    });

    it('should apply center alignment', () => {
      render(
        <Stack align="center">
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('items-center');
    });
  });

  describe('justification', () => {
    it('should apply default justification (start)', () => {
      render(
        <Stack>
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('justify-start');
    });

    it('should apply between justification', () => {
      render(
        <Stack justify="between">
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('justify-between');
    });
  });

  describe('wrap', () => {
    it('should not wrap by default', () => {
      render(
        <Stack>
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).not.toContain('flex-wrap');
    });

    it('should apply wrap when enabled', () => {
      render(
        <Stack wrap>
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('flex-wrap');
    });
  });

  describe('fullWidth', () => {
    it('should not be full width by default', () => {
      render(
        <Stack>
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).not.toContain('w-full');
    });

    it('should apply full width when enabled', () => {
      render(
        <Stack fullWidth>
          <span>Content</span>
        </Stack>
      );
      const container = screen.getByText('Content').parentElement;
      expect(container?.className).toContain('w-full');
    });
  });
});

describe('HStack', () => {
  it('should render with horizontal direction', () => {
    render(
      <HStack>
        <span>Content</span>
      </HStack>
    );
    const container = screen.getByText('Content').parentElement;
    expect(container?.className).toContain('flex-row');
  });
});

describe('VStack', () => {
  it('should render with vertical direction', () => {
    render(
      <VStack>
        <span>Content</span>
      </VStack>
    );
    const container = screen.getByText('Content').parentElement;
    expect(container?.className).toContain('flex-col');
  });
});
