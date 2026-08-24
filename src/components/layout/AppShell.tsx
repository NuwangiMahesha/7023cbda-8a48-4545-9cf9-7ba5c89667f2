import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { DesktopRail } from './DesktopRail';
import { Logo } from './Logo';

export function AppShell({ showNav = true }: {showNav?: boolean;}) {
  return (
    <div className="flex min-h-screen w-full justify-center bg-surface-page">
      <aside className="hidden h-screen w-[320px] shrink-0 flex-col justify-center overflow-y-auto px-8 py-12 xl:flex">
        <Logo />
        <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-900">
          Colour & number prediction, every 60 seconds.
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
          Four game modes, instant settlement, USDT (TRC20) recharge and a two-level referral
          programme. Built mobile-first — scan and play anywhere.
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-3">
          {[
          ['60s', 'Round length'],
          ['9×', 'Top payout'],
          ['10 pts', 'Minimum stake'],
          ['2 levels', 'Referral depth']].
          map(([value, label]) =>
          <div key={label} className="rounded-xl bg-white p-3 shadow-card">
              <dt className="font-display text-lg font-bold text-brand-500">{value}</dt>
              <dd className="text-xs text-ink-500">{label}</dd>
            </div>
          )}
        </dl>
      </aside>

      <div className="flex h-screen w-full max-w-[430px] flex-col overflow-hidden border-x border-ink-300/30 bg-surface-page">
        <Outlet />
        {showNav ? <BottomNav /> : null}
      </div>

      <DesktopRail />
    </div>);

}