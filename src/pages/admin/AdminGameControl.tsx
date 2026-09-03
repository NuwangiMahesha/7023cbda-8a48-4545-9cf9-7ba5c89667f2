import React, { useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { ResultBall } from '../../components/game/ResultBall';
import { useApp } from '../../contexts/AppContext';
import {
  GAME_MODES,
  ROUND_DURATIONS,
  durationLabel,
  formatCountdown,
  formatPoints,
  multiplierFor,
  periodIdFor,
  secondsRemaining,
  selectionLabel } from
'../../utils/game';
import { RoundDuration } from '../../types';

export function AdminGameControl() {
  const { now, bets, settings, updateSettings, rounds, users } = useApp();
  const [mode, setMode] = useState(GAME_MODES[0]);
  const [duration, setDuration] = useState<RoundDuration>(1);

  const periodId = periodIdFor(new Date(now), mode, duration);
  const openBets = useMemo(
    () => bets.filter((bet) => bet.status === 'pending' && bet.periodId === periodId),
    [bets, periodId]
  );

  const settledBets = useMemo(
    () => bets.filter((bet) => bet.status !== 'pending').slice(0, 50),
    [bets]
  );

  const settledRoundsWithBets = useMemo(() => {
    const periods = Array.from(new Set(settledBets.map(b => b.periodId)));
    return periods.map(periodId => {
      const round = rounds.find(r => r.periodId === periodId);
      const periodBets = settledBets.filter(b => b.periodId === periodId);
      return { periodId, round, bets: periodBets };
    });
  }, [settledBets, rounds]);

  const exposure = useMemo(() => {
    const staked = openBets.reduce((total, bet) => total + bet.amount, 0);
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
      const payout = openBets.reduce(
        (total, bet) => total + bet.amount * multiplierFor(bet.selection, digit),
        0
      );
      return { digit, payout, net: staked - payout };
    });
  }, [openBets]);

  const worst = Math.max(...exposure.map((row) => row.payout), 1);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
          Game control
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Live pool exposure per outcome, plus the odds engine that picks each result.
        </p>
      </header>

      <div className="mb-3 mr-3 inline-flex gap-1 rounded-xl bg-white p-1 shadow-card">
        {ROUND_DURATIONS.map((option) =>
        <button
          key={option}
          type="button"
          onClick={() => setDuration(option)}
          aria-pressed={duration === option}
          className={`h-9 rounded-lg px-4 text-[13px] font-bold transition-colors duration-150 ease-smooth ${
          duration === option ? 'bg-brand-500 text-white' : 'text-ink-500'}`
          }>
          
            {durationLabel(option)}
          </button>
        )}
      </div>

      <div className="mb-3 inline-flex gap-1 rounded-xl bg-white p-1 shadow-card">
        {GAME_MODES.map((option) =>
        <button
          key={option}
          type="button"
          onClick={() => setMode(option)}
          aria-pressed={mode === option}
          className={`h-9 rounded-lg px-4 text-[13px] font-bold transition-colors duration-150 ease-smooth ${
          mode === option ? 'bg-brand-500 text-white' : 'text-ink-500'}`
          }>
          
            {option}
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section aria-label="Exposure" className="rounded-2xl bg-white p-5 shadow-card">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
              Exposure · period {periodId}
            </h2>
            <span className="font-display text-lg font-extrabold tabular-nums text-ink-900">
              {formatCountdown(secondsRemaining(now, duration))}
            </span>
          </div>
          <ul className="mt-4 grid gap-2">
            {exposure.map((row) =>
            <li key={row.digit} className="flex items-center gap-3">
                <ResultBall digit={row.digit} size="sm" />
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                  <span
                  className="block h-full rounded-full bg-brand-400 transition-[width] duration-200 ease-smooth"
                  style={{ width: `${row.payout / worst * 100}%` }} />
                
                </span>
                <span
                className={`w-24 text-right text-xs font-bold tabular-nums ${
                row.net >= 0 ? 'text-win-green' : 'text-win-red'}`
                }>
                
                  {row.net >= 0 ? '+' : '−'}
                  {formatPoints(Math.abs(row.net))}
                </span>
              </li>
            )}
          </ul>
          <p className="mt-3 text-xs text-ink-500">
            Net = total staked in this period minus what the house would pay if that number wins.
          </p>
        </section>

        <div className="grid gap-4">
          <section aria-label="Odds engine" className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
              Odds engine
            </h2>

            <label className="mt-4 block text-sm font-semibold text-ink-700" htmlFor="margin">
              House margin · {(settings.houseMargin * 100).toFixed(0)}%
            </label>
            <input
              id="margin"
              type="range"
              min={0}
              max={40}
              value={settings.houseMargin * 100}
              onChange={(event) =>
              updateSettings({ houseMargin: Number(event.target.value) / 100 })
              }
              className="mt-2 w-full accent-brand-500" />
            

            <label className="mt-4 block text-sm font-semibold text-ink-700" htmlFor="randomness">
              Randomness · {(settings.randomness * 100).toFixed(0)}%
            </label>
            <input
              id="randomness"
              type="range"
              min={0}
              max={100}
              value={settings.randomness * 100}
              onChange={(event) =>
              updateSettings({ randomness: Number(event.target.value) / 100 })
              }
              className="mt-2 w-full accent-brand-500" />
            
            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              A higher margin pushes outcomes toward the cheapest payout for the house; higher
              randomness mixes in pure chance so results stay believable.
            </p>
          </section>

          <section aria-label="Force result" className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
              Force next result
            </h2>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) =>
              <button
                key={digit}
                type="button"
                onClick={() => {
                  updateSettings({ forcedDigit: digit });
                  toast.success(`Next settlement forced to ${digit}.`);
                }}
                aria-pressed={settings.forcedDigit === digit}
                className={`h-10 rounded-lg text-sm font-bold transition-colors duration-150 ease-smooth ${
                settings.forcedDigit === digit ?
                'bg-brand-500 text-white' :
                'bg-surface-sunken text-ink-700 hover:bg-brand-50'}`
                }>
                
                  {digit}
                </button>
              )}
            </div>
            <Button
              variant="secondary"
              block
              className="mt-3"
              onClick={() => {
                updateSettings({ forcedDigit: null });
                toast.success('Override cleared — engine resumes automatic outcomes.');
              }}>
              
              Clear override
            </Button>
          </section>
        </div>
      </div>

      <section aria-label="Open bets" className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card">
        <h2 className="border-b border-ink-300/30 px-5 py-3.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
          Open bets this period
        </h2>
        {openBets.length ?
        <ul className="divide-y divide-ink-300/30">
            {openBets.map((bet) => {
              const competitor = users.find(u => u.id === bet.userId);
              return (
                <li key={bet.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <span className="font-semibold text-ink-900 block">{competitor?.name || 'Unknown Player'}</span>
                    <span className="text-xs text-ink-500">
                      Balance: <span className="tabular-nums font-semibold">{formatPoints(competitor?.balance ?? 0)}</span> coins
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-brand-600 block">{selectionLabel(bet.selection)}</span>
                    <span className="tabular-nums text-ink-700 text-xs font-bold">{formatPoints(bet.amount)} coins bet</span>
                  </div>
                </li>
              );
            })}
          </ul> :

        <p className="px-5 py-10 text-center text-sm text-ink-500">
            No open bets. {rounds.length} periods settled so far.
          </p>
        }
      </section>

      <section aria-label="Settled Rounds History" className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card">
        <h2 className="border-b border-ink-300/30 px-5 py-3.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
          Round History & Participants
        </h2>
        {settledRoundsWithBets.length ? (
          <div className="divide-y divide-ink-300/30">
            {settledRoundsWithBets.map(({ periodId, round, bets: roundBets }) => (
              <RoundHistoryItem 
                key={periodId} 
                periodId={periodId} 
                round={round} 
                roundBets={roundBets} 
                users={users} 
              />
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-ink-500">
            No recently settled bets.
          </p>
        )}
      </section>
    </div>
  );
}

function RoundHistoryItem({ periodId, round, roundBets, users }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-5 py-3">
      <button 
        type="button" 
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDownIcon className="h-4 w-4 text-ink-500" /> : <ChevronRightIcon className="h-4 w-4 text-ink-500" />}
          <h3 className="font-semibold text-ink-900">Period {periodId}</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-ink-500">{roundBets.length} bet{roundBets.length !== 1 ? 's' : ''}</span>
          {round && (
            <div className="flex items-center gap-2 text-xs font-bold text-ink-500">
              Result: <ResultBall digit={round.digit} size="sm" />
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <ul className="mt-4 space-y-2">
          {roundBets.map((bet: any) => {
            const competitor = users.find((u: any) => u.id === bet.userId);
            return (
              <li key={bet.id} className="flex items-center justify-between rounded-lg bg-surface-sunken px-3 py-2 text-sm">
                <div>
                  <span className="font-semibold text-ink-900 block">{competitor?.name || 'Unknown Player'}</span>
                  <span className="text-xs text-ink-500">
                    Balance: <span className="tabular-nums font-semibold text-ink-700">{formatPoints(competitor?.balance ?? 0)}</span> coins
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-brand-600 block">{selectionLabel(bet.selection)}</span>
                  <span className={`tabular-nums text-xs font-bold ${bet.status === 'won' ? 'text-win-green' : 'text-win-red'}`}>
                    {bet.status === 'won' ? `Won: +${formatPoints(bet.payout)}` : `Lost: -${formatPoints(bet.amount)}`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}