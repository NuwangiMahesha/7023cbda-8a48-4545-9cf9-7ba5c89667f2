import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppShell({ showNav = true }: { showNav?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] w-full justify-center bg-slate-900/5 antialiased">
      <div className="flex min-h-[100dvh] w-full max-w-[480px] flex-col border-x border-ink-300/30 bg-surface-page shadow-2xl">
        <Outlet />
        {showNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}