import React from 'react';

export interface BadgeProps {
  value: number | string;
  variant: 'default' | 'success' | 'warning' | 'error';
  hideWhenZero?: boolean;
  max?: number; // default: 99
}

const variantColors: Record<BadgeProps['variant'], { bg: string; text: string }> = {
  default: { bg: '#6b7280', text: '#ffffff' },
  success: { bg: '#10b981', text: '#ffffff' },
  warning: { bg: '#f59e0b', text: '#ffffff' },
  error: { bg: '#ef4444', text: '#ffffff' },
};

/**
 * Computes the display value for a badge.
 * - If value is 0 and hideWhenZero is true → returns null (hidden)
 * - If numeric value > max (default 99) → returns "99+" (or "{max}+")
 * - Otherwise → returns the value as-is
 */
export function computeBadgeDisplay(
  value: number | string,
  hideWhenZero: boolean,
  maxValue: number
): string | null {
  if (hideWhenZero && value === 0) {
    return null;
  }

  if (typeof value === 'number' && value > maxValue) {
    return `${maxValue}+`;
  }

  return String(value);
}

export function Badge({
  value,
  variant,
  hideWhenZero = false,
  max = 99,
}: BadgeProps): React.ReactElement | null {
  const displayValue = computeBadgeDisplay(value, hideWhenZero, max);

  if (displayValue === null) {
    return null;
  }

  const colors = variantColors[variant];

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
    lineHeight: 1,
    backgroundColor: colors.bg,
    color: colors.text,
    whiteSpace: 'nowrap',
  };

  return (
    <span style={style} role="status" aria-label={`Badge: ${displayValue}`}>
      {displayValue}
    </span>
  );
}
