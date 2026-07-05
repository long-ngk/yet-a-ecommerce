'use client';

/**
 * GlobalHeader — Client Component for the Shell MFE.
 *
 * Responsibilities:
 * - Renders Header with navigation links and active-state highlighting (Task 10.1)
 * - Manages authentication state via subscribe + Shared Store catch-up (Task 10.2)
 * - Manages cart badge count via subscribe + Shared Store catch-up (Task 10.3)
 */

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Badge, Button } from '@yet-a-ecommerce/ui';
import type { NavItem } from '@yet-a-ecommerce/ui';
import { subscribe, readStore, writeStore, clearStore, dispatch } from '@yet-a-ecommerce/communication';
import type { EventPayload } from '@yet-a-ecommerce/communication';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  userId: string;
  name: string;
  email: string;
}

interface CartStore {
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Navigation link definitions
// ---------------------------------------------------------------------------

const NAV_LINKS: { href: string; label: string; showBadge?: boolean }[] = [
  { href: '/products', label: 'Products' },
  { href: '/orders', label: 'Orders' },
  { href: '/account', label: 'Account' },
  { href: '/checkout', label: 'Cart', showBadge: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlobalHeader(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  // auth state
  const [authUser, setAuthUser] = useState<AuthState | null>(null);
  // cart badge count
  const [cartCount, setCartCount] = useState<number>(0);

  // -------------------------------------------------------------------------
  // Catch-up from Shared Store on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Try to fetch fresh session from server first
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
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
      
      // Fallback: sync auth state from Shared Store if session fetch fails
      const storedAuth = readStore<AuthState>('shell', 'auth');
      if (storedAuth) {
        setAuthUser(storedAuth);
      }
    };

    fetchSession();

    // read initial cart count from Shared Store
    const storedCart = readStore<CartStore>('checkout', 'cart');
    if (storedCart && typeof storedCart.totalCount === 'number') {
      setCartCount(storedCart.totalCount);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Subscribe to auth events
  // -------------------------------------------------------------------------
  useEffect(() => {
    // on login: store in Shared Store (already done by dispatching zone),
    //           here we update local state from the event payload
    const unsubLogin = subscribe('auth:login', (payload: EventPayload) => {
      const data = payload.data as AuthState;
      if (data) {
        writeStore('shell', 'auth', data);
        setAuthUser(data);
      }
    });

    // on logout: clear Shared Store, reset local state
    const unsubLogout = subscribe('auth:logout', () => {
      clearStore('shell', 'auth');
      setAuthUser(null);
    });

    return () => {
      unsubLogin();
      unsubLogout();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Subscribe to cart events
  // -------------------------------------------------------------------------
  useEffect(() => {
    // update badge when cart changes
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

  // -------------------------------------------------------------------------
  // Subscribe to profile:update event
  // -------------------------------------------------------------------------
  useEffect(() => {
    // when Account MFE updates profile, refresh displayed name
    const unsubProfile = subscribe('profile:update', (payload: EventPayload) => {
      const data = payload.data as { name: string };
      if (data?.name) {
        setAuthUser((prev) =>
          prev ? { ...prev, name: data.name } : prev,
        );
        // Keep Shared Store in sync with the updated name
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

  // -------------------------------------------------------------------------
  // Logout handler
  // -------------------------------------------------------------------------
  const handleLogout = useCallback(async () => {
    // clear token from Shared Store, dispatch auth:logout, redirect home
    clearStore('shell', 'auth');
    dispatch('auth:logout', {
      type: 'auth:logout',
      data: null,
      timestamp: Date.now(),
      source: 'shell',
    });
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // non-blocking — proceed with redirect even if signout call fails
    }
    setAuthUser(null);
    router.push('/');
  }, [router]);

  // -------------------------------------------------------------------------
  // Build navItems with active state
  // -------------------------------------------------------------------------
  const navItems: NavItem[] = NAV_LINKS.map((link) => {
    const isActive =
      pathname === link.href || pathname.startsWith(link.href + '/');

    // For Cart link, wrap label with Badge if there are items
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

  // -------------------------------------------------------------------------
  // Auth action area
  // -------------------------------------------------------------------------
  const actionArea = authUser ? (
    // show username and logout option when authenticated
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
        {authUser.name || authUser.email}
      </span>
      <Button variant="secondary" size="small" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  ) : (
    // show login/register when unauthenticated
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Link href="/login" style={{ textDecoration: 'none' }}>
        <Button variant="secondary" size="small">
          Login
        </Button>
      </Link>
      <Link href="/register" style={{ textDecoration: 'none' }}>
        <Button variant="primary" size="small">
          Register
        </Button>
      </Link>
    </div>
  );

  // -------------------------------------------------------------------------
  // Logo
  // -------------------------------------------------------------------------
  const logo = (
    <Link
      href="/"
      style={{
        fontWeight: 700,
        fontSize: '18px',
        color: '#3b82f6',
        textDecoration: 'none',
        letterSpacing: '-0.5px',
      }}
    >
      🛍 Yet-A-Ecommerce
    </Link>
  );

  return (
    <Header
      logo={logo}
      navItems={navItems}
      actionArea={actionArea}
    />
  );
}
