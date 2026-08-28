import React, { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, HistoryIcon, InfoIcon, ListOrderedIcon } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { ResultBall } from '../components/game/ResultBall';
import { ResultsTable } from '../components/game/ResultsTable';
import { BetSheet } from '../components/game/BetSheet';
import { BetSelection, GameMode, RoundDuration } from '../types';
import { useApp } from '../contexts/AppContext';
import {
  GAME_MODES,
  ROUND_DURATIONS,
  colorsForDigit,
  durationLabel,
  formatCountdown,
  formatPoints,
  periodIdFor,
  secondsRemaining,
  selectionLabel } from
'../utils/game';

const colorButtons: {color: 'green' | 'violet' | 'red';label: string;className: string;}[] = [
{ color: 'green', label: 'Join Green', className: 'bg-win-green' },
{ color: 'violet', label: 'Join Violet', className: 'bg-win-violet' },
{ color: 'red', label: 'Join Red', className: 'bg-win-red' }];

const digitStyles: Record<string, string> = {
  green: 'bg-win-green',
  red: 'bg-win-red'
};

export function WinGo() {
  const { now, rounds, roundsLoaded, bets, user, settings } = useApp();
  const [duration, setDuration] = useState<RoundDuration | null>(null);
  const [mode, setMode] = useState<GameMode>('Parity');
  const [selection, setSelection] = useState<BetSelection | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'orders'>('records');
  const [orderFilter, setOrderFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');
  const [orderPage, setOrderPage] = useState(1);
  const [recordPage, setRecordPage] = useState(1);

  const periodId = useMemo(
    () => duration != null ? periodIdFor(new Date(now), mode, duration) : '',
    [now, mode, duration]
  );
  const remaining = duration != null ? secondsRemaining(now, duration) : 0;
  const lockWindow = duration === 1 ? 10 : 30;
  const locked = remaining <= lockWindow;
  const disabled = locked || settings.maintenance;

  const modeRounds = useMemo(
    () =>
    rounds.
    filter((round) => round.mode === mode && round.duration === duration),
    [rounds, mode, duration]
  );
  const recent = modeRounds.slice(0, 5);

  const recordsPerPage = 10;
  const totalRecordPages = Math.max(1, Math.ceil(modeRounds.length / recordsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (recordPage - 1) * recordsPerPage;
    return modeRounds.slice(start, start + recordsPerPage);
  }, [modeRounds, recordPage]);

  const allMyBets = useMemo(
    () => bets.filter((bet) => bet.userId === user?.id),
    [bets, user]
  );

  const ordersCount = {
    all: allMyBets.length,
    won: allMyBets.filter((b) => b.status === 'won').length,
    lost: allMyBets.filter((b) => b.status === 'lost').length,
    pending: allMyBets.filter((b) => b.status === 'pending').length,
  };

  const filteredBets = useMemo(() => {
    if (orderFilter === 'all') return allMyBets;
    return allMyBets.filter((bet) => bet.status === orderFilter);
  }, [allMyBets, orderFilter]);

  const ordersPerPage = 8;
  const totalOrderPages = Math.max(1, Math.ceil(filteredBets.length / ordersPerPage));
  const paginatedBets = useMemo(() => {
    const start = (orderPage - 1) * ordersPerPage;
    return filteredBets.slice(start, start + ordersPerPage);
  }, [filteredBets, orderPage]);

  // ── If no game type has been chosen yet, show only the selection screen ──
  if (duration === null) {
    return (
      <>
        <TopBar />
        <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 pb-16 pt-8 bg-white">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-amber-50 px-4 py-1.5 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Win Go · Live</span>
            </div>
            <h1 className="text-2xl font-black text-ink-900">Select Game Type</h1>
            <p className="mt-1.5 text-sm text-ink-400">Choose how fast you want to play</p>
          </div>

          {/* Cards */}
          <div className="w-full max-w-sm flex flex-col gap-5">
            {ROUND_DURATIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDuration(option)}
                className="group relative flex items-center gap-4 rounded-2xl bg-white px-5 py-4 text-left active:scale-[0.97] transition-all duration-150"
                style={{
                  border: '2px solid #f59e0b',
                  outline: '3px solid #fde68a',
                  outlineOffset: '1px',
                  boxShadow: '0 4px 20px rgba(245,158,11,0.15)',
                }}
              >
                {/* Black rectangle badge with gold number */}
                <div
                  className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl"
                  style={{
                    width: 60,
                    height: 60,
                    background: '#0f172a',
                    border: '2px solid #f59e0b',
                  }}
                >
                  <span
                    className="text-3xl font-black leading-none tabular-nums"
                    style={{ color: '#f59e0b' }}
                  >
                    {option}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#fbbf24' }}>
                    MIN
                  </span>
                </div>

                {/* Labels */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-extrabold text-ink-900">Win Go {durationLabel(option)}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {option === 1 ? 'Fast rounds · High action' : 'Longer rounds · Steady play'}
                  </p>
                </div>

                {/* Countdown */}
                <div
                  className="flex-shrink-0 rounded-xl px-3 py-2 text-right"
                  style={{ background: '#0f172a', border: '1.5px solid #f59e0b' }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#fbbf24' }}>Next draw</p>
                  <p className="text-sm font-black tabular-nums" style={{ color: '#f59e0b' }}>
                    {formatCountdown(secondsRemaining(now, option))}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-8 text-xs text-ink-400 text-center">Tap a card to enter the game</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="flex-1 overflow-y-auto px-3 pb-8 pt-3">
        {/* Back button + selected game type label */}
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setDuration(null)}
            aria-label="Back to game type selection"
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 shadow-md text-white active:scale-95 transition-all duration-150 hover:brightness-110"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1 rounded-xl bg-white border border-ink-300/20 shadow-sm px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-extrabold text-ink-900">Win Go {durationLabel(duration!)}</span>
            <span className="text-xs font-semibold text-amber-600 tabular-nums">
              {formatCountdown(secondsRemaining(now, duration!))}
            </span>
          </div>
        </div>

        <section
          aria-label="Current period"
          className="mt-3 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/70 p-4 text-white shadow-xl border border-amber-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-400">
                Period · Win Go {durationLabel(duration!)}
              </p>
              <p className="font-display text-xl font-extrabold tabular-nums tracking-wide text-white">{periodId}</p>
            </div>
            <div className="text-right">
              <p className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-400">
                <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" /> Count down
              </p>
              <p
                className={`font-display text-3xl font-extrabold tabular-nums tracking-wider transition-colors duration-150 ease-smooth ${
                  locked ? 'text-win-red animate-pulse' : 'text-amber-300'
                }`}
                aria-live="polite"
              >
                {formatCountdown(remaining)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-amber-500/20 pt-3">
            <div className="flex items-center gap-1.5">
              {recent.map((round) =>
              <ResultBall key={round.periodId} digit={round.digit} size="sm" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowRules((value) => !value)}
              aria-expanded={showRules}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold transition-colors duration-150 ease-smooth hover:bg-white/25">
              <InfoIcon className="h-3.5 w-3.5" aria-hidden="true" /> Rules
            </button>
          </div>
          {showRules ?
          <p className="mt-3 text-xs leading-relaxed text-brand-100">
              Green and Red pay 1.95×, but 1.45× when the winning number is 0 or 5. Violet pays 4.5×
              and only lands on 0 or 5. An exact number pays 4.5×. Minimum stake {settings.minStake}{' '}
              coins. Betting closes {lockWindow}s before each draw.
            </p> :
          null}
        </section>

        <section aria-label="Betting options" className="mt-3 rounded-2xl bg-white p-3 shadow-card">
          <div className="grid grid-cols-3 gap-2">
            {colorButtons.map(({ color, label, className }) =>
            <button
              key={color}
              type="button"
              disabled={disabled}
              onClick={() => setSelection({ kind: 'color', color })}
              className={`h-11 rounded-xl text-sm font-bold text-white transition-[transform,filter,opacity] duration-150 ease-smooth hover:brightness-105 active:scale-[0.98] disabled:opacity-40 ${className}`}>
                {label}
              </button>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
              const colors = colorsForDigit(digit);
              const style =
              colors.length === 2 ?
              {
                background: `linear-gradient(135deg, #7a3ff0 0 50%, ${
                colors[0] === 'green' ? '#12b76a' : '#f04438'} 50% 100%)`
              } :
              undefined;
              return (
                <button
                  key={digit}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelection({ kind: 'number', digit })}
                  style={style}
                  aria-label={`Bet on number ${digit}`}
                  className={`h-11 rounded-lg text-base font-bold text-white transition-[transform,filter,opacity] duration-150 ease-smooth hover:brightness-105 active:scale-[0.98] disabled:opacity-40 ${
                  style ? '' : digitStyles[colors[0]]}`
                  }>
                  {digit}
                </button>);
            })}
          </div>

          {settings.maintenance ?
          <p className="mt-2.5 text-center text-xs font-semibold text-win-red">
              Betting is paused for maintenance. Results keep settling as normal.
            </p> :
          locked ?
          <p className="mt-2.5 text-center text-xs font-semibold text-win-red">
              Betting closed — settling in {remaining}s
            </p> :
          null}
        </section>

        {/* ── Unified History & Orders Hub ─────────────────────────────────── */}
        <section className="mt-3 overflow-hidden rounded-2xl bg-white shadow-card">
          {/* Main Tab Switcher */}
          <div className="flex border-b border-ink-300/30 bg-surface-sunken/40 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                activeTab === 'records'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <ListOrderedIcon className="h-4 w-4" />
              Game Record
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <HistoryIcon className="h-4 w-4" />
              My Orders
              {allMyBets.length > 0 && (
                <span className="rounded-full bg-brand-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {allMyBets.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content: Game Record */}
          {activeTab === 'records' ? (
            <div>
              {/* Game Mode Pill Selectors */}
              <div className="flex gap-1 border-b border-ink-300/20 p-2">
                {GAME_MODES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setMode(option);
                      setRecordPage(1);
                    }}
                    aria-pressed={mode === option}
                    className={`h-8 flex-1 rounded-lg text-xs font-bold transition-colors ${
                      mode === option
                        ? 'bg-brand-500 text-white'
                        : 'text-ink-500 hover:bg-surface-sunken'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <ResultsTable rounds={paginatedRecords} loading={!roundsLoaded} />

              {/* Records Pagination */}
              {totalRecordPages > 1 && (
                <div className="flex items-center justify-between border-t border-ink-300/30 px-4 py-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setRecordPage((p) => Math.max(1, p - 1))}
                    disabled={recordPage === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-ink-300/40 px-2.5 py-1 font-semibold text-ink-700 disabled:opacity-30"
                  >
                    <ChevronLeftIcon className="h-3.5 w-3.5" /> Previous
                  </button>
                  <span className="font-medium text-ink-500">
                    Page {recordPage} of {totalRecordPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecordPage((p) => Math.min(totalRecordPages, p + 1))}
                    disabled={recordPage === totalRecordPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-ink-300/40 px-2.5 py-1 font-semibold text-ink-700 disabled:opacity-30"
                  >
                    Next <ChevronRightIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Tab Content: My Orders */
            <div>
              {/* Order Status Filters */}
              <div className="flex border-b border-ink-300/20 px-3 pt-2 gap-2 overflow-x-auto">
                {(['all', 'won', 'lost', 'pending'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setOrderFilter(filter);
                      setOrderPage(1);
                    }}
                    className={`border-b-2 pb-2 text-xs font-bold capitalize transition-colors ${
                      orderFilter === filter
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-ink-400 hover:text-ink-700'
                    }`}
                  >
                    {filter} ({ordersCount[filter]})
                  </button>
                ))}
              </div>

              {/* Orders List */}
              {paginatedBets.length ? (
                <ul className="divide-y divide-ink-300/20">
                  {paginatedBets.map((bet) => (
                    <li key={bet.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink-900">
                            {selectionLabel(bet.selection)}
                          </span>
                          <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-500">
                            {bet.mode} {durationLabel(bet.duration)}
                          </span>
                        </div>
                        <p className="truncate text-xs tabular-nums text-ink-400 mt-0.5">
                          Period: {bet.periodId}
                        </p>
                      </div>
                      <div className="pl-3 text-right">
                        <p className="text-sm font-extrabold tabular-nums text-ink-900">
                          {formatPoints(bet.amount)} coins
                        </p>
                        <p
                          className={`text-xs font-bold ${
                            bet.status === 'won'
                              ? 'text-win-green'
                              : bet.status === 'lost'
                              ? 'text-win-red'
                              : 'text-win-gold'
                          }`}
                        >
                          {bet.status === 'won'
                            ? `+${formatPoints(bet.payout)} coins`
                            : bet.status === 'lost'
                            ? 'Lost'
                            : 'Pending'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-10 text-center text-sm text-ink-500">
                  <p className="font-semibold text-ink-700">No {orderFilter !== 'all' ? orderFilter : ''} orders found.</p>
                  <p className="text-xs text-ink-400 mt-1">
                    Pick a colour or number above to place a new order.
                  </p>
                </div>
              )}

              {/* Orders Pagination */}
              {totalOrderPages > 1 && (
                <div className="flex items-center justify-between border-t border-ink-300/30 px-4 py-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                    disabled={orderPage === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-ink-300/40 px-2.5 py-1 font-semibold text-ink-700 disabled:opacity-30"
                  >
                    <ChevronLeftIcon className="h-3.5 w-3.5" /> Previous
                  </button>
                  <span className="font-medium text-ink-500">
                    Page {orderPage} of {totalOrderPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOrderPage((p) => Math.min(totalOrderPages, p + 1))}
                    disabled={orderPage === totalOrderPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-ink-300/40 px-2.5 py-1 font-semibold text-ink-700 disabled:opacity-30"
                  >
                    Next <ChevronRightIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <BetSheet
        mode={mode}
        duration={duration!}
        periodId={periodId}
        selection={selection}
        onClose={() => setSelection(null)}
      />
    </>
  );
}