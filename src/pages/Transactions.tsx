import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '../components/layout/PageHeader';
import { useApp } from '../contexts/AppContext';
import { TransactionType } from '../types';
import { formatPoints } from '../utils/game';

const filters: {key: TransactionType | 'all';label: string;}[] = [
{ key: 'all', label: 'All' },
{ key: 'recharge', label: 'Recharge' },
{ key: 'withdrawal', label: 'Withdraw' },
{ key: 'bet', label: 'Bets' },
{ key: 'payout', label: 'Wins' }];


const credit: TransactionType[] = ['recharge', 'payout', 'commission'];

const statusTone: Record<string, string> = {
  completed: 'text-win-green',
  approved: 'text-win-green',
  pending: 'text-win-gold',
  rejected: 'text-win-red'
};

export function Transactions() {
  const { transactions, user } = useApp();
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');

  const rows = useMemo(
    () =>
    transactions.filter(
      (tx) => tx.userId === user?.id && (filter === 'all' || tx.type === filter)
    ),
    [transactions, user, filter]
  );

  return (
    <>
      <PageHeader title="Transactions" />
      <main className="flex-1 overflow-y-auto px-3 pb-8 pt-3">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {filters.map(({ key, label }) =>
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors duration-150 ease-smooth ${
            filter === key ?
            'bg-brand-500 text-white' :
            'bg-white text-ink-500 shadow-card hover:text-ink-700'}`
            }>
            
              {label}
            </button>
          )}
        </div>

        <section className="mt-3 overflow-hidden rounded-2xl bg-white shadow-card">
          {rows.length ?
          <ul className="divide-y divide-ink-300/30">
              {rows.map((tx) => {
              const isCredit = credit.includes(tx.type);
              return (
                <li key={tx.id} className="flex items-start gap-3 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold capitalize text-ink-900">{tx.type}</p>
                      <p className="truncate text-xs text-ink-500">{tx.method}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-ink-300">
                        {format(new Date(tx.createdAt), 'dd MMM yyyy · HH:mm')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                      className={`text-sm font-bold tabular-nums ${
                      isCredit ? 'text-win-green' : 'text-ink-900'}`
                      }>
                      
                        {isCredit ? '+' : '−'}
                        {formatPoints(tx.amount)}
                      </p>
                      <p className={`text-xs font-semibold capitalize ${statusTone[tx.status]}`}>
                        {tx.status}
                      </p>
                    </div>
                  </li>);

            })}
            </ul> :

          <p className="px-4 py-12 text-center text-sm text-ink-500">
              Nothing here yet. Recharges, bets and wins all appear in this ledger.
            </p>
          }
        </section>
      </main>
    </>);

}