import { ShoppingBasket, Users } from 'lucide-react';
import type { PublicRecipeIngredient } from '@/lib/recipes/publicQueries';
import { formatAmount } from '@/lib/recipes/labels';

interface Props {
  ingredients: PublicRecipeIngredient[];
  baseServings: number;
}

export function IngredientList({ ingredients, baseServings }: Props) {
  const required = ingredients.filter((i) => !i.isOptional);
  const optional = ingredients.filter((i) => i.isOptional);

  return (
    <section
      aria-labelledby="ingredients-heading"
      className="rounded-3xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-5 shadow-xs"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 id="ingredients-heading" className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <ShoppingBasket className="w-5 h-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
          Nguyên liệu
        </h2>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)]">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          Cho {baseServings} người
        </span>
      </div>

      <IngredientRows items={required} />

      {optional.length > 0 && (
        <>
          <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Tuỳ chọn thêm
          </h3>
          <IngredientRows items={optional} />
        </>
      )}

      {ingredients.some((i) => i.scalePolicy === 'MANUAL_ADJUST') && (
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          <span className="text-[var(--color-accent-text)] font-semibold">*</span> Nêm nếm theo khẩu vị gia đình — lượng ghi là gợi ý.
        </p>
      )}
    </section>
  );
}

function IngredientRows({ items }: { items: PublicRecipeIngredient[] }) {
  return (
    <ul className="divide-y divide-[var(--color-border-subtle)]">
      {items.map((ing) => (
        <li key={ing.id} className="flex items-baseline justify-between gap-4 py-2.5">
          <div className="min-w-0">
            <span className="font-medium text-[var(--color-text-primary)]">{ing.name}</span>
            {ing.scalePolicy === 'MANUAL_ADJUST' && (
              <span className="text-[var(--color-accent-text)] font-semibold" aria-label="nêm theo khẩu vị">*</span>
            )}
            {ing.preparation && (
              <span className="block text-xs text-[var(--color-text-muted)]">{ing.preparation}</span>
            )}
          </div>
          <span className="shrink-0 tabular-nums text-sm font-semibold text-[var(--color-text-secondary)]">
            {formatAmount(ing.amount)} {ing.unit}
          </span>
        </li>
      ))}
    </ul>
  );
}
