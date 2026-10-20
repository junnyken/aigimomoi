import { Info, Flame } from 'lucide-react';
import type { PublicRecipe } from '@/lib/recipes/publicQueries';

type Props = Pick<PublicRecipe, 'nutritionStatus' | 'caloriesPerServing' | 'isNutritionVerified'>;

// §5.5: nhãn dinh dưỡng tách khỏi publishing; không hiển thị con số khi chưa có dữ liệu.
export function NutritionNotice({ nutritionStatus, caloriesPerServing, isNutritionVerified }: Props) {
  if (nutritionStatus === 'ESTIMATED' && caloriesPerServing !== null) {
    return (
      <section
        aria-labelledby="nutrition-heading"
        className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-4"
      >
        <h2 id="nutrition-heading" className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-[var(--color-accent-primary)]" aria-hidden="true" />
          Dinh dưỡng (ước tính)
        </h2>
        <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
          ~{caloriesPerServing} <span className="text-sm font-medium text-[var(--color-text-secondary)]">kcal / khẩu phần</span>
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {isNutritionVerified
            ? 'Số liệu ước tính có nguồn, đã được kiểm chứng.'
            : 'Số liệu ước tính, chưa được kiểm chứng độc lập.'}
        </p>
      </section>
    );
  }

  const message =
    nutritionStatus === 'INCOMPLETE'
      ? 'Dữ liệu dinh dưỡng của món này chưa đầy đủ nên chưa hiển thị con số.'
      : 'Món này chưa có dữ liệu dinh dưỡng.';

  return (
    <p className="flex items-start gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3 text-xs text-[var(--color-text-secondary)]">
      <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      {message}
    </p>
  );
}
