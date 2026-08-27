import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRightIcon,
  DownloadIcon,
  KeyRoundIcon,
  LogOutIcon,
  ReceiptTextIcon,
  UploadIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { TopBar } from '../components/layout/TopBar';
import { useApp } from '../contexts/AppContext';
import { formatPoints } from '../utils/game';

const financialApps = [
  {
    to: '/wallet/recharge',
    label: 'USDT Recharge',
    desc: 'Deposit USDT (TRC20) & add coins',
    Icon: DownloadIcon,
    color: 'text-win-green bg-win-green/10',
  },
  {
    to: '/wallet/withdrawal',
    label: 'USDT Withdrawal',
    desc: 'Withdraw your winnings to your wallet',
    Icon: UploadIcon,
    color: 'text-win-red bg-win-red/10',
  },
  {
    to: '/wallet/transactions',
    label: 'Transaction History',
    desc: 'View deposits, withdrawals & payouts',
    Icon: ReceiptTextIcon,
    color: 'text-brand-600 bg-brand-50',
  },
];

const securityApps = [
  {
    to: '/wallet/reset-password',
    label: 'Reset Password',
    desc: 'Update or reset your security password',
    Icon: KeyRoundIcon,
    color: 'text-win-gold bg-win-gold/10',
  },
];

export function Wallet() {
  const { user, transactions, logout } = useApp();
  const navigate = useNavigate();

  const pending = transactions.filter(
    (tx) => tx.userId === user?.id && tx.status === 'pending'
  ).length;

  async function handleLogout() {
    await logout();
    toast.success('Signed out.');
    navigate('/login');
  }

  return (
    <>
      <TopBar />
      <main className="flex-1 overflow-y-auto px-3 pb-6 pt-3">
        {/* Balance Card */}
        <section aria-label="Balances" className="rounded-2xl bg-brand-500 p-4 text-white shadow-lift">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-100">
            Wallet Balance
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
            {formatPoints(user?.balance ?? 0)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-3 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-brand-100">Bonus</p>
              <p className="font-bold tabular-nums">{formatPoints(user?.bonus ?? 0)} coins</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-brand-100">Pending Requests</p>
              <p className="font-bold tabular-nums">{pending}</p>
            </div>
          </div>
        </section>

        {/* Financial Services Section */}
        <section aria-label="Financial Apps" className="mt-4">
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
            <CreditCardIcon className="h-3.5 w-3.5 text-brand-500" />
            Financial Services
          </h2>
          <div className="overflow-hidden rounded-2xl bg-white shadow-card">
            <ul className="divide-y divide-ink-300/30">
              {financialApps.map(({ to, label, desc, Icon, color }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 ease-smooth hover:bg-brand-50/50"
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ink-900">{label}</p>
                      <p className="text-xs text-ink-500 truncate">{desc}</p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-ink-300 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Account & Security Section */}
        <section aria-label="Security Apps" className="mt-4">
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-brand-500" />
            Account & Security
          </h2>
          <div className="overflow-hidden rounded-2xl bg-white shadow-card">
            <ul className="divide-y divide-ink-300/30">
              {securityApps.map(({ to, label, desc, Icon, color }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 ease-smooth hover:bg-brand-50/50"
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ink-900">{label}</p>
                      <p className="text-xs text-ink-500 truncate">{desc}</p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-ink-300 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 ease-smooth hover:bg-win-red/5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-win-red/10 text-win-red">
                    <LogOutIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-win-red">Sign Out</p>
                    <p className="text-xs text-ink-500 truncate">Log out of your current session</p>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}