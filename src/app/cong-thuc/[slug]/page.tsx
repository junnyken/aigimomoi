import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, Clock, Flame, Gauge, Users, UtensilsCrossed, Tag, Store, Utensils, Droplets } from 'lucide-react';
import { getCurrentSlugForArchived, getPublishedRecipeBySlug } from '@/lib/recipes/public';
import type { PublicRecipe } from '@/lib/recipes/publicQueries';
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
import { getSessionUser } from '@/lib/auth/session';
import { getUserRecipeEntitlements } from '@/lib/gating/queries';
import { canAccessRecipe, filterRecipeForViewer } from '@/lib/gating/entitlements';
import { GatedRecipeBanner } from '@/components/recipe/GatedRecipeBanner';
import { formatPriceVND } from '@/lib/gating/pricing';

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
  const rawRecipe = await loadRecipe(slug);
  const isPaidCommunityRecipe =
    rawRecipe.provenance === 'COMMUNITY_SUBMITTED' && !rawRecipe.isFree && rawRecipe.price > 0;
  const totalMinutes = rawRecipe.prepTimeMinutes + rawRecipe.cookTimeMinutes;
  const isCommunity = rawRecipe.source === 'COMMUNITY';

  // Với công thức có phí, JSON-LD không chứa nguyên liệu/bước để tránh lộ bí quyết
  const jsonLdRecipe = isPaidCommunityRecipe
    ? { ...rawRecipe, ingredients: [], steps: [] }
    : rawRecipe;

  return (
    <article className="flex flex-col gap-8 pb-12">
      <RecipeJsonLd recipe={jsonLdRecipe} />
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
            {rawRecipe.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rawRecipe.heroImage}
                alt={rawRecipe.name}
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
                <UtensilsCrossed className="w-16 h-16" aria-hidden="true" />
              </div>
            )}
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-primary)] text-white shadow-sm">
              {ROLE_LABELS[rawRecipe.role] ?? rawRecipe.role}
            </span>
            {rawRecipe.heroImage && rawRecipe.isIllustration && (
              <span className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-black/60 text-white/95 backdrop-blur-xs shadow-sm">
                Ảnh minh họa
              </span>
            )}
          </div>
          {rawRecipe.heroImage && rawRecipe.isIllustration && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)] italic">
              {isCommunity
                ? '* Ảnh minh họa, không phải ảnh thành phẩm thực tế.'
                : '* Ảnh minh họa. Bếp Ăn Gì Mom đang tiến hành nấu thử để cập nhật hình ảnh đĩa cơm thực tế.'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            {rawRecipe.dish && rawRecipe.dish.name !== rawRecipe.name && (
              <p className="text-sm font-semibold text-[var(--color-accent-text)]">{rawRecipe.dish.name}</p>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">{rawRecipe.name}</h1>
            {rawRecipe.dish && rawRecipe.dish.aliases.length > 0 && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Còn gọi là: {rawRecipe.dish.aliases.join(', ')}</p>
            )}
          </div>

          <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">{rawRecipe.shortDescription}</p>

          {isCommunity && (
            <div
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              data-testid="community-recipe-notice"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <Store className="w-4 h-4" aria-hidden="true" />
                  Chợ công thức
                </p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rawRecipe.isFree ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'}`}>
                  {formatPriceVND(rawRecipe.price)}
                </span>
              </div>
              <p className="mt-1 leading-relaxed">
                Công thức do{' '}
                {rawRecipe.creatorSlug ? (
                  <Link href={`/nguoi-nau/${rawRecipe.creatorSlug}`} className="font-semibold underline underline-offset-2">
                    {rawRecipe.authorName ?? 'người nấu'}
                  </Link>
                ) : (
                  <span className="font-semibold">{rawRecipe.authorName ?? 'người nấu cộng đồng'}</span>
                )}{' '}
                chia sẻ, chưa được Bếp Mom nấu thử kiểm nghiệm. Nội dung thuộc trách nhiệm của người chia sẻ.
              </p>
            </div>
          )}

          <VerificationBadges
            isEditorialReviewed={rawRecipe.isEditorialReviewed}
            isCookTested={rawRecipe.isCookTested}
            isNutritionVerified={rawRecipe.isNutritionVerified}
          />

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat icon={Clock} label="Sơ chế" value={formatDuration(rawRecipe.prepTimeMinutes)} />
            <Stat icon={Flame} label="Nấu" value={formatDuration(rawRecipe.cookTimeMinutes)} />
            <Stat icon={Gauge} label="Độ khó" value={rawRecipe.difficulty} />
            <Stat icon={Users} label="Khẩu phần gốc" value={`${rawRecipe.baseServings} người`} />
          </dl>

          {isPaidCommunityRecipe ? (
            <Suspense fallback={<BookmarkButton slug={rawRecipe.slug} size="lg" showText={true} />}>
              <PaidRecipeActions rawRecipe={rawRecipe} />
            </Suspense>
          ) : (
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <StartCookingButton slug={rawRecipe.slug} baseServings={rawRecipe.baseServings} />
              <AddToMealTrayLink slug={rawRecipe.slug} role={rawRecipe.role} baseServings={rawRecipe.baseServings} />
              <BookmarkButton slug={rawRecipe.slug} size="lg" showText={true} />
              <LogToDiaryButton recipeId={rawRecipe.id} recipeName={rawRecipe.name} />
            </div>
          )}

          <p className="text-xs text-[var(--color-text-muted)]">
            Tổng thời gian khoảng {formatDuration(totalMinutes)}
            {rawRecipe.authorName ? ` · ${isCommunity ? 'Chia sẻ bởi' : 'Biên soạn bởi'} ${rawRecipe.authorName}` : ''}
            {rawRecipe.versionNumber > 1 ? ` · Phiên bản ${rawRecipe.versionNumber}` : ''}
          </p>
        </div>
      </header>

      {/* Body */}
      {isPaidCommunityRecipe ? (
        <Suspense fallback={<PaidRecipeBodySkeleton />}>
          <PaidRecipeBody rawRecipe={rawRecipe} />
        </Suspense>
      ) : (
        <FullRecipeBody recipe={rawRecipe} />
      )}
    </article>
  );
}

async function PaidRecipeActions({ rawRecipe }: { rawRecipe: PublicRecipe }) {
  const sessionUser = await getSessionUser();
  const entitlements = sessionUser ? await getUserRecipeEntitlements(sessionUser.id) : new Set<number>();
  const hasAccess = canAccessRecipe(
    {
      recipeId: rawRecipe.id,
      provenance: rawRecipe.provenance,
      price: rawRecipe.price,
      isFree: rawRecipe.isFree,
      authorId: rawRecipe.authorId,
    },
    sessionUser?.id ?? null,
    entitlements
  );

  return (
    <div className="pt-1 flex flex-wrap items-center gap-3">
      {hasAccess && (
        <StartCookingButton slug={rawRecipe.slug} baseServings={rawRecipe.baseServings} />
      )}
      <BookmarkButton slug={rawRecipe.slug} size="lg" showText={true} />
      {hasAccess && (
        <LogToDiaryButton recipeId={rawRecipe.id} recipeName={rawRecipe.name} />
      )}
    </div>
  );
}

async function PaidRecipeBody({ rawRecipe }: { rawRecipe: PublicRecipe }) {
  const sessionUser = await getSessionUser();
  const entitlements = sessionUser ? await getUserRecipeEntitlements(sessionUser.id) : new Set<number>();
  const hasAccess = canAccessRecipe(
    {
      recipeId: rawRecipe.id,
      provenance: rawRecipe.provenance,
      price: rawRecipe.price,
      isFree: rawRecipe.isFree,
      authorId: rawRecipe.authorId,
    },
    sessionUser?.id ?? null,
    entitlements
  );

  if (!hasAccess) {
    const recipe = filterRecipeForViewer(rawRecipe, false);
    return (
      <div className="flex flex-col gap-8">
        <GatedRecipeBanner
          recipeId={recipe.id}
          recipeSlug={recipe.slug}
          recipeName={recipe.name}
          authorName={recipe.authorName}
          price={recipe.price}
          isLoggedIn={!!sessionUser}
        />

        <KitchenStorySection
          kitchenStory={recipe.kitchenStory}
          sourceAttribution={recipe.sourceAttribution}
          region={recipe.region}
        />

        <CookedItSection recipeId={recipe.id} recipeName={recipe.name} />

        <div className="pt-4 border-t border-[var(--color-border-base)] flex justify-end">
          <ReportButton recipeId={recipe.id} recipeName={recipe.name} />
        </div>
      </div>
    );
  }

  const recipe = filterRecipeForViewer(rawRecipe, true);
  return <FullRecipeBody recipe={recipe} />;
}

function FullRecipeBody({ recipe }: { recipe: PublicRecipe }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Thanh nhảy nhanh trên Điện thoại (< lg) giúp không phải cuộn dài qua danh sách nguyên liệu */}
      <nav
        aria-label="Nhảy nhanh tới phần nội dung"
        className="lg:hidden flex items-center gap-2 p-2 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs overflow-x-auto scrollbar-none"
      >
        <a
          href="#ingredients-heading"
          className="flex-1 text-center px-3 py-2 rounded-xl text-xs font-bold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] whitespace-nowrap"
        >
          1. Nguyên liệu ({recipe.ingredients.length})
        </a>
        <a
          href="#recipe-steps-section"
          className="flex-1 text-center px-3 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent-light)] text-[var(--color-accent-text)] whitespace-nowrap"
        >
          2. Cách làm ({recipe.steps.length} bước)
        </a>
        <a
          href="#cooked-it-heading"
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] whitespace-nowrap"
        >
          Cảm nhận
        </a>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <PantryCheckWidget recipeId={recipe.id} />
          <IngredientList
            ingredients={recipe.ingredients}
            baseServings={recipe.baseServings}
            nutritionSnapshot={recipe.nutritionSnapshot}
          />
          <NutritionNotice
            nutritionStatus={recipe.nutritionStatus}
            caloriesPerServing={recipe.caloriesPerServing}
            isNutritionVerified={recipe.isNutritionVerified}
            nutritionSnapshot={recipe.nutritionSnapshot}
          />
          <RecommendedDippingSauceCard recipe={recipe} />
        </aside>

        <div className="flex flex-col gap-8">
          <KitchenStorySection
            kitchenStory={recipe.kitchenStory}
            sourceAttribution={recipe.sourceAttribution}
            region={recipe.region}
          />

          <StepList steps={recipe.steps} recipeName={recipe.name} />

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

          <div id="cooked-it-heading" className="scroll-mt-24">
            <CookedItSection recipeId={recipe.id} recipeName={recipe.name} />
          </div>

          <div className="pt-4 border-t border-[var(--color-border-base)] flex justify-end">
            <ReportButton recipeId={recipe.id} recipeName={recipe.name} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaidRecipeBodySkeleton() {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-8 text-center animate-pulse">
      <div className="h-6 w-48 bg-amber-200/60 rounded-full mx-auto mb-3" />
      <div className="h-4 w-72 bg-amber-200/40 rounded-full mx-auto" />
    </div>
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

function AddToMealTrayLink({
  slug,
  role,
  baseServings,
}: {
  slug: string;
  role: string;
  baseServings: number;
}) {
  const paramKey =
    role === 'MAIN'
      ? 'main'
      : role === 'SOUP'
      ? 'soup'
      : role === 'SIDE'
      ? 'side'
      : role === 'DIPPING_SAUCE'
      ? 'sauce'
      : null;

  if (!paramKey) return null;

  return (
    <Link
      href={`/meal?${paramKey}=${encodeURIComponent(slug)}&servings=${baseServings}`}
      className="min-h-11 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-light)]/70 hover:bg-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:text-white text-sm font-semibold transition-colors shadow-2xs"
    >
      <Utensils className="w-4 h-4" aria-hidden="true" />
      <span>Đưa vào mâm cơm</span>
    </Link>
  );
}

function RecommendedDippingSauceCard({ recipe }: { recipe: PublicRecipe }) {
  if (recipe.role === 'DIPPING_SAUCE' || recipe.role === 'DESSERT' || recipe.role === 'BEVERAGE') {
    return null;
  }

  const lowerName = `${recipe.name} ${recipe.shortDescription}`.toLowerCase();
  let sauceTitle = 'Nước mắm nhĩ dầm ớt hiểm & tiêu xanh';
  let sauceFormula = '3 muỗng nước mắm nhĩ + ½ quả chanh + 2 trái ớt hiểm cắt lát';
  let sauceSlug = 'nuoc-mam-nguyen-chat-dam-ot';
  let sauceNote = 'Giữ trọn vị ngọt tự nhiên của món mặn và canh, ~12 kcal/phần.';

  if (lowerName.includes('luộc') && recipe.role === 'SIDE') {
    sauceTitle = 'Kho quẹt tóp mỡ tôm khô hoặc Nước tương tỏi ớt';
    sauceFormula = '3 muỗng mắm + 2 muỗng đường + 2 muỗng nước lọc + tôm khô & tiêu xanh';
    sauceSlug = 'kho-quet-top-mo-tom-kho';
    sauceNote = 'Rau củ luộc chấm kho quẹt sệt kẹo hoặc nước tương dầu mè cực đưa cơm.';
  } else if (lowerName.includes('gà') || lowerName.includes('hấp') || lowerName.includes('hải sản')) {
    sauceTitle = 'Muối ớt xanh lá chanh';
    sauceFormula = '1 muỗng muối + 2 muỗng đường + 3 muỗng cốt chanh/tắc + ớt xiêm xanh';
    sauceSlug = 'muoi-ot-xanh-chanh-day';
    sauceNote = 'Chua cay thơm nồng mùi lá chanh, giúp món hấp/luộc thanh đạm không ngấy (~25 kcal).';
  } else if (lowerName.includes('đậu hũ') || lowerName.includes('chay') || lowerName.includes('xào')) {
    sauceTitle = 'Nước tương (Xì dầu) tỏi ớt & dầu mè';
    sauceFormula = '3 muỗng nước tương + 1 muỗng nước ấm + ½ muỗng đường + ½ muỗng dầu mè';
    sauceSlug = 'xi-dau-toi-ot-me-rang';
    sauceNote = 'Dịu mặn, ít Natri hơn nước mắm, rất hợp món xào và đậu hũ (~20 kcal/phần).';
  } else if (lowerName.includes('chiên') || lowerName.includes('rán') || lowerName.includes('nướng') || lowerName.includes('gỏi')) {
    sauceTitle = 'Nước mắm tỏi ớt chua ngọt (Tỷ lệ vàng)';
    sauceFormula = '2 muỗng mắm + 1.5 muỗng đường + 1 muỗng cốt chanh + 4 muỗng nước ấm + tỏi ớt';
    sauceSlug = 'nuoc-mam-toi-ot-chua-ngot';
    sauceNote = 'Chua ngọt hài hòa giúp cân bằng vị béo của món chiên/nướng (~22 kcal/phần).';
  }

  const roleParam =
    recipe.role === 'MAIN'
      ? `main=${encodeURIComponent(recipe.slug)}&`
      : recipe.role === 'SOUP'
      ? `soup=${encodeURIComponent(recipe.slug)}&`
      : recipe.role === 'SIDE'
      ? `side=${encodeURIComponent(recipe.slug)}&`
      : '';

  return (
    <section
      aria-labelledby="dipping-sauce-rec-heading"
      className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="dipping-sauce-rec-heading"
          className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5"
        >
          <Droplets className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          <span>Món này chấm gì ngon nhất?</span>
        </h2>
      </div>
      <p className="text-sm font-bold text-[var(--color-text-primary)]">{sauceTitle}</p>
      <div className="p-2.5 rounded-xl bg-[var(--color-surface-white)] border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
        <strong>🥄 Tỷ lệ muỗng:</strong> {sauceFormula}
      </div>
      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{sauceNote}</p>
      <Link
        href={`/meal?${roleParam}sauce=${sauceSlug}&servings=${recipe.baseServings}`}
        className="mt-1 inline-flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--color-surface-white)] hover:bg-amber-100/70 border border-amber-300 text-xs font-semibold text-amber-900 transition-colors"
      >
        <span>Ghép món này + nước chấm vào mâm</span>
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </section>
  );
}

