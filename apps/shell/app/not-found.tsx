/**
 * NotFound — 404 error page for the Shell MFE.
 *
 * Displayed whenever a user navigates to a path that does not exist.
 * Provides a user-friendly message and a link back to the home page.
 */

import Link from 'next/link';

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  padding: '40px 24px',
  textAlign: 'center',
};

const codeStyle: React.CSSProperties = {
  fontSize: '96px',
  fontWeight: 800,
  color: '#e5e7eb',
  lineHeight: 1,
  margin: '0 0 16px',
  letterSpacing: '-4px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#111827',
  margin: '0 0 12px',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#6b7280',
  maxWidth: '400px',
  lineHeight: 1.6,
  margin: '0 0 32px',
};

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 24px',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'background-color 0.15s ease',
};

export default function NotFound() {
  return (
    <main style={pageStyle}>
      {/* Large 404 number for quick recognition */}
      <p style={codeStyle} aria-hidden="true">
        404
      </p>

      <h1 style={headingStyle}>Page Not Found</h1>

      <p style={descriptionStyle}>
        The page you are looking for does not exist or may have been moved.
        Check the URL or return to the home page.
      </p>

      {/* link to home page */}
      <Link href="/" style={linkStyle}>
        ← Back to Home
      </Link>
    </main>
  );
}
