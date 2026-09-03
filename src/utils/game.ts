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

/** Helper to normalize any format of selection into BetSelection safely */
export function normalizeSelection(raw: unknown): BetSelection {
  if (!raw) return { kind: 'number', digit: 0 };
  if (typeof raw === 'string') {
    if (raw.startsWith('{')) {
      try {
        return normalizeSelection(JSON.parse(raw));
      } catch {}
    }
    const lower = raw.toLowerCase().trim();
    if (['green', 'violet', 'red'].includes(lower)) {
      return { kind: 'color', color: lower as WinColor };
    }
    const num = Number(lower.replace(/\D/g, ''));
    if (!isNaN(num)) {
      return { kind: 'number', digit: num };
    }
    return { kind: 'color', color: 'green' };
  }
  if (typeof raw === 'number') {
    return { kind: 'number', digit: raw };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.kind === 'number' || typeof obj.digit === 'number') {
    return { kind: 'number', digit: Number(obj.digit ?? 0) };
  }
  if (obj.kind === 'color' || obj.color) {
    const c = String(obj.color || 'green').toLowerCase();
    return { kind: 'color', color: (['green', 'violet', 'red'].includes(c) ? c : 'green') as WinColor };
  }
  return { kind: 'color', color: 'green' };
}

/** Payout multiplier for a selection given a settled digit. 0 means the bet lost. */
export function multiplierFor(selection: BetSelection | unknown, digit: number): number {
  const norm = normalizeSelection(selection);
  const colors = colorsForDigit(digit);
  if (norm.kind === 'number') {
    return norm.digit === digit ? 4.5 : 0;
  }
  if (norm.color === 'violet') {
    return colors.includes('violet') ? 4.5 : 0;
  }
  if (!colors.includes(norm.color)) return 0;
  // A violet-carrying digit pays the base colour at a reduced rate.
  return colors.includes('violet') ? 1.45 : 1.95;
}

/** Advertised multiplier shown on the betting buttons, before settlement. */
export function displayMultiplier(selection: BetSelection | unknown): number {
  const norm = normalizeSelection(selection);
  if (norm.kind === 'number') return 4.5;
  return norm.color === 'violet' ? 4.5 : 1.95;
}

export function selectionLabel(selection: BetSelection | unknown): string {
  if (!selection) return 'Selection';
  const norm = normalizeSelection(selection);
  if (norm.kind === 'number') return `Number ${norm.digit}`;
  if (norm.color && typeof norm.color === 'string') {
    return norm.color.charAt(0).toUpperCase() + norm.color.slice(1);
  }
  return 'Selection';
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
 * Winning digit algorithm — three rules in priority order:
 *
 * RULE 1 – Admin override.
 *
 * RULE 2 – Red === Green tie-breaker: when the TOTAL coins bet on Red equals
 *   the total coins bet on Green (both non-zero), Violet ALWAYS wins (0 or 5).
 *
 * RULE 3 – Lowest coin-total side wins: compare total coins on Red vs Green
 *   directly. Whichever colour has FEWER coins wins.
 *   Example: Red = 100 coins, Green = 200 coins → Red wins.
 *   Example: Red = 200 coins, Green = 100 coins → Green wins.
 *
 * If only number/violet bets exist (no colour bets), falls back to the
 * payout-minimising algorithm so those bets are still settled fairly.
 */
export function resolveDigit(pool: PoolStake[], config: OddsConfig): number {
  // RULE 1 — Admin manual override
  if (config.forcedDigit !== null && config.forcedDigit >= 0 && config.forcedDigit <= 9) {
    return config.forcedDigit;
  }

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const pick = (arr: number[]) => arr[Math.floor(Math.random() * arr.length)];

  // Empty pool → random
  if (!pool || pool.length === 0) return pick(digits);

  const totalStaked = pool.reduce((sum, s) => sum + (s.amount || 0), 0);
  if (totalStaked === 0) return pick(digits);

  // 1. Calculate the true payout for every digit
  const payouts = digits.map((digit) =>
    pool.reduce((sum, s) => sum + s.amount * multiplierFor(s.selection, digit), 0)
  );

  // 2. Calculate a "simulated" payout where Red/Green bets are always treated as 1.95x
  // This prevents the algorithm from always picking Violet (0/5) just to save the 0.5x margin.
  const simulatedPayouts = digits.map((digit) =>
    pool.reduce((sum, s) => {
      const norm = normalizeSelection(s.selection);
      let mult = multiplierFor(s.selection, digit);
      // If it's a color bet and it won on a violet digit, pretend it pays 1.95
      if (norm.kind === 'color' && ['red', 'green'].includes(norm.color) && mult === 1.45) {
        mult = 1.95;
      }
      return sum + s.amount * mult;
    }, 0)
  );

  // 3. Find the lowest simulated payout
  const minSimulated = Math.min(...simulatedPayouts);
  let bestDigits = digits.filter((d) => simulatedPayouts[d] === minSimulated);

  // 4. Tie-breaker rule for Red === Green exactly (e.g. 100 vs 100 on colors)
  // If simulated payouts are equal across Red and Green digits, and there are active color bets,
  // we strictly force Violet (0 or 5).
  let redTotal = 0;
  let greenTotal = 0;
  for (const s of pool) {
    const norm = normalizeSelection(s.selection);
    if (norm.kind === 'color') {
      if (norm.color === 'red') redTotal += s.amount;
      if (norm.color === 'green') greenTotal += s.amount;
    }
  }
  if (redTotal > 0 && greenTotal > 0 && redTotal === greenTotal) {
    bestDigits = bestDigits.filter(d => d === 0 || d === 5);
    // Fallback if numbers skewed it so 0/5 aren't in bestDigits anymore
    if (bestDigits.length === 0) bestDigits = [0, 5];
  }

  return pick(bestDigits);
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