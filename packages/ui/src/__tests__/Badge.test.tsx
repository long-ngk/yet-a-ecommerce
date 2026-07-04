import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, computeBadgeDisplay } from '../Badge';

describe('Badge component', () => {
  describe('display value rules', () => {
    it('shows exact value for normal numbers', () => {
      render(<Badge value={5} variant="default" />);
      expect(screen.getByText('5')).toBeTruthy();
    });

    it('shows "99+" when value exceeds 99 (default max)', () => {
      render(<Badge value={100} variant="default" />);
      expect(screen.getByText('99+')).toBeTruthy();
    });

    it('shows "99+" when value is exactly 100', () => {
      render(<Badge value={100} variant="error" />);
      expect(screen.getByText('99+')).toBeTruthy();
    });

    it('shows "99+" when value is 999', () => {
      render(<Badge value={999} variant="success" />);
      expect(screen.getByText('99+')).toBeTruthy();
    });

    it('shows 99 when value is exactly 99', () => {
      render(<Badge value={99} variant="default" />);
      expect(screen.getByText('99')).toBeTruthy();
    });

    it('is hidden when value is 0 and hideWhenZero is true', () => {
      const { container } = render(<Badge value={0} variant="default" hideWhenZero />);
      expect(container.firstChild).toBeNull();
    });

    it('shows 0 when value is 0 and hideWhenZero is false', () => {
      render(<Badge value={0} variant="default" hideWhenZero={false} />);
      expect(screen.getByText('0')).toBeTruthy();
    });

    it('shows 0 when value is 0 and hideWhenZero is not set (default false)', () => {
      render(<Badge value={0} variant="default" />);
      expect(screen.getByText('0')).toBeTruthy();
    });

    it('shows string value as-is', () => {
      render(<Badge value="NEW" variant="success" />);
      expect(screen.getByText('NEW')).toBeTruthy();
    });

    it('uses custom max value', () => {
      render(<Badge value={10} variant="default" max={9} />);
      expect(screen.getByText('9+')).toBeTruthy();
    });

    it('shows value when equal to custom max', () => {
      render(<Badge value={9} variant="default" max={9} />);
      expect(screen.getByText('9')).toBeTruthy();
    });
  });

  describe('variant colors', () => {
    it('renders default variant', () => {
      render(<Badge value={1} variant="default" />);
      const badge = screen.getByRole('status');
      expect(badge.style.backgroundColor).toBe('rgb(107, 114, 128)');
    });

    it('renders success variant', () => {
      render(<Badge value={1} variant="success" />);
      const badge = screen.getByRole('status');
      expect(badge.style.backgroundColor).toBe('rgb(16, 185, 129)');
    });

    it('renders warning variant', () => {
      render(<Badge value={1} variant="warning" />);
      const badge = screen.getByRole('status');
      expect(badge.style.backgroundColor).toBe('rgb(245, 158, 11)');
    });

    it('renders error variant', () => {
      render(<Badge value={1} variant="error" />);
      const badge = screen.getByRole('status');
      expect(badge.style.backgroundColor).toBe('rgb(239, 68, 68)');
    });
  });
});

describe('computeBadgeDisplay', () => {
  it('returns null when value is 0 and hideWhenZero is true', () => {
    expect(computeBadgeDisplay(0, true, 99)).toBeNull();
  });

  it('returns "0" when value is 0 and hideWhenZero is false', () => {
    expect(computeBadgeDisplay(0, false, 99)).toBe('0');
  });

  it('returns "99+" when value is 100 with default max 99', () => {
    expect(computeBadgeDisplay(100, false, 99)).toBe('99+');
  });

  it('returns "99" when value is exactly 99', () => {
    expect(computeBadgeDisplay(99, false, 99)).toBe('99');
  });

  it('returns string value unchanged', () => {
    expect(computeBadgeDisplay('SALE', false, 99)).toBe('SALE');
  });

  it('returns "5+" when value is 6 and max is 5', () => {
    expect(computeBadgeDisplay(6, false, 5)).toBe('5+');
  });
});
