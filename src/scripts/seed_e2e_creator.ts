// R7 — Seed dữ liệu E2E cho Chợ công thức: 1 người nấu cộng đồng có hồ sơ công khai
// và 1 công thức COMMUNITY_SUBMITTED đã xuất bản. Chỉ dùng cho DB test (tên kết thúc `_test`).
// Mật khẩu ngẫu nhiên, không ai đăng nhập bằng tài khoản này.
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { users, dishes, recipes, recipeIngredients, cookingSteps, creatorProfiles } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/password';

export const E2E_CREATOR = {
  email: 'creator_e2e@example.test',
  displayName: 'Mẹ Bắp E2E',
  slug: 'me-bap-e2e',
  recipeSlug: 'ga-kho-gung-me-bap-e2e',
  recipeName: 'Gà kho gừng Mẹ Bắp',
  paidRecipeSlug: 'vit-kho-gung-me-bap-e2e',
  paidRecipeName: 'Vịt kho gừng Mẹ Bắp',
  paidPrice: 35000,
};

async function main() {
  const dbName = new URL(process.env.DATABASE_URL ?? '').pathname.replace(/^\//, '');
  if (!dbName.endsWith('_test')) {
    console.error('[seed-e2e-creator] Từ chối chạy ngoài DB test (_test).');
    process.exit(2);
  }

  const passwordHash = await hashPassword(randomBytes(24).toString('base64url'));
  const [user] = await db
    .insert(users)
    .values({ email: E2E_CREATOR.email, displayName: E2E_CREATOR.displayName, passwordHash, role: 'COOK' })
    .onConflictDoUpdate({ target: users.email, set: { displayName: E2E_CREATOR.displayName } })
    .returning();

  await db
    .insert(creatorProfiles)
    .values({
      userId: user.id,
      slug: E2E_CREATOR.slug,
      bio: 'Mẹ hai con ở Huế, chuyên món kho và canh chua.',
      region: 'CENTRAL',
      isPublic: true,
    })
    .onConflictDoNothing();

  const [dish] = await db
    .insert(dishes)
    .values({ name: 'Gà kho gừng', slug: 'ga-kho-gung-e2e', description: 'Món gà kho gừng cơm nhà' })
    .onConflictDoNothing()
    .returning();
  const dishId = dish?.id ?? (await db.query.dishes.findFirst({ where: eq(dishes.slug, 'ga-kho-gung-e2e') }))!.id;

  const existing = await db.query.recipes.findFirst({ where: eq(recipes.slug, E2E_CREATOR.recipeSlug) });
  if (!existing) {
    const [recipe] = await db
      .insert(recipes)
      .values({
        dishId,
        authorId: user.id,
        slug: E2E_CREATOR.recipeSlug,
        name: E2E_CREATOR.recipeName,
        shortDescription: 'Gà kho gừng đậm đà, thơm cay theo cách nhà Mẹ Bắp.',
        role: 'MAIN',
        status: 'PUBLISHED',
        provenance: 'COMMUNITY_SUBMITTED',
        isEditorialReviewed: true,
        isCookTested: false,
        publishedAt: new Date(),
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
      })
      .returning();

    const anyIngredient = await db.query.ingredients.findFirst({ columns: { id: true } });
    if (anyIngredient) {
      await db.insert(recipeIngredients).values({
        recipeId: recipe.id, ingredientId: anyIngredient.id, amount: 500, unit: 'g', sortOrder: 0,
      });
    }
    await db.insert(cookingSteps).values([
      { recipeId: recipe.id, stepNumber: 1, phaseName: 'Sơ chế', instruction: 'Gà rửa sạch, chặt miếng vừa ăn, ướp gừng.' },
      { recipeId: recipe.id, stepNumber: 2, phaseName: 'Kho', instruction: 'Kho lửa nhỏ đến khi nước sánh lại.' },
    ]);
  }

  // R8: Seed công thức cộng đồng có phí
  const existingPaid = await db.query.recipes.findFirst({ where: eq(recipes.slug, E2E_CREATOR.paidRecipeSlug) });
  if (!existingPaid) {
    const [paidRecipe] = await db
      .insert(recipes)
      .values({
        dishId,
        authorId: user.id,
        slug: E2E_CREATOR.paidRecipeSlug,
        name: E2E_CREATOR.paidRecipeName,
        shortDescription: 'Vịt kho gừng gia truyền độc quyền của Mẹ Bắp.',
        role: 'MAIN',
        status: 'PUBLISHED',
        provenance: 'COMMUNITY_SUBMITTED',
        price: E2E_CREATOR.paidPrice,
        isFree: false,
        isEditorialReviewed: true,
        isCookTested: false,
        publishedAt: new Date(),
        prepTimeMinutes: 20,
        cookTimeMinutes: 40,
      })
      .returning();

    const anyIngredient = await db.query.ingredients.findFirst({ columns: { id: true } });
    if (anyIngredient) {
      await db.insert(recipeIngredients).values({
        recipeId: paidRecipe.id, ingredientId: anyIngredient.id, amount: 600, unit: 'g', sortOrder: 0,
      });
    }
    await db.insert(cookingSteps).values([
      { recipeId: paidRecipe.id, stepNumber: 1, phaseName: 'Sơ chế', instruction: 'Thịt vịt xát muối gừng khử mùi hôi đặc trưng.' },
      { recipeId: paidRecipe.id, stepNumber: 2, phaseName: 'Kho', instruction: 'Kho thịt vịt với nước dừa tươi cho ngấm gia vị.' },
    ]);
  }

  console.log('[seed-e2e-creator] ✓ Người nấu & công thức Chợ công thức (miễn phí & có phí) cho E2E');
}

if (process.argv[1]?.includes('seed_e2e_creator')) {
  main().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

