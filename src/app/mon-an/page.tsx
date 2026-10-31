import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { UtensilsCrossed, Flame, Dumbbell, Sparkles } from 'lucide-react';
import { searchPublishedRecipes, getSearchFilterMeta } from '@/lib/recipes/searchQueries';
import { ROLE_LABELS } from '@/lib/recipes/labels';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { SearchInput } from '@/components/search/SearchInput';
import { RoleFilterTabs } from '@/components/search/RoleFilterTabs';
import { FilterSidebar } from '@/components/search/FilterSidebar';
import { SearchFilterSheet } from '@/components/search/SearchFilterSheet';
import { ActiveFilterChips } from '@/components/search/ActiveFilterChips';
import { SearchEmptyState } from '@/components/search/SearchEmptyState';
import { SearchPagination } from '@/components/search/SearchPagination';
import { SourceFilterTabs } from '@/components/search/SourceFilterTabs';
import { parseRecipeSourceFilter } from '@/lib/recipes/source';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim() : '';
  const role = typeof params.role === 'string' ? params.role : '';
  const tax = typeof params.tax === 'string' ? params.tax : '';

  if (q) {
    return {
      title: `Tìm kiếm: "${q}" — Công thức nấu ăn`,
      description: `Kết quả tìm kiếm công thức nấu ăn và chỉ số Calo cho từ khóa "${q}". Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.`,
      robots: { index: false, follow: true },
    };
  }

  if (tax === 'giam-can-it-calo') {
    return {
      title: 'Thực đơn Giảm cân · Ít Calo (Eat Clean Việt Nam dưới 500 kcal)',
      description:
        'Tổng hợp các món ăn giảm cân, ít calo, giàu chất xơ chuẩn NHS Better Health, BBC Good Food & Viện Dinh Dưỡng Việt Nam dễ nấu tại nhà.',
      alternates: { canonical: '/mon-an?tax=giam-can-it-calo' },
    };
  }

  if (tax === 'tap-gym-tang-co') {
    return {
      title: 'Thực đơn Tập Gym · Tăng cơ – Giảm mỡ (Giàu Protein / Macro-Friendly)',
      description:
        'Kho công thức món ăn giàu Protein (Đạm cao) từ ức gà, bò thăn, cá hồi, tôm trứng chuẩn Eat the Gains & Fit Men Cook kèm bảng Macro chi tiết.',
      alternates: { canonical: '/mon-an?tax=tap-gym-tang-co' },
    };
  }

  if (role && ROLE_LABELS[role]) {
    return {
      title: `${ROLE_LABELS[role]} cho bữa cơm gia đình`,
      description: `Khám phá các công thức ${ROLE_LABELS[role].toLowerCase()} chuẩn vị 3 miền, định lượng rõ ràng và tự động tính Calo cho bữa cơm gia đình.`,
      alternates: { canonical: `/mon-an?role=${role}` },
    };
  }

  return {
    title: 'Khám phá Món ăn Cơm nhà — Tìm kiếm & Bộ lọc Dinh dưỡng',
    description:
      'Tìm kiếm công thức nấu ăn gia đình Việt Nam theo vai trò món (mặn, canh, xào), mục tiêu giảm cân / tập gym, thời gian nấu và lượng Calo.',
    alternates: { canonical: '/mon-an' },
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Page Header (Static Shell - Prerendered) */}
      <section className="bg-gradient-to-r from-[var(--color-brand-primary)]/10 to-[var(--color-accent-primary)]/10 p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)]">
        <div className="max-w-4xl flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-primary)] uppercase tracking-wider">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Món ngon mỗi ngày</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            Khám phá món ăn cho bữa cơm nhà
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Tìm món theo tên, nguyên liệu, vai trò trong mâm cơm (món mặn, canh, rau) hoặc thời gian nấu để bữa cơm luôn tròn vị và bớt nghĩ.
          </p>
        </div>

        {/* Thanh tìm kiếm chính */}
        <div className="mt-5 max-w-2xl">
          <Suspense fallback={<div className="h-10 bg-[var(--color-surface-white)] rounded-xl animate-pulse" />}>
            <SearchHeaderInput searchParams={searchParams} />
          </Suspense>
        </div>

        {/* Chuyên mục Dinh dưỡng Mục tiêu: Giảm cân · Ít Calo & Tập Gym · Tăng cơ */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)]/80 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mr-1">
            Mục tiêu dinh dưỡng:
          </span>
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
            <Link
              href="/mon-an?tax=giam-can-it-calo"
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all shadow-2xs"
            >
              <Flame className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">🥗 Giảm cân · Ít Calo</span>
            </Link>
            <Link
              href="/mon-an?tax=tap-gym-tang-co"
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition-all shadow-2xs"
            >
              <Dumbbell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">💪 Tập Gym · Giàu Đạm</span>
            </Link>
            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              <Link
                href="/mon-an?maxCalories=300&sort=calories_asc"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">≤ 300 kcal/phần</span>
              </Link>
              <Link
                href="/mon-an"
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-2xl bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-base)] text-xs font-semibold transition-all"
              >
                <span>Tất cả món</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dynamic Search Body & Results (Streamed with Suspense) */}
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchHeaderInput({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const rawParams = await searchParams;
  const q = typeof rawParams.q === 'string' ? rawParams.q : '';
  const filterMeta = await getSearchFilterMeta();

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <SearchInput defaultValue={q} />
      </div>
      <SearchFilterSheet taxonomies={filterMeta.taxonomies} />
    </div>
  );
}

async function SearchContent({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const rawParams = await searchParams;

  const q = typeof rawParams.q === 'string' ? rawParams.q : undefined;
  const role = typeof rawParams.role === 'string' ? rawParams.role : undefined;
  const maxTime = typeof rawParams.maxTime === 'string' ? Number(rawParams.maxTime) : undefined;
  const maxCalories = typeof rawParams.maxCalories === 'string' ? Number(rawParams.maxCalories) : undefined;
  const difficulty = typeof rawParams.difficulty === 'string' ? rawParams.difficulty : undefined;
  const testedOnly = rawParams.tested === 'true';
  const nutritionOnly = rawParams.nutrition === 'true';
  const taxonomySlug = typeof rawParams.tax === 'string' ? rawParams.tax : undefined;
  const sort = typeof rawParams.sort === 'string' && ['newest', 'quickest', 'calories_asc'].includes(rawParams.sort)
    ? (rawParams.sort as 'newest' | 'quickest' | 'calories_asc')
    : undefined;
  const page = typeof rawParams.page === 'string' ? Number(rawParams.page) : 1;
  const source = parseRecipeSourceFilter(rawParams.nguon);

  // Thực hiện truy vấn dữ liệu song song (search + filter metadata)
  const [searchResult, filterMeta] = await Promise.all([
    searchPublishedRecipes({
      q,
      role,
      maxTime,
      maxCalories,
      difficulty,
      testedOnly,
      nutritionOnly,
      taxonomySlug,
      sort,
      source,
      page,
      limit: 12,
    }),
    getSearchFilterMeta(),
  ]);

  const hasAnyFilter = Boolean(q || role || maxTime || maxCalories || difficulty || testedOnly || nutritionOnly || taxonomySlug || sort || source !== 'all');

  return (
    <>
      {/* R7: Lọc nguồn Bếp Mom / Chợ công thức */}
      <SourceFilterTabs current={source} params={rawParams} />

      {/* Role Filter Tabs */}
      <section aria-label="Lọc nhanh vai trò món">
        <RoleFilterTabs
          currentRole={role}
          roleCounts={filterMeta.roleCounts}
          totalCount={filterMeta.totalPublished}
        />
      </section>

      {/* Main Body: Desktop Sidebar + Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Cột trái: Bộ lọc Desktop (ẩn trên mobile) */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl p-5 shadow-xs">
          <FilterSidebar taxonomies={filterMeta.taxonomies} />
        </div>

        {/* Cột phải: Kết quả tìm kiếm */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-4">
          {/* Active Filter Chips & Result Counter */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                {searchResult.totalCount > 0 ? (
                  <>Tìm thấy <span className="text-[var(--color-brand-primary)]">{searchResult.totalCount}</span> món ăn</>
                ) : (
                  'Không có kết quả'
                )}
              </span>
              {searchResult.totalCount > 0 && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  Trang {searchResult.page} / {searchResult.totalPages}
                </span>
              )}
            </div>

            <ActiveFilterChips taxonomies={filterMeta.taxonomies} />
          </div>

          {/* Grid kết quả */}
          {searchResult.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {searchResult.items.map((recipe) => (
                  <RecipeCard key={recipe.slug} recipe={recipe} />
                ))}
              </div>

              {/* Phân trang */}
              <SearchPagination
                currentPage={searchResult.page}
                totalPages={searchResult.totalPages}
              />
            </>
          ) : (
            <SearchEmptyState hasFilters={hasAnyFilter} />
          )}
        </div>
      </div>
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse" aria-busy="true" aria-label="Đang tải kết quả tìm kiếm">
      <div className="h-10 bg-[var(--color-surface-raised)] rounded-full w-2/3" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="hidden lg:block h-80 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl" />
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl overflow-hidden">
              <div className="h-36 bg-[var(--color-surface-raised)]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[var(--color-surface-raised)] rounded w-3/4" />
                <div className="h-3 bg-[var(--color-surface-subtle)] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
