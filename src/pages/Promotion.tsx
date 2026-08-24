import React, { useMemo, useState } from 'react';
import { CopyIcon, UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { useApp } from '../contexts/AppContext';
import { formatPoints } from '../utils/game';

export function Promotion() {
  const { user, referrals, applyBonusToBalance } = useApp();
  const [level, setLevel] = useState<1 | 2>(1);

  const promoCode = user?.promoCode ?? '000000';
  const promoLink = `https://prismaplay.io/#/register?code=${promoCode}`;

  const list = useMemo(
    () => referrals.filter((referral) => referral.level === level),
    [referrals, level]
  );
  const contribution = list.reduce((sum, referral) => sum + referral.contribution, 0);

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error('Copy failed — select the text manually.');
    }
  }

  async function apply() {
    const result = await applyBonusToBalance();
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }

  return (
    <>
      <TopBar />
      <main className="flex-1 overflow-y-auto px-3 pb-8 pt-3">
        <section aria-label="Referral bonus" className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
                Bonus
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-win-gold">
                {formatPoints(user?.bonus ?? 0)}
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-500 text-white">
              <UsersIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <Button block size="lg" className="mt-4" onClick={apply}>
            Apply all to Balance
          </Button>
        </section>

        <section aria-label="Referral levels" className="mt-3 rounded-2xl bg-white p-4 shadow-card">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-surface-sunken p-1">
            {([1, 2] as const).map((option) =>
            <button
              key={option}
              type="button"
              onClick={() => setLevel(option)}
              aria-pressed={level === option}
              className={`h-9 rounded-full text-sm font-bold transition-colors duration-150 ease-smooth ${
              level === option ? 'bg-brand-500 text-white' : 'text-ink-500'}`
              }>
              
                Level {option}
              </button>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div>
              <dt className="text-xs text-ink-500">Total People</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-win-gold">
                {list.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Contribution</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-win-gold">
                {formatPoints(contribution)}
              </dd>
            </div>
          </dl>

          {list.length ?
          <ul className="mt-3 divide-y divide-ink-300/30 border-t border-ink-300/30 pt-1">
              {list.map((referral) =>
            <li key={referral.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <span className="block font-semibold text-ink-900">{referral.name}</span>
                    <span className="text-xs text-ink-500">
                      joined {format(new Date(referral.joinedAt), 'dd MMM')}
                    </span>
                  </span>
                  <span className="font-bold tabular-nums text-win-green">
                    +{formatPoints(referral.contribution)}
                  </span>
                </li>
            )}
            </ul> :

          <p className="mt-4 text-center text-sm text-ink-500">
              No level {level} invites yet. Share your link to start earning.
            </p>
          }
        </section>

        <section aria-label="Promotion links" className="mt-3 grid gap-4 rounded-2xl bg-white p-4 shadow-card">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
              My Promotion Code
            </p>
            <div className="flex items-stretch gap-2">
              <p className="flex-1 rounded-xl border border-ink-300/40 px-3 py-2.5 text-sm font-bold tabular-nums text-ink-900">
                {promoCode}
              </p>
              <button
                type="button"
                onClick={() => copy(promoCode, 'Promotion code')}
                aria-label="Copy promotion code"
                className="grid w-12 place-items-center rounded-xl bg-brand-500 text-white transition-colors duration-150 ease-smooth hover:bg-brand-600">
                
                <CopyIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
              My Promotion Link
            </p>
            <div className="flex items-stretch gap-2">
              <p className="min-w-0 flex-1 break-all rounded-xl border border-ink-300/40 px-3 py-2.5 text-xs text-ink-700">
                {promoLink}
              </p>
              <button
                type="button"
                onClick={() => copy(promoLink, 'Promotion link')}
                aria-label="Copy promotion link"
                className="grid w-12 shrink-0 place-items-center rounded-xl bg-brand-500 text-white transition-colors duration-150 ease-smooth hover:bg-brand-600">
                
                <CopyIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-ink-500">
            Level 1 invites earn 1% of every settled bet, level 2 invites earn 0.3%. Commission is
            credited to your bonus balance in real time.
          </p>
        </section>
      </main>
    </>);

}