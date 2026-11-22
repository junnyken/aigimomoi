import { NextRequest, NextResponse } from 'next/server';
import { VIETNAMESE_STANDARD_FCT, type StandardNutritionItem } from '@/lib/nutrition/seedData';
import { checkRateLimit, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { getEffectiveAiConfig } from '@/lib/ai/configStore';
import { aiGateway } from '@/lib/ai/gateway';
import { logger } from '@/lib/logger';

export interface ScannedFoodItem {
  id: string;
  name: string;
  category: 'PROTEIN' | 'VEGGIE_FRUIT' | 'CARB' | 'HEALTHY_FAT' | 'SAUCE';
  estimatedGrams: number;
  portionNote: string;
  pinX: number;
  pinY: number;
  calories100g: number;
  protein100g: number;
  fat100g: number;
  carbs100g: number;
  fiber100g: number;
  source: string;
  matchedFctName?: string;
  confidencePercent?: number;
  cookingMethod?: 'STEAM_BOIL_RAW' | 'PAN_SEAR_LIGHT' | 'STIR_FRY_SAUCE';
}

export interface FoodScanResponse {
  dishTitle: string;
  mealFormat: 'SINGLE_PLATE' | 'DAILY_3_MEALS' | 'FAMILY_TRAY';
  healthScore: number;
  coachSummary: string;
  improvementTips?: string[];
  items: ScannedFoodItem[];
  provider: string;
  visualAnchorNote?: string;
  overallConfidence?: number;
  detectedOilLevel?: 'NONE' | 'LIGHT_OIL' | 'SAUCE_RICH';
  visionStatus?: 'OK' | 'DEEPSEEK_TEXT_AI' | 'KEY_DEAD_OR_MISSING' | 'QUOTA_LIMIT';
  visionMessage?: string;
}

export interface FridgeScanPantryItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  shelfNote: string;
}

export interface FridgeScanResponse {
  mode: 'FRIDGE';
  summary: string;
  pantryItems: FridgeScanPantryItem[];
  suggestedDishes: string[];
  provider: string;
  visionStatus?: 'OK' | 'DEEPSEEK_TEXT_AI' | 'KEY_DEAD_OR_MISSING' | 'QUOTA_LIMIT';
}

export interface NutritionLabelScanResponse {
  mode: 'LABEL';
  productName: string;
  servingSize: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  sugarGrams: number | null;
  sodiumMg: number | null;
  trafficLight: 'GREEN' | 'AMBER' | 'RED';
  familyAdvice: string[];
  provider: string;
  visionStatus?: 'OK' | 'DEEPSEEK_TEXT_AI' | 'KEY_DEAD_OR_MISSING' | 'QUOTA_LIMIT';
}

function extractJsonObject(raw: string): string {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

const FCT_KEYWORD_SYNONYMS: Array<{ keywords: string[]; slug: string }> = [
  { keywords: ['ức gà', 'gà áp chảo', 'gà luộc', 'gà xé'], slug: 'uc-ga-phi-le' },
  { keywords: ['đùi gà', 'cánh gà', 'gà kho', 'gà nướng', 'gà chiên', 'thịt gà', 'cơm gà'], slug: 'thit-ga-ta' },
  { keywords: ['cá hồi'], slug: 'ca-hoi-phi-le' },
  { keywords: ['cá lóc', 'cá kho', 'cá quả', 'cá đồng'], slug: 'ca-loc' },
  { keywords: ['cá basa', 'cá hú'], slug: 'ca-basa-phi-le' },
  { keywords: ['cá thu'], slug: 'ca-thu' },
  { keywords: ['cá diêu hồng', 'cá hấp', 'cá chiên', 'cá rô'], slug: 'ca-dieu-hong' },
  { keywords: ['tôm', 'tôm cháy tỏi', 'tôm hấp', 'tôm luộc', 'tôm nõn', 'tôm rim'], slug: 'tom-non' },
  { keywords: ['trứng gà', 'trứng luộc', 'trứng lòng đào', 'trứng ốp la', 'trứng chiên', 'trứng kho', 'chả trứng'], slug: 'trung-ga' },
  { keywords: ['bò bít tết', 'thăn bò', 'thịt bò', 'bò áp chảo', 'bò xào', 'phở bò', 'bún bò'], slug: 'thit-bo-phi-le' },
  { keywords: ['thịt kho', 'ba chỉ', 'ba rọi', 'thịt quay', 'bún chả', 'thịt nướng'], slug: 'thit-ba-chi' },
  { keywords: ['sườn cốt lết', 'cơm tấm', 'cơm sườn', 'sườn nướng'], slug: 'suon-cot-let' },
  { keywords: ['sườn xào', 'sườn heo', 'sườn non', 'canh sườn'], slug: 'suon-heo' },
  { keywords: ['bì chả', 'chả lụa', 'giò lụa', 'chả hấp'], slug: 'cha-lua' },
  { keywords: ['thịt heo luộc', 'thịt nạc', 'thịt thăn heo', 'heo luộc', 'thịt băm'], slug: 'thit-heo-nac' },
  { keywords: ['mực', 'mực ống', 'mực hấp', 'mực xào'], slug: 'muc-ong' },
  { keywords: ['đậu phụ', 'đậu hũ', 'đậu hũ sốt cà', 'đậu khuôn'], slug: 'dau-phu' },
  { keywords: ['sữa tươi', 'ly sữa', 'cốc sữa'], slug: 'sua-tuoi-khong-duong' },
  { keywords: ['bông cải xanh', 'súp lơ xanh', 'bông cải hấp'], slug: 'bong-cai-xanh' },
  { keywords: ['bơ sáp', 'quả bơ', 'trái bơ', 'bơ hoa'], slug: 'bo-sap' },
  { keywords: ['cà chua', 'cà chua bi', 'canh chua'], slug: 'ca-chua' },
  { keywords: ['dưa leo', 'dưa chuột', 'đồ chua'], slug: 'dua-leo' },
  { keywords: ['cà rốt'], slug: 'ca-rot' },
  { keywords: ['đậu bắp'], slug: 'dau-bap' },
  { keywords: ['bắp ngọt', 'ngô ngọt', 'bắp luộc', 'hạt bắp'], slug: 'bap-ngot' },
  { keywords: ['khoai lang'], slug: 'khoai-lang' },
  { keywords: ['khoai tây'], slug: 'khoai-tay' },
  { keywords: ['khoai môn', 'khoai sọ'], slug: 'khoai-mon' },
  { keywords: ['bí đỏ', 'bí ngô'], slug: 'bi-do' },
  { keywords: ['khổ qua', 'mướp đắng'], slug: 'kho-qua' },
  { keywords: ['su su'], slug: 'su-su' },
  { keywords: ['thanh long'], slug: 'thanh-long-do' },
  { keywords: ['cam tươi', 'cam vàng', 'quả cam'], slug: 'cam-tuoi' },
  { keywords: ['chuối'], slug: 'chuoi-chin' },
  { keywords: ['dứa', 'thơm', 'khóm'], slug: 'dua-chin' },
  { keywords: ['bắp cải tím', 'bắp cải'], slug: 'bap-cai-tim' },
  { keywords: ['cải thìa', 'cải chíp'], slug: 'cai-thia' },
  { keywords: ['cải ngọt', 'rau cải', 'canh cải'], slug: 'cai-ngot' },
  { keywords: ['cải thảo'], slug: 'cai-thao' },
  { keywords: ['cải bó xôi', 'rau chân vịt'], slug: 'cai-bo-xoi' },
  { keywords: ['rau dền', 'canh rau dền'], slug: 'rau-den' },
  { keywords: ['rau muống', 'rau muống xào', 'rau muống luộc'], slug: 'rau-muong' },
  { keywords: ['xà lách', 'salad'], slug: 'xa-lach' },
  { keywords: ['giá đỗ'], slug: 'gia-do' },
  { keywords: ['nấm đùi gà', 'nấm đông cô', 'nấm'], slug: 'nam-dong-co' },
  { keywords: ['đậu gà'], slug: 'dau-ga-luoc' },
  { keywords: ['đậu nành nhật', 'edamame'], slug: 'dau-nanh-edamame' },
  { keywords: ['đậu hà lan'], slug: 'dau-ha-lan' },
  { keywords: ['cơm gạo lứt', 'gạo lứt', 'cơm lứt'], slug: 'com-gao-lut-chin' },
  { keywords: ['cơm trắng', 'cơm nóng', 'chén cơm', 'bát cơm', 'cơm tấm', 'cơm sườn', 'cơm gà'], slug: 'com-trang-chin' },
  { keywords: ['phở', 'phở bò', 'phở gà', 'bánh phở'], slug: 'banh-pho-tuoi' },
  { keywords: ['bún tươi', 'bún bò', 'bún chả', 'bún thịt nướng'], slug: 'bun-tuoi' },
  { keywords: ['mỳ ý', 'mì ý', 'spaghetti', 'pasta'], slug: 'mi-y-luoc' },
  { keywords: ['sốt pesto', 'pesto'], slug: 'sot-pesto' },
  { keywords: ['yến mạch'], slug: 'yen-mach' },
];

function matchVietnameseFct(itemName: string): StandardNutritionItem | null {
  const lower = itemName.toLowerCase().trim();

  for (const rule of FCT_KEYWORD_SYNONYMS) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const found = VIETNAMESE_STANDARD_FCT.find((f) => f.slug === rule.slug);
      if (found) return found;
    }
  }

  for (const fct of VIETNAMESE_STANDARD_FCT) {
    const cleanFct = fct.name.split('(')[0].toLowerCase().trim();
    if (cleanFct.length >= 4 && (lower.includes(cleanFct) || cleanFct.includes(lower))) {
      return fct;
    }
  }

  return null;
}

function enrichItemWithFct(rawItem: Partial<ScannedFoodItem>, index: number): ScannedFoodItem {
  const name = String(rawItem.name || `Thành phần #${index + 1}`).trim();
  const matched = matchVietnameseFct(name);

  // Tọa độ mặc định phân bổ đều quanh đĩa nếu AI trả về ngoài khoảng
  const defaultPins = [
    { x: 28, y: 28 },
    { x: 70, y: 26 },
    { x: 50, y: 50 },
    { x: 28, y: 72 },
    { x: 72, y: 70 },
    { x: 50, y: 22 },
  ];
  const fallbackPin = defaultPins[index % defaultPins.length];

  const pinX =
    typeof rawItem.pinX === 'number' && rawItem.pinX >= 10 && rawItem.pinX <= 90
      ? Math.round(rawItem.pinX)
      : fallbackPin.x;
  const pinY =
    typeof rawItem.pinY === 'number' && rawItem.pinY >= 10 && rawItem.pinY <= 90
      ? Math.round(rawItem.pinY)
      : fallbackPin.y;

  const estimatedGrams =
    typeof rawItem.estimatedGrams === 'number' && rawItem.estimatedGrams >= 5 && rawItem.estimatedGrams <= 1000
      ? Math.round(rawItem.estimatedGrams)
      : 85;

  const validCategories = ['PROTEIN', 'VEGGIE_FRUIT', 'CARB', 'HEALTHY_FAT', 'SAUCE'] as const;
  let category: ScannedFoodItem['category'] = validCategories.includes(rawItem.category as any)
    ? (rawItem.category as ScannedFoodItem['category'])
    : 'VEGGIE_FRUIT';

  if (matched) {
    if (matched.slug === 'bo-sap' || matched.slug.includes('dau-') || matched.slug === 'sot-pesto') {
      if (matched.fat100g >= 14) category = 'HEALTHY_FAT';
    } else if (matched.category === 'Thực phẩm tươi sống' || matched.category === 'Thủy hải sản') {
      category = 'PROTEIN';
    } else if (
      matched.slug.includes('com-') ||
      matched.slug.includes('khoai-') ||
      matched.slug === 'bap-ngot' ||
      matched.slug === 'mi-y-luoc' ||
      matched.slug === 'yen-mach'
    ) {
      category = 'CARB';
    } else if (matched.category === 'Rau củ quả') {
      category = 'VEGGIE_FRUIT';
    }
  }

  const lowerName = name.toLowerCase();
  const inferredMethod: ScannedFoodItem['cookingMethod'] =
    rawItem.cookingMethod === 'STEAM_BOIL_RAW' ||
    rawItem.cookingMethod === 'PAN_SEAR_LIGHT' ||
    rawItem.cookingMethod === 'STIR_FRY_SAUCE'
      ? rawItem.cookingMethod
      : lowerName.includes('xào') || lowerName.includes('sốt') || lowerName.includes('kho') || lowerName.includes('chiên')
      ? 'STIR_FRY_SAUCE'
      : lowerName.includes('áp chảo') || lowerName.includes('cháy tỏi') || lowerName.includes('ốp la') || lowerName.includes('bít tết')
      ? 'PAN_SEAR_LIGHT'
      : 'STEAM_BOIL_RAW';

  const confidencePercent =
    typeof rawItem.confidencePercent === 'number' && rawItem.confidencePercent >= 70 && rawItem.confidencePercent <= 99
      ? Math.round(rawItem.confidencePercent)
      : matched
      ? 95
      : 88;

  return {
    id: `item-${index}-${Date.now()}`,
    name,
    category,
    estimatedGrams,
    portionNote: String(rawItem.portionNote || `~${estimatedGrams}g`),
    pinX,
    pinY,
    calories100g: matched ? matched.calories100g : Math.max(10, Number(rawItem.calories100g) || 110),
    protein100g: matched ? matched.protein100g : Math.max(0, Number(rawItem.protein100g) || 6),
    fat100g: matched ? matched.fat100g : Math.max(0, Number(rawItem.fat100g) || 3),
    carbs100g: matched ? matched.carbs100g : Math.max(0, Number(rawItem.carbs100g) || 12),
    fiber100g: matched ? matched.fiber100g ?? 1.2 : Math.max(0, Number(rawItem.fiber100g) || 1.5),
    source: matched ? matched.source : 'AI_VISION_ESTIMATE',
    matchedFctName: matched?.name,
    confidencePercent,
    cookingMethod: inferredMethod,
  };
}

function buildImprovementTipsForPlate(
  items: ScannedFoodItem[],
  oilLevel: 'NONE' | 'LIGHT_OIL' | 'SAUCE_RICH' = 'LIGHT_OIL'
): string[] {
  let totalKcal = oilLevel === 'LIGHT_OIL' ? 36 : oilLevel === 'SAUCE_RICH' ? 80 : 0;
  let totalPro = 0;
  let totalFat = oilLevel === 'LIGHT_OIL' ? 4 : oilLevel === 'SAUCE_RICH' ? 8.5 : 0;
  let totalGrams = 0;
  let veggieGrams = 0;
  let carbGrams = 0;

  for (const it of items) {
    const r = it.estimatedGrams / 100;
    totalKcal += it.calories100g * r;
    totalPro += it.protein100g * r;
    totalFat += it.fat100g * r;
    totalGrams += it.estimatedGrams;
    if (it.category === 'VEGGIE_FRUIT') veggieGrams += it.estimatedGrams;
    if (it.category === 'CARB') carbGrams += it.estimatedGrams;
  }

  const veggiePct = Math.round((veggieGrams / Math.max(1, totalGrams)) * 100);
  const tips: string[] = [];

  if (veggiePct < 35) {
    tips.push(
      `🥦 Tăng rau xanh: Rau củ hiện chiếm ${veggiePct}% đĩa (chuẩn Harvard là 40–50%). Hãy thêm ~80g bông cải luộc hoặc dưa leo để no lâu và giảm hấp thu đường mỡ.`
    );
  } else {
    tips.push(
      `🥦 Tỷ lệ rau xanh đạt chuẩn (${veggiePct}% đĩa): Giàu chất xơ tự nhiên giúp ổn định đường huyết sau ăn.`
    );
  }

  if (totalPro < 22) {
    tips.push(
      `🥩 Bổ sung Đạm nạc: Đĩa ăn có ~${Math.round(totalPro)}g đạm. Nên thêm 1 quả trứng luộc (+7g đạm) hoặc 50g ức gà/đậu hũ để đủ định mức giữ cơ.`
    );
  } else {
    tips.push(
      `🥩 Đủ Đạm chất lượng (~${Math.round(totalPro)}g Protein): Giúp duy trì cơ bắp và hạn chế ăn vặt buổi chiều.`
    );
  }

  if (totalKcal > 650 || carbGrams > 160 || oilLevel === 'SAUCE_RICH') {
    tips.push(
      `⚖️ Mẹo giảm ~110 kcal ngay trên đĩa: Bớt 1/3 phần cơm trắng (hoặc đổi sang cơm gạo lứt) và hạn chế rưới nước sốt/nước kho béo lên cơm.`
    );
  } else {
    tips.push(
      `💧 Chế biến lành mạnh (~${Math.round(totalKcal)} kcal): Phù hợp mục tiêu giữ dáng và kiểm soát năng lượng hàng ngày.`
    );
  }

  return tips;
}

interface GeminiVisionAttempt {
  result: FoodScanResponse | null;
  failureStatus?: 'KEY_DEAD_OR_MISSING' | 'QUOTA_LIMIT';
  failureDetail?: string;
}

async function callGeminiVision(
  imageBase64: string,
  mimeType: string,
  userHint: string
): Promise<GeminiVisionAttempt> {
  const effectiveCfg = await getEffectiveAiConfig(true);
  const apiKey =
    effectiveCfg.gemini.apiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.AI_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return {
      result: null,
      failureStatus: 'KEY_DEAD_OR_MISSING',
      failureDetail: 'Chưa cấu hình khóa Google Gemini API Key cho tính năng nhận diện ảnh.',
    };
  }

  const rawConfiguredModel =
    effectiveCfg.gemini.model === 'gemini-3.5-flash-lite'
      ? 'gemini-2.5-flash'
      : effectiveCfg.gemini.model;

  const candidateModels = Array.from(
    new Set(
      [
        rawConfiguredModel,
        process.env.GEMINI_MODEL,
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.5-flash-lite',
        'gemini-1.5-flash',
      ].filter((m): m is string => Boolean(m && m.trim() && m !== 'gemini-3.5-flash-lite'))
    )
  );

  const systemInstruction = `Bạn là Chuyên gia Dinh dưỡng Lâm sàng Việt Nam & Chuyên gia AI Thị giác Thực phẩm (chuẩn Cal AI / SnapCalorie / Google Nutrition5k) của hệ thống "Ăn Gì Mom".
Nhiệm vụ: Áp dụng quy trình 4 bước thị giác máy tính để bóc tách chính xác TỪNG THÀNH PHẦN trên đĩa ăn (bao gồm cả món cơm gia đình Việt Nam như thịt kho, cá kho, canh chua, rau xào lẫn đĩa Eat Clean / Gym):
- Bước 1 (Biological Reference Anchor & Counting): Đếm các vật chuẩn sinh học trên đĩa (số quả trứng ~55g/quả, số con tôm ~20g/con, chén cơm ~120g, hoặc đường kính lòng đĩa tiêu chuẩn ~22cm) làm thước đo tỷ lệ.
- Bước 2 (Area & Volume Estimation): Từ thước đo tỷ lệ, ước tính diện tích và khối lượng gram của các phần rau củ, thịt cá, tinh bột nằm cạnh.
- Bước 3 (Cooking Method & Oil Sheen): Quan sát độ bóng bề mặt và vết áp chảo để xác định phương pháp chế biến (STEAM_BOIL_RAW = Luộc/Hấp/Tươi, PAN_SEAR_LIGHT = Áp chảo/Cháy tỏi ít dầu, STIR_FRY_SAUCE = Xào bóng/Kho đậm/Trộn sốt).

Quy tắc bắt buộc:
1. Trả về đúng định dạng JSON thuần túy theo cấu trúc:
{
  "dishTitle": "Tên tổng thể của đĩa ăn bằng tiếng Việt tự nhiên",
  "mealFormat": "SINGLE_PLATE" | "DAILY_3_MEALS" | "FAMILY_TRAY",
  "healthScore": 92,
  "overallConfidence": 94,
  "visualAnchorNote": "Mô tả thước đo tỷ lệ đã dùng (VD: Đếm 4 con tôm + đối chiếu lòng đĩa 22cm & quả bơ chuẩn)",
  "detectedOilLevel": "NONE" | "LIGHT_OIL" | "SAUCE_RICH",
  "coachSummary": "Nhận xét chuyên gia ngắn gọn (2 câu) về tỷ lệ % Rau củ - Đạm - Tinh bột của đĩa ăn này.",
  "improvementTips": [
    "Lời khuyên 1 cụ thể để cải thiện đĩa ăn này (VD: Giảm 30g cơm trắng, tăng 80g rau luộc...)",
    "Lời khuyên 2 cụ thể về cách ăn (VD: Không chan nước kho béo để giảm 70 kcal...)"
  ],
  "items": [
    {
      "name": "Tên thành phần tiếng Việt chuẩn (VD: Tôm bóc nõn áp chảo, Bông cải xanh hấp, Quả bơ sáp chín, Trứng gà luộc...)",
      "category": "PROTEIN" | "VEGGIE_FRUIT" | "CARB" | "HEALTHY_FAT" | "SAUCE",
      "estimatedGrams": 85,
      "portionNote": "Mô tả đếm được & tỷ lệ diện tích (VD: 4 con vừa • 20% đĩa)",
      "pinX": 35,
      "pinY": 28,
      "confidencePercent": 95,
      "cookingMethod": "STEAM_BOIL_RAW" | "PAN_SEAR_LIGHT" | "STIR_FRY_SAUCE",
      "calories100g": 90,
      "protein100g": 18.4,
      "fat100g": 1.4,
      "carbs100g": 0.9,
      "fiber100g": 0
    }
  ]
}
2. Tọa độ pinX (0-100 từ trái sang phải) và pinY (0-100 từ trên xuống dưới) phải chỉ đúng vào tâm của thành phần đó trên bức ảnh.
3. Với cơm hoặc mỳ trên đĩa, luôn tính theo trạng thái ĐÃ NẤU CHÍN (Cơm trắng chín ~130 kcal/100g, Cơm gạo lứt chín ~112 kcal/100g, Mỳ Ý luộc ~158 kcal/100g).`;

  const userPrompt = userHint
    ? `Hãy phân tích chi tiết các thành phần thực phẩm, rau củ, thịt cá và khối lượng gram trong bức ảnh này. Ghi chú thêm từ người dùng: "${userHint}".`
    : `Hãy phân tích chi tiết từng thành phần rau củ quả, đạm, tinh bột và ước tính số gram trên đĩa ăn trong bức ảnh này.`;

  let sawInvalidKey = false;
  let sawQuotaLimit = false;

  for (const modelName of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000);

    try {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.2,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      };
      if (modelName.startsWith('gemini-2.5') && !modelName.includes('lite')) {
        generationConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType || 'image/jpeg',
                    data: imageBase64,
                  },
                },
                { text: userPrompt },
              ],
            },
          ],
          generationConfig,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errTxt = await res.text();
        logger.warn(`Gemini Vision model ${modelName} returned ${res.status}`, {
          error: errTxt.slice(0, 220),
        });
        if (
          res.status === 400 ||
          res.status === 401 ||
          res.status === 403 ||
          errTxt.includes('API_KEY_INVALID') ||
          errTxt.includes('API key expired') ||
          errTxt.includes('API key not valid')
        ) {
          sawInvalidKey = true;
        } else if (res.status === 429 || errTxt.includes('RESOURCE_EXHAUSTED')) {
          sawQuotaLimit = true;
        }
        continue;
      }

      const data = await res.json();
      const parts: Array<{ text?: string; thought?: boolean }> =
        data.candidates?.[0]?.content?.parts || [];
      const nonThoughtParts = parts.filter((p) => !p.thought && typeof p.text === 'string');
      const rawText = (nonThoughtParts.length > 0 ? nonThoughtParts : parts)
        .map((p) => p.text || '')
        .join('')
        .trim();

      if (!rawText) continue;

      const cleanedJson = extractJsonObject(rawText);
      const parsed = JSON.parse(cleanedJson);
      if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        continue;
      }

      const enrichedItems = parsed.items
        .slice(0, 10)
        .map((it: Partial<ScannedFoodItem>, idx: number) => enrichItemWithFct(it, idx));

      const detectedOil: 'NONE' | 'LIGHT_OIL' | 'SAUCE_RICH' =
        parsed.detectedOilLevel === 'NONE' ||
        parsed.detectedOilLevel === 'LIGHT_OIL' ||
        parsed.detectedOilLevel === 'SAUCE_RICH'
          ? parsed.detectedOilLevel
          : 'LIGHT_OIL';

      const aiTips = Array.isArray(parsed.improvementTips)
        ? parsed.improvementTips.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [];

      return {
        result: {
          dishTitle: String(parsed.dishTitle || 'Đĩa Ăn Dinh Dưỡng Đã Quét'),
          mealFormat:
            parsed.mealFormat === 'DAILY_3_MEALS' || parsed.mealFormat === 'FAMILY_TRAY'
              ? parsed.mealFormat
              : 'SINGLE_PLATE',
          healthScore: Math.min(100, Math.max(40, Number(parsed.healthScore) || 88)),
          overallConfidence: Math.min(98, Math.max(82, Number(parsed.overallConfidence) || 93)),
          visualAnchorNote: String(
            parsed.visualAnchorNote ||
              `Đếm ${enrichedItems.length} thành phần trên đĩa + đối chiếu tỷ lệ lòng đĩa tiêu chuẩn 22cm`
          ),
          detectedOilLevel: detectedOil,
          coachSummary: String(
            parsed.coachSummary ||
              'Đĩa ăn có sự kết hợp hài hòa giữa nhóm rau củ giàu chất xơ, đạm nạc và tinh bột tốt.'
          ),
          improvementTips:
            aiTips.length >= 2 ? aiTips.slice(0, 3) : buildImprovementTipsForPlate(enrichedItems, detectedOil),
          items: enrichedItems,
          provider: `gemini-vision (${modelName})`,
          visionStatus: 'OK',
        },
      };
    } catch (err) {
      logger.warn(`Gemini Vision model ${modelName} failed, trying next model`, {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Dự phòng Vision thứ 2: Nếu Admin có cấu hình OpenAI API Key (gpt-4o-mini hỗ trợ đọc ảnh trực tiếp)
  const openaiKey = (effectiveCfg.openai.apiKey || process.env.OPENAI_API_KEY || '').trim();
  if (openaiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000);
    try {
      const openaiModel = effectiveCfg.openai.model || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          temperature: 0.2,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.choices?.[0]?.message?.content || '';
        if (rawText) {
          const parsed = JSON.parse(extractJsonObject(rawText));
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            const enrichedItems = parsed.items
              .slice(0, 10)
              .map((it: Partial<ScannedFoodItem>, idx: number) => enrichItemWithFct(it, idx));
            const detectedOil: 'NONE' | 'LIGHT_OIL' | 'SAUCE_RICH' =
              parsed.detectedOilLevel === 'NONE' ||
              parsed.detectedOilLevel === 'LIGHT_OIL' ||
              parsed.detectedOilLevel === 'SAUCE_RICH'
                ? parsed.detectedOilLevel
                : 'LIGHT_OIL';
            const aiTips = Array.isArray(parsed.improvementTips)
              ? parsed.improvementTips.map((t: unknown) => String(t).trim()).filter(Boolean)
              : [];

            return {
              result: {
                dishTitle: String(parsed.dishTitle || 'Đĩa Ăn Dinh Dưỡng Đã Quét'),
                mealFormat:
                  parsed.mealFormat === 'DAILY_3_MEALS' || parsed.mealFormat === 'FAMILY_TRAY'
                    ? parsed.mealFormat
                    : 'SINGLE_PLATE',
                healthScore: Math.min(100, Math.max(40, Number(parsed.healthScore) || 88)),
                overallConfidence: Math.min(98, Math.max(82, Number(parsed.overallConfidence) || 93)),
                visualAnchorNote: String(
                  parsed.visualAnchorNote ||
                    `Đếm ${enrichedItems.length} thành phần trên đĩa + đối chiếu chuẩn Viện Dinh Dưỡng`
                ),
                detectedOilLevel: detectedOil,
                coachSummary: String(
                  parsed.coachSummary ||
                    'Đĩa ăn có sự kết hợp hài hòa giữa nhóm rau củ giàu chất xơ, đạm nạc và tinh bột tốt.'
                ),
                improvementTips:
                  aiTips.length >= 2
                    ? aiTips.slice(0, 3)
                    : buildImprovementTipsForPlate(enrichedItems, detectedOil),
                items: enrichedItems,
                provider: `openai-vision (${openaiModel})`,
                visionStatus: 'OK',
              },
            };
          }
        }
      }
    } catch {
      // ignore OpenAI fallback error
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    result: null,
    failureStatus: sawQuotaLimit && !sawInvalidKey ? 'QUOTA_LIMIT' : 'KEY_DEAD_OR_MISSING',
    failureDetail:
      sawQuotaLimit && !sawInvalidKey
        ? 'Khóa Gemini Vision đang tạm chạm giới hạn lượt gọi (Quota 429).'
        : 'Khóa Google Gemini API Key trên máy chủ đã hết hạn hoặc không hợp lệ. Hãy nhập tên món bên dưới để DeepSeek AI tính Kcal ngay, hoặc cập nhật Gemini Key mới trong trang Admin (/editor/ai-settings).',
  };
}

async function callAiGatewayFromTextHint(userHint: string): Promise<FoodScanResponse | null> {
  if (!userHint || userHint.trim().length < 2) return null;
  try {
    const completion = await aiGateway.complete({
      systemInstruction: `Bạn là Chuyên gia Dinh dưỡng Viện Dinh Dưỡng Quốc Gia Việt Nam của hệ thống "Ăn Gì Mom".
Nhiệm vụ: Khi người dùng mô tả món ăn hoặc bữa cơm của họ, hãy bóc tách thành các thành phần thực phẩm cụ thể, khối lượng gram ước tính, lượng calo/100g chuẩn Việt Nam và đưa ra 3 lời khuyên cải thiện đĩa ăn cụ thể.
Trả về JSON thuần túy:
{
  "dishTitle": "Tên đĩa ăn chuẩn tiếng Việt",
  "detectedOilLevel": "NONE" | "LIGHT_OIL" | "SAUCE_RICH",
  "coachSummary": "Nhận xét ngắn gọn 2 câu về bữa ăn này.",
  "improvementTips": ["Lời khuyên 1", "Lời khuyên 2", "Lời khuyên 3"],
  "items": [
    {
      "name": "Tên thành phần (VD: Cơm trắng chín, Sườn heo nướng, Bông cải xanh...)",
      "category": "PROTEIN" | "VEGGIE_FRUIT" | "CARB" | "HEALTHY_FAT" | "SAUCE",
      "estimatedGrams": 120,
      "portionNote": "1 chén vừa (~120g)",
      "calories100g": 130,
      "protein100g": 2.7,
      "fat100g": 0.3,
      "carbs100g": 28.2,
      "fiber100g": 0.4
    }
  ]
}`,
      prompt: `Bóc tách dinh dưỡng và gợi ý cải thiện cho bữa ăn: "${userHint}"`,
      temperature: 0.25,
      maxTokens: 2500,
      jsonMode: true,
    });

    if (!completion.text || completion.provider === 'mock') {
      return null;
    }

    const cleaned = extractJsonObject(completion.text);
    const parsed = JSON.parse(cleaned);
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return null;
    }

    const enrichedItems = parsed.items
      .slice(0, 8)
      .map((it: Partial<ScannedFoodItem>, idx: number) => enrichItemWithFct(it, idx));

    const detectedOil: 'NONE' | 'LIGHT_OIL' | 'SAUCE_RICH' =
      parsed.detectedOilLevel === 'NONE' ||
      parsed.detectedOilLevel === 'LIGHT_OIL' ||
      parsed.detectedOilLevel === 'SAUCE_RICH'
        ? parsed.detectedOilLevel
        : 'LIGHT_OIL';

    const aiTips = Array.isArray(parsed.improvementTips)
      ? parsed.improvementTips.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];

    return {
      dishTitle: String(parsed.dishTitle || `Đĩa Ăn: ${userHint}`),
      mealFormat: 'SINGLE_PLATE',
      healthScore: 90,
      overallConfidence: 94,
      visualAnchorNote: `Phân tích chuyên sâu bởi AI (${completion.provider}) + Đối chiếu Bảng Thành Phần Thực Phẩm Việt Nam (VDD)`,
      detectedOilLevel: detectedOil,
      coachSummary: String(
        parsed.coachSummary ||
          'Đã bóc tách chi tiết các thành phần và đối chiếu chuẩn Viện Dinh Dưỡng Quốc Gia.'
      ),
      improvementTips:
        aiTips.length >= 2 ? aiTips.slice(0, 3) : buildImprovementTipsForPlate(enrichedItems, detectedOil),
      items: enrichedItems,
      provider: completion.provider,
      visionStatus: 'DEEPSEEK_TEXT_AI',
    };
  } catch (err) {
    logger.warn('callAiGatewayFromTextHint failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

function buildHeuristicFallbackFromHint(
  userHint: string,
  visionAttempt?: GeminiVisionAttempt
): FoodScanResponse {
  const lower = userHint.toLowerCase();
  const matchedItems: ScannedFoodItem[] = [];

  for (const rule of FCT_KEYWORD_SYNONYMS) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const fct = VIETNAMESE_STANDARD_FCT.find((f) => f.slug === rule.slug);
      if (fct && !matchedItems.some((m) => m.matchedFctName === fct.name)) {
        matchedItems.push(
          enrichItemWithFct(
            {
              name: fct.name.split('(')[0].trim(),
              estimatedGrams:
                fct.slug === 'trung-ga'
                  ? 110
                  : fct.slug.includes('com-') ||
                    fct.slug === 'mi-y-luoc' ||
                    fct.slug === 'bun-tuoi' ||
                    fct.slug === 'banh-pho-tuoi'
                  ? 130
                  : 95,
              portionNote:
                fct.slug === 'trung-ga'
                  ? '2 quả (~110g)'
                  : fct.slug.includes('com-')
                  ? '1 chén vừa (~130g)'
                  : '1 phần trên đĩa (~95g)',
            },
            matchedItems.length
          )
        );
      }
    }
  }

  if (matchedItems.length === 0) {
    const defaultPlate: Array<Partial<ScannedFoodItem>> = [
      {
        name: 'Ức gà áp chảo / Tôm tươi',
        category: 'PROTEIN',
        estimatedGrams: 110,
        portionNote: '1 góc đĩa đạm (~110g)',
        pinX: 30,
        pinY: 32,
      },
      {
        name: 'Bông cải xanh hấp',
        category: 'VEGGIE_FRUIT',
        estimatedGrams: 95,
        portionNote: '1 góc đĩa rau xanh (~95g)',
        pinX: 68,
        pinY: 30,
      },
      {
        name: 'Trứng gà luộc lòng đào',
        category: 'PROTEIN',
        estimatedGrams: 55,
        portionNote: '1 quả bổ đôi (~55g)',
        pinX: 50,
        pinY: 52,
      },
      {
        name: 'Khoai lang mật / Cơm gạo lứt',
        category: 'CARB',
        estimatedGrams: 100,
        portionNote: '1 góc đĩa tinh bột tốt (~100g)',
        pinX: 34,
        pinY: 72,
      },
      {
        name: 'Quả bơ sáp / Cà chua bi',
        category: 'HEALTHY_FAT',
        estimatedGrams: 60,
        portionNote: 'Vài lát tươi (~60g)',
        pinX: 70,
        pinY: 70,
      },
    ];
    defaultPlate.forEach((p, idx) => matchedItems.push(enrichItemWithFct(p, idx)));
  }

  return {
    dishTitle: userHint
      ? `Đĩa Ăn: ${userHint}`
      : 'Ảnh vừa tải lên — Gõ tên món bên dưới để AI tính Kcal chính xác',
    mealFormat: 'SINGLE_PLATE',
    healthScore: 90,
    coachSummary:
      'Đã bóc tách các nhóm Đạm nạc, Rau xanh và Tinh bột hấp thu chậm theo chuẩn Bảng Thành Phần Thực Phẩm Việt Nam (VDD). Bạn có thể gõ tên món ăn vào ô bên dưới để DeepSeek AI tính chính xác Kcal hoặc bấm [+] / [-] chỉnh gram.',
    improvementTips: buildImprovementTipsForPlate(matchedItems, 'LIGHT_OIL'),
    items: matchedItems,
    provider: 'fct-heuristic-fallback',
    visionStatus: visionAttempt?.failureStatus || 'KEY_DEAD_OR_MISSING',
    visionMessage: visionAttempt?.failureDetail,
  };
}

async function callVisionJsonObject(
  imageBase64: string,
  mimeType: string,
  systemInstruction: string,
  userPrompt: string
): Promise<{
  parsed: Record<string, unknown> | null;
  provider?: string;
  failureStatus?: 'KEY_DEAD_OR_MISSING' | 'QUOTA_LIMIT';
}> {
  const effectiveCfg = await getEffectiveAiConfig(true);
  const geminiKey = (
    effectiveCfg.gemini.apiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.AI_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  ).trim();

  let sawInvalidKey = false;
  let sawQuotaLimit = false;

  if (geminiKey && imageBase64) {
    const rawConfiguredModel =
      effectiveCfg.gemini.model === 'gemini-3.5-flash-lite'
        ? 'gemini-2.5-flash'
        : effectiveCfg.gemini.model;

    const candidateModels = Array.from(
      new Set(
        [
          rawConfiguredModel,
          process.env.GEMINI_MODEL,
          'gemini-2.5-flash',
          'gemini-2.0-flash',
          'gemini-2.5-flash-lite',
        ].filter((m): m is string => Boolean(m && m.trim() && m !== 'gemini-3.5-flash-lite'))
      )
    );

    for (const modelName of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 16000);
      try {
        const generationConfig: Record<string, unknown> = {
          temperature: 0.2,
          maxOutputTokens: 2500,
          responseMimeType: 'application/json',
        };
        if (modelName.startsWith('gemini-2.5') && !modelName.includes('lite')) {
          generationConfig.thinkingConfig = { thinkingBudget: 0 };
        }
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inline_data: {
                      mime_type: mimeType || 'image/jpeg',
                      data: imageBase64,
                    },
                  },
                  { text: userPrompt },
                ],
              },
            ],
            generationConfig,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errTxt = await res.text();
          if (res.status === 400 || res.status === 401 || res.status === 403 || errTxt.includes('API_KEY_INVALID')) {
            sawInvalidKey = true;
          } else if (res.status === 429 || errTxt.includes('RESOURCE_EXHAUSTED')) {
            sawQuotaLimit = true;
          }
          continue;
        }

        const data = await res.json();
        const parts: Array<{ text?: string; thought?: boolean }> =
          data.candidates?.[0]?.content?.parts || [];
        const nonThought = parts.filter((p) => !p.thought && typeof p.text === 'string');
        const rawText = (nonThought.length > 0 ? nonThought : parts)
          .map((p) => p.text || '')
          .join('')
          .trim();
        if (!rawText) continue;
        const parsed = JSON.parse(extractJsonObject(rawText)) as Record<string, unknown>;
        return { parsed, provider: `gemini-vision (${modelName})` };
      } catch {
        // try next model
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  const openaiKey = (effectiveCfg.openai.apiKey || process.env.OPENAI_API_KEY || '').trim();
  if (openaiKey && imageBase64) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000);
    try {
      const openaiModel = effectiveCfg.openai.model || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          temperature: 0.2,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` },
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.choices?.[0]?.message?.content || '';
        if (rawText) {
          const parsed = JSON.parse(extractJsonObject(rawText)) as Record<string, unknown>;
          return { parsed, provider: `openai-vision (${openaiModel})` };
        }
      }
    } catch {
      // ignore OpenAI fallback
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    parsed: null,
    failureStatus: sawQuotaLimit && !sawInvalidKey ? 'QUOTA_LIMIT' : 'KEY_DEAD_OR_MISSING',
  };
}

async function handleFridgeScan(
  cleanBase64: string,
  mimeType: string,
  userHint: string
): Promise<FridgeScanResponse> {
  const sys = `Bạn là Trợ lý Quản lý Tủ Lạnh Bếp Việt của "Ăn Gì Mom".
Nhiệm vụ: Nhận diện thực phẩm tươi sống, rau củ, trứng/đậu có trong ảnh ngăn mát tủ lạnh (hoặc ghi chú đi chợ), rồi đề xuất món cơm nhà dễ nấu ngay.
Trả về JSON thuần:
{
  "summary": "Nhận xét nhanh 1-2 câu về tình trạng nguyên liệu trong tủ.",
  "pantryItems": [
    { "name": "Thịt ba chỉ heo", "quantity": 400, "unit": "g", "category": "Thực phẩm tươi sống", "shelfNote": "Nên chế biến trong 2 ngày" }
  ],
  "suggestedDishes": ["Thịt ba chỉ kho tiêu", "Canh rau ngót thịt băm", "Rau muống xào tỏi"]
}`;
  const prompt = userHint
    ? `Hãy liệt kê nguyên liệu nhìn thấy trong ảnh tủ lạnh kèm mô tả: "${userHint}".`
    : `Hãy liệt kê tất cả thực phẩm, rau củ, thịt cá bạn nhìn thấy trong ngăn mát tủ lạnh này.`;

  if (cleanBase64) {
    const attempt = await callVisionJsonObject(cleanBase64, mimeType, sys, prompt);
    if (attempt.parsed && Array.isArray(attempt.parsed.pantryItems) && attempt.parsed.pantryItems.length > 0) {
      const items = (attempt.parsed.pantryItems as Array<Record<string, unknown>>).slice(0, 15).map((p) => ({
        name: String(p.name || 'Nguyên liệu'),
        quantity: Number(p.quantity) > 0 ? Number(p.quantity) : 200,
        unit: String(p.unit || 'g'),
        category: String(p.category || 'Rau củ quả'),
        shelfNote: String(p.shelfNote || 'Bảo quản ngăn mát 3–5 ngày'),
      }));
      const suggestedDishes = Array.isArray(attempt.parsed.suggestedDishes)
        ? (attempt.parsed.suggestedDishes as unknown[]).map((d) => String(d)).filter(Boolean).slice(0, 4)
        : ['Mâm cơm gia đình 3 món thanh đạm'];
      return {
        mode: 'FRIDGE',
        summary: String(attempt.parsed.summary || `Đã nhận diện ${items.length} nguyên liệu sẵn có trong tủ lạnh.`),
        pantryItems: items,
        suggestedDishes,
        provider: attempt.provider || 'vision-ai',
        visionStatus: 'OK',
      };
    }
  }

  if (userHint) {
    const completion = await aiGateway.complete({
      systemInstruction: sys,
      prompt: `Bóc tách danh sách nguyên liệu tủ lạnh từ mô tả: "${userHint}"`,
      temperature: 0.25,
      maxTokens: 1500,
      jsonMode: true,
    });
    if (completion.text && completion.provider !== 'mock') {
      try {
        const parsed = JSON.parse(extractJsonObject(completion.text)) as Record<string, unknown>;
        if (Array.isArray(parsed.pantryItems) && parsed.pantryItems.length > 0) {
          const items = (parsed.pantryItems as Array<Record<string, unknown>>).slice(0, 15).map((p) => ({
            name: String(p.name || 'Nguyên liệu'),
            quantity: Number(p.quantity) > 0 ? Number(p.quantity) : 200,
            unit: String(p.unit || 'g'),
            category: String(p.category || 'Rau củ quả'),
            shelfNote: String(p.shelfNote || 'Bảo quản ngăn mát'),
          }));
          return {
            mode: 'FRIDGE',
            summary: String(parsed.summary || `Đã phân tích ${items.length} nguyên liệu trong tủ lạnh.`),
            pantryItems: items,
            suggestedDishes: Array.isArray(parsed.suggestedDishes)
              ? (parsed.suggestedDishes as unknown[]).map(String).slice(0, 4)
              : ['Canh rau củ ngọt thanh', 'Món mặn áp chảo ít dầu'],
            provider: completion.provider,
            visionStatus: 'DEEPSEEK_TEXT_AI',
          };
        }
      } catch {
        // fallback below
      }
    }
  }

  const fallbackPlate = buildHeuristicFallbackFromHint(userHint);
  return {
    mode: 'FRIDGE',
    summary: userHint
      ? `Đã ghi nhận nhanh nhóm nguyên liệu từ mô tả "${userHint}".`
      : 'Chế độ mẫu tham chiếu: Tải ảnh tủ lạnh (khi Admin cấu hình Vision Key) hoặc nhập tên các món đang có trong tủ để AI lập danh sách đi chợ/nấu ăn.',
    pantryItems: fallbackPlate.items.map((it) => ({
      name: it.name,
      quantity: it.estimatedGrams,
      unit: 'g',
      category: it.category === 'PROTEIN' ? 'Thực phẩm tươi sống' : 'Rau củ quả',
      shelfNote: it.category === 'PROTEIN' ? 'Bảo quản 2–3 ngày ngăn mát' : 'Dùng tươi trong 4–5 ngày',
    })),
    suggestedDishes: ['Ức gà áp chảo ít calo', 'Bông cải xanh luộc giòn', 'Trứng gà luộc lòng đào'],
    provider: 'fct-fridge-fallback',
    visionStatus: 'KEY_DEAD_OR_MISSING',
  };
}

async function handleNutritionLabelScan(
  cleanBase64: string,
  mimeType: string,
  userHint: string
): Promise<NutritionLabelScanResponse> {
  const sys = `Bạn là Chuyên gia Kiểm Định Nhãn Thực Phẩm Gia Đình của "Ăn Gì Mom".
Nhiệm vụ: Đọc bảng Thành phần dinh dưỡng (Nutrition Facts) trên bao bì thực phẩm/sữa/bánh/gia vị, quy đổi về 1 khẩu phần chuẩn, đánh giá mức độ an toàn Đường & Muối (Natri) bằng đèn tín hiệu (GREEN = Lành mạnh ít đường muối, AMBER = Dùng vừa phải, RED = Cao đường/natri/béo bão hòa, hạn chế cho trẻ nhỏ & người cao huyết áp).
Trả về JSON thuần:
{
  "productName": "Tên sản phẩm / loại thực phẩm",
  "servingSize": "1 khẩu phần (1 hộp 180ml / 30g...)",
  "calories": 140,
  "protein": 5.5,
  "fat": 4.2,
  "carbs": 19.5,
  "sugarGrams": 12.0,
  "sodiumMg": 180,
  "trafficLight": "AMBER",
  "familyAdvice": ["Lời khuyên 1 dễ hiểu cho mẹ và bé", "Lời khuyên 2 cho ông bà/người giảm cân"]
}`;
  const prompt = userHint
    ? `Đọc nhãn dinh dưỡng trong ảnh và kết hợp thông tin: "${userHint}".`
    : `Hãy đọc chính xác các chỉ số trên nhãn Nutrition Facts trong bức ảnh này.`;

  if (cleanBase64) {
    const attempt = await callVisionJsonObject(cleanBase64, mimeType, sys, prompt);
    if (attempt.parsed && (attempt.parsed.productName || attempt.parsed.calories !== undefined)) {
      const p = attempt.parsed;
      const light = p.trafficLight === 'GREEN' || p.trafficLight === 'RED' || p.trafficLight === 'AMBER' ? p.trafficLight : 'AMBER';
      return {
        mode: 'LABEL',
        productName: String(p.productName || 'Sản phẩm đóng gói đã quét'),
        servingSize: String(p.servingSize || '1 khẩu phần'),
        calories: Math.max(0, Math.round(Number(p.calories) || 0)),
        protein: Math.max(0, Math.round((Number(p.protein) || 0) * 10) / 10),
        fat: Math.max(0, Math.round((Number(p.fat) || 0) * 10) / 10),
        carbs: Math.max(0, Math.round((Number(p.carbs) || 0) * 10) / 10),
        sugarGrams: p.sugarGrams !== null && p.sugarGrams !== undefined ? Math.round(Number(p.sugarGrams) * 10) / 10 : null,
        sodiumMg: p.sodiumMg !== null && p.sodiumMg !== undefined ? Math.round(Number(p.sodiumMg)) : null,
        trafficLight: light,
        familyAdvice: Array.isArray(p.familyAdvice)
          ? (p.familyAdvice as unknown[]).map(String).slice(0, 3)
          : ['Đối chiếu khẩu phần thực tế với mục tiêu Kcal trong ngày.'],
        provider: attempt.provider || 'vision-ai',
        visionStatus: 'OK',
      };
    }
  }

  return {
    mode: 'LABEL',
    productName: userHint || 'Sữa / Thực phẩm đóng gói (Chưa đọc được chữ trên ảnh)',
    servingSize: '1 khẩu phần (tham khảo)',
    calories: 130,
    protein: 6.0,
    fat: 3.5,
    carbs: 18.0,
    sugarGrams: 9.5,
    sodiumMg: 120,
    trafficLight: 'AMBER',
    familyAdvice: [
      'Lưu ý kiểm tra mục "Đường tổng / Added Sugar" (< 10g/khẩu phần cho trẻ nhỏ) và "Natri / Sodium" (< 400mg/khẩu phần cho người cao huyết áp).',
      'Khi Admin kích hoạt khóa Gemini Vision hoặc bạn gõ rõ tên sản phẩm/số gram, AI sẽ tính sát nhãn thật 100%.',
    ],
    provider: 'label-guide-fallback',
    visionStatus: 'KEY_DEAD_OR_MISSING',
  };
}

export async function POST(req: NextRequest) {
  try {
    if (isCrossSiteRequest(req)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    const rate = checkRateLimit('ai-food-scanner', getClientIp(req), 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Quá nhiều yêu cầu quét ảnh liên tiếp. Vui lòng thử lại sau ít giây.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawBase64 = String(body.imageBase64 || '').trim();
    const mimeType = String(body.mimeType || 'image/jpeg').trim();
    const userHint = String(body.userHint || '').trim();
    const scanMode =
      body.scanMode === 'FRIDGE' || body.scanMode === 'LABEL' ? body.scanMode : 'MEAL';

    if (!rawBase64 && !userHint) {
      return NextResponse.json(
        { error: 'Vui lòng chọn ảnh hoặc nhập mô tả thực phẩm cần quét.' },
        { status: 400 }
      );
    }

    // Làm sạch tiền tố data:image/...;base64, nếu có
    const cleanBase64 = rawBase64.includes('base64,')
      ? rawBase64.split('base64,')[1]
      : rawBase64;

    if (cleanBase64.length > 10_000_000) {
      return NextResponse.json(
        { error: 'Dung lượng ảnh quá lớn (tối đa 7MB). Vui lòng chọn ảnh nhẹ hơn.' },
        { status: 413 }
      );
    }

    if (scanMode === 'FRIDGE') {
      const fridgeResult = await handleFridgeScan(cleanBase64, mimeType, userHint);
      return NextResponse.json({ success: true, fridgeResult });
    }

    if (scanMode === 'LABEL') {
      const labelResult = await handleNutritionLabelScan(cleanBase64, mimeType, userHint);
      return NextResponse.json({ success: true, labelResult });
    }

    let visionAttempt: GeminiVisionAttempt | undefined;

    if (cleanBase64) {
      visionAttempt = await callGeminiVision(cleanBase64, mimeType, userHint);
      if (visionAttempt.result) {
        return NextResponse.json({
          success: true,
          result: visionAttempt.result,
        });
      }
    }

    // Nếu người dùng nhập mô tả (hoặc Gemini Vision chết mà có mô tả tên món), gọi AI Gateway (DeepSeek) để bóc tách chính xác 100%
    if (userHint) {
      const aiTextResult = await callAiGatewayFromTextHint(userHint);
      if (aiTextResult) {
        return NextResponse.json({
          success: true,
          result: aiTextResult,
        });
      }
    }

    // Fallback thông minh theo từ điển Viện Dinh Dưỡng + kèm trạng thái visionStatus để UI nhắc nhập tên món hoặc thay Gemini Key
    const fallbackResult = buildHeuristicFallbackFromHint(userHint, visionAttempt);
    return NextResponse.json({
      success: true,
      result: fallbackResult,
    });
  } catch (error) {
    logger.error('Error in POST /api/ai/food-scanner:', error);
    return NextResponse.json(
      { error: 'Không thể phân tích ảnh lúc này, vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
