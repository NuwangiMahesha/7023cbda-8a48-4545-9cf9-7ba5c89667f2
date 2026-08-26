/**
 * Firestore service layer optimized for quota safety and high performance.
 */
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  limit,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Bet,
  PlatformSettings,
  Round,
  Transaction,
  User,
} from '../types';

/** Helper to remove undefined fields which Firestore rejects */
function sanitize<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/* ─────────────────────────────── collection refs ─────────────────────────── */

const usersCol        = () => collection(db, 'users');
const transactionsCol = () => collection(db, 'transactions');
const betsCol         = () => collection(db, 'bets');
const roundsCol       = () => collection(db, 'rounds');
const settingsDoc     = () => doc(db, 'settings', 'platform');

/* ─────────────────────────────── realtime listeners ──────────────────────── */

/** Subscribe to users list (limited to 50 for quota safety). */
export function subscribeUsers(
  onChange: (users: User[]) => void,
): Unsubscribe {
  const q = query(usersCol(), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as User))
        .filter((u) => Boolean(u && (u.name || u.email)));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onChange(list);
    },
    (err) => console.error('subscribeUsers error:', err)
  );
}

/** Subscribe to the current user's own document. */
export function subscribeOwnUser(
  uid: string,
  onChange: (user: User | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      const data = snap.data();
      onChange(snap.exists() && data && (data.name || data.email) ? ({ id: snap.id, ...data } as User) : null);
    },
    (err) => console.error('subscribeOwnUser error:', err)
  );
}

/** Subscribe to recent transactions (limited to 50 for quota safety). */
export function subscribeTransactions(
  onChange: (txs: Transaction[]) => void,
): Unsubscribe {
  const q = query(transactionsCol(), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Transaction))
        .filter((tx) => Boolean(tx && tx.type));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onChange(list);
    },
    (err) => console.error('subscribeTransactions error:', err)
  );
}

/** Subscribe to bets for a specific user. */
export function subscribeUserBets(
  userId: string,
  onChange: (bets: Bet[]) => void,
): Unsubscribe {
  const q = query(betsCol(), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Bet))
        .filter((b) => Boolean(b && b.userId));
      all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onChange(all.filter((b) => b.userId === userId));
    },
    (err) => console.error('subscribeUserBets error:', err)
  );
}

/** Subscribe to all bets (limited to 50 for quota safety). */
export function subscribeBets(
  onChange: (bets: Bet[]) => void,
): Unsubscribe {
  const q = query(betsCol(), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Bet))
        .filter((b) => Boolean(b && b.amount));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onChange(list);
    },
    (err) => console.error('subscribeBets error:', err)
  );
}

/** Subscribe to latest settled rounds (limited to 40 for quota safety). */
export function subscribeRounds(
  onChange: (rounds: Round[]) => void,
): Unsubscribe {
  const q = query(roundsCol(), limit(40));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as Round)
        .filter((r) => Boolean(r && r.periodId));
      list.sort((a, b) => (b.settledAt || 0) - (a.settledAt || 0));
      onChange(list);
    },
    (err) => console.error('subscribeRounds error:', err)
  );
}

/** Subscribe to platform settings. */
export function subscribeSettings(
  onChange: (settings: PlatformSettings) => void,
  defaultSettings: PlatformSettings,
): Unsubscribe {
  return onSnapshot(
    settingsDoc(),
    (snap) => {
      if (snap.exists() && snap.data()) {
        onChange(snap.data() as PlatformSettings);
      } else {
        setDoc(settingsDoc(), sanitize(defaultSettings)).catch(console.error);
        onChange(defaultSettings);
      }
    },
    (err) => console.error('subscribeSettings error:', err)
  );
}

/* ─────────────────────────────── users ───────────────────────────────────── */

/** Write a new user profile document (called on registration). */
export async function createUserDoc(uid: string, data: Omit<User, 'id'>): Promise<void> {
  await setDoc(doc(db, 'users', uid), sanitize(data));
}

/** Read a user profile once. */
export async function getUserDoc(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.data();
  return snap.exists() && data && (data.name || data.email) ? ({ id: snap.id, ...data } as User) : null;
}

/** Patch selected fields on a user document. */
export async function updateUserDoc(
  uid: string,
  patch: Partial<Omit<User, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), sanitize(patch));
}

/* ─────────────────────────────── transactions ────────────────────────────── */

/** Add a new transaction document and return its auto-generated id. */
export async function createTransaction(
  data: Omit<Transaction, 'id'>,
): Promise<string> {
  const ref = await addDoc(transactionsCol(), {
    ...sanitize(data),
    _ts: serverTimestamp(),
  });
  return ref.id;
}

/** Update a transaction's status (and any other fields). */
export async function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, 'transactions', id), sanitize(patch));
}

/* ─────────────────────────────── bets ────────────────────────────────────── */

/** Add a new bet document and return its auto-generated id. */
export async function createBet(data: Omit<Bet, 'id'>): Promise<string> {
  const ref = await addDoc(betsCol(), sanitize(data));
  return ref.id;
}

/** Batch-update multiple bets at once (used during round settlement). */
export async function batchUpdateBets(
  updates: Array<{ id: string; patch: Partial<Omit<Bet, 'id'>> }>,
): Promise<void> {
  const batch = writeBatch(db);
  for (const { id, patch } of updates) {
    batch.update(doc(db, 'bets', id), sanitize(patch));
  }
  await batch.commit();
}

/* ─────────────────────────────── rounds ──────────────────────────────────── */

/** Write a settled round using periodId as doc id. */
export async function createRound(data: Round): Promise<void> {
  await setDoc(doc(db, 'rounds', data.periodId), sanitize(data));
}

/* ─────────────────────────────── settings ────────────────────────────────── */

/** Merge a partial settings patch into the platform settings doc. */
export async function updateSettings(
  patch: Partial<PlatformSettings>,
): Promise<void> {
  await updateDoc(settingsDoc(), sanitize(patch));
}
