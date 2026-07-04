'use client';

import React from 'react';
import { Button } from './Button';

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface CardProps {
  image?: string;
  title: string;
  content: React.ReactNode;
  actions?: React.ReactNode;
}

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
  onAddToCart?: () => void;
  href?: string;
}

export interface OrderCardProps {
  order: {
    id: string;
    createdAt: Date;
    totalAmount: number;
    status: OrderStatus;
  };
  onClick?: () => void;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
};

const cardImageStyle: React.CSSProperties = {
  width: '100%',
  height: '200px',
  objectFit: 'cover',
};

const cardBodyStyle: React.CSSProperties = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flex: 1,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#111827',
  margin: 0,
};

const cardActionsStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderTop: '1px solid #f3f4f6',
  display: 'flex',
  gap: '8px',
};

export function Card({
  image,
  title,
  content,
  actions,
}: CardProps): React.ReactElement {
  return (
    <div style={cardStyle} role="article">
      {image ? (
        <img src={image} alt={title} style={cardImageStyle} />
      ) : null}
      <div style={cardBodyStyle}>
        <h3 style={cardTitleStyle}>{title}</h3>
        <div>{content}</div>
      </div>
      {actions ? <div style={cardActionsStyle}>{actions}</div> : null}
    </div>
  );
}

const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPING: 'Shipping',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const orderStatusColors: Record<OrderStatus, string> = {
  PENDING: '#f59e0b',
  PROCESSING: '#3b82f6',
  SHIPPING: '#8b5cf6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
};

export function ProductCard({
  product,
  onAddToCart,
  href,
}: ProductCardProps): React.ReactElement {
  const outOfStock = product.stock === 0;

  return (
    <div
      style={{ cursor: href ? 'pointer' : 'default' }}
      onClick={href ? () => { window.location.href = href; } : undefined}
      role={href ? 'link' : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={href ? (e) => { if (e.key === 'Enter') window.location.href = href; } : undefined}
      aria-label={href ? `View details for ${product.name}` : undefined}
    >
      <Card
        image={product.image}
        title={product.name}
        content={
          <div>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6', margin: 0 }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
            </p>
            {outOfStock ? (
              <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>Out of stock</p>
            ) : (
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>In stock: {product.stock}</p>
            )}
          </div>
        }
        actions={
          onAddToCart !== undefined ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                variant={outOfStock ? 'disabled' : 'primary'}
                size="medium"
                onClick={outOfStock ? undefined : onAddToCart}
                disabled={outOfStock}
              >
                {outOfStock ? 'Out of stock' : 'Add to cart'}
              </Button>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}

export function OrderCard({
  order,
  onClick,
}: OrderCardProps): React.ReactElement {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(order.createdAt);

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(order.totalAmount);

  const statusColor = orderStatusColors[order.status];
  const statusLabel = orderStatusLabels[order.status];

  return (
    <div
      style={{
        ...cardStyle,
        cursor: onClick ? 'pointer' : 'default',
      }}
      role="article"
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Order ${order.id}`}
    >
      <div style={cardBodyStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h3 style={{ ...cardTitleStyle, fontSize: '14px' }}>
              {`#${order.id.slice(-8).toUpperCase()}`}
            </h3>
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: '4px 0 0 0',
              }}
            >
              {formattedDate}
            </p>
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: statusColor,
              backgroundColor: `${statusColor}1a`,
              padding: '2px 8px',
              borderRadius: '12px',
            }}
          >
            {statusLabel}
          </span>
        </div>
        <p
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
          }}
        >
          {formattedAmount}
        </p>
      </div>
    </div>
  );
}
