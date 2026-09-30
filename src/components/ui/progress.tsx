'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export function Progress({ value, className, color, label, showValue = true }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-xs">
          {label && <span className="font-medium text-muted-foreground">{label}</span>}
          {showValue && <span className="font-bold text-foreground">{Math.round(safeValue)}%</span>}
        </div>
      )}
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', !color && 'bg-gradient-to-r from-violet-600 to-fuchsia-600')}
          style={{ width: `${safeValue}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
