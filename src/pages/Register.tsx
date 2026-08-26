import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRoundIcon, MailCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';

export function Register() {
  const { register, resendVerification, verifyEmailCode } = useApp();
  const navigate = useNavigate();
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
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
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
      if (result.emailVerified) {
        toast.success(result.message, { duration: 5000 });
        navigate('/win');
      } else {
        setRegistered(true);
        toast.success('Account created! Please enter the 6-digit code from your email.');
      }
    } else {
      toast.error(result.message);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    if (!otpCode.trim()) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setVerifying(true);
    const result = await verifyEmailCode(form.email, otpCode.trim());
    setVerifying(false);

    if (result.ok) {
      toast.success(result.message, { duration: 5000 });
      navigate('/win');
    } else {
      toast.error(result.message);
    }
  }

  async function handleResend() {
    setResending(true);
    const result = await resendVerification(form.email);
    setResending(false);
    if (result.ok) {
      toast.success('Verification code resent! Check your inbox.');
    } else {
      toast.error(result.message);
    }
  }

  // ── OTP verification screen ───────────────────────────────────────────────
  if (registered) {
    return (
      <main className="flex flex-1 flex-col justify-center px-5 py-10">
        <Logo />

        <span className="mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-white shadow-lift">
          <MailCheckIcon className="h-7 w-7" aria-hidden="true" />
        </span>

        <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-900">
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          We sent a 6-digit verification code to{' '}
          <span className="font-semibold text-ink-800">{form.email}</span>.
        </p>

        <form onSubmit={handleVerifyOtp} className="mt-6 grid gap-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full rounded-xl border border-ink-300/40 bg-white px-4 py-3.5 text-center text-2xl font-bold tracking-[0.3em] text-ink-900 outline-none transition-colors duration-150 ease-smooth placeholder:font-normal placeholder:tracking-normal focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20"
              autoFocus
              required
            />
          </div>

          <Button type="submit" block size="lg" disabled={verifying}>
            {verifying ? 'Verifying code…' : 'Verify & Start Playing'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            block
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Resending…' : 'Resend verification code'}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-400">
          You can also simply click the verification link in your email.
        </p>

        <p className="mt-4 text-center text-sm text-ink-500">
          <button
            type="button"
            onClick={() => setRegistered(false)}
            className="font-semibold text-brand-600 hover:underline"
          >
            ← Back to sign up
          </button>
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