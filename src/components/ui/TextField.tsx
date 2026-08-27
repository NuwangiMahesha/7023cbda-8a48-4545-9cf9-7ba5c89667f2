import React from 'react';
import { twMerge } from 'tailwind-merge';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  adornment?: React.ReactNode;
}

export function TextField({
  label,
  hint,
  adornment,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
        
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={twMerge(
            'h-11 w-full rounded-xl border border-ink-300/50 bg-white px-3.5 text-sm text-ink-900',
            'placeholder:text-ink-300 transition-[border-color,box-shadow] duration-150 ease-smooth',
            'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200',
            adornment ? 'pr-12' : '',
            className
          )}
          {...rest} />
        
        {adornment ?
        <div className="absolute inset-y-0 right-1.5 flex items-center">{adornment}</div> :
        null}
      </div>
      {hint ? (
        <p className="mt-1.5 text-xs font-semibold text-amber-600">{hint}</p>
      ) : null}
    </div>);

}