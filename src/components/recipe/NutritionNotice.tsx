import { Info, Flame, ShieldCheck, AlertCircle, PieChart } from 'lucide-react';
import type { PublicRecipe } from '@/lib/recipes/publicQueries';

type Props = Pick<PublicRecipe, 'nutritionStatus' | 'caloriesPerServing' | 'isNutritionVerified' | 'nutritionSnapshot'>;

// §5.5 & AG-36+: Bảng Dinh Dưỡng Chuẩn Việt Nam & Phân tích Calo từng thành phần
// Dữ liệu đối chiếu Bảng thành phần thực phẩm Viện Dinh Dưỡng Quốc Gia
export function NutritionNotice({ nutritionStatus, caloriesPerServing, isNutritionVerified, nutritionSnapshot }: Props) {
  // 1. Trường hợp có Snapshot dinh dưỡng chi tiết
  if (nutritionSnapshot && nutritionSnapshot.perServing) {
    const {
      perServing,
      totalBatch,
      servings,
      coveragePercent,
      source,
      missingIngredients,
      ingredientsDetail,
    } = nutritionSnapshot;

    // Tự động suy luận Huy hiệu Sức khỏe Gia đình từ số liệu Viện Dinh Dưỡng
    const healthBadges: { label: string; className: string }[] = [];
    if (perServing.calories > 0 && perServing.calories <= 350) {
      healthBadges.push({
        label: '🌿 Ít Calo (≤350 kcal)',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      });
    }
    if (perServing.protein >= 18) {
      healthBadges.push({
        label: '💪 Giàu Đạm tự nhiên',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      });
    }
    if (perServing.fiber !== null && perServing.fiber >= 3.5) {
      healthBadges.push({
        label: '🥗 Giàu Chất xơ',
        className: 'bg-teal-50 text-teal-700 border-teal-200',
      });
    }
    if (perServing.sodium !== null && perServing.sodium <= 500) {
      healthBadges.push({
        label: '💚 Dịu mặn (Tốt huyết áp)',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      });
    } else if (perServing.sodium !== null && perServing.sodium > 850) {
      healthBadges.push({
        label: '🧂 Đậm đà (Lưu ý muối)',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
      });
    }

    // Sắp xếp danh sách nguyên liệu theo lượng Calo giảm dần để dễ quan sát thành phần nào đóng góp nhiều năng lượng nhất
    const sortedDetails = Array.isArray(ingredientsDetail)
      ? [...ingredientsDetail].sort(
          (a, b) => (b.nutrients?.calories ?? 0) - (a.nutrients?.calories ?? 0)
        )
      : [];

    const totalBatchCalories = Math.max(1, totalBatch?.calories || 1);

    return (
      <section
        aria-labelledby="nutrition-heading"
        className="rounded-3xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-5 shadow-xs"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-base)] pb-3 mb-3">
          <h2 id="nutrition-heading" className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
            Dinh dưỡng 1 khẩu phần
          </h2>
          {isNutritionVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Chuẩn FCT ({coveragePercent}%)
            </span>
          )}
        </div>

        {/* Huy hiệu Sức khỏe Gia đình */}
        {healthBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {healthBadges.map((b) => (
              <span
                key={b.label}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${b.className}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Năng lượng chính */}
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">
            Năng lượng 1 người ăn (1/{servings} nồi)
          </span>
          <p className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            ~{perServing.calories} <span className="text-xs font-semibold text-[var(--color-text-muted)]">kcal</span>
          </p>
        </div>
        <p className="text-[11px] text-[var(--color-text-muted)] mb-4">
          💡 Tổng cả nồi ({servings} người): <strong>{totalBatch?.calories ?? perServing.calories * servings} kcal</strong> · Ăn kèm 1 chén cơm (+130 kcal) ≈{' '}
          <strong className="text-[var(--color-text-primary)]">~{perServing.calories + 130} kcal/người</strong>
        </p>

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
          <div className="text-[11px] text-[var(--color-text-secondary)] flex justify-between py-1.5 border-t border-[var(--color-border-subtle)]">
            <span>🥗 Chất xơ thực phẩm:</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{perServing.fiber}g / khẩu phần</span>
          </div>
        )}

        {/* BẢNG CHI TIẾT CALO CHO TỪNG THÀNH PHẦN NGUYÊN LIỆU */}
        {sortedDetails.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border-base)]">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" aria-hidden="true" />
                <span>Thông số Calo từng thành phần (Cả nồi)</span>
              </h3>
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                {sortedDetails.length} thành phần
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {sortedDetails.map((item) => {
                const kcal = Math.round(item.nutrients?.calories ?? 0);
                const sharePercent = Math.min(
                  100,
                  Math.max(2, Math.round((kcal / totalBatchCalories) * 100))
                );

                return (
                  <div
                    key={item.ingredientId}
                    className="p-2.5 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--color-text-primary)] truncate">
                        {item.ingredientName}{' '}
                        <span className="font-normal text-[var(--color-text-muted)]">
                          ({item.rawAmount} {item.unit})
                        </span>
                      </span>
                      <span className="font-bold text-amber-700 shrink-0 tabular-nums">
                        {item.hasNutritionData ? `${kcal} kcal` : 'Chưa có'}
                      </span>
                    </div>

                    {item.hasNutritionData && item.nutrients && (
                      <>
                        {/* Thanh tỷ lệ % đóng góp năng lượng */}
                        <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-raised)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${sharePercent}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-[var(--color-text-secondary)]">
                          <span>
                            Đạm <strong>{item.nutrients.protein}g</strong> · Béo <strong>{item.nutrients.fat}g</strong> · Bột <strong>{item.nutrients.carbs}g</strong>
                          </span>
                          <span className="text-[var(--color-text-muted)]">
                            Thực ăn: {Math.round(item.edibleGrams)}g ({Math.round((kcal / totalBatchCalories) * 100)}%)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nguồn dữ liệu & Minh bạch Y khoa */}
        <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] space-y-2">
          <p className="text-[10px] text-[var(--color-text-muted)] flex items-center justify-between">
            <span>Nguồn: {source || 'Viện Dinh Dưỡng'}</span>
            <span>Bao phủ {coveragePercent}%</span>
          </p>
          {missingIngredients && missingIngredients.length > 0 && (
            <p className="text-[10px] text-amber-600/80 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>Chưa có số liệu: {missingIngredients.join(', ')}</span>
            </p>
          )}
          <details className="group rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] px-2.5 py-1.5 text-[10px] text-[var(--color-text-secondary)]">
            <summary className="cursor-pointer font-semibold text-[var(--color-text-primary)] select-none flex items-center justify-between">
              <span>🩺 Căn cứ tính Calo & chế biến (Viện Dinh Dưỡng)</span>
              <span className="text-[9px] text-[var(--color-text-muted)] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <ul className="mt-1.5 space-y-1 pl-3.5 list-disc leading-relaxed text-[10px]">
              <li>
                <strong>Khối lượng thực ăn (Edible Portion):</strong> Đã tự động trừ phần thải bỏ (xương sườn ~25%, vỏ tôm ~40%, cuống rau ~15%) theo Bảng Thành Phần Thực Phẩm Việt Nam (Bộ Y Tế).
              </li>
              <li>
                <strong>Hấp thụ theo cách nấu:</strong> Món luộc/hấp giữ nguyên mức calo gốc; món kho/canh giảm ~25–30% lượng Natri & chất béo nếu không chan hết nước kho.
              </li>
            </ul>
          </details>
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
