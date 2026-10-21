// R7 — Bộ lọc nguồn công thức trên /mon-an: Tất cả / Bếp Mom / Chợ công thức.
// Server component thuần Link: giữ nguyên các tham số lọc khác, reset về trang 1.
import Link from 'next/link';
import { ChefHat, Store, LayoutGrid } from 'lucide-react';
import type { RecipeSourceFilter } from '@/lib/recipes/source';

const OPTIONS: { value: RecipeSourceFilter; label: string; hint: string; Icon: typeof ChefHat }[] = [
  { value: 'all', label: 'Tất cả', hint: 'Mọi công thức', Icon: LayoutGrid },
  { value: 'bep-mom', label: 'Bếp Mom', hint: 'Do ban biên tập soạn và duyệt', Icon: ChefHat },
  { value: 'cho', label: 'Chợ công thức', hint: 'Do người nấu cộng đồng chia sẻ', Icon: Store },
];

function buildHref(params: Record<string, string | string[] | undefined>, value: RecipeSourceFilter): string {
  const next = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (key === 'nguon' || key === 'page' || typeof raw !== 'string') continue;
    next.set(key, raw);
  }
  if (value !== 'all') next.set('nguon', value);
  const qs = next.toString();
  return qs ? `/mon-an?${qs}` : '/mon-an';
}

export function SourceFilterTabs({
  current,
  params,
}: {
  current: RecipeSourceFilter;
  params: Record<string, string | string[] | undefined>;
}) {
  return (
    <nav aria-label="Lọc theo nguồn công thức" className="flex flex-wrap gap-2" data-testid="source-filter">
      {OPTIONS.map(({ value, label, hint, Icon }) => {
        const active = current === value;
        return (
          <Link
            key={value}
            id={`source-filter-${value}`}
            href={buildHref(params, value)}
            title={hint}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              active
                ? value === 'cho'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] shadow-xs'
                : 'bg-[var(--color-surface-white)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
