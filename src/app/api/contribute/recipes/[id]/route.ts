// AG-31: Individual Contributor Recipe Detail, Update & Delete API
// Bảo vệ quyền sở hữu: Người dùng chỉ được sửa/xóa bài của chính mình.
// Invariants Gate P5: Cấm sửa đổi khi bài đang SUBMITTED hoặc PUBLISHED.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes, recipeIngredients, cookingSteps, recipeTags } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { auditRecipeSafetyAndQuality } from '@/lib/safety/foodSafetyAuditor';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/contribute/recipes/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    const { id } = await context.params;
    const recipeId = Number(id);

    const recipe = await db.query.recipes.findFirst({
      where: (r, { eq, and }) => and(eq(r.id, recipeId), eq(r.authorId, user.id)),
      with: {
        dish: true,
        ingredients: {
          with: {
            ingredient: true,
          },
          orderBy: (ri, { asc }) => [asc(ri.sortOrder)],
        },
        steps: {
          orderBy: (cs, { asc }) => [asc(cs.stepNumber)],
        },
        tags: {
          with: {
            taxonomy: true,
          },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Không tìm thấy công thức hoặc bạn không có quyền truy cập.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, recipe });
  } catch (error) {
    logger.error('Error fetching contributor recipe detail', { error });
    return NextResponse.json({ error: 'Không thể tải chi tiết công thức.' }, { status: 500 });
  }
}

// PUT /api/contribute/recipes/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    const rate = await checkRateLimitShared(
      'contribute-recipe-write',
      `${user.id}:${getClientIp(request)}`,
      20,
      60_000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Thao tác quá nhanh. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const { id } = await context.params;
    const recipeId = Number(id);

    const [existing] = await db
      .select({
        id: recipes.id,
        authorId: recipes.authorId,
        status: recipes.status,
        name: recipes.name,
        shortDescription: recipes.shortDescription,
        baseServings: recipes.baseServings,
        prepTimeMinutes: recipes.prepTimeMinutes,
        cookTimeMinutes: recipes.cookTimeMinutes,
      })
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.authorId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy công thức hoặc bạn không phải tác giả.' },
        { status: 404 }
      );
    }

    // Invariants Gate P5: Chỉ được sửa khi đang DRAFT hoặc NEEDS_CHANGES
    if (existing.status !== 'DRAFT' && existing.status !== 'NEEDS_CHANGES') {
      return NextResponse.json(
        {
          error:
            existing.status === 'SUBMITTED'
              ? 'Công thức đang trong hàng đợi phê duyệt, không thể chỉnh sửa lúc này.'
              : 'Công thức đã được xuất bản hoặc lưu trữ, không thể chỉnh sửa trực tiếp.',
        },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      name,
      shortDescription,
      role,
      baseServings,
      prepTimeMinutes,
      cookTimeMinutes,
      difficulty,
      heroImage,
      region,
      kitchenStory,
      sourceAttribution,
      variantOfId,
      ingredients: rawIngredients = [],
      steps: rawSteps = [],
      taxonomyIds = [],
      submitNow = false,
    } = body;

    // CHỐT CHẶN AN TOÀN THỰC PHẨM & ĐỘC TỐ KHI CẬP NHẬT / GỬI DUYỆT LẠI (F-04):
    let auditIngredients = Array.isArray(rawIngredients) ? rawIngredients : [];
    let auditSteps = Array.isArray(rawSteps) ? rawSteps : [];

    if (auditIngredients.length === 0 || auditSteps.length === 0) {
      const currentFull = await db.query.recipes.findFirst({
        where: (r, { eq }) => eq(r.id, recipeId),
        with: {
          ingredients: { with: { ingredient: true } },
          steps: true,
        },
      });
      if (auditIngredients.length === 0 && currentFull?.ingredients) {
        auditIngredients = currentFull.ingredients.map((ri) => ({
          name: ri.ingredient?.name || '',
          amount: ri.amount,
          unit: ri.unit,
          preparation: ri.preparation,
        }));
      }
      if (auditSteps.length === 0 && currentFull?.steps) {
        auditSteps = currentFull.steps.map((st) => ({
          phaseName: st.phaseName,
          instruction: st.instruction,
          tipText: st.tipText,
        }));
      }
    }

    const safetyAudit = auditRecipeSafetyAndQuality({
      name: name ? String(name).trim() : existing.name,
      shortDescription: shortDescription ? String(shortDescription).trim() : existing.shortDescription,
      baseServings: Number(baseServings) || existing.baseServings || 4,
      prepTimeMinutes: Number(prepTimeMinutes) || existing.prepTimeMinutes || 15,
      cookTimeMinutes: Number(cookTimeMinutes) || existing.cookTimeMinutes || 30,
      ingredients: auditIngredients,
      steps: auditSteps,
    });

    if (safetyAudit.verdict === 'DANGER') {
      const dangerDetails = safetyAudit.checks
        .filter((c) => c.level === 'DANGER')
        .map((c) => `${c.title}: ${c.detail}`)
        .join(' ');
      return NextResponse.json(
        {
          error: `Từ chối cập nhật do phát hiện nguy cơ mất an toàn thực phẩm nghiêm trọng: ${dangerDetails}`,
          safetyAudit,
        },
        { status: 422 }
      );
    }

    const nextStatus = submitNow ? 'SUBMITTED' : existing.status;

    await db.transaction(async (tx) => {
      // 1. Cập nhật thông tin recipe
      await tx
        .update(recipes)
        .set({
          name: name ? String(name).trim() : undefined,
          shortDescription: shortDescription ? String(shortDescription).trim() : undefined,
          role: role || undefined,
          status: nextStatus,
          baseServings: Number(baseServings) || undefined,
          prepTimeMinutes: Number(prepTimeMinutes) || undefined,
          cookTimeMinutes: Number(cookTimeMinutes) || undefined,
          difficulty: difficulty || undefined,
          heroImage: heroImage !== undefined ? heroImage : undefined,
          region: region !== undefined ? region : undefined,
          kitchenStory: kitchenStory !== undefined ? (kitchenStory ? String(kitchenStory).trim() : null) : undefined,
          sourceAttribution: sourceAttribution !== undefined ? (sourceAttribution ? String(sourceAttribution).trim() : null) : undefined,
          variantOfId: variantOfId !== undefined ? (variantOfId ? Number(variantOfId) : null) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(recipes.id, recipeId));

      // 2. Cập nhật ingredients nếu được cung cấp
      if (Array.isArray(rawIngredients) && rawIngredients.length > 0) {
        await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
        await tx.insert(recipeIngredients).values(
          rawIngredients.map((item: any, idx: number) => ({
            recipeId,
            ingredientId: Number(item.ingredientId),
            amount: Number(item.amount) || 1,
            unit: String(item.unit || 'g').trim(),
            scalePolicy: item.scalePolicy || 'LINEAR',
            preparation: item.preparation ? String(item.preparation).trim() : null,
            isOptional: Boolean(item.isOptional),
            sortOrder: idx + 1,
          }))
        );
      }

      // 3. Cập nhật steps nếu được cung cấp
      if (Array.isArray(rawSteps) && rawSteps.length > 0) {
        await tx.delete(cookingSteps).where(eq(cookingSteps.recipeId, recipeId));
        await tx.insert(cookingSteps).values(
          rawSteps.map((item: any, idx: number) => ({
            recipeId,
            stepNumber: idx + 1,
            phaseName: item.phaseName || (idx === 0 ? 'Sơ chế' : idx === rawSteps.length - 1 ? 'Hoàn thành' : 'Chế biến'),
            instruction: String(item.instruction || '').trim(),
            timerSeconds: item.timerSeconds ? Number(item.timerSeconds) : (item.timerMinutes ? Number(item.timerMinutes) * 60 : null),
            tipText: item.tipText ? String(item.tipText).trim() : null,
            image: item.image || null,
          }))
        );
      }

      // 4. Cập nhật taxonomies nếu được cung cấp
      if (Array.isArray(taxonomyIds)) {
        await tx.delete(recipeTags).where(eq(recipeTags.recipeId, recipeId));
        if (taxonomyIds.length > 0) {
          await tx.insert(recipeTags).values(
            taxonomyIds.map((tid: number) => ({
              recipeId,
              taxonomyId: Number(tid),
            }))
          );
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: submitNow
        ? 'Công thức đã được gửi lại vào hàng chờ duyệt thành công!'
        : 'Cập nhật bản thảo thành công.',
    });
  } catch (error) {
    logger.error('Error updating contributor recipe', { error });
    return NextResponse.json({ error: 'Không thể cập nhật bài đóng góp.' }, { status: 500 });
  }
}

// DELETE /api/contribute/recipes/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    const rate = await checkRateLimitShared(
      'contribute-recipe-delete',
      `${user.id}:${getClientIp(request)}`,
      20,
      60_000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Thao tác quá nhanh. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const { id } = await context.params;
    const recipeId = Number(id);

    const [existing] = await db
      .select({
        id: recipes.id,
        authorId: recipes.authorId,
        status: recipes.status,
      })
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.authorId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy công thức hoặc bạn không phải tác giả.' },
        { status: 404 }
      );
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Chỉ có thể xóa các bài đóng góp ở trạng thái Bản nháp (DRAFT).' },
        { status: 409 }
      );
    }

    await db.delete(recipes).where(eq(recipes.id, recipeId));

    return NextResponse.json({
      success: true,
      message: 'Đã xóa bản nháp công thức thành công.',
    });
  } catch (error) {
    logger.error('Error deleting contributor recipe', { error });
    return NextResponse.json({ error: 'Không thể xóa bản nháp.' }, { status: 500 });
  }
}
