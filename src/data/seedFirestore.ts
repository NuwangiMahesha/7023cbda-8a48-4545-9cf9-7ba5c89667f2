/**
 * One-time Firestore seed script.
 *
 * Run this from the browser console or wire it to a temp admin button.
 * It pre-populates Firestore with the demo users and transactions so you
 * don't start with a blank database.
 *
 * IMPORTANT: Only run this once. Running it again is safe (setDoc is
 * idempotent for users, addDoc creates duplicates for transactions).
 *
 * Usage: import { seedFirestore } from './data/seedFirestore'; seedFirestore();
 */

import { setDoc, doc, addDoc, collection } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { seedUsers, seedTransactions, defaultSettings } from './seed';

export async function seedFirestore(): Promise<void> {
  console.log('[Seed] Starting Firestore seed...');

  // 1. Platform settings
  await setDoc(doc(db, 'settings', 'platform'), defaultSettings);
  console.log('[Seed] Settings written.');

  // 2. Demo users — create Firebase Auth accounts + Firestore profiles
  for (const u of seedUsers) {
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(
        auth,
        u.email,
        u.password,
      );
      await updateProfile(fbUser, { displayName: u.name });
      await setDoc(doc(db, 'users', fbUser.uid), {
        name:          u.name,
        email:         u.email,
        emailVerified: true,
        password:      '',   // never store plain-text in Firestore
        balance:       u.balance,
        bonus:         u.bonus,
        promoCode:     u.promoCode,
        invitedBy:     u.invitedBy ?? null,
        createdAt:     u.createdAt,
      });
      console.log(`[Seed] Created user: ${u.email} (uid: ${fbUser.uid})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('email-already-in-use')) {
        console.log(`[Seed] Skipping existing user: ${u.email}`);
      } else {
        console.error(`[Seed] Error creating ${u.email}:`, msg);
      }
    }
  }

  // 3. Demo transactions (linked to the first seed user)
  //    Note: userId will be the Firebase uid, not the old 'u-1001' style id.
  //    For demo purposes we just write them as-is; adjust userIds after seeding.
  for (const tx of seedTransactions) {
    await addDoc(collection(db, 'transactions'), {
      ...tx,
      createdAt: tx.createdAt,
    });
  }
  console.log('[Seed] Transactions written.');

  console.log('[Seed] Done! Refresh the page to see demo data.');
}
