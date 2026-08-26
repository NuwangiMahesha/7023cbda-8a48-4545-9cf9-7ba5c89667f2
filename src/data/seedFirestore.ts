import { setDoc, doc, addDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';
import { seedUsers, seedTransactions, defaultSettings } from './seed';

export async function seedFirestoreIfNeeded(): Promise<void> {
  try {
    const snap = await getDocs(query(collection(db, 'users'), limit(1)));
    if (!snap.empty) {
      return; // Already populated
    }

    console.log('[Seed] Database is empty. Seeding initial platform data...');

    // 1. Settings
    await setDoc(doc(db, 'settings', 'platform'), defaultSettings);

    // 2. Initial Users
    for (const u of seedUsers) {
      await setDoc(doc(db, 'users', u.id), {
        name:          u.name,
        email:         u.email,
        emailVerified: true,
        password:      '',
        balance:       u.balance,
        bonus:         u.bonus,
        promoCode:     u.promoCode,
        invitedBy:     u.invitedBy ?? null,
        createdAt:     u.createdAt,
      });
    }

    // 3. Initial Transactions
    for (const tx of seedTransactions) {
      await addDoc(collection(db, 'transactions'), {
        userId: tx.userId,
        userName: tx.userName,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        method: tx.method,
        reference: tx.reference,
        createdAt: tx.createdAt,
      });
    }
    console.log('[Seed] Database successfully seeded with initial platform data!');
  } catch (err) {
    console.error('[Seed] Automatic seeding error:', err);
  }
}
