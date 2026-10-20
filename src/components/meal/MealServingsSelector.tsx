'use client';

import { Users, Minus, Plus } from 'lucide-react';

interface MealServingsSelectorProps {
  servings: number;
  onChange: (servings: number) => void;
}

export function MealServingsSelector({ servings, onChange }: MealServingsSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl p-1.5 shadow-xs">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, servings - 1))}
        disabled={servings <= 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label="Giảm khẩu phần cả mâm"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="px-3 flex items-center gap-1.5 text-center min-w-[100px] justify-center">
        <Users className="w-4 h-4 text-[var(--color-brand-primary)]" />
        <span className="text-base font-bold text-[var(--color-text-primary)]">{servings}</span>
        <span className="text-xs text-[var(--color-text-secondary)]">người</span>
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(20, servings + 1))}
        disabled={servings >= 20}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label="Tăng khẩu phần cả mâm"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
