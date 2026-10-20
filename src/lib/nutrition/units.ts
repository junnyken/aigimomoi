// AG-36: Bộ chuyển đổi đơn vị thực tế nhà bếp Việt Nam sang gam
// Xử lý các đơn vị dân gian: lạng, thìa canh, bát con, quả, tép...

interface UnitRule {
  ratioToGram: number; // Tỉ lệ quy đổi sang gam
}

// Bảng quy đổi đơn vị khối lượng & thể tích thông dụng
const STANDARD_UNITS: Record<string, number> = {
  g: 1,
  gam: 1,
  gr: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kí: 1000,
  cân: 1000,
  lạng: 100, // 1 lạng = 100g
  ml: 1,
  mililit: 1,
  l: 1000,
  lit: 1000,
  lít: 1000,
  // Đơn vị thìa/muỗng
  'thìa cà phê': 5,
  'muỗng cà phê': 5,
  tsp: 5,
  'thìa canh': 15,
  'muỗng canh': 15,
  'thìa súp': 15,
  tbsp: 15,
  // Đơn vị đong bát/chén
  chén: 200,
  bát: 200,
  'bát con': 180,
  'bát tô': 500,
};

// Ước tính trọng lượng trung bình của 1 đơn vị đếm (quả, củ, tép...) theo tên nguyên liệu
const ITEM_AVERAGE_GRAMS: Record<string, number> = {
  'trứng gà': 55,
  'trung ga': 55,
  'trứng vịt': 70,
  'trung vit': 70,
  'trứng cút': 12,
  'cà chua': 80,
  'ca chua': 80,
  'chanh': 40,
  'quất': 15,
  'tắc': 15,
  'ớt': 5,
  'ot': 5,
  'tỏi': 4,       // 1 tép tỏi ~ 4g
  'hành khô': 15, // 1 củ hành tím ~ 15g
  'hành tím': 15,
  'gừng': 15,     // 1 nhánh gừng ~ 15g
  'sả': 20,       // 1 cây sả ~ 20g
  'bắp ngô': 250,
  'dưa chuột': 120,
  'dưa leo': 120,
};

/**
 * Chuyển đổi định lượng nguyên liệu trong công thức sang khối lượng thực tế (gam)
 * @param amount Số lượng
 * @param unit Đơn vị trong công thức
 * @param ingredientName Tên nguyên liệu (để giải mã đơn vị đếm như quả, củ, cây)
 */
export function convertToGrams(amount: number, unit: string, ingredientName: string = ''): number {
  if (!amount || amount <= 0) return 0;
  
  const cleanUnit = unit.trim().toLowerCase();
  const cleanName = ingredientName.trim().toLowerCase();

  // 1. Kiểm tra trong bảng đơn vị chuẩn
  if (STANDARD_UNITS[cleanUnit] !== undefined) {
    return amount * STANDARD_UNITS[cleanUnit];
  }

  // 2. Kiểm tra nếu là đơn vị quả, trái, củ, tép, cây
  const isCountingUnit = ['quả', 'trái', 'củ', 'tép', 'nhánh', 'cây', 'búp'].some(u => cleanUnit.includes(u));
  if (isCountingUnit) {
    for (const [key, avgGram] of Object.entries(ITEM_AVERAGE_GRAMS)) {
      if (cleanName.includes(key)) {
        return amount * avgGram;
      }
    }
    // Trọng lượng fallback mặc định cho 1 quả/củ nếu không rõ loại
    return amount * 50;
  }

  // 3. Fallback mặc định xem như gram
  return amount;
}
