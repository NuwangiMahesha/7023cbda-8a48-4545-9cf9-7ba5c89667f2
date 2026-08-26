/**
 * Supabase Auth service wrapper.
 * Handles authentication operations for player accounts and email verification.
 */
import { supabase } from '../supabase';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

/** Sign up a new player account and send verification email */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Failed to create user');

  return {
    id: data.user.id,
    email: data.user.email || '',
    emailVerified: data.user.email_confirmed_at ? true : false,
  };
}

/** Sign in with email and password */
export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Failed to sign in');

  return {
    id: data.user.id,
    email: data.user.email || '',
    emailVerified: data.user.email_confirmed_at ? true : false,
  };
}

/** Check if current user's email is verified */
export async function checkEmailVerified(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email_confirmed_at ? true : false;
}

/** Resend verification email to current user */
export async function resendVerificationEmail(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) throw new Error('No user logged in');

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: data.user.email,
  });

  if (error) throw new Error(error.message);
}

/** Send password reset email */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}

/** Update password for current user */
export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw new Error(error.message);
}

/** Sign out the current user */
export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/** Subscribe to auth state changes */
export function onAuthChange(
  callback: (user: AuthUser | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
        emailVerified: session.user.email_confirmed_at ? true : false,
      });
    } else {
      callback(null);
    }
  });

  return () => {
    subscription?.unsubscribe();
  };
}

/** Get current user session */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email || '',
    emailVerified: data.user.email_confirmed_at ? true : false,
  };
}
