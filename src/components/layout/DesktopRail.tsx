import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ResultBall } from '../game/ResultBall';
import { ROUND_DURATIONS, formatCountdown, secondsRemaining } from '../../utils/game';

export function DesktopRail() {
  const { now, rounds, bets, users } = useApp();
  const latest = rounds.
  filter((round) => round.mode === 'Parity' && round.duration === 1).
  slice(0, 8);
  const openBets = bets.filter((bet) => bet.status === 'pending').length;

  return (
    <aside className="hidden h-screen w-[320px] shrink-0 flex-col gap-4 overflow-y-auto px-8 py-12 xl:flex">
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
          Next draw closes in
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-3">
          {ROUND_DURATIONS.map((duration) =>
          <div key={duration}>
              <dt className="text-xs text-ink-500">Win Go {duration} Min</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink-900">
                {formatCountdown(secondsRemaining(now, duration))}
              </dd>
            </div>
          )}
        </dl>
        <p className="mt-2 text-xs text-ink-500">
          {openBets} open bet{openBets === 1 ? '' : 's'} across all tables
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
          Recent Parity results · 1 Min
        </p>
        <div className="flex flex-wrap gap-2">
          {latest.map((round) =>
          <ResultBall key={round.periodId} digit={round.digit} size="sm" />
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">Platform</p>
        <p className="mt-1 text-sm text-ink-700">
          {users.length} registered players · {rounds.length} settled rounds
        </p>
      </div>

      <Link
        to="/admin"
        className="inline-flex items-center gap-2 rounded-xl border border-ink-300/40 bg-white px-4 py-3 text-sm font-semibold text-ink-700 transition-colors duration-150 ease-smooth hover:border-brand-300 hover:text-brand-600">
        
        <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
        Administrator portal
      </Link>
    </aside>);

}