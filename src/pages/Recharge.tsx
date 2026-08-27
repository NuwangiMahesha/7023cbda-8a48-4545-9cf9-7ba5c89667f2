import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangleIcon, CopyIcon, RefreshCwIcon, ScrollTextIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';
import { formatPoints } from '../utils/game';

export function Recharge() {
  const { user, settings, requestRecharge } = useApp();
  const [usdt, setUsdt] = useState(String(settings.minRechargeUsdt));
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const usdtValue = Number(usdt);
  const points = Number.isFinite(usdtValue) ? usdtValue * settings.pointsPerUsdt : 0;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(settings.usdtAddress);
      toast.success('Wallet address copied.');
    } catch {
      toast.error('Copy failed — select the address manually.');
    }
  }

  async function submit() {
    if (!Number.isFinite(usdtValue)) {
      toast.error('Enter a valid USDT amount.');
      return;
    }
    if (!reference.trim()) {
      toast.error('Transaction reference number is required.');
      return;
    }
    setSubmitting(true);
    const result = await requestRecharge(usdtValue, reference);
    setSubmitting(false);
    if (result.ok) {
      toast.success(result.message);
      setReference('');
    } else {
      toast.error(result.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Recharge"
        action={
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-white">
            <ScrollTextIcon className="h-4 w-4" aria-hidden="true" />
          </span>
        } />
      
      <main className="flex-1 overflow-y-auto px-3 pb-8 pt-3">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-card">
          <p className="text-sm text-ink-500">
            Balance:{' '}
            <strong className="font-display text-lg text-win-gold">
              {formatPoints(user?.balance ?? 0)}
            </strong>
          </p>
          <RefreshCwIcon className="h-4 w-4 text-ink-500" aria-hidden="true" />
        </div>

        <section aria-label="USDT transfer" className="mt-3 rounded-2xl bg-white p-4 shadow-card">
          <p className="mx-auto w-full rounded-full bg-brand-500 py-2.5 text-center text-sm font-bold text-white">
            USDT (TRC20)
          </p>

          <div className="mt-4 grid place-items-center rounded-xl border border-ink-300/40 p-4">
            <QRCodeSVG value={settings.usdtAddress} size={168} level="M" />
          </div>

          <div className="mt-4 flex items-stretch gap-2">
            <p className="min-w-0 flex-1 break-all rounded-xl border border-ink-300/40 px-3 py-2.5 text-xs text-ink-700">
              {settings.usdtAddress}
            </p>
            <button
              type="button"
              onClick={copyAddress}
              aria-label="Copy wallet address"
              className="grid w-12 shrink-0 place-items-center rounded-xl bg-brand-500 text-white transition-colors duration-150 ease-smooth hover:bg-brand-600">
              
              <CopyIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <TextField
              label="Amount (USDT)"
              type="number"
              min={settings.minRechargeUsdt}
              step="0.01"
              inputMode="decimal"
              value={usdt}
              onChange={(event) => setUsdt(event.target.value)}
              hint={`1 USDT = ${settings.pointsPerUsdt} coins · minimum ${settings.minRechargeUsdt} USDT`} />
            
            <div className="flex items-center justify-between rounded-xl bg-surface-sunken px-4 py-3">
              <span className="text-xs text-ink-500">You will receive</span>
              <span className="font-display text-lg font-extrabold tabular-nums text-ink-900">
                {formatPoints(points)} coins
              </span>
            </div>
            <TextField
              label="Transaction reference number (required)"
              placeholder="Paste the TRC20 transaction hash"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              required />
            
          </div>

          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl bg-win-red/10 px-3 py-2.5 text-xs font-semibold leading-relaxed text-win-red">
            
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            The transaction reference number must be included. Recharges submitted without a valid
            reference number cannot be verified or credited.
          </p>

          <Button block size="lg" className="mt-4" onClick={submit} disabled={submitting}>
            {submitting ? 'Submitting transfer…' : 'Transfer Finish'}
          </Button>
        </section>

        <ol className="mt-4 space-y-2 px-1 text-xs leading-relaxed text-ink-500">
          <li>
            1. The USDT recharge amount must be greater than or equal to{' '}
            <strong className="text-win-red">{settings.minRechargeUsdt} USDT</strong>.
          </li>
          <li>
            2. Transfer USDT to the wallet address above, paste the transaction reference number,
            then tap Transfer Finish. Your request goes to the admin review queue.
          </li>
          <li>
            3. Coins are credited as soon as an administrator confirms the transaction on-chain.
          </li>
        </ol>
      </main>
    </>);

}