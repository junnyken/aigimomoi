import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, Clock, Flame, Gauge, Users, UtensilsCrossed, Tag } from 'lucide-react';
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

  return (
    <article className="flex flex-col gap-8 pb-12">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Khám phá món khác
      </Link>

      {/* Hero */}
      <header className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
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

          <p className="text-xs text-[var(--color-text-muted)]">
            Tổng thời gian khoảng {formatDuration(totalMinutes)}
            {recipe.authorName ? ` · Biên soạn bởi ${recipe.authorName}` : ''}
            {recipe.versionNumber > 1 ? ` · Phiên bản ${recipe.versionNumber}` : ''}
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <IngredientList ingredients={recipe.ingredients} baseServings={recipe.baseServings} />
          <NutritionNotice
            nutritionStatus={recipe.nutritionStatus}
            caloriesPerServing={recipe.caloriesPerServing}
            isNutritionVerified={recipe.isNutritionVerified}
          />
        </aside>

        <div className="flex flex-col gap-8">
          <StepList steps={recipe.steps} recipeName={recipe.name} />

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
