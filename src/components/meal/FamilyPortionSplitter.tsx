'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  LogIn,
  Utensils,
} from 'lucide-react';
import type { MealDishSummary } from '@/lib/meal/mealPresets';

interface FamilyPortionSplitterProps {
  main: MealDishSummary | null;
  soup: MealDishSummary | null;
  side: MealDishSummary | null;
  sauce: MealDishSummary | null;
  servings: number;
}

interface MemberArchetype {
  id: string;
  memberName: string;
  title: string;
  badgeColor: string;
  riceBowls: number;
  riceLabel: string;
  isBrownRice: boolean;
  dishFactor: number;
  guidance: string;
}

const ARCHETYPES: MemberArchetype[] = [
  {
    id: 'bo',
    memberName: 'Bố',
    title: '💪 Bố / Người lao động',
    badgeColor: 'bg-blue-50 text-blue-900 border-blue-200',
    riceBowls: 1.5,
    riceLabel: '1.5 chén cơm trắng',
    isBrownRice: false,
    dishFactor: 1.2,
    guidance: '1.5 chén cơm trắng + 1.2 phần đạm món mặn + rau canh thoải mái.',
  },
  {
    id: 'me',
    memberName: 'Mẹ',
    title: '🥗 Mẹ giữ dáng / Giảm cân',
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    riceBowls: 0.5,
    riceLabel: '½ chén cơm gạo lứt',
    isBrownRice: true,
    dishFactor: 0.85,
    guidance: '½ chén cơm (ưu tiên gạo lứt) + ăn rau & canh trước + gắp phần nạc, hạn chế rưới nước kho.',
  },
  {
    id: 'be',
    memberName: 'Bé',
    title: '🧒 Bé nhỏ',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
    riceBowls: 1.0,
    riceLabel: '1 chén cơm mềm',
    isBrownRice: false,
    dishFactor: 0.75,
    guidance: '1 chén cơm mềm + 0.75 phần thịt/cá xé nhỏ + canh ngọt tự nhiên, không chấm ớt cay.',
  },
  {
    id: 'ongba',
    memberName: 'Ông Bà',
    title: '🩺 Ông Bà / Huyết áp & Đường huyết',
    badgeColor: 'bg-rose-50 text-rose-900 border-rose-200',
    riceBowls: 0.75,
    riceLabel: '¾ chén cơm',
    isBrownRice: false,
    dishFactor: 0.85,
    guidance: '¾ chén cơm + ưu tiên món luộc/canh thanh + gắp ráo sốt mặn, hạn chế chấm thêm nước mắm.',
  },
];

export function FamilyPortionSplitter({
  main,
  soup,
  side,
  sauce,
  servings,
}: FamilyPortionSplitterProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(['bo', 'me', 'be', 'ongba']);
  const [mealSlot, setMealSlot] = useState<'LUNCH' | 'DINNER'>('DINNER');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'auth' | 'error';
    message: string;
  } | null>(null);

  const dishes = [main, soup, side, sauce].filter((d): d is MealDishSummary => Boolean(d));
  if (dishes.length === 0) return null;

  const baseDishKcal = dishes.reduce((sum, d) => sum + (d.caloriesPerServing ?? 0), 0);
  const baseProtein = dishes.reduce((sum, d) => sum + (d.macrosPerServing?.protein ?? 0), 0);
  const baseFat = dishes.reduce((sum, d) => sum + (d.macrosPerServing?.fat ?? 0), 0);
  const baseCarbs = dishes.reduce((sum, d) => sum + (d.macrosPerServing?.carbs ?? 0), 0);
  const baseFiber = dishes.reduce((sum, d) => sum + (d.macrosPerServing?.fiber ?? 0), 0);
  const baseSodium = dishes.reduce((sum, d) => sum + (d.macrosPerServing?.sodium ?? 0), 0);

  const hasHighSodiumForElderly = baseSodium > 800;

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  function computeMemberTotals(arch: MemberArchetype) {
    const ricePerBowl = arch.isBrownRice
      ? { kcal: 110, protein: 2.6, fat: 0.9, carbs: 23.0, fiber: 1.8, sodium: 4 }
      : { kcal: 130, protein: 2.7, fat: 0.3, carbs: 28.2, fiber: 0.4, sodium: 2 };

    // Ông bà gắp ráo nước kho/chấm nên giảm ~20% natri ước tính
    const sodiumMultiplier = arch.id === 'ongba' ? arch.dishFactor * 0.8 : arch.dishFactor;

    const kcal = Math.round(
      arch.riceBowls * ricePerBowl.kcal + baseDishKcal * arch.dishFactor
    );
    const protein =
      Math.round((arch.riceBowls * ricePerBowl.protein + baseProtein * arch.dishFactor) * 10) / 10;
    const fat =
      Math.round((arch.riceBowls * ricePerBowl.fat + baseFat * arch.dishFactor) * 10) / 10;
    const carbs =
      Math.round((arch.riceBowls * ricePerBowl.carbs + baseCarbs * arch.dishFactor) * 10) / 10;
    const fiber =
      Math.round((arch.riceBowls * ricePerBowl.fiber + baseFiber * arch.dishFactor) * 10) / 10;
    const sodium = Math.round(arch.riceBowls * ricePerBowl.sodium + baseSodium * sodiumMultiplier);

    return { kcal, protein, fat, carbs, fiber, sodium };
  }

  async function handleLogMembersToDiary() {
    const activeMembers = ARCHETYPES.filter((a) => selectedIds.includes(a.id));
    if (activeMembers.length === 0) return;

    setSaving(true);
    setFeedback(null);
    const todayStr = new Date().toISOString().split('T')[0];
    const mealNameSummary = [main?.name, soup?.name, side?.name].filter(Boolean).join(' + ');

    try {
      const responses = await Promise.all(
        activeMembers.map((arch) => {
          const stats = computeMemberTotals(arch);
          return fetch('/api/diary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipeName: `🍽️ ${mealNameSummary || 'Mâm cơm gia đình'} (${arch.riceLabel})`,
              diaryDate: todayStr,
              mealType: mealSlot,
              memberName: arch.memberName,
              consumedPortion: 1,
              customCalories: stats.kcal,
              customProtein: stats.protein,
              customFat: stats.fat,
              customCarbs: stats.carbs,
              customFiber: stats.fiber,
              customSodium: stats.sodium,
            }),
          });
        })
      );

      if (responses.some((r) => r.status === 401)) {
        setFeedback({
          type: 'auth',
          message: 'Hãy đăng nhập để ghi khẩu phần chia sẵn cho từng thành viên vào Nhật ký.',
        });
        return;
      }

      if (responses.every((r) => r.ok)) {
        setFeedback({
          type: 'success',
          message: `Đã ghi khẩu phần của ${activeMembers
            .map((m) => m.memberName)
            .join(', ')} vào Nhật ký hôm nay!`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Một số khẩu phần chưa lưu được. Vui lòng thử lại.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Lỗi kết nối khi lưu Nhật ký gia đình.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="family-portion-splitter-heading"
      className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-brand-primary)]">
            <Users className="w-3.5 h-3.5" />
            <span>1 Nồi – 4 Nhịp Ăn Khác Nhau ({servings} người)</span>
          </div>
          <h2
            id="family-portion-splitter-heading"
            className="text-base sm:text-lg font-extrabold text-[var(--color-text-primary)] mt-0.5"
          >
            Chia khẩu phần cùng 1 mâm cơm cho từng thành viên
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Nấu chung một mâm nhưng mẹ giảm cân vẫn ăn nhẹ tinh bột, bố đủ năng lượng lao động, bé và ông bà đều vừa vặn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-subtle)] p-1">
            {(
              [
                { key: 'LUNCH', label: '🌤️ Bữa trưa' },
                { key: 'DINNER', label: '🌙 Bữa tối' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setMealSlot(opt.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  mealSlot === opt.key
                    ? 'bg-[var(--color-surface-white)] text-[var(--color-brand-primary)] shadow-2xs'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleLogMembersToDiary}
            disabled={saving || selectedIds.length === 0}
            className="min-h-10 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs font-extrabold hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <HeartPulse className="w-4 h-4" />
            <span>
              {saving
                ? 'Đang ghi...'
                : `📝 Ghi Nhật ký (${selectedIds.length} người)`}
            </span>
          </button>
        </div>
      </div>

      {hasHighSodiumForElderly && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý cho Ông Bà / người cao huyết áp:</strong> Tổng lượng Natri ước tính của 1 phần đầy đủ đang ở mức ~
            {Math.round(baseSodium)}mg. Nên gắp phần thịt/cá ráo nước kho, ưu tiên ăn canh thanh và không chấm thêm nước mắm mặn.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ARCHETYPES.map((arch) => {
          const checked = selectedIds.includes(arch.id);
          const stats = computeMemberTotals(arch);
          return (
            <div
              key={arch.id}
              onClick={() => toggleMember(arch.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleMember(arch.id);
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                checked
                  ? 'bg-[var(--color-surface-subtle)] border-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/40'
                  : 'bg-[var(--color-surface-white)] border-[var(--color-border-base)] opacity-65'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-bold ${arch.badgeColor}`}
                  >
                    {arch.title}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(arch.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Chọn ghi nhật ký cho ${arch.memberName}`}
                    className="w-4 h-4 accent-[var(--color-brand-primary)] cursor-pointer mt-0.5"
                  />
                </div>

                <div className="flex items-baseline gap-1.5 pt-1">
                  <strong className="text-lg font-black text-[var(--color-accent-primary)]">
                    {stats.kcal}
                  </strong>
                  <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                    kcal/bữa
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                  <span>Đạm {stats.protein}g</span>
                  <span>• Béo {stats.fat}g</span>
                  <span>• Bột {stats.carbs}g</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] leading-snug flex items-start gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[var(--color-brand-primary)] shrink-0 mt-0.5" />
                <span>{arch.guidance}</span>
              </div>
            </div>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : feedback.type === 'auth'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <LogIn className="w-4 h-4 text-amber-700 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          {feedback.type === 'success' ? (
            <Link
              href="/nhat-ky"
              className="shrink-0 px-3 py-1 rounded-lg bg-[var(--color-brand-primary)] text-white text-xs font-bold"
            >
              Mở Nhật ký Gia đình →
            </Link>
          ) : feedback.type === 'auth' ? (
            <Link
              href="/login?from=/meal"
              className="shrink-0 px-3 py-1 rounded-lg bg-[var(--color-brand-primary)] text-white text-xs font-bold"
            >
              Đăng nhập ngay
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
