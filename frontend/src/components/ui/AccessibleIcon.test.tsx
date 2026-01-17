/**
 * Tests for AccessibleIcon Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleIcon, IconButton } from './AccessibleIcon';

describe('AccessibleIcon', () => {
  describe('decorative icon', () => {
    it('should render children', () => {
      render(
        <AccessibleIcon>
          <svg data-testid="icon" />
        </AccessibleIcon>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should have aria-hidden when no label', () => {
      render(
        <AccessibleIcon>
          <svg data-testid="icon" />
        </AccessibleIcon>
      );
      const wrapper = screen.getByTestId('icon').parentElement;
      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not have role img when no label', () => {
      render(
        <AccessibleIcon>
          <svg data-testid="icon" />
        </AccessibleIcon>
      );
      const wrapper = screen.getByTestId('icon').parentElement;
      expect(wrapper).not.toHaveAttribute('role');
    });
  });

  describe('meaningful icon', () => {
    it('should have aria-label when label provided', () => {
      render(
        <AccessibleIcon label="Success">
          <svg data-testid="icon" />
        </AccessibleIcon>
      );
      const wrapper = screen.getByTestId('icon').parentElement;
      expect(wrapper).toHaveAttribute('aria-label', 'Success');
    });

    it('should have role img when label provided', () => {
      render(
        <AccessibleIcon label="Success">
          <svg data-testid="icon" />
        </AccessibleIcon>
      );
      const wrapper = screen.getByTestId('icon').parentElement;
      expect(wrapper).toHaveAttribute('role', 'img');
    });

    it('should not have aria-hidden when label provided', () => {
      render(
        <AccessibleIcon label="Success">
          <svg data-testid="icon" />
        </AccessibleIcon>
      );
      const wrapper = screen.getByTestId('icon').parentElement;
      expect(wrapper).not.toHaveAttribute('aria-hidden');
    });
  });

  describe('className', () => {
    it('should apply custom className', () => {
      render(
        <AccessibleIcon className="custom-class">
          <svg data-testid="icon" />
        </AccessibleIcon>
      );
      const wrapper = screen.getByTestId('icon').parentElement;
      expect(wrapper?.className).toContain('custom-class');
    });
  });
});

describe('IconButton', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(
        <IconButton label="Close">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render as button', () => {
      render(
        <IconButton label="Close">
          <svg />
        </IconButton>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have aria-label', () => {
      render(
        <IconButton label="Close menu">
          <svg />
        </IconButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close menu');
    });

    it('should hide icon from screen readers', () => {
      render(
        <IconButton label="Close">
          <svg data-testid="icon" />
        </IconButton>
      );
      const iconWrapper = screen.getByTestId('icon').parentElement;
      expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('should include visually hidden text', () => {
      render(
        <IconButton label="Close menu">
          <svg />
        </IconButton>
      );
      expect(screen.getByText('Close menu')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onClick when clicked', async () => {
      const onClick = vi.fn();
      render(
        <IconButton label="Close" onClick={onClick}>
          <svg />
        </IconButton>
      );

      await userEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const onClick = vi.fn();
      render(
        <IconButton label="Close" onClick={onClick} disabled>
          <svg />
        </IconButton>
      );

      await userEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <IconButton label="Close" disabled>
          <svg />
        </IconButton>
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('button type', () => {
    it('should be type button by default', () => {
      render(
        <IconButton label="Close">
          <svg />
        </IconButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should accept custom type', () => {
      render(
        <IconButton label="Submit" type="submit">
          <svg />
        </IconButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('className', () => {
    it('should apply custom className', () => {
      render(
        <IconButton label="Close" className="custom-class">
          <svg />
        </IconButton>
      );
      expect(screen.getByRole('button').className).toContain('custom-class');
    });
  });
});
