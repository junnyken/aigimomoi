import { Info, Flame, ShieldCheck, AlertCircle } from 'lucide-react';
import type { PublicRecipe } from '@/lib/recipes/publicQueries';

type Props = Pick<PublicRecipe, 'nutritionStatus' | 'caloriesPerServing' | 'isNutritionVerified' | 'nutritionSnapshot'>;

// §5.5 & AG-36: Bảng Dinh Dưỡng Chuẩn Việt Nam (Vietnam Standard Nutrition Facts)
// Dữ liệu đối chiếu Bảng thành phần thực phẩm Viện Dinh Dưỡng Quốc Gia
export function NutritionNotice({ nutritionStatus, caloriesPerServing, isNutritionVerified, nutritionSnapshot }: Props) {
  // 1. Trường hợp có Snapshot dinh dưỡng chi tiết
  if (nutritionSnapshot && nutritionSnapshot.perServing) {
    const { perServing, coveragePercent, source, missingIngredients } = nutritionSnapshot;

    return (
      <section
        aria-labelledby="nutrition-heading"
        className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-5 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-base)] pb-3 mb-3">
          <h2 id="nutrition-heading" className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
            Dinh dưỡng 1 khẩu phần
          </h2>
          {isNutritionVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Đã kiểm định ({coveragePercent}%)
            </span>
          )}
        </div>

        {/* Năng lượng chính */}
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">Năng lượng</span>
          <p className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            ~{perServing.calories} <span className="text-xs font-semibold text-[var(--color-text-muted)]">kcal</span>
          </p>
        </div>

        {/* Bảng phân tích Đạm / Béo / Đường bột / Natri */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="p-2.5 rounded-xl bg-[var(--color-surface-subtle)] flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)]">🥩 Chất đạm:</span>
            <span className="font-bold text-[var(--color-text-primary)]">{perServing.protein}g</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--color-surface-subtle)] flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)]">🧈 Chất béo:</span>
            <span className="font-bold text-[var(--color-text-primary)]">{perServing.fat}g</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--color-surface-subtle)] flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)]">🍚 Đường bột:</span>
            <span className="font-bold text-[var(--color-text-primary)]">{perServing.carbs}g</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--color-surface-subtle)] flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)]">🧂 Natri:</span>
            <span className="font-bold text-[var(--color-text-primary)]">
              {perServing.sodium !== null ? `${perServing.sodium}mg` : '—'}
            </span>
          </div>
        </div>

        {/* Chất xơ nếu có */}
        {perServing.fiber !== null && (
          <div className="text-[11px] text-[var(--color-text-secondary)] flex justify-between py-1 border-t border-[var(--color-border-subtle)]">
            <span>🥗 Chất xơ thực phẩm:</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{perServing.fiber}g</span>
          </div>
        )}

        {/* Nguồn dữ liệu & Minh bạch */}
        <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)]">
          <p className="text-[10px] text-[var(--color-text-muted)] flex items-center justify-between">
            <span>Nguồn: {source || 'Viện Dinh Dưỡng'}</span>
            <span>Bao phủ {coveragePercent}%</span>
          </p>
          {missingIngredients && missingIngredients.length > 0 && (
            <p className="text-[10px] text-amber-600/80 mt-1 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>Chưa có số liệu: {missingIngredients.join(', ')}</span>
            </p>
          )}
        </div>
      </section>
    );
  }

  // 2. Trường hợp chỉ có số calo ước tính cơ bản
  if (nutritionStatus === 'ESTIMATED' && caloriesPerServing !== null) {
    return (
      <section
        aria-labelledby="nutrition-heading"
        className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-4"
      >
        <h2 id="nutrition-heading" className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
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

  // 3. Chưa có dữ liệu
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
