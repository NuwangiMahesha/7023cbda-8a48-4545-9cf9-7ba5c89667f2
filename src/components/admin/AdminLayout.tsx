import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  Gauge as GaugeIcon,
  Gamepad2 as Gamepad2Icon,
  LogOutIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', Icon: GaugeIcon },
  { to: '/admin/requests', label: 'Requests', Icon: ScrollTextIcon },
  { to: '/admin/game', label: 'Game control', Icon: ShieldCheckIcon },
  { to: '/admin/settings', label: 'Settings', Icon: SettingsIcon },
];

export function AdminLayout() {
  const { adminLogout } = useApp();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full bg-surface-page">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-300/30 bg-white px-4 py-6 md:flex">
        <p className="px-2 font-display text-lg font-extrabold tracking-tight text-ink-900">
          Prisma<span className="text-brand-500">Admin</span>
        </p>
        <nav aria-label="Admin sections" className="mt-6 grid gap-1">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold',
                  'transition-colors duration-150 ease-smooth',
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-ink-700 hover:bg-surface-sunken',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          
          <Link
            to="/win"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 mt-2 transition-colors duration-150 ease-smooth"
          >
            <Gamepad2Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
            Gaming Dashboard
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => {
            adminLogout();
            navigate('/admin');
          }}
          className="mt-auto flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-win-red transition-colors duration-150 ease-smooth hover:bg-win-red/5"
        >
          <LogOutIcon className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav
          aria-label="Admin sections"
          className="flex items-center gap-1 overflow-x-auto border-b border-ink-300/30 bg-white p-2 md:hidden"
        >
          {items.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ease-smooth',
                  isActive ? 'bg-brand-500 text-white' : 'text-ink-500',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/win"
            className="shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold text-brand-600 bg-brand-50"
          >
            🎮 Gaming App
          </Link>
        </nav>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}