// R7 — Kiểm thử Chợ công thức giai đoạn 1 (không tiền):
// nhãn nguồn, bậc uy tín, chống tự đánh giá, chống đánh giá trùng, quyền sửa hồ sơ,
// hồ sơ công khai không lộ email, bộ lọc nguồn, gợi ý ngẫu nhiên chỉ dùng món Bếp Mom.
// Chạy: DATABASE_URL=... npm run test:creator
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../lib/db';
import { users, dishes, recipes, recipeCookedFeedbacks, creatorProfiles } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/password';
import { signToken, SESSION_COOKIE_NAME } from '../lib/auth/session';
import { computeCreatorTier, isValidCreatorSlug, suggestCreatorSlug, TIER_RULES } from '../lib/creators/tier';
import { parseCreatorProfileInput } from '../lib/creators/profileInput';
import { recipeSourceFromProvenance, parseRecipeSourceFilter } from '../lib/recipes/source';
import { validateVerificationFlags } from '../lib/recipes/gate';
import { mapPublicCardRow, type PublicCardRow } from '../lib/recipes/publicQueries';
import { searchPublishedRecipes } from '../lib/recipes/searchQueries';
import { getRandomMealSlugs, resolveMealSelection, queryPublishedMealOptions } from '../lib/meal/mealQueries';
import { getPublicCreatorBySlug, getCreatorStats } from '../lib/creators/queries';
import { isUniqueViolation } from '../lib/db/errors';
import { POST as feedbackPost } from '../app/api/recipes/[id]/feedback/route';
import { GET as creatorGet, PUT as creatorPut } from '../app/api/creator/profile/route';
import { PATCH as adminCreatorPatch } from '../app/api/editor/creators/[userId]/route';

process.env.AUTH_SECRET ||= 'test_valid_auth_secret_with_more_than_32_characters_for_angimom';

const ORIGIN = 'http://localhost:3000';
const RUN = Date.now().toString(36);

function log(msg: string) {
  console.log(`  ✓ ${msg}`);
}

async function sessionCookie(u: { id: number; email: string; displayName: string; role: 'ADMIN' | 'EDITOR' | 'COOK' }) {
  const token = await signToken({ id: u.id, email: u.email, displayName: u.displayName, role: u.role });
  return `${SESSION_COOKIE_NAME}=${token}`;
}

function req(path: string, init: { method?: string; cookie?: string; body?: unknown; sameOrigin?: boolean } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', host: 'localhost:3000' };
  if (init.cookie) headers.cookie = init.cookie;
  if (init.sameOrigin !== false) headers.origin = ORIGIN;
  return new NextRequest(`${ORIGIN}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

function testPureLogic() {
  console.log('\n--- 1. Logic thuần ---');

  assert.equal(recipeSourceFromProvenance('COMMUNITY_SUBMITTED'), 'COMMUNITY');
  assert.equal(recipeSourceFromProvenance('MANUAL'), 'EDITORIAL');
  assert.equal(recipeSourceFromProvenance('AI_ASSISTED'), 'EDITORIAL');
  assert.equal(recipeSourceFromProvenance(null), 'EDITORIAL');
  log('Nhãn nguồn suy ra từ provenance');

  assert.equal(parseRecipeSourceFilter('cho'), 'cho');
  assert.equal(parseRecipeSourceFilter('bep-mom'), 'bep-mom');
  assert.equal(parseRecipeSourceFilter("'; DROP TABLE"), 'all');
  assert.equal(parseRecipeSourceFilter(undefined), 'all');
  log('Bộ lọc ?nguon= chỉ nhận allow-list');

  const base = { identityVerified: true, sellerTermsAccepted: true };
  assert.equal(computeCreatorTier({ ...base, publishedCommunityRecipes: 0, distinctRaters: 50, averageRating: 5 }).tier, 0);
  assert.equal(computeCreatorTier({ ...base, publishedCommunityRecipes: 1, distinctRaters: 0, averageRating: null }).tier, 1);
  const full = {
    publishedCommunityRecipes: TIER_RULES.minPublishedRecipesForTier2,
    distinctRaters: TIER_RULES.minDistinctRatersForTier2,
    averageRating: TIER_RULES.minAverageRatingForTier2,
    ...base,
  };
  assert.equal(computeCreatorTier(full).tier, 2);
  assert.deepEqual(computeCreatorTier(full).missingForNextTier, []);
  const notVerified = computeCreatorTier({ ...full, identityVerified: false });
  assert.equal(notVerified.tier, 1, 'Thiếu xác minh danh tính → không lên bậc 2');
  assert.ok(notVerified.missingForNextTier.some((m) => m.includes('Xác minh danh tính')));
  assert.equal(computeCreatorTier({ ...full, sellerTermsAccepted: false }).tier, 1);
  assert.equal(computeCreatorTier({ ...full, averageRating: 3.9 }).tier, 1);
  assert.equal(computeCreatorTier({ ...full, distinctRaters: 9 }).tier, 1);
  log('Bậc uy tín 0/1/2 đúng ngưỡng, bậc 2 bắt buộc xác minh + điều khoản');

  assert.ok(isValidCreatorSlug('me-bap-hue'));
  assert.ok(!isValidCreatorSlug('ab'));
  assert.ok(!isValidCreatorSlug('Me-Bap'));
  assert.ok(!isValidCreatorSlug('me--bap'));
  assert.ok(!isValidCreatorSlug('../admin'));
  assert.equal(suggestCreatorSlug('Mẹ Bắp Đà Nẵng'), 'me-bap-da-nang');
  log('Slug hồ sơ hợp lệ & gợi ý slug tiếng Việt không dấu');

  const parsed = parseCreatorProfileInput({
    slug: 'me-bap-hue',
    bio: '  Mẹ hai con  ',
    region: 'CENTRAL',
    identityVerified: true,
    isProfessional: true,
    identityVerifiedAt: '2026-01-01',
  });
  assert.ok(parsed.ok);
  if (parsed.ok) {
    assert.equal(parsed.value.bio, 'Mẹ hai con');
    assert.ok(!('identityVerified' in parsed.value), 'Không nhận identityVerified từ người dùng');
    assert.ok(!('isProfessional' in parsed.value), 'Không nhận isProfessional từ người dùng');
  }
  assert.equal(parseCreatorProfileInput({ slug: 'admin' }).ok, false, 'Slug hệ thống bị chặn');
  assert.equal(parseCreatorProfileInput({ slug: 'me-bap', region: 'MARS' }).ok, false);
  assert.equal(parseCreatorProfileInput({ slug: 'me-bap', bio: 'x'.repeat(501) }).ok, false);
  log('Dữ liệu hồ sơ: allow-list, chặn slug hệ thống, giới hạn độ dài');

  const gateErrors = validateVerificationFlags(
    { isEditorialReviewed: true, isCookTested: true, isNutritionVerified: false },
    { caloriesPerServing: null, provenance: 'COMMUNITY_SUBMITTED' }
  );
  assert.ok(gateErrors.some((e) => e.includes('Đã nấu thử')), 'Gate chặn "Đã nấu thử" cho món cộng đồng');
  assert.deepEqual(
    validateVerificationFlags(
      { isEditorialReviewed: true, isCookTested: true, isNutritionVerified: false },
      { caloriesPerServing: null, provenance: 'MANUAL' }
    ),
    []
  );
  log('Gate xuất bản: món cộng đồng không được gắn "Đã nấu thử"');

  const row: PublicCardRow = {
    slug: 'x', name: 'X', shortDescription: '', role: 'MAIN', baseServings: 4, prepTimeMinutes: 5,
    cookTimeMinutes: 10, difficulty: 'Dễ', heroImage: 'javascript:alert(1)', isCookTested: true,
    provenance: 'COMMUNITY_SUBMITTED', authorName: 'Mẹ Bắp', creatorSlug: 'me-bap', creatorIsPublic: false,
    price: 0, isFree: true,
  };
  const card = mapPublicCardRow(row);
  assert.equal(card.isCookTested, false, 'Thẻ món cộng đồng không bao giờ "Đã nấu thử"');
  assert.equal(card.creatorSlug, null, 'Hồ sơ ẩn → không có link');
  assert.equal(card.heroImage, null, 'Ảnh scheme lạ bị loại');
  assert.equal(mapPublicCardRow({ ...row, creatorIsPublic: true }).creatorSlug, 'me-bap');
  const editorial = mapPublicCardRow({ ...row, provenance: 'MANUAL' });
  assert.equal(editorial.isCookTested, true);
  assert.equal(editorial.authorName, null, 'Món Bếp Mom không gắn tên người nấu cộng đồng');
  assert.equal(editorial.creatorSlug, null);
  log('mapPublicCardRow giữ bất biến nhãn & link');
}

async function testDatabaseFlows() {
  console.log('\n--- 2. Luồng DB + API ---');
  const pw = await hashPassword(`R7-${RUN}-Pass!`);
  const createdUserIds: number[] = [];
  const createdRecipeIds: number[] = [];
  let dishId: number | null = null;

  try {
    const mkUser = async (label: string, role: 'ADMIN' | 'EDITOR' | 'COOK') => {
      const [u] = await db
        .insert(users)
        .values({ email: `r7_${label}_${RUN}@example.test`, displayName: `R7 ${label}`, passwordHash: pw, role })
        .returning();
      createdUserIds.push(u.id);
      return u;
    };
    const author = await mkUser('author', 'COOK');
    const rater = await mkUser('rater', 'COOK');
    const other = await mkUser('other', 'COOK');
    const editor = await mkUser('editor', 'EDITOR');
    const admin = await mkUser('admin', 'ADMIN');

    const [dish] = await db
      .insert(dishes)
      .values({ name: `R7 Dish ${RUN}`, slug: `r7-dish-${RUN}`, description: 'R7 test' })
      .returning();
    dishId = dish.id;

    const mkRecipe = async (suffix: string, values: Partial<typeof recipes.$inferInsert>) => {
      const [r] = await db
        .insert(recipes)
        .values({
          dishId: dish.id,
          slug: `r7-${suffix}-${RUN}`,
          name: `R7 ${suffix} ${RUN}`,
          shortDescription: `R7 test ${RUN}`,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          ...values,
        })
        .returning();
      createdRecipeIds.push(r.id);
      return r;
    };
    const communityRecipe = await mkRecipe('cho-main', {
      authorId: author.id, provenance: 'COMMUNITY_SUBMITTED', role: 'MAIN', isEditorialReviewed: true,
    });
    const communityDraft = await mkRecipe('cho-draft', {
      authorId: author.id, provenance: 'COMMUNITY_SUBMITTED', status: 'DRAFT',
    });
    const editorialRecipe = await mkRecipe('bepmom-main', {
      authorId: editor.id, provenance: 'MANUAL', role: 'MAIN', isCookTested: true,
    });

    // CHECK constraint ở tầng DB
    let checkBlocked = false;
    try {
      await db.update(recipes).set({ isCookTested: true }).where(eq(recipes.id, communityRecipe.id));
    } catch {
      checkBlocked = true;
    }
    assert.ok(checkBlocked, 'DB CHECK phải chặn is_cook_tested cho món cộng đồng');
    log('DB CHECK recipes_community_not_cook_tested chặn "Đã nấu thử" cho món cộng đồng');

    const authorCookie = await sessionCookie(author);
    const raterCookie = await sessionCookie(rater);
    const otherCookie = await sessionCookie(other);

    // Chống tự đánh giá
    const selfRes = await feedbackPost(
      req(`/api/recipes/${communityRecipe.id}/feedback`, { method: 'POST', cookie: authorCookie, body: { rating: 5 } }),
      { params: Promise.resolve({ id: String(communityRecipe.id) }) }
    );
    assert.equal(selfRes.status, 403, 'Tác giả tự đánh giá → 403');
    log('Tác giả không thể tự đánh giá công thức của mình (403)');

    // Người khác đánh giá 2 lần → vẫn chỉ 1 bản ghi
    for (const rating of [4, 5]) {
      const r = await feedbackPost(
        req(`/api/recipes/${communityRecipe.id}/feedback`, { method: 'POST', cookie: raterCookie, body: { rating } }),
        { params: Promise.resolve({ id: String(communityRecipe.id) }) }
      );
      assert.equal(r.status, 200, 'Người dùng khác đánh giá thành công');
    }
    const raterRows = await db
      .select({ rating: recipeCookedFeedbacks.rating })
      .from(recipeCookedFeedbacks)
      .where(and(eq(recipeCookedFeedbacks.recipeId, communityRecipe.id), eq(recipeCookedFeedbacks.userId, rater.id)));
    assert.equal(raterRows.length, 1, 'Mỗi người 1 đánh giá / công thức');
    assert.equal(raterRows[0].rating, 5, 'Đánh giá lại = cập nhật');
    log('Đánh giá lại cập nhật bản cũ, không tạo bản trùng');

    // Unique index ở tầng DB
    let dupError: unknown = null;
    try {
      await db.insert(recipeCookedFeedbacks).values({
        recipeId: communityRecipe.id, userId: rater.id, cookName: 'dup', rating: 1, status: 'APPROVED',
      });
    } catch (e) {
      dupError = e;
    }
    assert.ok(dupError && isUniqueViolation(dupError), 'Unique index phải chặn bản trùng (23505)');
    log('Unique index (recipe_id, user_id) chặn đánh giá trùng ở tầng DB');

    // Link ảnh scheme lạ bị từ chối
    const badPhoto = await feedbackPost(
      req(`/api/recipes/${communityRecipe.id}/feedback`, {
        method: 'POST', body: { rating: 3, cookName: 'Khách', photoUrl: 'javascript:alert(1)' },
      }),
      { params: Promise.resolve({ id: String(communityRecipe.id) }) }
    );
    assert.equal(badPhoto.status, 400, 'photoUrl không phải https → 400');
    log('Phản hồi: link ảnh không phải https bị từ chối');

    // Khách (không đăng nhập) vẫn gửi được nhưng chờ duyệt và không tính vào uy tín
    const guestRes = await feedbackPost(
      req(`/api/recipes/${communityRecipe.id}/feedback`, { method: 'POST', body: { rating: 1, cookName: 'Khách' } }),
      { params: Promise.resolve({ id: String(communityRecipe.id) }) }
    );
    assert.equal(guestRes.status, 200);
    const stats = await getCreatorStats(author.id);
    assert.equal(stats.publishedCommunityRecipes, 1, 'Chỉ đếm món cộng đồng PUBLISHED (bỏ bản nháp)');
    assert.equal(stats.distinctRaters, 1, 'Chỉ đếm người đăng nhập, đã duyệt, khác tác giả');
    assert.equal(stats.averageRating, 5);
    log('Thống kê uy tín bỏ qua khách chờ duyệt, bản nháp và tự đánh giá');

    // Hồ sơ người nấu: chưa đăng nhập
    const anonGet = await creatorGet(req('/api/creator/profile'));
    assert.equal(anonGet.status, 401);
    // Thiếu Origin → 403 (CSRF)
    const csrfRes = await creatorPut(
      req('/api/creator/profile', { method: 'PUT', cookie: authorCookie, body: { slug: `r7-${RUN}` }, sameOrigin: false })
    );
    assert.equal(csrfRes.status, 403, 'PUT thiếu Origin bị chặn');
    log('API hồ sơ: 401 khi chưa đăng nhập, 403 khi khác nguồn gốc');

    const authorSlug = `r7-tac-gia-${RUN}`;
    const createRes = await creatorPut(
      req('/api/creator/profile', {
        method: 'PUT',
        cookie: authorCookie,
        body: {
          slug: authorSlug, bio: 'Mẹ nấu ăn ở Huế', region: 'CENTRAL', acceptSellerTerms: true,
          identityVerified: true, isProfessional: true,
        },
      })
    );
    assert.equal(createRes.status, 200);
    const created = await createRes.json();
    assert.equal(created.profile.slug, authorSlug);
    assert.equal(created.profile.identityVerified, false, 'Người dùng không tự xác minh được');
    assert.equal(created.profile.isProfessional, false, 'Người dùng không tự gắn Tiệm/Đầu bếp được');
    assert.equal(created.profile.sellerTermsAccepted, true);
    assert.equal(created.tier, 1);
    log('Tạo hồ sơ: không thể tự đặt identityVerified / isProfessional');

    const takenRes = await creatorPut(
      req('/api/creator/profile', { method: 'PUT', cookie: otherCookie, body: { slug: authorSlug } })
    );
    assert.equal(takenRes.status, 409, 'Slug đã có người dùng → 409');
    log('Slug trùng trả 409');

    // Quyền admin
    const editorCookie = await sessionCookie(editor);
    const adminCookie = await sessionCookie(admin);
    const nonAdmin = await adminCreatorPatch(
      req(`/api/editor/creators/${author.id}`, { method: 'PATCH', cookie: editorCookie, body: { identityVerified: true } }),
      { params: Promise.resolve({ userId: String(author.id) }) }
    );
    assert.equal(nonAdmin.status, 403, 'EDITOR không được xác minh danh tính');
    const selfVerify = await adminCreatorPatch(
      req(`/api/editor/creators/${author.id}`, { method: 'PATCH', cookie: authorCookie, body: { identityVerified: true } }),
      { params: Promise.resolve({ userId: String(author.id) }) }
    );
    assert.equal(selfVerify.status, 403, 'Người nấu không tự xác minh được qua API admin');
    const adminOk = await adminCreatorPatch(
      req(`/api/editor/creators/${author.id}`, {
        method: 'PATCH', cookie: adminCookie, body: { identityVerified: true, isProfessional: true },
      }),
      { params: Promise.resolve({ userId: String(author.id) }) }
    );
    assert.equal(adminOk.status, 200);
    const [verified] = await db
      .select({ at: creatorProfiles.identityVerifiedAt, by: creatorProfiles.identityVerifiedById })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, author.id));
    assert.ok(verified.at, 'Đã ghi mốc xác minh');
    assert.equal(verified.by, admin.id, 'Ghi nhận admin xác minh');
    log('Chỉ ADMIN xác minh danh tính / gắn Tiệm-Đầu bếp; lưu người xác minh');

    // Hồ sơ công khai
    const pub = await getPublicCreatorBySlug(authorSlug);
    assert.ok(pub, 'Hồ sơ công khai tồn tại');
    const serialized = JSON.stringify(pub);
    assert.ok(!serialized.includes(author.email), 'Hồ sơ công khai không lộ email');
    assert.ok(!serialized.includes('identityVerifiedAt') && !serialized.includes('userId'), 'Không lộ trường nội bộ');
    assert.equal(pub!.isProfessional, true);
    assert.deepEqual(pub!.recipes.map((r) => r.slug), [communityRecipe.slug], 'Chỉ món cộng đồng PUBLISHED');
    assert.equal(pub!.recipes[0].source, 'COMMUNITY');
    assert.equal(pub!.recipes[0].creatorSlug, authorSlug);
    assert.ok(!pub!.recipes.some((r) => r.slug === communityDraft.slug), 'Không lộ bản nháp');
    log('Hồ sơ công khai: không email, chỉ món PUBLISHED, có link người nấu');

    // Ẩn hồ sơ
    await creatorPut(
      req('/api/creator/profile', { method: 'PUT', cookie: authorCookie, body: { slug: authorSlug, isPublic: false } })
    );
    assert.equal(await getPublicCreatorBySlug(authorSlug), null, 'Hồ sơ ẩn → không truy cập công khai');
    const [termsRow] = await db
      .select({ at: creatorProfiles.sellerTermsAcceptedAt })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, author.id));
    assert.ok(termsRow.at, 'Đồng ý điều khoản là một chiều (không bị xoá khi lưu lại)');
    await creatorPut(
      req('/api/creator/profile', { method: 'PUT', cookie: authorCookie, body: { slug: authorSlug, isPublic: true } })
    );
    log('Ẩn hồ sơ → 404 công khai; điều khoản đã đồng ý được giữ');

    // Bộ lọc nguồn trong tìm kiếm
    const q = RUN;
    const cho = await searchPublishedRecipes({ q, source: 'cho', limit: 50 });
    const bepMom = await searchPublishedRecipes({ q, source: 'bep-mom', limit: 50 });
    const all = await searchPublishedRecipes({ q, source: 'all', limit: 50 });
    assert.deepEqual(cho.items.map((r) => r.slug), [communityRecipe.slug]);
    assert.equal(cho.totalCount, 1);
    assert.deepEqual(bepMom.items.map((r) => r.slug), [editorialRecipe.slug]);
    assert.equal(all.totalCount, 2);
    assert.equal(cho.items[0].authorName, author.displayName);
    assert.equal(cho.items[0].creatorSlug, authorSlug);
    assert.equal(bepMom.items[0].isCookTested, true);
    log('Bộ lọc nguồn: Chợ / Bếp Mom / Tất cả đếm và trả đúng');

    // Ghép mâm: gợi ý ngẫu nhiên chỉ dùng món Bếp Mom; slug chỉ định rõ vẫn phân giải món Chợ
    const editorialMains = await queryPublishedMealOptions('MAIN', { editorialOnly: true });
    assert.ok(!editorialMains.some((d) => d.slug === communityRecipe.slug), 'editorialOnly loại món Chợ');
    for (let i = 0; i < 20; i++) {
      const pick = await getRandomMealSlugs();
      if (!pick) break;
      assert.notEqual(pick.mainSlug, communityRecipe.slug, 'Gợi ý ngẫu nhiên không lấy món Chợ');
    }
    const explicit = await resolveMealSelection({ mainSlug: communityRecipe.slug });
    assert.equal(explicit.main?.slug, communityRecipe.slug, 'Chọn rõ món Chợ vẫn dùng được trong mâm');
    assert.equal(explicit.main?.source, 'COMMUNITY');
    assert.equal(explicit.main?.isCookTested, false);
    const fallback = await resolveMealSelection({});
    assert.notEqual(fallback.main?.source, 'COMMUNITY', 'Mặc định mâm cơm là món Bếp Mom');
    log('Ghép mâm: ngẫu nhiên/mặc định chỉ Bếp Mom, món Chợ chọn rõ vẫn dùng được');
  } finally {
    if (createdRecipeIds.length > 0) {
      await db.delete(recipeCookedFeedbacks).where(inArray(recipeCookedFeedbacks.recipeId, createdRecipeIds));
      await db.delete(recipes).where(inArray(recipes.id, createdRecipeIds));
    }
    if (dishId !== null) await db.delete(dishes).where(eq(dishes.id, dishId));
    if (createdUserIds.length > 0) {
      await db.delete(creatorProfiles).where(inArray(creatorProfiles.userId, createdUserIds));
      await db.delete(users).where(inArray(users.id, createdUserIds));
    }
    console.log('  · Đã dọn dữ liệu kiểm thử');
  }
}

async function main() {
  console.log('=== R7 — Chợ công thức (giai đoạn 1, miễn phí) ===');
  testPureLogic();
  await testDatabaseFlows();
  console.log('\n🎉 TOÀN BỘ KIỂM THỬ R7 ĐÃ PASS');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Kiểm thử R7 thất bại:', err);
  process.exit(1);
});
