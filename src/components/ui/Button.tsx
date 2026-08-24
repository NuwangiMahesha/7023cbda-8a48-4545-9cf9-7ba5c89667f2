import React from 'react';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
  'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-lift disabled:bg-brand-200 disabled:shadow-none',
  secondary:
  'bg-white text-brand-600 border border-brand-200 hover:border-brand-400 hover:bg-brand-50',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-900/5',
  danger: 'bg-win-red text-white hover:brightness-95 active:brightness-90'
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-lg',
  md: 'h-11 px-4 text-sm rounded-xl',
  lg: 'h-12 px-5 text-[15px] rounded-xl'
};

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={twMerge(
        'inline-flex items-center justify-center gap-2 font-semibold tracking-tight',
        'transition-[background-color,color,border-color,transform,box-shadow] duration-150 ease-smooth',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
        'active:scale-[0.985] disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        block ? 'w-full' : '',
        className
      )}
      {...rest} />);


}