// AG-29: AI Recipe Draft API Route
// Tiếp nhận yêu cầu soạn thảo bản nháp công thức từ Biên tập viên / Admin.
// Invariants Gate P4:
// - Bắt buộc session đăng nhập quyền EDITOR hoặc ADMIN.
// - Bản nháp luôn có provenance = 'AI_ASSISTED' và status = 'DRAFT'.
// - Tuyệt đối không cho phép tự động publish.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { generateRecipeDraft, saveAiDraftToDatabase } from '@/lib/ai/recipeDraftGenerator';
import { UnsafeOutboundUrlError } from '@/lib/security/safeUrl';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    if (isCrossSiteRequest(req)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    // 1. Phân quyền: Bắt buộc đăng nhập.
    // - Chế độ GENERATE (bóc tách văn bản/link để điền vào form, chưa ghi DB) mở cho cả COOK/Contributor.
    // - Chế độ SAVE_DRAFT và BATCH_SAVE_DRAFT (ghi thẳng vào DB với provenance AI_ASSISTED) chỉ dành cho EDITOR / ADMIN.
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để sử dụng tính năng Trợ lý Soạn thảo Công thức AI.' },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(req);
    const rate = await checkRateLimitShared('ai-recipe-draft', `${user.id}:${clientIp}`, 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Bạn đã gửi quá nhiều yêu cầu tạo bản thảo AI. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const dishTitle = typeof body.dishTitle === 'string' ? body.dishTitle.trim() : '';
    const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : '';
    const sourceText = typeof body.sourceText === 'string' ? body.sourceText.trim() : '';
    const batchItems = Array.isArray(body.batchItems)
      ? body.batchItems.map((i: unknown) => String(i || '').trim()).filter(Boolean).slice(0, 6)
      : [];

    const role = ['MAIN', 'SOUP', 'SIDE', 'ONE_DISH_MEAL'].includes(body.role) ? body.role : 'MAIN';
    const region = typeof body.region === 'string' ? body.region.trim() : 'Toàn quốc';
    const styleNotes = typeof body.styleNotes === 'string' ? body.styleNotes.trim() : '';
    const baseServings = Number(body.baseServings) > 0 ? Number(body.baseServings) : 4;
    const mode =
      body.mode === 'SAVE_DRAFT'
        ? 'SAVE_DRAFT'
        : body.mode === 'BATCH_SAVE_DRAFT'
        ? 'BATCH_SAVE_DRAFT'
        : 'GENERATE';

    if (
      (mode === 'SAVE_DRAFT' || mode === 'BATCH_SAVE_DRAFT') &&
      user.role !== 'EDITOR' &&
      user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Chỉ Biên tập viên hoặc Quản trị viên mới có quyền lưu trực tiếp bản thảo AI vào hệ thống.' },
        { status: 403 }
      );
    }

    // Hỗ trợ nạp hàng loạt (Batch Import từ danh sách tên món hoặc danh sách link bài viết nấu ăn)
    if (mode === 'BATCH_SAVE_DRAFT') {
      if (batchItems.length === 0) {
        return NextResponse.json(
          { error: 'Vui lòng nhập ít nhất 1 tên món ăn hoặc đường dẫn (URL) bài viết.' },
          { status: 400 }
        );
      }

      const createdRecipes: Array<{ recipeId: number; slug: string; name: string; role: string }> = [];
      const errors: string[] = [];

      for (const item of batchItems) {
        try {
          const isUrl = item.startsWith('http://') || item.startsWith('https://');
          const res = await generateRecipeDraft({
            dishTitle: isUrl ? undefined : item,
            sourceUrl: isUrl ? item : undefined,
            role,
            region,
            styleNotes,
            baseServings,
            clientId: `${clientIp}-batch`,
          });
          const saved = await saveAiDraftToDatabase(res.draft, user.id);
          createdRecipes.push({
            recipeId: saved.recipeId,
            slug: saved.slug,
            name: res.draft.name,
            role: res.draft.role,
          });
        } catch (e: unknown) {
          errors.push(`${item}: ${e instanceof Error ? e.message : 'Lỗi không xác định'}`);
        }
      }

      return NextResponse.json({
        success: true,
        createdRecipes,
        errors,
      });
    }

    if (!dishTitle && !sourceUrl && !sourceText) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp tên món ăn, đường dẫn (URL) trang web ẩm thực hoặc nội dung công thức.' },
        { status: 400 }
      );
    }

    // 2. Gọi Engine sinh bản thảo AI
    const result = await generateRecipeDraft({
      dishTitle,
      sourceUrl,
      sourceText,
      role,
      region,
      styleNotes,
      baseServings,
      clientId: clientIp,
    });

    // 3. Nếu mode là SAVE_DRAFT, lưu trực tiếp vào cơ sở dữ liệu
    if (mode === 'SAVE_DRAFT') {
      const saved = await saveAiDraftToDatabase(result.draft, user.id);
      logger.info('AI recipe draft saved to database', {
        recipeId: saved.recipeId,
        slug: saved.slug,
        authorId: user.id,
        provenance: 'AI_ASSISTED',
      });

      return NextResponse.json({
        success: true,
        recipeId: saved.recipeId,
        slug: saved.slug,
        draft: result.draft,
        provider: result.provider,
        isFallback: result.isFallback,
      });
    }

    // Mặc định trả về dữ liệu để pre-fill vào form UI
    return NextResponse.json({
      success: true,
      draft: result.draft,
      provider: result.provider,
      isFallback: result.isFallback,
    });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw err;
    }

    if (err instanceof UnsafeOutboundUrlError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 }
      );
    }

    const message = err instanceof Error ? err.message : 'Unknown AI authoring draft error';
    logger.error('Error in AI recipe draft endpoint', { error: message });

    return NextResponse.json(
      { error: 'Không thể tạo bản thảo lúc này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
