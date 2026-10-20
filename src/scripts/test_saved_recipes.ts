// AG-20: Kịch bản kiểm thử tự động toàn diện cho Tính năng Lưu món ăn (Saved Recipes).
// Kiểm tra Invariants §5.1 (chỉ hiện món PUBLISHED), §6.7 (không ép đăng nhập),
// Unique constraint, Cascade delete, and Guest Sync.
// Chạy độc lập: npx tsx src/scripts/test_saved_recipes.ts
import { db } from '../lib/db';
import { recipes, users, dishes, savedRecipes } from '../lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { queryPublishedRecipeCardsBySlugs } from '../lib/recipes/publicQueries';

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
  console.log('  AG-20 — Test Suite: Saved Recipes & Guest Sync');
  console.log('======================================================\n');

  // 1. Tạo test user
  let testUser = await db.query.users.findFirst({
    where: eq(users.email, 'test_saved_user@angimom.vn'),
  });
  if (!testUser) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'test_saved_user@angimom.vn',
        passwordHash: 'dummy_hash',
        displayName: 'Test Saved User',
        role: 'COOK',
      })
      .returning();
    testUser = u;
  }

  // Tạo thêm user thứ 2 để kiểm tra cô lập dữ liệu (data isolation)
  let testUser2 = await db.query.users.findFirst({
    where: eq(users.email, 'test_saved_user_2@angimom.vn'),
  });
  if (!testUser2) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'test_saved_user_2@angimom.vn',
        passwordHash: 'dummy_hash',
        displayName: 'Test Saved User 2',
        role: 'COOK',
      })
      .returning();
    testUser2 = u;
  }

  // 2. Tạo test dish
  let testDish = await db.query.dishes.findFirst({
    where: eq(dishes.name, 'Món Test Đã Lưu AG-20'),
  });
  if (!testDish) {
    const [d] = await db
      .insert(dishes)
      .values({
        name: 'Món Test Đã Lưu AG-20',
        slug: 'mon-test-da-luu-ag20',
        description: 'Món ăn phục vụ kiểm thử lưu món ăn',
      })
      .returning();
    testDish = d;
  }

  // Dọn dẹp dữ liệu cũ nếu có
  await db.delete(savedRecipes).where(inArray(savedRecipes.userId, [testUser.id, testUser2.id]));
  await db.delete(recipes).where(
    inArray(recipes.slug, [
      'test-saved-published-recipe-1',
      'test-saved-published-recipe-2',
      'test-saved-draft-recipe',
      'test-saved-archived-recipe',
    ])
  );

  // 3. Tạo các recipe test với status khác nhau
  const [pubRecipe1] = await db
    .insert(recipes)
    .values({
      dishId: testDish.id,
      authorId: testUser.id,
      name: 'Món Đã Xuất Bản 1',
      slug: 'test-saved-published-recipe-1',
      shortDescription: 'Món mặn đậm đà kiểm thử lưu món 1',
      role: 'MAIN',
      difficulty: 'Dễ',
      baseServings: 4,
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      status: 'PUBLISHED',
      isCookTested: true,
      publishedAt: new Date(),
    })
    .returning();

  const [pubRecipe2] = await db
    .insert(recipes)
    .values({
      dishId: testDish.id,
      authorId: testUser.id,
      name: 'Món Đã Xuất Bản 2',
      slug: 'test-saved-published-recipe-2',
      shortDescription: 'Món canh thanh mát kiểm thử lưu món 2',
      role: 'SOUP',
      difficulty: 'Trung bình',
      baseServings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      status: 'PUBLISHED',
      isCookTested: false,
      publishedAt: new Date(),
    })
    .returning();

  const [draftRecipe] = await db
    .insert(recipes)
    .values({
      dishId: testDish.id,
      authorId: testUser.id,
      name: 'Món Bản Nháp Không Công Khai',
      slug: 'test-saved-draft-recipe',
      shortDescription: 'Món nháp kiểm thử bảo mật',
      role: 'SIDE',
      difficulty: 'Dễ',
      baseServings: 2,
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      status: 'DRAFT',
    })
    .returning();

  const [archivedRecipe] = await db
    .insert(recipes)
    .values({
      dishId: testDish.id,
      authorId: testUser.id,
      name: 'Món Bản Lưu Trữ Cũ',
      slug: 'test-saved-archived-recipe',
      shortDescription: 'Món cũ lưu trữ',
      role: 'SIDE',
      difficulty: 'Dễ',
      baseServings: 2,
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      status: 'ARCHIVED',
    })
    .returning();

  console.log('--- Test Case Group 1: Lưu và Bỏ lưu (Save / Unsave / Idempotence) ---');

  // Test 1.1: Lưu món thành công
  await db.insert(savedRecipes).values({
    userId: testUser.id,
    recipeId: pubRecipe1.id,
  });

  const savedList1 = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.userId, testUser.id));
  assert(savedList1.length === 1 && savedList1[0].recipeId === pubRecipe1.id, 'User lưu thành công công thức 1');

  // Test 1.2: Lưu trùng (Idempotence & onConflictDoNothing)
  await db
    .insert(savedRecipes)
    .values({
      userId: testUser.id,
      recipeId: pubRecipe1.id,
    })
    .onConflictDoNothing();

  const savedListAfterDuplicate = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.userId, testUser.id));
  assert(savedListAfterDuplicate.length === 1, 'Không bị duplicate khi lưu lại cùng 1 món (Unique constraint)');

  // Test 1.3: Lưu thêm món 2
  await db.insert(savedRecipes).values({
    userId: testUser.id,
    recipeId: pubRecipe2.id,
  });
  const savedList2 = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.userId, testUser.id));
  assert(savedList2.length === 2, 'User lưu được nhiều món khác nhau (2 món)');

  // Test 1.4: Cô lập dữ liệu giữa các User
  const savedUser2List = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.userId, testUser2.id));
  assert(savedUser2List.length === 0, 'User 2 không thấy món của User 1 (Data isolation)');

  // Test 1.5: Bỏ lưu món 1
  await db
    .delete(savedRecipes)
    .where(and(eq(savedRecipes.userId, testUser.id), eq(savedRecipes.recipeId, pubRecipe1.id)));

  const savedListAfterUnsave = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.userId, testUser.id));
  assert(
    savedListAfterUnsave.length === 1 && savedListAfterUnsave[0].recipeId === pubRecipe2.id,
    'Bỏ lưu món 1 thành công, món 2 vẫn còn'
  );

  console.log('\n--- Test Case Group 2: Invariants §5.1 (Chỉ hiển thị món PUBLISHED) ---');

  // Test 2.1: Giả sử user có liên kết với món DRAFT hoặc ARCHIVED
  await db.insert(savedRecipes).values([
    { userId: testUser.id, recipeId: draftRecipe.id },
    { userId: testUser.id, recipeId: archivedRecipe.id },
  ]);

  // Query thông qua JOIN với điều kiện status = 'PUBLISHED'
  const visibleSavedRows = await db
    .select({ slug: recipes.slug, name: recipes.name, status: recipes.status })
    .from(savedRecipes)
    .innerJoin(recipes, eq(savedRecipes.recipeId, recipes.id))
    .where(and(eq(savedRecipes.userId, testUser.id), eq(recipes.status, 'PUBLISHED')));

  assert(visibleSavedRows.length === 1, 'Chỉ lấy 1 món PUBLISHED mặc dù trong DB có cả DRAFT & ARCHIVED');
  assert(visibleSavedRows[0].slug === pubRecipe2.slug, 'Món hiển thị đúng là món PUBLISHED (món 2)');
  assert(!visibleSavedRows.some((r) => r.status !== 'PUBLISHED'), 'Tuyệt đối không rò rỉ món DRAFT hoặc ARCHIVED');

  console.log('\n--- Test Case Group 3: queryPublishedRecipeCardsBySlugs API Helper ---');

  // Test 3.1: Query danh sách cards theo slugs
  const requestedSlugs = [
    pubRecipe1.slug,
    pubRecipe2.slug,
    draftRecipe.slug, // Không được trả về
    'slug-khong-ton-tai-xyz', // Không được trả về
  ];
  const cards = await queryPublishedRecipeCardsBySlugs(requestedSlugs);

  assert(cards.length === 2, 'API chỉ trả về đúng 2 cards cho các món PUBLISHED hợp lệ');
  assert(cards.some((c) => c.slug === pubRecipe1.slug), 'Có card của pubRecipe1');
  assert(cards.some((c) => c.slug === pubRecipe2.slug), 'Có card của pubRecipe2');
  assert(!cards.some((c) => c.slug === draftRecipe.slug), 'Không trả về card của món DRAFT');
  assert(!cards.some((c) => c.slug === 'slug-khong-ton-tai-xyz'), 'Không trả về card của slug không tồn tại');

  // Test 3.2: Kiểm tra cấu trúc PublicRecipeCard
  const card1 = cards.find((c) => c.slug === pubRecipe1.slug);
  assert(card1 !== undefined, 'Tìm thấy card1');
  if (card1) {
    assert(card1.totalTimeMinutes === 40, `totalTimeMinutes tính đúng prep + cook (15 + 25 = 40): ${card1.totalTimeMinutes}`);
    assert(card1.isCookTested === true, 'Giữ đúng cờ isCookTested');
    assert(card1.baseServings === 4, 'Giữ đúng baseServings');
    assert(!('authorId' in card1) && !('authorEmail' in card1), 'Không rò rỉ thông tin riêng tư author');
  }

  // Test 3.3: Edge case: mảng rỗng
  const emptyCards = await queryPublishedRecipeCardsBySlugs([]);
  assert(emptyCards.length === 0, 'Truy vấn mảng rỗng trả về mảng rỗng');

  // Test 3.4: Edge case: slug không hợp lệ / injection
  const injectionCards = await queryPublishedRecipeCardsBySlugs(["' OR 1=1 --", 'SELECT * FROM recipes']);
  assert(injectionCards.length === 0, 'Slug không hợp lệ bị loại bỏ an toàn');

  console.log('\n--- Test Case Group 4: Khách Vãng Lai Đồng Bộ (Guest Sync Simulation) ---');

  // Giả lập guest lưu ở localStorage các slugs: [pubRecipe1.slug, 'invalid-slug', pubRecipe2.slug]
  const guestLocalSlugs = [pubRecipe1.slug, 'fake-slug-random', pubRecipe2.slug];

  // Xóa danh sách của user2 để đồng bộ mới
  await db.delete(savedRecipes).where(eq(savedRecipes.userId, testUser2.id));

  // Thực hiện đồng bộ: lấy recipes PUBLISHED khớp với slugs
  const validForSync = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(inArray(recipes.slug, guestLocalSlugs), eq(recipes.status, 'PUBLISHED')));

  assert(validForSync.length === 2, 'Lọc đúng 2 recipes hợp lệ từ mảng của khách');

  // Insert onConflictDoNothing
  await db
    .insert(savedRecipes)
    .values(validForSync.map((r) => ({ userId: testUser2.id, recipeId: r.id })))
    .onConflictDoNothing();

  const user2Synced = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.userId, testUser2.id));
  assert(user2Synced.length === 2, 'User 2 nhận đúng 2 món đồng bộ từ khách');

  // Đồng bộ lại lần nữa (idempotence)
  await db
    .insert(savedRecipes)
    .values(validForSync.map((r) => ({ userId: testUser2.id, recipeId: r.id })))
    .onConflictDoNothing();

  const user2SyncedAgain = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.userId, testUser2.id));
  assert(user2SyncedAgain.length === 2, 'Đồng bộ lại không gây trùng lặp bản ghi');

  console.log('\n--- Test Case Group 5: Ràng buộc Cascade Delete ---');

  // Tạo recipe tạm để kiểm tra cascade
  const [tempRecipe] = await db
    .insert(recipes)
    .values({
      dishId: testDish.id,
      authorId: testUser.id,
      name: 'Món Tạm Kiểm Tra Cascade',
      slug: 'temp-recipe-for-cascade',
      shortDescription: 'Mô tả ngắn',
      role: 'SIDE',
      difficulty: 'Dễ',
      baseServings: 2,
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      status: 'PUBLISHED',
    })
    .returning();

  await db.insert(savedRecipes).values({
    userId: testUser.id,
    recipeId: tempRecipe.id,
  });

  const checkTempSavedBefore = await db
    .select()
    .from(savedRecipes)
    .where(and(eq(savedRecipes.userId, testUser.id), eq(savedRecipes.recipeId, tempRecipe.id)));
  assert(checkTempSavedBefore.length === 1, 'Đã lưu món tạm thành công');

  // Xóa recipe -> bản ghi trong saved_recipes phải tự động mất (cascade)
  await db.delete(recipes).where(eq(recipes.id, tempRecipe.id));

  const checkTempSavedAfter = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.recipeId, tempRecipe.id));
  assert(checkTempSavedAfter.length === 0, 'Bản ghi saved_recipes tự động xóa khi recipe bị xóa (Cascade delete)');

  // Dọn dẹp
  await db.delete(savedRecipes).where(inArray(savedRecipes.userId, [testUser.id, testUser2.id]));
  await db.delete(recipes).where(
    inArray(recipes.slug, [
      'test-saved-published-recipe-1',
      'test-saved-published-recipe-2',
      'test-saved-draft-recipe',
      'test-saved-archived-recipe',
    ])
  );

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Lỗi ngoại lệ khi chạy test suite:', err);
  process.exit(1);
});
