import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getSessionUser } from '@/lib/auth/session';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { PUBLIC_RECIPES_TAG } from '@/lib/recipes/public';
import {
  CURATED_RECIPE_SOURCES,
  runDailyCuratedHarvest,
  getRecentHarvestedRecipes,
  repairExistingHarvestedRecipes,
  getDefaultHarvestPublishMode,
  setDefaultHarvestPublishMode,
  type HarvestPublishMode,
} from '@/lib/ai/dailyHarvester';
import { logger } from '@/lib/logger';

// GET /api/editor/daily-harvest — Lấy danh sách 10 nguồn uy tín, chế độ mặc định & lịch sử thu thập gần nhất
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: 'Chỉ Biên tập viên hoặc Quản trị viên mới được xem cấu hình Thu thập mỗi ngày.' },
        { status: 403 }
      );
    }

    const repaired = await repairExistingHarvestedRecipes();
    if (repaired > 0) {
      revalidateTag(PUBLIC_RECIPES_TAG, { expire: 0 });
    }

    const recentHarvested = await getRecentHarvestedRecipes(10);

    return NextResponse.json({
      success: true,
      defaultPublishMode: getDefaultHarvestPublishMode(),
      sources: CURATED_RECIPE_SOURCES.map((s) => ({
        id: s.id,
        name: s.name,
        domain: s.domain,
        url: s.url,
        category: s.category,
        regionFocus: s.regionFocus,
        strengths: s.strengths,
        dishesCount: s.curatedDishes.length,
      })),
      recentHarvested,
      scheduleInfo: {
        dailyRunTimeVn: '06:00 sáng (GMT+7)',
        defaultDailyCount: 3,
        qualityGateRules: [
          'Chốt 1: Tối thiểu 3 nguyên liệu thực tế có định lượng cụ thể (> 0), cấm tên giả định',
          'Chốt 2: Tối thiểu 2 bước thực hiện chi tiết (≥ 15 ký tự) chia theo Sơ chế / Chế biến / Hoàn thành',
          'Chốt 3: Tỷ lệ khớp Từ điển Thực phẩm Chuẩn Việt Nam (Viện Dinh Dưỡng & Bách Hóa Xanh) ≥ 75%',
          'Chốt 4: Tự động tính Calo FCT hợp lệ (Món chính ≥ 95 kcal/phần) & Dự toán chi phí (12.000đ – 600.000đ)',
          'Chốt 5: Bắt ảnh đa tầng (og:image / twitter:image / JSON-LD image) + Tự gắn ảnh minh họa chuẩn nhóm món',
        ],
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/editor/daily-harvest', { error });
    return NextResponse.json(
      { error: 'Không thể tải thông tin Bộ Thu Thập Món Ngon Mỗi Ngày.' },
      { status: 500 }
    );
  }
}

// POST /api/editor/daily-harvest — Kích hoạt thu thập & chuẩn hóa món ăn ngay lập tức (hoặc lưu chế độ duyệt mặc định)
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const isCronAuthorized =
      Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

    let authorId: number | undefined;

    if (!isCronAuthorized) {
      if (isCrossSiteRequest(request)) {
        return NextResponse.json({ error: 'Yêu cầu bị từ chối (CSRF).' }, { status: 403 });
      }
      const user = await getSessionUser();
      if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
        return NextResponse.json(
          { error: 'Chỉ Biên tập viên hoặc Quản trị viên mới được chạy Bộ Thu Thập Món Ngon.' },
          { status: 403 }
        );
      }
      authorId = user.id;
    }

    const body = await request.json().catch(() => ({}));
    const publishMode: HarvestPublishMode =
      body.publishMode === 'REVIEW_QUEUE'
        ? 'REVIEW_QUEUE'
        : body.publishMode === 'AUTO_PUBLISH_REAL_PHOTO_ONLY'
        ? 'AUTO_PUBLISH_REAL_PHOTO_ONLY'
        : 'AUTO_PUBLISH_IF_QUALIFIED';

    if (body.action === 'SET_DEFAULT_MODE') {
      setDefaultHarvestPublishMode(publishMode);
      return NextResponse.json({
        success: true,
        defaultPublishMode: getDefaultHarvestPublishMode(),
      });
    }

    const sourceIds = Array.isArray(body.sourceIds)
      ? body.sourceIds.map((id: unknown) => String(id || '').trim()).filter(Boolean)
      : undefined;
    const customUrls = Array.isArray(body.customUrls)
      ? body.customUrls.map((u: unknown) => String(u || '').trim()).filter(Boolean)
      : undefined;
    const maxItems = Math.min(6, Math.max(1, Number(body.maxItems) || 3));

    const result = await runDailyCuratedHarvest({
      sourceIds,
      customUrls,
      maxItems,
      publishMode,
      authorId,
    });

    // Nếu có ít nhất 1 món được tự động xuất bản (PUBLISHED), làm mới cache danh sách công khai ngay
    if (result.harvested.some((h) => h.status === 'PUBLISHED')) {
      revalidateTag(PUBLIC_RECIPES_TAG, { expire: 0 });
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Error in POST /api/editor/daily-harvest', { error });
    return NextResponse.json(
      { error: 'Không thể thực hiện thu thập món ăn lúc này. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
