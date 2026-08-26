/**
 * Firestore service layer.
 *
 * Every collection operation lives here. The rest of the app never imports
 * firebase/firestore directly — it only uses the functions exported below.
 *
 * Collections
 *   users         — player profiles (doc id = Firebase Auth uid)
 *   transactions  — recharge / withdrawal / bet / payout records
 *   bets          — individual bet documents
 *   rounds        — settled game rounds (doc id = periodId)
 *   settings      — single document "platform" with PlatformSettings fields
 */
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
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

/** Subscribe to the full users list (admin & app). */
export function subscribeUsers(
  onChange: (users: User[]) => void,
): Unsubscribe {
  return onSnapshot(
    usersCol(),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
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
      onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null);
    },
    (err) => console.error('subscribeOwnUser error:', err)
  );
}

/** Subscribe to all transactions, newest first. */
export function subscribeTransactions(
  onChange: (txs: Transaction[]) => void,
): Unsubscribe {
  return onSnapshot(
    transactionsCol(),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
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
  return onSnapshot(
    betsCol(),
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bet));
      all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onChange(all.filter((b) => b.userId === userId));
    },
    (err) => console.error('subscribeUserBets error:', err)
  );
}

/** Subscribe to all bets (admin / round settling). */
export function subscribeBets(
  onChange: (bets: Bet[]) => void,
): Unsubscribe {
  return onSnapshot(
    betsCol(),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bet));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onChange(list);
    },
    (err) => console.error('subscribeBets error:', err)
  );
}

/** Subscribe to settled rounds. */
export function subscribeRounds(
  onChange: (rounds: Round[]) => void,
): Unsubscribe {
  return onSnapshot(
    roundsCol(),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Round);
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
      if (snap.exists()) {
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
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null;
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

/**
 * Batch-update multiple bets at once (used during round settlement).
 */
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

/**
 * Write a settled round using periodId as doc id.
 */
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
