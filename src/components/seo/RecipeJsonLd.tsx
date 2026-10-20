import type { PublicRecipe } from '@/lib/recipes/publicQueries';

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

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    headline: recipe.name,
    description: recipe.shortDescription,
    image: recipe.heroImage ? [recipe.heroImage] : undefined,
    url: `${siteUrl}/cong-thuc/${recipe.slug}`,
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
    recipeIngredient: recipe.ingredients.map(
      (ing) => `${ing.name} ${ing.amount} ${ing.unit}${ing.preparation ? ` (${ing.preparation})` : ''}`
    ),
    recipeInstructions: recipe.steps.map((step) => ({
      '@type': 'HowToStep',
      name: `Bước ${step.stepNumber}: ${step.phaseName}`,
      text: step.instruction,
      url: `${siteUrl}/cong-thuc/${recipe.slug}#step-${step.stepNumber}`,
    })),
    keywords: recipe.tags.map((t) => t.name).join(', '),
  };

  return schema;
}

export function RecipeJsonLd({ recipe }: { recipe: PublicRecipe }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://angimom.vn';
  const schema = buildRecipeJsonLd(recipe, baseUrl);

  // Serialize an toàn chống XSS breakout
  const safeJson = JSON.stringify(schema).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}
