import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MinusIcon, PlusIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { BetSelection, GameMode, RoundDuration } from '../../types';
import {
  displayMultiplier,
  durationLabel,
  formatPoints,
  selectionLabel,
} from '../../utils/game';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/Button';

interface BetSheetProps {
  mode: GameMode;
  duration: RoundDuration;
  periodId: string;
  selection: BetSelection | null;
  onClose: () => void;
}

const baseAmounts = [10, 50, 100, 500];
const quantityPresets = [1, 5, 10, 20, 30, 50];

export function BetSheet({ mode, duration, periodId, selection, onClose }: BetSheetProps) {
  const { placeBet, user, settings } = useApp();
  const [base, setBase] = useState(baseAmounts[0]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (selection) {
      setBase(baseAmounts[0]);
      setQuantity(1);
    }
  }, [selection]);

  const total = base * quantity;
  const multiplier = selection ? displayMultiplier(selection) : 0;

  function handleQuantityChange(val: number) {
    const valid = Math.max(1, Math.min(1000, Math.floor(val)));
    setQuantity(valid);
  }

  async function submit() {
    if (!selection) return;
    if (total < settings.minStake) {
      toast.error(`Minimum stake is ${settings.minStake} points.`);
      return;
    }
    const result = await placeBet(mode, duration, selection, total);
    if (result.ok) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <AnimatePresence>
      {selection ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        >
          <button
            type="button"
            aria-label="Close bet panel"
            onClick={onClose}
            className="absolute inset-0 bg-ink-900/40"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Place bet on ${selectionLabel(selection)}`}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-[430px] rounded-t-3xl bg-white p-5 pb-7 shadow-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-bold text-ink-900">
                  {selectionLabel(selection)}
                </p>
                <p className="text-xs text-ink-500">
                  {mode} {durationLabel(duration)} · period {periodId} · pays {multiplier}×
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-500 transition-colors duration-150 ease-smooth hover:bg-ink-900/5"
              >
                <XIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Base Amount Selector */}
            <fieldset className="mt-5">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                Base Amount
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {baseAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBase(value)}
                    aria-pressed={base === value}
                    className={[
                      'h-10 rounded-xl text-sm font-bold transition-colors duration-150 ease-smooth',
                      base === value
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'bg-surface-sunken text-ink-700 hover:bg-brand-50',
                    ].join(' ')}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Quantity Stepper & Preset Buttons */}
            <fieldset className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <legend className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Quantity Multiplier
                </legend>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="grid h-7 w-7 place-items-center rounded-lg bg-surface-sunken text-ink-700 disabled:opacity-40 hover:bg-brand-50"
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    className="w-14 rounded-lg border border-ink-300/40 py-0.5 text-center text-sm font-bold text-ink-900 outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    aria-label="Increase quantity"
                    className="grid h-7 w-7 place-items-center rounded-lg bg-surface-sunken text-ink-700 hover:bg-brand-50"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {quantityPresets.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQuantity(value)}
                    aria-pressed={quantity === value}
                    className={[
                      'h-9 rounded-lg text-xs font-bold transition-colors duration-150 ease-smooth',
                      quantity === value
                        ? 'bg-brand-500 text-white'
                        : 'bg-surface-sunken text-ink-700 hover:bg-brand-50',
                    ].join(' ')}
                  >
                    ×{value}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Total summary */}
            <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-sunken px-4 py-3">
              <span className="text-xs text-ink-500">
                Balance {formatPoints(user?.balance ?? 0)} · min {settings.minStake}
              </span>
              <span className="font-display text-xl font-extrabold text-brand-600">
                {formatPoints(total)} pts
              </span>
            </div>

            <Button block size="lg" className="mt-4" onClick={submit}>
              Confirm bet · win up to {formatPoints(total * multiplier)}
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}