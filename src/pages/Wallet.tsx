import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRightIcon,
  DownloadIcon,
  KeyRoundIcon,
  LogOutIcon,
  ReceiptTextIcon,
  UploadIcon } from
'lucide-react';
import { toast } from 'sonner';
import { TopBar } from '../components/layout/TopBar';
import { useApp } from '../contexts/AppContext';
import { formatPoints } from '../utils/game';

const links = [
{ to: '/wallet/recharge', label: 'Recharge', Icon: DownloadIcon },
{ to: '/wallet/withdrawal', label: 'Withdrawal', Icon: UploadIcon },
{ to: '/wallet/transactions', label: 'Transactions', Icon: ReceiptTextIcon },
{ to: '/wallet/reset-password', label: 'Reset Password', Icon: KeyRoundIcon }];


export function Wallet() {
  const { user, transactions, logout } = useApp();
  const navigate = useNavigate();

  const pending = transactions.filter(
    (tx) => tx.userId === user?.id && tx.status === 'pending'
  ).length;

  function handleLogout() {
    logout();
    toast.success('Signed out.');
    navigate('/login');
  }

  return (
    <>
      <TopBar />
      <main className="flex-1 overflow-y-auto px-3 pb-6 pt-3">
        <section aria-label="Balances" className="rounded-2xl bg-brand-500 p-4 text-white shadow-lift">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-100">
            Wallet balance
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
            {formatPoints(user?.balance ?? 0)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-3 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-brand-100">Bonus</p>
              <p className="font-bold tabular-nums">{formatPoints(user?.bonus ?? 0)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-brand-100">Pending requests</p>
              <p className="font-bold tabular-nums">{pending}</p>
            </div>
          </div>
        </section>

        <nav aria-label="Wallet actions" className="mt-3 overflow-hidden rounded-2xl bg-white shadow-card">
          <ul className="divide-y divide-ink-300/30">
            {links.map(({ to, label, Icon }) =>
            <li key={to}>
                <Link
                to={to}
                className="flex items-center gap-3 px-4 py-4 text-sm font-semibold text-ink-900 transition-colors duration-150 ease-smooth hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400">
                
                  <Icon className="h-5 w-5 text-ink-500" aria-hidden="true" />
                  {label}
                  <ChevronRightIcon className="ml-auto h-4 w-4 text-ink-300" aria-hidden="true" />
                </Link>
              </li>
            )}
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-4 text-sm font-semibold text-win-red transition-colors duration-150 ease-smooth hover:bg-win-red/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400">
                
                <LogOutIcon className="h-5 w-5" aria-hidden="true" />
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </main>
    </>);

}