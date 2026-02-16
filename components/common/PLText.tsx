'use client';

import { formatCurrency, formatPercent } from '@/utils/formatters';

interface PLTextProps {
  value: number;
  showPercent?: boolean;
  percent?: number;
  className?: string;
  size?: 'sm' | 'base' | 'lg';
}

export default function PLText({ value, showPercent, percent, className = '', size = 'sm' }: PLTextProps) {
  const color = value >= 0 ? 'text-success' : 'text-destructive';
  const sizeClass = size === 'lg' ? 'text-lg' : size === 'base' ? 'text-base' : 'text-sm';
  return (
    <span className={`numeric-data font-bold ${color} ${sizeClass} ${className}`}>
      {value >= 0 ? '+' : ''}{formatCurrency(value)}
      {showPercent && percent !== undefined && (
        <span className="ml-1 text-[10px]">{formatPercent(percent, true)}</span>
      )}
    </span>
  );
}
