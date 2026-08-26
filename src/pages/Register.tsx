import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';

export function Register() {
  const { register } = useApp();
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
      toast.success(result.message, { duration: 5000 });
      navigate('/win');
    } else {
      toast.error(result.message);
    }
  }

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