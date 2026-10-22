import type { PublicRecipe } from '@/lib/recipes/publicQueries';
import { ROLE_LABELS } from '@/lib/recipes/labels';
import { getSiteUrl, toAbsoluteUrl } from '@/lib/seo/siteConfig';

export function minutesToIsoDuration(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safe / 60);
  const remainingMinutes = safe % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `PT${hours}H${remainingMinutes}M`;
  }
  if (hours > 0) {
    return `PT${hours}H`;
  }
  return `PT${remainingMinutes}M`;
}

export function buildRecipeJsonLd(recipe: PublicRecipe, siteUrl: string) {
  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const absImage = recipe.heroImage
    ? recipe.heroImage.startsWith('http')
      ? recipe.heroImage
      : `${siteUrl.replace(/\/+$/, '')}${recipe.heroImage.startsWith('/') ? '' : '/'}${recipe.heroImage}`
    : undefined;

  const perServingMacro = recipe.nutritionSnapshot?.perServing;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    headline: recipe.name,
    description: recipe.shortDescription,
    image: absImage ? [absImage] : undefined,
    url: `${siteUrl}/cong-thuc/${recipe.slug}`,
    inLanguage: 'vi-VN',
    datePublished: recipe.publishedAt || undefined,
    prepTime: minutesToIsoDuration(recipe.prepTimeMinutes),
    cookTime: minutesToIsoDuration(recipe.cookTimeMinutes),
    totalTime: minutesToIsoDuration(totalMinutes),
    recipeYield: `${recipe.baseServings} người`,
    recipeCategory: recipe.role,
    recipeCuisine: 'Vietnamese',
    author: recipe.authorName
      ? {
          '@type': 'Person',
          name: recipe.authorName,
        }
      : {
          '@type': 'Organization',
          name: 'ĂN GÌ MOM',
        },
    ...(typeof recipe.caloriesPerServing === 'number' && recipe.caloriesPerServing > 0
      ? {
          nutrition: {
            '@type': 'NutritionInformation',
            servingSize: '1 khẩu phần',
            calories: `${recipe.caloriesPerServing} calories`,
            ...(perServingMacro
              ? {
                  proteinContent: `${perServingMacro.protein} g`,
                  fatContent: `${perServingMacro.fat} g`,
                  carbohydrateContent: `${perServingMacro.carbs} g`,
                }
              : {}),
          },
        }
      : {}),
    recipeIngredient: recipe.ingredients.map(
      (ing) => `${ing.name} ${ing.amount} ${ing.unit}${ing.preparation ? ` (${ing.preparation})` : ''}`
    ),
    recipeInstructions: recipe.steps.map((step) => ({
      '@type': 'HowToStep',
      name: `Bước ${step.stepNumber}: ${step.phaseName}`,
      text: step.instruction,
      url: `${siteUrl}/cong-thuc/${recipe.slug}#step-${step.stepNumber}`,
      ...(step.image ? { image: toAbsoluteUrl(step.image) } : {}),
    })),
    keywords: recipe.tags.map((t) => t.name).join(', '),
  };

  return schema;
}

export function buildRecipeBreadcrumbJsonLd(recipe: PublicRecipe, siteUrl: string) {
  const roleLabel = ROLE_LABELS[recipe.role] || 'Món ăn';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Khám phá món ăn',
        item: `${siteUrl}/mon-an`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: roleLabel,
        item: `${siteUrl}/mon-an?role=${encodeURIComponent(recipe.role)}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: recipe.name,
        item: `${siteUrl}/cong-thuc/${recipe.slug}`,
      },
    ],
  };
}

function serializeSafeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function RecipeJsonLd({ recipe }: { recipe: PublicRecipe }) {
  const baseUrl = getSiteUrl();
  const schema = buildRecipeJsonLd(recipe, baseUrl);
  const breadcrumbSchema = buildRecipeBreadcrumbJsonLd(recipe, baseUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSafeJsonLd(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSafeJsonLd(breadcrumbSchema) }}
      />
    </>
  );
}
