/**
 * Firestore service layer.
 *
 * Every collection operation lives here.  The rest of the app never imports
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
  query,
  orderBy,
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

/* ─────────────────────────────── collection refs ─────────────────────────── */

const usersCol        = () => collection(db, 'users');
const transactionsCol = () => collection(db, 'transactions');
const betsCol         = () => collection(db, 'bets');
const roundsCol       = () => collection(db, 'rounds');
const settingsDoc     = () => doc(db, 'settings', 'platform');

/* ─────────────────────────────── realtime listeners ──────────────────────── */

/** Subscribe to the full users list (admin needs this; players only read own). */
export function subscribeUsers(
  onChange: (users: User[]) => void,
): Unsubscribe {
  return onSnapshot(usersCol(), (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as User)));
  });
}

/** Subscribe to the current user's own document. */
export function subscribeOwnUser(
  uid: string,
  onChange: (user: User | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null);
  });
}

/** Subscribe to all transactions, newest first. */
export function subscribeTransactions(
  onChange: (txs: Transaction[]) => void,
): Unsubscribe {
  const q = query(transactionsCol(), orderBy('createdAt', 'desc'), limit(500));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
  });
}

/** Subscribe to bets for a specific user, newest first. */
export function subscribeUserBets(
  userId: string,
  onChange: (bets: Bet[]) => void,
): Unsubscribe {
  // We query all bets and filter client-side to avoid needing a composite index
  // on first run.  For large scale, add a userId index in Firestore console.
  const q = query(betsCol(), orderBy('createdAt', 'desc'), limit(500));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bet));
    onChange(all.filter((b) => b.userId === userId));
  });
}

/** Subscribe to all bets (admin / round settling). */
export function subscribeBets(
  onChange: (bets: Bet[]) => void,
): Unsubscribe {
  const q = query(betsCol(), orderBy('createdAt', 'desc'), limit(1000));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bet)));
  });
}

/** Subscribe to the latest 400 settled rounds. */
export function subscribeRounds(
  onChange: (rounds: Round[]) => void,
): Unsubscribe {
  const q = query(roundsCol(), orderBy('settledAt', 'desc'), limit(400));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => d.data() as Round));
  });
}

/** Subscribe to platform settings. */
export function subscribeSettings(
  onChange: (settings: PlatformSettings) => void,
  defaultSettings: PlatformSettings,
): Unsubscribe {
  return onSnapshot(settingsDoc(), (snap) => {
    if (snap.exists()) {
      onChange(snap.data() as PlatformSettings);
    } else {
      // First run — write defaults
      setDoc(settingsDoc(), defaultSettings).catch(console.error);
      onChange(defaultSettings);
    }
  });
}

/* ─────────────────────────────── users ───────────────────────────────────── */

/** Write a new user profile document (called on registration). */
export async function createUserDoc(uid: string, data: Omit<User, 'id'>): Promise<void> {
  await setDoc(doc(db, 'users', uid), data);
}

/** Read a user profile once (used on login to check emailVerified flag). */
export async function getUserDoc(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null;
}

/** Patch selected fields on a user document. */
export async function updateUserDoc(
  uid: string,
  patch: Partial<Omit<User, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), patch as Record<string, unknown>);
}

/* ─────────────────────────────── transactions ────────────────────────────── */

/** Add a new transaction document and return its auto-generated id. */
export async function createTransaction(
  data: Omit<Transaction, 'id'>,
): Promise<string> {
  const ref = await addDoc(transactionsCol(), {
    ...data,
    _ts: serverTimestamp(),
  });
  return ref.id;
}

/** Update a transaction's status (and any other fields). */
export async function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, 'transactions', id), patch as Record<string, unknown>);
}

/* ─────────────────────────────── bets ────────────────────────────────────── */

/** Add a new bet document and return its auto-generated id. */
export async function createBet(data: Omit<Bet, 'id'>): Promise<string> {
  const ref = await addDoc(betsCol(), data);
  return ref.id;
}

/**
 * Batch-update multiple bets at once (used during round settlement).
 * `updates` is a map of betId → partial Bet fields.
 */
export async function batchUpdateBets(
  updates: Array<{ id: string; patch: Partial<Omit<Bet, 'id'>> }>,
): Promise<void> {
  const batch = writeBatch(db);
  for (const { id, patch } of updates) {
    batch.update(doc(db, 'bets', id), patch as Record<string, unknown>);
  }
  await batch.commit();
}

/* ─────────────────────────────── rounds ──────────────────────────────────── */

/**
 * Write a settled round using periodId as the document id (idempotent —
 * re-settling the same period is a no-op because doc id is the same).
 */
export async function createRound(data: Round): Promise<void> {
  await setDoc(doc(db, 'rounds', data.periodId), data);
}

/* ─────────────────────────────── settings ────────────────────────────────── */

/** Merge a partial settings patch into the platform settings doc. */
export async function updateSettings(
  patch: Partial<PlatformSettings>,
): Promise<void> {
  await updateDoc(settingsDoc(), patch as Record<string, unknown>);
}
