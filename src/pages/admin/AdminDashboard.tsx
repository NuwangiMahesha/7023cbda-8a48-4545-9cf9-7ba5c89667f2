import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ResultBall } from '../../components/game/ResultBall';
import { formatPoints } from '../../utils/game';

export function AdminDashboard() {
  const { users, transactions, bets, rounds } = useApp();

  const validUsers = useMemo(
    () => users.filter((u) => u && (u.name || u.email)),
    [users]
  );

  const stats = useMemo(() => {
    const sum = (predicate: (type: string, status: string) => boolean) =>
      transactions
        .filter((tx) => tx && predicate(tx.type, tx.status))
        .reduce((total, tx) => total + (tx.amount || 0), 0);

    const deposits = sum((type, status) => type === 'recharge' && status !== 'rejected');
    const withdrawals = sum((type, status) => type === 'withdrawal' && status !== 'rejected');
    const wagered = bets.reduce((total, bet) => total + (bet?.amount || 0), 0);
    const paidOut = bets.reduce((total, bet) => total + (bet?.payout || 0), 0);
    return {
      deposits,
      withdrawals,
      wagered,
      paidOut,
      grossMargin: wagered - paidOut,
      pending: transactions.filter((tx) => tx && tx.status === 'pending').length,
    };
  }, [transactions, bets]);

  const latest = rounds.slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
          Platform overview
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Live financial flow, player growth and settlement health.
        </p>
      </header>

      <section aria-label="Key metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-brand-500 p-5 text-white shadow-lift sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-100">
            Gross gaming margin
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
            {formatPoints(stats.grossMargin)}
          </p>
          <p className="mt-2 text-sm text-brand-100">
            {formatPoints(stats.wagered)} wagered · {formatPoints(stats.paidOut)} paid out
          </p>
        </article>

        {[
          { label: 'Registered players', value: validUsers.length, tone: 'text-ink-900' },
          { label: 'Pending requests', value: stats.pending, tone: 'text-win-gold' },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl bg-white p-5 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
              {item.label}
            </p>
            <p className={`mt-1 font-display text-3xl font-extrabold tabular-nums ${item.tone}`}>
              {item.value}
            </p>
          </article>
        ))}
      </section>

      <section aria-label="Cash flow" className="mt-3 grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-card">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            <ArrowDownRightIcon className="h-4 w-4 text-win-green" aria-hidden="true" /> Deposits
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-win-green">
            {formatPoints(stats.deposits)}
          </p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-card">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            <ArrowUpRightIcon className="h-4 w-4 text-win-red" aria-hidden="true" /> Withdrawals
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-win-red">
            {formatPoints(stats.withdrawals)}
          </p>
        </article>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section aria-label="Players" className="overflow-hidden rounded-2xl bg-white shadow-card">
          <h2 className="border-b border-ink-300/30 px-5 py-3.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            Players
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-500">
                <th scope="col" className="px-5 py-2 text-left font-semibold">
                  Player
                </th>
                <th scope="col" className="px-5 py-2 text-left font-semibold">
                  Joined
                </th>
                <th scope="col" className="px-5 py-2 text-left font-semibold">
                  Last Played
                </th>
                <th scope="col" className="px-5 py-2 text-right font-semibold">
                  Rounds
                </th>
                <th scope="col" className="px-5 py-2 text-right font-semibold">
                  Losses
                </th>
                <th scope="col" className="px-5 py-2 text-right font-semibold">
                  Wins
                </th>
                <th scope="col" className="px-5 py-2 text-right font-semibold">
                  Balance
                </th>
                <th scope="col" className="px-5 py-2 text-right font-semibold">
                  Bonus
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/30">
              {validUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-xs text-ink-500">
                    No registered players yet
                  </td>
                </tr>
              ) : (
                validUsers.map((user) => {
                  const userBets = bets.filter(b => b.userId === user.id);
                  const lastPlayed = userBets.length > 0 ? format(new Date(Math.max(...userBets.map(b => b.createdAt))), 'dd MMM yyyy') : '-';
                  const roundsPlayed = userBets.length;
                  const lostCoins = userBets.filter(b => b.status === 'lost').reduce((sum, b) => sum + b.amount, 0);
                  const wonCoins = userBets.filter(b => b.status === 'won').reduce((sum, b) => sum + b.payout, 0);

                  return (
                    <tr key={user.id}>
                      <td className="px-5 py-3">
                        <span className="block font-semibold text-ink-900">{user.name || 'Player'}</span>
                        <span className="text-xs text-ink-500">{user.email || 'No email'}</span>
                      </td>
                      <td className="px-5 py-3 text-ink-500">
                        {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : 'Recent'}
                      </td>
                      <td className="px-5 py-3 text-ink-500">
                        {lastPlayed}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-ink-900 font-medium">
                        {roundsPlayed}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-win-red font-semibold">
                        {lostCoins > 0 ? formatPoints(lostCoins) : '-'}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-win-green font-semibold">
                        {wonCoins > 0 ? formatPoints(wonCoins) : '-'}
                      </td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums text-ink-900">
                        {formatPoints(user.balance ?? 0)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-win-gold">
                        {formatPoints(user.bonus ?? 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        <section aria-label="Latest results" className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            Latest settlements
          </h2>
          <ul className="mt-3 divide-y divide-ink-300/30">
            {latest.map((round) => (
              <li
                key={`${round.mode}-${round.periodId}`}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span>
                  <span className="block font-semibold text-ink-900">{round.mode}</span>
                  <span className="text-xs tabular-nums text-ink-500">{round.periodId}</span>
                </span>
                <ResultBall digit={round.digit} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}