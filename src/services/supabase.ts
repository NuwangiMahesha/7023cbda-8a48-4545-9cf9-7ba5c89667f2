/**
 * Supabase Service Layer.
 * Provides real-time subscriptions and CRUD operations backed by Supabase PostgreSQL.
 * Unlimited reads and writes with zero daily quota locks.
 */
import { supabase } from '../supabase';
import type {
  Bet,
  PlatformSettings,
  Round,
  Transaction,
  User,
} from '../types';

/* ─────────────────────────────── Realtime Listeners ──────────────────────── */

export function subscribeUsers(onChange: (users: User[]) => void) {
  async function fetchUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      onChange(
        data.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.email_verified,
          balance: Number(u.balance || 0),
          bonus: Number(u.bonus || 0),
          promoCode: u.promo_code,
          invitedBy: u.invited_by,
          createdAt: Number(u.created_at || Date.now()),
        }))
      );
    }
  }

  fetchUsers();

  const channel = supabase
    .channel('public:users')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
      fetchUsers();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeOwnUser(uid: string, onChange: (user: User | null) => void) {
  async function fetchUser() {
    const { data, error } = await supabase.from('users').select('*').eq('id', uid).single();
    if (!error && data) {
      onChange({
        id: data.id,
        name: data.name,
        email: data.email,
        emailVerified: data.email_verified,
        balance: Number(data.balance || 0),
        bonus: Number(data.bonus || 0),
        promoCode: data.promo_code,
        invitedBy: data.invited_by,
        createdAt: Number(data.created_at || Date.now()),
      });
    } else {
      onChange(null);
    }
  }

  fetchUser();

  const channel = supabase
    .channel(`public:users:${uid}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users', filter: `id=eq.${uid}` },
      () => {
        fetchUser();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeTransactions(onChange: (txs: Transaction[]) => void) {
  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      onChange(
        data.map((tx) => ({
          id: tx.id,
          userId: tx.user_id,
          userName: tx.user_name,
          type: tx.type,
          amount: Number(tx.amount || 0),
          status: tx.status,
          method: tx.method,
          reference: tx.reference,
          note: tx.note,
          createdAt: Number(tx.created_at || Date.now()),
        }))
      );
    }
  }

  fetchTransactions();

  const channel = supabase
    .channel('public:transactions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
      fetchTransactions();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeUserBets(userId: string, onChange: (bets: Bet[]) => void) {
  async function fetchUserBets() {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      onChange(
        data.map((b) => ({
          id: b.id,
          userId: b.user_id,
          userName: b.user_name,
          mode: b.mode,
          duration: b.duration,
          periodId: b.period_id,
          selection: b.selection,
          amount: Number(b.amount || 0),
          status: b.status,
          multiplier: Number(b.multiplier || 0),
          payout: Number(b.payout || 0),
          createdAt: Number(b.created_at || Date.now()),
        }))
      );
    }
  }

  fetchUserBets();

  const channel = supabase
    .channel(`public:bets:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => {
      fetchUserBets();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeBets(onChange: (bets: Bet[]) => void) {
  async function fetchBets() {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      onChange(
        data.map((b) => ({
          id: b.id,
          userId: b.user_id,
          userName: b.user_name,
          mode: b.mode,
          duration: b.duration,
          periodId: b.period_id,
          selection: b.selection,
          amount: Number(b.amount || 0),
          status: b.status,
          multiplier: Number(b.multiplier || 0),
          payout: Number(b.payout || 0),
          createdAt: Number(b.created_at || Date.now()),
        }))
      );
    }
  }

  fetchBets();

  const channel = supabase
    .channel('public:bets')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => {
      fetchBets();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeRounds(onChange: (rounds: Round[]) => void) {
  async function fetchRounds() {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .order('settled_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      onChange(
        data.map((r) => ({
          periodId: r.period_id,
          mode: r.mode,
          duration: r.duration,
          digit: r.digit,
          colors: r.colors,
          price: Number(r.price || 0),
          settledAt: Number(r.settled_at || Date.now()),
        }))
      );
    }
  }

  fetchRounds();

  const channel = supabase
    .channel('public:rounds')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, () => {
      fetchRounds();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeSettings(
  onChange: (settings: PlatformSettings) => void,
  defaultSettings: PlatformSettings
) {
  async function fetchSettings() {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'platform').single();
    if (!error && data) {
      onChange({
        maintenance: data.maintenance,
        forcedDigit: data.forced_digit,
        minStake: Number(data.min_stake || defaultSettings.minStake),
        minRechargeUsdt: Number(data.min_recharge_usdt || defaultSettings.minRechargeUsdt),
        pointsPerUsdt: Number(data.points_per_usdt || defaultSettings.pointsPerUsdt),
        usdtTrc20Address: data.usdt_trc20_address || defaultSettings.usdtTrc20Address,
      });
    } else {
      await supabase.from('settings').upsert({
        id: 'platform',
        maintenance: defaultSettings.maintenance,
        forced_digit: defaultSettings.forcedDigit,
        min_stake: defaultSettings.minStake,
        min_recharge_usdt: defaultSettings.minRechargeUsdt,
        points_per_usdt: defaultSettings.pointsPerUsdt,
        usdt_trc20_address: defaultSettings.usdtTrc20Address,
      });
      onChange(defaultSettings);
    }
  }

  fetchSettings();

  const channel = supabase
    .channel('public:settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
      fetchSettings();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/* ─────────────────────────────── CRUD Operations ───────────────────────────── */

export async function createUserDoc(uid: string, data: Omit<User, 'id'>): Promise<void> {
  await supabase.from('users').upsert({
    id: uid,
    name: data.name,
    email: data.email,
    email_verified: data.emailVerified,
    balance: data.balance,
    bonus: data.bonus,
    promo_code: data.promoCode,
    invited_by: data.invitedBy,
    created_at: data.createdAt,
  });
}

export async function getUserDoc(uid: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    emailVerified: data.email_verified,
    balance: Number(data.balance || 0),
    bonus: Number(data.bonus || 0),
    promoCode: data.promo_code,
    invitedBy: data.invited_by,
    createdAt: Number(data.created_at || Date.now()),
  };
}

export async function updateUserDoc(uid: string, patch: Partial<Omit<User, 'id'>>): Promise<void> {
  const updatePayload: Record<string, unknown> = {};
  if (patch.name !== undefined) updatePayload.name = patch.name;
  if (patch.email !== undefined) updatePayload.email = patch.email;
  if (patch.emailVerified !== undefined) updatePayload.email_verified = patch.emailVerified;
  if (patch.balance !== undefined) updatePayload.balance = patch.balance;
  if (patch.bonus !== undefined) updatePayload.bonus = patch.bonus;
  if (patch.promoCode !== undefined) updatePayload.promo_code = patch.promoCode;
  if (patch.invitedBy !== undefined) updatePayload.invited_by = patch.invitedBy;

  await supabase.from('users').update(updatePayload).eq('id', uid);
}

export async function createTransaction(data: Omit<Transaction, 'id'>): Promise<string> {
  const { data: inserted, error } = await supabase
    .from('transactions')
    .insert({
      user_id: data.userId,
      user_name: data.userName,
      type: data.type,
      amount: data.amount,
      status: data.status,
      method: data.method,
      reference: data.reference,
      note: data.note,
      created_at: data.createdAt,
    })
    .select('id')
    .single();

  if (error || !inserted) throw error || new Error('Failed to create transaction');
  return inserted.id;
}

export async function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, 'id'>>
): Promise<void> {
  const updatePayload: Record<string, unknown> = {};
  if (patch.status !== undefined) updatePayload.status = patch.status;
  if (patch.note !== undefined) updatePayload.note = patch.note;

  await supabase.from('transactions').update(updatePayload).eq('id', id);
}

export async function createBet(data: Omit<Bet, 'id'>): Promise<string> {
  const { data: inserted, error } = await supabase
    .from('bets')
    .insert({
      user_id: data.userId,
      user_name: data.userName,
      mode: data.mode,
      duration: data.duration,
      period_id: data.periodId,
      selection: data.selection,
      amount: data.amount,
      status: data.status,
      multiplier: data.multiplier,
      payout: data.payout,
      created_at: data.createdAt,
    })
    .select('id')
    .single();

  if (error || !inserted) throw error || new Error('Failed to create bet');
  return inserted.id;
}

export async function batchUpdateBets(
  updates: Array<{ id: string; patch: Partial<Omit<Bet, 'id'>> }>
): Promise<void> {
  for (const { id, patch } of updates) {
    const updatePayload: Record<string, unknown> = {};
    if (patch.status !== undefined) updatePayload.status = patch.status;
    if (patch.multiplier !== undefined) updatePayload.multiplier = patch.multiplier;
    if (patch.payout !== undefined) updatePayload.payout = patch.payout;

    await supabase.from('bets').update(updatePayload).eq('id', id);
  }
}

export async function createRound(data: Round): Promise<void> {
  await supabase.from('rounds').upsert({
    period_id: data.periodId,
    mode: data.mode,
    duration: data.duration,
    digit: data.digit,
    colors: data.colors,
    price: data.price,
    settled_at: data.settledAt,
  });
}

export async function updateSettings(patch: Partial<PlatformSettings>): Promise<void> {
  const updatePayload: Record<string, unknown> = {};
  if (patch.maintenance !== undefined) updatePayload.maintenance = patch.maintenance;
  if (patch.forcedDigit !== undefined) updatePayload.forced_digit = patch.forcedDigit;
  if (patch.minStake !== undefined) updatePayload.min_stake = patch.minStake;
  if (patch.minRechargeUsdt !== undefined) updatePayload.min_recharge_usdt = patch.minRechargeUsdt;
  if (patch.pointsPerUsdt !== undefined) updatePayload.points_per_usdt = patch.pointsPerUsdt;
  if (patch.usdtTrc20Address !== undefined) updatePayload.usdt_trc20_address = patch.usdtTrc20Address;

  await supabase.from('settings').update(updatePayload).eq('id', 'platform');
}
