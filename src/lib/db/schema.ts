import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  doublePrecision,
  timestamp, 
  boolean, 
  pgEnum, 
  primaryKey,
  index,
  uniqueIndex,
  jsonb,
  check,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// 1. ENUMS (Invariants §5.1, §5.2, §5.3, §5.4)
// ============================================================================

export const recipePublishStatusEnum = pgEnum('recipe_publish_status', [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'PUBLISHED',
  'NEEDS_CHANGES',
  'ARCHIVED'
]);

export const mealRoleEnum = pgEnum('meal_role', [
  'MAIN',
  'SOUP',
  'SIDE',
  'ONE_DISH_MEAL',
  'DESSERT',
  'BEVERAGE'
]);

export const scalePolicyEnum = pgEnum('scale_policy', [
  'LINEAR',
  'FIXED',
  'MANUAL_ADJUST'
]);

export const nutritionStatusEnum = pgEnum('nutrition_status', [
  'NO_DATA',
  'INCOMPLETE',
  'ESTIMATED'
]);

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'EDITOR',
  'COOK'
]);

export const taxonomyTypeEnum = pgEnum('taxonomy_type', [
  'CUISINE_REGION',
  'COOKING_METHOD',
  'DIET_PREFERENCE',
  'OCCASION'
]);

export const reportStatusEnum = pgEnum('report_status', [
  'PENDING',
  'RESOLVED',
  'DISMISSED'
]);

export const reportReasonEnum = pgEnum('report_reason', [
  'UNSAFE_FOOD',
  'INCORRECT_RECIPE',
  'COPYRIGHT',
  'INAPPROPRIATE',
  'OTHER'
]);

export const feedbackStatusEnum = pgEnum('feedback_status', [
  'PENDING',
  'APPROVED',
  'REJECTED'
]);

export const diaryMealTypeEnum = pgEnum('diary_meal_type', [
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACK'
]);

// ============================================================================
// 2. CORE ENTITIES
// ============================================================================

// Users / Authors
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('COOK'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Dishes (Khái niệm món ăn tổng quát, VD: "Thịt kho tàu")
export const dishes = pgTable('dishes', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  defaultRole: mealRoleEnum('default_role').notNull().default('MAIN'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('dishes_slug_idx').on(table.slug),
  index('dishes_name_idx').on(table.name),
]);

// Dish Aliases (Tên gọi vùng miền / từ khóa tìm kiếm)
export const dishAliases = pgTable('dish_aliases', {
  id: serial('id').primaryKey(),
  dishId: integer('dish_id').notNull().references(() => dishes.id, { onDelete: 'cascade' }),
  aliasName: text('alias_name').notNull(),
}, (table) => [
  index('dish_aliases_dish_id_idx').on(table.dishId),
  index('dish_aliases_name_idx').on(table.aliasName),
]);

// Recipes (Công thức cụ thể do tác giả soạn)
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  dishId: integer('dish_id').references(() => dishes.id, { onDelete: 'set null' }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  shortDescription: text('short_description').notNull(),
  role: mealRoleEnum('role').notNull().default('MAIN'),
  status: recipePublishStatusEnum('status').notNull().default('DRAFT'),
  baseServings: integer('base_servings').notNull().default(4),
  prepTimeMinutes: integer('prep_time_minutes').notNull().default(15),
  cookTimeMinutes: integer('cook_time_minutes').notNull().default(30),
  difficulty: text('difficulty').notNull().default('Dễ'),
  caloriesPerServing: integer('calories_per_serving'),
  nutritionStatus: nutritionStatusEnum('nutrition_status').notNull().default('NO_DATA'),
  heroImage: text('hero_image'),
  
  // Invariants §5.5: 3 Nhãn kiểm chứng độc lập
  isEditorialReviewed: boolean('is_editorial_reviewed').notNull().default(false),
  isCookTested: boolean('is_cook_tested').notNull().default(false),
  isNutritionVerified: boolean('is_nutrition_verified').notNull().default(false),

  // AG-29: Provenance tracking (Gate P4: nháp có provenance, không tự publish)
  provenance: text('provenance').notNull().default('MANUAL'),

  // AG-15: Publishing & Revision Gate (Invariants §5.1 — RecipeVersion bất biến)
  versionNumber: integer('version_number').notNull().default(1),
  // Bản PUBLISHED gốc mà bản sửa đổi này được nhân bản từ đó (null với bản v1)
  revisionOfId: integer('revision_of_id').references((): AnyPgColumn => recipes.id, { onDelete: 'set null' }),
  reviewNotes: text('review_notes'),
  reviewedById: integer('reviewed_by_id').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  
  // AG-33: Dish Variants, Kitchen Stories & Source Attribution
  region: text('region').notNull().default('GENERAL'),
  kitchenStory: text('kitchen_story'),
  sourceAttribution: text('source_attribution'),
  variantOfId: integer('variant_of_id').references((): AnyPgColumn => recipes.id, { onDelete: 'set null' }),

  // AG-36: Nutrition Engine Snapshot
  nutritionSnapshot: jsonb('nutrition_snapshot'),

  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  // R8: Pricing & Free flag (D66)
  price: integer('price').notNull().default(0),
  isFree: boolean('is_free').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('recipes_slug_idx').on(table.slug),
  index('recipes_role_idx').on(table.role),
  index('recipes_status_idx').on(table.status),
  index('recipes_author_idx').on(table.authorId),
  index('recipes_revision_of_idx').on(table.revisionOfId),
  index('recipes_variant_of_idx').on(table.variantOfId),
  index('recipes_region_idx').on(table.region),
  // R7: nhãn "Đã nấu thử" (Bếp Mom) không bao giờ gắn cho món Chợ công thức
  check(
    'recipes_community_not_cook_tested',
    sql`${table.provenance} <> 'COMMUNITY_SUBMITTED' OR ${table.isCookTested} = false`
  ),
  // R8: ràng buộc khoảng giá món lẻ (0 hoặc 10k-200k)
  check(
    'recipes_price_range_check',
    sql`${table.price} = 0 OR (${table.price} >= 10000 AND ${table.price} <= 200000)`
  ),
]);

// Ingredients (Từ điển nguyên liệu chuẩn hóa)
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull().default('Thực phẩm tươi sống'),
  standardUnit: text('standard_unit').notNull().default('g'),
  isPantryStaple: boolean('is_pantry_staple').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('ingredients_slug_idx').on(table.slug),
  index('ingredients_name_idx').on(table.name),
]);

// Recipe Ingredients (Định lượng nguyên liệu cho công thức - Invariants §5.3, §5.4)
export const recipeIngredients = pgTable('recipe_ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'restrict' }),
  amount: doublePrecision('amount').notNull(),
  unit: text('unit').notNull(),
  scalePolicy: scalePolicyEnum('scale_policy').notNull().default('LINEAR'),
  preparation: text('preparation'),
  isOptional: boolean('is_optional').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
}, (table) => [
  index('recipe_ingredients_recipe_id_idx').on(table.recipeId),
  index('recipe_ingredients_ingredient_id_idx').on(table.ingredientId),
]);

// Cooking Steps (Các bước nấu theo giai đoạn - Invariants §5.3)
export const cookingSteps = pgTable('cooking_steps', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  phaseName: text('phase_name').notNull().default('Chế biến'),
  instruction: text('instruction').notNull(),
  timerSeconds: integer('timer_seconds'),
  tipText: text('tip_text'),
  image: text('image'),
}, (table) => [
  index('cooking_steps_recipe_id_idx').on(table.recipeId),
]);

// Taxonomies (Hệ thống phân loại đa trục)
export const taxonomies = pgTable('taxonomies', {
  id: serial('id').primaryKey(),
  type: taxonomyTypeEnum('type').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
}, (table) => [
  index('taxonomies_type_idx').on(table.type),
  index('taxonomies_slug_idx').on(table.slug),
]);

// Recipe Tags (Bảng nối Recipe - Taxonomy)
export const recipeTags = pgTable('recipe_tags', {
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  taxonomyId: integer('taxonomy_id').notNull().references(() => taxonomies.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.recipeId, table.taxonomyId] }),
  index('recipe_tags_recipe_idx').on(table.recipeId),
  index('recipe_tags_taxonomy_idx').on(table.taxonomyId),
]);

// Meals (Mâm cơm gia đình - MVP P3 ready)
export const meals = pgTable('meals', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().default('Mâm cơm gia đình'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  servings: integer('servings').notNull().default(4),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Meal Items (Các món trong mâm cơm)
export const mealItems = pgTable('meal_items', {
  id: serial('id').primaryKey(),
  mealId: integer('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  role: mealRoleEnum('role').notNull().default('MAIN'),
}, (table) => [
  index('meal_items_meal_id_idx').on(table.mealId),
  index('meal_items_recipe_id_idx').on(table.recipeId),
]);

// Saved Recipes (Món ăn đã lưu riêng tư của người dùng - AG-20)
export const savedRecipes = pgTable('saved_recipes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('saved_recipes_user_recipe_idx').on(table.userId, table.recipeId),
  index('saved_recipes_user_idx').on(table.userId),
  index('saved_recipes_recipe_idx').on(table.recipeId),
]);

// Recipe Reports (Báo cáo vi phạm nội dung từ cộng đồng - AG-32)
export const recipeReports = pgTable('recipe_reports', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  reporterId: integer('reporter_id').references(() => users.id, { onDelete: 'set null' }),
  reporterEmail: text('reporter_email'),
  reason: reportReasonEnum('reason').notNull().default('OTHER'),
  details: text('details'),
  status: reportStatusEnum('status').notNull().default('PENDING'),
  moderatorNotes: text('moderator_notes'),
  resolvedById: integer('resolved_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (table) => [
  index('recipe_reports_recipe_idx').on(table.recipeId),
  index('recipe_reports_status_idx').on(table.status),
  index('recipe_reports_created_at_idx').on(table.createdAt),
]);

// Recipe Cooked Feedbacks (Cộng đồng nấu thử & ảnh thành phẩm - AG-34)
export const recipeCookedFeedbacks = pgTable('recipe_cooked_feedbacks', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  cookName: text('cook_name').notNull(),
  cookEmail: text('cook_email'),
  rating: integer('rating').notNull().default(5),
  notes: text('notes'),
  photoUrl: text('photo_url'),
  status: feedbackStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedById: integer('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
}, (table) => [
  index('recipe_cooked_feedbacks_recipe_idx').on(table.recipeId),
  index('recipe_cooked_feedbacks_status_idx').on(table.status),
  index('recipe_cooked_feedbacks_created_at_idx').on(table.createdAt),
  index('recipe_cooked_feedbacks_user_recipe_idx').on(table.recipeId, table.userId),
  // R7: mỗi người dùng đăng nhập chỉ có 1 đánh giá / công thức
  uniqueIndex('recipe_cooked_feedbacks_user_recipe_uniq')
    .on(table.recipeId, table.userId)
    .where(sql`${table.userId} IS NOT NULL`),
]);

// Creator Profiles (Hồ sơ người nấu công khai — R7 Chợ công thức)
// Bậc uy tín KHÔNG lưu cố định: tính động từ số món/đánh giá (src/lib/creators/tier.ts).
export const creatorProfiles = pgTable('creator_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  bio: text('bio'),
  region: text('region').notNull().default('GENERAL'),
  isPublic: boolean('is_public').notNull().default(true),
  // Chỉ ADMIN được đặt (xác minh CCCD thủ công trong R7)
  identityVerifiedAt: timestamp('identity_verified_at', { withTimezone: true }),
  identityVerifiedById: integer('identity_verified_by_id').references(() => users.id, { onDelete: 'set null' }),
  isProfessional: boolean('is_professional').notNull().default(false),
  sellerTermsAcceptedAt: timestamp('seller_terms_accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('creator_profiles_slug_idx').on(table.slug),
]);

// Recipe Bundles (Bộ công thức / Combo món — R8 D66)
export const recipeBundles = pgTable('recipe_bundles', {
  id: serial('id').primaryKey(),
  creatorId: integer('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  price: integer('price').notNull().default(30000),
  status: text('status').notNull().default('DRAFT'), // DRAFT, PUBLISHED, ARCHIVED
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('recipe_bundles_creator_idx').on(table.creatorId),
  index('recipe_bundles_slug_idx').on(table.slug),
  check(
    'recipe_bundles_price_check',
    sql`${table.price} >= 30000 AND ${table.price} <= 1000000`
  ),
]);

// Recipe Bundle Items (Món trong bộ combo — R8 D66)
export const recipeBundleItems = pgTable('recipe_bundle_items', {
  id: serial('id').primaryKey(),
  bundleId: integer('bundle_id').notNull().references(() => recipeBundles.id, { onDelete: 'cascade' }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull().default(0),
}, (table) => [
  index('recipe_bundle_items_bundle_idx').on(table.bundleId),
  index('recipe_bundle_items_recipe_idx').on(table.recipeId),
  uniqueIndex('recipe_bundle_items_bundle_recipe_uniq').on(table.bundleId, table.recipeId),
]);

// User Entitlements (Quyền sở hữu công thức / bộ công thức — R8 D66)
export const userEntitlements = pgTable('user_entitlements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemType: text('item_type').notNull(), // 'RECIPE' | 'BUNDLE'
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  bundleId: integer('bundle_id').references(() => recipeBundles.id, { onDelete: 'cascade' }),
  grantedReason: text('granted_reason').notNull().default('PROMO_CLAIM'), // 'CREATOR_OWNER' | 'PROMO_CLAIM' | 'BUNDLE_EXPANSION' | 'ADMIN_GRANT'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('user_entitlements_user_idx').on(table.userId),
  uniqueIndex('user_entitlements_user_recipe_uniq')
    .on(table.userId, table.recipeId)
    .where(sql`${table.itemType} = 'RECIPE'`),
  uniqueIndex('user_entitlements_user_bundle_uniq')
    .on(table.userId, table.bundleId)
    .where(sql`${table.itemType} = 'BUNDLE'`),
]);

// Ingredient Nutrition (Bảng thành phần dinh dưỡng nguyên liệu chuẩn Việt Nam - AG-35)
export const ingredientNutrition = pgTable('ingredient_nutrition', {
  id: serial('id').primaryKey(),
  ingredientId: integer('ingredient_id').notNull().unique().references(() => ingredients.id, { onDelete: 'cascade' }),
  source: text('source').notNull().default('VIETNAM_FCT_2007'),
  edibleRate: doublePrecision('edible_rate').notNull().default(1.0),
  calories100g: doublePrecision('calories_100g'),
  protein100g: doublePrecision('protein_100g'),
  fat100g: doublePrecision('fat_100g'),
  carbs100g: doublePrecision('carbs_100g'),
  fiber100g: doublePrecision('fiber_100g'),
  sodium100g: doublePrecision('sodium_100g'),
  isVerified: boolean('is_verified').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('ingredient_nutrition_ingredient_idx').on(table.ingredientId),
  index('ingredient_nutrition_verified_idx').on(table.isVerified),
]);

// Meal Diary Entries (Nhật ký bữa ăn gia đình & Khẩu phần ăn thực tế - AG-37 & AG-38)
export const mealDiaryEntries = pgTable('meal_diary_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  recipeName: text('recipe_name').notNull(),
  diaryDate: text('diary_date').notNull(),
  mealType: diaryMealTypeEnum('meal_type').notNull().default('LUNCH'),
  memberName: text('member_name').notNull().default('Cả nhà'),
  consumedPortion: doublePrecision('consumed_portion').notNull().default(1.0),
  calories: integer('calories').notNull(),
  protein: doublePrecision('protein').notNull(),
  fat: doublePrecision('fat').notNull(),
  carbs: doublePrecision('carbs').notNull(),
  sodium: integer('sodium'),
  fiber: doublePrecision('fiber'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('meal_diary_entries_user_idx').on(table.userId),
  index('meal_diary_entries_user_date_idx').on(table.userId, table.diaryDate),
  index('meal_diary_entries_recipe_idx').on(table.recipeId),
]);

// Storage Location Enum (Vị trí bảo quản thực phẩm - AG-40)
export const storageLocationEnum = pgEnum('storage_location', [
  'FRIDGE',
  'FREEZER',
  'DRY_PANTRY'
]);

// Pantry Items (Kho thực phẩm / Tủ lạnh gia đình - AG-40)
export const pantryItems = pgTable('pantry_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').references(() => ingredients.id, { onDelete: 'set null' }),
  customName: text('custom_name').notNull(),
  quantity: doublePrecision('quantity').notNull().default(1.0),
  unit: text('unit').notNull().default('gam'),
  location: storageLocationEnum('location').notNull().default('FRIDGE'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('pantry_items_user_idx').on(table.userId),
  index('pantry_items_ingredient_idx').on(table.ingredientId),
  index('pantry_items_expires_idx').on(table.expiresAt),
]);

// Weekly Meal Plans (Kế hoạch thực đơn mâm cơm tuần - AG-41)
export const mealPlans = pgTable('meal_plans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planDate: text('plan_date').notNull(), // 'YYYY-MM-DD'
  dayOfWeek: integer('day_of_week').notNull(), // 1 = T2, 7 = CN
  mealType: diaryMealTypeEnum('meal_type').notNull().default('LUNCH'),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  customDishName: text('custom_dish_name'),
  servings: integer('servings').notNull().default(4),
  notes: text('notes'),
  isCompleted: boolean('is_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('meal_plans_user_date_idx').on(table.userId, table.planDate),
  index('meal_plans_recipe_idx').on(table.recipeId),
]);


