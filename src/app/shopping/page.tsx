import type { Metadata } from 'next';
import { Suspense } from 'react';
import { and, eq, gt } from 'drizzle-orm';
import { db, ingredients, pantryItems, sharedShoppingSessions } from '@/lib/db';
import { ensureSharedShoppingTable, isValidShoppingToken } from '@/lib/shopping/sharedSessionsServer';
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

  let mainSlug = typeof params.main === 'string' ? params.main.trim() : null;
  let soupSlug = typeof params.soup === 'string' ? params.soup.trim() : null;
  let sideSlug = typeof params.side === 'string' ? params.side.trim() : null;
  let sauceSlug = typeof params.sauce === 'string' ? params.sauce.trim() : null;
  let servings = clampServings(params.servings, 4);
  const rawSessionToken = typeof params.session === 'string' ? params.session.trim() : null;
  const sessionToken =
    rawSessionToken && isValidShoppingToken(rawSessionToken) ? rawSessionToken : null;

  // Nếu mở link chia sẻ ?session=... trực tiếp, lấy lại mealQuery từ PostgreSQL nếu thiếu tham số món
  if (sessionToken && !mainSlug && !soupSlug && !sideSlug) {
    try {
      await ensureSharedShoppingTable();
      const [liveSession] = await db
        .select({
          mealQuery: sharedShoppingSessions.mealQuery,
          servings: sharedShoppingSessions.servings,
        })
        .from(sharedShoppingSessions)
        .where(
          and(
            eq(sharedShoppingSessions.token, sessionToken),
            gt(sharedShoppingSessions.expiresAt, new Date())
          )
        )
        .limit(1);

      if (liveSession?.mealQuery) {
        const recovered = new URLSearchParams(liveSession.mealQuery);
        mainSlug = recovered.get('main') || mainSlug;
        soupSlug = recovered.get('soup') || soupSlug;
        sideSlug = recovered.get('side') || sideSlug;
        sauceSlug = recovered.get('sauce') || sauceSlug;
        servings = clampServings(liveSession.servings, servings);
      }
    } catch {
      // Fallback sang mặc định nếu chưa kết nối được DB
    }
  }

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
    mealSelection.sauce ?? null,
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

  // Nạp nguyên liệu đang còn hạn trong Tủ lạnh cá nhân để gợi ý trừ tự động khỏi giỏ đi chợ
  let availablePantryNames: string[] = [];
  if (sessionUser) {
    try {
      const now = new Date();
      const userPantryRows = await db
        .select({
          customName: pantryItems.customName,
          expiresAt: pantryItems.expiresAt,
          ingredientName: ingredients.name,
        })
        .from(pantryItems)
        .leftJoin(ingredients, eq(pantryItems.ingredientId, ingredients.id))
        .where(eq(pantryItems.userId, sessionUser.id));

      availablePantryNames = Array.from(
        new Set(
          userPantryRows
            .filter((row) => !row.expiresAt || row.expiresAt.getTime() > now.getTime())
            .map((row) => (row.ingredientName || row.customName || '').trim())
            .filter(Boolean)
        )
      );
    } catch {
      availablePantryNames = [];
    }
  }

  return (
    <ShoppingView
      result={result}
      dishes={dishes}
      servings={servings}
      availablePantryNames={availablePantryNames}
      initialSessionToken={sessionToken}
    />
  );
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
