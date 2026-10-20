// AG-29: AI Recipe Draft API Route
// Tiếp nhận yêu cầu soạn thảo bản nháp công thức từ Biên tập viên / Admin.
// Invariants Gate P4:
// - Bắt buộc session đăng nhập quyền EDITOR hoặc ADMIN.
// - Bản nháp luôn có provenance = 'AI_ASSISTED' và status = 'DRAFT'.
// - Tuyệt đối không cho phép tự động publish.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { generateRecipeDraft, saveAiDraftToDatabase } from '@/lib/ai/recipeDraftGenerator';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // 1. Phân quyền: Chỉ EDITOR hoặc ADMIN mới được tạo bản thảo
    const user = await getSessionUser();
    if (!user || (user.role !== 'EDITOR' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Chỉ Biên tập viên hoặc Quản trị viên mới có quyền sử dụng tính năng Soạn thảo AI.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const dishTitle = typeof body.dishTitle === 'string' ? body.dishTitle.trim() : '';

    if (!dishTitle) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp tên món ăn cần tạo bản thảo.' },
        { status: 400 }
      );
    }

    const role = ['MAIN', 'SOUP', 'SIDE', 'ONE_DISH_MEAL'].includes(body.role) ? body.role : 'MAIN';
    const region = typeof body.region === 'string' ? body.region.trim() : 'Toàn quốc';
    const styleNotes = typeof body.styleNotes === 'string' ? body.styleNotes.trim() : '';
    const baseServings = Number(body.baseServings) > 0 ? Number(body.baseServings) : 4;
    const mode = body.mode === 'SAVE_DRAFT' ? 'SAVE_DRAFT' : 'GENERATE';

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      `user-${user.id}`;

    // 2. Gọi Engine sinh bản thảo AI
    const result = await generateRecipeDraft({
      dishTitle,
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

    const message = err instanceof Error ? err.message : 'Unknown AI authoring draft error';
    logger.error('Error in AI recipe draft endpoint', { error: message });

    return NextResponse.json(
      { error: 'Không thể tạo bản thảo lúc này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
