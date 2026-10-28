// Bộ Thu Thập & Chuẩn Hóa Món Ngon Mỗi Ngày (Daily Curated Recipe Harvester — Phương án 3)
// Kết nối danh sách các chuyên trang ẩm thực Cơm Nhà Việt Nam & Sức Khỏe uy tín,
// kiểm định qua 4 chốt "Đúng Thực Phẩm & Đúng Định Lượng", tự động tính Calo FCT & Giá Bách Hóa Xanh.
// Hỗ trợ 2 chế độ linh hoạt (Phương án 3):
// 1. REVIEW_QUEUE: Đưa vào Hàng chờ duyệt (/editor/recipes/review - SUBMITTED) để Admin duyệt 1 chạm.
// 2. AUTO_PUBLISH_IF_QUALIFIED: Tự động xuất bản (PUBLISHED) ngay khi đạt 100% chuẩn 4 chốt Quality Gate.

import { db } from '@/lib/db';
import {
  recipes,
  dishes,
  recipeIngredients,
  cookingSteps,
  taxonomies,
  recipeTags,
  users,
} from '@/lib/db/schema';
import { eq, inArray, desc, sql } from 'drizzle-orm';
import { generateRecipeDraft, type AiRecipeDraftPayload } from './recipeDraftGenerator';
import { calculateRecipeNutrition } from '@/lib/nutrition/calculator';
import { VIETNAMESE_RETAIL_PRICE_DICTIONARY, calculateRecipeRealCost } from '@/lib/recipes/priceDictionary';
import { VIETNAMESE_STANDARD_FCT } from '@/lib/nutrition/seedData';
import { logger } from '@/lib/logger';

export type HarvestPublishMode = 'REVIEW_QUEUE' | 'AUTO_PUBLISH_IF_QUALIFIED';

export interface CuratedRecipeSource {
  id: string;
  name: string;
  domain: string;
  url: string;
  category: 'VIETNAMESE_HOME_COOKING' | 'HEALTHY_FITNESS';
  regionFocus: string;
  strengths: string;
  defaultStyleNotes: string;
  curatedDishes: Array<{
    title: string;
    role: 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL';
    region: string;
  }>;
}

/**
 * Danh mục 12 Kênh Ẩm Thực Chất Lượng Cao (8 Kênh Cơm Nhà Việt Nam + 4 Kênh Eat Clean / Tập Gym)
 */
export const CURATED_RECIPE_SOURCES: CuratedRecipeSource[] = [
  // ============================================================================
  // NHÓM 1: 8 KÊNH CƠM NHÀ VIỆT NAM CHẤT LƯỢNG CAO NHẤT
  // ============================================================================
  {
    id: 'mon-ngon-moi-ngay',
    name: 'Món Ngon Mỗi Ngày (Ajinomoto VN)',
    domain: 'monngonmoingay.com',
    url: 'https://monngonmoingay.com/tim-kiem-mon-ngon/',
    category: 'VIETNAMESE_HOME_COOKING',
    regionFocus: 'Ba miền Bắc – Trung – Nam',
    strengths: 'Chuẩn định lượng khẩu phần 4 người, nguyên liệu dễ mua, có mẹo sơ chế của đầu bếp chuyên nghiệp.',
    defaultStyleNotes: 'Chuẩn cơm nhà Món Ngon Mỗi Ngày, định lượng rõ ràng cho 4 người, hương vị hài hòa.',
    curatedDishes: [
      { title: 'Thịt ba chỉ kho măng tươi đậm đà', role: 'MAIN', region: 'Miền Bắc' },
      { title: 'Canh sườn non nấu sấu chua thanh', role: 'SOUP', region: 'Miền Bắc' },
      { title: 'Đậu hũ non sốt thịt bằm nấm đông cô', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Cá diêu hồng chưng tương gừng hành', role: 'MAIN', region: 'Miền Nam' },
      { title: 'Canh rau ngót nấu tôm tươi ngọt mát', role: 'SOUP', region: 'Toàn quốc' },
      { title: 'Bông thiên lý xào thịt bò tỏi thơm', role: 'SIDE', region: 'Miền Nam' },
      { title: 'Gà ta kho gừng nghệ ấm bụng ngày mưa', role: 'MAIN', region: 'Miền Trung' },
      { title: 'Canh bầu nấu nghêu tươi thanh ngọt', role: 'SOUP', region: 'Toàn quốc' },
    ],
  },
  {
    id: 'huong-nghiep-a-au',
    name: 'Hướng Nghiệp Á Âu & Bếp Trưởng',
    domain: 'huongnghiepaau.com',
    url: 'https://www.huongnghiepaau.com/cong-thuc',
    category: 'VIETNAMESE_HOME_COOKING',
    regionFocus: 'Chuẩn trường đào tạo đầu bếp Việt',
    strengths: 'Định lượng bằng gam/ml cực kỳ chuẩn xác, kỹ thuật khử mùi tanh và canh độ lửa bài bản.',
    defaultStyleNotes: 'Chuẩn kỹ thuật đầu bếp Hướng Nghiệp Á Âu, sơ chế khử mùi kỹ, tỷ lệ gia vị chính xác.',
    curatedDishes: [
      { title: 'Cábasa kho tộ tiêu xanh miền Tây', role: 'MAIN', region: 'Miền Nam' },
      { title: 'Sườn non kho thơm (dứa) chua ngọt mềm rục', role: 'MAIN', region: 'Miền Nam' },
      { title: 'Canh gà lá giang chua thanh giải nhiệt', role: 'SOUP', region: 'Miền Nam' },
      { title: 'Mực ống xào cần tỏi hành tây giòn ngọt', role: 'SIDE', region: 'Toàn quốc' },
      { title: 'Thịt chân giò giả cầy riềng mẻ mắm tôm', role: 'MAIN', region: 'Miền Bắc' },
      { title: 'Canh chua cá lóc bông súng miền Tây', role: 'SOUP', region: 'Miền Nam' },
    ],
  },
  {
    id: 'dien-may-xanh-vao-bep',
    name: 'Điện Máy Xanh — Vào Bếp',
    domain: 'dienmayxanh.com',
    url: 'https://www.dienmayxanh.com/vao-bep',
    category: 'VIETNAMESE_HOME_COOKING',
    regionFocus: 'Toàn quốc',
    strengths: 'Kho công thức gia đình lớn nhất Việt Nam, phân loại rõ món kho, canh, xào, nồi chiên không dầu.',
    defaultStyleNotes: 'Thực tế, dễ làm tại bếp gia đình, nguyên liệu sẵn có ở chợ và siêu thị.',
    curatedDishes: [
      { title: 'Cánh gà chiên nước mắm tỏi ớt giòn rụm', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Canh bí đỏ nấu thịt bằm lạc tiên bùi ngọt', role: 'SOUP', region: 'Toàn quốc' },
      { title: 'Rau muống xào tỏi xanh giòn chuẩn vị', role: 'SIDE', region: 'Toàn quốc' },
      { title: 'Thịt heo quay giòn bì bằng nồi chiên không dầu', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Cá nục kho cà chua biển miền Trung', role: 'MAIN', region: 'Miền Trung' },
      { title: 'Canh mướp đắng (khổ qua) nhồi thịt thanh mát', role: 'SOUP', region: 'Toàn quốc' },
    ],
  },
  {
    id: 'bach-hoa-xanh-hom-nay-an-gi',
    name: 'Bách Hóa Xanh — Hôm Nay Ăn Gì',
    domain: 'bachhoaxanh.com',
    url: 'https://www.bachhoaxanh.com/kinh-nghiem-hay/hom-nay-an-gi',
    category: 'VIETNAMESE_HOME_COOKING',
    regionFocus: 'Miền Nam & Toàn quốc',
    strengths: 'Nguyên liệu khớp 100% với giỏ hàng siêu thị Bách Hóa Xanh, tối ưu chi phí đi chợ hàng ngày.',
    defaultStyleNotes: 'Nguyên liệu phổ thông dễ mua tại Bách Hóa Xanh, tiết kiệm thời gian sơ chế.',
    curatedDishes: [
      { title: 'Tôm rim thịt ba chỉ mặn ngọt hao cơm', role: 'MAIN', region: 'Miền Nam' },
      { title: 'Canh cải bẹ xanh nấu cá thác lác tươi', role: 'SOUP', region: 'Miền Nam' },
      { title: 'Đậu bắp luộc chấm chao & kho quẹt', role: 'SIDE', region: 'Miền Nam' },
      { title: 'Trứng cút sốt chua ngọt cà chua đậm đà', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Canh khoai mỡ nấu tôm tươi tím dẻo', role: 'SOUP', region: 'Miền Nam' },
      { title: 'Nấm đùi gà xào dầu hào hành lá thanh đạm', role: 'SIDE', region: 'Toàn quốc' },
    ],
  },
  {
    id: 'esheep-savoury-days',
    name: 'Esheep Kitchen & Savoury Days',
    domain: 'esheepkitchen.com',
    url: 'https://www.esheepkitchen.com/',
    category: 'VIETNAMESE_HOME_COOKING',
    regionFocus: 'Ẩm thực tinh tế & Khoa học nấu ăn',
    strengths: 'Giải thích cặn kẽ tỷ lệ vàng khi ướp thịt, làm nước sốt và mẹo giữ độ mọng ngọt của thực phẩm.',
    defaultStyleNotes: 'Tỷ lệ nước sốt cân bằng hoàn hảo, chú trọng mẹo giữ độ mềm mọng của nguyên liệu.',
    curatedDishes: [
      { title: 'Sườn cốt lết rim mật ong tỏi thơm mềm mọng', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Bò lúc lắc khoai tây bơ tỏi mềm tan', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Canh sườn hầm củ sen táo đỏ thanh ngọt', role: 'SOUP', region: 'Toàn quốc' },
      { title: 'Cải thìa sốt nấm đông cô dầu hào bóng mượt', role: 'SIDE', region: 'Toàn quốc' },
    ],
  },
  {
    id: 'vnexpress-cooking',
    name: 'VnExpress — Thực Đơn Gia Đình',
    domain: 'vnexpress.net',
    url: 'https://vnexpress.net/doi-song/cooking',
    category: 'VIETNAMESE_HOME_COOKING',
    regionFocus: 'Bắc – Trung – Nam theo mùa',
    strengths: 'Được biên tập kỹ lưỡng, tôn vinh hương vị truyền thống Hà Nội, Huế, Sài Gòn.',
    defaultStyleNotes: 'Chuẩn vị truyền thống gia đình Việt, trình bày lịch sự, dễ nấu.',
    curatedDishes: [
      { title: 'Chả cá Lã Vọng thì là hành hoa chuẩn vị Hà Nội', role: 'MAIN', region: 'Miền Bắc' },
      { title: 'Thịt ba chỉ rang cháy cạnh hành mắm truyền thống', role: 'MAIN', region: 'Miền Bắc' },
      { title: 'Canh cua đồng nấu rau đay mồng tơi mướp hương', role: 'SOUP', region: 'Miền Bắc' },
      { title: 'Su su xào lòng mề gà giòn ngọt', role: 'SIDE', region: 'Miền Bắc' },
    ],
  },
  {
    id: 'bep-eva-afamily',
    name: 'Bếp Eva & Afamily Ăn Ngon',
    domain: 'eva.vn',
    url: 'https://eva.vn/bep-eva-c162.html',
    category: 'VIETNAMESE_HOME_COOKING',
    regionFocus: 'Mâm cơm tiết kiệm hàng ngày',
    strengths: 'Chuyên các món cơm nhà nhanh gọn dưới 30 phút, chi phí hợp túi tiền nội trợ.',
    defaultStyleNotes: 'Nhanh gọn dưới 30 phút, tiết kiệm chi phí, hợp khẩu vị cả người lớn và trẻ nhỏ.',
    curatedDishes: [
      { title: 'Trứng đúc thịt băm mộc nhĩ thơm mềm cho bé', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Cá rô đồng kho tộ gừng sả thơm lừng', role: 'MAIN', region: 'Miền Bắc' },
      { title: 'Canh rau dền nấu thịt băm ngọt mát', role: 'SOUP', region: 'Toàn quốc' },
      { title: 'Bắp cải xào cà chua hành lá nhanh gọn', role: 'SIDE', region: 'Toàn quốc' },
    ],
  },
  {
    id: 'cookpad-vn-top',
    name: 'Cookpad Vietnam — Món Nhiều Cooksnap',
    domain: 'cookpad.com',
    url: 'https://cookpad.com/vn',
    category: 'VIETNAMESE_HOME_COOKING',
    regionFocus: 'Cộng đồng bếp nhà 3 miền',
    strengths: 'Những công thức được hàng trăm bà nội trợ nấu thử và gửi ảnh thành phẩm (Cooksnap) nhiều nhất.',
    defaultStyleNotes: 'Công thức thực chiến đã được nhiều gia đình nấu thử thành công.',
    curatedDishes: [
      { title: 'Thịt bò xào bông cải xanh sốt dầu hào tỏi', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Đậu phụ nhồi thịt sốt cà chua đậm đà', role: 'MAIN', region: 'Miền Bắc' },
      { title: 'Canh kim chi đậu hũ non thịt ba chỉ ấm nóng', role: 'SOUP', region: 'Toàn quốc' },
      { title: 'Dưa leo trộn tai heo chua ngọt giòn sần sật', role: 'SIDE', region: 'Toàn quốc' },
    ],
  },

  // ============================================================================
  // NHÓM 2: 4 KÊNH EAT CLEAN · GIẢM CÂN · TẬP GYM (VIỆT HÓA NGUYÊN LIỆU)
  // ============================================================================
  {
    id: 'bbc-good-food-healthy',
    name: 'BBC Good Food — Healthy & Low-Cal',
    domain: 'bbcgoodfood.com',
    url: 'https://www.bbcgoodfood.com/recipes/collection/healthy-recipes-for-weight-loss',
    category: 'HEALTHY_FITNESS',
    regionFocus: 'Eat Clean · Ít Calo (<400 kcal)',
    strengths: 'Kiểm soát chặt lượng dầu mỡ, giàu chất xơ và vitamin, Việt hóa nguyên liệu dễ mua.',
    defaultStyleNotes: 'Ít dầu mỡ, thanh đạm, ưu tiên hấp/áp chảo/nồi chiên không dầu, dưới 380 kcal/khẩu phần.',
    curatedDishes: [
      { title: 'Ức gà áp chảo sốt chanh mật ong & bông cải xanh (Ít Calo)', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Cá hồi áp chảo măng tây bơ tỏi nhẹ bụng (Giảm cân)', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Canh nấm kim châm đậu hũ non trứng gà thanh đạm (Ít Calo)', role: 'SOUP', region: 'Toàn quốc' },
    ],
  },
  {
    id: 'eat-the-gains-protein',
    name: 'Eat the Gains & Fit Men Cook',
    domain: 'eatthegains.com',
    url: 'https://eatthegains.com/',
    category: 'HEALTHY_FITNESS',
    regionFocus: 'Tập Gym · Tăng cơ – Giảm mỡ (High Protein)',
    strengths: 'Tối ưu lượng Protein tự nhiên từ ức gà, thăn bò, tôm, cá, trứng và đậu phụ.',
    defaultStyleNotes: 'Giàu Protein tự nhiên (>25g đạm/khẩu phần), hạn chế đường tinh luyện, hợp người tập luyện.',
    curatedDishes: [
      { title: 'Thăn bò áp chảo ớt chuông & nấm đùi gà giàu Protein (Tập Gym)', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Tôm sú rim tỏi ớt mật ong & đậu Hà Lan giàu đạm (Tăng cơ)', role: 'MAIN', region: 'Toàn quốc' },
      { title: 'Salad ức gà xé phay bắp cải tím & trứng lòng đào (Tập Gym)', role: 'SIDE', region: 'Toàn quốc' },
    ],
  },
];

export interface QualityGateReport {
  passed: boolean;
  score: number; // 0 - 100
  hasValidQuantities: boolean;
  hasValidSteps: boolean;
  foodMatchRate: number; // 0.0 - 1.0
  hasValidCost: boolean;
  estimatedTotalVnd: number;
  reasons: string[];
}

/**
 * Kiểm định 4 chốt "Đúng Thực Phẩm Chuẩn & Đúng Định Lượng Công Thức" (Quality Gate)
 */
export function evaluateFoodAndRecipeQuality(draft: AiRecipeDraftPayload): QualityGateReport {
  const reasons: string[] = [];

  // Chốt 1: Phải có ít nhất 3 nguyên liệu có định lượng > 0
  const validIngredients = (draft.ingredients || []).filter(
    (ing) => ing && typeof ing.name === 'string' && ing.name.trim().length >= 2 && Number(ing.amount) > 0
  );
  const hasValidQuantities = validIngredients.length >= 3;
  if (!hasValidQuantities) {
    reasons.push(`Số nguyên liệu có định lượng (${validIngredients.length}) ít hơn mức chuẩn tối thiểu (3).`);
  }

  // Chốt 2: Phải có ít nhất 2 bước thực hiện rõ ràng (>= 15 ký tự)
  const validSteps = (draft.steps || []).filter(
    (st) => st && typeof st.instruction === 'string' && st.instruction.trim().length >= 15
  );
  const hasValidSteps = validSteps.length >= 2;
  if (!hasValidSteps) {
    reasons.push(`Số bước chế biến chi tiết (${validSteps.length}) ít hơn mức chuẩn tối thiểu (2).`);
  }

  // Chốt 3: Đối chiếu từng nguyên liệu với Từ điển Thực phẩm Chuẩn Việt Nam (FCT + Bách Hóa Xanh)
  let matchedFoodCount = 0;
  for (const ing of validIngredients) {
    const lower = ing.name.toLowerCase().trim();
    const matchedInRetail = VIETNAMESE_RETAIL_PRICE_DICTIONARY.some((entry) =>
      entry.keywords.some((kw) => lower.includes(kw))
    );
    const matchedInFct = VIETNAMESE_STANDARD_FCT.some((fct) => {
      const fLower = fct.name.toLowerCase();
      return lower.includes(fLower) || fLower.includes(lower);
    });
    if (matchedInRetail || matchedInFct || lower.includes('nước')) {
      matchedFoodCount++;
    }
  }

  const foodMatchRate =
    validIngredients.length > 0 ? matchedFoodCount / validIngredients.length : 0;
  if (foodMatchRate < 0.7) {
    reasons.push(
      `Tỷ lệ khớp thực phẩm chuẩn chợ Việt đạt ${Math.round(foodMatchRate * 100)}% (yêu cầu ≥ 70%).`
    );
  }

  // Chốt 4: Kiểm tra dự toán chi phí hợp lý theo chuẩn Bách Hóa Xanh
  const costBreakdown = calculateRecipeRealCost(
    validIngredients,
    draft.baseServings || 4,
    draft.baseServings || 4
  );
  const hasValidCost = costBreakdown.totalUsedVnd >= 8000 && costBreakdown.totalUsedVnd <= 600000;
  if (!hasValidCost) {
    reasons.push(`Chi phí ước tính (${costBreakdown.totalUsedVnd}đ) nằm ngoài ngưỡng bữa ăn gia đình.`);
  }

  let score = 0;
  if (hasValidQuantities) score += 30;
  if (hasValidSteps) score += 25;
  score += Math.round(foodMatchRate * 30);
  if (hasValidCost) score += 15;

  const passed = hasValidQuantities && hasValidSteps && foodMatchRate >= 0.7 && hasValidCost;

  return {
    passed,
    score: Math.min(100, score),
    hasValidQuantities,
    hasValidSteps,
    foodMatchRate: Math.round(foodMatchRate * 100) / 100,
    hasValidCost,
    estimatedTotalVnd: costBreakdown.totalUsedVnd,
    reasons,
  };
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

export interface HarvestedRecipeItemResult {
  recipeId: number;
  slug: string;
  name: string;
  role: string;
  status: 'PUBLISHED' | 'SUBMITTED' | 'DRAFT';
  sourceName: string;
  qualityScore: number;
  foodMatchRatePercent: number;
  estimatedTotalVnd: number;
  caloriesPerServing: number | null;
}

export interface DailyHarvestRunResult {
  ranAt: string;
  publishMode: HarvestPublishMode;
  requestedCount: number;
  harvested: HarvestedRecipeItemResult[];
  skippedDuplicates: string[];
  errors: string[];
}

// Lưu trạng thái lần chạy tự động gần nhất trong bộ nhớ tiến trình + kiểm tra từ DB
let lastAutoHarvestDateKey: string | null = null;

/**
 * Chạy thu thập & chuẩn hóa món ăn mới từ các nguồn uy tín đã chọn
 */
export async function runDailyCuratedHarvest(options: {
  sourceIds?: string[];
  customUrls?: string[];
  maxItems?: number;
  publishMode?: HarvestPublishMode;
  liveDiscover?: boolean;
  authorId?: number;
}): Promise<DailyHarvestRunResult> {
  const publishMode: HarvestPublishMode = options.publishMode || 'AUTO_PUBLISH_IF_QUALIFIED';
  const maxItems = Math.min(8, Math.max(1, Number(options.maxItems) || 3));

  // 1. Xác định authorId (Admin / Editor mặc định nếu chạy từ bộ lập lịch tự động)
  let authorId = options.authorId;
  if (!authorId) {
    const [adminOrEditor] = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, ['ADMIN', 'EDITOR']))
      .limit(1);
    authorId = adminOrEditor?.id ?? 1;
  }

  // 2. Lấy toàn bộ tên món & slug đã có trong DB để chống trùng lặp 100%
  const existingRecipes = await db
    .select({
      slug: recipes.slug,
      name: recipes.name,
      sourceAttribution: recipes.sourceAttribution,
    })
    .from(recipes);

  const existingSlugs = new Set(existingRecipes.map((r) => r.slug.toLowerCase()));
  const existingNormalizedNames = new Set(
    existingRecipes.map((r) => slugify(r.name))
  );
  const existingSources = new Set(
    existingRecipes
      .map((r) => (r.sourceAttribution || '').toLowerCase().trim())
      .filter(Boolean)
  );

  // 3. Xây dựng danh sách ứng viên từ các nguồn được chọn
  const selectedSources =
    options.sourceIds && options.sourceIds.length > 0
      ? CURATED_RECIPE_SOURCES.filter((s) => options.sourceIds!.includes(s.id))
      : CURATED_RECIPE_SOURCES;

  const candidates: Array<{
    title?: string;
    sourceUrl?: string;
    role: 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL';
    region: string;
    sourceName: string;
    styleNotes: string;
  }> = [];

  // Nếu Admin truyền thêm danh sách URL bài viết cụ thể
  if (Array.isArray(options.customUrls)) {
    for (const rawUrl of options.customUrls) {
      const trimmed = rawUrl.trim();
      if (!trimmed) continue;
      if (existingSources.has(trimmed.toLowerCase())) continue;
      candidates.push({
        sourceUrl: trimmed,
        role: 'MAIN',
        region: 'Toàn quốc',
        sourceName: trimmed,
        styleNotes: 'Chuẩn vị cơm nhà Việt Nam, định lượng chính xác',
      });
    }
  }

  // Lấy xen kẽ (Round-robin) giữa các nguồn uy tín để mỗi ngày có đủ Mặn - Canh - Xào
  const skippedDuplicates: string[] = [];
  let maxDepth = 0;
  for (const src of selectedSources) {
    if (src.curatedDishes.length > maxDepth) maxDepth = src.curatedDishes.length;
  }

  for (let i = 0; i < maxDepth; i++) {
    for (const src of selectedSources) {
      const dish = src.curatedDishes[i];
      if (!dish) continue;
      const candidateSlug = slugify(dish.title);
      if (existingSlugs.has(candidateSlug) || existingNormalizedNames.has(candidateSlug)) {
        skippedDuplicates.push(dish.title);
        continue;
      }
      candidates.push({
        title: dish.title,
        role: dish.role,
        region: dish.region,
        sourceName: `${src.name} (${src.domain})`,
        styleNotes: src.defaultStyleNotes,
      });
    }
  }

  // Nếu bật chế độ quét bài mới trực tiếp từ trang web nguồn (hoặc khi kho dự phòng đã lấy hết)
  if (options.liveDiscover || candidates.length < maxItems) {
    for (const src of selectedSources.slice(0, 3)) {
      const liveUrls = await discoverLiveRecipeUrlsFromSource(src, 2);
      for (const liveUrl of liveUrls) {
        if (existingSources.has(liveUrl.toLowerCase())) continue;
        candidates.unshift({
          sourceUrl: liveUrl,
          role: 'MAIN',
          region: 'Toàn quốc',
          sourceName: `${src.name} (${src.domain})`,
          styleNotes: src.defaultStyleNotes,
        });
      }
    }
  }

  const targetCandidates = candidates.slice(0, maxItems);
  const harvested: HarvestedRecipeItemResult[] = [];
  const errors: string[] = [];

  for (const cand of targetCandidates) {
    try {
      const draftRes = await generateRecipeDraft({
        dishTitle: cand.title,
        sourceUrl: cand.sourceUrl,
        role: cand.role,
        region: cand.region,
        styleNotes: cand.styleNotes,
        baseServings: 4,
        clientId: 'daily-harvester',
      });

      const draft = draftRes.draft;
      const quality = evaluateFoodAndRecipeQuality(draft);

      // Quyết định trạng thái xuất bản theo Phương án 3
      const shouldAutoPublish =
        publishMode === 'AUTO_PUBLISH_IF_QUALIFIED' && quality.passed;
      const targetStatus: 'PUBLISHED' | 'SUBMITTED' = shouldAutoPublish
        ? 'PUBLISHED'
        : 'SUBMITTED';

      // Lưu vào PostgreSQL
      const baseSlug = slugify(draft.name) || `mon-ngon-${Date.now()}`;
      let finalSlug = baseSlug;
      if (existingSlugs.has(finalSlug)) {
        finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
      }
      existingSlugs.add(finalSlug);

      const dishSlug = slugify(draft.dishName || draft.name) || finalSlug;

      const saved = await db.transaction(async (tx) => {
        let dishId: number;
        const [foundDish] = await tx
          .select({ id: dishes.id })
          .from(dishes)
          .where(eq(dishes.slug, dishSlug))
          .limit(1);

        if (foundDish) {
          dishId = foundDish.id;
        } else {
          const [createdDish] = await tx
            .insert(dishes)
            .values({
              slug: dishSlug,
              name: draft.dishName || draft.name,
              description: draft.shortDescription,
              defaultRole: draft.role,
            })
            .returning({ id: dishes.id });
          dishId = createdDish.id;
        }

        const now = new Date();
        const [insertedRecipe] = await tx
          .insert(recipes)
          .values({
            dishId,
            slug: finalSlug,
            name: draft.name,
            shortDescription: draft.shortDescription,
            role: draft.role,
            region: cand.region || 'GENERAL',
            sourceAttribution: cand.sourceUrl || cand.sourceName,
            status: targetStatus,
            provenance: 'AI_ASSISTED',
            baseServings: draft.baseServings || 4,
            prepTimeMinutes: draft.prepTimeMinutes || 15,
            cookTimeMinutes: draft.cookTimeMinutes || 25,
            difficulty: draft.difficulty || 'Dễ',
            heroImage: draft.heroImage || null,
            isEditorialReviewed: shouldAutoPublish,
            isCookTested: false,
            isNutritionVerified: false,
            reviewedById: shouldAutoPublish ? authorId : null,
            reviewedAt: shouldAutoPublish ? now : null,
            publishedAt: shouldAutoPublish ? now : null,
            reviewNotes: `Daily Harvester [${cand.sourceName}] · Điểm chất lượng: ${quality.score}/100 · Khớp thực phẩm: ${Math.round(quality.foodMatchRate * 100)}%`,
            authorId,
          })
          .returning({ id: recipes.id, slug: recipes.slug });

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

        // Gắn thẻ Taxonomy tự động
        const combinedText = `${draft.name} ${draft.shortDescription} ${cand.sourceName}`.toLowerCase();
        const taxSlugs: string[] = [];
        if (
          combinedText.includes('giảm cân') ||
          combinedText.includes('ít calo') ||
          combinedText.includes('thanh đạm') ||
          combinedText.includes('bbc')
        ) {
          taxSlugs.push('giam-can-it-calo');
        }
        if (
          combinedText.includes('tập gym') ||
          combinedText.includes('tăng cơ') ||
          combinedText.includes('protein') ||
          combinedText.includes('giàu đạm') ||
          combinedText.includes('ức gà')
        ) {
          taxSlugs.push('tap-gym-tang-co');
        }
        if (taxSlugs.length > 0) {
          const matchedTax = await tx
            .select({ id: taxonomies.id })
            .from(taxonomies)
            .where(inArray(taxonomies.slug, taxSlugs));
          for (const t of matchedTax) {
            await tx
              .insert(recipeTags)
              .values({ recipeId: insertedRecipe.id, taxonomyId: t.id })
              .onConflictDoNothing();
          }
        }

        return insertedRecipe;
      });

      // Tính toán dinh dưỡng Viện Dinh Dưỡng FCT
      let caloriesPerServing: number | null = null;
      try {
        const nut = await calculateRecipeNutrition(saved.id);
        caloriesPerServing = nut?.perServing?.calories ?? null;
      } catch {
        // ignore secondary nutrition error
      }

      harvested.push({
        recipeId: saved.id,
        slug: saved.slug,
        name: draft.name,
        role: draft.role,
        status: targetStatus,
        sourceName: cand.sourceName,
        qualityScore: quality.score,
        foodMatchRatePercent: Math.round(quality.foodMatchRate * 100),
        estimatedTotalVnd: quality.estimatedTotalVnd,
        caloriesPerServing,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      errors.push(`${cand.title || cand.sourceUrl}: ${msg}`);
    }
  }

  logger.info('Daily curated recipe harvest completed', {
    publishMode,
    harvestedCount: harvested.length,
    errorsCount: errors.length,
  });

  return {
    ranAt: new Date().toISOString(),
    publishMode,
    requestedCount: maxItems,
    harvested,
    skippedDuplicates: skippedDuplicates.slice(0, 10),
    errors,
  };
}

/**
 * Lấy danh sách các công thức được thu thập gần đây nhất từ Daily Harvester
 */
export async function getRecentHarvestedRecipes(limit = 8) {
  const rows = await db
    .select({
      id: recipes.id,
      slug: recipes.slug,
      name: recipes.name,
      role: recipes.role,
      status: recipes.status,
      caloriesPerServing: recipes.caloriesPerServing,
      sourceAttribution: recipes.sourceAttribution,
      reviewNotes: recipes.reviewNotes,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .where(sql`${recipes.reviewNotes} LIKE 'Daily Harvester%'`)
    .orderBy(desc(recipes.createdAt))
    .limit(limit);

  return rows;
}

/**
 * Tự động quét trang chuyên mục của nguồn ẩm thực để phát hiện các bài công thức mới (Live URL Discovery)
 */
export async function discoverLiveRecipeUrlsFromSource(
  source: CuratedRecipeSource,
  maxLinks = 3
): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const html = await res.text();
    const hrefMatches = html.matchAll(/href=["']([^"'#]+)["']/gi);
    const discovered: string[] = [];
    const seen = new Set<string>();

    for (const m of hrefMatches) {
      const rawHref = (m[1] || '').trim();
      if (!rawHref) continue;
      let fullUrl = '';
      try {
        fullUrl = new URL(rawHref, source.url).toString();
      } catch {
        continue;
      }
      if (!fullUrl.includes(source.domain)) continue;
      // Lọc các đường dẫn bài viết công thức sâu (có slug dài, tránh trang chủ/danh mục/tag)
      const urlObj = new URL(fullUrl);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const lastSeg = pathParts[pathParts.length - 1] || '';
      if (
        lastSeg.length >= 16 &&
        lastSeg.includes('-') &&
        !fullUrl.includes('/tag/') &&
        !fullUrl.includes('/category/') &&
        !fullUrl.includes('/author/') &&
        !fullUrl.includes('tim-kiem') &&
        !seen.has(fullUrl)
      ) {
        seen.add(fullUrl);
        discovered.push(fullUrl);
        if (discovered.length >= maxLinks) break;
      }
    }
    return discovered;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Bộ lập lịch tự động chạy ngầm mỗi ngày 1 lần (vào khung giờ sáng Việt Nam hoặc khi khởi động ngày mới)
 */
let schedulerStarted = false;

export function startDailyRecipeHarvesterScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  const checkAndRunDaily = async () => {
    try {
      // Lấy ngày hiện tại theo múi giờ Việt Nam (UTC+7)
      const nowVn = new Date(Date.now() + 7 * 60 * 60 * 1000);
      const todayKey = nowVn.toISOString().slice(0, 10); // YYYY-MM-DD
      const currentHourVn = nowVn.getUTCHours();

      // Chỉ chạy tự động từ 06:00 sáng trở đi và tối đa 1 lần / ngày
      if (currentHourVn < 6) return;
      if (lastAutoHarvestDateKey === todayKey) return;

      // Kiểm tra trong DB xem hôm nay đã có bài Daily Harvester nào chưa
      const recent = await getRecentHarvestedRecipes(1);
      if (recent.length > 0 && recent[0].createdAt) {
        const lastCreatedVn = new Date(new Date(recent[0].createdAt).getTime() + 7 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        if (lastCreatedVn === todayKey) {
          lastAutoHarvestDateKey = todayKey;
          return;
        }
      }

      lastAutoHarvestDateKey = todayKey;
      logger.info(`Running scheduled daily recipe harvest for date ${todayKey}`);
      const res = await runDailyCuratedHarvest({
        maxItems: 3,
        publishMode: 'AUTO_PUBLISH_IF_QUALIFIED',
      });

      if (res.harvested.some((h) => h.status === 'PUBLISHED')) {
        try {
          const { revalidateTag } = await import('next/cache');
          const { PUBLIC_RECIPES_TAG } = await import('@/lib/recipes/public');
          revalidateTag(PUBLIC_RECIPES_TAG, { expire: 0 });
        } catch {
          // ignore if outside request context
        }
      }
    } catch (err) {
      logger.warn('Scheduled daily recipe harvest check skipped', { error: err });
    }
  };

  // Chạy kiểm tra lần đầu sau khi server khởi động 15 giây (để lấy ngay món mới cho ngày hôm nay nếu chưa lấy)
  setTimeout(checkAndRunDaily, 15 * 1000).unref?.();

  // Kiểm tra định kỳ mỗi 60 phút
  setInterval(checkAndRunDaily, 60 * 60 * 1000).unref?.();
}
