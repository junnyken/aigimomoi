'use client';

import { CheckCircle2, ShoppingBag } from 'lucide-react';

interface ShoppingProgressBarProps {
  total: number;
  checkedCount: number;
}

export function ShoppingProgressBar({ total, checkedCount }: ShoppingProgressBarProps) {
  const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  const isComplete = total > 0 && checkedCount === total;

  return (
    <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl p-4 shadow-xs flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
          <ShoppingBag className="w-4 h-4 text-[var(--color-brand-primary)]" />
          <span>Tiến độ nhặt đồ vào giỏ:</span>
        </span>
        <span className={isComplete ? 'text-emerald-700 font-bold flex items-center gap-1' : 'text-[var(--color-brand-primary)] font-bold'}>
          {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {checkedCount} / {total} món ({percent}%)
        </span>
      </div>

      <div className="w-full h-3 bg-[var(--color-surface-raised)] rounded-full overflow-hidden p-0.5" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete
              ? 'bg-emerald-600'
              : 'bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-accent-primary)]'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
