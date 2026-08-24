import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';

export function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@prismaplay.io');
  const [password, setPassword] = useState('demo1234');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = login(email, password);
    if (result.ok) {
      toast.success(result.message);
      navigate('/win');
    } else {
      toast.error(result.message);
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center px-5 py-10">
      <Logo />
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
          required />
        
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required />
        
        <Button type="submit" block size="lg" className="mt-1">
          Log in
        </Button>
      </form>

      <p className="mt-5 text-sm text-ink-500">
        New here?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-xl bg-white p-3.5 text-xs leading-relaxed text-ink-500 shadow-card">
        Demo player: <strong className="text-ink-900">demo@prismaplay.io / demo1234</strong>
        <br />
        Administrator portal:{' '}
        <Link to="/admin" className="font-semibold text-brand-600 hover:underline">
          /admin
        </Link>{' '}
        — admin / admin1234
      </div>
    </main>);

}