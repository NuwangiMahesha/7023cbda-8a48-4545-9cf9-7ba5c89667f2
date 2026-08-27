import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CopyIcon, CheckIcon, WalletIcon, ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../contexts/AppContext';
import { formatPoints } from '../../utils/game';

type Tab = 'pending' | 'history';

const statusTone: Record<string, string> = {
  pending: 'bg-win-gold/15 text-win-gold border border-win-gold/30',
  approved: 'bg-win-green/15 text-win-green border border-win-green/30',
  completed: 'bg-win-green/15 text-win-green border border-win-green/30',
  rejected: 'bg-win-red/15 text-win-red border border-win-red/30'
};

export function AdminRequests() {
  const { transactions, reviewTransaction, settings } = useApp();
  const [tab, setTab] = useState<Tab>('pending');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  async function review(id: string, status: 'approved' | 'rejected') {
    await reviewTransaction(id, status);
    toast.success(`Request ${status}.`);
  }

  async function copyToClipboard(text: string, id: string, label: string) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
          Recharge & withdrawal requests
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Review player transactions in real time. Approving a recharge credits the player immediately. Rejecting a withdrawal refunds their balance.
        </p>
      </header>

      <div className="mb-4 inline-flex gap-1 rounded-xl bg-white p-1 shadow-card">
        {(['pending', 'history'] as Tab[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTab(option)}
            aria-pressed={tab === option}
            className={`h-9 rounded-lg px-4 text-[13px] font-bold capitalize transition-colors duration-150 ease-smooth ${
              tab === option ? 'bg-brand-500 text-white' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {option}
            {option === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-card">
        {rows.length ? (
          <ul className="divide-y divide-ink-300/30">
            {rows.map((tx) => {
              const isWithdrawal = tx.type === 'withdrawal';
              const walletAddress = tx.reference || (isWithdrawal ? tx.method.replace(/^USDT \(TRC20\)\s*/i, '') : '');
              const usdtEquivalent = (tx.amount / (settings.pointsPerUsdt || 100)).toFixed(2);
              const isCopied = copiedId === tx.id;

              return (
                <li
                  key={tx.id}
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-surface-sunken/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-ink-900">{tx.userName || 'Player'}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold capitalize ${
                          isWithdrawal ? 'bg-win-red/10 text-win-red' : 'bg-win-green/10 text-win-green'
                        }`}
                      >
                        {isWithdrawal ? (
                          <ArrowUpRightIcon className="h-3 w-3" />
                        ) : (
                          <ArrowDownLeftIcon className="h-3 w-3" />
                        )}
                        {tx.type}
                      </span>
                      <span className="text-xs text-ink-500">
                        {format(new Date(tx.createdAt), 'dd MMM yyyy · HH:mm')}
                      </span>
                    </div>

                    {isWithdrawal && walletAddress && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 p-2.5">
                        <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-amber-700">
                          <span className="inline-flex items-center gap-1">
                            <WalletIcon className="h-3.5 w-3.5 text-amber-600" />
                            Competitor's USDT (TRC20) Wallet Address
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-amber-600">
                            TRC20 Network
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 border border-amber-400/40 shadow-xs">
                          <span className="font-mono text-xs font-bold text-ink-900 break-all select-all">
                            {walletAddress}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(walletAddress, tx.id, 'Wallet address')}
                            className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                              isCopied
                                ? 'bg-win-green text-white'
                                : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <CheckIcon className="h-3.5 w-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <CopyIcon className="h-3.5 w-3.5" />
                                Copy Address
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {!isWithdrawal && tx.reference && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-ink-500">Ref Hash:</span>
                        <span className="font-mono text-xs text-ink-700 bg-surface-sunken px-2 py-0.5 rounded break-all select-all">
                          {tx.reference}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(tx.reference || '', tx.id, 'Transaction hash')}
                          className="inline-flex items-center gap-1 rounded text-[11px] font-bold text-brand-600 hover:text-brand-700"
                        >
                          <CopyIcon className="h-3 w-3" />
                          {isCopied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 sm:pl-4">
                    <div className="text-right">
                      <span className="font-display text-lg font-extrabold tabular-nums text-ink-900 block">
                        {formatPoints(tx.amount)} coins
                      </span>
                      <span className="text-xs font-bold text-amber-600 block">
                        ≈ {usdtEquivalent} USDT
                      </span>
                    </div>

                    {tx.status === 'pending' ? (
                      <div className="flex gap-2 mt-1">
                        <Button size="sm" onClick={() => review(tx.id, 'approved')}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => review(tx.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          statusTone[tx.status] || 'bg-surface-sunken text-ink-500'
                        }`}
                      >
                        {tx.status}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-14 text-center text-sm text-ink-500">
            {tab === 'pending' ? 'No requests waiting for review.' : 'No reviewed requests yet.'}
          </p>
        )}
      </section>
    </div>
  );
}