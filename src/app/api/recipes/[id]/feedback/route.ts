// AG-34: Cooked-it Feedback & Photos API
// Cho phép độc giả gửi đánh giá món ăn đã nấu thực tế, mẹo nêm nếm và ảnh thành phẩm
// Invariants Gate P5:
// - Kiểm soát ảnh và nội dung cộng đồng qua hàng đợi kiểm duyệt
// - Tránh spam: User đăng nhập chỉ có 1 feedback / công thức (upsert)
// - Chỉ công thức PUBLISHED mới nhận feedback

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes, recipeCookedFeedbacks } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { isUniqueViolation } from '@/lib/db/errors';
import { safeImageSrc } from '@/lib/recipes/publicQueries';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const recipeId = Number(id);

    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ.' }, { status: 400 });
    }

    // Lấy danh sách feedback đã được duyệt (APPROVED)
    const approvedFeedbacks = await db
      .select({
        id: recipeCookedFeedbacks.id,
        cookName: recipeCookedFeedbacks.cookName,
        rating: recipeCookedFeedbacks.rating,
        notes: recipeCookedFeedbacks.notes,
        photoUrl: recipeCookedFeedbacks.photoUrl,
        createdAt: recipeCookedFeedbacks.createdAt,
      })
      .from(recipeCookedFeedbacks)
      .where(
        and(
          eq(recipeCookedFeedbacks.recipeId, recipeId),
          eq(recipeCookedFeedbacks.status, 'APPROVED')
        )
      )
      .orderBy(desc(recipeCookedFeedbacks.createdAt))
      .limit(50);

    // Tính thống kê đánh giá
    const totalCookedCount = approvedFeedbacks.length;
    let averageRating = 5;
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalCookedCount > 0) {
      const sum = approvedFeedbacks.reduce((acc, curr) => {
        ratingDistribution[curr.rating] = (ratingDistribution[curr.rating] || 0) + 1;
        return acc + curr.rating;
      }, 0);
      averageRating = Math.round((sum / totalCookedCount) * 10) / 10;
    }

    return NextResponse.json({
      feedbacks: approvedFeedbacks,
      stats: {
        totalCookedCount,
        averageRating,
        ratingDistribution,
      },
    });
  } catch (error) {
    logger.error('Error fetching cooked feedbacks:', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách phản hồi lúc này.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const recipeId = Number(id);

    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ.' }, { status: 400 });
    }

    // Kiểm tra công thức có tồn tại và đang PUBLISHED không
    const [recipe] = await db
      .select({ id: recipes.id, status: recipes.status, name: recipes.name, authorId: recipes.authorId })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipe) {
      return NextResponse.json({ error: 'Không tìm thấy công thức yêu cầu.' }, { status: 404 });
    }

    if (recipe.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Chỉ có thể gửi phản hồi cho công thức đã được xuất bản chính thức.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { cookName, cookEmail, rating, notes, photoUrl } = body;

    // Validate rating
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: 'Vui lòng đánh giá từ 1 đến 5 sao.' },
        { status: 400 }
      );
    }

    // Kiểm tra session người dùng
    const user = await getSessionUser(request);

    // R7: chống tự đánh giá — tác giả không được chấm công thức của chính mình
    if (user && recipe.authorId !== null && recipe.authorId === user.id) {
      return NextResponse.json(
        { error: 'Không thể tự đánh giá công thức của mình.' },
        { status: 403 }
      );
    }
    const finalCookName = (cookName && String(cookName).trim()) || (user ? user.displayName : '');

    if (!finalCookName) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên người nấu.' },
        { status: 400 }
      );
    }

    const cleanNotes = notes ? String(notes).trim().slice(0, 1000) : null;
    const rawPhotoUrl = photoUrl ? String(photoUrl).trim().slice(0, 500) : '';
    const cleanPhotoUrl = rawPhotoUrl ? safeImageSrc(rawPhotoUrl) : null;
    if (rawPhotoUrl && !cleanPhotoUrl) {
      return NextResponse.json(
        { error: 'Link ảnh phải bắt đầu bằng https://' },
        { status: 400 }
      );
    }
    const cleanEmail = cookEmail ? String(cookEmail).trim().slice(0, 255) : (user ? user.email : null);

    // Invariant Gate P5: 
    // Mọi phản hồi có ảnh hoặc phản hồi từ khách vãng lai bắt buộc qua duyệt (PENDING).
    // Phản hồi thuần chữ không ảnh của user đăng nhập có thể APPROVED trực tiếp.
    const initialStatus = (cleanPhotoUrl || !user) ? 'PENDING' : 'APPROVED';

    let resultFeedback;

    if (user) {
      // Kiểm tra xem user này đã từng gửi feedback cho recipe này chưa
      const [existing] = await db
        .select({ id: recipeCookedFeedbacks.id })
        .from(recipeCookedFeedbacks)
        .where(
          and(
            eq(recipeCookedFeedbacks.recipeId, recipeId),
            eq(recipeCookedFeedbacks.userId, user.id)
          )
        )
        .limit(1);

      if (existing) {
        // Cập nhật phản hồi cũ
        const [updated] = await db
          .update(recipeCookedFeedbacks)
          .set({
            cookName: finalCookName,
            rating: numRating,
            notes: cleanNotes,
            photoUrl: cleanPhotoUrl,
            status: initialStatus,
            createdAt: new Date(),
          })
          .where(eq(recipeCookedFeedbacks.id, existing.id))
          .returning();
        resultFeedback = updated;
      } else {
        // Tạo mới. Nếu 2 request đồng thời cùng chèn, unique index (recipe_id, user_id)
        // chặn bản thứ hai → chuyển sang cập nhật thay vì lỗi 500.
        const values = {
          recipeId,
          userId: user.id,
          cookName: finalCookName,
          cookEmail: cleanEmail,
          rating: numRating,
          notes: cleanNotes,
          photoUrl: cleanPhotoUrl,
          status: initialStatus,
        } as const;
        try {
          const [inserted] = await db.insert(recipeCookedFeedbacks).values(values).returning();
          resultFeedback = inserted;
        } catch (insertError) {
          if (!isUniqueViolation(insertError)) throw insertError;
          const [updated] = await db
            .update(recipeCookedFeedbacks)
            .set({
              cookName: finalCookName,
              rating: numRating,
              notes: cleanNotes,
              photoUrl: cleanPhotoUrl,
              status: initialStatus,
              createdAt: new Date(),
            })
            .where(
              and(
                eq(recipeCookedFeedbacks.recipeId, recipeId),
                eq(recipeCookedFeedbacks.userId, user.id)
              )
            )
            .returning();
          resultFeedback = updated;
        }
      }
    } else {
      // Khách vãng lai
      const [inserted] = await db
        .insert(recipeCookedFeedbacks)
        .values({
          recipeId,
          userId: null,
          cookName: finalCookName,
          cookEmail: cleanEmail,
          rating: numRating,
          notes: cleanNotes,
          photoUrl: cleanPhotoUrl,
          status: 'PENDING',
        })
        .returning();
      resultFeedback = inserted;
    }

    return NextResponse.json({
      message: initialStatus === 'APPROVED' 
        ? 'Cảm ơn bạn đã chia sẻ trải nghiệm nấu món!' 
        : 'Cảm ơn bạn! Phản hồi kèm hình ảnh đã được gửi tới Ban biên tập để kiểm duyệt.',
      feedback: resultFeedback,
    });
  } catch (error) {
    logger.error('Error submitting cooked feedback:', error);
    return NextResponse.json(
      { error: 'Không thể gửi phản hồi lúc này.' },
      { status: 500 }
    );
  }
}
