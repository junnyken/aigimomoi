// AG-28: AI Meal Suggestion Engine & Catalog Grounding Validator
// Tuân thủ nghiêm ngặt Invariants §5.1 & Acceptance AG-28:
// Chỉ trả về món ăn có status = 'PUBLISHED' và ID/slug thật tồn tại trong database.
// Không bao giờ chấp nhận món ảo giác (hallucination) hay bản nháp.

import { db } from '../db';
import { recipes, recipeIngredients, ingredients } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { aiGateway } from './gateway';
import type { MealDishSummary } from '../meal/mealQueries';
import { safeImageSrc } from '../recipes/publicQueries';

export interface AiMealSuggestionParams {
  userIngredients?: string[];
  region?: string;
  preferences?: string[];
  servings?: number;
  clientId?: string;
}

export interface AiMealSuggestionResult {
  meal: {
    main: MealDishSummary;
    soup: MealDishSummary;
    side: MealDishSummary;
  };
  rationale: string;
  matchingIngredients: string[];
  provider: string;
  isFallback: boolean;
}

interface RawCatalogDish {
  id: number;
  slug: string;
  name: string;
  role: 'MAIN' | 'SOUP' | 'SIDE';
  difficulty: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  baseServings: number;
  shortDescription: string;
  heroImage: string | null;
  isCookTested: boolean;
  ingredientNames: string[];
}

/**
 * Lấy toàn bộ danh mục công thức PUBLISHED để cung cấp bối cảnh (grounding context) cho AI.
 */
async function getPublishedCatalogContext(): Promise<RawCatalogDish[]> {
  const publishedRows = await db
    .select({
      id: recipes.id,
      slug: recipes.slug,
      name: recipes.name,
      role: recipes.role,
      difficulty: recipes.difficulty,
      prepTimeMinutes: recipes.prepTimeMinutes,
      cookTimeMinutes: recipes.cookTimeMinutes,
      baseServings: recipes.baseServings,
      shortDescription: recipes.shortDescription,
      heroImage: recipes.heroImage,
      isCookTested: recipes.isCookTested,
    })
    .from(recipes)
    .where(eq(recipes.status, 'PUBLISHED'));

  const validRows = publishedRows.filter(
    (r) => r.role === 'MAIN' || r.role === 'SOUP' || r.role === 'SIDE'
  );
  if (validRows.length === 0) {
    return [];
  }

  // Batch fetch toàn bộ nguyên liệu trong 1 câu truy vấn thay vì N+1 queries
  const recipeIds = validRows.map((r) => r.id);
  const allIngRows = await db
    .select({
      recipeId: recipeIngredients.recipeId,
      name: ingredients.name,
    })
    .from(recipeIngredients)
    .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(inArray(recipeIngredients.recipeId, recipeIds));

  const ingMap = new Map<number, string[]>();
  for (const row of allIngRows) {
    const list = ingMap.get(row.recipeId) || [];
    list.push(row.name.toLowerCase());
    ingMap.set(row.recipeId, list);
  }

  return validRows.map((r) => ({
    ...r,
    role: r.role as 'MAIN' | 'SOUP' | 'SIDE',
    ingredientNames: ingMap.get(r.id) || [],
  }));
}

function toDishSummary(row: RawCatalogDish): MealDishSummary {
  return {
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    role: row.role,
    baseServings: row.baseServings,
    prepTimeMinutes: row.prepTimeMinutes,
    cookTimeMinutes: row.cookTimeMinutes,
    totalTimeMinutes: row.prepTimeMinutes + row.cookTimeMinutes,
    difficulty: row.difficulty,
    heroImage: safeImageSrc(row.heroImage),
    isCookTested: row.isCookTested,
  };
}

/**
 * Động cơ Gợi ý Mâm cơm AI có kiểm chứng Grounding
 */
export async function suggestMealWithAi(params: AiMealSuggestionParams): Promise<AiMealSuggestionResult> {
  const catalog = await getPublishedCatalogContext();

  const mains = catalog.filter((c) => c.role === 'MAIN');
  const soups = catalog.filter((c) => c.role === 'SOUP');
  const sides = catalog.filter((c) => c.role === 'SIDE');

  if (mains.length === 0 || soups.length === 0 || sides.length === 0) {
    throw new Error('Database chưa có đủ món ăn PUBLISHED cho cả 3 vai trò MAIN, SOUP, SIDE');
  }

  const userIngs = (params.userIngredients || []).map((i) => i.trim().toLowerCase()).filter(Boolean);
  const preferences = params.preferences || [];
  const region = params.region || 'Tất cả';

  // Soạn tóm tắt catalog cho AI
  const catalogSummary = catalog.map((c) => ({
    slug: c.slug,
    name: c.name,
    role: c.role,
    ingredients: c.ingredientNames.slice(0, 5),
  }));

  const systemInstruction = `Bạn là Trợ lý Bếp Ăn Gì Mom, chuyên gia gợi ý mâm cơm gia đình Việt Nam chuẩn mực 3 món: 1 Món Mặn (MAIN), 1 Món Canh (SOUP), 1 Món Rau/Xào (SIDE).
QUY TẮC BẮT BUỘC:
1. Bạn CHỈ ĐƯỢC CHỌN các món ăn có trong danh sách CÔNG THỨC HỢP LỆ dưới đây. Tuyệt đối không được tự bịa ra món ăn hoặc slug không có trong danh sách.
2. Trả về đúng 1 món role MAIN, 1 món role SOUP, 1 món role SIDE.
3. Ưu tiên các món tận dụng được nguyên liệu người dùng đang có trong tủ lạnh.
4. Trả về định dạng JSON thuần túy theo schema:
{
  "mainSlug": "slug của món mặn",
  "soupSlug": "slug của món canh",
  "sideSlug": "slug của món rau",
  "rationale": "Lời giải thích ngắn gọn, ấm áp vì sao mâm cơm này phù hợp (1-2 câu)",
  "matchingIngredients": ["các nguyên liệu người dùng có đã được tận dụng"]
}`;

  const prompt = `DANH SÁCH CÔNG THỨC HỢP LỆ TRONG DATABASE:
${JSON.stringify(catalogSummary, null, 2)}

YÊU CẦU NGƯỜI DÙNG:
- Nguyên liệu sẵn có trong tủ lạnh: ${userIngs.length > 0 ? userIngs.join(', ') : 'Không có nguyên liệu cụ thể'}
- Vùng miền ưu tiên: ${region}
- Sở thích: ${preferences.length > 0 ? preferences.join(', ') : 'Bữa cơm hàng ngày, cân bằng dinh dưỡng'}

Hãy chọn mâm cơm 3 món hoàn hảo nhất và trả về JSON theo schema.`;

  // Gọi Gateway có rate-limit và automatic fallback
  const aiResult = await aiGateway.complete(
    {
      prompt,
      systemInstruction,
      temperature: 0.2, // Nhiệt độ thấp để giảm hallucination
      jsonMode: true,
      maxTokens: 800,
    },
    params.clientId || 'anonymous'
  );

  let parsed: {
    mainSlug?: string;
    soupSlug?: string;
    sideSlug?: string;
    rationale?: string;
    matchingIngredients?: string[];
  } = {};

  try {
    parsed = JSON.parse(aiResult.text);
  } catch {
    parsed = {};
  }

  // ==========================================================
  // GROUNDING VALIDATION LAYER (Invariants §5.1, §5.3, AG-28)
  // Đối chiếu nghiêm ngặt với catalog PUBLISHED trong DB.
  // ==========================================================

  // 1. Validate MAIN
  let selectedMain = mains.find((m) => m.slug === parsed.mainSlug);
  if (!selectedMain) {
    // Fallback: Tìm món mặn khớp nhiều nguyên liệu nhất, hoặc lấy món đầu tiên
    selectedMain =
      mains.find((m) => userIngs.some((ui) => m.ingredientNames.some((inName) => inName.includes(ui)))) || mains[0];
  }

  // 2. Validate SOUP
  let selectedSoup = soups.find((s) => s.slug === parsed.soupSlug);
  if (!selectedSoup) {
    selectedSoup =
      soups.find((s) => userIngs.some((ui) => s.ingredientNames.some((inName) => inName.includes(ui)))) || soups[0];
  }

  // 3. Validate SIDE
  let selectedSide = sides.find((s) => s.slug === parsed.sideSlug);
  if (!selectedSide) {
    selectedSide =
      sides.find((s) => userIngs.some((ui) => s.ingredientNames.some((inName) => inName.includes(ui)))) || sides[0];
  }

  const rationale =
    parsed.rationale && typeof parsed.rationale === 'string'
      ? parsed.rationale
      : `Mâm cơm gia đình cân bằng dinh dưỡng với ${selectedMain.name}, ${selectedSoup.name} và ${selectedSide.name}.`;

  const matching = Array.isArray(parsed.matchingIngredients)
    ? parsed.matchingIngredients.filter((i) => typeof i === 'string')
    : userIngs.filter((ui) =>
        [...selectedMain.ingredientNames, ...selectedSoup.ingredientNames, ...selectedSide.ingredientNames].some((inName) =>
          inName.includes(ui)
        )
      );

  return {
    meal: {
      main: toDishSummary(selectedMain),
      soup: toDishSummary(selectedSoup),
      side: toDishSummary(selectedSide),
    },
    rationale,
    matchingIngredients: matching,
    provider: aiResult.provider,
    isFallback: aiResult.isFallback || false,
  };
}
