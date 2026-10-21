// R2 — Core MVP Verification & Real Cooking Flows.
// Bộ kiểm thử thuần (không cần DB): chạy bằng `npm run test:core`.
// Lưu ý trung thực: các nhóm đánh dấu [STATIC] là kiểm tra tĩnh mã nguồn (đọc file),
// không phải chạy trình duyệt. Đây là test do AI viết, KHÔNG thay cho nghiệm thu độc lập.
import fs from 'node:fs';
import path from 'node:path';
import {
  clampServings,
  formatScaledAmount,
  scaleRecipeIngredients,
  MIN_SERVINGS,
  MAX_SERVINGS,
} from '../lib/recipes/scaling';
import {
  aggregateMealIngredients,
  normalizeMarketCategory,
  type RecipeForAggregation,
  type RawRecipeIngredientForAggregation,
} from '../lib/recipes/aggregation';
import { generateShoppingPlainText } from '../lib/shopping/shoppingClient';
import { buildCookingHref, buildMealQuery, mealQueryFromDishes } from '../lib/meal/flowUrls';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    const msg = detail ? `${name} — ${detail}` : name;
    failures.push(msg);
    console.log(`  ❌ ${msg}`);
  }
}

function group(title: string) {
  console.log(`\n▶ ${title}`);
}

const ROOT = process.cwd();
function readSrc(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

let idSeq = 1;
function ing(
  name: string,
  amount: number,
  unit: string,
  scalePolicy: RawRecipeIngredientForAggregation['scalePolicy'],
  category: string
): RawRecipeIngredientForAggregation {
  return { id: idSeq++, name, amount, unit, scalePolicy, category, preparation: null, isOptional: false };
}

// Fixture bám sát seed thật (nhãn quầy tiếng Việt như DB đang lưu).
const THIT_KHO: RecipeForAggregation = {
  slug: 'thit-ba-chi-kho-tieu',
  name: 'Thịt ba chỉ kho tiêu',
  baseServings: 4,
  ingredients: [
    ing('Thịt ba chỉ heo', 400, 'g', 'LINEAR', 'Thực phẩm tươi sống'),
    ing('Hành tím', 3, 'củ', 'LINEAR', 'Gia vị nêm nếm'),
    ing('Tỏi khô', 3, 'tép', 'LINEAR', 'Gia vị nêm nếm'), // D61
    ing('Hạt tiêu đen', 1, 'muỗng cà phê', 'MANUAL_ADJUST', 'Gia vị nêm nếm'),
    ing('Nước mắm', 2, 'muỗng canh', 'LINEAR', 'Gia vị nêm nếm'),
    ing('Đường', 1, 'muỗng canh', 'LINEAR', 'Gia vị nêm nếm'),
    ing('Hành lá', 1, 'cây', 'FIXED', 'Rau củ quả'), // thêm để kiểm FIXED (seed không có)
  ],
};

const CANH_CHUA: RecipeForAggregation = {
  slug: 'canh-chua-ca-loc',
  name: 'Canh chua cá lóc',
  baseServings: 4,
  ingredients: [
    ing('Cá lóc', 400, 'g', 'LINEAR', 'Thủy hải sản'),
    ing('Cà chua', 2, 'quả', 'LINEAR', 'Rau củ quả'),
    ing('Dứa', 0.5, 'quả', 'LINEAR', 'Rau củ quả'),
    ing('Đậu bắp', 100, 'g', 'LINEAR', 'Rau củ quả'),
    ing('Giá đỗ', 100, 'g', 'LINEAR', 'Rau củ quả'),
    ing('Nước mắm', 2, 'muỗng canh', 'LINEAR', 'Gia vị nêm nếm'),
    ing('Hành lá', 1, 'cây', 'FIXED', 'Rau củ quả'),
  ],
};

const RAU_MUONG: RecipeForAggregation = {
  slug: 'rau-muong-xao-toi',
  name: 'Rau muống xào tỏi',
  baseServings: 4,
  ingredients: [
    ing('Rau muống', 1, 'bó (400g)', 'LINEAR', 'Rau củ quả'),
    ing('Tỏi khô', 6, 'tép', 'LINEAR', 'Gia vị nêm nếm'),
    ing('Dầu ăn', 2, 'muỗng canh', 'LINEAR', 'Đồ khô'),
    ing('Dầu hào', 1, 'muỗng canh', 'MANUAL_ADJUST', 'Gia vị nêm nếm'),
  ],
};

// ─────────────────────────────────────────────────────────────
group('1. Co giãn khẩu phần (scaling invariants)');
{
  const base = THIT_KHO.ingredients;
  const x15 = scaleRecipeIngredients(base, 4, 6);
  const pork = x15.find((i) => i.name === 'Thịt ba chỉ heo')!;
  check('R=1.5: 400g thịt → 600g', pork.scaledAmount === 600 && pork.formattedAmount === '600');
  check('R=1.5: dòng LINEAR được đánh dấu isScaled', pork.isScaled === true);
  const sugar = x15.find((i) => i.name === 'Đường')!;
  check('R=1.5: 1 muỗng đường → "1,5" (định dạng vi-VN)', sugar.formattedAmount === '1,5', sugar.formattedAmount);
  const pepper = x15.find((i) => i.name === 'Hạt tiêu đen')!;
  check('MANUAL_ADJUST giữ nguyên lượng gốc', pepper.scaledAmount === 1 && pepper.isScaled === false);
  const scallion = x15.find((i) => i.name === 'Hành lá')!;
  check('FIXED giữ nguyên lượng gốc', scallion.scaledAmount === 1 && scallion.isScaled === false);

  const x05 = scaleRecipeIngredients(base, 4, 2);
  check('R=0.5: 400g → 200g', x05.find((i) => i.name === 'Thịt ba chỉ heo')!.scaledAmount === 200);
  check('R=0.5: 3 củ hành tím → "1,5"', x05.find((i) => i.name === 'Hành tím')!.formattedAmount === '1,5');

  const x1 = scaleRecipeIngredients(base, 4, 4);
  check('R=1: không dòng nào bị đánh dấu isScaled', x1.every((i) => !i.isScaled));

  const x3 = scaleRecipeIngredients(base, 3, 4);
  const hanhTim = x3.find((i) => i.name === 'Hành tím')!;
  check('R=4/3: hiển thị tối đa 2 chữ số thập phân (không rác 1.333…)', hanhTim.formattedAmount === '4', hanhTim.formattedAmount);
  const sugar43 = x3.find((i) => i.name === 'Đường')!;
  check('R=4/3: 1 muỗng đường → "1,33"', sugar43.formattedAmount === '1,33', sugar43.formattedAmount);
  check('Giá trị tính toán không bị làm tròn đè (D21)', Math.abs(sugar43.scaledAmount - 4 / 3) < 1e-9);

  check(`clamp(0) → ${MIN_SERVINGS}`, clampServings(0) === MIN_SERVINGS);
  check('clamp(-3) → 1', clampServings(-3) === 1);
  check('clamp(NaN) → fallback', clampServings(NaN, 4) === 4);
  check('clamp(null) → fallback', clampServings(null, 2) === 2);
  check('clamp("abc") → fallback', clampServings('abc', 4) === 4);
  check(`clamp(25) → ${MAX_SERVINGS}`, clampServings(25) === MAX_SERVINGS);
  check('clamp("6") → 6 (query string)', clampServings('6') === 6);
  check('clamp(2.6) → 3', clampServings(2.6) === 3);
  check('format(0) / format(âm) / format(NaN) → "0"', formatScaledAmount(0) === '0' && formatScaledAmount(-1) === '0' && formatScaledAmount(NaN) === '0');
  check('format(1500) → "1.500" (dấu chấm hàng nghìn vi-VN)', formatScaledAmount(1500) === '1.500', formatScaledAmount(1500));

  const scalingSrc = readSrc('src/lib/recipes/scaling.ts');
  check('[STATIC] scaling.ts không nhân thời gian nấu (không đụng cookTime/prepTime)', !/cookTime|prepTime|totalTime/i.test(scalingSrc));
}

// ─────────────────────────────────────────────────────────────
group('2. Gộp nguyên liệu với nhãn quầy tiếng Việt thật (hồi quy B1)');
{
  check('normalize("Thực phẩm tươi sống") → MEAT_SEAFOOD', normalizeMarketCategory('Thực phẩm tươi sống') === 'MEAT_SEAFOOD');
  check('normalize("Thủy hải sản") → MEAT_SEAFOOD', normalizeMarketCategory('Thủy hải sản') === 'MEAT_SEAFOOD');
  check('normalize("Thuỷ hải sản") (biến thể dấu) → MEAT_SEAFOOD', normalizeMarketCategory('Thuỷ hải sản') === 'MEAT_SEAFOOD');
  check('normalize("Rau củ quả") → PRODUCE', normalizeMarketCategory('Rau củ quả') === 'PRODUCE');
  check('normalize("Gia vị nêm nếm") → PANTRY', normalizeMarketCategory('Gia vị nêm nếm') === 'PANTRY');
  check('normalize("Đồ khô") → PANTRY', normalizeMarketCategory('Đồ khô') === 'PANTRY');
  check('normalize mã cũ "MEAT_SEAFOOD"/"produce"/"PANTRY"', normalizeMarketCategory('MEAT_SEAFOOD') === 'MEAT_SEAFOOD' && normalizeMarketCategory('produce') === 'PRODUCE' && normalizeMarketCategory('PANTRY') === 'PANTRY');
  check('normalize NFD (dấu tổ hợp) vẫn nhận', normalizeMarketCategory('Rau củ quả'.normalize('NFD')) === 'PRODUCE');
  check('normalize("  rau củ quả  ") (khoảng trắng/hoa thường)', normalizeMarketCategory('  RAU CỦ QUẢ  ') === 'PRODUCE');
  check('normalize(null/""/lạ) → OTHER', normalizeMarketCategory(null) === 'OTHER' && normalizeMarketCategory('') === 'OTHER' && normalizeMarketCategory('xyz') === 'OTHER');

  const r = aggregateMealIngredients([THIT_KHO], 4);
  check('Dữ liệu seed thật: thịt vào quầy thịt (không rơi vào "khác")', r.categories.meatSeafood.some((i) => i.name === 'Thịt ba chỉ heo'));
  check('Dữ liệu seed thật: hành lá vào quầy rau', r.categories.produce.some((i) => i.name === 'Hành lá'));
  check('Dữ liệu seed thật: nước mắm LINEAR vào gia vị & đồ khô', r.categories.pantry.some((i) => i.name === 'Nước mắm'));
  check('Không còn món nào bị dồn vào "khác"', r.categories.other.length === 0, `other=${r.categories.other.map((i) => i.name).join(',')}`);

  const mixedUnits = aggregateMealIngredients(
    [
      { slug: 'a', name: 'A', baseServings: 4, ingredients: [ing('Tỏi', 6, 'tép', 'LINEAR', 'Gia vị nêm nếm')] },
      { slug: 'b', name: 'B', baseServings: 4, ingredients: [ing('Tỏi', 50, 'g', 'LINEAR', 'Gia vị nêm nếm')] },
    ],
    4
  );
  check('Khác đơn vị (tép vs g) → KHÔNG gộp, tách 2 dòng', mixedUnits.freshItems.filter((i) => i.name === 'Tỏi').length === 2);

  const caseMerge = aggregateMealIngredients(
    [
      { slug: 'a', name: 'A', baseServings: 4, ingredients: [ing('Hành tím', 2, 'củ', 'LINEAR', 'Gia vị nêm nếm')] },
      { slug: 'b', name: 'B', baseServings: 4, ingredients: [ing(' hành tím ', 1, 'Củ', 'LINEAR', 'Gia vị nêm nếm')] },
    ],
    4
  );
  const ht = caseMerge.freshItems.filter((i) => i.key === 'hành tím__củ');
  check('Cùng tên/đơn vị khác hoa thường/khoảng trắng → gộp 1 dòng', ht.length === 1 && ht[0].totalAmount === 3);
  check('Truy vết nguồn gốc: 2 trace cho 2 món', ht[0]?.traces.length === 2);

  const fixedOnly = aggregateMealIngredients([THIT_KHO, CANH_CHUA], 8);
  const hanhLa = fixedOnly.freshItems.find((i) => i.name === 'Hành lá')!;
  check('FIXED không nhân theo khẩu phần (1+1 cây ở 8 người = 2)', hanhLa.totalAmount === 2 && hanhLa.isScaled === false);

  const seasonOther = aggregateMealIngredients(
    [{ slug: 'a', name: 'A', baseServings: 4, ingredients: [ing('Bột ngọt', 1, 'muỗng', 'MANUAL_ADJUST', '')] }],
    4
  );
  check('MANUAL_ADJUST không có nhãn → xếp quầy PANTRY', seasonOther.seasoningItems[0]?.category === 'PANTRY');

  const zeroBase = aggregateMealIngredients(
    [{ slug: 'a', name: 'A', baseServings: 0, ingredients: [ing('Thịt', 100, 'g', 'LINEAR', 'Thịt')] }],
    2
  );
  check('baseServings=0 không gây chia cho 0 (Infinity/NaN)', Number.isFinite(zeroBase.freshItems[0].totalAmount));
}

// ─────────────────────────────────────────────────────────────
group('3. Văn bản gửi Zalo (hồi quy B2: không bỏ sót quầy gia vị & đồ khô)');
{
  const r = aggregateMealIngredients([THIT_KHO, CANH_CHUA, RAU_MUONG], 6);
  const text = generateShoppingPlainText(r, [THIT_KHO.name, CANH_CHUA.name, RAU_MUONG.name]);
  check('Có tiêu đề + khẩu phần 6 người', text.includes('DANH SÁCH ĐI CHỢ') && text.includes('Khẩu phần: 6 người'));
  check('Có danh sách món trong mâm', text.includes('Mâm cơm: Thịt ba chỉ kho tiêu, Canh chua cá lóc, Rau muống xào tỏi'));
  check('Có mục "GIA VỊ & ĐỒ KHÔ CẦN MUA"', text.includes('🧄 GIA VỊ & ĐỒ KHÔ CẦN MUA:'));
  const missing = r.freshItems.filter((i) => !text.includes(`- ${i.name}: ${i.formattedTotal} ${i.unit}`));
  check(
    `Mọi dòng cần mua (${r.freshItems.length}) đều xuất hiện kèm định lượng`,
    missing.length === 0,
    `thiếu: ${missing.map((i) => i.name).join(', ')}`
  );
  const seasoningMissing = r.seasoningItems.filter((i) => !text.includes(`- ${i.name}`));
  check('Mọi gia vị MANUAL_ADJUST xuất hiện ở mục bếp nhà', seasoningMissing.length === 0);
  check('Không lộ chuỗi rác "NaN"/"undefined"/"Infinity"', !/NaN|undefined|Infinity/.test(text));

  const shoppingView = readSrc('src/components/shopping/ShoppingView.tsx');
  check('[STATIC] ShoppingView hiển thị quầy pantry (heading-pantry + categories.pantry)', shoppingView.includes('heading-pantry') && shoppingView.includes('categories.pantry'));
}

// ─────────────────────────────────────────────────────────────
group('4. An toàn chế độ nấu [STATIC]');
{
  const timer = readSrc('src/components/cooking/StepTimer.tsx');
  const propsBlock = timer.match(/interface StepTimerProps\s*{([^}]*)}/)?.[1] ?? '';
  check('StepTimer không có prop callback tự chuyển bước (onComplete/onFinish/onNext)', !/on[A-Z]\w*\s*[?:]/.test(propsBlock), propsBlock.trim());
  check('StepTimer không gọi goToNext/router', !/goToNext|useRouter|router\.push/.test(timer));

  const view = readSrc('src/components/cooking/CookingModeView.tsx');
  const timerUsage = view.match(/<StepTimer([\s\S]*?)\/>/)?.[1] ?? '';
  check('CookingModeView chỉ truyền initialSeconds/stepNumber vào StepTimer', /initialSeconds=/.test(timerUsage) && !/on[A-Z]\w*=/.test(timerUsage), timerUsage.trim());
  check('Hồi quy B5: dùng (timerSeconds ?? 0) > 0, không render "0"', view.includes('(currentStep.timerSeconds ?? 0) > 0') && !/currentStep\.timerSeconds\s*&&/.test(view));
  check('Bảng nguyên liệu nhanh nhận scaledIngredients (theo khẩu phần đang nấu)', /<QuickIngredientsSheet[\s\S]*?ingredients=\{scaledIngredients\}/.test(view));
  check('Chế độ nấu tính scaledIngredients bằng scaleRecipeIngredients', /scaleRecipeIngredients\(recipe\.ingredients,\s*recipe\.baseServings,\s*servings\)/.test(view));
}

// ─────────────────────────────────────────────────────────────
group('5. Giữ trạng thái giữa các chặng (hồi quy B3, B4)');
{
  check('buildCookingHref: 6 người (gốc 4) → ?servings=6', buildCookingHref('thit-ba-chi-kho-tieu', 6, 4).endsWith('/nau?servings=6'));
  check('buildCookingHref: bằng khẩu phần gốc → không tham số', !buildCookingHref('thit-ba-chi-kho-tieu', 4, 4).includes('?'));
  check('buildCookingHref: 99 → kẹp 20', buildCookingHref('x', 99, 4).endsWith('?servings=20'));
  check('buildCookingHref: "abc" → về gốc, không tham số', !buildCookingHref('x', 'abc', 4).includes('?'));
  check('buildCookingHref: không có servings → link gốc', !buildCookingHref('x', null, 4).includes('?'));
  check('buildCookingHref: mã hóa slug an toàn', buildCookingHref('a b', 6, 4).includes('a%20b/nau'));

  const q = new URLSearchParams(buildMealQuery({ mainSlug: 'thit-ba-chi-kho-tieu', soupSlug: 'canh-chua-ca-loc', sideSlug: 'rau-muong-xao-toi', servings: 6 }));
  check('buildMealQuery giữ đủ 3 món + khẩu phần', q.get('main') === 'thit-ba-chi-kho-tieu' && q.get('soup') === 'canh-chua-ca-loc' && q.get('side') === 'rau-muong-xao-toi' && q.get('servings') === '6');
  check('buildMealQuery kẹp khẩu phần 50 → 20', new URLSearchParams(buildMealQuery({ servings: 50 })).get('servings') === '20');

  const back = new URLSearchParams(
    mealQueryFromDishes(
      [
        { slug: 'rau-muong-xao-toi', role: 'SIDE' },
        { slug: 'thit-ba-chi-kho-tieu', role: 'MAIN' },
        { slug: 'canh-chua-ca-loc', role: 'SOUP' },
      ],
      6
    )
  );
  check('Hồi quy B4: /shopping → /meal giữ đúng vai trò 3 món', back.get('main') === 'thit-ba-chi-kho-tieu' && back.get('soup') === 'canh-chua-ca-loc' && back.get('side') === 'rau-muong-xao-toi' && back.get('servings') === '6');

  const detail = readSrc('src/app/cong-thuc/[slug]/page.tsx');
  check('[STATIC] Hồi quy B3: trang chi tiết dùng StartCookingButton', detail.includes('<StartCookingButton'));
  const btn = readSrc('src/components/recipe/StartCookingButton.tsx');
  check('[STATIC] StartCookingButton đọc ?servings hiện tại + buildCookingHref', btn.includes('servings') && btn.includes('buildCookingHref'));
  const shopping = readSrc('src/components/shopping/ShoppingView.tsx');
  check('[STATIC] ShoppingView quay lại mâm bằng mealQueryFromDishes', shopping.includes('mealQueryFromDishes('));
  const summary = readSrc('src/components/meal/MealSummaryBar.tsx');
  check('[STATIC] MealSummaryBar dựng link đi chợ bằng buildMealQuery', summary.includes('buildMealQuery('));
}

// ─────────────────────────────────────────────────────────────
group('6. Mô phỏng đầu-cuối: mâm 3 món cho 6 người');
{
  const r = aggregateMealIngredients([THIT_KHO, CANH_CHUA, RAU_MUONG], 6);
  const get = (key: string) => r.freshItems.find((i) => i.key === key);
  check('dishesCount = 3, targetServings = 6', r.dishesCount === 3 && r.targetServings === 6);
  check('Thịt ba chỉ 600 g (quầy thịt)', get('thịt ba chỉ heo__g')?.totalAmount === 600 && get('thịt ba chỉ heo__g')?.category === 'MEAT_SEAFOOD');
  check('Cá lóc 600 g (quầy thịt & thủy hải sản)', get('cá lóc__g')?.totalAmount === 600 && get('cá lóc__g')?.category === 'MEAT_SEAFOOD');
  const nm = get('nước mắm__muỗng canh');
  check('Nước mắm LINEAR gộp 2 món: (2+2)×1,5 = 6 muỗng canh', nm?.totalAmount === 6 && nm?.traces.length === 2);
  check('Hành tím 4,5 củ', get('hành tím__củ')?.formattedTotal === '4,5');
  check('Dứa 0,75 quả', get('dứa__quả')?.formattedTotal === '0,75');
  check('Đậu bắp 150 g, Giá đỗ 150 g', get('đậu bắp__g')?.totalAmount === 150 && get('giá đỗ__g')?.totalAmount === 150);
  check('Rau muống 1,5 bó (400g)', get('rau muống__bó (400g)')?.formattedTotal === '1,5');
  check('Tỏi khô gộp 2 món (D61): (3 + 6) × 1,5 = 13,5 tép', get('tỏi khô__tép')?.formattedTotal === '13,5' && get('tỏi khô__tép')?.traces.length === 2);
  check('Dầu ăn 3 muỗng canh', get('dầu ăn__muỗng canh')?.totalAmount === 3);
  check('Hành lá FIXED: 2 cây (không nhân)', get('hành lá__cây')?.totalAmount === 2);
  const seasonNames = r.seasoningItems.map((s) => s.name).sort();
  check('Gia vị nêm tay: Dầu hào + Hạt tiêu đen (không cộng số học)', JSON.stringify(seasonNames) === JSON.stringify(['Dầu hào', 'Hạt tiêu đen']));
  check('Không có dòng nào rơi vào "khác"', r.categories.other.length === 0);
  const total = r.categories.meatSeafood.length + r.categories.produce.length + r.categories.pantry.length + r.categories.other.length;
  check('Tổng các quầy = tổng freshItems (không mất dòng)', total === r.freshItems.length);
}

// ─────────────────────────────────────────────────────────────
group('7. Guest-first (không bắt đăng nhập cho luồng cốt lõi) [STATIC]');
{
  const saved = readSrc('src/lib/recipes/savedRecipesClient.ts');
  check('Món đã lưu dùng localStorage "angimom_saved_recipes"', saved.includes("'angimom_saved_recipes'") && saved.includes('localStorage'));
  const shoppingClient = readSrc('src/lib/shopping/shoppingClient.ts');
  check('Checklist đi chợ dùng localStorage "angimom_shopping_checked_v1"', shoppingClient.includes("'angimom_shopping_checked_v1'") && shoppingClient.includes('localStorage'));
  const mealClient = readSrc('src/lib/meal/mealClient.ts');
  check('Mâm cơm hiện tại dùng localStorage', mealClient.includes('localStorage'));
  check('Các client guest không gọi API phiên đăng nhập', ![saved, shoppingClient, mealClient].some((s) => /getSession|\/api\/auth/.test(s)));
}

// ─────────────────────────────────────────────────────────────
group('8. Dữ liệu seed theo quyết định biên tập D61 [STATIC]');
{
  const seedProd = readSrc('src/scripts/seed_production_catalog.ts');
  // Cắt khối nguyên liệu của từng công thức theo recipeSlug
  const recipeBlock = (slug: string) => {
    const start = seedProd.indexOf(`recipeSlug: '${slug}'`);
    if (start < 0) return '';
    const next = seedProd.indexOf('recipeSlug:', start + 12);
    return seedProd.slice(start, next < 0 ? undefined : next);
  };
  const ingLine = (block: string, name: string) => block.split('\n').find((l) => l.includes(`name: '${name}'`)) ?? '';

  const thitKho = recipeBlock('thit-ba-chi-kho-tieu');
  const toi = ingLine(thitKho, 'Tỏi khô');
  check('Thịt kho có Tỏi khô băm nhỏ (slug toi-kho, đơn vị tép, LINEAR)', toi.includes("slug: 'toi-kho'") && toi.includes("unit: 'tép'") && toi.includes("scalePolicy: 'LINEAR'") && toi.includes('băm'), toi.trim());
  check('Bước sơ chế thịt kho nhắc tỏi băm', /tỏi băm/.test(thitKho));
  const rauMuongToi = ingLine(recipeBlock('rau-muong-xao-toi'), 'Tỏi khô');
  check('Tỏi khô ở rau muống cùng slug/đơn vị → gộp được khi đi chợ', rauMuongToi.includes("slug: 'toi-kho'") && rauMuongToi.includes("unit: 'tép'"));

  const nm = (slug: string) => ingLine(recipeBlock(slug), 'Nước mắm truyền thống');
  check('Nước mắm thịt kho: LINEAR (tăng theo số người)', nm('thit-ba-chi-kho-tieu').includes("scalePolicy: 'LINEAR'"));
  check('Nước mắm canh chua cá lóc: LINEAR (tăng theo số người)', nm('canh-chua-ca-loc').includes("scalePolicy: 'LINEAR'"));
  check('Nước mắm canh rau ngót: MANUAL_ADJUST (giữ nguyên, nêm theo khẩu vị)', nm('canh-rau-ngot-thit-bam').includes("scalePolicy: 'MANUAL_ADJUST'"));

  // Mọi nhãn quầy trong mọi seed phải map được (chống tái phát B1 khi thêm món)
  const seedFiles = fs
    .readdirSync(path.join(ROOT, 'src/scripts'))
    .filter((f) => /^seed_.*\.ts$/.test(f));
  const labels = new Set<string>();
  for (const f of seedFiles) {
    for (const m of readSrc(`src/scripts/${f}`).matchAll(/category:\s*'([^']+)'/g)) labels.add(m[1]);
  }
  const unmapped = [...labels].filter((l) => normalizeMarketCategory(l) === 'OTHER');
  check(`Toàn bộ ${labels.size} nhãn quầy trong ${seedFiles.length} file seed đều map được quầy chợ`, unmapped.length === 0, `chưa map: ${unmapped.join(', ')}`);
}

// ─────────────────────────────────────────────────────────────
group('9. Sửa lỗi tồn đọng R2 (R3) [STATIC]');
{
  const timer = readSrc('src/components/cooking/StepTimer.tsx');
  const updaterWithSideEffect = /setRemaining\(\s*\(\s*prev[\s\S]{0,300}?playBeep\(/.test(timer);
  check('StepTimer không gọi playBeep bên trong updater của setRemaining (hết kêu 2 lần)', !updaterWithSideEffect);
  check('StepTimer đếm theo mốc kết thúc tuyệt đối (endAt)', timer.includes('endAtRef'));
  const view = readSrc('src/components/cooking/CookingModeView.tsx');
  check('CookingModeView remount StepTimer theo bước (key)', /<StepTimer[\s\S]*?key=/.test(view));

  const mealView = readSrc('src/components/meal/MealView.tsx');
  check('MealView khôi phục mâm: đọc getStoredMeal + router.replace', mealView.includes('getStoredMeal()') && mealView.includes('router.replace('));
  check('MealView ưu tiên URL (hasExplicitSelection)', mealView.includes('hasExplicitSelection'));
  const mealPage = readSrc('src/app/meal/page.tsx');
  check('/meal truyền hasExplicitSelection và key theo mâm', mealPage.includes('hasExplicitSelection=') && /<MealView[\s\S]*?key=/.test(mealPage));
}

console.log(`\n══════════ R2/R3 CORE MVP: ${passed} PASS / ${failed} FAIL (tổng ${passed + failed}) ══════════`);
if (failed > 0) {
  console.log('Các mục thất bại:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
