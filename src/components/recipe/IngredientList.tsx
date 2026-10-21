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
  const [servings, setServings] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const param = url.searchParams.get('servings');
      if (param) {
        const parsed = Number(param);
        if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 20) {
          return parsed;
        }
      }
    }
    return safeInitial;
  });

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

  const [showKitchenGuide, setShowKitchenGuide] = useState(false);
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
        <button
          type="button"
          onClick={() => setShowKitchenGuide((v) => !v)}
          className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
        >
          {showKitchenGuide ? 'Ẩn mẹo đong bếp' : '🥄 Mẹo đong không cần cân'}
        </button>
      </div>

      {showKitchenGuide && (
        <div className="p-3 rounded-2xl bg-[var(--color-brand-light)]/50 border border-[var(--color-brand-border)] text-xs text-[var(--color-text-primary)] space-y-1">
          <p className="font-bold text-[var(--color-brand-primary)]">Quy đổi nhanh dụng cụ bếp gia đình:</p>
          <p>• <strong>1 muỗng canh (tbsp):</strong> ~15ml chất lỏng hoặc ~15g gia vị</p>
          <p>• <strong>1 muỗng cà phê (tsp):</strong> ~5ml hoặc ~5g</p>
          <p>• <strong>100g thịt / cá phi lê:</strong> cỡ bằng 1 lòng bàn tay người lớn</p>
          <p>• <strong>1 chén ăn cơm chuẩn:</strong> ~200ml nước hoặc ~100g cơm chín</p>
        </div>
      )}

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
