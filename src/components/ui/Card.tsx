import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export function Card({ children, className, as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={twMerge('rounded-2xl bg-white p-4 shadow-card', className)}>
      {children}
    </Tag>);

}

export function SectionTitle({
  children,
  action



}: {children: React.ReactNode;action?: React.ReactNode;}) {
  return (
    <div className="mb-2.5 flex items-end justify-between">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
        {children}
      </h2>
      {action}
    </div>);

}