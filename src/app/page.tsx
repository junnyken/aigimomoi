import { Suspense } from "react";
import { connection } from "next/server";
import { Sparkles, Utensils, ShoppingBag, ChefHat } from "lucide-react";
import { listPublishedRecipes } from "@/lib/recipes/public";
import { RecipeCard } from "@/components/recipe/RecipeCard";


export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero Section */}
      <section className="text-center py-8 sm:py-12 bg-radial from-[rgba(63,98,64,0.08)] to-transparent rounded-3xl">
        <div className="max-w-2xl mx-auto px-4 flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Nền tảng Next.js Production (Phase P2)
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-brand-primary)] tracking-tight mb-3">
            Hôm nay nhà mình ăn gì?
          </h1>
          <p className="text-base text-[var(--color-text-secondary)] mb-6 max-w-lg">
            Tìm kiếm công thức nấu ăn chuẩn vị gia đình, định lượng rõ ràng theo số người, tự động gộp danh sách đi chợ.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="http://localhost:8090/prototype/meal.html"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-[var(--color-accent-primary)] text-white shadow-md hover:bg-[var(--color-accent-hover)] transition-transform hover:-translate-y-0.5"
            >
              <Utensils className="w-4 h-4" />
              <span>Gợi ý mâm cơm 3 món</span>
            </a>
            <a
              href="http://localhost:8090/prototype/shopping.html"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-[var(--color-surface-white)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Xem danh sách đi chợ</span>
            </a>
          </div>
        </div>
      </section>

      {/* AG-16: Công thức đã xuất bản thật từ DB */}
      <section aria-labelledby="published-heading">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="published-heading" className="text-2xl font-bold text-[var(--color-text-primary)]">
              Món ngon quen thuộc
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Công thức cơm nhà đã qua biên tập và duyệt xuất bản.
            </p>
          </div>
        </div>

        <Suspense fallback={<PublishedShowcaseSkeleton />}>
          <PublishedShowcase />
        </Suspense>
      </section>
    </div>
  );
}

async function PublishedShowcase() {
  // Đọc lúc request (dữ liệu vẫn được cache theo tag) để build không cần DB.
  await connection();
  const recipes = await listPublishedRecipes(12);

  if (recipes.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-white)] p-10 text-center">
        <ChefHat className="mx-auto mb-3 w-10 h-10 text-[var(--color-text-muted)]" aria-hidden="true" />
        <p className="font-semibold text-[var(--color-text-primary)]">Chưa có công thức nào được xuất bản</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Các món sẽ xuất hiện ở đây ngay khi được duyệt xuất bản.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.slug} recipe={recipe} />
      ))}
    </div>
  );
}

function PublishedShowcaseSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Đang tải công thức">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] overflow-hidden animate-pulse">
          <div className="h-48 bg-[var(--color-surface-raised)]" />
          <div className="p-4 space-y-2">
            <div className="h-5 w-2/3 rounded bg-[var(--color-surface-raised)]" />
            <div className="h-3 w-full rounded bg-[var(--color-surface-subtle)]" />
            <div className="h-3 w-4/5 rounded bg-[var(--color-surface-subtle)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
