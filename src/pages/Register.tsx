import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';

export function Register() {
  const { register, resendVerification } = useApp();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: params.get('code') ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resending, setResending] = useState(false);

  function update(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Enter your name.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('The two passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await register(form);
    setLoading(false);

    if (result.ok) {
      setRegistered(true);
    } else {
      toast.error(result.message);
    }
  }

  async function handleResend() {
    setResending(true);
    const result = await resendVerification();
    setResending(false);
    if (result.ok) {
      toast.success('Verification email resent! Check your inbox.');
    } else {
      toast.error(result.message);
    }
  }

  // ── Email sent screen ──────────────────────────────────────────────────────
  if (registered) {
    return (
      <main className="flex flex-1 flex-col justify-center px-5 py-10">
        <Logo />

        <span className="mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-white shadow-lift">
          <MailCheckIcon className="h-7 w-7" aria-hidden="true" />
        </span>

        <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-900">
          Check your inbox
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          We sent a verification link to{' '}
          <span className="font-semibold text-ink-800">{form.email}</span>.
          Click the link in that email to activate your account, then come back here to log in.
        </p>

        <div className="mt-7 grid gap-3">
          <Link
            to="/login"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-bold text-white shadow-lift transition-opacity hover:opacity-90"
          >
            Go to login
          </Link>

          <Button
            variant="secondary"
            block
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Resending…' : 'Resend verification email'}
          </Button>
        </div>

        <p className="mt-5 text-xs text-ink-400">
          Didn't receive it? Check your spam folder or click "Resend" above.
        </p>
      </main>
    );
  }

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <main className="flex flex-1 flex-col justify-center px-5 py-10">
      <Logo />

      <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-900">
        Create account
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Register to get instant access. 20 bonus points land in your wallet immediately!
      </p>

      <form onSubmit={handleRegister} className="mt-7 grid gap-3.5">
        <TextField label="Name" value={form.name} onChange={update('name')} required />
        <TextField
          label="Email address"
          type="email"
          value={form.email}
          onChange={update('email')}
          autoComplete="email"
          required
        />

        <TextField
          label="Password"
          type="password"
          value={form.password}
          onChange={update('password')}
          hint="At least 6 characters."
          autoComplete="new-password"
          required
        />

        <TextField
          label="Retype password"
          type="password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          autoComplete="new-password"
          required
        />

        <TextField
          label="Invitation code (optional)"
          value={form.inviteCode}
          onChange={update('inviteCode')}
        />

        <Button type="submit" block size="lg" className="mt-1" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account & Start playing'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-ink-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}