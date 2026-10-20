// AG-28: AI Meal Suggestion API Endpoint
// Tiếp nhận yêu cầu gợi ý mâm cơm từ nguyên liệu tủ lạnh, áp rate limit và trả kết quả đã qua Grounding Validation.

import { NextRequest, NextResponse } from 'next/server';
import { suggestMealWithAi } from '@/lib/ai/mealSuggester';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'anonymous';

    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.filter((i: unknown) => typeof i === 'string')
      : [];

    const preferences = Array.isArray(body.preferences)
      ? body.preferences.filter((p: unknown) => typeof p === 'string')
      : [];

    const region = typeof body.region === 'string' ? body.region : 'Tất cả';

    const result = await suggestMealWithAi({
      userIngredients: ingredients,
      preferences,
      region,
      clientId: clientIp,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw err;
    }

    const message = err instanceof Error ? err.message : 'Unknown AI suggestion error';
    logger.error('Error in AI meal suggestion endpoint', { error: message });

    return NextResponse.json(
      {
        error: 'Không thể tạo gợi ý mâm cơm lúc này. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}
