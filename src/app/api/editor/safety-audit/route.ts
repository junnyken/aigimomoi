// API Kiểm định An toàn Thực phẩm & Chất lượng bằng AI — CHỈ DÀNH RIÊNG CHO NGƯỜI KIỂM DUYỆT (ADMIN / EDITOR)
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { aiGateway } from '@/lib/ai/gateway';
import { auditRecipeSafetyAndQuality, type FoodSafetyAuditInput } from '@/lib/safety/foodSafetyAuditor';
import { logger } from '@/lib/logger';

export interface AiDeepSafetyVerdict {
  aiVerdict: 'SAFE' | 'CAUTION' | 'DANGER';
  summaryForReviewer: string;
  toxicologyAndHygieneAnalysis: string;
  culinaryAccuracyAnalysis: string;
  shouldApprove: boolean;
  suggestedFixOrRejectionNote: string;
}

export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    const user = await getSessionUser(request);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: 'Chức năng Kiểm định An toàn Thực phẩm bằng AI chỉ dành riêng cho Người kiểm duyệt (ADMIN / EDITOR).' },
        { status: 403 }
      );
    }

    const rate = await checkRateLimitShared(
      'editor-safety-audit',
      `${user.id}:${getClientIp(request)}`,
      20,
      60_000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Thao tác gọi AI kiểm định quá nhanh. Vui lòng thử lại sau ít giây.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as FoodSafetyAuditInput;
    const ruleReport = auditRecipeSafetyAndQuality(body);

    const ingSummary = (body.ingredients || [])
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.name || i.ingredient?.name || 'Nguyên liệu'}: ${i.amount ?? ''} ${i.unit ?? ''} (${i.preparation || 'sơ chế chuẩn'})`
      )
      .join('\n');

    const stepSummary = (body.steps || [])
      .map((s, idx) => `Bước ${idx + 1} [${s.phaseName || 'Chế biến'}]: ${s.instruction || ''}`)
      .join('\n');

    const systemInstruction = `Bạn là Chuyên gia Kiểm định An toàn Thực phẩm, Độc chất học Dinh dưỡng và Đầu bếp trưởng Bếp Việt.
Nhiệm vụ của bạn là hỗ trợ NGƯỜI KIỂM DUYỆT (Admin không chuyên về y khoa/ẩm thực) đánh giá xem công thức món ăn do người dùng đăng lên có AN TOÀN cho cơ thể và ĐÚNG KỸ THUẬT nấu ăn hay không.

Hãy kiểm tra nghiêm ngặt 4 yếu tố:
1. Độc tố tự nhiên & Vi sinh: Có nguyên liệu sống/tái nguy hiểm (tiết canh, thịt lợn/gà chưa chín, cá nước ngọt sống, cá nóc, mật cá, khoai tây mầm, măng tươi/sắn tươi chưa luộc mở vung khử cyanide, nấm lạ...) hay hóa chất cấm không?
2. Tương kỵ thực phẩm: Các nguyên liệu phối hợp có kỵ nhau gây ngộ độc, kết tủa đạm hay khó tiêu không?
3. Định lượng gia vị: Lượng muối, nước mắm, đường, dầu mỡ có hợp lý cho khẩu phần hay bị gõ nhầm gây hại sức khỏe không?
4. Độ chuẩn công thức: Người đọc nấu theo các bước này có thành công và ăn được không hay là công thức rác/bịa đặt?

BẮT BUỘC trả về đúng JSON hợp lệ theo cấu trúc:
{
  "aiVerdict": "SAFE" | "CAUTION" | "DANGER",
  "summaryForReviewer": "Kết luận ngắn gọn 1-2 câu cực kỳ dễ hiểu cho người duyệt bài",
  "toxicologyAndHygieneAnalysis": "Phân tích mức độ an toàn đối với cơ thể, độc tố, tương kỵ và nhiệt độ chín",
  "culinaryAccuracyAnalysis": "Đánh giá tỷ lệ định lượng gia vị và tính hợp lý của các giai đoạn nấu",
  "shouldApprove": true | false,
  "suggestedFixOrRejectionNote": "Gợi ý câu chỉnh sửa hoặc lý do từ chối nếu chưa đạt"
}`;

    const prompt = `Hãy kiểm định công thức sau cho Người kiểm duyệt:
- Tên món: ${body.name || 'Chưa đặt tên'}
- Mô tả: ${body.shortDescription || ''}
- Khẩu phần: ${body.baseServings || 4} người | Thời gian chuẩn bị: ${body.prepTimeMinutes || 15} phút | Thời gian nấu: ${body.cookTimeMinutes || 30} phút
- Nguyên liệu:
${ingSummary || '(Chưa có)'}
- Các bước thực hiện:
${stepSummary || '(Chưa có)'}
- Kết quả quét quy tắc cơ sở: ${ruleReport.verdict} (${ruleReport.headline})`;

    let aiDeepResult: AiDeepSafetyVerdict | null = null;
    try {
      const raw = await aiGateway.generateCompletion(prompt, systemInstruction, {
        jsonMode: true,
        temperature: 0.2,
        maxTokens: 1500,
        timeoutMs: 12000,
      });
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      aiDeepResult = {
        aiVerdict:
          ruleReport.verdict === 'DANGER'
            ? 'DANGER'
            : ['SAFE', 'CAUTION', 'DANGER'].includes(parsed.aiVerdict)
            ? parsed.aiVerdict
            : ruleReport.verdict,
        summaryForReviewer:
          parsed.summaryForReviewer || ruleReport.adminGuidance,
        toxicologyAndHygieneAnalysis:
          parsed.toxicologyAndHygieneAnalysis ||
          'Không phát hiện độc tố sinh học hay cặp thực phẩm đại kỵ gây hại cho cơ thể.',
        culinaryAccuracyAnalysis:
          parsed.culinaryAccuracyAnalysis ||
          'Định lượng gia vị và các giai đoạn chế biến phù hợp với khẩu phần gia đình.',
        shouldApprove:
          ruleReport.verdict === 'DANGER' ? false : Boolean(parsed.shouldApprove ?? (ruleReport.verdict === 'SAFE')),
        suggestedFixOrRejectionNote:
          parsed.suggestedFixOrRejectionNote || ruleReport.rejectionReasonTemplate || '',
      };
    } catch {
      // Fallback thông minh từ bộ luật độc chất học khi AI bận
      aiDeepResult = {
        aiVerdict: ruleReport.verdict,
        summaryForReviewer: ruleReport.adminGuidance,
        toxicologyAndHygieneAnalysis: ruleReport.checks
          .filter((c) =>
            ['TOXIN_AND_FORBIDDEN', 'FOOD_INCOMPATIBILITY', 'THERMAL_AND_PREP_SAFETY'].includes(c.category)
          )
          .map((c) => `${c.title}: ${c.detail}`)
          .join(' | '),
        culinaryAccuracyAnalysis: ruleReport.checks
          .filter((c) => ['DOSAGE_AND_SEASONING', 'RECIPE_QUALITY_AND_COHERENCE'].includes(c.category))
          .map((c) => `${c.title}: ${c.detail}`)
          .join(' | '),
        shouldApprove: ruleReport.verdict === 'SAFE',
        suggestedFixOrRejectionNote: ruleReport.rejectionReasonTemplate || '',
      };
    }

    return NextResponse.json({
      success: true,
      ruleReport,
      aiDeepResult,
    });
  } catch (error) {
    logger.error('Error in editor AI safety audit endpoint', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Không thể thực hiện kiểm định AI lúc này.' },
      { status: 500 }
    );
  }
}
