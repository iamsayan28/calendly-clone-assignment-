import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  LayoutGrid,
} from 'lucide-react';

const navItems = [
  { to: '/',         label: 'Scheduling', icon: LayoutGrid },
  { to: '/meetings', label: 'Meetings',   icon: CalendarDays },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        minHeight: '100vh',
        background: 'white',
        borderRight: '1px solid var(--gray-200)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--gray-100)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          color: 'var(--blue-primary)',
          fontWeight: 700,
          fontSize: 18,
        }}>
          <CalendarDays size={22} strokeWidth={2.5} />
          <span>Calendly</span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ padding: '12px 0', flex: 1 }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--blue-primary)' : 'var(--gray-600)',
              background: isActive ? 'var(--blue-light)' : 'transparent',
              borderRight: isActive ? '3px solid var(--blue-primary)' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
              marginBottom: 2,
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User badge */}
      <div style={{
        padding: '16px 18px',
        borderTop: '1px solid var(--gray-100)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: 'var(--blue-primary)',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, flexShrink: 0,
        }}>S</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>Sayan Mandal</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Free plan</div>
        </div>
      </div>
    </aside>
  );
}
