import type { PublicRecipe, PublicRecipeIngredient } from './publicQueries';
import type { MealDishSummary } from '@/lib/meal/mealPresets';
import { calculateRecipeRealCost, formatVndCurrency } from './priceDictionary';

export interface MarketCostEstimate {
  minVnd: number;
  maxVnd: number;
  perServingVnd?: number;
  tierLabel: 'Tiết kiệm' | 'Hợp lý' | 'Đổi vị / Bổ dưỡng';
  formattedRange: string;
  formattedPerServing?: string;
}

export interface FreshnessGuideTip {
  title: string;
  selectionTip: string;
  storageTip: string;
  nutritionRetentionTip: string;
}

function formatVndShort(amount: number): string {
  const rounded = Math.round(amount / 5000) * 5000;
  return `${rounded.toLocaleString('vi-VN')}đ`;
}

/**
 * Ước tính chi phí đi chợ tham khảo tại Việt Nam cho 1 món ăn (theo khẩu phần).
 * Nếu món ăn có danh sách nguyên liệu định lượng (`ingredients`), tự động tính chính xác
 * từ đơn giá bán lẻ Bách Hóa Xanh / Siêu thị (`calculateRecipeRealCost`).
 */
export function estimateDishCostVnd(
  dish: {
    name: string;
    role: string;
    baseServings?: number;
    ingredients?: PublicRecipeIngredient[];
  },
  targetServings = 4
): MarketCostEstimate {
  if (Array.isArray(dish.ingredients) && dish.ingredients.length > 0) {
    const real = calculateRecipeRealCost(
      dish.ingredients,
      dish.baseServings || 4,
      targetServings
    );
    return {
      minVnd: real.minVnd,
      maxVnd: real.maxVnd,
      perServingVnd: real.perServingVnd,
      tierLabel: real.tierLabel,
      formattedRange: real.formattedRange,
      formattedPerServing: real.formattedPerServing,
    };
  }

  const lower = dish.name.toLowerCase();
  const safeServings = Math.max(1, targetServings);
  const scale = Math.max(0.5, safeServings / 4);

  let baseMin4 = 35000;
  let baseMax4 = 55000;
  let tierLabel: MarketCostEstimate['tierLabel'] = 'Hợp lý';

  if (dish.role === 'DIPPING_SAUCE') {
    baseMin4 = 5000;
    baseMax4 = 12000;
    tierLabel = 'Tiết kiệm';
  } else if (dish.role === 'SIDE') {
    if (lower.includes('bò') || lower.includes('tôm') || lower.includes('mực')) {
      baseMin4 = 45000;
      baseMax4 = 70000;
      tierLabel = 'Hợp lý';
    } else {
      baseMin4 = 15000;
      baseMax4 = 30000;
      tierLabel = 'Tiết kiệm';
    }
  } else if (dish.role === 'SOUP') {
    if (lower.includes('cá lóc') || lower.includes('sườn') || lower.includes('bò') || lower.includes('tôm') || lower.includes('gà')) {
      baseMin4 = 40000;
      baseMax4 = 65000;
      tierLabel = 'Hợp lý';
    } else {
      baseMin4 = 20000;
      baseMax4 = 35000;
      tierLabel = 'Tiết kiệm';
    }
  } else {
    // MAIN / ONE_DISH_MEAL / DESSERT
    if (lower.includes('cá hồi') || lower.includes('bò') || lower.includes('tôm') || lower.includes('mực') || lower.includes('hải sản')) {
      baseMin4 = 85000;
      baseMax4 = 135000;
      tierLabel = 'Đổi vị / Bổ dưỡng';
    } else if (lower.includes('đậu hũ') || lower.includes('trứng') || lower.includes('chay') || lower.includes('nấm')) {
      baseMin4 = 25000;
      baseMax4 = 45000;
      tierLabel = 'Tiết kiệm';
    } else {
      baseMin4 = 55000;
      baseMax4 = 85000;
      tierLabel = 'Hợp lý';
    }
  }

  const minVnd = Math.max(5000, Math.round((baseMin4 * scale) / 5000) * 5000);
  const maxVnd = Math.max(minVnd + 10000, Math.round((baseMax4 * scale) / 5000) * 5000);
  const avgVnd = (minVnd + maxVnd) / 2;
  const perServingVnd = Math.max(2000, Math.round(avgVnd / safeServings / 500) * 500);

  return {
    minVnd,
    maxVnd,
    perServingVnd,
    tierLabel,
    formattedRange: `${formatVndShort(minVnd)} – ${formatVndShort(maxVnd)}`,
    formattedPerServing: `~${formatVndCurrency(perServingVnd)}/người`,
  };
}

/**
 * Ước tính tổng chi phí đi chợ cho cả mâm cơm 3 món (Mặn + Canh + Rau)
 */
export function estimateMealTrayCostVnd(
  dishes: Array<MealDishSummary | null | undefined>,
  servings = 4
): MarketCostEstimate {
  const valid = dishes.filter((d): d is MealDishSummary => Boolean(d));
  let totalMin = 0;
  let totalMax = 0;

  for (const d of valid) {
    const est = estimateDishCostVnd(d, servings);
    totalMin += est.minVnd;
    totalMax += est.maxVnd;
  }

  if (totalMin === 0) {
    totalMin = 65000;
    totalMax = 110000;
  }

  const tierLabel: MarketCostEstimate['tierLabel'] =
    totalMax <= 95000 ? 'Tiết kiệm' : totalMax <= 155000 ? 'Hợp lý' : 'Đổi vị / Bổ dưỡng';

  return {
    minVnd: totalMin,
    maxVnd: totalMax,
    tierLabel,
    formattedRange: `${formatVndShort(totalMin)} – ${formatVndShort(totalMax)}`,
  };
}

/**
 * Cẩm nang chọn nguyên liệu tươi ngon & giữ trọn dinh dưỡng (Chuẩn An Toàn Thực Phẩm & Viện Dinh Dưỡng)
 */
export function getFreshnessAndNutritionGuide(recipe: PublicRecipe): FreshnessGuideTip {
  const text = `${recipe.name} ${recipe.shortDescription} ${recipe.ingredients.map((i) => i.name).join(' ')}`.toLowerCase();

  if (text.includes('ức gà') || text.includes('thịt gà') || text.includes('gà')) {
    return {
      title: 'Mẹo chọn Thịt Gà / Ức Gà tươi săn chắc & Giữ trọn Protein',
      selectionTip:
        'Chọn miếng thịt gà có màu hồng nhạt tự nhiên, thớ thịt mịn, ấn tay vào có độ đàn hồi tốt, không bị chảy nhớt hay có vết bầm tím.',
      storageTip:
        'Bảo quản ngăn mát (0–4°C) dùng trong 24–48 giờ; nếu cấp đông (-18°C) nên chia sẵn từng phần đủ 1 bữa ăn và rã đông chậm trong ngăn mát.',
      nutritionRetentionTip:
        'Với ức gà (chỉ ~1.5–3.6g béo/100g), nên ướp cùng chút dầu ô liu/nước cốt cam hoặc áp chảo lửa vừa đậy nắp để thịt chín mọng, không bị khô xơ.',
    };
  }

  if (text.includes('cá hồi') || text.includes('cá lóc') || text.includes('cá basa') || text.includes('cá')) {
    return {
      title: 'Mẹo chọn Cá tươi sống & Bảo toàn axit béo Omega-3',
      selectionTip:
        'Cá tươi có mắt trong suốt hơi phồng, mang cá đỏ tươi, vảy bám chặt và thịt cá có độ đàn hồi ngay khi ấn nhẹ ngón tay.',
      storageTip:
        'Làm sạch ruột, thấm khô nước bằng khăn giấy ăn trước khi cất hộp kín ở ngăn mát (0–2°C) hoặc cấp đông (-18°C).',
      nutritionRetentionTip:
        'Chế biến bằng phương pháp hấp, nấu canh chua hoặc áp chảo nhanh giúp giữ lại hơn 85% lượng Omega-3 và Vitamin D tự nhiên trong thịt cá.',
    };
  }

  if (text.includes('bò') || text.includes('thăn bò')) {
    return {
      title: 'Mẹo chọn Thịt Bò tươi mềm & Tối ưu hấp thu Sắt (Heme Iron)',
      selectionTip:
        'Chọn thịt bò có màu đỏ tươi, thớ thịt nhỏ mịn, mỡ bò màu vàng nhạt và có mùi thơm đặc trưng, chạm vào hơi se dẻo.',
      storageTip:
        'Thái ngang thớ bản mỏng; bảo quản ngăn mát (0–4°C) tối đa 2–3 ngày trong hộp kín.',
      nutritionRetentionTip:
        'Xào thịt bò trên lửa lớn thật nhanh và kết hợp cùng rau củ giàu Vitamin C (ớt chuông, cà chua, bông cải xanh) giúp cơ thể tăng gấp đôi khả năng hấp thu Sắt.',
    };
  }

  if (text.includes('tôm') || text.includes('mực') || text.includes('hải sản')) {
    return {
      title: 'Mẹo chọn Tôm & Hải sản tươi ngọt tự nhiên',
      selectionTip:
        'Chọn tôm có vỏ trong bóng, đầu dính chặt vào thân, chân tôm không bị thâm đen; mực tươi có lớp da sáng lấp lánh và thịt săn dày.',
      storageTip:
        'Rửa nhanh bằng nước muối loãng, để ráo và bảo quản ngăn đá nếu chưa chế biến ngay trong ngày.',
      nutritionRetentionTip:
        'Tôm và mực chín rất nhanh (3–5 phút); không nấu quá lâu để tránh làm biến tính sợi cơ khiến hải sản bị dai và hao hụt Kẽm, Selen.',
    };
  }

  if (text.includes('thịt ba chỉ') || text.includes('sườn') || text.includes('heo') || text.includes('lợn')) {
    return {
      title: 'Mẹo chọn Thịt Heo / Sườn tươi ngon & Giảm mỡ bão hòa',
      selectionTip:
        'Thịt heo ngon có màu hồng tươi, lớp mỡ trắng sáng, bề mặt khô ráo và độ đàn hồi cao khi ấn tay.',
      storageTip:
        'Bảo quản ngăn mát 0–4°C trong 1–2 ngày; chần sơ qua nước ấm pha chút muối và gừng đập dập trước khi kho/hầm để nước trong và thơm.',
      nutritionRetentionTip:
        'Khi kho hoặc hầm sườn, có thể áp chảo cho xém cạnh trước rồi hớt bớt lớp mỡ nổi trên mặt nước để giảm ~25% lượng Calo từ chất béo bão hòa.',
    };
  }

  return {
    title: 'Mẹo chọn Rau củ & Đậu hũ tươi sạch, giữ trọn Vitamin',
    selectionTip:
      'Chọn rau củ cầm nặng tay, lá xanh tươi nguyên vẹn không dập úa; đậu hũ trắng ngà tự nhiên, mềm mịn và có mùi thơm dịu của đậu nành.',
    storageTip:
      'Không rửa rau trước khi cất tủ lạnh; bọc bằng giấy thấm ẩm rồi cho vào túi thoáng khí ở ngăn rau củ (4–6°C) để tươi lâu gấp đôi.',
    nutritionRetentionTip:
      'Luộc hoặc xào rau khi nước/chảo đã thật nóng với thời gian ngắn (2–4 phút) giúp giữ màu xanh diệp lục và bảo toàn tối đa Vitamin C, Folate.',
  };
}
