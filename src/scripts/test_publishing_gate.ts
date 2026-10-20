import { db } from '../lib/db';
import { recipes, ingredients, taxonomies, users, recipeIngredients, cookingSteps, recipeTags } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { publishRecipe, rejectRecipe, createRevision, PublishingError } from '../lib/recipes/publishing';

let passed = 0;
let failed = 0;

function check(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
  }
}

async function expectError(fn: () => Promise<unknown>, status: number, label: string) {
  try {
    await fn();
    check(false, `${label} (không ném lỗi)`);
  } catch (e) {
    check(e instanceof PublishingError && e.status === status, `${label} → HTTP ${status}`);
  }
}

const FLAGS_OK = { isEditorialReviewed: true, isCookTested: true, isNutritionVerified: false };

async function run() {
  console.log('--- KIỂM THỬ AG-15: PUBLISHING & REVISION GATE ---');
  const createdIds: number[] = [];
  const stamp = Date.now();

  const ings = await db.select().from(ingredients).limit(2);
  const tax = await db.select().from(taxonomies).limit(1);
  if (ings.length < 2) throw new Error('Cần seed nguyên liệu trước (seed_catalog.ts)');

  // Tài khoản ADMIN tạm thời (không mật khẩu, không đăng nhập được) — xoá sau khi test
  const [admin] = await db
    .insert(users)
    .values({ email: `ag15-admin-${stamp}@test.local`, displayName: 'AG-15 Test Admin', role: 'ADMIN' })
    .returning();

  async function makeRecipe(opts: { hero: boolean; status: 'DRAFT' | 'SUBMITTED'; calories?: number | null }) {
    const [r] = await db
      .insert(recipes)
      .values({
        slug: `ag15-test-${stamp}-${createdIds.length}`,
        name: 'Canh chua cá lóc (AG-15 test)',
        shortDescription: 'Canh chua miền Tây chua thanh, ngọt cá.',
        status: opts.status,
        heroImage: opts.hero ? '/uploads/test/hero.webp' : null,
        caloriesPerServing: opts.calories ?? null,
      })
      .returning();
    createdIds.push(r.id);
    await db.insert(recipeIngredients).values(
      ings.map((i, idx) => ({ recipeId: r.id, ingredientId: i.id, amount: 100 + idx, unit: 'g', sortOrder: idx + 1 }))
    );
    await db.insert(cookingSteps).values([
      { recipeId: r.id, stepNumber: 1, phaseName: 'Sơ chế', instruction: 'Làm sạch cá, cắt khúc.' },
      { recipeId: r.id, stepNumber: 2, phaseName: 'Chế biến', instruction: 'Nấu nước me, thả cá và rau.' },
    ]);
    if (tax[0]) await db.insert(recipeTags).values({ recipeId: r.id, taxonomyId: tax[0].id });
    return r;
  }

  try {
    console.log('\n1. Gate Check & điều kiện trạng thái');
    const noHero = await makeRecipe({ hero: false, status: 'SUBMITTED' });
    await expectError(() => publishRecipe(noHero.id, admin.id, FLAGS_OK), 422, 'Thiếu ảnh bìa bị chặn');
    const draft = await makeRecipe({ hero: true, status: 'DRAFT' });
    await expectError(() => publishRecipe(draft.id, admin.id, FLAGS_OK), 409, 'Không xuất bản thẳng từ DRAFT');

    console.log('\n2. Luật nhãn kiểm chứng (D23)');
    const v1 = await makeRecipe({ hero: true, status: 'SUBMITTED', calories: null });
    await expectError(
      () => publishRecipe(v1.id, admin.id, { ...FLAGS_OK, isEditorialReviewed: false }),
      422,
      'Bắt buộc xác nhận Đã biên tập'
    );
    await expectError(
      () => publishRecipe(v1.id, admin.id, { ...FLAGS_OK, isNutritionVerified: true }),
      422,
      'Không bật Nutrition Verified khi chưa có calo'
    );

    console.log('\n3. Reject → NEEDS_CHANGES');
    await expectError(() => rejectRecipe(v1.id, admin.id, 'ok'), 400, 'Ghi chú quá ngắn bị từ chối');
    const rejected = await rejectRecipe(v1.id, admin.id, 'Bổ sung dấu hiệu nhận biết cá chín.');
    check(rejected.status === 'NEEDS_CHANGES' && rejected.reviewNotes !== null, 'Trạng thái NEEDS_CHANGES + lưu góp ý');
    await expectError(() => rejectRecipe(v1.id, admin.id, 'Góp ý lần hai'), 409, 'Không reject lại khi không còn SUBMITTED');

    console.log('\n4. Gửi lại & Publish v1');
    await db.update(recipes).set({ status: 'SUBMITTED' }).where(eq(recipes.id, v1.id));
    const pub1 = await publishRecipe(v1.id, admin.id, FLAGS_OK);
    check(pub1.status === 'PUBLISHED', 'v1 PUBLISHED');
    check(pub1.publishedAt !== null && pub1.reviewedById === admin.id, 'Ghi nhận publishedAt / reviewedBy');
    check(pub1.isEditorialReviewed && pub1.isCookTested && !pub1.isNutritionVerified, 'Cờ kiểm chứng đúng theo ADMIN chọn');
    check(pub1.reviewNotes === null, 'Xoá ghi chú cũ khi xuất bản');
    const canonical = pub1.slug;

    console.log('\n5. Tạo revision v2');
    const rev = await createRevision(v1.id);
    createdIds.push(rev.id);
    check(rev.status === 'DRAFT' && rev.versionNumber === 2 && rev.revisionOfId === v1.id, 'v2 DRAFT, revisionOf = v1');
    check(!rev.isEditorialReviewed && !rev.isCookTested, 'Nhãn kiểm chứng được reset (D23)');
    const [revIngs, revSteps, revTags] = await Promise.all([
      db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, rev.id)),
      db.select().from(cookingSteps).where(eq(cookingSteps.recipeId, rev.id)),
      db.select().from(recipeTags).where(eq(recipeTags.recipeId, rev.id)),
    ]);
    check(revIngs.length === ings.length, `Nhân bản ${revIngs.length} nguyên liệu`);
    check(revSteps.length === 2, `Nhân bản ${revSteps.length} bước nấu`);
    check(revTags.length === (tax[0] ? 1 : 0), `Nhân bản ${revTags.length} tag`);
    await expectError(() => createRevision(v1.id), 409, 'Không tạo revision thứ hai khi đã có bản mở');
    await expectError(() => createRevision(rev.id), 409, 'Không tạo revision từ bản chưa PUBLISHED');
    const v1Still = await db.query.recipes.findFirst({ where: eq(recipes.id, v1.id) });
    check(v1Still?.status === 'PUBLISHED', 'v1 vẫn phục vụ người đọc trong khi v2 đang soạn');

    console.log('\n6. Publish v2 thay thế v1');
    await db.update(recipes).set({ status: 'SUBMITTED', cookTimeMinutes: 40 }).where(eq(recipes.id, rev.id));
    const pub2 = await publishRecipe(rev.id, admin.id, FLAGS_OK);
    const v1After = await db.query.recipes.findFirst({ where: eq(recipes.id, v1.id) });
    check(pub2.status === 'PUBLISHED' && pub2.slug === canonical, 'v2 PUBLISHED và tiếp quản slug công khai');
    check(v1After?.status === 'ARCHIVED' && v1After.slug === `${canonical}--v1`, 'v1 ARCHIVED, slug lưu trữ --v1');
    check(v1After?.cookTimeMinutes === 30, 'Nội dung v1 bất biến');
  } finally {
    // Dọn dữ liệu test (revision trỏ về bản gốc nên xoá theo lô)
    if (createdIds.length > 0) {
      await db.delete(recipes).where(inArray(recipes.id, createdIds));
    }
    await db.delete(users).where(eq(users.id, admin.id));
  }

  console.log(`\nKết quả: ${passed} PASS, ${failed} FAIL`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Lỗi kiểm thử:', e instanceof Error ? e.message : e);
  process.exit(1);
});
