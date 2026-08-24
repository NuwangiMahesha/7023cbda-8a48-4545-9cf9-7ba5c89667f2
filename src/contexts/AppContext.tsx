import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState } from
'react';
import {
  Bet,
  BetSelection,
  GameMode,
  PlatformSettings,
  Referral,
  Round,
  RoundDuration,
  Transaction,
  TransactionStatus,
  User } from
'../types';
import {
  adminCredentials,
  defaultSettings,
  seedReferrals,
  seedTransactions,
  seedUsers } from
'../data/seed';
import {
  GAME_MODES,
  ROUND_DURATIONS,
  blockIndexFor,
  blockStart,
  colorsForDigit,
  multiplierFor,
  periodIdFor,
  priceForPeriod,
  resolveDigit } from
'../utils/game';
import { STATE_KEY, readState, writeState } from '../utils/storage';
import { useLeaderTab } from '../hooks/useLeaderTab';

interface ActionResult {
  ok: boolean;
  message: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

interface PersistedState {
  users: User[];
  transactions: Transaction[];
  bets: Bet[];
  rounds: Round[];
  settings: PlatformSettings;
  userId: string | null;
  isAdmin: boolean;
}

interface AppContextValue {
  now: number;
  user: User | null;
  users: User[];
  isAdmin: boolean;
  settings: PlatformSettings;
  transactions: Transaction[];
  bets: Bet[];
  rounds: Round[];
  referrals: Referral[];
  login: (email: string, password: string) => ActionResult;
  sendVerificationCode: (email: string) => ActionResult & {code?: string;};
  register: (input: RegisterInput, code: string) => ActionResult;
  logout: () => void;
  adminLogin: (username: string, password: string) => ActionResult;
  adminLogout: () => void;
  placeBet: (
  mode: GameMode,
  duration: RoundDuration,
  selection: BetSelection,
  amount: number)
  => ActionResult;
  requestRecharge: (usdtAmount: number, reference: string) => ActionResult;
  requestWithdrawal: (amount: number, address: string) => ActionResult;
  applyBonusToBalance: () => ActionResult;
  resetPassword: (current: string, next: string) => ActionResult;
  reviewTransaction: (
  id: string,
  status: Extract<TransactionStatus, 'approved' | 'rejected'>)
  => void;
  updateSettings: (patch: Partial<PlatformSettings>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const CODE_TTL_MS = 10 * 60 * 1000;

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function seedRounds(): Round[] {
  const out: Round[] = [];
  const base = Date.now();
  ROUND_DURATIONS.forEach((duration) => {
    GAME_MODES.forEach((mode) => {
      for (let i = 12; i >= 1; i -= 1) {
        const block = blockIndexFor(base, duration) - i;
        const date = blockStart(block, duration);
        const digit = Math.floor(Math.random() * 10);
        const periodId = periodIdFor(date, mode, duration);
        out.push({
          periodId,
          mode,
          duration,
          digit,
          colors: colorsForDigit(digit),
          price: priceForPeriod(periodId, digit),
          settledAt: date.getTime()
        });
      }
    });
  });
  return out.sort((a, b) => b.settledAt - a.settledAt);
}

export function AppProvider({ children }: {children: React.ReactNode;}) {
  const [restored] = useState<PersistedState | null>(() => readState<PersistedState>());
  const isLeader = useLeaderTab();

  const [now, setNow] = useState(() => Date.now());
  const [users, setUsers] = useState<User[]>(restored?.users ?? seedUsers);
  const [userId, setUserId] = useState<string | null>(restored?.userId ?? null);
  const [isAdmin, setIsAdmin] = useState<boolean>(restored?.isAdmin ?? false);
  const [settings, setSettings] = useState<PlatformSettings>({
    ...defaultSettings,
    ...(restored?.settings ?? {})
  });
  const [transactions, setTransactions] = useState<Transaction[]>(
    restored?.transactions ?? seedTransactions
  );
  const [bets, setBets] = useState<Bet[]>(restored?.bets ?? []);
  const [rounds, setRounds] = useState<Round[]>(restored?.rounds ?? seedRounds());
  const [referrals] = useState<Referral[]>(seedReferrals);
  const [codes, setCodes] = useState<Record<string, {code: string;expiresAt: number;}>>({});

  const blockRefs = useRef<Record<number, number>>({
    1: blockIndexFor(Date.now(), 1),
    3: blockIndexFor(Date.now(), 3)
  });
  const betsRef = useRef<Bet[]>([]);
  const usersRef = useRef<User[]>([]);
  const settingsRef = useRef(settings);
  const lastSyncedRef = useRef<string>('');
  betsRef.current = bets;
  usersRef.current = users;
  settingsRef.current = settings;

  const user = useMemo(
    () => users.find((candidate) => candidate.id === userId) ?? null,
    [users, userId]
  );

  /* ----------------------------------------------------------- persistence */
  useEffect(() => {
    const serialized = JSON.stringify({
      users,
      transactions,
      bets,
      rounds,
      settings,
      userId,
      isAdmin
    });
    if (serialized === lastSyncedRef.current) return;
    lastSyncedRef.current = serialized;
    writeState(serialized);
  }, [users, transactions, bets, rounds, settings, userId, isAdmin]);

  useEffect(() => {
    function hydrate(event: StorageEvent) {
      if (event.key !== STATE_KEY || !event.newValue) return;
      if (event.newValue === lastSyncedRef.current) return;
      try {
        const next = JSON.parse(event.newValue) as PersistedState;
        lastSyncedRef.current = event.newValue;
        setUsers(next.users);
        setTransactions(next.transactions);
        setBets(next.bets);
        setRounds(next.rounds);
        setSettings(next.settings);
      } catch {

        /* ignore malformed payloads */}
    }
    window.addEventListener('storage', hydrate);
    return () => window.removeEventListener('storage', hydrate);
  }, []);

  const patchUser = useCallback((id: string, patch: (current: User) => User) => {
    setUsers((list) =>
    list.map((candidate) => candidate.id === id ? patch(candidate) : candidate)
    );
  }, []);

  const pushTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    setTransactions((list) => [
    { ...tx, id: makeId('tx'), createdAt: Date.now() },
    ...list]
    );
  }, []);

  /* ---------------------------------------------------------------- clock */
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  /* ------------------------------------------------------- round settling */
  useEffect(() => {
    if (!isLeader) return;

    const config = settingsRef.current;
    const closedDurations = ROUND_DURATIONS.filter((duration) => {
      const block = blockIndexFor(now, duration);
      if (block === blockRefs.current[duration]) return false;
      blockRefs.current[duration] = block;
      return true;
    });
    if (!closedDurations.length) return;

    const pending = betsRef.current.filter((bet) => bet.status === 'pending');
    const settledRounds: Round[] = [];
    const resolvedByPeriod = new Map<string, number>();

    closedDurations.forEach((duration) => {
      const closedAt = blockStart(blockIndexFor(now, duration) - 1, duration);
      GAME_MODES.forEach((mode) => {
        const periodId = periodIdFor(closedAt, mode, duration);
        const pool = pending.
        filter((bet) => bet.periodId === periodId).
        map((bet) => ({ selection: bet.selection, amount: bet.amount }));
        const digit = resolveDigit(pool, config);
        resolvedByPeriod.set(periodId, digit);
        settledRounds.push({
          periodId,
          mode,
          duration,
          digit,
          colors: colorsForDigit(digit),
          price: priceForPeriod(periodId, digit),
          settledAt: closedAt.getTime()
        });
      });
    });

    setRounds((list) => [...settledRounds, ...list].slice(0, 400));

    const payoutByUser = new Map<string, number>();
    if (pending.length) {
      setBets((list) =>
      list.map((bet) => {
        if (bet.status !== 'pending') return bet;
        const digit = resolvedByPeriod.get(bet.periodId);
        if (digit === undefined) return bet;
        const multiplier = multiplierFor(bet.selection, digit);
        const payout = Number((bet.amount * multiplier).toFixed(2));
        if (payout > 0) {
          payoutByUser.set(bet.userId, (payoutByUser.get(bet.userId) ?? 0) + payout);
        }
        return {
          ...bet,
          multiplier,
          payout,
          status: payout > 0 ? 'won' as const : 'lost' as const
        };
      })
      );
    }

    if (payoutByUser.size) {
      setUsers((list) =>
      list.map((candidate) => {
        const payout = payoutByUser.get(candidate.id);
        return payout ?
        { ...candidate, balance: Number((candidate.balance + payout).toFixed(2)) } :
        candidate;
      })
      );
      payoutByUser.forEach((amount, id) => {
        const owner = usersRef.current.find((candidate) => candidate.id === id);
        pushTransaction({
          userId: id,
          userName: owner?.name ?? 'Player',
          type: 'payout',
          amount,
          status: 'completed',
          method: 'Win Go settlement'
        });
      });
    }

    if (config.forcedDigit !== null) {
      setSettings((current) => ({ ...current, forcedDigit: null }));
    }
  }, [now, isLeader, pushTransaction]);

  /* ------------------------------------------------------------- sessions */
  const login = useCallback<AppContextValue['login']>(
    (email, password) => {
      const key = email.trim().toLowerCase();
      const found = users.find(
        (candidate) =>
        (candidate.email.toLowerCase() === key || candidate.phone === key) &&
        candidate.password === password
      );
      if (!found) return { ok: false, message: 'Email or password is incorrect.' };
      if (!found.emailVerified) {
        return { ok: false, message: 'Verify your email address before signing in.' };
      }
      setUserId(found.id);
      return { ok: true, message: `Welcome back, ${found.name}.` };
    },
    [users]
  );

  const sendVerificationCode = useCallback<AppContextValue['sendVerificationCode']>(
    (email) => {
      const key = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(key)) {
        return { ok: false, message: 'Enter a valid email address.' };
      }
      if (users.some((candidate) => candidate.email.toLowerCase() === key)) {
        return { ok: false, message: 'That email address is already registered.' };
      }
      const code = String(100000 + Math.floor(Math.random() * 899999));
      setCodes((current) => ({
        ...current,
        [key]: { code, expiresAt: Date.now() + CODE_TTL_MS }
      }));
      return { ok: true, message: `Verification code sent to ${key}.`, code };
    },
    [users]
  );

  const register = useCallback<AppContextValue['register']>(
    ({ name, email, password, confirmPassword, inviteCode }, code) => {
      const key = email.trim().toLowerCase();
      if (password.length < 6) {
        return { ok: false, message: 'Password must be at least 6 characters.' };
      }
      if (password !== confirmPassword) {
        return { ok: false, message: 'The two passwords do not match.' };
      }
      const entry = codes[key];
      if (!entry) {
        return { ok: false, message: 'Request a verification code first.' };
      }
      if (Date.now() > entry.expiresAt) {
        return { ok: false, message: 'That code has expired. Request a new one.' };
      }
      if (entry.code !== code.trim()) {
        return { ok: false, message: 'The verification code is incorrect.' };
      }
      if (users.some((candidate) => candidate.email.toLowerCase() === key)) {
        return { ok: false, message: 'That email address is already registered.' };
      }

      const created: User = {
        id: makeId('u'),
        name: name.trim() || 'New Player',
        email: key,
        emailVerified: true,
        password,
        balance: 0,
        bonus: 20,
        promoCode: String(100000 + Math.floor(Math.random() * 899999)),
        invitedBy: inviteCode?.trim() || undefined,
        createdAt: Date.now()
      };
      setUsers((list) => [...list, created]);
      setCodes((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setUserId(created.id);
      return { ok: true, message: 'Email verified. 20 bonus points added.' };
    },
    [codes, users]
  );

  const logout = useCallback(() => setUserId(null), []);

  const adminLogin = useCallback<AppContextValue['adminLogin']>((username, password) => {
    if (username === adminCredentials.username && password === adminCredentials.password) {
      setIsAdmin(true);
      return { ok: true, message: 'Admin session started.' };
    }
    return { ok: false, message: 'Invalid administrator credentials.' };
  }, []);

  const adminLogout = useCallback(() => setIsAdmin(false), []);

  /* ---------------------------------------------------------------- money */
  const placeBet = useCallback<AppContextValue['placeBet']>(
    (mode, duration, selection, amount) => {
      if (!user) return { ok: false, message: 'Sign in to place a bet.' };
      if (settings.maintenance) {
        return { ok: false, message: 'Betting is paused for maintenance.' };
      }
      if (amount < settings.minStake) {
        return { ok: false, message: `Minimum stake is ${settings.minStake} points.` };
      }
      if (amount > user.balance) {
        return { ok: false, message: 'Insufficient balance. Recharge to continue.' };
      }
      const periodId = periodIdFor(new Date(), mode, duration);
      const bet: Bet = {
        id: makeId('bet'),
        userId: user.id,
        periodId,
        mode,
        duration,
        selection,
        amount,
        multiplier: 0,
        payout: 0,
        status: 'pending',
        createdAt: Date.now()
      };
      setBets((list) => [bet, ...list]);
      patchUser(user.id, (current) => ({ ...current, balance: current.balance - amount }));
      pushTransaction({
        userId: user.id,
        userName: user.name,
        type: 'bet',
        amount,
        status: 'completed',
        method: `${mode} ${duration} Min · ${periodId}`
      });
      return { ok: true, message: `Bet placed on period ${periodId}.` };
    },
    [patchUser, pushTransaction, settings.maintenance, settings.minStake, user]
  );

  const requestRecharge = useCallback<AppContextValue['requestRecharge']>(
    (usdtAmount, reference) => {
      if (!user) return { ok: false, message: 'Sign in first.' };
      if (!Number.isFinite(usdtAmount) || usdtAmount < settings.minRechargeUsdt) {
        return {
          ok: false,
          message: `Minimum recharge is ${settings.minRechargeUsdt} USDT.`
        };
      }
      const hash = reference.trim();
      if (hash.length < 12) {
        return {
          ok: false,
          message: 'A valid transaction reference number (hash) is required.'
        };
      }
      if (
      transactions.some(
        (tx) => tx.reference && tx.reference.toLowerCase() === hash.toLowerCase()
      ))
      {
        return { ok: false, message: 'That transaction hash has already been submitted.' };
      }
      const points = Number((usdtAmount * settings.pointsPerUsdt).toFixed(2));
      pushTransaction({
        userId: user.id,
        userName: user.name,
        type: 'recharge',
        amount: points,
        status: 'pending',
        method: `${usdtAmount} USDT (TRC20)`,
        reference: hash,
        note: 'Awaiting admin confirmation'
      });
      return {
        ok: true,
        message: `Transfer submitted — ${points} points pending admin approval.`
      };
    },
    [
    pushTransaction,
    settings.minRechargeUsdt,
    settings.pointsPerUsdt,
    transactions,
    user]

  );

  const requestWithdrawal = useCallback<AppContextValue['requestWithdrawal']>(
    (amount, address) => {
      if (!user) return { ok: false, message: 'Sign in first.' };
      if (!Number.isFinite(amount) || amount < settings.minStake) {
        return { ok: false, message: `Minimum withdrawal is ${settings.minStake} points.` };
      }
      if (amount > user.balance) return { ok: false, message: 'Amount exceeds your balance.' };
      const trimmed = address.trim();
      if (trimmed.length < 26) {
        return { ok: false, message: 'Enter a valid USDT (TRC20) wallet address.' };
      }
      patchUser(user.id, (current) => ({ ...current, balance: current.balance - amount }));
      pushTransaction({
        userId: user.id,
        userName: user.name,
        type: 'withdrawal',
        amount,
        status: 'pending',
        method: `USDT (TRC20) ${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`,
        reference: trimmed
      });
      return { ok: true, message: 'Withdrawal requested and sent for admin review.' };
    },
    [patchUser, pushTransaction, settings.minStake, user]
  );

  const applyBonusToBalance = useCallback<AppContextValue['applyBonusToBalance']>(() => {
    if (!user) return { ok: false, message: 'Sign in first.' };
    if (user.bonus <= 0) return { ok: false, message: 'No bonus available to apply.' };
    const amount = user.bonus;
    patchUser(user.id, (current) => ({
      ...current,
      balance: current.balance + amount,
      bonus: 0
    }));
    pushTransaction({
      userId: user.id,
      userName: user.name,
      type: 'commission',
      amount,
      status: 'completed',
      method: 'Bonus applied to balance'
    });
    return { ok: true, message: `${amount} bonus points moved to your balance.` };
  }, [patchUser, pushTransaction, user]);

  const resetPassword = useCallback<AppContextValue['resetPassword']>(
    (current, next) => {
      if (!user) return { ok: false, message: 'Sign in first.' };
      if (user.password !== current) return { ok: false, message: 'Current password is wrong.' };
      if (next.length < 6) return { ok: false, message: 'New password must be 6+ characters.' };
      patchUser(user.id, (candidate) => ({ ...candidate, password: next }));
      return { ok: true, message: 'Password updated.' };
    },
    [patchUser, user]
  );

  /* ---------------------------------------------------------------- admin */
  const reviewTransaction = useCallback<AppContextValue['reviewTransaction']>(
    (id, status) => {
      const target = transactions.find((tx) => tx.id === id);
      if (!target || target.status !== 'pending') return;

      if (target.type === 'recharge' && status === 'approved') {
        patchUser(target.userId, (current) => ({
          ...current,
          balance: current.balance + target.amount
        }));
      }
      if (target.type === 'withdrawal' && status === 'rejected') {
        patchUser(target.userId, (current) => ({
          ...current,
          balance: current.balance + target.amount
        }));
      }
      setTransactions((list) => list.map((tx) => tx.id === id ? { ...tx, status } : tx));
    },
    [patchUser, transactions]
  );

  const updateSettings = useCallback<AppContextValue['updateSettings']>((patch) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      now,
      user,
      users,
      isAdmin,
      settings,
      transactions,
      bets,
      rounds,
      referrals,
      login,
      sendVerificationCode,
      register,
      logout,
      adminLogin,
      adminLogout,
      placeBet,
      requestRecharge,
      requestWithdrawal,
      applyBonusToBalance,
      resetPassword,
      reviewTransaction,
      updateSettings
    }),
    [
    now,
    user,
    users,
    isAdmin,
    settings,
    transactions,
    bets,
    rounds,
    referrals,
    login,
    sendVerificationCode,
    register,
    logout,
    adminLogin,
    adminLogout,
    placeBet,
    requestRecharge,
    requestWithdrawal,
    applyBonusToBalance,
    resetPassword,
    reviewTransaction,
    updateSettings]

  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}