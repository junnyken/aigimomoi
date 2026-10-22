'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dices,
  Flame,
  Clock,
  ShoppingBag,
  Utensils,
  RefreshCw,
  Wallet,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { MealDishSummary } from '@/lib/meal/mealPresets';
import { estimateMealTrayCostVnd } from '@/lib/recipes/marketTips';

interface RandomMealResponse {
  mainSlug: string;
  soupSlug: string;
  sideSlug: string;
  main?: MealDishSummary;
  soup?: MealDishSummary;
  side?: MealDishSummary;
}

export function QuickRandomMealSpinner() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<RandomMealResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSpin = async () => {
    setSpinning(true);
    setError(null);
    try {
      const res = await fetch('/api/meal/random', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Chưa thể quay mâm cơm lúc này');
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối khi quay mâm cơm');
    } finally {
      setSpinning(false);
    }
  };

  const dishes = result
    ? [
        { roleLabel: 'Món Mặn', badge: 'bg-orange-100 text-orange-800', dish: result.main },
        { roleLabel: 'Món Canh', badge: 'bg-emerald-100 text-emerald-800', dish: result.soup },
        { roleLabel: 'Món Rau / Phụ', badge: 'bg-lime-100 text-lime-800', dish: result.side },
      ].filter((x): x is { roleLabel: string; badge: string; dish: MealDishSummary } => Boolean(x.dish))
    : [];

  const totalDishesKcal = dishes.reduce((sum, item) => sum + (item.dish.caloriesPerServing ?? 180), 0);
  const totalWithRiceKcal = totalDishesKcal + 130; // +1 chén cơm trắng vừa (130 kcal)
  const maxTimeMins = dishes.reduce((max, item) => Math.max(max, item.dish.totalTimeMinutes || 25), 25);
  const budgetEst = estimateMealTrayCostVnd(
    dishes.map((d) => d.dish),
    4
  );

  const mealUrl = result
    ? `/meal?main=${encodeURIComponent(result.mainSlug)}&soup=${encodeURIComponent(
        result.soupSlug
      )}&side=${encodeURIComponent(result.sideSlug)}&servings=4`
    : '/meal';

  const shoppingUrl = result
    ? `/shopping?main=${encodeURIComponent(result.mainSlug)}&soup=${encodeURIComponent(
        result.soupSlug
      )}&side=${encodeURIComponent(result.sideSlug)}&servings=4`
    : '/shopping';

  return (
    <div className="w-full mt-5">
      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning}
          className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold bg-gradient-to-r from-[#3F6240] to-[#2E4B2F] hover:from-[#324f33] hover:to-[#243c25] text-white shadow-sm transition-all text-xs sm:text-sm cursor-pointer disabled:opacity-60"
        >
          <Dices className={`w-4 h-4 text-amber-300 ${spinning ? 'animate-spin' : ''}`} />
          <span>
            {spinning
              ? 'Đang xoay mâm cơm...'
              : result
              ? '🎲 Quay lại mâm cơm khác!'
              : '🎲 Chưa biết ăn gì? Bấm quay mâm cơm ngẫu nhiên!'}
          </span>
        </button>

        <Link
          href="/tinh-calo"
          className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold bg-white/95 hover:bg-white text-[#3F6240] border border-[#BCD0BE] shadow-2xs transition-all text-xs sm:text-sm"
        >
          <Sparkles className="w-4 h-4 text-[#B75B35] shrink-0" />
          <span>⚖️ Tính TDEE / BMI &amp; Calo cá nhân</span>
        </Link>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>
      )}

      {result && dishes.length > 0 && (
        <div className="mt-4 p-4 sm:p-5 rounded-3xl bg-white/95 border-2 border-[#BCD0BE] shadow-md text-left space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B75B35]">
                ✨ Kết quả vòng quay bữa cơm gia đình (4 người)
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#2D2A26]">
                Mâm cơm 3 món cân bằng Đạm • Xơ • Canh ngọt
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                ~{totalWithRiceKcal} kcal/người (gồm 1 chén cơm)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                Đi chợ: {budgetEst.formattedRange} ({budgetEst.tierLabel})
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                <Clock className="w-3.5 h-3.5" />
                ~{maxTimeMins} phút
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dishes.map(({ roleLabel, badge, dish }) => (
              <Link
                key={dish.slug}
                href={`/cong-thuc/${dish.slug}`}
                className="group p-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#F3E9DD]/70 border border-[#EADBC8] transition-all flex items-center gap-3"
              >
                {dish.heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dish.heroImage}
                    alt={dish.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#EADBC8]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white border border-[#EADBC8] flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5 text-[#7C6A59]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>
                    {roleLabel}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#2D2A26] group-hover:text-[#3F6240] truncate mt-0.5">
                    {dish.name}
                  </p>
                  <p className="text-[11px] text-[#7C6A59]">
                    {dish.caloriesPerServing ? `${dish.caloriesPerServing} kcal/phần` : 'Chuẩn vị cơm nhà'} · {dish.totalTimeMinutes}p
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleSpin}
              disabled={spinning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#F3E9DD] text-[#5C4A3A] border border-[#EADBC8] text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
              <span>Đổi tổ hợp 3 món khác</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={shoppingUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F0] text-[#3F6240] border border-[#BCD0BE] text-xs font-bold transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Lên danh sách đi chợ</span>
              </Link>
              <Link
                href={mealUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B75B35] hover:bg-[#9e4c2b] text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <span>Chốt mâm này &amp; Xem định lượng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
