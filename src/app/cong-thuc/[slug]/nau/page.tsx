import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getCurrentSlugForArchived, getPublishedRecipeBySlug } from '@/lib/recipes/public';
import { RECIPE_NOT_FOUND_PLACEHOLDER, recipePath } from '@/lib/recipes/labels';
import { CookingModeView } from '@/components/cooking/CookingModeView';

interface CookingPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ step?: string; servings?: string }>;
}

const BUILD_PLACEHOLDER = RECIPE_NOT_FOUND_PLACEHOLDER;

export async function generateStaticParams() {
  return [{ slug: BUILD_PLACEHOLDER }];
}

async function loadRecipe(slug: string) {
  if (slug === BUILD_PLACEHOLDER) notFound();

  const recipe = await getPublishedRecipeBySlug(slug);
  if (recipe) return recipe;

  // Link tới phiên bản cũ -> redirect sang bản hiện hành
  const currentSlug = await getCurrentSlugForArchived(slug);
  if (currentSlug) permanentRedirect(`${recipePath(currentSlug)}/nau`);

  notFound();
}

export async function generateMetadata({ params }: CookingPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER) return {};
  const recipe = await getPublishedRecipeBySlug(slug);
  if (!recipe) return { title: 'Không tìm thấy công thức — ĂN GÌ MOM', robots: { index: false } };

  return {
    title: `Chế độ nấu: ${recipe.name} | ĂN GÌ MOM`,
    description: `Nấu món ${recipe.name} từng bước với đồng hồ đếm ngược và bảng nguyên liệu chuẩn khẩu phần.`,
    robots: { index: false }, // Chế độ nấu tập trung không cần index riêng lẻ trên search engines
  };
}

export default async function CookingModePage({ params, searchParams }: CookingPageProps) {
  const { slug } = await params;
  const recipe = await loadRecipe(slug);
  const rawQuery = await searchParams;

  const initialServings = typeof rawQuery.servings === 'string' ? Number(rawQuery.servings) : undefined;
  const initialStepIndex = typeof rawQuery.step === 'string' ? Number(rawQuery.step) - 1 : 0;

  return (
    <CookingModeView
      recipe={recipe}
      initialServings={initialServings}
      initialStepIndex={initialStepIndex}
    />
  );
}
