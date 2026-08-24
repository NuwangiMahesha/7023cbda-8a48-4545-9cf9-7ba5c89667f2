/**
 * Firebase Auth service wrapper.
 *
 * Keeps all auth calls in one place so the rest of the app never imports
 * firebase/auth directly.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';

export type { FirebaseUser };

/** Create a new Firebase Auth account. */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<FirebaseUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  return user;
}

/** Sign in with email + password. */
export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

/** Sign out the current user. */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback);
}
