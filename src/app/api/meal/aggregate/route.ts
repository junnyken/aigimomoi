import { NextResponse } from 'next/server';
import { queryMealRecipesForAggregation } from '@/lib/meal/mealQueries';
import { aggregateMealIngredients } from '@/lib/recipes/aggregation';
import { clampServings } from '@/lib/recipes/scaling';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawSlugs = Array.isArray(body?.slugs) ? body.slugs : [];
    const slugs = rawSlugs.filter((s: unknown) => typeof s === 'string');
    const servings = clampServings(body?.servings, 4);

    if (slugs.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          targetServings: servings,
          dishesCount: 0,
          freshItems: [],
          seasoningItems: [],
          categories: { meatSeafood: [], produce: [], pantry: [], other: [] },
        },
      });
    }

    const recipesList = await queryMealRecipesForAggregation(slugs);
    const result = aggregateMealIngredients(recipesList, servings);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      (err as { digest: string }).digest === 'NEXT_PRERENDER_INTERRUPTED'
    ) {
      throw err;
    }
    console.error('Lỗi khi gộp nguyên liệu đi chợ:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
