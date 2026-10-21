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
    const VALID_REPORT_STATUSES = ['PENDING', 'RESOLVED', 'DISMISSED'] as const;
    const SAFE_USER_COLUMNS = {
      id: true,
      displayName: true,
      email: true,
      role: true,
      avatarUrl: true,
    } as const;

    if (
      statusParam &&
      statusParam !== 'ALL' &&
      !VALID_REPORT_STATUSES.includes(statusParam as (typeof VALID_REPORT_STATUSES)[number])
    ) {
      return NextResponse.json({ error: 'Trạng thái lọc báo cáo không hợp lệ.' }, { status: 400 });
    }

    const reports = await db.query.recipeReports.findMany({
      where: (rep, { eq }) => {
        if (statusParam && statusParam !== 'ALL') {
          return eq(rep.status, statusParam as (typeof VALID_REPORT_STATUSES)[number]);
        }
        return undefined;
      },
      orderBy: [desc(recipeReports.createdAt)],
      limit: 200,
      with: {
        recipe: {
          with: {
            dish: true,
            author: {
              columns: SAFE_USER_COLUMNS,
            },
          },
        },
        reporter: {
          columns: SAFE_USER_COLUMNS,
        },
        resolvedBy: {
          columns: SAFE_USER_COLUMNS,
        },
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
