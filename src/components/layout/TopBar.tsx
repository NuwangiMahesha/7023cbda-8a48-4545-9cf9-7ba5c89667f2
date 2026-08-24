import React from 'react';
import { Link } from 'react-router-dom';
import { CoinsIcon } from 'lucide-react';
import { Logo } from './Logo';
import { useApp } from '../../contexts/AppContext';
import { formatPoints } from '../../utils/game';

export function TopBar() {
  const { user } = useApp();
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink-300/30 bg-white px-4">
      <Link to="/menu" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
        <Logo />
      </Link>
      <Link
        to="/wallet/recharge"
        className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-sm font-bold text-win-gold transition-colors duration-150 ease-smooth hover:bg-brand-50">
        
        <CoinsIcon className="h-4 w-4" aria-hidden="true" />
        {formatPoints(user?.balance ?? 0)}
        <span className="sr-only">points balance, open recharge</span>
      </Link>
    </header>);

}