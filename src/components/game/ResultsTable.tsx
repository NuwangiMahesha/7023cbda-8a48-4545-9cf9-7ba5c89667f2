import React from 'react';
import { Round } from '../../types';
import { ResultDots } from './ResultBall';
import { colorsForDigit } from '../../utils/game';

const digitTone: Record<string, string> = {
  green: 'text-win-green',
  red: 'text-win-red',
  violet: 'text-win-violet'
};

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr className={index % 2 === 0 ? 'bg-surface-sunken/70' : 'bg-white'}>
      <td className="py-2.5 pl-4"><div className="h-3 w-32 rounded bg-ink-200/60 animate-pulse" /></td>
      <td className="py-2.5 text-right"><div className="h-3 w-12 rounded bg-ink-200/60 animate-pulse ml-auto" /></td>
      <td className="py-2.5 text-right"><div className="h-3 w-4 rounded bg-ink-200/60 animate-pulse ml-auto" /></td>
      <td className="py-2.5 pr-4 text-right"><div className="h-3 w-10 rounded bg-ink-200/60 animate-pulse ml-auto" /></td>
    </tr>
  );
}

export function ResultsTable({ rounds, loading }: { rounds: Round[]; loading?: boolean }) {
  if (loading) {
    return (
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Loading results…</caption>
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ink-500">
            <th scope="col" className="py-2.5 pl-4 text-left font-semibold">Period</th>
            <th scope="col" className="py-2.5 text-right font-semibold">Price</th>
            <th scope="col" className="py-2.5 text-right font-semibold">Number</th>
            <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Result</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} index={i} />)}
        </tbody>
      </table>
    );
  }

  if (!rounds.length) {
    return (
      <p className="px-4 py-10 text-center text-sm text-ink-500">
        No settled periods yet — the first result lands when the countdown hits zero.
      </p>
    );
  }

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Recent period results</caption>
      <thead>
        <tr className="text-xs uppercase tracking-wide text-ink-500">
          <th scope="col" className="py-2.5 pl-4 text-left font-semibold">Period</th>
          <th scope="col" className="py-2.5 text-right font-semibold">Price</th>
          <th scope="col" className="py-2.5 text-right font-semibold">Number</th>
          <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Result</th>
        </tr>
      </thead>
      <tbody>
        {rounds.map((round, index) => {
          const colors = colorsForDigit(round.digit);
          return (
            <tr
              key={round.periodId}
              className={index % 2 === 0 ? 'bg-surface-sunken/70' : 'bg-white'}>
              <td className="py-2.5 pl-4 font-medium tabular-nums text-ink-700">
                {round.periodId}
              </td>
              <td className="py-2.5 text-right tabular-nums text-ink-700">{round.price}</td>
              <td className={`py-2.5 text-right font-bold tabular-nums ${digitTone[colors[0]]}`}>
                {round.digit}
              </td>
              <td className="py-2.5 pr-4 text-right">
                <span className="inline-flex justify-end">
                  <ResultDots colors={colors} />
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}