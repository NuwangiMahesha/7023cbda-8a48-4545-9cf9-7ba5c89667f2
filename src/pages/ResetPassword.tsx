import React, { useState } from 'react';
import { MailIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';

export function ResetPassword() {
  const { user, resetPassword, sendPasswordResetEmail } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (next !== confirm) {
      toast.error('The two new passwords do not match.');
      return;
    }
    if (next.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const result = await resetPassword(current, next);
    setLoading(false);
    if (result.ok) {
      toast.success(result.message);
      setCurrent('');
      setNext('');
      setConfirm('');
    } else {
      toast.error(result.message);
    }
  }

  async function handleSendEmail() {
    if (!user?.email) return;
    setEmailLoading(true);
    const result = await sendPasswordResetEmail(user.email);
    setEmailLoading(false);
    if (result.ok) {
      toast.success(result.message, { duration: 6000 });
    } else {
      toast.error(result.message);
    }
  }

  return (
    <>
      <PageHeader title="Password & Security" />
      <main className="flex-1 overflow-y-auto px-3 pb-8 pt-3">
        <form onSubmit={submit} className="grid gap-3.5 rounded-2xl bg-white p-4 shadow-card">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            Change Password
          </h2>

          <TextField
            label="Current password"
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
            required
          />

          <TextField
            label="New password"
            type="password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            hint="At least 6 characters."
            autoComplete="new-password"
            required
          />

          <TextField
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            required
          />

          <Button type="submit" block size="lg" disabled={loading} className="mt-1">
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>

        <section aria-label="Email reset" className="mt-4 rounded-2xl bg-white p-4 shadow-card">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
            Reset via Email
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">
            Forgot your current password? We can send a secure reset link to{' '}
            <strong className="text-ink-900">{user?.email}</strong>.
          </p>
          <Button
            type="button"
            variant="secondary"
            block
            size="md"
            className="mt-3.5"
            disabled={emailLoading}
            onClick={handleSendEmail}
          >
            <MailIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            {emailLoading ? 'Sending link…' : 'Send password reset link to email'}
          </Button>
        </section>
      </main>
    </>
  );
}