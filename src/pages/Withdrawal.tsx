import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';
import { formatPoints } from '../utils/game';

export function Withdrawal() {
  const { user, settings, requestWithdrawal, transactions } = useApp();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');

  const recent = useMemo(
    () =>
    transactions.
    filter((tx) => tx.userId === user?.id && tx.type === 'withdrawal').
    slice(0, 4),
    [transactions, user]
  );

  const value = Number(amount);
  const usdt = Number.isFinite(value) ? value / settings.pointsPerUsdt : 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = await requestWithdrawal(value, address);
    if (result.ok) {
      toast.success(result.message);
      setAmount('');
    } else {
      toast.error(result.message);
    }
  }

  return (
    <>
      <PageHeader title="Withdrawal" />
      <main className="flex-1 overflow-y-auto px-3 pb-8 pt-3">
        <section className="rounded-2xl bg-brand-500 p-4 text-white shadow-lift">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-100">
            Withdrawable balance
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
            {formatPoints(user?.balance ?? 0)}
          </p>
        </section>

        <form
          onSubmit={submit}
          aria-label="Withdrawal request"
          className="mt-3 rounded-2xl bg-white p-4 shadow-card">
          
          <p className="mx-auto w-full rounded-full bg-brand-500 py-2.5 text-center text-sm font-bold text-white">
            USDT (TRC20)
          </p>

          <div className="mt-4 grid gap-3">
            <TextField
              label="USDT TRC20 wallet address"
              placeholder="T…"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required />
            
            <TextField
              label="Amount (coins)"
              type="number"
              inputMode="numeric"
              min={1000}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              hint={`Minimum 1000 coins · 1 USDT = ${settings.pointsPerUsdt} coins`}
              required />
            
            <div className="flex items-center justify-between rounded-xl bg-surface-sunken px-4 py-3">
              <span className="text-xs text-ink-500">You will receive</span>
              <span className="font-display text-lg font-extrabold tabular-nums text-ink-900">
                {usdt > 0 ? usdt.toFixed(2) : '0.00'} USDT
              </span>
            </div>
          </div>

          <Button type="submit" block size="lg" className="mt-4">
            Request withdrawal
          </Button>
          <p className="mt-2 text-center text-xs text-ink-500">
            Requests are reviewed by an administrator, usually within 2 hours.
          </p>
        </form>

        <section aria-label="Recent withdrawals" className="mt-3 rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            Recent withdrawals
          </h2>
          {recent.length ?
          <ul className="divide-y divide-ink-300/30">
              {recent.map((tx) =>
            <li key={tx.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="min-w-0 truncate pr-3 text-ink-700">{tx.method}</span>
                  <span className="shrink-0 text-right">
                    <span className="block font-bold tabular-nums text-ink-900">
                      {formatPoints(tx.amount)}
                    </span>
                    <span
                  className={`text-xs font-semibold capitalize ${
                  tx.status === 'approved' ?
                  'text-win-green' :
                  tx.status === 'rejected' ?
                  'text-win-red' :
                  'text-ink-500'}`
                  }>
                  
                      {tx.status}
                    </span>
                  </span>
                </li>
            )}
            </ul> :

          <p className="py-3 text-sm text-ink-500">No withdrawal requests yet.</p>
          }
        </section>
      </main>
    </>);

}