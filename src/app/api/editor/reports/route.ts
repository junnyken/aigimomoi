// AG-32: Editorial Moderation Reports Queue API
// Chỉ cho phép EDITOR hoặc ADMIN truy cập.
// Invariants Gate P5:
// - Chặn tuyệt đối COOK (HTTP 403).
// - Trả về đầy đủ thông tin báo cáo, công thức và người gửi.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipeReports, recipes, users } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { desc, eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    if (user.role !== 'EDITOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Ban biên tập và Quản trị viên mới có quyền xem hàng đợi báo cáo.' },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get('status');

    const reports = await db.query.recipeReports.findMany({
      where: (rep, { eq, and }) => {
        if (statusParam && statusParam !== 'ALL') {
          return eq(rep.status, statusParam as any);
        }
        return undefined;
      },
      orderBy: [desc(recipeReports.createdAt)],
      with: {
        recipe: {
          with: {
            dish: true,
            author: true,
          },
        },
        reporter: true,
        resolvedBy: true,
      },
    });

    return NextResponse.json({
      success: true,
      reports,
      total: reports.length,
    });
  } catch (error) {
    logger.error('Error fetching editorial moderation reports', { error });
    return NextResponse.json(
      { error: 'Không thể tải danh sách báo cáo vi phạm.' },
      { status: 500 }
    );
  }
}
