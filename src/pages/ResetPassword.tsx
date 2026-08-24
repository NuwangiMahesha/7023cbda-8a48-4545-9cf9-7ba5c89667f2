import React, { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useApp } from '../contexts/AppContext';

export function ResetPassword() {
  const { resetPassword } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (next !== confirm) {
      toast.error('The two new passwords do not match.');
      return;
    }
    const result = resetPassword(current, next);
    if (result.ok) {
      toast.success(result.message);
      setCurrent('');
      setNext('');
      setConfirm('');
    } else {
      toast.error(result.message);
    }
  }

  return (
    <>
      <PageHeader title="Reset Password" />
      <main className="flex-1 overflow-y-auto px-3 pb-8 pt-3">
        <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-white p-4 shadow-card">
          <TextField
            label="Current password"
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            required />
          
          <TextField
            label="New password"
            type="password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            hint="At least 6 characters."
            required />
          
          <TextField
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required />
          
          <Button type="submit" block size="lg">
            Update password
          </Button>
        </form>
      </main>
    </>);

}