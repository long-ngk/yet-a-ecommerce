/**
 * RootLayout — Server Component (Shell MFE global layout).
 *
 * Wraps every page with the shared Header and Footer.
 * The Header is a Client Component (GlobalHeader) to support interactive
 * auth state, cart badge, and active navigation highlighting.
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { GlobalHeader } from './_components/GlobalHeader';
import { GlobalFooter } from './_components/GlobalFooter';
import { SessionSync } from './_components/SessionSync';

export const metadata: Metadata = {
  title: 'Yet-A-Ecommerce',
  description: 'Yet another e-commerce — micro-frontends platform',
};

const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={bodyStyle}>
        {/* persistent header with navigation across all zones */}
        <GlobalHeader />

        {/* sync session to Shared Store and dispatch auth:login on mount */}
        <SessionSync />

        {/* layout maintained without full-page reload between zones */}
        <main style={mainStyle}>{children}</main>

        {/* persistent footer with contact info and auxiliary links */}
        <GlobalFooter />
      </body>
    </html>
  );
}
