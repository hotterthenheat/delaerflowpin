/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MetricCardProps {
  id?: string;
  label: string;
  value: string | number;
  subValue?: string | number;
  type?: 'bullish' | 'bearish' | 'neutral' | 'default';
  className?: string;
  icon?: React.ReactNode;
}

export function MetricCard({
  id,
  label,
  value,
  subValue,
  type = 'default',
  className = '',
  icon,
}: MetricCardProps) {
  const badgeStyles = {
    bullish: 'border-emerald-950/50 bg-emerald-950/20 text-emerald-400',
    bearish: 'border-rose-950/50 bg-rose-950/20 text-rose-400',
    neutral: 'border-amber-950/50 bg-amber-950/20 text-amber-400',
    default: 'border-zinc-800 bg-zinc-900/60 text-zinc-300',
  };

  return (
    <div
      id={id}
      className={`rounded-sm border p-3 flex flex-col justify-between transition-all duration-300 ${badgeStyles[type]} ${className}`}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="text-[10px] md:text-xs font-medium tracking-tight text-zinc-500 uppercase">
          {label}
        </span>
        {icon && <div className="text-zinc-500">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-lg md:text-xl font-mono font-bold tracking-tight text-zinc-100">
          {value}
        </span>
        {subValue !== undefined && (
          <span className="text-[10px] md:text-xs font-mono text-zinc-400 truncate max-w-[50%]">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}
