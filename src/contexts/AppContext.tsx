import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  User,
} from '../types';
import { adminCredentials, defaultSettings, seedReferrals } from '../data/seed';
import {
  GAME_MODES,
  ROUND_DURATIONS,
  blockIndexFor,
  blockStart,
  colorsForDigit,
  multiplierFor,
  periodIdFor,
  priceForPeriod,
  resolveDigit,
} from '../utils/game';
import {
  changePassword,
  checkEmailVerified,
  onAuthChange,
  resendVerificationEmail,
  sendPasswordReset,
  signIn,
  signOutUser,
  signUp,
} from '../services/auth';
import {
  batchUpdateBets,
  createBet,
  createRound,
  createTransaction,
  createUserDoc,
  getUserDoc,
  subscribeBets,
  subscribeOwnUser,
  subscribeRounds,
  subscribeSettings,
  subscribeTransactions,
  subscribeUsers,
  updateSettings as fsUpdateSettings,
  updateTransaction,
  updateUserDoc,
} from '../services/firestore';
import { useLeaderTab } from '../hooks/useLeaderTab';

/* ─────────────────────────────── types ───────────────────────────────────── */

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
  authLoading: boolean;
  login: (email: string, password: string) => Promise<ActionResult>;
  register: (input: RegisterInput) => Promise<ActionResult>;
  resendVerification: () => Promise<ActionResult>;
  checkVerification: () => Promise<boolean>;
  logout: () => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<ActionResult>;
  adminLogout: () => void;
  placeBet: (
    mode: GameMode,
    duration: RoundDuration,
    selection: BetSelection,
    amount: number,
  ) => Promise<ActionResult>;
  requestRecharge: (usdtAmount: number, reference: string) => Promise<ActionResult>;
  requestWithdrawal: (amount: number, address: string) => Promise<ActionResult>;
  applyBonusToBalance: () => Promise<ActionResult>;
  resetPassword: (current: string, next: string) => Promise<ActionResult>;
  sendPasswordResetEmail: (email: string) => Promise<ActionResult>;
  reviewTransaction: (
    id: string,
    status: Extract<TransactionStatus, 'approved' | 'rejected'>,
  ) => Promise<void>;
  updateSettings: (patch: Partial<PlatformSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function seedRounds(): Round[] {
  const out: Round[] = [];
  const base = Date.now();
  ROUND_DURATIONS.forEach((duration) => {
    GAME_MODES.forEach((mode) => {
      for (let i = 12; i >= 1; i -= 1) {
        const block  = blockIndexFor(base, duration) - i;
        const date   = blockStart(block, duration);
        const digit  = Math.floor(Math.random() * 10);
        const periodId = periodIdFor(date, mode, duration);
        out.push({
          periodId,
          mode,
          duration,
          digit,
          colors: colorsForDigit(digit),
          price:  priceForPeriod(periodId, digit),
          settledAt: date.getTime(),
        });
      }
    });
  });
  return out.sort((a, b) => b.settledAt - a.settledAt);
}

/* ─────────────────────────────── provider ────────────────────────────────── */

export function AppProvider({ children }: { children: React.ReactNode }) {
  const isLeader = useLeaderTab();

  /* ── clock ── */
  const [now, setNow] = useState(() => Date.now());

  /* ── auth ── */
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return sessionStorage.getItem('prisma_admin') === 'true';
    } catch {
      return false;
    }
  });

  /* ── data ── */
  const [user, setUser]               = useState<User | null>(null);
  const [users, setUsers]             = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bets, setBets]               = useState<Bet[]>([]);
  const [rounds, setRounds]           = useState<Round[]>(seedRounds());
  const [referrals]                   = useState<Referral[]>(seedReferrals);
  const [settings, setSettings]       = useState<PlatformSettings>(defaultSettings);

  /* ── mutable refs for use inside setInterval callbacks ── */
  const betsRef     = useRef<Bet[]>([]);
  const usersRef    = useRef<User[]>([]);
  const settingsRef = useRef<PlatformSettings>(settings);
  const blockRefs   = useRef<Record<number, number>>({
    1: blockIndexFor(Date.now(), 1),
    3: blockIndexFor(Date.now(), 3),
  });
  betsRef.current     = bets;
  usersRef.current    = users;
  settingsRef.current = settings;

  /* ──────────────────────── auth state listener ─────────────────────────── */
  useEffect(() => {
    const unsub = onAuthChange((fbUser) => {
      if (fbUser) {
        setFirebaseUid(fbUser.uid);
      } else {
        setFirebaseUid(null);
        setUser(null);
        setAuthLoading(false);
      }
    });
    return unsub;
  }, []);

  /* ──────────────────────── Firestore listeners ─────────────────────────── */

  // Own user profile (runs whenever the signed-in uid changes)
  useEffect(() => {
    if (!firebaseUid) {
      setUser(null);
      return;
    }
    const unsub = subscribeOwnUser(firebaseUid, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, [firebaseUid]);

  // All users (needed by admin panel)
  useEffect(() => {
    // Subscribe if either a user is logged in OR admin is logged in
    if (!firebaseUid && !isAdmin) { setUsers([]); return; }
    const unsub = subscribeUsers((u) => setUsers(u));
    return unsub;
  }, [firebaseUid, isAdmin]);

  // Transactions
  useEffect(() => {
    if (!firebaseUid && !isAdmin) { setTransactions([]); return; }
    const unsub = subscribeTransactions((txs) => setTransactions(txs));
    return unsub;
  }, [firebaseUid, isAdmin]);

  // Bets
  useEffect(() => {
    if (!firebaseUid && !isAdmin) { setBets([]); return; }
    const unsub = subscribeBets((b) => setBets(b));
    return unsub;
  }, [firebaseUid, isAdmin]);

  // Rounds
  useEffect(() => {
    if (!firebaseUid && !isAdmin) return;
    const unsub = subscribeRounds((r) => setRounds(r));
    return unsub;
  }, [firebaseUid, isAdmin]);

  // Platform settings
  useEffect(() => {
    if (!firebaseUid && !isAdmin) return;
    const unsub = subscribeSettings((s) => setSettings(s), defaultSettings);
    return unsub;
  }, [firebaseUid, isAdmin]);

  /* ──────────────────────── clock ───────────────────────────────────────── */
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  /* ──────────────────────── round settling ──────────────────────────────── */
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
    const resolvedByPeriod = new Map<string, number>();

    const settleWork = async () => {
      for (const duration of closedDurations) {
        const closedAt = blockStart(blockIndexFor(now, duration) - 1, duration);
        for (const mode of GAME_MODES) {
          const periodId = periodIdFor(closedAt, mode, duration);
          const pool = pending
            .filter((bet) => bet.periodId === periodId)
            .map((bet) => ({ selection: bet.selection, amount: bet.amount }));
          const digit = resolveDigit(pool, config);
          resolvedByPeriod.set(periodId, digit);

          // Write the settled round to Firestore
          await createRound({
            periodId,
            mode,
            duration,
            digit,
            colors: colorsForDigit(digit),
            price: priceForPeriod(periodId, digit),
            settledAt: closedAt.getTime(),
          });
        }
      }

      // Settle bets
      const betUpdates: Array<{ id: string; patch: Partial<Omit<Bet, 'id'>> }> = [];
      const payoutByUser = new Map<string, number>();

      for (const bet of pending) {
        const digit = resolvedByPeriod.get(bet.periodId);
        if (digit === undefined) continue;
        const multiplier = multiplierFor(bet.selection, digit);
        const payout = Number((bet.amount * multiplier).toFixed(2));
        if (payout > 0) {
          payoutByUser.set(bet.userId, (payoutByUser.get(bet.userId) ?? 0) + payout);
        }
        betUpdates.push({
          id: bet.id,
          patch: {
            multiplier,
            payout,
            status: payout > 0 ? 'won' : 'lost',
          },
        });
      }

      if (betUpdates.length) {
        await batchUpdateBets(betUpdates);
      }

      // Credit winners' balances + write payout transactions
      for (const [userId, amount] of payoutByUser.entries()) {
        const owner = usersRef.current.find((u) => u.id === userId);
        const currentBalance = owner?.balance ?? 0;
        await updateUserDoc(userId, {
          balance: Number((currentBalance + amount).toFixed(2)),
        });
        await createTransaction({
          userId,
          userName: owner?.name ?? 'Player',
          type: 'payout',
          amount,
          status: 'completed',
          method: 'Win Go settlement',
          createdAt: Date.now(),
        });
      }

      // Reset forced digit if one was used
      if (config.forcedDigit !== null) {
        await fsUpdateSettings({ forcedDigit: null });
      }
    };

    settleWork().catch(console.error);
  }, [now, isLeader]);

  /* ──────────────────────── auth actions ────────────────────────────────── */

  const login = useCallback<AppContextValue['login']>(
    async (email, password) => {
      try {
        await signIn(email, password);
        return { ok: true, message: 'Welcome back!' };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Login failed.';
        if (
          msg.includes('user-not-found') ||
          msg.includes('wrong-password') ||
          msg.includes('invalid-credential')
        ) {
          return { ok: false, message: 'Email or password is incorrect.' };
        }
        return { ok: false, message: msg };
      }
    },
    [],
  );

  const register = useCallback<AppContextValue['register']>(
    async ({ name, email, password, confirmPassword, inviteCode }) => {
      const key = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(key)) {
        return { ok: false, message: 'Enter a valid email address.' };
      }
      if (password.length < 6) {
        return { ok: false, message: 'Password must be at least 6 characters.' };
      }
      if (password !== confirmPassword) {
        return { ok: false, message: 'The two passwords do not match.' };
      }

      try {
        const fbUser = await signUp(key, password, name.trim() || 'New Player');
        const promoCode = String(100000 + Math.floor(Math.random() * 899999));
        await createUserDoc(fbUser.uid, {
          name: name.trim() || 'New Player',
          email: key,
          emailVerified: true,
          password: '',
          balance: 0,
          bonus: 20,
          promoCode,
          invitedBy: inviteCode?.trim() || null,
          createdAt: Date.now(),
        });

        return {
          ok: true,
          message: 'Account created! 20 bonus points added to your wallet.',
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Registration failed.';
        if (msg.includes('email-already-in-use')) {
          return { ok: false, message: 'That email address is already registered.' };
        }
        return { ok: false, message: msg };
      }
    },
    [],
  );

  const resendVerification = useCallback(async () => {
    try {
      await resendVerificationEmail();
      return { ok: true, message: 'Verification email resent! Please check your inbox.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend verification email.';
      return { ok: false, message: msg };
    }
  }, []);

  const checkVerification = useCallback(async () => {
    const verified = await checkEmailVerified();
    if (verified && firebaseUid) {
      await updateUserDoc(firebaseUid, { emailVerified: true });
    }
    return verified;
  }, [firebaseUid]);

  const logout = useCallback(async () => {
    setIsAdmin(false);
    try {
      sessionStorage.removeItem('prisma_admin');
    } catch {}
    await signOutUser();
  }, []);

  const adminLogin = useCallback<AppContextValue['adminLogin']>(async (username, password) => {
    if (username === adminCredentials.username && password === adminCredentials.password) {
      // Sign in to Firebase with admin credentials to access Firestore
      try {
        const adminEmail = 'admin@system.local';
        const adminPassword = 'admin1234secure';
        await signIn(adminEmail, adminPassword);
        setIsAdmin(true);
        try {
          sessionStorage.setItem('prisma_admin', 'true');
        } catch {}
        return { ok: true, message: 'Admin session started.' };
      } catch (error) {
        // If admin Firebase account doesn't exist, create it
        try {
          const adminEmail = 'admin@system.local';
          const adminPassword = 'admin1234secure';
          const fbUser = await signUp(adminEmail, adminPassword, 'Administrator');
          await createUserDoc(fbUser.uid, {
            name: 'Administrator',
            email: adminEmail,
            emailVerified: true,
            password: '',
            balance: 0,
            bonus: 0,
            promoCode: 'ADMIN',
            invitedBy: null,
            createdAt: Date.now(),
          });
          setIsAdmin(true);
          try {
            sessionStorage.setItem('prisma_admin', 'true');
          } catch {}
          return { ok: true, message: 'Admin session started.' };
        } catch (createError) {
          console.error('Failed to create/login admin account:', createError);
          return { ok: false, message: 'Failed to initialize admin account.' };
        }
      }
    }
    return { ok: false, message: 'Invalid administrator credentials.' };
  }, []);

  const adminLogout = useCallback(() => {
    setIsAdmin(false);
    try {
      sessionStorage.removeItem('prisma_admin');
    } catch {}
  }, []);

  /* ──────────────────────── money actions ───────────────────────────────── */

  const placeBet = useCallback<AppContextValue['placeBet']>(
    async (mode, duration, selection, amount) => {
      if (!user || !firebaseUid) return { ok: false, message: 'Sign in to place a bet.' };
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

      // Deduct balance first (optimistic — prevents double-spending)
      const newBalance = Number((user.balance - amount).toFixed(2));
      await updateUserDoc(firebaseUid, { balance: newBalance });

      const betId = await createBet({
        userId: firebaseUid,
        periodId,
        mode,
        duration,
        selection,
        amount,
        multiplier: 0,
        payout: 0,
        status: 'pending',
        createdAt: Date.now(),
      });

      await createTransaction({
        userId:   firebaseUid,
        userName: user.name,
        type:     'bet',
        amount,
        status:   'completed',
        method:   `${mode} ${duration} Min · ${periodId}`,
        createdAt: Date.now(),
      });

      return { ok: true, message: `Bet placed on period ${periodId}.` };
      void betId;
    },
    [firebaseUid, settings.maintenance, settings.minStake, user],
  );

  const requestRecharge = useCallback<AppContextValue['requestRecharge']>(
    async (usdtAmount, reference) => {
      if (!user || !firebaseUid) return { ok: false, message: 'Sign in first.' };
      if (!Number.isFinite(usdtAmount) || usdtAmount < settings.minRechargeUsdt) {
        return { ok: false, message: `Minimum recharge is ${settings.minRechargeUsdt} USDT.` };
      }
      const hash = reference.trim();
      if (hash.length < 12) {
        return { ok: false, message: 'A valid transaction reference number (hash) is required.' };
      }
      if (transactions.some((tx) => tx.reference && tx.reference.toLowerCase() === hash.toLowerCase())) {
        return { ok: false, message: 'That transaction hash has already been submitted.' };
      }
      const points = Number((usdtAmount * settings.pointsPerUsdt).toFixed(2));
      await createTransaction({
        userId:    firebaseUid,
        userName:  user.name,
        type:      'recharge',
        amount:    points,
        status:    'pending',
        method:    `${usdtAmount} USDT (TRC20)`,
        reference: hash,
        note:      'Awaiting admin confirmation',
        createdAt: Date.now(),
      });
      return { ok: true, message: `Transfer submitted — ${points} points pending admin approval.` };
    },
    [firebaseUid, settings.minRechargeUsdt, settings.pointsPerUsdt, transactions, user],
  );

  const requestWithdrawal = useCallback<AppContextValue['requestWithdrawal']>(
    async (amount, address) => {
      if (!user || !firebaseUid) return { ok: false, message: 'Sign in first.' };
      if (!Number.isFinite(amount) || amount < settings.minStake) {
        return { ok: false, message: `Minimum withdrawal is ${settings.minStake} points.` };
      }
      if (amount > user.balance) return { ok: false, message: 'Amount exceeds your balance.' };
      const trimmed = address.trim();
      if (trimmed.length < 26) {
        return { ok: false, message: 'Enter a valid USDT (TRC20) wallet address.' };
      }

      const newBalance = Number((user.balance - amount).toFixed(2));
      await updateUserDoc(firebaseUid, { balance: newBalance });
      await createTransaction({
        userId:    firebaseUid,
        userName:  user.name,
        type:      'withdrawal',
        amount,
        status:    'pending',
        method:    `USDT (TRC20) ${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`,
        reference: trimmed,
        createdAt: Date.now(),
      });
      return { ok: true, message: 'Withdrawal requested and sent for admin review.' };
    },
    [firebaseUid, settings.minStake, user],
  );

  const applyBonusToBalance = useCallback<AppContextValue['applyBonusToBalance']>(
    async () => {
      if (!user || !firebaseUid) return { ok: false, message: 'Sign in first.' };
      if (user.bonus <= 0) return { ok: false, message: 'No bonus available to apply.' };
      const amount = user.bonus;
      await updateUserDoc(firebaseUid, {
        balance: Number((user.balance + amount).toFixed(2)),
        bonus: 0,
      });
      await createTransaction({
        userId:   firebaseUid,
        userName: user.name,
        type:     'commission',
        amount,
        status:   'completed',
        method:   'Bonus applied to balance',
        createdAt: Date.now(),
      });
      return { ok: true, message: `${amount} bonus points moved to your balance.` };
    },
    [firebaseUid, user],
  );

  const resetPassword = useCallback<AppContextValue['resetPassword']>(
    async (current, next) => {
      if (!user) return { ok: false, message: 'Sign in first.' };
      if (next.length < 6) return { ok: false, message: 'New password must be at least 6 characters.' };
      try {
        await changePassword(current, next);
        return { ok: true, message: 'Password updated successfully!' };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update password.';
        if (
          msg.includes('wrong-password') ||
          msg.includes('invalid-credential') ||
          msg.includes('invalid-password')
        ) {
          return { ok: false, message: 'Current password is incorrect.' };
        }
        return { ok: false, message: msg };
      }
    },
    [user],
  );

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const key = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(key)) {
      return { ok: false, message: 'Enter a valid email address.' };
    }
    try {
      await sendPasswordReset(key);
      return {
        ok: true,
        message: `Password reset link sent to ${key}! Check your email inbox.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email.';
      if (msg.includes('user-not-found')) {
        return { ok: false, message: 'No account found with this email address.' };
      }
      return { ok: false, message: msg };
    }
  }, []);

  /* ──────────────────────── admin actions ───────────────────────────────── */

  const reviewTransaction = useCallback<AppContextValue['reviewTransaction']>(
    async (id, status) => {
      const target = transactions.find((tx) => tx.id === id);
      if (!target || target.status !== 'pending') return;

      await updateTransaction(id, { status });

      if (target.type === 'recharge' && status === 'approved') {
        const owner =
          usersRef.current.find((u) => u.id === target.userId) ||
          (await getUserDoc(target.userId));
        if (owner) {
          await updateUserDoc(target.userId, {
            balance: Number((owner.balance + target.amount).toFixed(2)),
          });
        }
      }
      if (target.type === 'withdrawal' && status === 'rejected') {
        const owner =
          usersRef.current.find((u) => u.id === target.userId) ||
          (await getUserDoc(target.userId));
        if (owner) {
          await updateUserDoc(target.userId, {
            balance: Number((owner.balance + target.amount).toFixed(2)),
          });
        }
      }
    },
    [transactions],
  );

  const updateSettings = useCallback<AppContextValue['updateSettings']>(
    async (patch) => {
      await fsUpdateSettings(patch);
    },
    [],
  );

  /* ──────────────────────── context value ───────────────────────────────── */

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
      authLoading,
      login,
      register,
      resendVerification,
      checkVerification,
      logout,
      adminLogin,
      adminLogout,
      placeBet,
      requestRecharge,
      requestWithdrawal,
      applyBonusToBalance,
      resetPassword,
      sendPasswordResetEmail,
      reviewTransaction,
      updateSettings,
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
      authLoading,
      login,
      register,
      resendVerification,
      checkVerification,
      logout,
      adminLogin,
      adminLogout,
      placeBet,
      requestRecharge,
      requestWithdrawal,
      applyBonusToBalance,
      resetPassword,
      sendPasswordResetEmail,
      reviewTransaction,
      updateSettings,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}