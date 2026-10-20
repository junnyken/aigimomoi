// AG-32: Public Recipe Abuse Reporting API
// Mọi độc giả (kể cả khách vãng lai) đều có thể báo cáo công thức vi phạm
// Invariants Gate P5:
// - Không ép buộc đăng nhập, nhưng ghi nhận reporterId nếu có session.
// - Bắt buộc chọn lý do vi phạm hợp lệ.
// - Giới hạn độ dài chi tiết (chống spam).

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes, recipeReports, reportReasonEnum } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_REASONS = ['UNSAFE_FOOD', 'INCORRECT_RECIPE', 'COPYRIGHT', 'INAPPROPRIATE', 'OTHER'] as const;

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const recipeId = Number(id);

    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ.' }, { status: 400 });
    }

    // Kiểm tra công thức có tồn tại không
    const [existing] = await db
      .select({ id: recipes.id, name: recipes.name })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy công thức yêu cầu.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { reason, details, reporterEmail } = body;

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: 'Vui lòng chọn lý do báo cáo vi phạm hợp lệ.' },
        { status: 400 }
      );
    }

    if (details && typeof details === 'string' && details.length > 2000) {
      return NextResponse.json(
        { error: 'Nội dung chi tiết báo cáo không được vượt quá 2000 ký tự.' },
        { status: 400 }
      );
    }

    // Kiểm tra session người dùng nếu có
    const user = await getSessionUser();

    // Lưu báo cáo vi phạm vào database
    const [report] = await db
      .insert(recipeReports)
      .values({
        recipeId,
        reporterId: user ? user.id : null,
        reporterEmail: reporterEmail ? String(reporterEmail).trim().slice(0, 255) : (user ? user.email : null),
        reason,
        details: details ? String(details).trim() : null,
        status: 'PENDING',
      })
      .returning();

    logger.info('Recipe abuse report submitted', {
      reportId: report.id,
      recipeId,
      reason,
      reporterId: user?.id ?? 'GUEST',
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Cảm ơn bạn đã gửi phản ánh. Ban biên tập sẽ xem xét và xử lý trong thời gian sớm nhất!',
    });
  } catch (error) {
    logger.error('Error submitting recipe report', { error });
    return NextResponse.json(
      { error: 'Không thể gửi báo cáo lúc này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
