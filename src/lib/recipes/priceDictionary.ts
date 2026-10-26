// Bộ từ điển Đơn giá Nguyên liệu Thực tế tại Việt Nam (Tham chiếu Bách Hóa Xanh, WinMart & Chợ truyền thống)
// Đơn vị chuẩn: VNĐ / 100g (hoặc 100ml) nguyên liệu mua về (As Purchased).
// Kết hợp trực tiếp với bộ quy đổi đơn vị `convertToGrams` (AG-36+) để tính chính xác giá từng món & từng mâm cơm.

import { convertToGrams } from '@/lib/nutrition/units';

export interface IngredientPriceEntry {
  keywords: string[];
  /** Đơn giá chuẩn tham chiếu tại Bách Hóa Xanh (VNĐ / 100g) */
  pricePer100gVnd: number;
  /** Quy cách đóng gói tham khảo tại Bách Hóa Xanh / Siêu thị */
  bhxPackHint: string;
  /** Là gia vị có sẵn trong tủ bếp (muối, mắm, đường, dầu ăn...) */
  isPantrySeasoning?: boolean;
}

export const VIETNAMESE_RETAIL_PRICE_DICTIONARY: IngredientPriceEntry[] = [
  // ============================================================================
  // 1. THỊT HEO (Bách Hóa Xanh / CP / MeatDeli)
  // ============================================================================
  {
    keywords: ['sườn non', 'suon non', 'sườn sụn'],
    pricePer100gVnd: 19500,
    bhxPackHint: 'BHX: Khay 300g ~ 58.500đ (19.5k/100g)',
  },
  {
    keywords: ['sườn heo', 'suon heo', 'sườn cốt lết', 'cốt lết', 'sườn'],
    pricePer100gVnd: 15500,
    bhxPackHint: 'BHX: Khay 300g ~ 46.500đ (15.5k/100g)',
  },
  {
    keywords: ['ba chỉ', 'ba rọi', 'thịt ba chỉ', 'thit ba chi', 'thịt ba rọi'],
    pricePer100gVnd: 16500,
    bhxPackHint: 'BHX: Khay 300g ~ 49.500đ (16.5k/100g)',
  },
  {
    keywords: ['nạc dăm', 'nạc vai', 'thịt vai', 'chân giò', 'giò heo', 'móng giò'],
    pricePer100gVnd: 14500,
    bhxPackHint: 'BHX: Khay 300g ~ 43.500đ (14.5k/100g)',
  },
  {
    keywords: ['thịt băm', 'thịt xay', 'heo xay', 'nạc xay', 'thịt bằm'],
    pricePer100gVnd: 13500,
    bhxPackHint: 'BHX: Khay 200g ~ 27.000đ (13.5k/100g)',
  },
  {
    keywords: ['thăn heo', 'thịt thăn', 'thịt nạc', 'thịt heo', 'thịt lợn'],
    pricePer100gVnd: 14000,
    bhxPackHint: 'BHX: Khay 300g ~ 42.000đ (14k/100g)',
  },

  // ============================================================================
  // 2. THỊT BÒ (Bách Hóa Xanh / Bò Úc / Bò tơ)
  // ============================================================================
  {
    keywords: ['thăn bò', 'bò lúc lắc', 'bắp bò', 'gầu bò', 'thịt bò', 'bò thái', 'bò băm', 'bò'],
    pricePer100gVnd: 27000,
    bhxPackHint: 'BHX: Khay 250g ~ 67.500đ (27k/100g)',
  },

  // ============================================================================
  // 3. GIA CẦM & TRỨNG (CP / San Hà / Ba Huân)
  // ============================================================================
  {
    keywords: ['ức gà', 'uc ga', 'phi lê gà'],
    pricePer100gVnd: 10500,
    bhxPackHint: 'BHX: Khay 500g ~ 52.500đ (10.5k/100g)',
  },
  {
    keywords: ['cánh gà', 'đùi gà', 'má đùi gà', 'gà góc tư'],
    pricePer100gVnd: 11500,
    bhxPackHint: 'BHX: Khay 500g ~ 57.500đ (11.5k/100g)',
  },
  {
    keywords: ['gà ta', 'thịt gà', 'gà nguyên con', 'gà'],
    pricePer100gVnd: 12500,
    bhxPackHint: 'BHX: ~125.000đ/kg (12.5k/100g)',
  },
  {
    keywords: ['thịt vịt', 'vịt'],
    pricePer100gVnd: 9500,
    bhxPackHint: 'BHX: ~95.000đ/kg (9.5k/100g)',
  },
  {
    keywords: ['trứng gà', 'trung ga'],
    pricePer100gVnd: 5800, // 1 quả ~55g ~ 3.200đ (Vỉ 10 quả ~ 32.000đ)
    bhxPackHint: 'BHX: Vỉ 10 quả ~ 32.000đ (~3.2k/quả)',
  },
  {
    keywords: ['trứng vịt', 'trung vit'],
    pricePer100gVnd: 5200, // 1 quả ~70g ~ 3.600đ
    bhxPackHint: 'BHX: Vỉ 10 quả ~ 36.000đ (~3.6k/quả)',
  },
  {
    keywords: ['trứng cút', 'trung cut'],
    pricePer100gVnd: 6500, // 1 quả ~12g ~ 800đ (Vỉ 30 quả ~ 24.000đ)
    bhxPackHint: 'BHX: Vỉ 30 quả ~ 24.000đ (~800đ/quả)',
  },

  // ============================================================================
  // 4. CÁ & THỦY HẢI SẢN
  // ============================================================================
  {
    keywords: ['cá hồi', 'ca hoi'],
    pricePer100gVnd: 48000,
    bhxPackHint: 'BHX: Khay 200g ~ 96.000đ (48k/100g)',
  },
  {
    keywords: ['cá thu', 'ca thu'],
    pricePer100gVnd: 22000,
    bhxPackHint: 'BHX: Khay 250g ~ 55.000đ (22k/100g)',
  },
  {
    keywords: ['cá lóc', 'ca loc', 'cá quả', 'cá chuối'],
    pricePer100gVnd: 11000,
    bhxPackHint: 'BHX: Làm sạch ~110.000đ/kg (11k/100g)',
  },
  {
    keywords: ['cá hú', 'cá basa', 'ca basa', 'cá tra'],
    pricePer100gVnd: 8500,
    bhxPackHint: 'BHX: Khay 400g ~ 34.000đ (8.5k/100g)',
  },
  {
    keywords: ['cá diêu hồng', 'cá rô', 'cá chép', 'cá trê', 'cá nục', 'cá bạc má', 'cá bống', 'cá cơm', 'cá'],
    pricePer100gVnd: 10000,
    bhxPackHint: 'BHX: Làm sạch ~100.000đ/kg (10k/100g)',
  },
  {
    keywords: ['tôm sú', 'tôm thẻ', 'tôm tươi', 'tôm bóc nõn', 'tôm khô', 'tôm'],
    pricePer100gVnd: 24000,
    bhxPackHint: 'BHX: Khay 250g ~ 60.000đ (24k/100g)',
  },
  {
    keywords: ['mực ống', 'mực lá', 'mực tươi', 'bạch tuộc', 'mực'],
    pricePer100gVnd: 23000,
    bhxPackHint: 'BHX: Khay 300g ~ 69.000đ (23k/100g)',
  },
  {
    keywords: ['cua đồng', 'thịt cua', 'ghẹ'],
    pricePer100gVnd: 16000,
    bhxPackHint: 'BHX: Gói cua đồng xay 200g ~ 32.000đ',
  },
  {
    keywords: ['nghêu', 'ngao', 'hến', 'sò', 'ốc'],
    pricePer100gVnd: 5500,
    bhxPackHint: 'BHX: Túi 500g ~ 27.500đ (5.5k/100g)',
  },
  {
    keywords: ['tép'],
    pricePer100gVnd: 12000,
    bhxPackHint: 'BHX: Khay 200g ~ 24.000đ (12k/100g)',
  },

  // ============================================================================
  // 5. ĐẬU HŨ, GIÒ CHẢ, NẤM
  // ============================================================================
  {
    keywords: ['đậu hũ', 'đậu phụ', 'tàu hũ'],
    pricePer100gVnd: 3500, // 1 bìa 100g ~ 3.500đ (Hộp 300g ~ 10.500đ)
    bhxPackHint: 'BHX: Hộp 300g ~ 10.500đ (~3.5k/bìa)',
  },
  {
    keywords: ['giò lụa', 'chả lụa', 'chả cá', 'chả quế', 'xúc xích', 'lạp xưởng'],
    pricePer100gVnd: 15000,
    bhxPackHint: 'BHX: Cây 500g ~ 75.000đ (15k/100g)',
  },
  {
    keywords: ['nấm hương', 'nấm đông cô', 'nấm đùi gà', 'nấm rơm', 'nấm kim châm', 'nấm bào ngư', 'mộc nhĩ', 'nấm mèo', 'nấm'],
    pricePer100gVnd: 9000,
    bhxPackHint: 'BHX: Gói 150g ~ 13.500đ (9k/100g)',
  },

  // ============================================================================
  // 6. RAU CỦ QUẢ TƯƠI (Bách Hóa Xanh 4K Farm / Đà Lạt)
  // ============================================================================
  {
    keywords: ['bông cải xanh', 'súp lơ xanh', 'súp lơ', 'măng tây', 'ớt chuông', 'đậu hà lan', 'ngó sen', 'hạt sen'],
    pricePer100gVnd: 6500,
    bhxPackHint: 'BHX: Bông 300g ~ 19.500đ (6.5k/100g)',
  },
  {
    keywords: [
      'rau muống',
      'cải thìa',
      'cải ngọt',
      'cải bẹ xanh',
      'cải xanh',
      'cải thảo',
      'bắp cải',
      'rau ngót',
      'rau đay',
      'mồng tơi',
      'rau dền',
      'rau lang',
      'xà lách',
      'rau cải',
      'rau sống',
    ],
    pricePer100gVnd: 3200, // 1 bó 300g ~ 9.500đ - 10.000đ
    bhxPackHint: 'BHX: Túi 300g ~ 9.500đ (3.2k/100g)',
  },
  {
    keywords: [
      'bầu',
      'bí đao',
      'bí xanh',
      'bí đỏ',
      'bí ngô',
      'mướp',
      'khổ qua',
      'mướp đắng',
      'su su',
      'su hào',
      'củ cải trắng',
      'củ cải',
      'dưa leo',
      'dưa chuột',
      'cà tím',
      'bạc hà',
      'dọc mùng',
      'đậu bắp',
      'đậu cô ve',
      'đậu đũa',
      'giá đỗ',
      'giá',
      'măng chua',
      'măng',
      'dưa cải chua',
      'dưa chua',
    ],
    pricePer100gVnd: 3000, // ~30.000đ/kg
    bhxPackHint: 'BHX: ~30.000đ/kg (3k/100g)',
  },
  {
    keywords: ['cà chua', 'khoai tây', 'khoai lang', 'khoai môn', 'cà rốt', 'hành tây', 'bắp Mỹ', 'bắp ngọt', 'ngô', 'thơm', 'dứa'],
    pricePer100gVnd: 3500, // ~35.000đ/kg
    bhxPackHint: 'BHX: ~35.000đ/kg (3.5k/100g)',
  },

  // ============================================================================
  // 7. RAU THƠM, HÀNH TỎI, GIA VỊ BẾP
  // ============================================================================
  {
    keywords: ['hành lá', 'ngò rí', 'rau mùi', 'ngò gai', 'rau ngổ', 'rau ôm', 'rau răm', 'thì là', 'húng quế', 'rau thơm', 'hẹ'],
    pricePer100gVnd: 6500, // 1 bó nhỏ 50g ~ 3.500đ
    bhxPackHint: 'BHX: Gói 50g ~ 3.500đ',
  },
  {
    keywords: ['hành tím', 'hành khô', 'tỏi', 'gừng', 'riềng', 'nghệ', 'sả', 'ớt', 'chanh', 'tắc', 'quất', 'me vắt', 'me chua'],
    pricePer100gVnd: 7500,
    bhxPackHint: 'BHX: Túi 100g ~ 7.500đ',
  },
  {
    keywords: ['nước cốt dừa', 'dừa tươi', 'nước dừa'],
    pricePer100gVnd: 4500,
    bhxPackHint: 'BHX: Lon 400ml ~ 18.000đ',
  },
  {
    keywords: ['bún tươi', 'bánh phở', 'mì trứng', 'miến dong', 'miến', 'bánh tráng', 'gạo'],
    pricePer100gVnd: 3000,
    bhxPackHint: 'BHX: ~30.000đ/kg (3k/100g)',
  },
  {
    keywords: [
      'nước mắm',
      'dầu ăn',
      'dầu hào',
      'nước tương',
      'xì dầu',
      'tương ớt',
      'tương cà',
      'mắm tôm',
      'mắm nêm',
      'hạt nêm',
      'đường',
      'muối',
      'bột ngọt',
      'mì chính',
      'tiêu',
      'bột năng',
      'bột bắp',
      'bột chiên giòn',
      'giấm',
      'mật ong',
      'dầu mè',
      'sa tế',
      'ngũ vị hương',
      'nước màu',
    ],
    pricePer100gVnd: 6000,
    bhxPackHint: 'Gia vị sẵn trong bếp (tính theo lượng dùng)',
    isPantrySeasoning: true,
  },
];

export interface IngredientCostDetail {
  name: string;
  amount: number;
  unit: string;
  grams: number;
  pricePer100gVnd: number;
  /** Chi phí thực tế cho lượng dùng trong công thức (VNĐ) */
  usedCostVnd: number;
  bhxPackHint: string;
  isPantrySeasoning: boolean;
}

export interface RecipeRealCostBreakdown {
  /** Tổng chi phí tính theo lượng dùng tại Bách Hóa Xanh (VNĐ) */
  totalUsedVnd: number;
  /** Chi phí trung bình cho 1 người ăn (VNĐ) */
  perServingVnd: number;
  /** Khoảng giá từ Chợ truyền thống (-10%) đến Siêu thị (+10%) */
  minVnd: number;
  maxVnd: number;
  /** Tổng tiền nguyên liệu tươi cần mua ngoài chợ/BHX (không tính gia vị sẵn có trong bếp) */
  freshMarketVnd: number;
  /** Tổng tiền gia vị ước tính */
  seasoningVnd: number;
  tierLabel: 'Tiết kiệm' | 'Hợp lý' | 'Đổi vị / Bổ dưỡng';
  formattedTotal: string;
  formattedRange: string;
  formattedPerServing: string;
  items: IngredientCostDetail[];
}

export function formatVndCurrency(amount: number): string {
  const rounded = Math.max(500, Math.round(amount / 500) * 500);
  return `${rounded.toLocaleString('vi-VN')}đ`;
}

export function formatVndRounded1k(amount: number): string {
  const rounded = Math.max(1000, Math.round(amount / 1000) * 1000);
  return `${rounded.toLocaleString('vi-VN')}đ`;
}

/**
 * Tra cứu đơn giá chuẩn (VNĐ/100g) từ từ điển giá bán lẻ Bách Hóa Xanh
 */
export function lookupIngredientRetailPrice(ingredientName: string): {
  pricePer100gVnd: number;
  bhxPackHint: string;
  isPantrySeasoning: boolean;
} {
  const lower = ingredientName.toLowerCase().trim();

  // Nước lọc / nước sôi không tốn chi phí nguyên liệu chợ
  if (
    lower === 'nước' ||
    lower === 'nước lọc' ||
    lower === 'nước sôi' ||
    lower === 'nước ấm' ||
    lower === 'nước lạnh' ||
    lower === 'nước đá'
  ) {
    return {
      pricePer100gVnd: 0,
      bhxPackHint: 'Nước sinh hoạt tại bếp',
      isPantrySeasoning: true,
    };
  }

  for (const entry of VIETNAMESE_RETAIL_PRICE_DICTIONARY) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return {
        pricePer100gVnd: entry.pricePer100gVnd,
        bhxPackHint: entry.bhxPackHint,
        isPantrySeasoning: Boolean(entry.isPantrySeasoning),
      };
    }
  }

  // Fallback hợp lý cho nguyên liệu khác
  return {
    pricePer100gVnd: 5500,
    bhxPackHint: 'BHX / Chợ: ~5.500đ/100g',
    isPantrySeasoning: false,
  };
}

/**
 * Ước tính chi phí cho 1 dòng nguyên liệu cụ thể (đã nhân khẩu phần nếu có)
 */
export function estimateIngredientCostVnd(
  name: string,
  amount: number,
  unit: string
): IngredientCostDetail {
  const grams = convertToGrams(amount, unit, name);
  const priceInfo = lookupIngredientRetailPrice(name);

  if (priceInfo.pricePer100gVnd === 0 || grams <= 0) {
    return {
      name,
      amount,
      unit,
      grams: Math.round(grams),
      pricePer100gVnd: 0,
      usedCostVnd: 0,
      bhxPackHint: priceInfo.bhxPackHint,
      isPantrySeasoning: priceInfo.isPantrySeasoning,
    };
  }

  const rawCost = (grams / 100) * priceInfo.pricePer100gVnd;
  // Với gia vị nhỏ lẻ (như 1 muỗng mắm, 1 tép tỏi), giữ mức tối thiểu 500đ; nguyên liệu tươi làm tròn 500đ
  const usedCostVnd = priceInfo.isPantrySeasoning
    ? Math.max(500, Math.round(rawCost / 500) * 500)
    : Math.max(1000, Math.round(rawCost / 500) * 500);

  return {
    name,
    amount,
    unit,
    grams: Math.round(grams),
    pricePer100gVnd: priceInfo.pricePer100gVnd,
    usedCostVnd,
    bhxPackHint: priceInfo.bhxPackHint,
    isPantrySeasoning: priceInfo.isPantrySeasoning,
  };
}

/**
 * Tính toán chi tiết giá thành 1 công thức dựa trên định lượng từng nguyên liệu
 */
export function calculateRecipeRealCost(
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    isOptional?: boolean;
    scalePolicy?: 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST' | string;
  }>,
  baseServings = 4,
  targetServings = 4
): RecipeRealCostBreakdown {
  const safeBase = baseServings > 0 ? baseServings : 4;
  const safeTarget = targetServings > 0 ? targetServings : safeBase;
  const scaleFactor = safeTarget / safeBase;

  const items: IngredientCostDetail[] = [];
  let freshMarketVnd = 0;
  let seasoningVnd = 0;

  for (const ing of ingredients) {
    if (ing.isOptional) continue;
    const effectiveAmount =
      ing.scalePolicy === 'FIXED' ? ing.amount : ing.amount * scaleFactor;
    const detail = estimateIngredientCostVnd(ing.name, effectiveAmount, ing.unit);
    items.push(detail);

    if (detail.isPantrySeasoning) {
      seasoningVnd += detail.usedCostVnd;
    } else {
      freshMarketVnd += detail.usedCostVnd;
    }
  }

  // Giới hạn trần hợp lý cho gia vị nêm nếm cơ bản trong 1 món (tránh trường hợp nước ngâm / dầu chiên ngập bị cộng quá cao)
  const cappedSeasoningVnd = Math.min(seasoningVnd, Math.round(12000 * Math.max(1, scaleFactor * 0.75)));
  const totalUsedVnd = Math.max(8000, Math.round((freshMarketVnd + cappedSeasoningVnd) / 1000) * 1000);
  const perServingVnd = Math.max(2000, Math.round(totalUsedVnd / safeTarget / 500) * 500);

  // Khoảng dao động thực tế: Chợ truyền thống (-10%) đến Siêu thị đóng khay (+10%)
  const minVnd = Math.max(5000, Math.round((totalUsedVnd * 0.9) / 1000) * 1000);
  const maxVnd = Math.max(minVnd + 4000, Math.round((totalUsedVnd * 1.1) / 1000) * 1000);

  const normalizedFor4 = totalUsedVnd / (safeTarget / 4);
  const tierLabel: RecipeRealCostBreakdown['tierLabel'] =
    normalizedFor4 <= 40000
      ? 'Tiết kiệm'
      : normalizedFor4 <= 85000
      ? 'Hợp lý'
      : 'Đổi vị / Bổ dưỡng';

  return {
    totalUsedVnd,
    perServingVnd,
    minVnd,
    maxVnd,
    freshMarketVnd,
    seasoningVnd: cappedSeasoningVnd,
    tierLabel,
    formattedTotal: formatVndRounded1k(totalUsedVnd),
    formattedRange: `${formatVndRounded1k(minVnd)} – ${formatVndRounded1k(maxVnd)}`,
    formattedPerServing: `${formatVndCurrency(perServingVnd)}/người`,
    items,
  };
}
