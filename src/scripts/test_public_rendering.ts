import { db, closeDb } from '../lib/db';
import { recipes, ingredients, taxonomies, users, recipeIngredients, cookingSteps, recipeTags } from '../lib/db/schema';
import { inArray, eq } from 'drizzle-orm';
import { publishRecipe, createRevision } from '../lib/recipes/publishing';
import {
  queryPublishedRecipeBySlug,
  queryCurrentSlugForArchived,
  queryPublishedRecipeCards,
  safeImageSrc,
  isValidPublicSlug,
  queryPublicSlugResolution,
} from '../lib/recipes/publicQueries';

// AG-16 — Kiểm thử đọc công thức công khai.
// Tuỳ chọn: đặt PUBLIC_BASE_URL (vd. http://localhost:3100 khi chạy `next start`) để kiểm thêm mã HTTP.

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

const FLAGS = { isEditorialReviewed: true, isCookTested: true, isNutritionVerified: false };

async function run() {
  console.log('--- KIỂM THỬ AG-16: PUBLIC RECIPE RENDERING ---');
  const stamp = Date.now();
  const createdRecipeIds: number[] = [];
  const authorEmail = `ag16-author-${stamp}@test.local`;

  const ings = await db.select().from(ingredients).limit(2);
  const tax = await db.select().from(taxonomies).limit(1);
  if (ings.length < 2) throw new Error('Cần seed nguyên liệu trước (seed_catalog.ts)');

  const [admin] = await db
    .insert(users)
    .values({ email: authorEmail, displayName: 'AG-16 Test Author', role: 'ADMIN' })
    .returning();

  async function makeRecipe(status: 'DRAFT' | 'SUBMITTED', suffix: string) {
    const [r] = await db
      .insert(recipes)
      .values({
        slug: `ag16-test-${stamp}-${suffix}`,
        name: `Thịt kho trứng AG-16 ${suffix}`,
        shortDescription: 'Thịt kho mềm, trứng thấm nước dừa.',
        status,
        heroImage: '/uploads/test/hero.webp',
        authorId: admin.id,
        reviewNotes: 'GHI-CHU-NOI-BO',
      })
      .returning();
    createdRecipeIds.push(r.id);
    await db.insert(recipeIngredients).values([
      { recipeId: r.id, ingredientId: ings[1].id, amount: 2.5, unit: 'muỗng', sortOrder: 2, scalePolicy: 'MANUAL_ADJUST' as const },
      { recipeId: r.id, ingredientId: ings[0].id, amount: 500, unit: 'g', sortOrder: 1 },
    ]);
    await db.insert(cookingSteps).values([
      { recipeId: r.id, stepNumber: 2, phaseName: 'Chế biến', instruction: 'Kho lửa nhỏ 45 phút.', timerSeconds: 2700 },
      { recipeId: r.id, stepNumber: 1, phaseName: 'Sơ chế', instruction: 'Rửa thịt, cắt miếng vừa ăn.' },
    ]);
    if (tax[0]) await db.insert(recipeTags).values({ recipeId: r.id, taxonomyId: tax[0].id });
    return r;
  }

  try {
    console.log('\n1. Tiện ích an toàn');
    check(safeImageSrc('/uploads/recipes/a.webp') === '/uploads/recipes/a.webp', 'Ảnh /uploads hợp lệ được giữ');
    check(safeImageSrc('javascript:alert(1)') === null, 'Chặn javascript: URL');
    check(safeImageSrc('//evil.example/x.png') === null, 'Chặn protocol-relative URL');
    check(safeImageSrc('/uploads/../.env') === null, 'Chặn path traversal');
    check(safeImageSrc('http://insecure.example/x.png') === null, 'Chặn http (chỉ https)');
    check(!isValidPublicSlug("x' OR 1=1--") && !isValidPublicSlug('A'.repeat(5)), 'Slug lạ bị từ chối trước khi truy vấn');

    console.log('\n2. Chỉ bản PUBLISHED là công khai');
    const draft = await makeRecipe('DRAFT', 'draft');
    const submitted = await makeRecipe('SUBMITTED', 'submitted');
    check((await queryPublishedRecipeBySlug(draft.slug)) === null, 'DRAFT không đọc được');
    check((await queryPublishedRecipeBySlug(submitted.slug)) === null, 'SUBMITTED không đọc được');

    const v1Raw = await makeRecipe('SUBMITTED', 'main');
    await publishRecipe(v1Raw.id, admin.id, FLAGS);
    const v1 = await queryPublishedRecipeBySlug(v1Raw.slug);
    check(v1 !== null && v1.name === v1Raw.name, 'PUBLISHED đọc được');

    console.log('\n3. Payload công khai');
    const json = JSON.stringify(v1);
    check(!json.includes(authorEmail), 'Không chứa email tác giả');
    check(!json.includes('GHI-CHU-NOI-BO'), 'Không chứa ghi chú duyệt');
    check(!json.includes('"status"') && !json.includes('reviewedById'), 'Không chứa trường nội bộ (status, reviewedById)');
    check(v1?.authorName === 'AG-16 Test Author', 'Có tên hiển thị tác giả');
    check(v1?.ingredients[0]?.amount === 500 && v1?.ingredients[1]?.amount === 2.5, 'Nguyên liệu theo sortOrder, giữ giá trị gốc');
    check(v1?.ingredients[1]?.scalePolicy === 'MANUAL_ADJUST', 'Giữ scalePolicy để hiển thị "nêm theo khẩu vị"');
    check(v1?.steps[0]?.stepNumber === 1 && v1?.steps[1]?.timerSeconds === 2700, 'Bước nấu theo stepNumber, giữ timer');
    check(v1?.isCookTested === true && v1?.isNutritionVerified === false, 'Nhãn kiểm chứng đúng theo ADMIN duyệt');
    check(typeof v1?.publishedAt === 'string', 'publishedAt dạng chuỗi ISO (serializable cho cache)');

    console.log('\n4. Phiên bản lưu trữ → bản hiện hành');
    const v2Raw = await createRevision(v1Raw.id);
    createdRecipeIds.push(v2Raw.id);
    check((await queryPublishedRecipeBySlug(v2Raw.slug)) === null, 'Bản sửa đổi DRAFT chưa công khai');
    check((await queryCurrentSlugForArchived(v1Raw.slug)) === null, 'Bản đang PUBLISHED không bị redirect');
    await db.update(recipes).set({ status: 'SUBMITTED' }).where(eq(recipes.id, v2Raw.id));
    await publishRecipe(v2Raw.id, admin.id, FLAGS);
    const archivedSlug = `${v1Raw.slug}--v1`;
    check((await queryPublishedRecipeBySlug(archivedSlug)) === null, 'Bản ARCHIVED không hiển thị như bản hiện hành');
    check((await queryCurrentSlugForArchived(archivedSlug)) === v1Raw.slug, 'Slug ARCHIVED trỏ về slug công khai hiện hành');
    check((await queryCurrentSlugForArchived(draft.slug)) === null, 'Slug DRAFT không được resolve (không lộ tồn tại)');
    check((await queryPublishedRecipeBySlug(v1Raw.slug))?.versionNumber === 2, 'Slug công khai phục vụ v2');

    console.log('\n4b. Quyết định của Proxy (trước khi stream)');
    check((await queryPublicSlugResolution(v1Raw.slug)).kind === 'published', 'PUBLISHED → cho qua');
    const r = await queryPublicSlugResolution(archivedSlug);
    check(r.kind === 'redirect' && r.slug === v1Raw.slug, 'ARCHIVED → redirect về bản hiện hành');
    check((await queryPublicSlugResolution(draft.slug)).kind === 'missing', 'DRAFT → missing');
    check((await queryPublicSlugResolution(submitted.slug)).kind === 'missing', 'SUBMITTED → missing');
    check((await queryPublicSlugResolution('_khong-tim-thay')).kind === 'missing', 'Placeholder 404 không phải slug hợp lệ');

    console.log('\n5. Danh sách trang chủ');
    const cards = await queryPublishedRecipeCards(48);
    const slugs = cards.map((c) => c.slug);
    check(slugs.includes(v1Raw.slug), 'Có công thức PUBLISHED');
    check(!slugs.includes(draft.slug) && !slugs.includes(submitted.slug) && !slugs.includes(archivedSlug), 'Không có DRAFT/SUBMITTED/ARCHIVED');

    const base = process.env.PUBLIC_BASE_URL;
    if (base) {
      console.log(`\n6. HTTP (${base})`);
      const get = (path: string) => fetch(new URL(path, base), { redirect: 'manual' });

      const ok = await get(`/cong-thuc/${v1Raw.slug}`);
      const html = await ok.text();
      check(ok.status === 200, `PUBLISHED → 200 (nhận ${ok.status})`);
      check(html.includes('Thịt kho trứng AG-16') && !html.includes(authorEmail), 'HTML có nội dung, không lộ email');
      check(!html.includes('GHI-CHU-NOI-BO'), 'HTML không lộ ghi chú duyệt');

      const d = await get(`/cong-thuc/${draft.slug}`);
      check(d.status === 404, `DRAFT → 404 (nhận ${d.status})`);
      const missing = await get(`/cong-thuc/khong-ton-tai-${stamp}`);
      check(missing.status === 404, `Không tồn tại → 404 (nhận ${missing.status})`);

      const arch = await get(`/cong-thuc/${archivedSlug}`);
      const loc = arch.headers.get('location') || '';
      check(arch.status === 308 && loc.endsWith(`/cong-thuc/${v1Raw.slug}`), `ARCHIVED → 308 về bản hiện hành (nhận ${arch.status} ${loc})`);

      const home = await (await get('/')).text();
      check(home.includes(`/cong-thuc/${v1Raw.slug}`), 'Trang chủ liệt kê công thức PUBLISHED');
      check(!home.includes(draft.slug), 'Trang chủ không liệt kê DRAFT');
    } else {
      console.log('\n(Bỏ qua kiểm thử HTTP — đặt PUBLIC_BASE_URL để chạy)');
    }
  } finally {
    if (createdRecipeIds.length > 0) {
      // Xoá bản sửa đổi trước bản gốc (FK revision_of_id ON DELETE SET NULL nên thứ tự không bắt buộc)
      await db.delete(recipes).where(inArray(recipes.id, createdRecipeIds));
    }
    await db.delete(users).where(eq(users.id, admin.id));
  }

  console.log(`\nKết quả: ${passed} PASS, ${failed} FAIL`);
  return failed;
}

run()
  .then((f) => {
    process.exitCode = f > 0 ? 1 : 0;
  })
  .catch((err) => {
    console.error('Lỗi kiểm thử:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
