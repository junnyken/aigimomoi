import type { Metadata } from 'next';
import { Suspense } from 'react';
import { UtensilsCrossed } from 'lucide-react';
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

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim() : '';
  const role = typeof params.role === 'string' ? params.role : '';

  if (q) {
    return {
      title: `Tìm kiếm: "${q}" | Ăn Gì Mom`,
      description: `Kết quả tìm kiếm công thức nấu ăn cho từ khóa "${q}". Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.`,
    };
  }

  if (role && ROLE_LABELS[role]) {
    return {
      title: `${ROLE_LABELS[role]} cho bữa cơm gia đình | Ăn Gì Mom`,
      description: `Khám phá các món ${ROLE_LABELS[role].toLowerCase()} chuẩn vị, định lượng rõ ràng cho bữa cơm gia đình.`,
    };
  }

  return {
    title: 'Khám phá món ăn — Tìm kiếm & Bộ lọc | Ăn Gì Mom',
    description: 'Tìm kiếm công thức nấu ăn gia đình theo vai trò món, thời gian nấu, độ khó và nhãn kiểm chứng bếp thực tế.',
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Page Header (Static Shell - Prerendered) */}
      <section className="bg-gradient-to-r from-[var(--color-brand-primary)]/10 to-[var(--color-accent-primary)]/10 p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)]">
        <div className="max-w-2xl flex flex-col gap-3">
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
        <div className="mt-5 max-w-xl">
          <Suspense fallback={<div className="h-10 bg-[var(--color-surface-white)] rounded-xl animate-pulse" />}>
            <SearchHeaderInput searchParams={searchParams} />
          </Suspense>
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
  const difficulty = typeof rawParams.difficulty === 'string' ? rawParams.difficulty : undefined;
  const testedOnly = rawParams.tested === 'true';
  const nutritionOnly = rawParams.nutrition === 'true';
  const taxonomySlug = typeof rawParams.tax === 'string' ? rawParams.tax : undefined;
  const sort = typeof rawParams.sort === 'string' && ['newest', 'quickest', 'calories_asc'].includes(rawParams.sort)
    ? (rawParams.sort as 'newest' | 'quickest' | 'calories_asc')
    : undefined;
  const page = typeof rawParams.page === 'string' ? Number(rawParams.page) : 1;

  // Thực hiện truy vấn dữ liệu song song (search + filter metadata)
  const [searchResult, filterMeta] = await Promise.all([
    searchPublishedRecipes({
      q,
      role,
      maxTime,
      difficulty,
      testedOnly,
      nutritionOnly,
      taxonomySlug,
      sort,
      page,
      limit: 12,
    }),
    getSearchFilterMeta(),
  ]);

  const hasAnyFilter = Boolean(q || role || maxTime || difficulty || testedOnly || nutritionOnly || taxonomySlug || sort);

  return (
    <>
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
