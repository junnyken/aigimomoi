import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, Clock, Flame, Gauge, Users, UtensilsCrossed, Tag, Store } from 'lucide-react';
import { getCurrentSlugForArchived, getPublishedRecipeBySlug } from '@/lib/recipes/public';
import {
  ROLE_LABELS,
  TAXONOMY_TYPE_LABELS,
  RECIPE_NOT_FOUND_PLACEHOLDER,
  formatDuration,
  recipePath,
} from '@/lib/recipes/labels';
import { VerificationBadges } from '@/components/recipe/VerificationBadges';
import { IngredientList } from '@/components/recipe/IngredientList';
import { StepList } from '@/components/recipe/StepList';
import { NutritionNotice } from '@/components/recipe/NutritionNotice';
import { BookmarkButton } from '@/components/recipe/BookmarkButton';
import { LogToDiaryButton } from '@/components/recipe/LogToDiaryButton';
import { ReportButton } from '@/components/recipe/ReportButton';
import { KitchenStorySection } from '@/components/recipe/KitchenStorySection';
import { RegionalVariants } from '@/components/recipe/RegionalVariants';
import { CookedItSection } from '@/components/recipe/CookedItSection';
import { RecipeJsonLd } from '@/components/seo/RecipeJsonLd';
import { PantryCheckWidget } from '@/components/pantry/PantryCheckWidget';
import { StartCookingButton } from '@/components/recipe/StartCookingButton';

interface PageParams {
  params: Promise<{ slug: string }>;
}

// Cache Components yêu cầu ít nhất một param lúc build. Dùng placeholder để build
// không phụ thuộc DB (Docker build không có DB); mọi slug thật render theo yêu cầu.
// Trang placeholder prerender tĩnh thành 404 — Proxy rewrite slug không công khai về đây.
const BUILD_PLACEHOLDER = RECIPE_NOT_FOUND_PLACEHOLDER;

export async function generateStaticParams() {
  return [{ slug: BUILD_PLACEHOLDER }];
}

async function loadRecipe(slug: string) {
  if (slug === BUILD_PLACEHOLDER) notFound();

  const recipe = await getPublishedRecipeBySlug(slug);
  if (recipe) return recipe;

  // Link tới phiên bản cũ → chuyển vĩnh viễn sang bản đang xuất bản (D35)
  const currentSlug = await getCurrentSlugForArchived(slug);
  if (currentSlug) permanentRedirect(recipePath(currentSlug));

  // Bản nháp / chờ duyệt / không tồn tại: cùng một phản hồi 404, không tiết lộ sự tồn tại
  notFound();
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER) return {};
  const recipe = await getPublishedRecipeBySlug(slug);
  if (!recipe) return { title: 'Không tìm thấy công thức — ĂN GÌ MOM', robots: { index: false } };

  const title = `${recipe.name} — Công thức nấu cơm nhà | ĂN GÌ MOM`;
  return {
    title,
    description: recipe.shortDescription,
    alternates: { canonical: recipePath(recipe.slug) },
    openGraph: {
      type: 'article',
      title,
      description: recipe.shortDescription,
      ...(recipe.heroImage ? { images: [{ url: recipe.heroImage, alt: recipe.name }] } : {}),
    },
  };
}

// `await params` nằm ngoài <Suspense> để trang render xong trước khi gửi phản hồi:
// 404 và 308 trả về đúng mã HTTP thay vì "soft 404" khi đã stream.
export default async function PublicRecipePage({ params }: PageParams) {
  const { slug } = await params;
  const recipe = await loadRecipe(slug);
  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const isCommunity = recipe.source === 'COMMUNITY';

  return (
    <article className="flex flex-col gap-8 pb-12">
      <RecipeJsonLd recipe={recipe} />
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Khám phá món khác
      </Link>

      {/* Hero */}
      <header className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="flex flex-col">
          <div className="relative overflow-hidden rounded-3xl bg-[var(--color-surface-raised)] aspect-[4/3] shadow-sm">
            {recipe.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={recipe.heroImage}
                alt={recipe.name}
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
                <UtensilsCrossed className="w-16 h-16" aria-hidden="true" />
              </div>
            )}
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-primary)] text-white shadow-sm">
              {ROLE_LABELS[recipe.role] ?? recipe.role}
            </span>
            {recipe.heroImage && recipe.isIllustration && (
              <span className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-black/60 text-white/95 backdrop-blur-xs shadow-sm">
                Ảnh minh họa
              </span>
            )}
          </div>
          {recipe.heroImage && recipe.isIllustration && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)] italic">
              {isCommunity
                ? '* Ảnh minh họa, không phải ảnh thành phẩm thực tế.'
                : '* Ảnh minh họa. Bếp Ăn Gì Mom đang tiến hành nấu thử để cập nhật hình ảnh đĩa cơm thực tế.'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            {recipe.dish && recipe.dish.name !== recipe.name && (
              <p className="text-sm font-semibold text-[var(--color-accent-text)]">{recipe.dish.name}</p>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">{recipe.name}</h1>
            {recipe.dish && recipe.dish.aliases.length > 0 && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Còn gọi là: {recipe.dish.aliases.join(', ')}</p>
            )}
          </div>

          <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">{recipe.shortDescription}</p>

          {isCommunity && (
            <div
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              data-testid="community-recipe-notice"
            >
              <p className="inline-flex items-center gap-1.5 font-semibold">
                <Store className="w-4 h-4" aria-hidden="true" />
                Chợ công thức
              </p>
              <p className="mt-1 leading-relaxed">
                Công thức do{' '}
                {recipe.creatorSlug ? (
                  <Link href={`/nguoi-nau/${recipe.creatorSlug}`} className="font-semibold underline underline-offset-2">
                    {recipe.authorName ?? 'người nấu'}
                  </Link>
                ) : (
                  <span className="font-semibold">{recipe.authorName ?? 'người nấu cộng đồng'}</span>
                )}{' '}
                chia sẻ, chưa được Bếp Mom nấu thử kiểm nghiệm. Nội dung thuộc trách nhiệm của người chia sẻ.
              </p>
            </div>
          )}

          <VerificationBadges
            isEditorialReviewed={recipe.isEditorialReviewed}
            isCookTested={recipe.isCookTested}
            isNutritionVerified={recipe.isNutritionVerified}
          />

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat icon={Clock} label="Sơ chế" value={formatDuration(recipe.prepTimeMinutes)} />
            <Stat icon={Flame} label="Nấu" value={formatDuration(recipe.cookTimeMinutes)} />
            <Stat icon={Gauge} label="Độ khó" value={recipe.difficulty} />
            <Stat icon={Users} label="Khẩu phần gốc" value={`${recipe.baseServings} người`} />
          </dl>

          <div className="pt-1 flex flex-wrap items-center gap-3">
            <StartCookingButton slug={recipe.slug} baseServings={recipe.baseServings} />
            <BookmarkButton slug={recipe.slug} size="lg" showText={true} />
            <LogToDiaryButton recipeId={recipe.id} recipeName={recipe.name} />
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            Tổng thời gian khoảng {formatDuration(totalMinutes)}
            {recipe.authorName ? ` · ${isCommunity ? 'Chia sẻ bởi' : 'Biên soạn bởi'} ${recipe.authorName}` : ''}
            {recipe.versionNumber > 1 ? ` · Phiên bản ${recipe.versionNumber}` : ''}
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <PantryCheckWidget recipeId={recipe.id} />
          <IngredientList ingredients={recipe.ingredients} baseServings={recipe.baseServings} />
          <NutritionNotice
            nutritionStatus={recipe.nutritionStatus}
            caloriesPerServing={recipe.caloriesPerServing}
            isNutritionVerified={recipe.isNutritionVerified}
            nutritionSnapshot={recipe.nutritionSnapshot}
          />
        </aside>

        <div className="flex flex-col gap-8">
          {/* AG-33: Câu chuyện bếp nhà & nguồn gốc */}
          <KitchenStorySection
            kitchenStory={recipe.kitchenStory}
            sourceAttribution={recipe.sourceAttribution}
            region={recipe.region}
          />

          <StepList steps={recipe.steps} recipeName={recipe.name} />

          {/* AG-33: Biến thể món ăn vùng miền */}
          <RegionalVariants
            currentDishName={recipe.dish?.name}
            variants={recipe.variants}
          />

          {recipe.tags.length > 0 && (
            <section aria-labelledby="tags-heading">
              <h2 id="tags-heading" className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <Tag className="w-4 h-4" aria-hidden="true" />
                Phân loại
              </h2>
              <ul className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <li
                    key={tag.slug}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)]"
                    title={TAXONOMY_TYPE_LABELS[tag.type] ?? tag.type}
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* AG-34: Cộng đồng nấu thử & ảnh thành phẩm */}
          <CookedItSection recipeId={recipe.id} recipeName={recipe.name} />

          {/* AG-32: Báo cáo vi phạm nội dung */}
          <div className="pt-4 border-t border-[var(--color-border-base)] flex justify-end">
            <ReportButton recipeId={recipe.id} recipeName={recipe.name} />
          </div>
        </div>
      </div>
    </article>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] px-3 py-2.5">
      <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-bold text-[var(--color-text-primary)]">{value}</dd>
    </div>
  );
}
