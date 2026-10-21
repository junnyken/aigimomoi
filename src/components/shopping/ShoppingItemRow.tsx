'use client';

import { Check } from 'lucide-react';
import type { IngredientTrace } from '@/lib/recipes/aggregation';
import { formatScaledAmount } from '@/lib/recipes/scaling';

interface ShoppingItemRowProps {
  itemKey: string;
  name: string;
  formattedAmount?: string;
  unit?: string;
  isChecked: boolean;
  onToggle: (key: string) => void;
  traces?: IngredientTrace[];
  isSeasoning?: boolean;
}

export function ShoppingItemRow({
  itemKey,
  name,
  formattedAmount,
  unit,
  isChecked,
  onToggle,
  traces = [],
  isSeasoning = false,
}: ShoppingItemRowProps) {
  return (
    <div
      onClick={() => onToggle(itemKey)}
      className={`group w-full p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 sm:gap-4 ${
        isChecked
          ? 'bg-[var(--color-surface-raised)]/60 border-[var(--color-border-subtle)] opacity-75'
          : 'bg-[var(--color-surface-white)] border-[var(--color-border-base)] hover:border-[var(--color-brand-primary)]/50 shadow-xs hover:shadow-sm'
      }`}
      role="checkbox"
      aria-checked={isChecked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle(itemKey);
        }
      }}
    >
      {/* Checkbox Touch Target */}
      <div
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
          isChecked
            ? 'bg-emerald-600 border-emerald-600 text-white'
            : 'border-[var(--color-border-base)] group-hover:border-[var(--color-brand-primary)] bg-[var(--color-surface-white)]'
        }`}
      >
        {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm sm:text-base font-bold transition-all ${
              isChecked
                ? 'line-through text-[var(--color-text-muted)]'
                : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)]'
            }`}
          >
            {name}
          </span>

          {formattedAmount && unit && (
            <span
              className={`text-sm font-bold shrink-0 ${
                isChecked
                  ? 'line-through text-[var(--color-text-muted)]'
                  : 'text-[var(--color-brand-primary)]'
              }`}
            >
              {formattedAmount} <span className="text-xs font-medium text-[var(--color-text-secondary)]">{unit}</span>
            </span>
          )}
        </div>

        {/* Traces */}
        {traces.length > 0 && !isSeasoning && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {traces.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
              >
                {t.recipeName}: {formatScaledAmount(t.scaledAmount)} {t.unit}
                {t.preparation ? ` (${t.preparation})` : ''}
              </span>
            ))}
          </div>
        )}

        {isSeasoning && traces.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {traces.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]"
              >
                {t.recipeName} ({formatScaledAmount(t.scaledAmount)} {t.unit})
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
