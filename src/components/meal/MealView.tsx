'use client';

import { useState, useCallback, useEffect } from 'react';
import { Shuffle, Sparkles, ChefHat } from 'lucide-react';
import type { MealDishSummary, MealSelection } from '@/lib/meal/mealQueries';
import { MealServingsSelector } from './MealServingsSelector';
import { MealSlotCard } from './MealSlotCard';
import { SwapDishModal } from './SwapDishModal';
import { MealSummaryBar } from './MealSummaryBar';
import { saveStoredMeal, getStoredMeal } from '@/lib/meal/mealClient';
import { AiMealSuggestionModal } from './AiMealSuggestionModal';
import { useRouter } from 'next/navigation';
import { buildMealQuery } from '@/lib/meal/flowUrls';

interface MealViewProps {
  initialSelection: MealSelection;
  initialServings: number;
  /** URL có main/soup/side (link chia sẻ hoặc điều hướng nội bộ) → không khôi phục từ localStorage. */
  hasExplicitSelection?: boolean;
}

export function MealView({ initialSelection, initialServings, hasExplicitSelection = false }: MealViewProps) {
  const router = useRouter();
  const [main, setMain] = useState<MealDishSummary | null>(initialSelection.main);
  const [soup, setSoup] = useState<MealDishSummary | null>(initialSelection.soup);
  const [side, setSide] = useState<MealDishSummary | null>(initialSelection.side);
  const [servings, setServings] = useState<number>(initialServings);

  const [activeModalRole, setActiveModalRole] = useState<'MAIN' | 'SOUP' | 'SIDE' | null>(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Đồng bộ URL và localStorage khi state thay đổi
  const syncState = useCallback(
    (
      currentMain: MealDishSummary | null,
      currentSoup: MealDishSummary | null,
      currentSide: MealDishSummary | null,
      currentServings: number
    ) => {
      if (typeof window === 'undefined') return;

      const mainSlug = currentMain?.slug || '';
      const soupSlug = currentSoup?.slug || '';
      const sideSlug = currentSide?.slug || '';

      // 1. Lưu vào localStorage
      saveStoredMeal({
        mainSlug,
        soupSlug,
        sideSlug,
        servings: currentServings,
      });

      // 2. Đồng bộ lên URL query params
      const params = new URLSearchParams(window.location.search);
      if (mainSlug) params.set('main', mainSlug);
      if (soupSlug) params.set('soup', soupSlug);
      if (sideSlug) params.set('side', sideSlug);
      params.set('servings', String(currentServings));

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    },
    []
  );

  // R3: Khôi phục mâm đã chọn (trước đây effect này không làm gì).
  // - URL có main/soup/side → luôn ưu tiên URL (link chia sẻ không bị ghi đè) và ghi nhớ mâm này.
  // - URL trống mà localStorage có mâm hợp lệ khác mâm hiện tại → điều hướng sang URL của mâm đã lưu.
  //   (Chạy 1 lần khi mount; dùng giá trị ban đầu nên cố ý không phụ thuộc state.)
  const initialMainSlug = initialSelection.main?.slug ?? '';
  const initialSoupSlug = initialSelection.soup?.slug ?? '';
  const initialSideSlug = initialSelection.side?.slug ?? '';
  useEffect(() => {
    if (hasExplicitSelection) {
      if (initialMainSlug || initialSoupSlug || initialSideSlug) {
        saveStoredMeal({
          mainSlug: initialMainSlug,
          soupSlug: initialSoupSlug,
          sideSlug: initialSideSlug,
          servings: initialServings,
        });
      }
      return;
    }
    const stored = getStoredMeal();
    if (!stored || !(stored.mainSlug || stored.soupSlug || stored.sideSlug)) return;
    const sameMeal =
      stored.mainSlug === initialMainSlug &&
      stored.soupSlug === initialSoupSlug &&
      stored.sideSlug === initialSideSlug &&
      stored.servings === initialServings;
    if (sameMeal) return;
    router.replace(
      `/meal?${buildMealQuery({
        mainSlug: stored.mainSlug,
        soupSlug: stored.soupSlug,
        sideSlug: stored.sideSlug,
        servings: stored.servings,
      })}`
    );
  }, [hasExplicitSelection, initialMainSlug, initialSoupSlug, initialSideSlug, initialServings, router]);

  // Xử lý đổi món ở 1 slot
  const handleSelectDish = useCallback(
    (newDish: MealDishSummary) => {
      let nextMain = main;
      let nextSoup = soup;
      let nextSide = side;

      if (newDish.role === 'MAIN') {
        setMain(newDish);
        nextMain = newDish;
      } else if (newDish.role === 'SOUP') {
        setSoup(newDish);
        nextSoup = newDish;
      } else if (newDish.role === 'SIDE') {
        setSide(newDish);
        nextSide = newDish;
      }

      syncState(nextMain, nextSoup, nextSide, servings);
      setActiveModalRole(null);
    },
    [main, soup, side, servings, syncState]
  );

  // Xử lý đổi khẩu phần ăn cả mâm
  const handleServingsChange = useCallback(
    (newServings: number) => {
      setServings(newServings);
      syncState(main, soup, side, newServings);
    },
    [main, soup, side, syncState]
  );

  // Xử lý gợi ý ngẫu nhiên mâm cơm khác
  const handleRandomize = useCallback(async () => {
    setIsRandomizing(true);
    try {
      const res = await fetch('/api/meal/random');
      if (res.ok) {
        const data = await res.json();
        if (data.mainSlug && data.soupSlug && data.sideSlug) {
          // Điều hướng hoặc fetch thông tin 3 món mới
          const [mRes, sRes, dRes] = await Promise.all([
            fetch(`/api/meal/options?role=MAIN`).then((r) => r.json()),
            fetch(`/api/meal/options?role=SOUP`).then((r) => r.json()),
            fetch(`/api/meal/options?role=SIDE`).then((r) => r.json()),
          ]);

          const foundMain = mRes?.options?.find((d: MealDishSummary) => d.slug === data.mainSlug) || null;
          const foundSoup = sRes?.options?.find((d: MealDishSummary) => d.slug === data.soupSlug) || null;
          const foundSide = dRes?.options?.find((d: MealDishSummary) => d.slug === data.sideSlug) || null;

          if (foundMain) setMain(foundMain);
          if (foundSoup) setSoup(foundSoup);
          if (foundSide) setSide(foundSide);

          syncState(foundMain || main, foundSoup || soup, foundSide || side, servings);
        }
      }
    } catch (err) {
      console.error('Lỗi khi gợi ý mâm cơm ngẫu nhiên:', err);
    } finally {
      setIsRandomizing(false);
    }
  }, [main, soup, side, servings, syncState]);

  // Xử lý áp dụng mâm cơm AI gợi ý
  const handleApplyAiMeal = useCallback(
    async (mainSlug: string, soupSlug: string, sideSlug: string) => {
      try {
        const [mRes, sRes, dRes] = await Promise.all([
          fetch(`/api/meal/options?role=MAIN`).then((r) => r.json()),
          fetch(`/api/meal/options?role=SOUP`).then((r) => r.json()),
          fetch(`/api/meal/options?role=SIDE`).then((r) => r.json()),
        ]);

        const foundMain = mRes?.options?.find((d: MealDishSummary) => d.slug === mainSlug) || null;
        const foundSoup = sRes?.options?.find((d: MealDishSummary) => d.slug === soupSlug) || null;
        const foundSide = dRes?.options?.find((d: MealDishSummary) => d.slug === sideSlug) || null;

        if (foundMain) setMain(foundMain);
        if (foundSoup) setSoup(foundSoup);
        if (foundSide) setSide(foundSide);

        syncState(foundMain || main, foundSoup || soup, foundSide || side, servings);
      } catch (err) {
        console.error('Lỗi khi áp dụng mâm cơm AI:', err);
      }
    },
    [main, soup, side, servings, syncState]
  );

  return (
    <div className="w-full flex flex-col gap-8 pb-12">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[var(--color-brand-primary)]/10 via-[var(--color-accent-primary)]/10 to-[var(--color-surface-raised)] p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-primary)] uppercase tracking-wider">
            <ChefHat className="w-4 h-4" />
            <span>Thực đơn chuẩn vị cơm nhà</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            Mâm cơm gia đình
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Chuẩn cấu trúc <strong>1 Món Mặn + 1 Món Canh + 1 Món Rau</strong>. Bạn có thể đổi từng món tùy sở thích hoặc bấm gợi ý để bớt nghĩ hôm nay ăn gì!
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Khẩu phần ăn cả mâm
            </span>
            <MealServingsSelector servings={servings} onChange={handleServingsChange} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Tùy chọn
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                title="Gợi ý mâm cơm từ nguyên liệu tủ lạnh với AI"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Gợi ý AI</span>
              </button>
              <button
                type="button"
                onClick={handleRandomize}
                disabled={isRandomizing}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] text-sm font-semibold text-[var(--color-text-primary)] transition-all shadow-xs disabled:opacity-50"
                title="Gợi ý một mâm cơm ngẫu nhiên khác"
              >
                <Shuffle className={`w-4 h-4 text-[var(--color-brand-primary)] ${isRandomizing ? 'animate-spin' : ''}`} />
                <span>Mâm khác</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Slots Grid */}
      <section aria-label="3 vị trí món ăn trong mâm cơm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slot 1: MAIN */}
          <MealSlotCard
            role="MAIN"
            dish={main}
            servings={servings}
            onSwapClick={() => setActiveModalRole('MAIN')}
          />

          {/* Slot 2: SOUP */}
          <MealSlotCard
            role="SOUP"
            dish={soup}
            servings={servings}
            onSwapClick={() => setActiveModalRole('SOUP')}
          />

          {/* Slot 3: SIDE */}
          <MealSlotCard
            role="SIDE"
            dish={side}
            servings={servings}
            onSwapClick={() => setActiveModalRole('SIDE')}
          />
        </div>
      </section>

      {/* Summary Bar & CTA */}
      <MealSummaryBar main={main} soup={soup} side={side} servings={servings} />

      {/* Swap Dish Modal */}
      {activeModalRole && (
        <SwapDishModal
          isOpen={Boolean(activeModalRole)}
          role={activeModalRole}
          currentSlug={
            activeModalRole === 'MAIN'
              ? main?.slug || ''
              : activeModalRole === 'SOUP'
              ? soup?.slug || ''
              : side?.slug || ''
          }
          onClose={() => setActiveModalRole(null)}
          onSelect={handleSelectDish}
        />
      )}

      {/* AI Meal Suggestion Modal */}
      <AiMealSuggestionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyMeal={handleApplyAiMeal}
      />
    </div>
  );
}
