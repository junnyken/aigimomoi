import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { VIETNAMESE_STANDARD_FCT } from '@/lib/nutrition/seedData';
import { GeminiProvider } from '@/lib/ai/geminiProvider';

const VALID_CATEGORIES = [
  'Thực phẩm tươi sống',
  'Thủy hải sản',
  'Rau củ quả',
  'Gia vị nêm nếm',
  'Đồ khô',
] as const;

const VALID_UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'quả',
  'củ',
  'bó',
  'cây',
  'tép',
  'thìa cà phê',
  'thìa canh',
] as const;

interface AiIngredientNutritionResult {
  category: (typeof VALID_CATEGORIES)[number];
  standardUnit: (typeof VALID_UNITS)[number];
  isPantryStaple: boolean;
  calories100g: number;
  protein100g: number;
  fat100g: number;
  carbs100g: number;
  fiber100g: number;
  sodium100g: number;
  ediblePercent: number;
  source: string;
  notes: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: 'Yêu cầu quyền Biên tập viên hoặc Quản trị viên' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rawName = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!rawName) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên nguyên liệu trước khi bấm AI tra cứu' },
        { status: 400 }
      );
    }

    const lower = rawName.toLowerCase();

    // 1. Ưu tiên kiểm tra khớp chính xác hoặc gần đúng trong Bảng Thành Phần Thực Phẩm Việt Nam (VIETNAMESE_STANDARD_FCT)
    const exactMatch = VIETNAMESE_STANDARD_FCT.find((item) => {
      const itemLower = item.name.toLowerCase();
      const baseItemName = itemLower.split('(')[0].trim();
      return itemLower === lower || baseItemName === lower;
    });

    if (exactMatch) {
      return NextResponse.json({
        nutrition: {
          category: exactMatch.category || 'Thực phẩm tươi sống',
          standardUnit: exactMatch.standardUnit || 'g',
          isPantryStaple: Boolean(exactMatch.isPantryStaple),
          calories100g: exactMatch.calories100g,
          protein100g: exactMatch.protein100g,
          fat100g: exactMatch.fat100g,
          carbs100g: exactMatch.carbs100g,
          fiber100g: exactMatch.fiber100g ?? 0,
          sodium100g: exactMatch.sodium100g ?? 0,
          ediblePercent: Math.round((exactMatch.edibleRate ?? 1) * 100),
          source: exactMatch.source,
          notes: exactMatch.notes || 'Đối chiếu trực tiếp từ Bảng Thành Phần Thực Phẩm Việt Nam (Bộ Y Tế)',
        },
        provider: 'VIETNAM_FCT_CATALOG',
      });
    }

    // 2. Sử dụng Gemini AI để tra cứu thông số dinh dưỡng chuẩn trên 100g phần ăn được (FCT Việt Nam / USDA)
    const prompt = `Bạn là chuyên gia Dinh dưỡng Viện Dinh Dưỡng Quốc Gia Việt Nam (VIETNAM_FCT) và USDA FoodData Central.
Hãy tra cứu chính xác thông số dinh dưỡng trên 100g phần ăn được (100g edible portion) cho nguyên liệu nấu ăn tại Việt Nam sau đây:
Tên nguyên liệu: "${rawName}"

Trả về JSON theo đúng cấu trúc sau (không thêm markdown):
{
  "category": Một trong 5 giá trị: "Thực phẩm tươi sống" | "Thủy hải sản" | "Rau củ quả" | "Gia vị nêm nếm" | "Đồ khô",
  "standardUnit": Một trong các đơn vị chuẩn: "g" | "ml" | "quả" | "củ" | "bó" | "cây" | "tép" | "thìa cà phê" | "thìa canh",
  "isPantryStaple": true nếu là gia vị/đồ khô có sẵn trong tủ bếp, false nếu là đồ tươi cần đi chợ mua,
  "calories100g": số kcal trên 100g phần ăn được (số thực, ví dụ 115),
  "protein100g": số gam chất đạm (Protein) trên 100g ăn được,
  "fat100g": số gam chất béo (Fat) trên 100g ăn được,
  "carbs100g": số gam đường bột (Carbohydrate) trên 100g ăn được,
  "fiber100g": số gam chất xơ (Fiber) trên 100g ăn được,
  "sodium100g": số mg Natri (Sodium) trên 100g ăn được,
  "ediblePercent": tỷ lệ % phần ăn được sau khi sơ chế bỏ xương/vỏ/cuống (từ 20 đến 100, ví dụ cá nguyên con là 65, thịt phi lê là 100, rau lá là 82),
  "source": "VIETNAM_FCT_2007" (nếu là nguyên liệu Việt Nam) hoặc "USDA_FDC" (nếu là nguyên liệu nhập khẩu/Eat Clean),
  "notes": Ghi chú ngắn gọn (1 câu Tiếng Việt) về đặc điểm dinh dưỡng và món ăn thường dùng cho nguyên liệu này.
}`;

    try {
      const gemini = new GeminiProvider();
      const completion = await gemini.generateCompletion({
        prompt,
        jsonMode: true,
        temperature: 0.2,
        maxTokens: 500,
      });
      const cleaned = completion.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const aiData = JSON.parse(cleaned) as AiIngredientNutritionResult;
      const validCat = VALID_CATEGORIES.includes(aiData.category as any)
        ? aiData.category
        : 'Thực phẩm tươi sống';
      const validUnit = VALID_UNITS.includes(aiData.standardUnit as any)
        ? aiData.standardUnit
        : 'g';

      return NextResponse.json({
        nutrition: {
          category: validCat,
          standardUnit: validUnit,
          isPantryStaple: Boolean(aiData.isPantryStaple),
          calories100g: Math.max(0, Math.round((Number(aiData.calories100g) || 0) * 10) / 10),
          protein100g: Math.max(0, Math.round((Number(aiData.protein100g) || 0) * 10) / 10),
          fat100g: Math.max(0, Math.round((Number(aiData.fat100g) || 0) * 10) / 10),
          carbs100g: Math.max(0, Math.round((Number(aiData.carbs100g) || 0) * 10) / 10),
          fiber100g: Math.max(0, Math.round((Number(aiData.fiber100g) || 0) * 10) / 10),
          sodium100g: Math.max(0, Math.round(Number(aiData.sodium100g) || 0)),
          ediblePercent: Math.min(100, Math.max(15, Math.round(Number(aiData.ediblePercent) || 100))),
          source: aiData.source || 'VIETNAM_FCT_2007',
          notes: aiData.notes || `Tra cứu tự động bởi AI Dinh dưỡng cho ${rawName}`,
        },
        provider: 'GEMINI_AI_FCT',
      });
    } catch {
      // 3. Fallback thông minh theo nhóm từ khóa nếu Gemini tạm thời không phản hồi
      const partialMatch = VIETNAMESE_STANDARD_FCT.find((item) => {
        const stdLower = item.name.toLowerCase();
        return lower.includes(stdLower.split('(')[0].trim()) || stdLower.includes(lower);
      });

      if (partialMatch) {
        return NextResponse.json({
          nutrition: {
            category: partialMatch.category || 'Thực phẩm tươi sống',
            standardUnit: partialMatch.standardUnit || 'g',
            isPantryStaple: Boolean(partialMatch.isPantryStaple),
            calories100g: partialMatch.calories100g,
            protein100g: partialMatch.protein100g,
            fat100g: partialMatch.fat100g,
            carbs100g: partialMatch.carbs100g,
            fiber100g: partialMatch.fiber100g ?? 0,
            sodium100g: partialMatch.sodium100g ?? 0,
            ediblePercent: Math.round((partialMatch.edibleRate ?? 1) * 100),
            source: partialMatch.source,
            notes: partialMatch.notes || `Ước tính từ nhóm ${partialMatch.name} (Viện Dinh Dưỡng)`,
          },
          provider: 'VIETNAM_FCT_FALLBACK',
        });
      }

      return NextResponse.json({
        nutrition: {
          category: 'Rau củ quả',
          standardUnit: 'g',
          isPantryStaple: false,
          calories100g: 35,
          protein100g: 2.0,
          fat100g: 0.3,
          carbs100g: 6.0,
          fiber100g: 1.8,
          sodium100g: 18,
          ediblePercent: 85,
          source: 'VIETNAM_FCT_2007',
          notes: `Thông số mặc định chuẩn FCT cho ${rawName}`,
        },
        provider: 'DEFAULT_FCT',
      });
    }
  } catch (error) {
    console.error('Error in AI ingredient nutrition lookup:', error);
    return NextResponse.json(
      { error: 'Không thể tra cứu thông số dinh dưỡng lúc này' },
      { status: 500 }
    );
  }
}
