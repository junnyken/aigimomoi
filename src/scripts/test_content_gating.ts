// R8 — Bộ kiểm thử tự động cho Khóa nội dung, Gói công thức & Quyền sở hữu (D66)
// Chạy bằng: npx tsx src/scripts/test_content_gating.ts

import assert from 'node:assert/strict';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { 
  users, 
  recipes, 
  creatorProfiles, 
  userEntitlements, 
  recipeBundles, 
  recipeBundleItems 
} from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { 
  validateRecipePrice, 
  validateBundlePricing, 
  formatPriceVND, 
  PRICING_RULES 
} from '@/lib/gating/pricing';
import { 
  canAccessRecipe, 
  filterRecipeForViewer 
} from '@/lib/gating/entitlements';
import { 
  claimRecipePromo, 
  claimBundlePromo, 
  getUserRecipeEntitlements 
} from '@/lib/gating/queries';

const RUN = Date.now().toString(36);

function log(label: string) {
  console.log(`  ✓ PASS: ${label}`);
}

// ============================================================================
// 1. KIỂM THỬ LOGIC THUẦN (Zero DB)
// ============================================================================
function testPureLogic() {
  console.log('\n--- 1. Kiểm thử Logic Thuần (Pricing, Gating & Entitlements) ---');

  // 1.1 Giá món lẻ
  const freeVal = validateRecipePrice(0, 0, 'COOK');
  assert.equal(freeVal.ok, true);
  assert.equal(freeVal.normalizedPrice, 0);

  // Bậc 0 & 1 không được đặt giá
  const tier1Val = validateRecipePrice(25000, 1, 'COOK');
  assert.equal(tier1Val.ok, false);
  assert.match(tier1Val.error || '', /Bậc 2/);

  // Bậc 2 được đặt giá đúng chuẩn
  const tier2Valid = validateRecipePrice(25000, 2, 'COOK');
  assert.equal(tier2Valid.ok, true);
  assert.equal(tier2Valid.normalizedPrice, 25000);

  // Giá ngoài khoảng hoặc không phải bội số của 1.000
  const tooLow = validateRecipePrice(5000, 2, 'COOK');
  assert.equal(tooLow.ok, false);
  const tooHigh = validateRecipePrice(250000, 2, 'COOK');
  assert.equal(tooHigh.ok, false);
  const notStep = validateRecipePrice(15500, 2, 'COOK');
  assert.equal(notStep.ok, false);

  // Admin luôn được đặt giá
  const adminVal = validateRecipePrice(50000, 0, 'ADMIN');
  assert.equal(adminVal.ok, true);
  log('Quy tắc giá món lẻ: Bậc 0/1 bị chặn, Bậc 2 và Admin đặt 10k-200k chuẩn bước');

  // 1.2 Giá bộ công thức
  const bundleFew = validateBundlePricing(50000, 1, 2, 'COOK');
  assert.equal(bundleFew.ok, false);
  assert.match(bundleFew.error || '', /từ 2 đến 50 món/);

  const bundleTier1 = validateBundlePricing(50000, 3, 1, 'COOK');
  assert.equal(bundleTier1.ok, false);

  const bundleValid = validateBundlePricing(50000, 3, 2, 'COOK');
  assert.equal(bundleValid.ok, true);
  assert.equal(bundleValid.normalizedPrice, 50000);

  const bundleTooLow = validateBundlePricing(20000, 3, 2, 'COOK');
  assert.equal(bundleTooLow.ok, false);
  log('Quy tắc giá bộ combo: Bậc 2, 2-50 món, 30k-1M chuẩn bước');

  // 1.3 Ma trận quyền truy cập
  const edRecipe = { recipeId: 1, provenance: 'EDITORIAL', isFree: false, price: 50000, authorId: 10 };
  assert.equal(canAccessRecipe(edRecipe, null, new Set()), true, 'Bếp Mom luôn mở');

  const freeCommRecipe = { recipeId: 2, provenance: 'COMMUNITY_SUBMITTED', isFree: true, price: 0, authorId: 10 };
  assert.equal(canAccessRecipe(freeCommRecipe, null, new Set()), true, 'Món cộng đồng miễn phí luôn mở');

  const paidRecipe = { recipeId: 3, provenance: 'COMMUNITY_SUBMITTED', isFree: false, price: 25000, authorId: 10 };
  assert.equal(canAccessRecipe(paidRecipe, null, new Set()), false, 'Khách chưa đăng nhập không có quyền xem món có phí');
  assert.equal(canAccessRecipe(paidRecipe, 99, new Set()), false, 'Người dùng chưa sở hữu bị từ chối');
  assert.equal(canAccessRecipe(paidRecipe, 10, new Set()), true, 'Chính tác giả luôn có quyền xem');
  assert.equal(canAccessRecipe(paidRecipe, 99, new Set([3])), true, 'Người đã sở hữu được phép xem');
  log('Ma trận quyền truy cập: Bếp Mom, miễn phí, tác giả, người đã claim');

  // 1.4 Lọc nội dung Server-side
  const fullRecipe = {
    id: 3,
    name: 'Gà kho gừng',
    ingredients: [{ id: 1, name: 'Gà ta', amount: 500 }],
    steps: [{ id: 1, instruction: 'Ướp thịt gà' }],
    tips: 'Ướp kỹ',
    videoUrl: 'https://video.example.com',
  };

  const allowed = filterRecipeForViewer(fullRecipe, true);
  assert.equal(allowed.isGated, false);
  assert.equal(allowed.ingredients.length, 1);
  assert.equal(allowed.steps.length, 1);

  const blocked = filterRecipeForViewer(fullRecipe, false);
  assert.equal(blocked.isGated, true);
  assert.equal(blocked.gatedReason, 'REQUIRES_PURCHASE');
  assert.equal(blocked.ingredients.length, 0, 'Nguyên liệu bị làm rỗng khi chưa mua');
  assert.equal(blocked.steps.length, 0, 'Các bước bị làm rỗng khi chưa mua');
  assert.equal(blocked.tips, null);
  assert.equal(blocked.videoUrl, null);
  log('Bộ lọc Server-side: xóa sạch nguyên liệu và các bước khi chưa sở hữu');
}

// ============================================================================
// 2. KIỂM THỬ LUỒNG CSDL & QUERIES THỰC TẾ
// ============================================================================
async function testDatabaseFlows() {
  console.log('\n--- 2. Kiểm thử Luồng CSDL & API Claim Entitlements ---');
  const createdUserIds: number[] = [];
  const createdRecipeIds: number[] = [];
  const createdBundleIds: number[] = [];

  try {
    const pw = await hashPassword(`R8-${RUN}-Pass!`);

    // 2.1 Tạo Tác giả Bậc 2
    const [author] = await db
      .insert(users)
      .values({
        email: `r8_author_${RUN}@example.test`,
        displayName: 'Đầu Bếp Hùng R8',
        passwordHash: pw,
        role: 'COOK',
      })
      .returning();
    createdUserIds.push(author.id);

    await db.insert(creatorProfiles).values({
      userId: author.id,
      slug: `bep-hung-${RUN}`,
      bio: 'Bếp trưởng với 15 năm kinh nghiệm cơm niêu.',
      identityVerifiedAt: new Date(),
      sellerTermsAcceptedAt: new Date(),
    });

    // 2.2 Tạo 2 món có phí thuộc tác giả
    const [recipe1] = await db
      .insert(recipes)
      .values({
        slug: `ca-kho-to-${RUN}`,
        name: 'Cá Kho Tộ Gia Truyền',
        shortDescription: 'Cá kho tộ đậm đà màu cánh gián',
        provenance: 'COMMUNITY_SUBMITTED',
        authorId: author.id,
        price: 25000,
        isFree: false,
        status: 'PUBLISHED',
      })
      .returning();
    createdRecipeIds.push(recipe1.id);

    const [recipe2] = await db
      .insert(recipes)
      .values({
        slug: `canh-cua-dong-${RUN}`,
        name: 'Canh Cua Đồng Mồng Tơi',
        shortDescription: 'Canh cua thanh mát ngày hè',
        provenance: 'COMMUNITY_SUBMITTED',
        authorId: author.id,
        price: 20000,
        isFree: false,
        status: 'PUBLISHED',
      })
      .returning();
    createdRecipeIds.push(recipe2.id);

    // 2.3 Tạo Người dùng người mua (COOK)
    const [buyer] = await db
      .insert(users)
      .values({
        email: `r8_buyer_${RUN}@example.test`,
        displayName: 'Mẹ Bỉm Mua Hàng',
        passwordHash: pw,
        role: 'COOK',
      })
      .returning();
    createdUserIds.push(buyer.id);

    // Kiểm tra ban đầu: buyer chưa sở hữu món nào
    let buyerEntitlements = await getUserRecipeEntitlements(buyer.id);
    assert.equal(buyerEntitlements.has(recipe1.id), false);
    assert.equal(buyerEntitlements.has(recipe2.id), false);
    log('Người dùng mới chưa sở hữu bất kỳ công thức có phí nào');

    // 2.4 Claim món lẻ 1
    const claimRes1 = await claimRecipePromo(buyer.id, recipe1.id);
    assert.equal(claimRes1.success, true);
    assert.match(claimRes1.message, /Mở khóa thành công/);

    buyerEntitlements = await getUserRecipeEntitlements(buyer.id);
    assert.equal(buyerEntitlements.has(recipe1.id), true, 'Sau claim: món 1 đã được sở hữu');
    assert.equal(buyerEntitlements.has(recipe2.id), false, 'Món 2 vẫn chưa sở hữu');
    log('Claim công thức lẻ thành công, cấp quyền chính xác');

    // Claim lại món 1 -> trả alreadyOwned
    const claimDuplicate = await claimRecipePromo(buyer.id, recipe1.id);
    assert.equal(claimDuplicate.success, true);
    assert.equal(claimDuplicate.alreadyOwned, true);
    log('Claim trùng lặp được xử lý mượt mà (idempotent)');

    // 2.5 Tạo Bộ công thức (Bundle) chứa cả món 1 và món 2
    const [bundle] = await db
      .insert(recipeBundles)
      .values({
        creatorId: author.id,
        slug: `combo-com-que-${RUN}`,
        title: 'Combo Cơm Quê Miền Bắc',
        description: 'Trọn gói cá kho tộ và canh cua',
        price: 35000,
        status: 'PUBLISHED',
      })
      .returning();
    createdBundleIds.push(bundle.id);

    await db.insert(recipeBundleItems).values([
      { bundleId: bundle.id, recipeId: recipe1.id, orderIndex: 0 },
      { bundleId: bundle.id, recipeId: recipe2.id, orderIndex: 1 },
    ]);

    // Tạo thêm người dùng thứ hai mua trọn bộ combo
    const [bundleBuyer] = await db
      .insert(users)
      .values({
        email: `r8_bundle_buyer_${RUN}@example.test`,
        displayName: 'Người Mua Combo',
        passwordHash: pw,
        role: 'COOK',
      })
      .returning();
    createdUserIds.push(bundleBuyer.id);

    // Mua trọn combo
    const bundleClaim = await claimBundlePromo(bundleBuyer.id, bundle.id);
    assert.equal(bundleClaim.success, true);

    const comboBuyerEntitlements = await getUserRecipeEntitlements(bundleBuyer.id);
    assert.equal(comboBuyerEntitlements.has(recipe1.id), true, 'Sở hữu món 1 qua combo');
    assert.equal(comboBuyerEntitlements.has(recipe2.id), true, 'Sở hữu món 2 qua combo');
    log('Claim Bộ combo mở khóa tự động toàn bộ món trong combo');

  } finally {
    // Dọn dẹp dữ liệu test
    if (createdBundleIds.length > 0) {
      await db.delete(recipeBundles).where(sql`${recipeBundles.id} IN ${createdBundleIds}`);
    }
    if (createdRecipeIds.length > 0) {
      await db.delete(recipes).where(sql`${recipes.id} IN ${createdRecipeIds}`);
    }
    if (createdUserIds.length > 0) {
      await db.delete(users).where(sql`${users.id} IN ${createdUserIds}`);
    }
    console.log('  · Đã dọn dẹp sạch dữ liệu kiểm thử R8 trong DB');
  }
}

async function main() {
  console.log('=== R8 — Khóa nội dung, Gói công thức & Quyền sở hữu (D66) ===');
  testPureLogic();
  await testDatabaseFlows();
  console.log('\n================================================================');
  console.log('🎉 TOÀN BỘ CÁC BƯỚC TEST R8 ĐÃ ĐẠT CHUẨN PASS 100%!');
  console.log('================================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Kiểm thử R8 thất bại:', err);
  process.exit(1);
});
