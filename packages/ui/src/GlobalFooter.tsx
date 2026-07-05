/**
 * GlobalFooter — Server Component for use across all MFEs.
 *
 * Renders the global footer with company info, navigation links, and contact email.
 */

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
          <a href="/products" style={linkStyle}>Products</a>
          <a href="/checkout" style={linkStyle}>Cart</a>
          <a href="/orders" style={linkStyle}>My Orders</a>
        </div>

        {/* Account links */}
        <div>
          <p style={columnHeadingStyle}>Account</p>
          <a href="/account" style={linkStyle}>Profile</a>
          <a href="/login" style={linkStyle}>Login</a>
          <a href="/register" style={linkStyle}>Register</a>
        </div>

        {/* Support / auxiliary links */}
        <div>
          <p style={columnHeadingStyle}>Support</p>
          <a href="/help" style={linkStyle}>Help Center</a>
          <a href="/shipping" style={linkStyle}>Shipping Info</a>
          <a href="/returns" style={linkStyle}>Returns Policy</a>
          <a href="/privacy" style={linkStyle}>Privacy Policy</a>
        </div>
      </div>

      <div style={bottomBarStyle}>
        <span>© {year} Yet-A-Ecommerce. All rights reserved.</span>
        <span>Built with Next.js Micro-Frontends</span>
      </div>
    </footer>
  );
}
