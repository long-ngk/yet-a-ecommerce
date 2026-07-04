import React from 'react';

export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'disabled';
  size: 'small' | 'medium' | 'large';
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const sizeStyles: Record<ButtonProps['size'], React.CSSProperties> = {
  small: {
    padding: '4px 12px',
    fontSize: '12px',
    borderRadius: '4px',
  },
  medium: {
    padding: '8px 20px',
    fontSize: '14px',
    borderRadius: '6px',
  },
  large: {
    padding: '12px 28px',
    fontSize: '16px',
    borderRadius: '8px',
  },
};

const variantStyles: Record<ButtonProps['variant'], React.CSSProperties> = {
  primary: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: '1px solid #3b82f6',
    cursor: 'pointer',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: '#3b82f6',
    border: '1px solid #3b82f6',
    cursor: 'pointer',
  },
  disabled: {
    backgroundColor: '#d1d5db',
    color: '#9ca3af',
    border: '1px solid #d1d5db',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
};

export function Button({
  variant,
  size,
  onClick,
  children,
  disabled,
  type = 'button',
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled === true || variant === 'disabled';

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    lineHeight: 1,
    outline: 'none',
    transition: 'background-color 0.15s ease, opacity 0.15s ease',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(isDisabled ? { cursor: 'not-allowed', opacity: 0.6 } : {}),
  };

  function handleClick(): void {
    if (!isDisabled && onClick) {
      onClick();
    }
  }

  return (
    <button
      type={type}
      style={style}
      onClick={handleClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
    >
      {children}
    </button>
  );
}
