import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )},
  { path: '/campaigns', label: 'Campaigns', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )},
  { path: '/customers', label: 'Customers', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    </svg>
  )},
  { path: '/analytics', label: 'Analytics', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )},
  { path: '/import', label: 'Import Data', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )},
];

export default function TopNav() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getInitials = (name) => {
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: 'var(--nav-height)',
      background: 'var(--bg-white)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 48px',
      boxShadow: 'var(--shadow-xs)',
    }}>
      {/* Brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginRight: '40px' }}>
        <div style={{
          width: '34px', height: '34px',
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(135deg, #e8703a, #f0923e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          </svg>
        </div>
        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
          CampaignPilot
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-light)' : 'transparent',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-surface)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      {user && (
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px 6px 6px',
              background: menuOpen ? 'var(--bg-surface)' : 'transparent',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
            onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div style={{
                width: '32px', height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700,
              }}>
                {getInitials(user.name)}
              </div>
            )}
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {user.name?.split(' ')[0]}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="animate-fade-in" style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '240px',
              background: 'var(--bg-white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 200,
            }}>
              {/* User Info */}
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
              </div>
              {/* Logout */}
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--rose)',
                  fontFamily: 'inherit',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rose-light)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
