/**
 * GlobalFooter — Server Component for the Shell MFE.
 *
 * Renders the global footer with company info, navigation links, and contact email.
 */

import Link from 'next/link';

const footerStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#d1d5db',
  padding: '40px 24px 24px',
  marginTop: 'auto',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '32px',
};

const columnHeadingStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#f9fafb',
  marginBottom: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const linkStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  color: '#9ca3af',
  textDecoration: 'none',
  marginBottom: '8px',
  transition: 'color 0.15s ease',
};

const bottomBarStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '32px auto 0',
  paddingTop: '20px',
  borderTop: '1px solid #374151',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '8px',
  fontSize: '12px',
  color: '#6b7280',
};

export function GlobalFooter(): React.ReactElement {
  const year = new Date().getFullYear();

  return (
    <footer style={footerStyle} role="contentinfo">
      <div style={containerStyle}>
        {/* Company info */}
        <div>
          <p style={{ ...columnHeadingStyle, marginBottom: '8px' }}>🛍 Yet-A-Ecommerce</p>
          <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6 }}>
            Your one-stop shop for quality products delivered fast.
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
            📧{' '}
            <a href="mailto:support@yet-a-ecommerce.dev" style={{ color: '#60a5fa' }}>
              support@yet-a-ecommerce.dev
            </a>
          </p>
        </div>

        {/* Shop navigation */}
        <div>
          <p style={columnHeadingStyle}>Shop</p>
          <Link href="/products" style={linkStyle}>Products</Link>
          <Link href="/checkout" style={linkStyle}>Cart</Link>
          <Link href="/orders" style={linkStyle}>My Orders</Link>
        </div>

        {/* Account links */}
        <div>
          <p style={columnHeadingStyle}>Account</p>
          <Link href="/account" style={linkStyle}>Profile</Link>
          <Link href="/account/login" style={linkStyle}>Login</Link>
          <Link href="/account/register" style={linkStyle}>Register</Link>
        </div>

        {/* Support / auxiliary links */}
        <div>
          <p style={columnHeadingStyle}>Support</p>
          <Link href="/help" style={linkStyle}>Help Center</Link>
          <Link href="/shipping" style={linkStyle}>Shipping Info</Link>
          <Link href="/returns" style={linkStyle}>Returns Policy</Link>
          <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>
        </div>
      </div>

      <div style={bottomBarStyle}>
        <span>© {year} Yet-A-Ecommerce. All rights reserved.</span>
        <span>Built with Next.js Micro-Frontends</span>
      </div>
    </footer>
  );
}
