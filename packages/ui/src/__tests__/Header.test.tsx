import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../Header';

const navItems = [
  { label: 'Products', href: '/products' },
  { label: 'Orders', href: '/orders', active: true },
  { label: 'Account', href: '/account' },
];

describe('Header', () => {
  it('renders logo content', () => {
    render(
      <Header
        logo={<span>MyShop</span>}
        navItems={navItems}
      />
    );
    expect(screen.getByText('MyShop')).toBeTruthy();
  });

  it('renders all nav items', () => {
    render(<Header logo={<span>Logo</span>} navItems={navItems} />);
    expect(screen.getByText('Products')).toBeTruthy();
    expect(screen.getByText('Orders')).toBeTruthy();
    expect(screen.getByText('Account')).toBeTruthy();
  });

  it('renders nav items as links with correct hrefs', () => {
    render(<Header logo={<span>Logo</span>} navItems={navItems} />);
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/products')).toBe(true);
    expect(links.some((l) => l.getAttribute('href') === '/orders')).toBe(true);
    expect(links.some((l) => l.getAttribute('href') === '/account')).toBe(true);
  });

  it('marks active nav item with aria-current="page"', () => {
    render(<Header logo={<span>Logo</span>} navItems={navItems} />);
    const ordersLink = screen.getByText('Orders').closest('a');
    expect(ordersLink?.getAttribute('aria-current')).toBe('page');
  });

  it('does not set aria-current on inactive items', () => {
    render(<Header logo={<span>Logo</span>} navItems={navItems} />);
    const productsLink = screen.getByText('Products').closest('a');
    expect(productsLink?.getAttribute('aria-current')).toBeNull();
  });

  it('renders action area when provided', () => {
    render(
      <Header
        logo={<span>Logo</span>}
        navItems={navItems}
        actionArea={<button>Cart</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Cart' })).toBeTruthy();
  });

  it('does not render action area element when not provided', () => {
    render(<Header logo={<span>Logo</span>} navItems={navItems} />);
    expect(screen.queryByLabelText('Header actions')).toBeNull();
  });

  it('renders header with banner role', () => {
    render(<Header logo={<span>Logo</span>} navItems={[]} />);
    expect(screen.getByRole('banner')).toBeTruthy();
  });

  it('renders empty nav when navItems is empty array', () => {
    render(<Header logo={<span>Logo</span>} navItems={[]} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeTruthy();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
