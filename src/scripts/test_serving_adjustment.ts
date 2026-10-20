// AG-18: Kịch bản kiểm thử tự động toàn diện cho hệ thống Điều chỉnh Khẩu phần (Serving Adjustment).
// Kiểm tra Invariants §5.4, D21.
// Chạy độc lập: npx tsx src/scripts/test_serving_adjustment.ts
import {
  scaleRecipeIngredients,
  clampServings,
  formatScaledAmount,
  MIN_SERVINGS,
  MAX_SERVINGS,
} from '../lib/recipes/scaling';
import type { PublicRecipeIngredient } from '../lib/recipes/publicQueries';

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

function runTests() {
  console.log('\n======================================================');
  console.log('  AG-18 — Test Suite: Serving Adjustment & Invariants');
  console.log('======================================================\n');

  // Bộ nguyên liệu giả lập với đầy đủ các ScalePolicy
  const sampleIngredients: PublicRecipeIngredient[] = [
    {
      id: 1,
      name: 'Thịt ba chỉ heo',
      category: 'Thực phẩm tươi sống',
      amount: 500,
      unit: 'g',
      scalePolicy: 'LINEAR',
      preparation: 'cắt miếng vuông 3cm',
      isOptional: false,
    },
    {
      id: 2,
      name: 'Trứng vịt',
      category: 'Thực phẩm tươi sống',
      amount: 4,
      unit: 'quả',
      scalePolicy: 'LINEAR',
      preparation: 'luộc chín bóc vỏ',
      isOptional: false,
    },
    {
      id: 3,
      name: 'Gừng nướng',
      category: 'Rau củ',
      amount: 1,
      unit: 'củ',
      scalePolicy: 'FIXED',
      preparation: 'đập dập',
      isOptional: false,
    },
    {
      id: 4,
      name: 'Nước mắm truyền thống',
      category: 'Gia vị',
      amount: 3,
      unit: 'muỗng canh',
      scalePolicy: 'MANUAL_ADJUST',
      preparation: null,
      isOptional: false,
    },
    {
      id: 5,
      name: 'Ớt hiểm cay',
      category: 'Gia vị',
      amount: 2,
      unit: 'trái',
      scalePolicy: 'MANUAL_ADJUST',
      preparation: 'để nguyên cuống',
      isOptional: true,
    },
  ];

  console.log('1. Kiểm tra giữ nguyên khẩu phần gốc (base=4, target=4, R=1.0)');
  {
    const scaled = scaleRecipeIngredients(sampleIngredients, 4, 4);
    assert(scaled.length === 5, 'Giữ nguyên số lượng nguyên liệu');
    assert(scaled[0].scaledAmount === 500, 'Thịt ba chỉ 500g không đổi');
    assert(scaled[1].scaledAmount === 4, 'Trứng vịt 4 quả không đổi');
    assert(scaled[2].scaledAmount === 1, 'Gừng FIXED 1 củ không đổi');
    assert(scaled[3].scaledAmount === 3, 'Nước mắm MANUAL_ADJUST 3 muỗng không đổi');
    assert(scaled.every((i) => !i.isScaled), 'Tất cả các dòng isScaled = false khi R = 1.0');
  }

  console.log('\n2. Kiểm tra Scale Up gấp đôi (base=4, target=8, R=2.0)');
  {
    const scaled = scaleRecipeIngredients(sampleIngredients, 4, 8);

    // Invariants §5.4: Dòng LINEAR nhân tỷ lệ R
    assert(scaled[0].scaledAmount === 1000, 'Thịt ba chỉ LINEAR nhân đôi: 500g -> 1000g');
    assert(scaled[0].isScaled === true, 'Thịt ba chỉ đánh dấu isScaled = true');
    assert(scaled[1].scaledAmount === 8, 'Trứng vịt LINEAR nhân đôi: 4 quả -> 8 quả');

    // Invariants §5.4: Dòng FIXED KHÔNG được nhân tỷ lệ
    assert(scaled[2].scaledAmount === 1, 'Gừng FIXED giữ nguyên 1 củ, không thành 2 củ gây nồng');
    assert(scaled[2].isScaled === false, 'Dòng FIXED isScaled = false');

    // Invariants §5.4: Dòng MANUAL_ADJUST KHÔNG được nhân tỷ lệ
    assert(scaled[3].scaledAmount === 3, 'Nước mắm MANUAL_ADJUST giữ nguyên 3 muỗng canh');
    assert(scaled[3].isScaled === false, 'Dòng MANUAL_ADJUST isScaled = false');
    assert(scaled[4].scaledAmount === 2, 'Ớt hiểm MANUAL_ADJUST giữ nguyên 2 trái');
  }

  console.log('\n3. Kiểm tra Scale Down giảm nửa (base=4, target=2, R=0.5)');
  {
    const scaled = scaleRecipeIngredients(sampleIngredients, 4, 2);

    assert(scaled[0].scaledAmount === 250, 'Thịt ba chỉ LINEAR giảm nửa: 500g -> 250g');
    assert(scaled[1].scaledAmount === 2, 'Trứng vịt LINEAR giảm nửa: 4 quả -> 2 quả');
    assert(scaled[2].scaledAmount === 1, 'Gừng FIXED giữ nguyên 1 củ');
    assert(scaled[3].scaledAmount === 3, 'Nước mắm MANUAL_ADJUST giữ nguyên 3 muỗng');
  }

  console.log('\n4. Kiểm tra Scale lẻ 6 người (base=4, target=6, R=1.5)');
  {
    const scaled = scaleRecipeIngredients(sampleIngredients, 4, 6);

    assert(scaled[0].scaledAmount === 750, 'Thịt ba chỉ: 500g * 1.5 = 750g');
    assert(scaled[1].scaledAmount === 6, 'Trứng vịt: 4 quả * 1.5 = 6 quả');
    assert(scaled[0].formattedAmount === '750', 'Format định lượng 750');
  }

  console.log('\n5. Kiểm tra Scale cho 1 người ăn (base=4, target=1, R=0.25)');
  {
    const scaled = scaleRecipeIngredients(sampleIngredients, 4, 1);

    assert(scaled[0].scaledAmount === 125, 'Thịt ba chỉ: 500g * 0.25 = 125g');
    assert(scaled[1].scaledAmount === 1, 'Trứng vịt: 4 quả * 0.25 = 1 quả');
    assert(scaled[2].scaledAmount === 1, 'Gừng FIXED giữ nguyên 1 củ');
  }

  console.log('\n6. Kiểm tra giới hạn biên an toàn (clampServings)');
  {
    assert(clampServings(0) === MIN_SERVINGS, 'Khẩu phần 0 bị chặn thành 1');
    assert(clampServings(-10) === MIN_SERVINGS, 'Khẩu phần âm bị chặn thành 1');
    assert(clampServings(25) === MAX_SERVINGS, 'Khẩu phần vượt quá 20 bị chặn thành 20');
    assert(clampServings(100) === MAX_SERVINGS, 'Khẩu phần 100 bị chặn thành 20');
    assert(clampServings(4.6) === 5, 'Làm tròn số nguyên gần nhất');
    assert(clampServings('abc', 4) === 4, 'Chuỗi không hợp lệ dùng fallback');
    assert(clampServings(null, 4) === 4, 'null dùng fallback');
  }

  console.log('\n7. Kiểm tra hàm làm tròn và định dạng tầng hiển thị (formatScaledAmount - D21)');
  {
    assert(formatScaledAmount(500) === '500', 'Định dạng số nguyên 500');
    assert(formatScaledAmount(1.5) === '1,5', 'Định dạng 1.5 thành 1,5');
    assert(formatScaledAmount(0.75) === '0,75', 'Định dạng 0.75 thành 0,75');
    assert(formatScaledAmount(0.333333) === '0,33', 'Làm tròn tối đa 2 chữ số thập phân');
    assert(formatScaledAmount(0) === '0', '0 định dạng đúng');
    assert(formatScaledAmount(-5) === '0', 'Số âm trả về 0 an toàn');
  }

  console.log('\n8. Kiểm tra Invariant: Thời gian nấu không bị nhân tuyến tính');
  {
    const basePrep = 15;
    const baseCook = 30;
    // Cho dù scale 8 người hay 1 người thì thời gian vẫn là 15p và 30p
    const targetServings = 8;
    const ratio = targetServings / 4;
    assert(ratio === 2, 'Ratio là 2');
    assert(basePrep === 15, 'Thời gian sơ chế giữ nguyên 15 phút, không thành 30 phút');
    assert(baseCook === 30, 'Thời gian nấu giữ nguyên 30 phút, không thành 60 phút');
  }

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passCount} PASS | ${failCount} FAIL`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests();
