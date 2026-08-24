import React from 'react';
import { colorsForDigit } from '../../utils/game';

const hex: Record<string, string> = {
  green: '#12b76a',
  red: '#f04438',
  violet: '#7a3ff0'
};

const sizes = {
  sm: 'h-6 w-6 text-[11px]',
  md: 'h-8 w-8 text-sm',
  lg: 'h-11 w-11 text-base'
};

export function ResultBall({
  digit,
  size = 'md'



}: {digit: number;size?: keyof typeof sizes;}) {
  const colors = colorsForDigit(digit);
  const background =
  colors.length === 2 ?
  `linear-gradient(135deg, ${hex[colors[0]]} 0 50%, ${hex[colors[1]]} 50% 100%)` :
  hex[colors[0]];

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${sizes[size]}`}
      style={{ background }}
      aria-label={`Winning number ${digit}, ${colors.join(' and ')}`}>
      
      {digit}
    </span>);

}

export function ResultDots({ colors }: {colors: string[];}) {
  return (
    <span className="inline-flex items-center gap-1">
      {colors.map((color) =>
      <span
        key={color}
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: hex[color] }}
        aria-hidden="true" />

      )}
      <span className="sr-only">{colors.join(' and ')}</span>
    </span>);

}