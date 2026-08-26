import React from 'react';
import { Link } from 'react-router-dom';
import { CoinsIcon, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Logo } from './Logo';
import { useApp } from '../../contexts/AppContext';
import { formatPoints } from '../../utils/game';

export function TopBar() {
  const { user, now } = useApp();
  const currentDate = format(new Date(now), 'dd MMM yyyy');

  return (
    <header className="flex flex-col border-b border-ink-300/30 bg-white px-4 py-2.5 shrink-0 gap-1.5">
      <div className="flex items-center justify-between">
        <Link to="/menu" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
          <Logo />
        </Link>
        <Link
          to="/wallet/recharge"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1 text-xs font-bold text-win-gold transition-colors duration-150 ease-smooth hover:bg-brand-50"
        >
          <CoinsIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {formatPoints(user?.balance ?? 0)} pts
        </Link>
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-ink-300/20">
        <span className="font-semibold text-ink-900 truncate max-w-[180px]">
          Hello, <span className="text-brand-600">{user?.name || 'Player'}</span> 👋
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-500">
          <CalendarIcon className="h-3 w-3 text-ink-400" />
          {currentDate}
        </span>
      </div>
    </header>
  );
}