import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ink-300/30 bg-white px-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="grid h-9 w-9 place-items-center rounded-full text-brand-500 transition-colors duration-150 ease-smooth hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
        
        <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      <h1 className="font-display text-base font-bold tracking-tight text-ink-900">{title}</h1>
      <div className="ml-auto">{action}</div>
    </header>);

}