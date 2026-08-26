import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRoundIcon, MailCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';

export function Login() {
  const { login, sendPasswordResetEmail, resendVerification } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgot, setIsForgot] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      toast.success(result.message);
      navigate('/win');
    } else if (result.message.includes('verify your email')) {
      setIsUnverified(true);
    } else {
      toast.error(result.message);
    }
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    setLoading(true);
    const result = await sendPasswordResetEmail(resetEmail);
    setLoading(false);
    if (result.ok) {
      toast.success(result.message, { duration: 6000 });
      setIsForgot(false);
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

  // ── Email not verified screen ──────────────────────────────────────────────
  if (isUnverified) {
    return (
      <main className="flex flex-1 flex-col justify-center px-5 py-10">
        <Logo />

        <span className="mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-win-gold/15 text-win-gold shadow-lift">
          <MailCheckIcon className="h-7 w-7" aria-hidden="true" />
        </span>

        <h1 className="mt-5 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink-900">
          Email not verified
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Please check your inbox for{' '}
          <span className="font-semibold text-ink-800">{email}</span> and click the
          verification link to activate your account.
        </p>

        <div className="mt-7 grid gap-3">
          <Button block size="lg" onClick={handleResend} disabled={resending}>
            {resending ? 'Resending…' : 'Resend verification email'}
          </Button>
          <Button
            variant="secondary"
            block
            onClick={() => setIsUnverified(false)}
          >
            ← Back to login
          </Button>
        </div>

        <p className="mt-5 text-xs text-ink-400">
          Didn't receive it? Check your spam folder or click "Resend" above.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col justify-center px-5 py-10">
      <Logo />


      {isForgot ? (
        <>
          <span className="mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-white shadow-lift">
            <KeyRoundIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-900">
            Reset password
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Enter your account email and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleReset} className="mt-7 grid gap-3.5">
            <TextField
              label="Email address"
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />

            <Button type="submit" block size="lg" className="mt-1" disabled={loading}>
              {loading ? 'Sending link…' : 'Send password reset link'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setIsForgot(false)}
            className="mt-5 text-left text-sm font-semibold text-brand-600 hover:underline"
          >
            ← Back to sign in
          </button>
        </>
      ) : (
        <>
          <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-900">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">Use your verified email address.</p>

          <form onSubmit={submit} className="mt-7 grid gap-3.5">
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Password
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setIsForgot(true);
                  }}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-ink-300/40 bg-white px-3.5 py-3 text-sm text-ink-900 outline-none transition-colors duration-150 ease-smooth focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20"
              />
            </div>

            <Button type="submit" block size="lg" className="mt-1" disabled={loading}>
              {loading ? 'Signing in…' : 'Log in'}
            </Button>
          </form>

          <p className="mt-5 text-sm text-ink-500">
            New here?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              Create an account
            </Link>
          </p>
        </>
      )}
    </main>
  );
}