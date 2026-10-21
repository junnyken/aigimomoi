'use client';

import Link from 'next/link';
import { ShoppingCart, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import type { MealDishSummary } from '@/lib/meal/mealQueries';
import { formatDuration } from '@/lib/recipes/labels';
import { buildMealQuery } from '@/lib/meal/flowUrls';

interface MealSummaryBarProps {
  main: MealDishSummary | null;
  soup: MealDishSummary | null;
  side: MealDishSummary | null;
  servings: number;
}

export function MealSummaryBar({ main, soup, side, servings }: MealSummaryBarProps) {
  const dishes = [main, soup, side].filter((d): d is MealDishSummary => Boolean(d));

  // Thời gian ước tính: người nấu thường làm song song các món (luộc rau trong lúc kho thịt)
  // Thời gian tối thiểu là món lâu nhất, tối đa là tổng thời gian
  const maxTime = dishes.length > 0 ? Math.max(...dishes.map((d) => d.totalTimeMinutes)) : 0;
  const totalTime = dishes.reduce((acc, d) => acc + d.totalTimeMinutes, 0);

  const shoppingUrl = `/shopping?${buildMealQuery({
    mainSlug: main?.slug,
    soupSlug: soup?.slug,
    sideSlug: side?.slug,
    servings,
  })}`;

  return (
    <section className="bg-gradient-to-br from-[var(--color-surface-white)] to-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
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
        </div>
      </div>

      <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href={shoppingUrl}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-[var(--color-brand-primary)] text-white font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Xem danh sách đi chợ cả mâm</span>
        </Link>
      </div>
    </section>
  );
}
