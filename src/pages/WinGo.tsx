import React, { useMemo, useState } from 'react';
import { ClockIcon, HistoryIcon, InfoIcon } from 'lucide-react';
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
  const { now, rounds, bets, user, settings } = useApp();
  const [duration, setDuration] = useState<RoundDuration>(1);
  const [mode, setMode] = useState<GameMode>('Parity');
  const [selection, setSelection] = useState<BetSelection | null>(null);
  const [showRules, setShowRules] = useState(false);

  const periodId = useMemo(
    () => periodIdFor(new Date(now), mode, duration),
    [now, mode, duration]
  );
  const remaining = secondsRemaining(now, duration);
  const lockWindow = duration === 1 ? 10 : 30;
  const locked = remaining <= lockWindow;
  const disabled = locked || settings.maintenance;

  const modeRounds = useMemo(
    () =>
    rounds.
    filter((round) => round.mode === mode && round.duration === duration).
    slice(0, 12),
    [rounds, mode, duration]
  );
  const recent = modeRounds.slice(0, 5);
  const myBets = useMemo(
    () => bets.filter((bet) => bet.userId === user?.id).slice(0, 8),
    [bets, user]
  );

  return (
    <>
      <TopBar />
      <main className="flex-1 overflow-y-auto px-3 pb-6 pt-3">
        <div
          role="group"
          aria-label="Draw interval"
          className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-card border border-ink-300/20">
          {ROUND_DURATIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDuration(option)}
              aria-pressed={duration === option}
              className={`flex h-12 flex-col items-center justify-center rounded-xl text-sm font-bold transition-all duration-150 ease-smooth ${
                duration === option
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 shadow-md'
                  : 'text-ink-500 hover:bg-surface-sunken'
              }`}
            >
              Win Go {durationLabel(option)}
              <span
                className={`text-[11px] font-bold tabular-nums ${
                  duration === option ? 'text-slate-900/80' : 'text-ink-400'
                }`}
              >
                {formatCountdown(secondsRemaining(now, option))}
              </span>
            </button>
          ))}
        </div>

        <section
          aria-label="Current period"
          className="mt-3 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/70 p-4 text-white shadow-xl border border-amber-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-400">
                Period · Win Go {durationLabel(duration)}
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
              Green and Red pay 2×, but 1.5× when the winning number is 0 or 5. Violet pays 4.5×
              and only lands on 0 or 5. An exact number pays 9×. Minimum stake {settings.minStake}{' '}
              points. Betting closes {lockWindow}s before each draw.
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

        <section
          aria-label="Game modes and results"
          className="mt-3 overflow-hidden rounded-2xl bg-white shadow-card">
          
          <div className="flex gap-1 border-b border-ink-300/30 p-1.5">
            {GAME_MODES.map((option) =>
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={`h-9 flex-1 rounded-lg text-[13px] font-bold transition-colors duration-150 ease-smooth ${
              mode === option ?
              'bg-brand-500 text-white' :
              'text-ink-500 hover:bg-surface-sunken'}`
              }>
              
                {option}
              </button>
            )}
          </div>
          <ResultsTable rounds={modeRounds} />
        </section>

        <section aria-label="My orders" className="mt-3 rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-3 inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            <HistoryIcon className="h-4 w-4" aria-hidden="true" /> My orders
          </h2>
          {myBets.length ?
          <ul className="divide-y divide-ink-300/30">
              {myBets.map((bet) =>
            <li key={bet.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {selectionLabel(bet.selection)}
                    </p>
                    <p className="truncate text-xs tabular-nums text-ink-500">
                      {bet.mode} {durationLabel(bet.duration)} · {bet.periodId}
                    </p>
                  </div>
                  <div className="pl-3 text-right">
                    <p className="text-sm font-bold tabular-nums text-ink-900">
                      {formatPoints(bet.amount)}
                    </p>
                    <p
                  className={`text-xs font-semibold ${
                  bet.status === 'won' ?
                  'text-win-green' :
                  bet.status === 'lost' ?
                  'text-win-red' :
                  'text-ink-500'}`
                  }>
                  
                      {bet.status === 'won' ?
                  `+${formatPoints(bet.payout)}` :
                  bet.status === 'lost' ?
                  'Lost' :
                  'Pending'}
                    </p>
                  </div>
                </li>
            )}
            </ul> :

          <p className="py-4 text-sm text-ink-500">
              You have not placed a bet yet. Pick a colour or number above to join this period.
            </p>
          }
        </section>
      </main>

      <BetSheet
        mode={mode}
        duration={duration}
        periodId={periodId}
        selection={selection}
        onClose={() => setSelection(null)} />
      
    </>);

}