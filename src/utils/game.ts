import {
  BetSelection,
  GameMode,
  OddsConfig,
  RoundDuration,
  WinColor } from
'../types';

export const GAME_MODES: GameMode[] = ['Parity', 'Sapre', 'Bcone', 'Emerd'];

export const ROUND_DURATIONS: RoundDuration[] = [1, 3];

export function durationLabel(duration: RoundDuration): string {
  return `${duration} Min`;
}

/** Standard Win Go colour mapping. 0 and 5 carry violet alongside their base colour. */
export function colorsForDigit(digit: number): WinColor[] {
  if (digit === 0) return ['red', 'violet'];
  if (digit === 5) return ['green', 'violet'];
  return digit % 2 === 1 ? ['green'] : ['red'];
}

/** Payout multiplier for a selection given a settled digit. 0 means the bet lost. */
export function multiplierFor(selection: BetSelection, digit: number): number {
  const colors = colorsForDigit(digit);
  if (selection.kind === 'number') {
    return selection.digit === digit ? 9 : 0;
  }
  if (selection.color === 'violet') {
    return colors.includes('violet') ? 4.5 : 0;
  }
  if (!colors.includes(selection.color)) return 0;
  // A violet-carrying digit pays the base colour at a reduced rate.
  return colors.includes('violet') ? 1.5 : 2;
}

/** Advertised multiplier shown on the betting buttons, before settlement. */
export function displayMultiplier(selection: BetSelection): number {
  if (selection.kind === 'number') return 9;
  return selection.color === 'violet' ? 4.5 : 2;
}

export function selectionLabel(selection: BetSelection): string {
  if (selection.kind === 'number') return `Number ${selection.digit}`;
  return selection.color.charAt(0).toUpperCase() + selection.color.slice(1);
}

function pad(value: number, size: number): string {
  return String(value).padStart(size, '0');
}

/**
 * Period ids look like 202312201306 — YYYYMMDD, the draw interval, then the
 * sequence number of that draw within the day (offset per game mode).
 */
export function periodIdFor(
date: Date,
mode: GameMode,
duration: RoundDuration)
: string {
  const minuteIndex = date.getHours() * 60 + date.getMinutes();
  const sequence =
  Math.floor(minuteIndex / duration) + GAME_MODES.indexOf(mode) * 2000;
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(
    date.getDate(),
    2
  )}`;
  return `${day}${duration}${pad(sequence, 4)}`;
}

/** Index of the draw block a timestamp falls into, for a given interval. */
export function blockIndexFor(now: number, duration: RoundDuration): number {
  return Math.floor(now / (duration * 60000));
}

export function blockStart(block: number, duration: RoundDuration): Date {
  return new Date(block * duration * 60000);
}

export function secondsRemaining(now: number, duration: RoundDuration): number {
  const total = duration * 60;
  return total - Math.floor(now / 1000) % total;
}

export function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad(m, 2)}:${pad(s, 2)}`;
}

export interface PoolStake {
  selection: BetSelection;
  amount: number;
}

/**
 * House odds engine.
 *
 * For every candidate digit we compute what the house would have to pay out.
 * Outcomes are then weighted so that low-payout digits are far more likely,
 * scaled by `houseMargin`, and softened by `randomness` so results stay
 * plausibly random rather than obviously rigged. With an empty pool the draw
 * is uniform.
 */
export function resolveDigit(pool: PoolStake[], config: OddsConfig): number {
  if (config.forcedDigit !== null && config.forcedDigit >= 0) {
    return config.forcedDigit;
  }

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const payouts = digits.map((digit) =>
  pool.reduce(
    (sum, stake) => sum + stake.amount * multiplierFor(stake.selection, digit),
    0
  )
  );

  const totalStaked = pool.reduce((sum, stake) => sum + stake.amount, 0);
  if (totalStaked === 0) return digits[Math.floor(Math.random() * 10)];

  const maxPayout = Math.max(...payouts, 1);
  const bias = Math.min(Math.max(config.houseMargin, 0), 0.4) / 0.4;
  const chance = Math.min(Math.max(config.randomness, 0), 1);

  const weights = payouts.map((payout) => {
    const favour = 1 - payout / maxPayout; // 1 = cheapest outcome for the house
    const weighted = 0.05 + Math.pow(favour, 1 + bias * 3);
    return chance + (1 - chance) * weighted;
  });

  const total = weights.reduce((sum, w) => sum + w, 0);
  let ticket = Math.random() * total;
  for (let i = 0; i < digits.length; i += 1) {
    ticket -= weights[i];
    if (ticket <= 0) return digits[i];
  }
  return digits[digits.length - 1];
}

/** Synthetic "price" shown in the trend column, deterministic per period. */
export function priceForPeriod(periodId: string, digit: number): number {
  let hash = 0;
  for (let i = 0; i < periodId.length; i += 1) {
    hash = (hash * 31 + periodId.charCodeAt(i)) % 100000;
  }
  return 30000 + (hash + digit * 977) % 9999;
}

export function formatPoints(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
}