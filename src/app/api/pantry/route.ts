// AG-40: Pantry Management API (Kho thực phẩm / Tủ lạnh gia đình)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pantryItems } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { eq, and, desc, asc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để xem kho thực phẩm.' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const location = searchParams.get('location'); // 'FRIDGE' | 'FREEZER' | 'DRY_PANTRY' | null

    const conditions = [eq(pantryItems.userId, user.id)];
    if (location && ['FRIDGE', 'FREEZER', 'DRY_PANTRY'].includes(location)) {
      conditions.push(eq(pantryItems.location, location as any));
    }

    const items = await db.query.pantryItems.findMany({
      where: and(...conditions),
      orderBy: [asc(pantryItems.expiresAt), desc(pantryItems.createdAt)],
      with: {
        ingredient: {
          columns: {
            id: true,
            name: true,
            category: true,
            standardUnit: true,
          },
        },
      },
    });

    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const enrichedItems = items.map((item) => {
      let isExpired = false;
      let isExpiringSoon = false;
      if (item.expiresAt) {
        const exp = new Date(item.expiresAt);
        if (exp < now) {
          isExpired = true;
        } else if (exp <= threeDaysLater) {
          isExpiringSoon = true;
        }
      }
      return {
        ...item,
        isExpired,
        isExpiringSoon,
      };
    });

    // Thống kê nhanh
    const stats = {
      totalItems: enrichedItems.length,
      expiringSoonCount: enrichedItems.filter((i) => i.isExpiringSoon).length,
      expiredCount: enrichedItems.filter((i) => i.isExpired).length,
      fridgeCount: enrichedItems.filter((i) => i.location === 'FRIDGE').length,
      freezerCount: enrichedItems.filter((i) => i.location === 'FREEZER').length,
      dryCount: enrichedItems.filter((i) => i.location === 'DRY_PANTRY').length,
    };

    return NextResponse.json({ items: enrichedItems, stats });
  } catch (error) {
    logger.error('Error fetching pantry items', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy dữ liệu tủ lạnh.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json({ error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' }, { status: 403 });
    }

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để thêm thực phẩm.' }, { status: 401 });
    }

    const rate = await checkRateLimitShared('pantry-write', `${user.id}:${getClientIp(request)}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Thao tác quá nhanh. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { customName, ingredientId, quantity = 1, unit = 'gam', location = 'FRIDGE', expiresAt, notes } = body;

    if (!customName || typeof customName !== 'string' || !customName.trim()) {
      return NextResponse.json({ error: 'Tên thực phẩm không được để trống.' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Số lượng phải lớn hơn 0.' }, { status: 400 });
    }

    let parsedExpiresAt: Date | null = null;
    if (expiresAt) {
      const d = new Date(expiresAt);
      if (!isNaN(d.getTime())) {
        parsedExpiresAt = d;
      }
    }

    const [newItem] = await db.insert(pantryItems).values({
      userId: user.id,
      ingredientId: ingredientId ? Number(ingredientId) : null,
      customName: customName.trim(),
      quantity: Number(quantity),
      unit: unit.trim(),
      location: ['FRIDGE', 'FREEZER', 'DRY_PANTRY'].includes(location) ? location : 'FRIDGE',
      expiresAt: parsedExpiresAt,
      notes: notes ? String(notes).trim() : null,
    }).returning();

    logger.info('Added item to pantry', { userId: user.id, itemId: newItem.id, name: newItem.customName });
    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error) {
    logger.error('Error adding pantry item', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi thêm thực phẩm vào kho.' }, { status: 500 });
  }
}
