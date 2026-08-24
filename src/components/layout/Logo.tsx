import React from 'react';

export function Logo({ compact = false }: {compact?: boolean;}) {
  return (
    <span className="inline-flex items-baseline font-display text-lg font-extrabold tracking-tight">
      <span className="text-brand-500">PRISMA</span>
      {compact ? null : <span className="ml-1 text-ink-900">PLAY</span>}
    </span>);

}