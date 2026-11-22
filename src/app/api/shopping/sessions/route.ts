import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db, sharedShoppingSessions } from '@/lib/db';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { clampServings } from '@/lib/recipes/scaling';
import { logger } from '@/lib/logger';
import {
  ensureSharedShoppingTable,
  purgeExpiredShoppingSessions,
  sanitizeCheckedKeys,
  sanitizeCustomItems,
} from '@/lib/shopping/sharedSessionsServer';

export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    const rate = await checkRateLimitShared(
      'shopping-session-create',
      getClientIp(request),
      15,
      60_000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Tạo quá nhiều link đi chợ cùng lúc. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawMealQuery = typeof body.mealQuery === 'string' ? body.mealQuery.trim() : '';
    if (rawMealQuery.length > 500) {
      return NextResponse.json({ error: 'Tham số mâm cơm quá dài.' }, { status: 400 });
    }

    const servings = clampServings(body.servings, 4);
    const checkedKeys = sanitizeCheckedKeys(body.checkedKeys);
    const customItems = sanitizeCustomItems(body.customItems);

    await ensureSharedShoppingTable();
    await purgeExpiredShoppingSessions();

    const token = crypto.randomBytes(16).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db.insert(sharedShoppingSessions).values({
      token,
      mealQuery: rawMealQuery,
      servings,
      checkedKeys,
      customItems,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        token,
        mealQuery: rawMealQuery,
        servings,
        checkedKeys,
        customItems,
        expiresAt: expiresAt.toISOString(),
        updatedAt: now.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating live shared shopping session:', error);
    return NextResponse.json(
      { error: 'Không thể khởi tạo giỏ đi chợ đồng bộ lúc này.' },
      { status: 500 }
    );
  }
}
