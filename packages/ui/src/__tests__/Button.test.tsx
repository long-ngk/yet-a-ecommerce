import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  describe('variant rendering', () => {
    it('renders primary variant with blue background and white text', () => {
      render(<Button variant="primary" size="medium">Click me</Button>);
      const btn = screen.getByRole('button', { name: 'Click me' });
      expect(btn).toBeTruthy();
      // Primary: colored bg
      expect(btn.style.backgroundColor).toBe('rgb(59, 130, 246)');
      expect(btn.style.color).toBe('rgb(255, 255, 255)');
    });

    it('renders secondary variant with transparent bg and colored text', () => {
      render(<Button variant="secondary" size="medium">Secondary</Button>);
      const btn = screen.getByRole('button', { name: 'Secondary' });
      expect(btn.style.backgroundColor).toBe('transparent');
      expect(btn.style.color).toBe('rgb(59, 130, 246)');
    });

    it('renders disabled variant with muted style', () => {
      render(<Button variant="disabled" size="medium">Disabled</Button>);
      const btn = screen.getByRole('button', { name: 'Disabled' }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(btn.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('size rendering', () => {
    it('renders small size with correct padding', () => {
      render(<Button variant="primary" size="small">Small</Button>);
      const btn = screen.getByRole('button', { name: 'Small' });
      expect(btn.style.padding).toBe('4px 12px');
      expect(btn.style.fontSize).toBe('12px');
    });

    it('renders medium size with correct padding', () => {
      render(<Button variant="primary" size="medium">Medium</Button>);
      const btn = screen.getByRole('button', { name: 'Medium' });
      expect(btn.style.padding).toBe('8px 20px');
      expect(btn.style.fontSize).toBe('14px');
    });

    it('renders large size with correct padding', () => {
      render(<Button variant="primary" size="large">Large</Button>);
      const btn = screen.getByRole('button', { name: 'Large' });
      expect(btn.style.padding).toBe('12px 28px');
      expect(btn.style.fontSize).toBe('16px');
    });
  });

  describe('click handling', () => {
    it('calls onClick when primary button is clicked', () => {
      const onClick = vi.fn();
      render(<Button variant="primary" size="medium" onClick={onClick}>Click</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onClick when variant is disabled', () => {
      const onClick = vi.fn();
      render(<Button variant="disabled" size="medium" onClick={onClick}>Disabled</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does NOT call onClick when disabled prop is true', () => {
      const onClick = vi.fn();
      render(<Button variant="primary" size="medium" onClick={onClick} disabled>Disabled</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
