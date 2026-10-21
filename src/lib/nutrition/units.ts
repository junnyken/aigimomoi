// AG-36+: Bộ chuyển đổi đơn vị thực tế nhà bếp Việt Nam sang gam (Chuẩn hóa thực tế bếp Việt)
// Xử lý chính xác các đơn vị dân gian: lạng, muỗng canh, muỗng cà phê, bìa/miếng đậu, bó/mớ rau, quả, củ, tép, nhánh...

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
  'muỗng nhỏ': 5,
  tsp: 5,
  'thìa canh': 15,
  'muỗng canh': 15,
  'thìa súp': 15,
  'muỗng súp': 15,
  'muỗng': 10,
  'thìa': 10,
  tbsp: 15,
  // Đơn vị nhúm / ít
  'nhúm': 2,
  'chút': 2,
  'ít': 3,
  // Đơn vị đong bát/chén
  chén: 200,
  bát: 200,
  'bát con': 180,
  'chén con': 180,
  'bát tô': 500,
  'tô': 500,
  'cốc': 240,
  'ly': 200,
};

// Trọng lượng trung bình thực tế của 1 đơn vị đếm (quả, trái, củ, tép, nhánh, miếng, bìa, bó, mớ, khúc, lát...)
const ITEM_AVERAGE_GRAMS: Array<{ keywords: string[]; grams: number }> = [
  { keywords: ['trứng gà', 'trung ga'], grams: 55 },
  { keywords: ['trứng vịt', 'trung vit'], grams: 70 },
  { keywords: ['trứng cút', 'trung cut'], grams: 12 },
  { keywords: ['đậu phụ', 'đậu hũ', 'tàu hũ', 'dau phu', 'dau hu'], grams: 100 }, // 1 bìa/miếng đậu phụ ~ 100g
  { keywords: ['cà chua', 'ca chua'], grams: 85 },
  { keywords: ['chanh'], grams: 40 },
  { keywords: ['quất', 'tắc'], grams: 12 },
  { keywords: ['ớt', 'ot'], grams: 5 },
  { keywords: ['tỏi', 'toi'], grams: 4 }, // 1 tép tỏi ~ 4g (nếu 1 củ tỏi xử lý riêng bên dưới)
  { keywords: ['hành tím', 'hành khô', 'củ hành'], grams: 12 },
  { keywords: ['hành tây'], grams: 150 },
  { keywords: ['hành lá', 'ngò', 'mùi', 'rau răm', 'thì là', 'húng'], grams: 5 }, // 1 nhánh hành lá/rau thơm ~ 5g
  { keywords: ['gừng', 'riềng', 'nghệ'], grams: 12 },
  { keywords: ['sả'], grams: 18 }, // 1 cây/nhánh sả ~ 18g
  { keywords: ['khoai tây', 'khoai lang', 'khoai môn'], grams: 150 },
  { keywords: ['cà rốt', 'củ cải'], grams: 130 },
  { keywords: ['dưa leo', 'dưa chuột'], grams: 120 },
  { keywords: ['khổ qua', 'mướp đắng'], grams: 150 },
  { keywords: ['bầu', 'bí đao', 'mướp'], grams: 350 },
  { keywords: ['bắp', 'ngô'], grams: 220 },
  { keywords: ['dừa'], grams: 400 },
  { keywords: ['cá'], grams: 250 }, // 1 khúc / 1 con cá trung bình ~ 250g
];

/**
 * Chuyển đổi định lượng nguyên liệu trong công thức sang khối lượng thực tế (gam)
 */
export function convertToGrams(amount: number, unit: string, ingredientName: string = ''): number {
  if (!amount || amount <= 0) return 0;

  const cleanUnit = unit.trim().toLowerCase();
  const cleanName = ingredientName.trim().toLowerCase();

  // 1. Kiểm tra trong bảng đơn vị khối lượng / thể tích chuẩn (g, kg, ml, muỗng canh, muỗng cà phê...)
  if (STANDARD_UNITS[cleanUnit] !== undefined) {
    // Riêng dầu ăn: 1 muỗng canh ~ 13.5g, đường/bột: 1 muỗng canh ~ 12g
    if (cleanUnit === 'muỗng canh' || cleanUnit === 'thìa canh' || cleanUnit === 'tbsp') {
      if (cleanName.includes('dầu') || cleanName.includes('mỡ')) return amount * 13.5;
      if (cleanName.includes('đường') || cleanName.includes('bột') || cleanName.includes('hạt nêm')) return amount * 12;
    }
    if (cleanUnit === 'muỗng cà phê' || cleanUnit === 'thìa cà phê' || cleanUnit === 'tsp') {
      if (cleanName.includes('tiêu') || cleanName.includes('ớt bột')) return amount * 3;
      if (cleanName.includes('muối') || cleanName.includes('hạt nêm') || cleanName.includes('đường')) return amount * 5;
    }
    return amount * STANDARD_UNITS[cleanUnit];
  }

  // 2. Xử lý các đơn vị đặc thù theo ngữ cảnh bếp Việt
  if (cleanUnit.includes('bó') || cleanUnit.includes('mớ')) {
    return amount * 300; // 1 bó/mớ rau tiêu chuẩn ~ 300g
  }
  if (cleanUnit.includes('lát')) {
    if (cleanName.includes('gừng') || cleanName.includes('ớt') || cleanName.includes('chanh')) return amount * 3;
    return amount * 25;
  }
  if (cleanUnit.includes('bìa') || cleanUnit.includes('miếng')) {
    if (cleanName.includes('đậu')) return amount * 100;
    return amount * 80;
  }
  if (cleanUnit.includes('khúc') || cleanUnit.includes('khoanh')) {
    return amount * 120;
  }
  if (cleanUnit.includes('con')) {
    if (cleanName.includes('tôm') || cleanName.includes('tép')) return amount * 20;
    if (cleanName.includes('cá')) return amount * 350;
    if (cleanName.includes('gà') || cleanName.includes('vịt')) return amount * 1200;
    return amount * 200;
  }

  // 3. Kiểm tra đơn vị đếm (quả, trái, củ, tép, nhánh, cây, búp, gói, hộp)
  const isCountingUnit = ['quả', 'trái', 'củ', 'tép', 'nhánh', 'cây', 'búp', 'cọng', 'lá'].some((u) =>
    cleanUnit.includes(u)
  );
  if (isCountingUnit) {
    if (cleanUnit.includes('lá')) return amount * 2;
    if (cleanUnit.includes('tép') && cleanName.includes('tỏi')) return amount * 4;
    if (cleanUnit.includes('củ') && cleanName.includes('tỏi')) return amount * 30;

    for (const rule of ITEM_AVERAGE_GRAMS) {
      if (rule.keywords.some((kw) => cleanName.includes(kw))) {
        return amount * rule.grams;
      }
    }
    // Nếu là nhánh/cọng mà chưa khớp, chỉ ~ 5g (tránh tính nhầm thành 50g)
    if (cleanUnit.includes('nhánh') || cleanUnit.includes('cọng')) {
      return amount * 5;
    }
    return amount * 60;
  }

  // 4. Fallback mặc định xem như gram
  return amount;
}
