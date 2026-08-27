/**
 * Supabase Database service layer.
 * All PostgreSQL operations for users, transactions, bets, rounds, and settings.
 */
import { supabase } from '../supabase';
import type {
  Bet,
  PlatformSettings,
  Round,
  Transaction,
  User,
} from '../types';

/** Helper to remove undefined fields */
function sanitize<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/* ─────────────────────────────── Users ────────────────────────────── */

/** Create a new user profile in database */
export async function createUserDoc(uid: string, data: Omit<User, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('users')
    .insert([
      {
        id: uid,
        name: data.name,
        email: data.email,
        email_verified: data.emailVerified,
        balance: data.balance,
        bonus: data.bonus,
        promo_code: data.promoCode,
        invited_by: data.invitedBy,
        created_at: data.createdAt,
      },
    ]);

  if (error) throw new Error(error.message);
}

/** Get a user profile */
export async function getUserDoc(uid: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);

  return data
    ? {
        id: data.id,
        name: data.name,
        email: data.email,
        emailVerified: data.email_verified,
        password: '', // Not stored in DB
        balance: Number(data.balance),
        bonus: Number(data.bonus),
        promoCode: data.promo_code,
        invitedBy: data.invited_by,
        createdAt: data.created_at,
      }
    : null;
}

/** Update user profile fields */
export async function updateUserDoc(
  uid: string,
  patch: Partial<Omit<User, 'id'>>,
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (patch.name !== undefined) updateData.name = patch.name;
  if (patch.balance !== undefined) updateData.balance = patch.balance;
  if (patch.bonus !== undefined) updateData.bonus = patch.bonus;
  if (patch.emailVerified !== undefined) updateData.email_verified = patch.emailVerified;

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', uid);

  if (error) throw new Error(error.message);
}

/** Subscribe to all users (for admin) */
export function subscribeUsers(onChange: (users: User[]) => void): () => void {
  // Initial fetch
  fetchAllUsers(onChange);

  // Subscribe to changes using postgres_changes
  const channel = supabase
    .channel('users_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      () => {
        fetchAllUsers(onChange);
      },
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

async function fetchAllUsers(onChange: (users: User[]) => void) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch users:', error);
    return;
  }

  onChange(
    (data || []).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.email_verified,
      password: '', // Not stored in DB
      balance: Number(user.balance),
      bonus: Number(user.bonus),
      promoCode: user.promo_code,
      invitedBy: user.invited_by,
      createdAt: user.created_at,
    })),
  );
}

/** Subscribe to own user profile */
export function subscribeOwnUser(
  uid: string,
  onChange: (user: User | null) => void,
): () => void {
  // Initial fetch
  getUserDoc(uid)
    .then(onChange)
    .catch((err) => {
      console.warn('Could not fetch user profile:', err);
      onChange(null);
    });

  // Subscribe to changes
  const channel = supabase
    .channel(`user_${uid}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${uid}` },
      (payload) => {
        onChange(mapUser(payload.new));
      },
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/* ─────────────────────────────── Transactions ─────────────────────── */

/** Create a new transaction */
export async function createTransaction(
  data: Omit<Transaction, 'id'>,
): Promise<string> {
  const { data: result, error } = await supabase
    .from('transactions')
    .insert([
      {
        user_id: data.userId,
        user_name: data.userName,
        type: data.type,
        amount: data.amount,
        status: data.status,
        method: data.method,
        reference: data.reference,
        note: data.note,
        created_at: data.createdAt,
      },
    ])
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return result.id;
}

/** Update transaction status */
export async function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, 'id'>>,
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (patch.status !== undefined) updateData.status = patch.status;
  if (patch.note !== undefined) updateData.note = patch.note;

  const { error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Subscribe to all transactions (for admin) */
export function subscribeTransactions(
  onChange: (txs: Transaction[]) => void,
): () => void {
  fetchAllTransactions(onChange);

  const channel = supabase
    .channel('transactions_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      () => {
        fetchAllTransactions(onChange);
      },
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

async function fetchAllTransactions(onChange: (txs: Transaction[]) => void) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Failed to fetch transactions:', error);
    return;
  }

  onChange(
    (data || []).map((tx) => ({
      id: tx.id,
      userId: tx.user_id,
      userName: tx.user_name,
      type: tx.type,
      amount: Number(tx.amount),
      status: tx.status,
      method: tx.method,
      reference: tx.reference,
      note: tx.note,
      createdAt: tx.created_at,
    })),
  );
}

/* ─────────────────────────────── Bets ────────────────────────────── */

/**
 * Fetch ALL pending bets for a specific periodId directly from the database.
 * Used at settlement time to guarantee the complete pool — avoids relying on
 * the potentially stale in-memory subscription snapshot.
 */
export async function fetchPendingBetsByPeriod(periodId: string): Promise<Bet[]> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('period_id', periodId)
    .eq('status', 'pending');

  if (error) {
    console.error('fetchPendingBetsByPeriod error:', error);
    return [];
  }

  return (data || []).map((bet) => ({
    id: bet.id,
    userId: bet.user_id,
    periodId: bet.period_id,
    mode: bet.mode,
    duration: bet.duration,
    selection: bet.selection,
    amount: Number(bet.amount),
    multiplier: Number(bet.multiplier),
    payout: Number(bet.payout),
    status: bet.status,
    createdAt: bet.created_at,
  }));
}

/** Create a new bet */
export async function createBet(data: Omit<Bet, 'id'>): Promise<string> {
  const { data: result, error } = await supabase
    .from('bets')
    .insert([
      {
        user_id: data.userId,
        user_name: '', // Not required, can be populated from users table if needed
        mode: data.mode,
        duration: data.duration,
        period_id: data.periodId,
        selection: data.selection,
        amount: data.amount,
        status: data.status,
        multiplier: data.multiplier,
        payout: data.payout,
        created_at: data.createdAt,
      },
    ])
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return result.id;
}

/** Subscribe to all bets (for admin and round settling) */
export function subscribeBets(onChange: (bets: Bet[]) => void): () => void {
  fetchAllBets(onChange);

  const channel = supabase
    .channel('bets_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bets' },
      () => {
        fetchAllBets(onChange);
      },
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

async function fetchAllBets(onChange: (bets: Bet[]) => void) {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('Failed to fetch bets:', error);
    return;
  }

  onChange(
    (data || []).map((bet) => ({
      id: bet.id,
      userId: bet.user_id,
      periodId: bet.period_id,
      mode: bet.mode,
      duration: bet.duration,
      selection: bet.selection,
      amount: Number(bet.amount),
      multiplier: Number(bet.multiplier),
      payout: Number(bet.payout),
      status: bet.status,
      createdAt: bet.created_at,
    })),
  );
}

/** Batch update multiple bets */
export async function batchUpdateBets(
  updates: Array<{ id: string; patch: Partial<Omit<Bet, 'id'>> }>,
): Promise<void> {
  for (const { id, patch } of updates) {
    const updateData: Record<string, unknown> = {};

    if (patch.multiplier !== undefined) updateData.multiplier = patch.multiplier;
    if (patch.payout !== undefined) updateData.payout = patch.payout;
    if (patch.status !== undefined) updateData.status = patch.status;

    const { error } = await supabase
      .from('bets')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}

/* ─────────────────────────────── Rounds ────────────────────────────────── */

/** Create/update a settled round */
export async function createRound(data: Round): Promise<void> {
  const { error } = await supabase
    .from('rounds')
    .upsert(
      {
        period_id: data.periodId,
        mode: data.mode,
        duration: data.duration,
        digit: data.digit,
        colors: data.colors,
        price: data.price,
        settled_at: data.settledAt,
      },
      { onConflict: 'period_id' },
    );

  if (error) throw new Error(error.message);
}

/** Subscribe to latest rounds */
export function subscribeRounds(onChange: (rounds: Round[]) => void): () => void {
  fetchAllRounds(onChange);

  const channel = supabase
    .channel('rounds_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rounds' },
      () => {
        fetchAllRounds(onChange);
      },
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

async function fetchAllRounds(onChange: (rounds: Round[]) => void) {
  const { data, error } = await supabase
    .from('rounds')
    .select('*')
    .order('settled_at', { ascending: false })
    .limit(400);

  if (error) {
    console.error('Failed to fetch rounds:', error);
    return;
  }

  onChange(
    (data || []).map((round) => ({
      periodId: round.period_id,
      mode: round.mode,
      duration: round.duration,
      digit: round.digit,
      colors: round.colors,
      price: Number(round.price),
      settledAt: round.settled_at,
    })),
  );
}

/* ─────────────────────────────── Settings ─────────────────────────────── */

/** Get platform settings */
export async function getSettings(): Promise<PlatformSettings | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'platform')
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);

  if (!data) return null;

  const rawRate = Number(data.points_per_usdt);
  const pointsPerUsdt = (!rawRate || rawRate === 10) ? 100 : rawRate;

  return {
    houseMargin: Number(data.house_margin || 0.18),
    randomness: Number(data.randomness || 0.45),
    forcedDigit: data.forced_digit,
    minStake: Number(data.min_stake || 10),
    usdtAddress: data.usdt_trc20_address || '',
    pointsPerUsdt,
    minRechargeUsdt: Number(data.min_recharge_usdt || 10),
    maintenance: data.maintenance || false,
  };
}

/** Subscribe to settings changes */
export function subscribeSettings(
  onChange: (settings: PlatformSettings) => void,
  defaultSettings: PlatformSettings,
): () => void {
  getSettings()
    .then((settings) => {
      onChange(settings || defaultSettings);
    })
    .catch((err) => {
      console.warn('Could not fetch settings:', err);
      onChange(defaultSettings);
    });

  const channel = supabase
    .channel('settings_changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'settings', filter: `id=eq.platform` },
      (payload) => {
        onChange(mapSettings(payload.new, defaultSettings));
      },
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/** Update settings */
export async function updateSettings(
  patch: Partial<PlatformSettings>,
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (patch.maintenance !== undefined) updateData.maintenance = patch.maintenance;
  if (patch.forcedDigit !== undefined) updateData.forced_digit = patch.forcedDigit;
  if (patch.minStake !== undefined) updateData.min_stake = patch.minStake;
  if (patch.houseMargin !== undefined) updateData.house_margin = patch.houseMargin;
  if (patch.randomness !== undefined) updateData.randomness = patch.randomness;
  if (patch.pointsPerUsdt !== undefined) updateData.points_per_usdt = patch.pointsPerUsdt;
  if (patch.usdtAddress !== undefined) updateData.usdt_trc20_address = patch.usdtAddress;
  if (patch.minRechargeUsdt !== undefined) updateData.min_recharge_usdt = patch.minRechargeUsdt;

  const { error } = await supabase
    .from('settings')
    .update(updateData)
    .eq('id', 'platform');

  if (error) throw new Error(error.message);
}

/* ─────────────────────────────── Helpers ────────────────────────────────── */

function mapUser(data: any): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    emailVerified: data.email_verified,
    password: '', // Not stored in DB
    balance: Number(data.balance),
    bonus: Number(data.bonus),
    promoCode: data.promo_code,
    invitedBy: data.invited_by,
    createdAt: data.created_at,
  };
}

function mapSettings(data: any, defaults: PlatformSettings): PlatformSettings {
  const rawRate = data.points_per_usdt !== undefined ? Number(data.points_per_usdt) : defaults.pointsPerUsdt;
  const pointsPerUsdt = (!rawRate || rawRate === 10) ? 100 : rawRate;

  return {
    houseMargin: Number(data.house_margin ?? defaults.houseMargin),
    randomness: Number(data.randomness ?? defaults.randomness),
    forcedDigit: data.forced_digit ?? defaults.forcedDigit,
    minStake: Number(data.min_stake ?? defaults.minStake),
    usdtAddress: data.usdt_trc20_address ?? defaults.usdtAddress,
    pointsPerUsdt,
    minRechargeUsdt: Number(data.min_recharge_usdt ?? defaults.minRechargeUsdt),
    maintenance: data.maintenance ?? defaults.maintenance,
  };
}
