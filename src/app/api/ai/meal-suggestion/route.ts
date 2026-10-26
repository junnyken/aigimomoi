// AG-28: AI Meal Suggestion API Endpoint
// Tiếp nhận yêu cầu gợi ý mâm cơm từ nguyên liệu tủ lạnh, áp rate limit và trả kết quả đã qua Grounding Validation.

import { NextRequest, NextResponse } from 'next/server';
import { suggestMealWithAi } from '@/lib/ai/mealSuggester';
import { logger } from '@/lib/logger';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';

// Giới hạn đầu vào để chặn prompt khổng lồ (đốt chi phí LLM) và giảm bề mặt prompt injection
const MAX_LIST_ITEMS = 30;
const MAX_ITEM_LENGTH = 60;

function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: unknown): item is string => typeof item === 'string')
    .map((item) => item.replace(/[\r\n\t]+/g, ' ').trim().slice(0, MAX_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);
}

export async function POST(req: NextRequest) {
  try {
    if (isCrossSiteRequest(req)) {
      return NextResponse.json({ error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' }, { status: 403 });
    }

    const clientIp = getClientIp(req);
    const rate = await checkRateLimitShared('ai-meal-suggestion', clientIp, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Bạn đã yêu cầu gợi ý quá nhiều lần. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await req.json().catch(() => ({}));

    const ingredients = sanitizeStringList(body.ingredients);
    const preferences = sanitizeStringList(body.preferences);

    const region =
      typeof body.region === 'string' && body.region.trim()
        ? body.region.trim().slice(0, MAX_ITEM_LENGTH)
        : 'Tất cả';

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
