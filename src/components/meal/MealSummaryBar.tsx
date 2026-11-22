'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Sparkles,
  Clock,
  CheckCircle2,
  Scale,
  HeartPulse,
  CalendarPlus,
  LogIn,
} from 'lucide-react';
import type { MealDishSummary } from '@/lib/meal/mealQueries';
import { formatDuration } from '@/lib/recipes/labels';
import { buildMealQuery } from '@/lib/meal/flowUrls';
import {
  loadPersonalNutritionTarget,
  type PersonalNutritionTarget,
} from '@/lib/nutrition/personalTarget';

interface MealSummaryBarProps {
  main: MealDishSummary | null;
  soup: MealDishSummary | null;
  side: MealDishSummary | null;
  sauce?: MealDishSummary | null;
  servings: number;
}

export function MealSummaryBar({ main, soup, side, sauce, servings }: MealSummaryBarProps) {
  const [personalTarget, setPersonalTarget] = useState<PersonalNutritionTarget | null>(null);
  const [submittingAction, setSubmittingAction] = useState<'diary' | 'planner' | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success-diary' | 'success-planner' | 'auth' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setPersonalTarget(loadPersonalNutritionTarget());
  }, []);

  const dishes = [main, soup, side].filter((d): d is MealDishSummary => Boolean(d));
  const dishesWithSauce = [main, soup, side, sauce].filter((d): d is MealDishSummary => Boolean(d));

  // Thời gian ước tính: người nấu thường làm song song các món (luộc rau trong lúc kho thịt)
  // Thời gian tối thiểu là món lâu nhất, tối đa là tổng thời gian
  const maxTime = dishes.length > 0 ? Math.max(...dishes.map((d) => d.totalTimeMinutes)) : 0;
  const totalTime = dishes.reduce((acc, d) => acc + d.totalTimeMinutes, 0);

  const shoppingUrl = `/shopping?${buildMealQuery({
    mainSlug: main?.slug,
    soupSlug: soup?.slug,
    sideSlug: side?.slug,
    sauceSlug: sauce?.slug,
    servings,
  })}`;

  const getLocalTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getDefaultMealType = () => (new Date().getHours() >= 15 ? 'DINNER' : 'LUNCH');

  const handleLogMealToDiary = async () => {
    if (dishesWithSauce.length === 0) return;
    setSubmittingAction('diary');
    setActionFeedback(null);
    const today = getLocalTodayStr();
    const mealType = getDefaultMealType();

    try {
      let savedCount = 0;
      for (const dish of dishesWithSauce) {
        const res = await fetch('/api/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipeSlug: dish.slug,
            recipeName: dish.name,
            diaryDate: today,
            mealType,
            consumedPortion: 1,
            customCalories: dish.caloriesPerServing ?? undefined,
            customProtein: dish.macrosPerServing?.protein,
            customFat: dish.macrosPerServing?.fat,
            customCarbs: dish.macrosPerServing?.carbs,
            customFiber: dish.macrosPerServing?.fiber ?? undefined,
            customSodium: dish.macrosPerServing?.sodium ?? undefined,
          }),
        });
        if (res.status === 401) {
          setActionFeedback({
            type: 'auth',
            message: 'Vui lòng đăng nhập để lưu mâm cơm này vào Nhật ký dinh dưỡng hôm nay.',
          });
          return;
        }
        if (res.ok) savedCount++;
      }

      if (savedCount > 0) {
        setActionFeedback({
          type: 'success-diary',
          message: `Đã ghi ${savedCount} món trong mâm vào Nhật ký ${
            mealType === 'DINNER' ? 'Bữa tối' : 'Bữa trưa'
          } hôm nay!`,
        });
      } else {
        setActionFeedback({
          type: 'error',
          message: 'Không thể lưu mâm cơm vào Nhật ký lúc này.',
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        message: 'Lỗi kết nối máy chủ khi ghi Nhật ký.',
      });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleAddMealToWeeklyPlanner = async () => {
    if (dishes.length === 0) return;
    setSubmittingAction('planner');
    setActionFeedback(null);
    const today = getLocalTodayStr();
    const mealType = getDefaultMealType();

    try {
      let addedCount = 0;
      for (const dish of dishes) {
        const res = await fetch('/api/meal-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planDate: today,
            mealType,
            recipeSlug: dish.slug,
            customDishName: dish.name,
            servings,
          }),
        });
        if (res.status === 401) {
          setActionFeedback({
            type: 'auth',
            message: 'Vui lòng đăng nhập để đưa mâm cơm vào Kế hoạch bữa ăn 7 ngày.',
          });
          return;
        }
        if (res.ok) addedCount++;
      }

      if (addedCount > 0) {
        setActionFeedback({
          type: 'success-planner',
          message: `Đã đưa ${addedCount} món vào Kế hoạch tuần (${
            mealType === 'DINNER' ? 'Bữa tối' : 'Bữa trưa'
          } hôm nay)!`,
        });
      } else {
        setActionFeedback({
          type: 'error',
          message: 'Không thể đưa mâm cơm vào Lịch tuần lúc này.',
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        message: 'Lỗi kết nối máy chủ khi thêm vào Lịch tuần.',
      });
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <section className="bg-gradient-to-br from-[var(--color-surface-white)] to-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-[var(--color-accent-text)] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[var(--color-accent-primary)]" />
            <span>Sẵn sàng chuẩn bị bữa ăn?</span>
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
            Mâm cơm 3 món tròn vị cho {servings} người ăn
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Hệ thống sẽ tự động gộp các nguyên liệu trùng nhau (thịt heo, hành, tỏi, dầu ăn...) từ cả 3 món để bạn chỉ cần đi chợ 1 lần duy nhất, không lo mua thiếu hay thừa lãng phí.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-[var(--color-brand-primary)]" />
              Nấu khoảng {formatDuration(maxTime)} (nấu song song) ~ {formatDuration(totalTime)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đầy đủ Đạm · Canh thanh · Rau xanh
            </span>
            {personalTarget && (
              <Link
                href="/tinh-calo"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-semibold hover:bg-amber-100 transition-colors"
              >
                <Scale className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
                <span>
                  🎯 Mục tiêu của bạn: ~{personalTarget.dinnerKcal} kcal/bữa tối ({personalTarget.targetCalories} kcal/ngày)
                </span>
              </Link>
            )}
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 flex flex-col gap-2.5">
          <Link
            href={shoppingUrl}
            className="w-full inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-[var(--color-brand-primary)] text-white font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 transition-all"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Xem danh sách đi chợ cả mâm</span>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleLogMealToDiary}
              disabled={submittingAction !== null || dishesWithSauce.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>
                {submittingAction === 'diary' ? 'Đang ghi...' : '📝 Ghi mâm vào Nhật ký'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleAddMealToWeeklyPlanner}
              disabled={submittingAction !== null || dishes.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                {submittingAction === 'planner' ? 'Đang lưu...' : '📅 Đưa vào Lịch tuần'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
            actionFeedback.type.startsWith('success')
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : actionFeedback.type === 'auth'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type.startsWith('success') ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <LogIn className="w-4 h-4 text-amber-700 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          {actionFeedback.type === 'success-diary' && (
            <Link
              href="/nhat-ky"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs font-bold"
            >
              Mở Nhật ký Bữa ăn →
            </Link>
          )}
          {actionFeedback.type === 'success-planner' && (
            <Link
              href="/ke-hoach-tuan"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs font-bold"
            >
              Mở Kế hoạch tuần →
            </Link>
          )}
          {actionFeedback.type === 'auth' && (
            <Link
              href="/login?from=/meal"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs font-bold"
            >
              Đăng nhập ngay →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
