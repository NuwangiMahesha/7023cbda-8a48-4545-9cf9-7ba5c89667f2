import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';

type Step = 'details' | 'verify';

export function Register() {
  const { register, sendVerificationCode } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: params.get('code') ?? ''
  });
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function update(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  }

  function requestCode(isResend = false) {
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
    const result = sendVerificationCode(form.email);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setStep('verify');
    setCooldown(30);
    toast.success(
      `${isResend ? 'New code sent' : result.message} Demo code: ${result.code}`,
      { duration: 8000 }
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = register(form, code);
    if (result.ok) {
      toast.success(result.message);
      navigate('/menu');
    } else {
      toast.error(result.message);
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center px-5 py-10">
      <Logo />

      {step === 'details' ?
      <>
          <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-900">
            Create account
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            We verify your email address before the account opens. 20 bonus points land in your
            wallet once it is verified.
          </p>

          <form
          onSubmit={(event) => {
            event.preventDefault();
            requestCode();
          }}
          className="mt-7 grid gap-3.5">
          
            <TextField label="Name" value={form.name} onChange={update('name')} required />
            <TextField
            label="Email address"
            type="email"
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
            required />
          
            <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={update('password')}
            hint="At least 6 characters."
            autoComplete="new-password"
            required />
          
            <TextField
            label="Retype password"
            type="password"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            autoComplete="new-password"
            required />
          
            <TextField
            label="Invitation code (optional)"
            value={form.inviteCode}
            onChange={update('inviteCode')} />
          
            <Button type="submit" block size="lg" className="mt-1">
              Send verification code
            </Button>
          </form>

          <p className="mt-5 text-sm text-ink-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Log in
            </Link>
          </p>
        </> :

      <>
          <span className="mt-6 grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-white">
            <MailCheckIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-900">
            Verify your email
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            We sent a 6-digit code to{' '}
            <strong className="text-ink-900">{form.email.trim().toLowerCase()}</strong>. It expires
            in 10 minutes.
          </p>

          <form onSubmit={submit} className="mt-7 grid gap-3.5">
            <TextField
            label="Verification code"
            value={code}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            className="text-center text-lg font-bold tracking-[0.4em]"
            required />
          
            <Button type="submit" block size="lg" disabled={code.length !== 6}>
              Verify & create account
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
            type="button"
            onClick={() => setStep('details')}
            className="font-semibold text-ink-500 hover:text-ink-700">
            
              ← Edit details
            </button>
            <button
            type="button"
            disabled={cooldown > 0}
            onClick={() => requestCode(true)}
            className="font-semibold text-brand-600 disabled:text-ink-300 hover:underline disabled:no-underline">
            
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </>
      }
    </main>);

}