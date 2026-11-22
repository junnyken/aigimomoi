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

export interface RecipeSeoFaqItem {
  question: string;
  answer: string;
}

export function buildRecipeFaqItems(recipe: PublicRecipe): RecipeSeoFaqItem[] {
  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const kcal = recipe.caloriesPerServing ?? recipe.nutritionSnapshot?.perServing?.calories ?? null;
  const macro = recipe.nutritionSnapshot?.perServing;
  const topIngs = recipe.ingredients
    .slice(0, 4)
    .map((i) => `${i.name} (${i.amount} ${i.unit})`)
    .join(', ');

  return [
    {
      question: `${recipe.name} bao nhiêu calo? Ăn có béo (mập) không?`,
      answer: kcal
        ? `Theo Bảng Thành Phần Thực Phẩm Việt Nam (Viện Dinh Dưỡng), 1 khẩu phần ${recipe.name} (chia từ nồi ${recipe.baseServings} người) cung cấp khoảng ${kcal} kcal${
            macro ? `, bao gồm ${macro.protein}g chất đạm, ${macro.fat}g chất béo và ${macro.carbs}g đường bột` : ''
          }. Nếu ăn kèm 1 chén cơm vừa và rau xanh, tổng bữa ăn rất cân bằng, không gây tăng cân.`
        : `Món ${recipe.name} được thiết kế cân bằng dinh dưỡng cho mâm cơm gia đình ${recipe.baseServings} người, kết hợp hài hòa giữa đạm và gia vị tự nhiên.`,
    },
    {
      question: `Cách làm ${recipe.name} chuẩn vị mất bao lâu và cần nguyên liệu gì?`,
      answer: `Tổng thời gian thực hiện món ${recipe.name} khoảng ${totalMinutes} phút (sơ chế ${recipe.prepTimeMinutes} phút, nấu ${recipe.cookTimeMinutes} phút) với ${recipe.steps.length} bước chi tiết. Các nguyên liệu chính cho ${recipe.baseServings} người gồm: ${topIngs || 'đầy đủ nguyên liệu tươi theo bảng định lượng'}.`,
    },
    {
      question: `Người giảm cân (Eat Clean) hoặc tập Gym ăn ${recipe.name} thế nào cho tốt?`,
      answer:
        kcal && kcal > 320
          ? `Khi đang giảm cân hoặc giữ dáng, bạn có thể giảm 1/2 lượng dầu/mỡ khi chế biến, hạn chế chan nước sốt/nước kho béo lên cơm và ăn kèm 100g rau luộc để cắt giảm khoảng 80–110 kcal.`
          : `Món ${recipe.name} có mức năng lượng vừa phải, giàu dưỡng chất tự nhiên. Người tập Gym hoặc Eat Clean có thể kết hợp cùng cơm gạo lứt và ức gà/trứng luộc để tối ưu lượng đạm cho cơ bắp.`,
    },
  ];
}

export function buildRecipeFaqJsonLd(recipe: PublicRecipe) {
  const faqs = buildRecipeFaqItems(recipe);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildRecipeJsonLd(recipe: PublicRecipe, siteUrl: string) {
  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const absImage = recipe.heroImage
    ? recipe.heroImage.startsWith('http')
      ? recipe.heroImage
      : `${siteUrl.replace(/\/+$/, '')}${recipe.heroImage.startsWith('/') ? '' : '/'}${recipe.heroImage}`
    : undefined;

  const perServingMacro = recipe.nutritionSnapshot?.perServing;
  const roleLabel = ROLE_LABELS[recipe.role] || recipe.role;
  const seoKeywords = [
    recipe.name,
    `cách làm ${recipe.name.toLowerCase()}`,
    `cách nấu ${recipe.name.toLowerCase()}`,
    `${recipe.name.toLowerCase()} bao nhiêu calo`,
    roleLabel,
    ...recipe.tags.map((t) => t.name),
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    headline: `${recipe.name} — Công thức chuẩn vị & Bảng tính Calo`,
    description: recipe.shortDescription,
    image: absImage ? [absImage] : undefined,
    url: `${siteUrl}/cong-thuc/${recipe.slug}`,
    inLanguage: 'vi-VN',
    datePublished: recipe.publishedAt || undefined,
    prepTime: minutesToIsoDuration(recipe.prepTimeMinutes),
    cookTime: minutesToIsoDuration(recipe.cookTimeMinutes),
    totalTime: minutesToIsoDuration(totalMinutes),
    recipeYield: `${recipe.baseServings} người`,
    recipeCategory: roleLabel,
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
    ...(typeof recipe.ratingCount === 'number' &&
    recipe.ratingCount > 0 &&
    typeof recipe.ratingAverage === 'number'
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: String(recipe.ratingAverage),
            bestRating: '5',
            worstRating: '1',
            ratingCount: String(recipe.ratingCount),
          },
        }
      : {}),
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
                  ...(perServingMacro.fiber !== null
                    ? { fiberContent: `${perServingMacro.fiber} g` }
                    : {}),
                  ...(perServingMacro.sodium !== null
                    ? { sodiumContent: `${perServingMacro.sodium} mg` }
                    : {}),
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
    keywords: Array.from(new Set(seoKeywords)).join(', '),
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
  const faqSchema = buildRecipeFaqJsonLd(recipe);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSafeJsonLd(faqSchema) }}
      />
    </>
  );
}
