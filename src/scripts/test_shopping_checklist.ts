// AG-23: Kịch bản kiểm thử tự động cho Tính năng Danh sách đi chợ & Lưu trạng thái (Shopping Checklist).
// Kiểm tra tính toán tiến độ %, cơ chế check/uncheck, format văn bản sao chép (Zalo/SMS), và reset.
// Chạy độc lập: npx tsx src/scripts/test_shopping_checklist.ts
import { aggregateMealIngredients } from '../lib/recipes/aggregation';
import { generateShoppingPlainText } from '../lib/shopping/shoppingClient';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passCount++;
    console.log(`  ✓ ${msg}`);
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  AG-23 — Test Suite: Shopping Checklist Persistence');
  console.log('======================================================\n');

  // Tạo fixtures mâm cơm 3 món chuẩn
  const mealDishes = [
    {
      slug: 'thit-kho-tieu',
      name: 'Thịt Kho Tiêu',
      baseServings: 4,
      ingredients: [
        {
          id: 1,
          name: 'Thịt ba chỉ',
          category: 'MEAT_SEAFOOD',
          amount: 400,
          unit: 'g',
          scalePolicy: 'LINEAR' as const,
          preparation: null,
          isOptional: false,
        },
        {
          id: 2,
          name: 'Hành tím',
          category: 'PRODUCE',
          amount: 3,
          unit: 'củ',
          scalePolicy: 'LINEAR' as const,
          preparation: null,
          isOptional: false,
        },
        {
          id: 3,
          name: 'Nước mắm',
          category: 'PANTRY',
          amount: 2,
          unit: 'muỗng canh',
          scalePolicy: 'MANUAL_ADJUST' as const,
          preparation: null,
          isOptional: false,
        },
      ],
    },
    {
      slug: 'canh-cai-nau-tom',
      name: 'Canh Cải Nấu Tôm',
      baseServings: 4,
      ingredients: [
        {
          id: 4,
          name: 'Tôm sú',
          category: 'MEAT_SEAFOOD',
          amount: 200,
          unit: 'g',
          scalePolicy: 'LINEAR' as const,
          preparation: null,
          isOptional: false,
        },
        {
          id: 5,
          name: 'Cải ngọt',
          category: 'PRODUCE',
          amount: 300,
          unit: 'g',
          scalePolicy: 'LINEAR' as const,
          preparation: null,
          isOptional: false,
        },
        {
          id: 6,
          name: 'Hành tím', // Trùng hành tím
          category: 'PRODUCE',
          amount: 2,
          unit: 'củ',
          scalePolicy: 'LINEAR' as const,
          preparation: null,
          isOptional: false,
        },
      ],
    },
    {
      slug: 'dau-hu-chien-gion',
      name: 'Đậu Hũ Chiên Giòn',
      baseServings: 4,
      ingredients: [
        {
          id: 7,
          name: 'Đậu hũ trắng',
          category: 'OTHER',
          amount: 4,
          unit: 'miếng',
          scalePolicy: 'LINEAR' as const,
          preparation: null,
          isOptional: false,
        },
        {
          id: 8,
          name: 'Dầu ăn',
          category: 'PANTRY',
          amount: 100,
          unit: 'ml',
          scalePolicy: 'MANUAL_ADJUST' as const,
          preparation: null,
          isOptional: false,
        },
      ],
    },
  ];

  console.log('--- Test Case Group 1: Khởi tạo danh sách đi chợ & Phân nhóm ---');

  const aggResult = aggregateMealIngredients(mealDishes, 4);

  assert(aggResult.freshItems.length === 5, `Có đúng 5 mặt hàng tươi sống: ${aggResult.freshItems.length}`);
  assert(aggResult.seasoningItems.length === 2, `Có đúng 2 loại gia vị bếp nhà: ${aggResult.seasoningItems.length}`);

  // Quầy thịt cá
  assert(aggResult.categories.meatSeafood.length === 2, 'Quầy thịt cá có 2 món (Thịt ba chỉ, Tôm sú)');
  // Quầy rau củ
  assert(aggResult.categories.produce.length === 2, 'Quầy rau củ có 2 món (Cải ngọt, Hành tím)');
  // Quầy khác
  assert(aggResult.categories.other.length === 1, 'Quầy khác có 1 món (Đậu hũ trắng)');

  // Kiểm tra gộp hành tím
  const hanhTim = aggResult.freshItems.find((i) => i.name === 'Hành tím');
  assert(hanhTim?.totalAmount === 5, `Hành tím gộp đúng 3 + 2 = 5 củ: ${hanhTim?.totalAmount}`);

  console.log('\n--- Test Case Group 2: Theo dõi Tiến độ (Progress Tracking) & Check/Uncheck ---');

  const allKeys = [
    ...aggResult.freshItems.map((i) => i.key),
    ...aggResult.seasoningItems.map((s) => s.key),
  ];
  const total = allKeys.length;
  assert(total === 7, `Tổng cộng có 7 mục cần kiểm tra trong danh sách đi chợ: ${total}`);

  // Giả lập trạng thái checked
  let checkedSet = new Set<string>();

  // Lúc ban đầu
  let percent = total > 0 ? Math.round((checkedSet.size / total) * 100) : 0;
  assert(checkedSet.size === 0 && percent === 0, 'Tiến độ khởi đầu: 0 / 7 (0%)');

  // Tick 1 món tươi: Thịt ba chỉ
  checkedSet.add('thịt ba chỉ__g');
  percent = Math.round((checkedSet.size / total) * 100);
  assert(checkedSet.size === 1 && percent === 14, `Tiến độ sau 1 món: 1 / 7 (14%): ${percent}%`);

  // Tick thêm 2 món
  checkedSet.add('tôm sú__g');
  checkedSet.add('hành tím__củ');
  percent = Math.round((checkedSet.size / total) * 100);
  assert(checkedSet.size === 3 && percent === 43, `Tiến độ khi đạt 3 món: 3 / 7 (43%): ${percent}%`);

  // Bỏ tick 1 món
  checkedSet.delete('tôm sú__g');
  percent = Math.round((checkedSet.size / total) * 100);
  assert(checkedSet.size === 2 && percent === 29, `Bỏ tick giảm đúng tiến độ: 2 / 7 (29%): ${percent}%`);

  // Tick toàn bộ 7 món (Hoàn thành đi chợ)
  allKeys.forEach((k) => checkedSet.add(k));
  percent = Math.round((checkedSet.size / total) * 100);
  const isComplete = checkedSet.size === total;
  assert(checkedSet.size === 7 && percent === 100 && isComplete, 'Tiến độ hoàn thành: 7 / 7 (100%), isComplete = true');

  // Đặt lại (Reset checklist)
  checkedSet.clear();
  percent = Math.round((checkedSet.size / total) * 100);
  assert(checkedSet.size === 0 && percent === 0, 'Đặt lại thành công đưa tiến độ về 0%');

  console.log('\n--- Test Case Group 3: Tiện ích Xuất Văn Bản Sao Chép (Zalo / SMS) ---');

  const dishNames = mealDishes.map((d) => d.name);
  const plainText = generateShoppingPlainText(aggResult, dishNames);

  assert(plainText.includes('🛒 DANH SÁCH ĐI CHỢ — ĂN GÌ MOM'), 'Có tiêu đề chuẩn mực');
  assert(plainText.includes('Khẩu phần: 4 người'), 'Có số khẩu phần');
  assert(plainText.includes('Mâm cơm: Thịt Kho Tiêu, Canh Cải Nấu Tôm, Đậu Hũ Chiên Giòn'), 'Có danh sách 3 món');
  assert(plainText.includes('🥩 THỊT & THỦY HẢI SẢN:'), 'Có phần thịt cá');
  assert(plainText.includes('- Thịt ba chỉ: 400 g'), 'Có dòng Thịt ba chỉ');
  assert(plainText.includes('🥦 RAU CỦ & NÔNG SẢN TƯƠI:'), 'Có phần rau củ');
  assert(plainText.includes('- Hành tím: 5 củ'), 'Có dòng Hành tím gộp 5 củ');
  assert(plainText.includes('🧂 GIA VỊ BẾP NHÀ'), 'Có phần gia vị bếp nhà');
  assert(plainText.includes('- Nước mắm'), 'Có dòng Nước mắm');

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Lỗi ngoại lệ khi chạy test suite:', err);
  process.exit(1);
});
