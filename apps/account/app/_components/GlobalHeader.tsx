'use client';

/**
 * GlobalHeader — Client Component for Account MFE.
 *
 * Responsibilities:
 * - Renders Header with navigation links and active-state highlighting
 * - Manages authentication state via subscribe + Shared Store catch-up
 * - Manages cart badge count via subscribe + Shared Store catch-up
 */

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header, Badge, Button } from '@yet-a-ecommerce/ui';
import type { NavItem } from '@yet-a-ecommerce/ui';
import { subscribe, readStore, writeStore, clearStore, dispatch } from '@yet-a-ecommerce/communication';
import type { EventPayload } from '@yet-a-ecommerce/communication';

const SHELL_URL = process.env['NEXT_PUBLIC_SHELL_URL'] ?? 'http://localhost:3000';

interface AuthState {
  userId: string;
  name: string;
  email: string;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image: string | null;
}

const NAV_LINKS: { href: string; label: string; showBadge?: boolean }[] = [
  { href: '/products', label: 'Products' },
  { href: '/orders', label: 'Orders' },
  { href: '/account', label: 'Account' },
  { href: '/checkout', label: 'Cart', showBadge: true },
];

export function GlobalHeader(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  const [authUser, setAuthUser] = useState<AuthState | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${SHELL_URL}/api/auth/session`);
        if (response.ok) {
          const session = await response.json();
          if (session?.user) {
            const authData: AuthState = {
              userId: session.user.id,
              name: session.user.name || '',
              email: session.user.email || '',
            };
            writeStore('shell', 'auth', authData);
            setAuthUser(authData);
            return;
          }
        }
      } catch (err) {
        // fallback to store
      }
      
      const storedAuth = readStore<AuthState>('shell', 'auth');
      if (storedAuth) {
        setAuthUser(storedAuth);
      }
    };

    fetchSession();

    // Read cart items from store (AddToCartButton writes CartItem[] here)
    const storedCartItems = readStore<CartItem[]>('checkout', 'cart');
    if (storedCartItems && Array.isArray(storedCartItems)) {
      setCartCount(storedCartItems.length);
    }
  }, []);

  useEffect(() => {
    const unsubLogin = subscribe('auth:login', (payload: EventPayload) => {
      const data = payload.data as AuthState;
      if (data) {
        writeStore('shell', 'auth', data);
        setAuthUser(data);
      }
    });

    const unsubLogout = subscribe('auth:logout', () => {
      clearStore('shell', 'auth');
      setAuthUser(null);
    });

    return () => {
      unsubLogin();
      unsubLogout();
    };
  }, []);

  useEffect(() => {
    const unsubCart = subscribe('cart:update', (payload: EventPayload) => {
      const data = payload.data as { totalCount: number };
      if (data && typeof data.totalCount === 'number') {
        setCartCount(data.totalCount);
      }
    });

    return () => {
      unsubCart();
    };
  }, []);

  useEffect(() => {
    const unsubProfile = subscribe('profile:update', (payload: EventPayload) => {
      const data = payload.data as { name: string };
      if (data?.name) {
        setAuthUser((prev) =>
          prev ? { ...prev, name: data.name } : prev,
        );
        const stored = readStore<AuthState>('shell', 'auth');
        if (stored) {
          writeStore('shell', 'auth', { ...stored, name: data.name });
        }
      }
    });

    return () => {
      unsubProfile();
    };
  }, []);

  const handleLogout = useCallback(async () => {
    clearStore('shell', 'auth');
    dispatch('auth:logout', {
      type: 'auth:logout',
      data: null,
      timestamp: Date.now(),
      source: 'account',
    });
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // non-blocking
    }
    setAuthUser(null);
    router.push('/');
  }, [router]);

  const navItems: NavItem[] = NAV_LINKS.map((link) => {
    const isActive =
      pathname === link.href || pathname.startsWith(link.href + '/');

    const label =
      link.showBadge ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {link.label}
          <Badge value={cartCount} variant="error" hideWhenZero />
        </span>
      ) : (
        link.label
      );

    return {
      href: link.href,
      label: label as unknown as string,
      active: isActive,
    };
  });

  const actionArea = authUser ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
        {authUser.name || authUser.email}
      </span>
      <Button variant="secondary" size="small" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <a href={`${SHELL_URL}/login`} style={{ textDecoration: 'none' }}>
        <Button variant="secondary" size="small">
          Login
        </Button>
      </a>
      <a href={`${SHELL_URL}/register`} style={{ textDecoration: 'none' }}>
        <Button variant="primary" size="small">
          Register
        </Button>
      </a>
    </div>
  );

  const logo = (
    <a
      href={SHELL_URL}
      style={{
        fontWeight: 700,
        fontSize: '18px',
        color: '#3b82f6',
        textDecoration: 'none',
        letterSpacing: '-0.5px',
      }}
    >
      🛍 Yet-A-Ecommerce
    </a>
  );

  return (
    <Header
      logo={logo}
      navItems={navItems}
      actionArea={actionArea}
    />
  );
}
