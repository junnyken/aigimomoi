import { relations } from 'drizzle-orm';
import {
  users,
  dishes,
  dishAliases,
  recipes,
  ingredients,
  recipeIngredients,
  cookingSteps,
  taxonomies,
  recipeTags,
  meals,
  mealItems,
  savedRecipes,
  recipeReports,
  recipeCookedFeedbacks,
  ingredientNutrition,
  mealDiaryEntries,
} from './schema';

export const usersRelations = relations(users, ({ many }) => ({
  recipes: many(recipes),
  meals: many(meals),
  savedRecipes: many(savedRecipes),
  diaryEntries: many(mealDiaryEntries),
  reportsSubmitted: many(recipeReports, { relationName: 'reporterUser' }),
  reportsResolved: many(recipeReports, { relationName: 'moderatorUser' }),
}));

export const dishesRelations = relations(dishes, ({ many }) => ({
  recipes: many(recipes),
  aliases: many(dishAliases),
}));

export const dishAliasesRelations = relations(dishAliases, ({ one }) => ({
  dish: one(dishes, {
    fields: [dishAliases.dishId],
    references: [dishes.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  dish: one(dishes, {
    fields: [recipes.dishId],
    references: [dishes.id],
  }),
  author: one(users, {
    fields: [recipes.authorId],
    references: [users.id],
  }),
  ingredients: many(recipeIngredients),
  steps: many(cookingSteps),
  tags: many(recipeTags),
  mealItems: many(mealItems),
  savedByUsers: many(savedRecipes),
  reports: many(recipeReports),
  cookedFeedbacks: many(recipeCookedFeedbacks),
  variantOf: one(recipes, {
    fields: [recipes.variantOfId],
    references: [recipes.id],
    relationName: 'recipeVariants',
  }),
  variants: many(recipes, {
    relationName: 'recipeVariants',
  }),
}));

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  recipeIngredients: many(recipeIngredients),
  nutrition: one(ingredientNutrition),
}));

export const ingredientNutritionRelations = relations(ingredientNutrition, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [ingredientNutrition.ingredientId],
    references: [ingredients.id],
  }),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const cookingStepsRelations = relations(cookingSteps, ({ one }) => ({
  recipe: one(recipes, {
    fields: [cookingSteps.recipeId],
    references: [recipes.id],
  }),
}));

export const taxonomiesRelations = relations(taxonomies, ({ many }) => ({
  recipeTags: many(recipeTags),
}));

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeTags.recipeId],
    references: [recipes.id],
  }),
  taxonomy: one(taxonomies, {
    fields: [recipeTags.taxonomyId],
    references: [taxonomies.id],
  }),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
  items: many(mealItems),
}));

export const mealItemsRelations = relations(mealItems, ({ one }) => ({
  meal: one(meals, {
    fields: [mealItems.mealId],
    references: [meals.id],
  }),
  recipe: one(recipes, {
    fields: [mealItems.recipeId],
    references: [recipes.id],
  }),
}));

export const savedRecipesRelations = relations(savedRecipes, ({ one }) => ({
  user: one(users, {
    fields: [savedRecipes.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [savedRecipes.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeReportsRelations = relations(recipeReports, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeReports.recipeId],
    references: [recipes.id],
  }),
  reporter: one(users, {
    fields: [recipeReports.reporterId],
    references: [users.id],
    relationName: 'reporterUser',
  }),
  resolvedBy: one(users, {
    fields: [recipeReports.resolvedById],
    references: [users.id],
    relationName: 'moderatorUser',
  }),
}));

export const recipeCookedFeedbacksRelations = relations(recipeCookedFeedbacks, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeCookedFeedbacks.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeCookedFeedbacks.userId],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [recipeCookedFeedbacks.approvedById],
    references: [users.id],
  }),
}));

export const mealDiaryEntriesRelations = relations(mealDiaryEntries, ({ one }) => ({
  user: one(users, {
    fields: [mealDiaryEntries.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [mealDiaryEntries.recipeId],
    references: [recipes.id],
  }),
}));


