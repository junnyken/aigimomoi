'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ROLE_LABELS } from '@/lib/recipes/labels';

interface RoleFilterTabsProps {
  currentRole?: string;
  roleCounts?: Record<string, number>;
  totalCount?: number;
}

const ORDERED_ROLES = [
  { key: '', label: 'Tất cả món' },
  { key: 'MAIN', label: ROLE_LABELS.MAIN ?? 'Món mặn' },
  { key: 'SOUP', label: ROLE_LABELS.SOUP ?? 'Món canh' },
  { key: 'SIDE', label: ROLE_LABELS.SIDE ?? 'Món rau / phụ' },
  { key: 'ONE_DISH_MEAL', label: ROLE_LABELS.ONE_DISH_MEAL ?? 'Món một đĩa' },
  { key: 'DESSERT', label: ROLE_LABELS.DESSERT ?? 'Tráng miệng' },
  { key: 'BEVERAGE', label: ROLE_LABELS.BEVERAGE ?? 'Đồ uống' },
];

export function RoleFilterTabs({ currentRole = '', roleCounts = {}, totalCount = 0 }: RoleFilterTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function selectRole(roleKey: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (roleKey) {
      params.set('role', roleKey);
    } else {
      params.delete('role');
    }
    params.delete('page');

    startTransition(() => {
      router.push(`/mon-an?${params.toString()}`);
    });
  }

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        {ORDERED_ROLES.map(({ key, label }) => {
          const isActive = (currentRole === key) || (!currentRole && key === '');
          const count = key === '' ? totalCount : (roleCounts[key] ?? 0);

          return (
            <button
              key={key}
              type="button"
              onClick={() => selectRole(key)}
              disabled={isPending}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-surface-white)] text-[var(--color-text-secondary)] border border-[var(--color-border-base)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
