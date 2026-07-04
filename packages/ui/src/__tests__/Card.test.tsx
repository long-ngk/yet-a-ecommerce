import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, ProductCard, OrderCard } from '../Card';
import type { OrderStatus } from '../Card';

describe('Card', () => {
  it('renders title and content', () => {
    render(<Card title="Test Title" content={<p>Content here</p>} />);
    expect(screen.getByText('Test Title')).toBeTruthy();
    expect(screen.getByText('Content here')).toBeTruthy();
  });

  it('renders image when provided', () => {
    render(<Card title="With Image" content="Content" image="https://example.com/img.jpg" />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toBe('https://example.com/img.jpg');
    expect(img.alt).toBe('With Image');
  });

  it('does not render image element when image is not provided', () => {
    render(<Card title="No Image" content="Content" />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders actions when provided', () => {
    render(
      <Card
        title="With Actions"
        content="Content"
        actions={<button>Action Button</button>}
      />
    );
    expect(screen.getByText('Action Button')).toBeTruthy();
  });
});

describe('ProductCard', () => {
  const product = {
    id: 'prod-1',
    name: 'Test Product',
    price: 150000,
    image: 'https://example.com/product.jpg',
    stock: 10,
  };

  it('renders product name and price', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText('Test Product')).toBeTruthy();
    // Price is formatted as USD currency
    expect(screen.getByText(/\$1,500\.00|\$150,000\.00|1,500|150,000/)).toBeTruthy();
  });

  it('renders add-to-cart button when in stock', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeTruthy();
  });

  it('calls onAddToCart when add-to-cart button is clicked', () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={product} onAddToCart={onAddToCart} />);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it('shows out-of-stock state and disables button when stock is 0', () => {
    const outOfStockProduct = { ...product, stock: 0 };
    render(<ProductCard product={outOfStockProduct} />);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getAllByText(/out of stock/i).length).toBeGreaterThan(0);
  });
});

describe('OrderCard', () => {
  const order = {
    id: 'order-abc-123',
    createdAt: new Date('2024-01-15'),
    totalAmount: 500000,
    status: 'DELIVERED' as OrderStatus,
  };

  it('renders order id (last 8 chars)', () => {
    render(<OrderCard order={order} />);
    // order.id = 'order-abc-123', slice(-8) = '-abc-123', uppercased = '-ABC-123'
    // rendered as '#-ABC-123'
    expect(screen.getByText('#-ABC-123')).toBeTruthy();
  });

  it('renders total amount formatted', () => {
    render(<OrderCard order={order} />);
    expect(screen.getByText(/500,000\.00|\$500/)).toBeTruthy();
  });

  it('renders status label', () => {
    render(<OrderCard order={order} />);
    expect(screen.getByText('Delivered')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<OrderCard order={order} onClick={onClick} />);
    fireEvent.click(screen.getByRole('article'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders all order statuses correctly', () => {
    const statuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
    const labels = ['Pending', 'Processing', 'Shipping', 'Delivered', 'Cancelled'];

    statuses.forEach((status, index) => {
      const { unmount } = render(
        <OrderCard order={{ ...order, status }} />
      );
      expect(screen.getByText(labels[index]!)).toBeTruthy();
      unmount();
    });
  });
});
