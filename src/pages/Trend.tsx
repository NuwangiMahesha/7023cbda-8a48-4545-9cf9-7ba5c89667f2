import React, { useMemo, useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { ResultBall } from '../components/game/ResultBall';
import { useApp } from '../contexts/AppContext';
import { GAME_MODES, ROUND_DURATIONS, colorsForDigit, durationLabel } from '../utils/game';
import { GameMode, RoundDuration } from '../types';

export function Trend() {
  const { rounds } = useApp();
  const [mode, setMode] = useState<GameMode>('Parity');
  const [duration, setDuration] = useState<RoundDuration>(1);

  const modeRounds = useMemo(
    () =>
    rounds.
    filter((round) => round.mode === mode && round.duration === duration).
    slice(0, 40),
    [rounds, mode, duration]
  );

  const counts = useMemo(() => {
    const base = Array.from({ length: 10 }, () => 0);
    modeRounds.forEach((round) => {
      base[round.digit] += 1;
    });
    return base;
  }, [modeRounds]);

  const max = Math.max(...counts, 1);
  const colorCounts = useMemo(() => {
    const tally = { green: 0, red: 0, violet: 0 };
    modeRounds.forEach((round) => {
      colorsForDigit(round.digit).forEach((color) => {
        tally[color] += 1;
      });
    });
    return tally;
  }, [modeRounds]);

  const total = Math.max(colorCounts.green + colorCounts.red + colorCounts.violet, 1);

  return (
    <>
      <TopBar />
      <main className="flex-1 overflow-y-auto px-3 pb-8 pt-3">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-card">
          {ROUND_DURATIONS.map((option) =>
          <button
            key={option}
            type="button"
            onClick={() => setDuration(option)}
            aria-pressed={duration === option}
            className={`h-10 rounded-xl text-sm font-bold transition-colors duration-150 ease-smooth ${
            duration === option ?
            'bg-brand-500 text-white' :
            'text-ink-500 hover:bg-surface-sunken'}`
            }>
            
              Win Go {durationLabel(option)}
            </button>
          )}
        </div>

        <div className="mt-2 flex gap-1 rounded-2xl bg-white p-1.5 shadow-card">
          {GAME_MODES.map((option) =>
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            aria-pressed={mode === option}
            className={`h-9 flex-1 rounded-lg text-[13px] font-bold transition-colors duration-150 ease-smooth ${
            mode === option ? 'bg-brand-500 text-white' : 'text-ink-500 hover:bg-surface-sunken'}`
            }>
            
              {option}
            </button>
          )}
        </div>

        <section aria-label="Number frequency" className="mt-3 rounded-2xl bg-white p-4 shadow-card">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            Number frequency · last {modeRounds.length} periods
          </h2>
          <ul className="mt-4 flex h-40 items-end gap-2">
            {counts.map((count, digit) =>
            <li key={digit} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold tabular-nums text-ink-500">{count}</span>
                <span
                className="w-full rounded-t-md bg-brand-400 transition-[height] duration-200 ease-smooth"
                style={{ height: `${Math.max(count / max * 100, 4)}%` }}
                aria-hidden="true" />
              
                <ResultBall digit={digit} size="sm" />
              </li>
            )}
          </ul>
        </section>

        <section aria-label="Colour distribution" className="mt-3 rounded-2xl bg-white p-4 shadow-card">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            Colour distribution
          </h2>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full">
            <span
              className="bg-win-green"
              style={{ width: `${colorCounts.green / total * 100}%` }} />
            
            <span className="bg-win-red" style={{ width: `${colorCounts.red / total * 100}%` }} />
            <span
              className="bg-win-violet"
              style={{ width: `${colorCounts.violet / total * 100}%` }} />
            
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            {(['green', 'red', 'violet'] as const).map((color) =>
            <div key={color}>
                <dt className="text-xs capitalize text-ink-500">{color}</dt>
                <dd className="font-bold tabular-nums text-ink-900">{colorCounts[color]}</dd>
              </div>
            )}
          </dl>
        </section>

        <section aria-label="Recent draws" className="mt-3 rounded-2xl bg-white p-4 shadow-card">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            Last 20 draws
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {modeRounds.slice(0, 20).map((round) =>
            <ResultBall key={round.periodId} digit={round.digit} />
            )}
          </div>
        </section>
      </main>
    </>);

}