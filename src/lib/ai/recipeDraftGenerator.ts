// AG-29: AI Recipe Draft Generator Engine
// Tuân thủ nghiêm ngặt Invariants Gate P4 & Master Plan (§5.1, §5.5, §8.2):
// - Output schema valid 100%.
// - Bản nháp luôn có provenance = 'AI_ASSISTED'.
// - Cấm tự động xuất bản (status luôn là 'DRAFT', isCookTested = false, isEditorialReviewed = false).

import { db } from '../db';
import { ingredients, recipes, recipeIngredients, cookingSteps, dishes } from '../db/schema';
import { eq, ilike } from 'drizzle-orm';
import { aiGateway } from './gateway';

export interface AiRecipeDraftParams {
  dishTitle: string;
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
  ingredients: AiRecipeIngredientDraft[];
  steps: AiRecipeStepDraft[];
}

export interface AiRecipeDraftResult {
  draft: AiRecipeDraftPayload;
  provider: string;
  isFallback: boolean;
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
 * Khởi tạo bản thảo công thức do AI hỗ trợ cho Biên tập viên
 */
export async function generateRecipeDraft(params: AiRecipeDraftParams): Promise<AiRecipeDraftResult> {
  const title = (params.dishTitle || '').trim();
  if (!title) {
    throw new Error('Vui lòng cung cấp tên món ăn cần tạo bản thảo.');
  }

  const role = params.role || 'MAIN';
  const region = params.region || 'Toàn quốc';
  const styleNotes = params.styleNotes || 'Chuẩn vị cơm nhà, cân bằng hương vị';
  const baseServings = params.baseServings && params.baseServings > 0 ? params.baseServings : 4;

  const systemInstruction = `Bạn là Chuyên gia Biên soạn Công thức Bếp Việt Ăn Gì Mom.
Nhiệm vụ: Phân tích món ăn được yêu cầu và tạo cấu trúc bản thảo công thức hoàn chỉnh, chuẩn mực văn hóa ẩm thực gia đình Việt Nam.
QUY TẮC BẮT BUỘC:
1. Trả về định dạng JSON thuần túy theo schema:
{
  "name": "Tên công thức đầy đủ (ví dụ: Cá lóc kho tộ đậm đà miền Tây)",
  "dishName": "Tên món khái quát (ví dụ: Cá lóc kho tộ)",
  "shortDescription": "Đoạn văn 1-3 câu mô tả đặc trưng hương vị, màu sắc và cảm giác khi thưởng thức.",
  "role": "MAIN | SOUP | SIDE | ONE_DISH_MEAL",
  "difficulty": "Dễ | Trung bình | Khó",
  "baseServings": 4,
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 25,
  "ingredients": [
    {
      "name": "Tên nguyên liệu (tiếng Việt rõ ràng)",
      "amount": 400,
      "unit": "g | ml | muỗng canh | muỗng cà phê | củ | trái | nhánh",
      "scalePolicy": "LINEAR | FIXED | MANUAL_ADJUST",
      "preparation": "Cách sơ chế (ví dụ: Cắt khúc 3cm, để ráo)",
      "isOptional": false
    }
  ],
  "steps": [
    {
      "phaseName": "Sơ chế | Chế biến | Hoàn thành",
      "instruction": "Nội dung hướng dẫn chi tiết, rõ ràng từng thao tác",
      "timerSeconds": 600,
      "tipText": "Mẹo nhỏ thực tế giúp món ăn thơm ngon, chuẩn vị hơn"
    }
  ]
}
2. Chính sách scalePolicy:
- 'LINEAR': Dành cho nguyên liệu chính (thịt, cá, tôm, rau, đậu hũ) co giãn theo số người ăn.
- 'FIXED': Dành cho dầu ăn phi, lá thơm, hành ngò rắc trên mặt.
- 'MANUAL_ADJUST': Dành cho mắm, muối, tiêu, ớt cần nếm thử theo khẩu vị.
3. Không trả về markdown code blocks, chỉ JSON hợp lệ.`;

  const prompt = `YÊU CẦU SOẠN THẢO CÔNG THỨC:
- Tên món ăn: ${title}
- Vai trò dự kiến: ${role}
- Vùng miền ẩm thực: ${region}
- Khẩu phần ăn chuẩn: ${baseServings} người
- Ghi chú phong cách: ${styleNotes}

Hãy phân tích và soạn thảo bản thảo công thức có cấu trúc hoàn chỉnh.`;

  const aiResult = await aiGateway.complete(
    {
      prompt,
      systemInstruction,
      temperature: 0.3,
      jsonMode: true,
      maxTokens: 1200,
    },
    params.clientId || 'editor-agent'
  );

  let parsed: any = {};
  try {
    parsed = JSON.parse(aiResult.text);
  } catch {
    parsed = {};
  }

  // ==========================================================
  // SCHEMA SANITIZATION & INVARIANTS ENFORCEMENT (Gate P4)
  // ==========================================================

  const validatedName = (parsed.name && typeof parsed.name === 'string' ? parsed.name : title).trim();
  const validatedDishName = (parsed.dishName && typeof parsed.dishName === 'string' ? parsed.dishName : title).trim();
  const validatedDescription = (
    parsed.shortDescription && typeof parsed.shortDescription === 'string'
      ? parsed.shortDescription
      : `Công thức ${validatedName} chuẩn vị cơm nhà truyền thống, thơm ngon, đậm đà và giàu dinh dưỡng.`
  ).trim();

  let validatedRole: 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL' = role;
  if (['MAIN', 'SOUP', 'SIDE', 'ONE_DISH_MEAL'].includes(parsed.role)) {
    validatedRole = parsed.role;
  }

  const validatedDifficulty = ['Dễ', 'Trung bình', 'Khó'].includes(parsed.difficulty) ? parsed.difficulty : 'Dễ';
  const validatedPrep = Number(parsed.prepTimeMinutes) > 0 ? Number(parsed.prepTimeMinutes) : 15;
  const validatedCook = Number(parsed.cookTimeMinutes) > 0 ? Number(parsed.cookTimeMinutes) : 25;

  // Xử lý nguyên liệu
  const rawIngs = Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0 ? parsed.ingredients : [];
  const processedIngredients: AiRecipeIngredientDraft[] = [];

  for (const raw of rawIngs) {
    const ingName = String(raw.name || '').trim();
    if (!ingName) continue;

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

  // Đảm bảo có ít nhất 2 nguyên liệu mặc định nếu AI không trả về đủ
  if (processedIngredients.length === 0) {
    const defaultIngId = await resolveOrRegisterIngredient('Nguyên liệu chính', 'g');
    processedIngredients.push({
      ingredientId: defaultIngId,
      name: 'Nguyên liệu chính',
      amount: 400,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'Sơ chế sạch sẽ',
      isOptional: false,
    });
  }

  // Xử lý các bước nấu
  const rawSteps = Array.isArray(parsed.steps) && parsed.steps.length > 0 ? parsed.steps : [];
  const processedSteps: AiRecipeStepDraft[] = [];

  rawSteps.forEach((raw: any, idx: number) => {
    const instruction = String(raw.instruction || '').trim();
    if (!instruction) return;

    const phaseName = ['Sơ chế', 'Chế biến', 'Hoàn thành'].includes(raw.phaseName)
      ? raw.phaseName
      : idx === 0
      ? 'Sơ chế'
      : idx === rawSteps.length - 1
      ? 'Hoàn thành'
      : 'Chế biến';

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

  if (processedSteps.length === 0) {
    processedSteps.push(
      {
        stepNumber: 1,
        phaseName: 'Sơ chế',
        instruction: `Sơ chế sạch các nguyên liệu cho món ${validatedName}.`,
        timerSeconds: 600,
        tipText: 'Ướp gia vị trước 15 phút để món ăn đậm đà hơn.',
      },
      {
        stepNumber: 2,
        phaseName: 'Chế biến',
        instruction: `Tiến hành nấu chín món ăn ở lửa vừa cho đến khi đạt độ chín và hương thơm mong muốn.`,
        timerSeconds: 1200,
        tipText: 'Theo dõi lửa để món ăn không bị cạn nước hoặc quá nhiệt.',
      }
    );
  }

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

  return await db.transaction(async (tx) => {
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

    return {
      recipeId: insertedRecipe.id,
      slug: insertedRecipe.slug,
    };
  });
}
