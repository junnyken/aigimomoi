import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck, MapPin, Star, Store, UtensilsCrossed, Users, Briefcase, Package } from 'lucide-react';
import { getCachedPublicCreator } from '@/lib/creators/public';
import type { PublicCreatorBundle } from '@/lib/creators/queries';
import { CREATOR_TIER_LABELS, isValidCreatorSlug } from '@/lib/creators/tier';
import { CREATOR_REGIONS } from '@/lib/creators/profileInput';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { ClaimBundleButton } from '@/components/recipe/ClaimBundleButton';
import { getSessionUser } from '@/lib/auth/session';
import { getUserRecipeEntitlements } from '@/lib/gating/queries';
import { formatPriceVND } from '@/lib/gating/pricing';

interface PageParams {
  params: Promise<{ slug: string }>;
}

// Như trang công thức: Cache Components cần ít nhất một param lúc build (không phụ thuộc DB).
// Placeholder không phải slug hợp lệ của người dùng (có tiền tố gạch dưới) → 404.
const BUILD_PLACEHOLDER = '__nguoi-nau-placeholder';

export async function generateStaticParams() {
  return [{ slug: BUILD_PLACEHOLDER }];
}

async function loadCreator(slug: string) {
  if (!isValidCreatorSlug(slug)) notFound();
  const creator = await getCachedPublicCreator(slug);
  if (!creator) notFound();
  return creator;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidCreatorSlug(slug)) return { title: 'Không tìm thấy người nấu — ĂN GÌ MOM', robots: { index: false } };
  const creator = await getCachedPublicCreator(slug);
  if (!creator) return { title: 'Không tìm thấy người nấu — ĂN GÌ MOM', robots: { index: false } };

  const title = `${creator.displayName} — Chợ công thức | ĂN GÌ MOM`;
  const description = creator.bio
    ? creator.bio.slice(0, 160)
    : `Các công thức nấu cơm nhà do ${creator.displayName} chia sẻ trên Chợ công thức ĂN GÌ MOM.`;
  return {
    title,
    description,
    alternates: { canonical: `/nguoi-nau/${creator.slug}` },
    openGraph: { type: 'profile', title, description },
    // Hồ sơ chưa có món nào xuất bản: không cho index để tránh trang mỏng
    ...(creator.stats.publishedCommunityRecipes === 0 ? { robots: { index: false } } : {}),
  };
}

export default async function CreatorProfilePage({ params }: PageParams) {
  const { slug } = await params;
  const creator = await loadCreator(slug);
  const regionLabel = CREATOR_REGIONS[creator.region as keyof typeof CREATOR_REGIONS] ?? CREATOR_REGIONS.GENERAL;
  const initials = creator.displayName.trim().slice(0, 2).toUpperCase() || 'NN';

  return (
    <div className="flex flex-col gap-8 pb-12" data-testid="creator-profile-page">
      <Link
        href="/mon-an?nguon=cho"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Chợ công thức
      </Link>

      <header className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 sm:p-8 shadow-xs">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl"
        />
        <div className="relative flex flex-col sm:flex-row gap-5 sm:items-center">
          <div className="w-20 h-20 shrink-0 rounded-2xl bg-white text-amber-700 font-bold text-3xl flex items-center justify-center shadow-sm border border-amber-200">
            {initials}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <Store className="w-4 h-4" aria-hidden="true" /> Người nấu · Chợ công thức
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{creator.displayName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                  creator.tier === 2
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-amber-700 border-amber-300'
                }`}
                data-testid="creator-tier"
              >
                {creator.tier === 2 && <BadgeCheck className="inline w-3.5 h-3.5 mr-1 -mt-0.5" aria-hidden="true" />}
                {CREATOR_TIER_LABELS[creator.tier]}
              </span>
              {creator.isProfessional && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-white text-stone-700 border-stone-300">
                  <Briefcase className="w-3.5 h-3.5" aria-hidden="true" /> Tiệm / Đầu bếp
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {regionLabel}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                · Tham gia {new Date(creator.joinedAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            {creator.bio && (
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line max-w-2xl">
                {creator.bio}
              </p>
            )}
          </div>
        </div>

        <dl className="relative mt-6 grid grid-cols-3 gap-3 max-w-lg">
          <Stat icon={UtensilsCrossed} label="Công thức" value={String(creator.stats.publishedCommunityRecipes)} />
          <Stat icon={Users} label="Người đã nấu" value={String(creator.stats.distinctRaters)} />
          <Stat
            icon={Star}
            label="Điểm trung bình"
            value={creator.stats.averageRating !== null ? `${creator.stats.averageRating}/5` : '—'}
          />
        </dl>
      </header>

      <p className="text-xs text-[var(--color-text-muted)] -mt-4">
        Công thức trên Chợ công thức do người nấu cộng đồng chia sẻ và tự chịu trách nhiệm nội dung; Bếp Mom duyệt
        nội dung trước khi đăng nhưng chưa nấu thử kiểm nghiệm.
      </p>

      {creator.bundles && creator.bundles.length > 0 && (
        <section aria-labelledby="creator-bundles-heading" className="flex flex-col gap-4">
          <h2 id="creator-bundles-heading" className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" aria-hidden="true" />
            Bộ công thức &amp; Thực đơn chọn gói ({creator.bundles.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {creator.bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/40 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                      {bundle.title}
                    </h3>
                    <span className="shrink-0 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold">
                      {formatPriceVND(bundle.price)}
                    </span>
                  </div>
                  {bundle.description && (
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {bundle.description}
                    </p>
                  )}
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
                      Bao gồm {bundle.recipes.length} món:
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {bundle.recipes.map((r) => (
                        <li key={r.id}>
                          <Link
                            href={`/cong-thuc/${r.slug}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-[var(--color-border-base)] hover:border-amber-400 text-xs font-medium text-[var(--color-text-primary)] transition-colors"
                          >
                            <span>🍲 {r.name}</span>
                            {r.caloriesPerServing && (
                              <span className="text-[10px] text-[var(--color-text-muted)]">
                                (~{r.caloriesPerServing} kcal)
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-100">
                  <Suspense
                    fallback={
                      <div className="h-10 w-56 rounded-2xl bg-amber-100/60 animate-pulse" />
                    }
                  >
                    <DynamicBundleClaimSlot bundle={bundle} creatorSlug={creator.slug} />
                  </Suspense>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="creator-recipes-heading" className="flex flex-col gap-4">
        <h2 id="creator-recipes-heading" className="text-xl font-bold text-[var(--color-text-primary)]">
          Công thức của {creator.displayName}
        </h2>
        {creator.recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {creator.recipes.map((recipe) => (
              <RecipeCard key={recipe.slug} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-border-base)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            Người nấu này chưa có công thức nào được xuất bản.
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-xs border border-amber-100 p-3 text-center">
      <dt className="flex items-center justify-center gap-1 text-[11px] text-[var(--color-text-muted)]">
        <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {label}
      </dt>
      <dd className="text-xl font-bold text-[var(--color-text-primary)]">{value}</dd>
    </div>
  );
}

async function DynamicBundleClaimSlot({
  bundle,
  creatorSlug,
}: {
  bundle: PublicCreatorBundle;
  creatorSlug: string;
}) {
  const sessionUser = await getSessionUser();
  let alreadyOwned = false;
  if (sessionUser) {
    const ownedIds = await getUserRecipeEntitlements(sessionUser.id);
    alreadyOwned =
      bundle.recipes.length > 0 && bundle.recipes.every((r) => ownedIds.has(r.id));
  }

  return (
    <ClaimBundleButton
      bundleId={bundle.id}
      creatorSlug={creatorSlug}
      price={bundle.price}
      isLoggedIn={Boolean(sessionUser)}
      alreadyOwned={alreadyOwned}
    />
  );
}
