/**
 * Domain models. These mirror the intended backend collections/tables one-to-one:
 *
 *  users            -> User
 *  transactions     -> Transaction
 *  bets             -> Bet
 *  rounds           -> Round
 *  settings         -> OddsConfig / PlatformSettings
 */

export type GameMode = 'Parity' | 'Sapre' | 'Bcone' | 'Emerd';

/** Draw interval in minutes. Players choose between the 1 Min and 3 Min tables. */
export type RoundDuration = 1 | 3;

export type WinColor = 'green' | 'violet' | 'red';

export type BetSelection =
{kind: 'color';color: WinColor;} |
{kind: 'number';digit: number;};

export type BetStatus = 'pending' | 'won' | 'lost';

export interface Bet {
  id: string;
  userId: string;
  periodId: string;
  mode: GameMode;
  duration: RoundDuration;
  selection: BetSelection;
  amount: number;
  multiplier: number;
  payout: number;
  status: BetStatus;
  createdAt: number;
}

export interface Round {
  periodId: string;
  mode: GameMode;
  duration: RoundDuration;
  price: number;
  digit: number;
  colors: WinColor[];
  settledAt: number;
}

export type TransactionType =
'recharge' |
'withdrawal' |
'bet' |
'payout' |
'commission';

export type TransactionStatus =
'pending' |
'approved' |
'rejected' |
'completed';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  method: string;
  reference?: string;
  note?: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  password: string;
  balance: number;
  bonus: number;
  promoCode: string;
  invitedBy?: string;
  createdAt: number;
}

export interface Referral {
  id: string;
  name: string;
  level: 1 | 2;
  joinedAt: number;
  contribution: number;
}

/** Configurable house / odds engine settings, owned by the admin panel. */
export interface OddsConfig {
  /** Target house edge, 0–0.4. Higher pushes outcomes toward the lowest payout. */
  houseMargin: number;
  /** 0–1. How much pure chance is mixed into the payout-minimising choice. */
  randomness: number;
  /** Admin override for the next settled period. */
  forcedDigit: number | null;
  /** Minimum accepted stake, in points. */
  minStake: number;
}

export interface PlatformSettings extends OddsConfig {
  usdtAddress: string;
  /** Points credited per 1 USDT received. */
  pointsPerUsdt: number;
  /** Minimum recharge, in USDT. */
  minRechargeUsdt: number;
  maintenance: boolean;
}