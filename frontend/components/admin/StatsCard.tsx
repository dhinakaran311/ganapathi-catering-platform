// components/admin/StatsCard.tsx — E33: Stats card for the admin dashboard

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatsCardProps {
  id: string;
  label: string;
  value: number | string;
  icon: ReactNode;
  /** Percentage change vs last period. Positive = up, negative = down, null = no data */
  trend?: number | null;
  trendLabel?: string;
  accentColor?: 'green' | 'gold' | 'brown' | 'blue';
}

const accentMap = {
  green: {
    bg: 'bg-[var(--color-green-100)]',
    text: 'text-[var(--color-green-700)]',
    border: 'border-t-[var(--color-green-700)]',
  },
  gold: {
    bg: 'bg-[var(--color-gold-100)]',
    text: 'text-[var(--color-gold-700)]',
    border: 'border-t-[var(--color-gold-700)]',
  },
  brown: {
    bg: 'bg-[var(--color-ivory-300)]',
    text: 'text-[var(--color-brown-700)]',
    border: 'border-t-[var(--color-brown-700)]',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-t-blue-700',
  },
};

export default function StatsCard({
  id,
  label,
  value,
  icon,
  trend,
  trendLabel = 'vs last week',
  accentColor = 'green',
}: StatsCardProps) {
  const accent = accentMap[accentColor];
  const trendUp = trend !== null && trend !== undefined && trend > 0;
  const trendDown = trend !== null && trend !== undefined && trend < 0;

  return (
    <div
      id={id}
      className={`bg-white rounded-xl border border-[var(--color-ivory-300)] border-t-2 ${accent.border} p-6 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="font-body text-sm font-semibold text-[var(--color-brown-500)] uppercase tracking-wide">
          {label}
        </p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent.bg} ${accent.text}`}>
          {icon}
        </div>
      </div>

      <p className="font-display text-3xl font-bold text-[var(--color-brown-900)] mb-2">
        {value}
      </p>

      {trend !== null && trend !== undefined && (
        <div className="flex items-center gap-1.5">
          {trendUp && <TrendingUp size={14} className="text-green-600 flex-shrink-0" />}
          {trendDown && <TrendingDown size={14} className="text-red-500 flex-shrink-0" />}
          {!trendUp && !trendDown && <Minus size={14} className="text-[var(--color-brown-400)] flex-shrink-0" />}
          <span
            className={`font-body text-xs font-semibold ${
              trendUp ? 'text-green-600' : trendDown ? 'text-red-500' : 'text-[var(--color-brown-400)]'
            }`}
          >
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          <span className="font-body text-xs text-[var(--color-brown-400)]">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
