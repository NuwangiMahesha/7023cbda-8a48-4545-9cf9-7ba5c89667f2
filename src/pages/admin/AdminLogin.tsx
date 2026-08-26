import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useApp } from '../../contexts/AppContext';
import { Preloader } from '../../components/ui/Preloader';

export function AdminLogin() {
  const { adminLogin, authLoading } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin1234');
  const [loggingIn, setLoggingIn] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoggingIn(true);
    setTimeout(() => {
      const result = adminLogin(username, password);
      if (result.ok) {
        toast.success(result.message);
        navigate('/admin/dashboard');
      } else {
        setLoggingIn(false);
        toast.error(result.message);
      }
    }, 600);
  }

  if (authLoading || loggingIn) {
    return <Preloader message="Verifying administrator session…" />;
  }

  return (
    <main className="grid min-h-screen w-full place-items-center bg-ink-900 px-5 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-white">
          <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink-900">
          Administrator portal
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Separate credentials from the player app. All actions are audited.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-3.5">
          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <Button type="submit" block size="lg">
            Enter control panel
          </Button>
        </form>
      </div>
    </main>
  );
}