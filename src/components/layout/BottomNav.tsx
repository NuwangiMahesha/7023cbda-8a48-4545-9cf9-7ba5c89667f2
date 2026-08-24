import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3Icon,
  LayoutGridIcon,
  Share2Icon,
  TargetIcon,
  WalletIcon } from
'lucide-react';

const tabs = [
{ to: '/menu', label: 'Menu', Icon: LayoutGridIcon },
{ to: '/win', label: 'Win', Icon: TargetIcon },
{ to: '/wallet', label: 'Wallet', Icon: WalletIcon, center: true },
{ to: '/trend', label: 'Trend', Icon: BarChart3Icon },
{ to: '/promotion', label: 'Promotion', Icon: Share2Icon }];


export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-20 border-t border-ink-300/30 bg-white/95 backdrop-blur">
      
      <ul className="mx-auto flex h-16 items-stretch justify-between px-2">
        {tabs.map(({ to, label, Icon, center }) =>
        <li key={to} className="flex-1">
            <NavLink
            to={to}
            className={({ isActive }) =>
            [
            'flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold',
            'transition-colors duration-150 ease-smooth',
            isActive ? 'text-brand-500' : 'text-ink-500 hover:text-ink-700'].
            join(' ')
            }>
            
              {({ isActive }) =>
            center ?
            <>
                    <span
                className={[
                'grid h-11 w-11 -translate-y-3 place-items-center rounded-full shadow-lift',
                'transition-colors duration-150 ease-smooth',
                isActive ? 'bg-brand-500' : 'bg-brand-400'].
                join(' ')}>
                
                      <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                    <span className="-mt-3">{label}</span>
                  </> :

            <>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span>{label}</span>
                  </>

            }
            </NavLink>
          </li>
        )}
      </ul>
    </nav>);

}