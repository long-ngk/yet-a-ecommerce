'use client';

/**
 * SessionSync — Client Component for the Shell MFE.
 *
 * On mount, fetches the current NextAuth session via /api/auth/session.
 * If an authenticated session exists, dispatches an `auth:login` Custom Event
 * and writes the auth state to the Shared Store so other Zones can catch up
 * when they mount.
 *
 * This component renders nothing — it's a pure side-effect component intended
 * to be placed once in the root layout alongside GlobalHeader.
 */

import { useEffect } from 'react';
import { dispatch, writeStore, readStore } from '@yet-a-ecommerce/communication';
import type { EventPayload } from '@yet-a-ecommerce/communication';

interface SessionData {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
}

interface AuthState {
  userId: string;
  name: string;
  email: string;
}

export function SessionSync(): null {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // If auth state already in Shared Store, other components pick it up from there.
    // We still dispatch auth:login so any zones mounted after this event fires can
    // receive it AND read the store for catch-up.
    const existingAuth = readStore<AuthState>('shell', 'auth');

    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((session: SessionData | null) => {
        if (!session?.user?.id && !existingAuth) {
          // Not authenticated and no stored state — nothing to do
          return;
        }

        if (session?.user?.id) {
          const authData: AuthState = {
            userId: session.user.id,
            name: session.user.name ?? '',
            email: session.user.email ?? '',
          };

          // write latest auth state to Shared Store
          writeStore('shell', 'auth', authData);

          // dispatch auth:login so all mounted zones are notified
          const payload: EventPayload = {
            type: 'auth:login',
            data: authData,
            timestamp: Date.now(),
            source: 'shell',
          };
          dispatch('auth:login', payload);
        }
      })
      .catch(() => {
        // Non-critical: if session fetch fails, zones fall back to Shared Store
      });
  }, []); // Run once on mount

  return null;
}
