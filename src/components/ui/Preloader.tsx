import React from 'react';

export function Preloader({ message = 'Loading game engine…' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 px-6 text-white selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -top-24 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center">
        {/* Animated Gold Ring & Icon */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Outer glowing pulsing ring */}
          <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20 duration-1000" />
          {/* Rotating dashed gold border */}
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-amber-500/60 duration-[3000ms]" />
          {/* Inner spinning gradient ring */}
          <div className="absolute inset-1.5 animate-spin rounded-full border-2 border-transparent border-t-amber-400 border-r-yellow-300 duration-[1500ms]" />
          {/* Center glowing badge */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 shadow-[0_0_24px_rgba(245,158,11,0.5)]">
            <span className="font-display text-2xl font-black tracking-tighter text-slate-950">
              345
            </span>
          </div>
        </div>

        {/* Brand Name */}
        <div className="mt-6 flex items-center gap-1 font-display text-xl font-extrabold tracking-widest">
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
            PRISMA
          </span>
          <span className="text-white">PLAY</span>
        </div>

        {/* Subtitle / Status message */}
        <p className="mt-2 text-xs font-medium tracking-wide text-slate-400">
          {message}
        </p>

        {/* Animated Progress Bar */}
        <div className="mt-5 h-1.5 w-44 overflow-hidden rounded-full bg-slate-900 border border-amber-500/20">
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        </div>
      </div>
    </div>
  );
}
