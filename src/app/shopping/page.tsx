import type { Metadata } from 'next';
import { Suspense } from 'react';
import { resolveMealSelection, queryMealRecipesForAggregation } from '@/lib/meal/mealQueries';
import { aggregateMealIngredients } from '@/lib/recipes/aggregation';
import { clampServings } from '@/lib/recipes/scaling';
import { getSessionUser } from '@/lib/auth/session';
import { ShoppingView } from '@/components/shopping/ShoppingView';

interface ShoppingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: 'Danh sách đi chợ thông minh — Ăn Gì Mom',
  description:
    'Danh sách đi chợ tự động gộp nguyên liệu từ cả mâm cơm 3 món, định lượng theo số người, phân chia theo quầy thịt cá, rau củ và gia vị bếp nhà.',
};

export default function ShoppingPage({ searchParams }: ShoppingPageProps) {
  return (
    <Suspense fallback={<ShoppingLoadingShell />}>
      <ShoppingPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ShoppingPageContent({ searchParams }: ShoppingPageProps) {
  const params = await searchParams;

  const mainSlug = typeof params.main === 'string' ? params.main.trim() : null;
  const soupSlug = typeof params.soup === 'string' ? params.soup.trim() : null;
  const sideSlug = typeof params.side === 'string' ? params.side.trim() : null;
  const sauceSlug = typeof params.sauce === 'string' ? params.sauce.trim() : null;
  const servings = clampServings(params.servings, 4);

  // Phân giải mâm cơm
  const mealSelection = await resolveMealSelection({
    mainSlug,
    soupSlug,
    sideSlug,
    sauceSlug,
  });

  const dishes = [
    mealSelection.main,
    mealSelection.soup,
    mealSelection.side,
    mealSelection.sauce && !mealSelection.sauce.isBuiltInPreset ? mealSelection.sauce : null,
  ]
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((d) => ({
      name: d.name,
      slug: d.slug,
      role: d.role,
    }));

  const slugs = dishes.map((d) => d.slug);
  const sessionUser = await getSessionUser();
  const recipesList = await queryMealRecipesForAggregation(slugs, sessionUser?.id ?? null);
  const result = aggregateMealIngredients(recipesList, servings);

  return <ShoppingView result={result} dishes={dishes} servings={servings} />;
}

function ShoppingLoadingShell() {
  return (
    <div className="w-full flex flex-col gap-6 pb-16 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-44 rounded-3xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-8 flex flex-col justify-center gap-3">
        <div className="h-4 w-48 bg-[var(--color-border-base)] rounded-md" />
        <div className="h-8 w-64 bg-[var(--color-border-base)] rounded-lg" />
        <div className="h-4 w-80 bg-[var(--color-border-base)] rounded-md" />
      </div>

      {/* Progress Bar Skeleton */}
      <div className="h-16 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)]" />

      {/* Grid Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="h-6 w-40 bg-[var(--color-surface-raised)] rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
