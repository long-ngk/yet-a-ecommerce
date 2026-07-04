import React from 'react';

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface HeaderProps {
  logo: React.ReactNode;
  navItems: NavItem[];
  actionArea?: React.ReactNode;
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  height: '64px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const logoAreaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const actionAreaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
};

function getNavItemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: active ? 600 : 400,
    color: active ? '#3b82f6' : '#374151',
    textDecoration: 'none',
    backgroundColor: active ? '#eff6ff' : 'transparent',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  };
}

export function Header({
  logo,
  navItems,
  actionArea,
}: HeaderProps): React.ReactElement {
  return (
    <header style={headerStyle} role="banner">
      <div style={logoAreaStyle}>{logo}</div>

      <nav aria-label="Main navigation">
        <ul style={navStyle}>
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                style={getNavItemStyle(item.active === true)}
                aria-current={item.active ? 'page' : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {actionArea ? (
        <div style={actionAreaStyle} aria-label="Header actions">
          {actionArea}
        </div>
      ) : null}
    </header>
  );
}
