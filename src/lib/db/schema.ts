import { pgTable, text, serial, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Invariants §5.1: Recipe Publish Status
export const recipePublishStatusEnum = pgEnum('recipe_publish_status', [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'PUBLISHED',
  'ARCHIVED'
]);

// Invariants §5.2: Meal Roles
export const mealRoleEnum = pgEnum('meal_role', [
  'MAIN',
  'SOUP',
  'SIDE',
  'DISH_1',
  'DISH_2',
  'DISH_3',
  'SNACK',
  'DRINK',
  'DESSERT'
]);

// Invariants §5.3: Ingredient Scaling Policy
export const scalePolicyEnum = pgEnum('scale_policy', [
  'LINEAR',
  'FIXED',
  'MANUAL_ADJUST'
]);

// Standard measurement units
export const unitEnum = pgEnum('measurement_unit', [
  'g',
  'kg',
  'ml',
  'l',
  'teaspoon',
  'tablespoon',
  'piece',
  'bunch',
  'pinch',
  'clove',
  'to_taste'
]);

// Users table (author, editor, cook)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  role: text('role').notNull().default('COOK'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Recipes table
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
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
  heroImage: text('hero_image'),
  isCookTested: boolean('is_cook_tested').notNull().default(false),
  isNutritionVerified: boolean('is_nutrition_verified').notNull().default(false),
  authorId: integer('author_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
