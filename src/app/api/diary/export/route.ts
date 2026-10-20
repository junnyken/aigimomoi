// AG-38: Family Meal Diary Export API
// Cho phép người dùng xuất toàn bộ lịch sử ăn uống gia đình dưới dạng file JSON tải về

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mealDiaryEntries } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để xuất dữ liệu.' }, { status: 401 });
    }

    const allEntries = await db.query.mealDiaryEntries.findMany({
      where: eq(mealDiaryEntries.userId, user.id),
      orderBy: [desc(mealDiaryEntries.diaryDate), desc(mealDiaryEntries.createdAt)],
    });

    const exportData = {
      platform: 'An Gi Mom - Bếp Nhà',
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
      },
      totalRecords: allEntries.length,
      entries: allEntries,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="angimom_diary_export_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    logger.error('Error exporting meal diary:', error);
    return NextResponse.json({ error: 'Không thể xuất dữ liệu lúc này.' }, { status: 500 });
  }
}
