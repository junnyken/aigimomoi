import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db, sharedShoppingSessions } from '@/lib/db';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { logger } from '@/lib/logger';
import {
  ensureSharedShoppingTable,
  isValidShoppingToken,
  sanitizeCheckedKeys,
  sanitizeCustomItems,
} from '@/lib/shopping/sharedSessionsServer';

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!isValidShoppingToken(token)) {
      return NextResponse.json({ error: 'Mã giỏ đi chợ không hợp lệ.' }, { status: 400 });
    }

    await ensureSharedShoppingTable();

    const [session] = await db
      .select({
        token: sharedShoppingSessions.token,
        mealQuery: sharedShoppingSessions.mealQuery,
        servings: sharedShoppingSessions.servings,
        checkedKeys: sharedShoppingSessions.checkedKeys,
        customItems: sharedShoppingSessions.customItems,
        expiresAt: sharedShoppingSessions.expiresAt,
        updatedAt: sharedShoppingSessions.updatedAt,
      })
      .from(sharedShoppingSessions)
      .where(
        and(
          eq(sharedShoppingSessions.token, token),
          gt(sharedShoppingSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: 'Phiên giỏ đi chợ đã hết hạn 24h hoặc không tồn tại.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...session,
      expiresAt: session.expiresAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('Error loading live shared shopping session:', error);
    return NextResponse.json(
      { error: 'Không thể tải trạng thái giỏ đi chợ đồng bộ.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    const { token } = await context.params;
    if (!isValidShoppingToken(token)) {
      return NextResponse.json({ error: 'Mã giỏ đi chợ không hợp lệ.' }, { status: 400 });
    }

    const rate = await checkRateLimitShared(
      'shopping-session-patch',
      `${token}:${getClientIp(request)}`,
      60,
      60_000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Cập nhật quá nhanh. Vui lòng chờ vài giây.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const hasCheckedKeys = body.checkedKeys !== undefined;
    const hasCustomItems = body.customItems !== undefined;

    if (!hasCheckedKeys && !hasCustomItems) {
      return NextResponse.json({ error: 'Thiếu dữ liệu cần đồng bộ.' }, { status: 400 });
    }

    await ensureSharedShoppingTable();
    const now = new Date();

    const updateSet: {
      checkedKeys?: string[];
      customItems?: ReturnType<typeof sanitizeCustomItems>;
      updatedAt: Date;
    } = { updatedAt: now };

    if (hasCheckedKeys) {
      updateSet.checkedKeys = sanitizeCheckedKeys(body.checkedKeys);
    }
    if (hasCustomItems) {
      updateSet.customItems = sanitizeCustomItems(body.customItems);
    }

    const [updated] = await db
      .update(sharedShoppingSessions)
      .set(updateSet)
      .where(
        and(
          eq(sharedShoppingSessions.token, token),
          gt(sharedShoppingSessions.expiresAt, now)
        )
      )
      .returning({
        token: sharedShoppingSessions.token,
        mealQuery: sharedShoppingSessions.mealQuery,
        servings: sharedShoppingSessions.servings,
        checkedKeys: sharedShoppingSessions.checkedKeys,
        customItems: sharedShoppingSessions.customItems,
        expiresAt: sharedShoppingSessions.expiresAt,
        updatedAt: sharedShoppingSessions.updatedAt,
      });

    if (!updated) {
      return NextResponse.json(
        { error: 'Phiên giỏ đi chợ đã hết hạn 24h hoặc không tồn tại.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...updated,
      expiresAt: updated.expiresAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('Error updating live shared shopping session:', error);
    return NextResponse.json(
      { error: 'Không thể đồng bộ trạng thái giỏ đi chợ lúc này.' },
      { status: 500 }
    );
  }
}
