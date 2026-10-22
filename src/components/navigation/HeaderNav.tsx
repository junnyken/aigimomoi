'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { HEADER_LABELS } from '@/lib/i18n/dictionary';

const HEADER_NAV_ITEMS = [
  { href: '/', label: 'Trang chủ', inMobileBottomBar: true },
  { href: '/mon-an', label: 'Tìm món', inMobileBottomBar: true },
  { href: '/tinh-calo', label: 'Tính Calo', inMobileBottomBar: false },
  { href: '/meal', label: 'Mâm cơm', inMobileBottomBar: true },
  { href: '/shopping', label: 'Đi chợ', inMobileBottomBar: false },
  { href: '/tu-lanh', label: 'Tủ lạnh', inMobileBottomBar: true },
  { href: '/ke-hoach-tuan', label: 'Kế hoạch', inMobileBottomBar: false },
  { href: '/nhat-ky', label: 'Nhật ký', inMobileBottomBar: true },
];

function HeaderNavList({ activePath }: { activePath: string | null }) {
  const { locale } = useI18n();
  const labels = HEADER_LABELS[locale];

  return (
    <nav
      className="flex items-center justify-center gap-1 lg:gap-1.5 xl:gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5 min-w-0"
      aria-label="Điều hướng chính"
      data-no-i18n="true"
    >
      {HEADER_NAV_ITEMS.map((item) => {
        const isActive =
          activePath !== null &&
          (item.href === '/'
            ? activePath === '/'
            : activePath === item.href || activePath.startsWith(`${item.href}/`));

        // Trên mobile (< md), ẩn các tab đã có ở MobileBottomNav để thanh Header trên cùng thoáng gọn, không tràn ngang
        const visibilityClass = item.inMobileBottomBar ? 'hidden md:inline-flex' : 'inline-flex';
        const displayLabel = labels[item.href] || item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`${visibilityClass} items-center justify-center gap-1 px-2.5 lg:px-3 xl:px-3.5 py-1.5 rounded-full text-xs sm:text-sm leading-5 transition-colors shrink-0 ${
              isActive
                ? 'bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] font-bold border border-[var(--color-brand-border)]/70 shadow-2xs'
                : 'font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-raised)] border border-transparent'
            }`}
          >
            <span>{displayLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HeaderNavInner() {
  const pathname = usePathname();
  return <HeaderNavList activePath={pathname} />;
}

export function HeaderNav() {
  return (
    <Suspense fallback={<HeaderNavList activePath={null} />}>
      <HeaderNavInner />
    </Suspense>
  );
}
