// AG-29: AI Recipe Draft Generator Engine
// Tuân thủ nghiêm ngặt Invariants Gate P4 & Master Plan (§5.1, §5.5, §8.2):
// - Output schema valid 100%.
// - Bản nháp luôn có provenance = 'AI_ASSISTED'.
// - Cấm tự động xuất bản (status luôn là 'DRAFT', isCookTested = false, isEditorialReviewed = false).

import { db } from '../db';
import { ingredients, recipes, recipeIngredients, cookingSteps, dishes, taxonomies, recipeTags } from '../db/schema';
import { eq, ilike, inArray } from 'drizzle-orm';
import { aiGateway } from './gateway';
import { buildSmartVietnameseRecipeFromTitle } from './mockProvider';
import { calculateRecipeNutrition } from '../nutrition/calculator';
import { safeFetchText, UnsafeOutboundUrlError } from '../security/safeUrl';

export interface AiRecipeDraftParams {
  dishTitle?: string;
  sourceUrl?: string;
  sourceText?: string;
  role?: 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL';
  region?: string;
  styleNotes?: string;
  baseServings?: number;
  clientId?: string;
}

export interface AiRecipeIngredientDraft {
  ingredientId: number;
  name: string;
  amount: number;
  unit: string;
  scalePolicy: 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST';
  preparation: string;
  isOptional: boolean;
}

export interface AiRecipeStepDraft {
  stepNumber: number;
  phaseName: string;
  instruction: string;
  timerSeconds: number;
  tipText: string;
}

export interface AiRecipeDraftPayload {
  name: string;
  dishName: string;
  shortDescription: string;
  role: 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL';
  status: 'DRAFT';
  provenance: 'AI_ASSISTED';
  difficulty: string;
  baseServings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  isCookTested: false;
  isEditorialReviewed: false;
  isNutritionVerified: false;
  heroImage?: string;
  hasExtractedRealPhoto?: boolean;
  sourceUrl?: string;
  ingredients: AiRecipeIngredientDraft[];
  steps: AiRecipeStepDraft[];
}

export interface AiRecipeDraftResult {
  draft: AiRecipeDraftPayload;
  provider: string;
  isFallback: boolean;
}

/**
 * Tự động chọn ảnh minh họa món ăn chất lượng cao tương ứng theo nhóm món (Kho, Canh, Xào, Cá, Gà, Salad...)
 * khi nguồn không cung cấp URL ảnh trực tiếp hoặc trang gốc chặn nhúng ảnh.
 */
export function resolveSmartDishIllustration(
  dishName: string,
  role: 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL' = 'MAIN'
): string {
  const lower = (dishName || '').toLowerCase();

  if (lower.includes('cá hồi')) {
    return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('canh chua')) {
    return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80';
  }
  if (role === 'SOUP' || lower.startsWith('canh') || lower.startsWith('súp')) {
    return 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80';
  }
  if (
    lower.includes('cá ') ||
    lower.includes('tôm') ||
    lower.includes('mực') ||
    lower.includes('nghêu') ||
    lower.includes('hải sản')
  ) {
    return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('gà') || lower.includes('ức gà') || lower.includes('cánh gà')) {
    return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80';
  }
  if (
    role === 'SIDE' ||
    lower.includes('rau') ||
    lower.includes('xào') ||
    lower.includes('luộc') ||
    lower.includes('salad') ||
    lower.includes('gỏi') ||
    lower.includes('dưa leo') ||
    lower.includes('đậu bắp') ||
    lower.includes('bông thiên lý')
  ) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('đậu hũ') || lower.includes('đậu phụ') || lower.includes('trứng') || lower.includes('nấm')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
  }
  // Mặc định cho các món Thịt kho / Sườn rim / Bò lúc lắc / Cơm nhà đậm đà
  return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Tìm kiếm hoặc tạo mới nguyên liệu trong từ điển chuẩn hóa để đảm bảo có ingredientId hợp lệ.
 */
async function resolveOrRegisterIngredient(name: string, unit: string): Promise<number> {
  const trimmed = name.trim();
  const slug = slugify(trimmed);

  // 1. Kiểm tra xem đã có trong DB chưa
  const existing = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(eq(ingredients.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Thử tìm theo tên không phân biệt hoa thường
  const byName = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(ilike(ingredients.name, trimmed))
    .limit(1);

  if (byName.length > 0) {
    return byName[0].id;
  }

  // 2. Tự động tạo nguyên liệu mới nếu chưa có
  const isPantryStaple = ['nước mắm', 'muối', 'đường', 'tiêu', 'dầu ăn', 'hạt nêm', 'nước tương', 'tỏi', 'hành'].some(
    (s) => trimmed.toLowerCase().includes(s)
  );

  const [inserted] = await db
    .insert(ingredients)
    .values({
      slug: slug || `ing-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: trimmed,
      category: isPantryStaple ? 'Gia vị & đồ khô' : 'Thực phẩm tươi sống',
      standardUnit: unit || 'g',
      isPantryStaple,
    })
    .returning({ id: ingredients.id });

  return inserted.id;
}

/**
 * Tải và trích xuất nội dung kiến thức nấu ăn từ một trang web bất kỳ (URL)
 * Đã tích hợp lớp bảo vệ SSRF (chặn IP nội bộ/loopback/metadata, kiểm tra redirect, giới hạn dung lượng).
 */
export async function fetchExternalRecipeContent(url: string): Promise<{
  title: string;
  content: string;
  image?: string;
}> {
  let fetched: { ok: boolean; status: number; text: string; finalUrl: string };
  try {
    fetched = await safeFetchText(url, {
      timeoutMs: 10_000,
      maxBytes: 1_500_000,
      maxRedirects: 3,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
  } catch (err) {
    if (err instanceof UnsafeOutboundUrlError) {
      throw err;
    }
    throw new Error('Không thể kết nối tới đường dẫn (URL) trang web được cung cấp.');
  }

  if (!fetched.ok) {
    throw new Error(`Không thể đọc trang web (HTTP ${fetched.status})`);
  }

  const parsedUrl = new URL(fetched.finalUrl);
  const html = fetched.text;

  // 1. Trích xuất tiêu đề trang / og:title
  const ogTitleMatch =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = (ogTitleMatch?.[1] || titleTagMatch?.[1] || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Trích xuất ảnh đại diện đa tầng (og:image -> twitter:image -> JSON-LD image -> article img)
  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i) ||
    html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i);
  let extractedImage = ogImageMatch?.[1]?.trim();

  // 3. Ưu tiên tìm JSON-LD Schema.org Recipe nếu trang web có nhúng (kiêm bóc tách ảnh chuẩn trong JSON-LD)
  let jsonLdSummary = '';
  const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const jsonText = match[1].trim();
      if (jsonText.includes('Recipe') || jsonText.includes('recipeIngredient')) {
        jsonLdSummary += `\n[Dữ liệu cấu trúc Recipe từ trang]:\n${jsonText.slice(0, 3500)}\n`;
        if (!extractedImage) {
          const imgFieldMatch =
            jsonText.match(/"image"\s*:\s*"([^"]+)"/i) ||
            jsonText.match(/"image"\s*:\s*\[\s*"([^"]+)"/i) ||
            jsonText.match(/"image"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"/i);
          if (imgFieldMatch?.[1]) {
            extractedImage = imgFieldMatch[1].trim();
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Tầng 4: Nếu vẫn chưa có ảnh, quét thẻ <img> lớn đầu tiên trong nội dung bài viết
  if (!extractedImage) {
    const imgTagMatches = html.matchAll(/<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*>/gi);
    for (const m of imgTagMatches) {
      const candidate = (m[1] || '').trim();
      const lowerImg = candidate.toLowerCase();
      if (
        candidate &&
        !lowerImg.startsWith('data:') &&
        !lowerImg.includes('logo') &&
        !lowerImg.includes('icon') &&
        !lowerImg.includes('avatar') &&
        !lowerImg.includes('banner') &&
        (lowerImg.endsWith('.jpg') ||
          lowerImg.endsWith('.jpeg') ||
          lowerImg.endsWith('.png') ||
          lowerImg.endsWith('.webp') ||
          lowerImg.includes('upload') ||
          lowerImg.includes('images'))
      ) {
        extractedImage = candidate;
        break;
      }
    }
  }

  // Chuẩn hóa đường dẫn ảnh tương đối sang URL tuyệt đối
  let normalizedImage: string | undefined;
  if (extractedImage) {
    try {
      const resolved = new URL(extractedImage.replace(/&amp;/g, '&'), parsedUrl.toString()).toString();
      if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
        normalizedImage = resolved;
      }
    } catch {
      normalizedImage = undefined;
    }
  }

  // 4. Làm sạch HTML body để lấy văn bản thuần túy
  const cleanedText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5500);

  return {
    title: rawTitle,
    content: `${jsonLdSummary}\n[Nội dung bài viết]:\n${cleanedText}`.trim(),
    image: normalizedImage,
  };
}

/**
 * Khởi tạo bản thảo công thức do AI hỗ trợ cho Biên tập viên (từ tên món, URL trang kiến thức nấu ăn, hoặc văn bản thô)
 */
export async function generateRecipeDraft(params: AiRecipeDraftParams): Promise<AiRecipeDraftResult> {
  let title = (params.dishTitle || '').trim();
  const sourceUrl = (params.sourceUrl || '').trim();
  let sourceText = (params.sourceText || '').trim();
  let extractedImage: string | undefined;

  if (sourceUrl) {
    const webData = await fetchExternalRecipeContent(sourceUrl);
    if (!title && webData.title) {
      title = webData.title.split('|')[0].split('-')[0].trim();
    }
    sourceText = `${sourceText}\n${webData.content}`.trim();
    extractedImage = webData.image;
  }

  if (!title && !sourceText) {
    throw new Error('Vui lòng cung cấp tên món ăn, đường dẫn (URL) bài viết, hoặc nội dung công thức.');
  }

  if (!title && sourceText) {
    title = sourceText.split('\n')[0].slice(0, 80).trim() || 'Món ngon gia đình';
  }

  const role = params.role || 'MAIN';
  const region = params.region || 'Toàn quốc';
  const styleNotes = params.styleNotes || 'Chuẩn vị cơm nhà, cân bằng hương vị';
  const baseServings = params.baseServings && params.baseServings > 0 ? params.baseServings : 4;

  const systemInstruction = `Bạn là Giảng viên Đầu bếp Trưởng của Bếp Việt Ăn Gì Mom (chuẩn sư phạm Hướng Nghiệp Á Âu & Món Ngon Mỗi Ngày).
Nhiệm vụ: Phân tích món ăn được yêu cầu và biên soạn công thức hoàn chỉnh, cầm tay chỉ việc cực kỳ chi tiết để người mới vào bếp lần đầu cũng nấu thành công 100%.
QUY TẮC BẮT BUỘC:
1. Trả về định dạng JSON thuần túy theo schema:
{
  "name": "Tên công thức đầy đủ (ví dụ: Cánh gà chiên nước mắm tỏi ớt giòn rụm)",
  "dishName": "Tên món khái quát (ví dụ: Cánh gà chiên nước mắm)",
  "shortDescription": "Đoạn văn 2-3 câu mô tả đặc trưng hương vị, màu sắc và cảm giác khi thưởng thức.",
  "role": "MAIN | SOUP | SIDE | ONE_DISH_MEAL",
  "difficulty": "Dễ | Trung bình | Khó",
  "baseServings": 4,
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 25,
  "ingredients": [
    {
      "name": "Tên nguyên liệu (tiếng Việt rõ ràng)",
      "amount": 500,
      "unit": "g | ml | muỗng canh | muỗng cà phê | củ | trái | nhánh",
      "scalePolicy": "LINEAR | FIXED | MANUAL_ADJUST",
      "preparation": "Cách sơ chế (ví dụ: Rửa sạch với muối gừng, chặt miếng 4cm, để ráo)",
      "isOptional": false
    }
  ],
  "steps": [
    {
      "phaseName": "Tên giai đoạn kỹ thuật (ví dụ: Sơ chế & Khử mùi | Ướp thấm vị & Pha sốt | Chiên vàng giòn | Áo sốt & Rim thấm vị | Hoàn thành & Trình bày)",
      "instruction": "Hướng dẫn chi tiết 3-4 câu đầy đủ: nêu rõ số lượng nguyên liệu (VD: 3 muỗng canh nước mắm + 2 muỗng canh đường), mức lửa (lửa lớn/lửa vừa/lửa nhỏ), thời gian (bao nhiêu phút) và dấu hiệu nhận biết bằng mắt/mũi.",
      "timerSeconds": 300,
      "tipText": "Mẹo kỹ thuật thực tế của đầu bếp giúp món ăn ngon vượt trội"
    }
  ]
}
2. QUY TẮC CHIA GIAI ĐOẠN & CÁC BƯỚC NẤU (CỰC KỲ QUAN TRỌNG):
- KHÔNG ĐƯỢC gộp sơ sài thành 3 bước ngắn! Phải chia thành 4 đến 5 GIAI ĐOẠN KỸ THUẬT rõ ràng tùy đặc thù món (ví dụ: Giai đoạn 1: Sơ chế & Khử mùi -> Giai đoạn 2: Ướp thấm vị & Pha sốt định lượng -> Giai đoạn 3: Chiên vàng / Áp chảo / Xào săn -> Giai đoạn 4: Kho / Rim / Áo sốt keo sánh -> Giai đoạn 5: Hoàn thành & Trình bày), tổng cộng từ 5 đến 7 bước thực hiện (mỗi giai đoạn có 1-2 bước).
- CẤM TUYỆT ĐỐI viết chung chung kiểu "pha theo tỉ lệ vừa ăn" hay "cho một ít gia vị". Trong mỗi bước (instruction), BẮT BUỘC phải ghi lại chính xác con số định lượng khớp với bảng ingredients (ví dụ: "Khuấy đều 3 muỗng canh nước mắm, 2 muỗng canh đường cát và 2 muỗng canh nước lọc ấm cho tan hoàn toàn").
- Mỗi bước phải nêu rõ: (a) Thao tác + Định lượng cụ thể, (b) Độ lửa (lửa lớn / lửa vừa / lửa nhỏ liu riu), (c) Thời gian canh giờ (phút/giây), (d) Dấu hiệu nhận biết đạt chuẩn (màu sắc, độ sánh, mùi thơm).
3. Chính sách scalePolicy:
- 'LINEAR': Nguyên liệu chính (thịt, cá, tôm, rau, đậu hũ) co giãn theo số người ăn.
- 'FIXED': Dầu ăn phi, lá thơm, hành ngò rắc trên mặt.
- 'MANUAL_ADJUST': Mắm, muối, đường, tiêu, ớt.
4. Không trả về markdown code blocks, chỉ JSON hợp lệ.`;

  const prompt = sourceText
    ? `YÊU CẦU TRÍCH XUẤT & CHUẨN HÓA CÔNG THỨC CHI TIẾT TỪ NGUỒN KIẾN THỨC NẤU ĂN:
- Tên gợi ý / Tiêu đề gốc: ${title}
- Nguồn tham khảo: ${sourceUrl || 'Văn bản cung cấp trực tiếp'}
- Vai trò dự kiến: ${role}
- Vùng miền ẩm thực: ${region}
- Khẩu phần ăn chuẩn cần quy đổi về: ${baseServings} người
- Ghi chú phong cách: ${styleNotes}

NỘI DUNG NGUỒN CẦN BÓC TÁCH:
"""
${sourceText.slice(0, 6000)}
"""

Hãy bóc tách nguyên liệu (nếu nguồn tiếng Anh hãy dịch sang tiếng Việt tự nhiên, quy đổi oz/lb/cup/tbsp/tsp sang g, ml, muỗng canh, muỗng cà phê), và biên soạn 5 đến 6 bước thực hiện chia theo 4–5 giai đoạn kỹ thuật (Sơ chế & Khử mùi, Ướp & Pha sốt, Chế biến nhiệt, Áo sốt / Ninh chín, Hoàn thành & Trình bày). Nhớ ghi rõ định lượng từng muỗng gia vị, mức lửa và thời gian ngay trong câu hướng dẫn của từng bước.`
    : `YÊU CẦU BIÊN SOẠN CÔNG THỨC CHI TIẾT CHUẨN ĐẦU BẾP:
- Tên món ăn: ${title}
- Vai trò dự kiến: ${role}
- Vùng miền ẩm thực: ${region}
- Khẩu phần ăn chuẩn: ${baseServings} người
- Ghi chú phong cách: ${styleNotes}

Hãy phân tích kỹ thuật chế biến của món "${title}" và biên soạn bản thảo công thức gồm 5 đến 6 bước chi tiết chia làm 4–5 giai đoạn kỹ thuật (Sơ chế & Khử mùi, Ướp thấm vị & Pha sốt định lượng, Chiên / Xào săn / Thắng màu, Kho / Rim / Áo sốt, Hoàn thành & Trình bày). Mỗi bước phải ghi rõ số gam/muỗng gia vị khớp với bảng nguyên liệu, độ lửa, thời gian và dấu hiệu mắt thấy tai nghe.`;

  const aiResult = await aiGateway.complete(
    {
      prompt,
      systemInstruction,
      temperature: 0.3,
      jsonMode: true,
      maxTokens: 3500,
    },
    params.clientId || 'editor-agent'
  );

  let parsed: any = {};
  try {
    const cleanedJson = aiResult.text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    parsed = JSON.parse(cleanedJson);
  } catch {
    parsed = {};
  }

  // ==========================================================
  // SCHEMA SANITIZATION & INVARIANTS ENFORCEMENT (Gate P4)
  // ==========================================================

  const smartFallback = buildSmartVietnameseRecipeFromTitle(title, sourceText);

  const validatedName = (parsed.name && typeof parsed.name === 'string' ? parsed.name : title).trim();
  const validatedDishName = (parsed.dishName && typeof parsed.dishName === 'string' ? parsed.dishName : title).trim();
  const validatedDescription = (
    parsed.shortDescription && typeof parsed.shortDescription === 'string'
      ? parsed.shortDescription
      : smartFallback.shortDescription
  ).trim();

  let validatedRole: 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL' = role || smartFallback.role;
  if (['MAIN', 'SOUP', 'SIDE', 'ONE_DISH_MEAL'].includes(parsed.role)) {
    validatedRole = parsed.role;
  }

  const validatedDifficulty = ['Dễ', 'Trung bình', 'Khó'].includes(parsed.difficulty) ? parsed.difficulty : 'Dễ';
  const validatedPrep = Number(parsed.prepTimeMinutes) > 0 ? Number(parsed.prepTimeMinutes) : smartFallback.prepTimeMinutes;
  const validatedCook = Number(parsed.cookTimeMinutes) > 0 ? Number(parsed.cookTimeMinutes) : smartFallback.cookTimeMinutes;

  // Xử lý nguyên liệu
  const rawIngs =
    Array.isArray(parsed.ingredients) && parsed.ingredients.length >= 3
      ? parsed.ingredients
      : smartFallback.ingredients;
  const processedIngredients: AiRecipeIngredientDraft[] = [];

  for (const raw of rawIngs) {
    const ingName = String(raw.name || '').trim();
    if (!ingName || ingName.toLowerCase().includes('nguyên liệu chính')) continue;

    const amount = Number(raw.amount) > 0 ? Number(raw.amount) : 1;
    const unit = String(raw.unit || 'g').trim();
    const scalePolicy: 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST' = ['LINEAR', 'FIXED', 'MANUAL_ADJUST'].includes(
      raw.scalePolicy
    )
      ? raw.scalePolicy
      : 'LINEAR';
    const preparation = String(raw.preparation || '').trim();
    const isOptional = Boolean(raw.isOptional);

    const ingredientId = await resolveOrRegisterIngredient(ingName, unit);

    processedIngredients.push({
      ingredientId,
      name: ingName,
      amount,
      unit,
      scalePolicy,
      preparation,
      isOptional,
    });
  }

  // Đảm bảo luôn có ít nhất 3 nguyên liệu chuẩn bếp Việt nếu AI trả về thiếu
  if (processedIngredients.length < 3) {
    processedIngredients.length = 0;
    for (const fbIng of smartFallback.ingredients) {
      const ingredientId = await resolveOrRegisterIngredient(fbIng.name, fbIng.unit);
      processedIngredients.push({
        ingredientId,
        name: fbIng.name,
        amount: fbIng.amount,
        unit: fbIng.unit,
        scalePolicy: fbIng.scalePolicy,
        preparation: fbIng.preparation,
        isOptional: fbIng.isOptional,
      });
    }
  }

  // Xử lý các bước nấu (yêu cầu tối thiểu 4 bước chi tiết trở lên, cho phép chia nhiều giai đoạn linh hoạt)
  const rawSteps =
    Array.isArray(parsed.steps) && parsed.steps.length >= 4
      ? parsed.steps
      : smartFallback.steps;
  const processedSteps: AiRecipeStepDraft[] = [];

  rawSteps.forEach((raw: any, idx: number) => {
    const instruction = String(raw.instruction || '').trim();
    if (!instruction) return;

    const rawPhase = String(raw.phaseName || '').trim();
    const phaseName =
      rawPhase.length >= 2
        ? rawPhase
        : idx === 0
        ? 'Sơ chế & Khử mùi'
        : idx === 1
        ? 'Ướp thấm vị & Pha sốt'
        : idx === rawSteps.length - 1
        ? 'Hoàn thành & Trình bày'
        : 'Chế biến & Canh lửa';

    const timerSeconds = Number(raw.timerSeconds) >= 0 ? Number(raw.timerSeconds) : 0;
    const tipText = String(raw.tipText || '').trim();

    processedSteps.push({
      stepNumber: idx + 1,
      phaseName,
      instruction,
      timerSeconds,
      tipText,
    });
  });

  if (processedSteps.length < 4) {
    processedSteps.length = 0;
    for (const fbStep of smartFallback.steps) {
      processedSteps.push(fbStep);
    }
  }

  const finalHeroImage =
    extractedImage || resolveSmartDishIllustration(validatedName, validatedRole);

  return {
    draft: {
      name: validatedName,
      dishName: validatedDishName,
      shortDescription: validatedDescription,
      role: validatedRole,
      status: 'DRAFT', // INVARIANT: Tuyệt đối không bao giờ tự publish
      provenance: 'AI_ASSISTED', // INVARIANT: Đánh dấu xuất xứ AI
      difficulty: validatedDifficulty,
      baseServings,
      prepTimeMinutes: validatedPrep,
      cookTimeMinutes: validatedCook,
      isCookTested: false, // INVARIANT: Không đánh dấu đã nấu thử
      isEditorialReviewed: false, // INVARIANT: Không đánh dấu đã biên tập kiểm chứng
      isNutritionVerified: false,
      heroImage: finalHeroImage,
      hasExtractedRealPhoto: Boolean(extractedImage),
      sourceUrl: sourceUrl || undefined,
      ingredients: processedIngredients,
      steps: processedSteps,
    },
    provider: aiResult.provider,
    isFallback: aiResult.isFallback || false,
  };
}

/**
 * Lưu trực tiếp bản thảo do AI tạo vào cơ sở dữ liệu ở trạng thái DRAFT
 */
export async function saveAiDraftToDatabase(
  draft: AiRecipeDraftPayload,
  authorId: number | null
): Promise<{ recipeId: number; slug: string }> {
  // Tạo slug duy nhất
  const baseSlug = slugify(draft.name) || `recipe-${Date.now()}`;
  let finalSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.slug, finalSlug))
      .limit(1);

    if (existing.length === 0) break;
    finalSlug = `${baseSlug}-${counter++}`;
  }

  const saved = await db.transaction(async (tx) => {
    // 1. Tạo hoặc lấy dish
    let dishId: number | null = null;
    const dishSlug = slugify(draft.dishName) || finalSlug;

    const existingDish = await tx
      .select({ id: dishes.id })
      .from(dishes)
      .where(eq(dishes.slug, dishSlug))
      .limit(1);

    if (existingDish.length > 0) {
      dishId = existingDish[0].id;
    } else {
      const [newDish] = await tx
        .insert(dishes)
        .values({
          slug: dishSlug,
          name: draft.dishName,
          description: draft.shortDescription,
          defaultRole: draft.role,
        })
        .returning({ id: dishes.id });
      dishId = newDish.id;
    }

    // 2. Chèn recipe với INVARIANTS: status='DRAFT', provenance='AI_ASSISTED'
    const [insertedRecipe] = await tx
      .insert(recipes)
      .values({
        dishId,
        slug: finalSlug,
        name: draft.name,
        shortDescription: draft.shortDescription,
        role: draft.role,
        status: 'DRAFT',
        provenance: 'AI_ASSISTED',
        baseServings: draft.baseServings,
        prepTimeMinutes: draft.prepTimeMinutes,
        cookTimeMinutes: draft.cookTimeMinutes,
        difficulty: draft.difficulty,
        heroImage: draft.heroImage || null,
        isEditorialReviewed: false,
        isCookTested: false,
        isNutritionVerified: false,
        authorId,
      })
      .returning({ id: recipes.id, slug: recipes.slug });

    // 3. Chèn ingredients
    if (draft.ingredients.length > 0) {
      await tx.insert(recipeIngredients).values(
        draft.ingredients.map((ing, idx) => ({
          recipeId: insertedRecipe.id,
          ingredientId: ing.ingredientId,
          amount: ing.amount,
          unit: ing.unit,
          scalePolicy: ing.scalePolicy,
          preparation: ing.preparation || null,
          isOptional: ing.isOptional,
          sortOrder: idx + 1,
        }))
      );
    }

    // 4. Chèn steps
    if (draft.steps.length > 0) {
      await tx.insert(cookingSteps).values(
        draft.steps.map((st, idx) => ({
          recipeId: insertedRecipe.id,
          stepNumber: idx + 1,
          phaseName: st.phaseName,
          instruction: st.instruction,
          timerSeconds: st.timerSeconds,
          tipText: st.tipText || null,
        }))
      );
    }

    // 5. Tự động gắn thẻ Taxonomy Giảm cân · Ít Calo / Tập Gym · Tăng cơ nếu phù hợp
    const combinedText = `${draft.name} ${draft.shortDescription} ${draft.sourceUrl || ''}`.toLowerCase();
    const targetTaxSlugs: string[] = [];
    if (
      combinedText.includes('giảm cân') ||
      combinedText.includes('ít calo') ||
      combinedText.includes('ít béo') ||
      combinedText.includes('thanh đạm') ||
      combinedText.includes('nhs.uk') ||
      combinedText.includes('bbcgoodfood') ||
      combinedText.includes('bbc.co.uk') ||
      combinedText.includes('weightwatchers') ||
      combinedText.includes('hungry-girl')
    ) {
      targetTaxSlugs.push('giam-can-it-calo');
    }
    if (
      combinedText.includes('tập gym') ||
      combinedText.includes('tăng cơ') ||
      combinedText.includes('protein') ||
      combinedText.includes('giàu đạm') ||
      combinedText.includes('meal prep') ||
      combinedText.includes('ức gà') ||
      combinedText.includes('thăn bò') ||
      combinedText.includes('cá hồi') ||
      combinedText.includes('eatthegains') ||
      combinedText.includes('fitmencook') ||
      combinedText.includes('strongrfastr')
    ) {
      targetTaxSlugs.push('tap-gym-tang-co');
    }

    if (targetTaxSlugs.length > 0) {
      const matchedTax = await tx
        .select({ id: taxonomies.id })
        .from(taxonomies)
        .where(inArray(taxonomies.slug, targetTaxSlugs));
      for (const t of matchedTax) {
        await tx
          .insert(recipeTags)
          .values({
            recipeId: insertedRecipe.id,
            taxonomyId: t.id,
          })
          .onConflictDoNothing();
      }
    }

    return {
      recipeId: insertedRecipe.id,
      slug: insertedRecipe.slug,
    };
  });

  // Tự động tính toán ngay thông số Calo & Dinh dưỡng cho từng thành phần của công thức mới
  try {
    await calculateRecipeNutrition(saved.recipeId);
  } catch {
    // Không chặn lưu bản nháp nếu có lỗi phụ
  }

  return saved;
}
