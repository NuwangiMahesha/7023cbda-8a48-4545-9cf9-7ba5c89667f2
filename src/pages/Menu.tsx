import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, GiftIcon, SparklesIcon } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { useApp } from '../contexts/AppContext';
import { formatPoints } from '../utils/game';

const WIN_GO_ART = "/48404417-3751-4999-9450-22c83d9aa07f.jpg";

const INVITE_ART = "/60deff2c-ad46-4f6b-86bf-3cd83c8129ba.jpg";


export function Menu() {
  const { user, referrals, rounds } = useApp();
  const level1 = referrals.filter((referral) => referral.level === 1).length;

  return (
    <>
      <TopBar />
      <main className="flex-1 overflow-y-auto px-3 pb-6 pt-3">
        <section
          aria-label="Account summary"
          className="rounded-2xl bg-white p-4 shadow-card">
          
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
            Available points
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums text-ink-900">
            {formatPoints(user?.balance ?? 0)}
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-ink-500">
            <span>
              Bonus{' '}
              <strong className="text-win-gold">{formatPoints(user?.bonus ?? 0)}</strong>
            </span>
            <span>
              Invited <strong className="text-ink-900">{level1}</strong>
            </span>
            <span>
              Code <strong className="text-ink-900">{user?.promoCode}</strong>
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to="/wallet/recharge"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-lift transition-colors duration-150 ease-smooth hover:bg-brand-600">
              
              Recharge
            </Link>
            <Link
              to="/wallet/withdrawal"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-200 bg-white text-sm font-semibold text-brand-600 transition-colors duration-150 ease-smooth hover:border-brand-400 hover:bg-brand-50">
              
              Withdraw
            </Link>
          </div>
        </section>

        <section
          aria-label="Referral programme"
          className="mt-3 overflow-hidden rounded-2xl bg-white shadow-card">
          
          <img
            src={INVITE_ART}
            alt="A hand holding an open gift box with coins spilling out"
            className="h-40 w-full object-cover" />
          
          <div className="p-4 pt-3 text-center">
            <h2 className="font-display text-xl font-extrabold text-ink-900">Invite users</h2>
            <p className="mt-0.5 text-sm font-semibold text-win-green">get more bonuses</p>
            <Link
              to="/promotion"
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-[15px] font-semibold text-white shadow-lift transition-colors duration-150 ease-smooth hover:bg-brand-600">
              
              <GiftIcon className="h-4 w-4" aria-hidden="true" /> To invite
            </Link>
          </div>
        </section>

        <section aria-label="Games" className="mt-4">
          <h2 className="mb-2.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            Win Go
          </h2>
          <Link
            to="/win"
            className="group block overflow-hidden rounded-2xl bg-white shadow-card transition-shadow duration-200 ease-smooth hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
            
            <img
              src={WIN_GO_ART}
              alt="Colourful lottery balls numbered five and six"
              className="h-44 w-full object-cover" />
            
            <div className="flex items-center gap-3 p-4">
              <p className="text-sm leading-relaxed text-ink-700">
                Colour and number betting — choose your favourite colour and lucky number to win
                the biggest money.
              </p>
              <ArrowUpRightIcon
                className="h-5 w-5 shrink-0 text-brand-500 transition-transform duration-150 ease-smooth group-hover:translate-x-0.5"
                aria-hidden="true" />
              
            </div>
          </Link>
        </section>

        <section aria-label="Platform activity" className="mt-4 rounded-2xl bg-white p-4 shadow-card">
          <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            <SparklesIcon className="h-4 w-4" aria-hidden="true" /> Live activity
          </h2>
          <p className="mt-2 text-sm text-ink-700">
            {rounds.length} periods settled today across Parity, Sapre, Bcone and Emerd. New
            results drop every 60 seconds.
          </p>
        </section>
      </main>
    </>);

}