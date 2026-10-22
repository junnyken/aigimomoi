import type { Metadata } from 'next';
import { Suspense } from 'react';

import { resolveMealSelection } from '@/lib/meal/mealQueries';
import { clampServings } from '@/lib/recipes/scaling';
import { MealView } from '@/components/meal/MealView';

interface MealPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: 'Mâm cơm gia đình 3 món — Ăn Gì Mom',
  description:
    'Lên thực đơn bữa cơm gia đình chuẩn vị 1 Món Mặn + 1 Món Canh + 1 Món Rau. Đổi món linh hoạt, co giãn khẩu phần và tự động chuẩn bị nguyên liệu đi chợ.',
};

export default function MealPage({ searchParams }: MealPageProps) {
  return (
    <Suspense fallback={<MealLoadingShell />}>
      <MealPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function MealPageContent({ searchParams }: MealPageProps) {
  const params = await searchParams;

  const mainSlug = typeof params.main === 'string' ? params.main.trim() : null;
  const soupSlug = typeof params.soup === 'string' ? params.soup.trim() : null;
  const sideSlug = typeof params.side === 'string' ? params.side.trim() : null;
  const sauceSlug = typeof params.sauce === 'string' ? params.sauce.trim() : null;
  const initialProfile = typeof params.profile === 'string' ? params.profile.trim() : null;
  const servings = clampServings(params.servings, 4);
  const rawAiIngredients = typeof params.aiIngredients === 'string' ? params.aiIngredients : '';
  const initialAiIngredients = rawAiIngredients
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 15);

  const initialSelection = await resolveMealSelection({
    mainSlug,
    soupSlug,
    sideSlug,
    sauceSlug,
  });

  return (
    <MealView
      key={`${initialSelection.main?.slug ?? ''}|${initialSelection.soup?.slug ?? ''}|${initialSelection.side?.slug ?? ''}|${initialSelection.sauce?.slug ?? ''}|${servings}|${initialProfile ?? ''}|${initialAiIngredients.join(',')}`}
      initialSelection={initialSelection}
      initialServings={servings}
      initialProfile={initialProfile}
      hasExplicitSelection={Boolean(mainSlug || soupSlug || sideSlug || sauceSlug || initialProfile || initialAiIngredients.length > 0)}
      initialAiIngredients={initialAiIngredients}
    />
  );
}

function MealLoadingShell() {
  return (
    <div className="w-full flex flex-col gap-8 pb-12 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="h-44 rounded-3xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-5 sm:p-8 flex flex-col justify-center gap-3">
        <div className="h-4 w-36 max-w-full bg-[var(--color-border-base)] rounded-md" />
        <div className="h-8 w-3/4 max-w-xs bg-[var(--color-border-base)] rounded-lg" />
        <div className="h-4 w-full max-w-md bg-[var(--color-border-base)] rounded-md" />
      </div>

      {/* 3 Slots Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-96 rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] overflow-hidden flex flex-col"
          >
            <div className="h-48 bg-[var(--color-surface-raised)]" />
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="h-6 w-3/4 bg-[var(--color-surface-raised)] rounded-md" />
              <div className="h-4 w-full bg-[var(--color-surface-raised)] rounded-md" />
              <div className="mt-auto h-10 bg-[var(--color-surface-raised)] rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Skeleton */}
      <div className="h-32 rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)]" />
    </div>
  );
}
