import type { RecipeSource } from '@/lib/recipes/source';

export type MealSlotRole = 'MAIN' | 'SOUP' | 'SIDE' | 'DIPPING_SAUCE';

export interface MealDishMacros {
  protein: number;
  fat: number;
  carbs: number;
  fiber: number | null;
  sodium: number | null;
}

export interface MealDishSummary {
  slug: string;
  name: string;
  shortDescription: string;
  role: MealSlotRole;
  baseServings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  difficulty: string;
  caloriesPerServing?: number | null;
  nutritionStatus?: 'NO_DATA' | 'INCOMPLETE' | 'ESTIMATED';
  macrosPerServing?: MealDishMacros | null;
  /** Công thức pha nhanh theo tỷ lệ muỗng (dành cho Nước chấm / Sốt) */
  spoonRatioFormula?: string;
  /** Đánh dấu mục cẩm nang nước chấm tích hợp sẵn (nếu chưa có trang chi tiết công thức riêng) */
  isBuiltInPreset?: boolean;
  heroImage: string | null;
  isCookTested: boolean;
  isIllustration?: boolean;
  /** R7: Bếp Mom hay Chợ công thức */
  source?: RecipeSource;
}

export interface MealSelection {
  main: MealDishSummary | null;
  soup: MealDishSummary | null;
  side: MealDishSummary | null;
  sauce?: MealDishSummary | null;
}

/**
 * Bộ 5 công thức Nước chấm & Sốt gia truyền chuẩn tỷ lệ muỗng bếp Việt
 * (Luôn sẵn sàng cho Ô thứ 4 trên Mâm cơm ngay cả khi DB chưa có món DIPPING_SAUCE riêng)
 */
export const BUILT_IN_DIPPING_SAUCES: MealDishSummary[] = [
  {
    slug: 'nuoc-mam-toi-ot-chua-ngot',
    name: 'Nước mắm tỏi ớt chua ngọt (Tỷ lệ vàng)',
    shortDescription: 'Pha theo tỷ lệ 2 mắm : 1.5 đường : 1 cốt chanh : 4 nước ấm, tỏi ớt nổi đều đẹp mắt.',
    spoonRatioFormula: '2 muỗng mắm + 1.5 muỗng đường + 1 muỗng chanh + 4 muỗng nước ấm + tỏi ớt băm',
    role: 'DIPPING_SAUCE',
    baseServings: 4,
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    totalTimeMinutes: 5,
    difficulty: 'Dễ',
    caloriesPerServing: 22,
    nutritionStatus: 'ESTIMATED',
    macrosPerServing: { protein: 1.2, fat: 0, carbs: 4.2, fiber: 0.1, sodium: 580 },
    isBuiltInPreset: true,
    heroImage: null,
    isCookTested: true,
    source: 'EDITORIAL',
  },
  {
    slug: 'nuoc-mam-nguyen-chat-dam-ot',
    name: 'Nước mắm nhĩ dầm ớt hiểm & tiêu xanh',
    shortDescription: 'Chuẩn vị chấm thịt luộc, cá hấp, canh chua — thơm nồng, ít đường, giữ trọn vị mắm truyền thống.',
    spoonRatioFormula: '3 muỗng nước mắm nhĩ + ½ quả chanh + 2 trái ớt hiểm cắt lát + tiêu sọ',
    role: 'DIPPING_SAUCE',
    baseServings: 4,
    prepTimeMinutes: 3,
    cookTimeMinutes: 0,
    totalTimeMinutes: 3,
    difficulty: 'Dễ',
    caloriesPerServing: 12,
    nutritionStatus: 'ESTIMATED',
    macrosPerServing: { protein: 1.8, fat: 0, carbs: 0.8, fiber: 0.1, sodium: 720 },
    isBuiltInPreset: true,
    heroImage: null,
    isCookTested: true,
    source: 'EDITORIAL',
  },
  {
    slug: 'kho-quet-top-mo-tom-kho',
    name: 'Kho quẹt tóp mỡ tôm khô chấm rau củ luộc',
    shortDescription: 'Sốt mắm đường sệt kẹo rim cùng tôm khô và tóp mỡ giòn rụm, nâng tầm đĩa bầu bí luộc.',
    spoonRatioFormula: '3 muỗng mắm + 2 muỗng đường + 2 muỗng nước lọc + 1 muỗng tôm khô + tiêu xanh',
    role: 'DIPPING_SAUCE',
    baseServings: 4,
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    totalTimeMinutes: 15,
    difficulty: 'Dễ',
    caloriesPerServing: 65,
    nutritionStatus: 'ESTIMATED',
    macrosPerServing: { protein: 3.5, fat: 3.2, carbs: 5.5, fiber: 0.2, sodium: 690 },
    isBuiltInPreset: true,
    heroImage: null,
    isCookTested: true,
    source: 'EDITORIAL',
  },
  {
    slug: 'muoi-ot-xanh-chanh-day',
    name: 'Muối ớt xanh lá chanh (Chấm gà luộc & hải sản)',
    shortDescription: 'Cay thơm mùi ớt xiêm xanh và lá chanh non, chua dịu, cực kỳ hợp với món hấp/luộc Eat Clean.',
    spoonRatioFormula: '1 muỗng muối hạt + 2 muỗng đường + 3 muỗng cốt chanh/tắc + 10 trái ớt xiêm xanh',
    role: 'DIPPING_SAUCE',
    baseServings: 4,
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    totalTimeMinutes: 5,
    difficulty: 'Dễ',
    caloriesPerServing: 25,
    nutritionStatus: 'ESTIMATED',
    macrosPerServing: { protein: 0.3, fat: 0.1, carbs: 5.8, fiber: 0.4, sodium: 540 },
    isBuiltInPreset: true,
    heroImage: null,
    isCookTested: true,
    source: 'EDITORIAL',
  },
  {
    slug: 'xi-dau-toi-ot-me-rang',
    name: 'Nước tương (Xì dầu) tỏi ớt & dầu mè thơm',
    shortDescription: 'Dịu mặn, ít Natri hơn nước mắm, rất hợp chấm đậu hũ, rau cải luộc, trứng chiên và món thanh đạm.',
    spoonRatioFormula: '3 muỗng nước tương + 1 muỗng nước ấm + ½ muỗng đường + ½ muỗng dầu mè + tỏi ớt',
    role: 'DIPPING_SAUCE',
    baseServings: 4,
    prepTimeMinutes: 3,
    cookTimeMinutes: 0,
    totalTimeMinutes: 3,
    difficulty: 'Dễ',
    caloriesPerServing: 20,
    nutritionStatus: 'ESTIMATED',
    macrosPerServing: { protein: 1.0, fat: 0.8, carbs: 2.2, fiber: 0.1, sodium: 420 },
    isBuiltInPreset: true,
    heroImage: null,
    isCookTested: true,
    source: 'EDITORIAL',
  },
];
