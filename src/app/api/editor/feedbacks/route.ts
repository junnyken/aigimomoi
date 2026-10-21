// AG-34: Editorial Cooked Feedbacks Queue API
// Hàng đợi duyệt hình ảnh và feedback người nấu từ cộng đồng
// Invariants Gate P5:
// - Chỉ EDITOR hoặc ADMIN mới có quyền truy cập (chặn COOK 403)
// - Kiểm soát chất lượng ảnh trước khi hiển thị công khai trên catalog

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipeCookedFeedbacks, recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { desc, eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    if (user.role !== 'EDITOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Ban biên tập và Quản trị viên mới có quyền xem hàng đợi phản hồi.' },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get('status');
    const VALID_FEEDBACK_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
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
      !VALID_FEEDBACK_STATUSES.includes(statusParam as (typeof VALID_FEEDBACK_STATUSES)[number])
    ) {
      return NextResponse.json({ error: 'Trạng thái lọc phản hồi không hợp lệ.' }, { status: 400 });
    }

    const feedbacks = await db.query.recipeCookedFeedbacks.findMany({
      where: (fb, { eq }) => {
        if (statusParam && statusParam !== 'ALL') {
          return eq(fb.status, statusParam as (typeof VALID_FEEDBACK_STATUSES)[number]);
        }
        return undefined;
      },
      orderBy: [desc(recipeCookedFeedbacks.createdAt)],
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
        user: {
          columns: SAFE_USER_COLUMNS,
        },
        approvedBy: {
          columns: SAFE_USER_COLUMNS,
        },
      },
    });

    return NextResponse.json({
      success: true,
      feedbacks,
      total: feedbacks.length,
    });
  } catch (error) {
    logger.error('Error fetching editorial feedbacks', { error });
    return NextResponse.json(
      { error: 'Không thể tải danh sách phản hồi cộng đồng.' },
      { status: 500 }
    );
  }
}
