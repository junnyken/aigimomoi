'use client';

import { useState, useEffect } from 'react';
import { ShoppingBasket } from 'lucide-react';
import type { PublicRecipeIngredient } from '@/lib/recipes/publicQueries';
import { scaleRecipeIngredients, clampServings, type ScaledIngredient } from '@/lib/recipes/scaling';
import { ServingSelector } from './ServingSelector';

interface IngredientListProps {
  ingredients: PublicRecipeIngredient[];
  baseServings: number;
  initialServings?: number;
}

export function IngredientList({
  ingredients,
  baseServings,
  initialServings,
}: IngredientListProps) {
  const safeBase = clampServings(baseServings, 4);
  const safeInitial = initialServings ? clampServings(initialServings, safeBase) : safeBase;
  const [servings, setServings] = useState<number>(safeInitial);

  // Đọc query param `?servings` khi trang mount trên client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const param = url.searchParams.get('servings');
    if (param) {
      const parsed = Number(param);
      if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 20) {
        setServings(parsed);
      }
    }
  }, []);

  // Đồng bộ số khẩu phần lên URL parameter `?servings=X` mà không reload trang
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (servings === safeBase) {
      url.searchParams.delete('servings');
    } else {
      url.searchParams.set('servings', String(servings));
    }
    window.history.replaceState({}, '', url.toString());
  }, [servings, safeBase]);

  const scaledList = scaleRecipeIngredients(ingredients, safeBase, servings);
  const required = scaledList.filter((i) => !i.isOptional);
  const optional = scaledList.filter((i) => i.isOptional);

  const hasManualAdjust = ingredients.some((i) => i.scalePolicy === 'MANUAL_ADJUST');
  const hasFixed = ingredients.some((i) => i.scalePolicy === 'FIXED');

  return (
    <section
      aria-labelledby="ingredients-heading"
      className="rounded-3xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-5 shadow-xs flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="ingredients-heading" className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <ShoppingBasket className="w-5 h-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
          <span>Nguyên liệu</span>
        </h2>
      </div>

      {/* Serving Selector Component (Invariants §5.4, D21) */}
      <ServingSelector
        baseServings={safeBase}
        currentServings={servings}
        onChange={(val) => setServings(val)}
      />

      {/* Danh sách nguyên liệu chính */}
      <div className="pt-2">
        <IngredientRows items={required} isScaledDifferent={servings !== safeBase} />

        {optional.length > 0 && (
          <>
            <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Tuỳ chọn thêm
            </h3>
            <IngredientRows items={optional} isScaledDifferent={servings !== safeBase} />
          </>
        )}
      </div>

      {/* Ghi chú Invariants §5.4 về nêm nếm gia vị và hương liệu */}
      <div className="mt-2 pt-3 border-t border-[var(--color-border-subtle)] flex flex-col gap-1 text-[11px] text-[var(--color-text-muted)] leading-relaxed">
        {hasManualAdjust && (
          <p>
            <span className="text-[var(--color-accent-text)] font-bold">*</span> Gia vị nêm nếm theo khẩu vị gia đình — hãy nếm và gia giảm dần dần, không áp cứng theo số người.
          </p>
        )}
        {hasFixed && servings !== safeBase && (
          <p>
            <span className="font-semibold text-[var(--color-brand-primary)]">#</span> Hương liệu thảo mộc (hành nướng, gừng, quế hồi...) giữ nguyên lượng để món không bị nồng gắt.
          </p>
        )}
      </div>
    </section>
  );
}

function IngredientRows({
  items,
  isScaledDifferent,
}: {
  items: ScaledIngredient[];
  isScaledDifferent: boolean;
}) {
  return (
    <ul className="divide-y divide-[var(--color-border-subtle)]">
      {items.map((ing) => (
        <li key={ing.id} className="flex items-baseline justify-between gap-4 py-2.5">
          <div className="min-w-0">
            <span className="font-medium text-[var(--color-text-primary)]">{ing.name}</span>
            {ing.scalePolicy === 'MANUAL_ADJUST' && (
              <span className="text-[var(--color-accent-text)] font-semibold ml-0.5" title="Nêm theo khẩu vị">*</span>
            )}
            {ing.scalePolicy === 'FIXED' && isScaledDifferent && (
              <span className="text-[var(--color-brand-primary)] text-[10px] font-semibold ml-1 px-1 py-0.2 rounded bg-[var(--color-brand-primary)]/10" title="Giữ nguyên định lượng">
                cố định
              </span>
            )}
            {ing.preparation && (
              <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">{ing.preparation}</span>
            )}
          </div>

          <div className="shrink-0 text-right">
            <span
              className={`tabular-nums text-sm font-semibold transition-colors ${
                ing.isScaled
                  ? 'text-[var(--color-brand-primary)]'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {ing.formattedAmount} {ing.unit}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
