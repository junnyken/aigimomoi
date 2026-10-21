'use client';

import Link from 'next/link';
import { Clock, RefreshCw, ChefHat, UtensilsCrossed, ArrowRight } from 'lucide-react';
import type { MealDishSummary } from '@/lib/meal/mealQueries';
import { formatDuration, recipePath, isIllustrationImage } from '@/lib/recipes/labels';

interface MealSlotCardProps {
  role: 'MAIN' | 'SOUP' | 'SIDE';
  dish: MealDishSummary | null;
  servings: number;
  onSwapClick: () => void;
}

const ROLE_CONFIGS = {
  MAIN: {
    label: 'MÓN MẶN CHÍNH',
    badgeClass: 'bg-[var(--color-brand-primary)] text-white',
    subText: 'Đậm đà, giàu đạm',
    swapBtnLabel: 'Đổi món mặn',
  },
  SOUP: {
    label: 'MÓN CANH THANH MÁT',
    badgeClass: 'bg-teal-600 text-white',
    subText: 'Thanh nhiệt, đưa cơm',
    swapBtnLabel: 'Đổi món canh',
  },
  SIDE: {
    label: 'MÓN RAU / XÀO',
    badgeClass: 'bg-emerald-600 text-white',
    subText: 'Bổ sung chất xơ',
    swapBtnLabel: 'Đổi món rau',
  },
};

export function MealSlotCard({ role, dish, servings, onSwapClick }: MealSlotCardProps) {
  const config = ROLE_CONFIGS[role];

  if (!dish) {
    return (
      <article className="bg-[var(--color-surface-white)] border-2 border-dashed border-[var(--color-border-base)] rounded-3xl p-6 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-muted)] mb-3">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">{config.label}</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4">{config.subText}</p>
        <button
          type="button"
          onClick={onSwapClick}
          className="px-4 py-2 bg-[var(--color-brand-primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Chọn món cho vị trí này
        </button>
      </article>
    );
  }

  return (
    <article className="group bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
      {/* Slot Header Banner */}
      <div className="px-5 py-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-surface-raised)]/50">
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider ${config.badgeClass}`}>
          {config.label}
        </span>
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">{config.subText}</span>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-48 bg-[var(--color-surface-raised)] overflow-hidden">
        {dish.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.heroImage}
            alt={dish.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
            <UtensilsCrossed className="w-12 h-12" aria-hidden="true" />
          </div>
        )}

        {dish.heroImage && (dish.isIllustration ?? isIllustrationImage(dish.heroImage)) && (
          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white/95 backdrop-blur-xs shadow-xs z-10">
            Ảnh minh họa
          </span>
        )}

        {dish.isCookTested && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface-white)]/90 backdrop-blur-xs text-[var(--color-success-base)] shadow-xs">
            <ChefHat className="w-3.5 h-3.5" aria-hidden="true" />
            Đã nấu thử
          </span>
        )}
      </div>

      {/* Body Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1 line-clamp-1 group-hover:text-[var(--color-brand-primary)] transition-colors">
          <Link href={`${recipePath(dish.slug)}?servings=${servings}`}>
            {dish.name}
          </Link>
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-4 flex-1">
          {dish.shortDescription}
        </p>

        {/* Stats */}
        <div className="py-2.5 border-y border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-4">
          <span className="inline-flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(dish.totalTimeMinutes)}
          </span>
          <span className="font-medium">Độ khó: {dish.difficulty}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwapClick}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{config.swapBtnLabel}</span>
          </button>

          <Link
            href={`${recipePath(dish.slug)}?servings=${servings}`}
            className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-[var(--color-brand-light)] hover:bg-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Xem nấu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
