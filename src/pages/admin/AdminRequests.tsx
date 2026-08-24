import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../contexts/AppContext';
import { formatPoints } from '../../utils/game';

type Tab = 'pending' | 'history';

const statusTone: Record<string, string> = {
  pending: 'bg-win-gold/15 text-win-gold',
  approved: 'bg-win-green/15 text-win-green',
  completed: 'bg-win-green/15 text-win-green',
  rejected: 'bg-win-red/15 text-win-red'
};

export function AdminRequests() {
  const { transactions, reviewTransaction } = useApp();
  const [tab, setTab] = useState<Tab>('pending');

  const pendingCount = transactions.filter(
    (tx) => tx.status === 'pending' && (tx.type === 'recharge' || tx.type === 'withdrawal')
  ).length;

  const rows = useMemo(
    () =>
    transactions.filter((tx) => {
      const isMoneyMove = tx.type === 'recharge' || tx.type === 'withdrawal';
      if (!isMoneyMove) return false;
      return tab === 'pending' ? tx.status === 'pending' : tx.status !== 'pending';
    }),
    [transactions, tab]
  );

  function review(id: string, status: 'approved' | 'rejected') {
    reviewTransaction(id, status);
    toast.success(`Request ${status}.`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
          Recharge & withdrawal requests
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Approving a recharge credits the player instantly. Rejecting a withdrawal returns the
          points to their balance. Every player request lands here in real time.
        </p>
      </header>

      <div className="mb-3 inline-flex gap-1 rounded-xl bg-white p-1 shadow-card">
        {(['pending', 'history'] as Tab[]).map((option) =>
        <button
          key={option}
          type="button"
          onClick={() => setTab(option)}
          aria-pressed={tab === option}
          className={`h-9 rounded-lg px-4 text-[13px] font-bold capitalize transition-colors duration-150 ease-smooth ${
          tab === option ? 'bg-brand-500 text-white' : 'text-ink-500'}`
          }>
          
            {option}
            {option === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        )}
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-card">
        {rows.length ?
        <ul className="divide-y divide-ink-300/30">
            {rows.map((tx) =>
          <li
            key={tx.id}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">
                    {tx.userName}{' '}
                    <span className="text-ink-500">· {tx.type}</span>
                  </p>
                  <p className="truncate text-xs text-ink-500">
                    {tx.method}
                    {tx.reference ? ` · ${tx.reference}` : ''} ·{' '}
                    {format(new Date(tx.createdAt), 'dd MMM · HH:mm')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-extrabold tabular-nums text-ink-900">
                    {formatPoints(tx.amount)} pts
                  </span>
                  {tx.status === 'pending' ?
              <span className="flex gap-2">
                      <Button size="sm" onClick={() => review(tx.id, 'approved')}>
                        Approve
                      </Button>
                      <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => review(tx.id, 'rejected')}>
                  
                        Reject
                      </Button>
                    </span> :

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusTone[tx.status]}`}>
                
                      {tx.status}
                    </span>
              }
                </div>
              </li>
          )}
          </ul> :

        <p className="px-5 py-14 text-center text-sm text-ink-500">
            {tab === 'pending' ? 'No requests waiting for review.' : 'No reviewed requests yet.'}
          </p>
        }
      </section>
    </div>);

}