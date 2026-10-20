'use client';

import { Users, Minus, Plus, RotateCcw } from 'lucide-react';
import { MIN_SERVINGS, MAX_SERVINGS } from '@/lib/recipes/scaling';

interface ServingSelectorProps {
  baseServings: number;
  currentServings: number;
  onChange: (newServings: number) => void;
  className?: string;
}

export function ServingSelector({
  baseServings,
  currentServings,
  onChange,
  className = '',
}: ServingSelectorProps) {
  const isDifferentFromBase = currentServings !== baseServings;
  const ratio = currentServings / baseServings;

  function handleDecrement() {
    if (currentServings > MIN_SERVINGS) {
      onChange(currentServings - 1);
    }
  }

  function handleIncrement() {
    if (currentServings < MAX_SERVINGS) {
      onChange(currentServings + 1);
    }
  }

  function handleReset() {
    onChange(baseServings);
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
          <span>Khẩu phần ăn</span>
        </span>

        {isDifferentFromBase && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] transition-colors"
            title={`Đặt lại về ${baseServings} người`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Gốc ({baseServings} người)</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-2xl p-1.5">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={currentServings <= MIN_SERVINGS}
          className="w-8 h-8 rounded-xl bg-[var(--color-surface-white)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-brand-primary)] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all shadow-2xs"
          aria-label="Giảm 1 người"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="flex items-baseline gap-1.5 px-3">
          <span className="text-base font-bold text-[var(--color-text-primary)] tabular-nums">
            {currentServings}
          </span>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">người</span>

          {isDifferentFromBase && (
            <span className="ml-1 text-[11px] font-semibold px-1.5 py-0.2 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
              x{ratio.toFixed(ratio % 1 === 0 ? 0 : 1)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={currentServings >= MAX_SERVINGS}
          className="w-8 h-8 rounded-xl bg-[var(--color-surface-white)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-brand-primary)] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all shadow-2xs"
          aria-label="Tăng 1 người"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
