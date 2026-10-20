import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function RecipeNotFound() {
  return (
    <section className="mx-auto my-12 max-w-md text-center flex flex-col items-center gap-4">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-primary)]">
        <SearchX className="w-8 h-8" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Không tìm thấy công thức</h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Công thức này không tồn tại hoặc hiện chưa được công khai. Bạn thử xem các món khác nhé.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors"
      >
        Về trang khám phá
      </Link>
    </section>
  );
}
