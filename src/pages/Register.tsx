import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheckIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';

type Step = 'details' | 'verify';

export function Register() {
  const { register, resendVerification, checkVerification } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: params.get('code') ?? '',
  });
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

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
      setStep('verify');
      setCooldown(30);
      toast.success(result.message, { duration: 6000 });
    } else {
      toast.error(result.message);
    }
  }

  async function handleResend() {
    setLoading(true);
    const result = await resendVerification();
    setLoading(false);
    if (result.ok) {
      setCooldown(60);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  async function handleCheckVerified() {
    setChecking(true);
    const verified = await checkVerification();
    setChecking(false);
    if (verified) {
      toast.success('Email verified successfully! Welcome.');
      navigate('/menu');
    } else {
      toast.error('Email not verified yet. Please check your inbox and spam folder, then click the link.');
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center px-5 py-10">
      <Logo />

      {step === 'details' ? (
        <>
          <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-900">
            Create account
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            We will send a verification link to your email. 20 bonus points land in your
            wallet once it is verified.
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
              {loading ? 'Sending verification email…' : 'Create account & send email'}
            </Button>
          </form>

          <p className="mt-5 text-sm text-ink-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Log in
            </Link>
          </p>
        </>
      ) : (
        <>
          <span className="mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-white shadow-lift">
            <MailCheckIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-900">
            Check your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            We sent an activation link to{' '}
            <strong className="text-ink-900">{form.email.trim().toLowerCase()}</strong>.
            Please open the email and click the verification link.
          </p>

          <div className="mt-6 grid gap-3">
            <Button
              type="button"
              block
              size="lg"
              onClick={handleCheckVerified}
              disabled={checking}
            >
              {checking ? 'Checking verification…' : "I've verified my email"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              block
              size="lg"
              disabled={cooldown > 0 || loading}
              onClick={handleResend}
            >
              {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend verification email'}
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="font-semibold text-ink-500 hover:text-ink-700"
            >
              ← Edit details
            </button>
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Go to login →
            </Link>
          </div>
        </>
      )}
    </main>
  );
}