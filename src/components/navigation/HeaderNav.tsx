'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HEADER_NAV_ITEMS = [
  { href: '/', label: 'Trang chủ', inMobileBottomBar: true },
  { href: '/mon-an', label: 'Tìm món', inMobileBottomBar: false },
  { href: '/da-luu', label: 'Đã lưu', inMobileBottomBar: false },
  { href: '/meal', label: 'Mâm cơm', inMobileBottomBar: true },
  { href: '/shopping', label: 'Đi chợ', inMobileBottomBar: false },
  { href: '/tu-lanh', label: 'Tủ lạnh', inMobileBottomBar: true },
  { href: '/ke-hoach-tuan', label: 'Kế hoạch', inMobileBottomBar: true },
  { href: '/nhat-ky', label: 'Nhật ký', inMobileBottomBar: true },
];

function HeaderNavList({ activePath }: { activePath: string | null }) {
  return (
    <nav
      className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-1 max-w-[calc(100vw-180px)] sm:max-w-none"
      aria-label="Điều hướng chính"
    >
      {HEADER_NAV_ITEMS.map((item) => {
        const isActive =
          activePath !== null &&
          (item.href === '/'
            ? activePath === '/'
            : activePath === item.href || activePath.startsWith(`${item.href}/`));

        // Trên mobile (< md), ẩn các tab đã có ở MobileBottomNav để thanh Header trên cùng thoáng gọn
        const visibilityClass = item.inMobileBottomBar ? 'hidden md:inline-flex' : 'inline-flex';

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`${visibilityClass} items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors shrink-0 ${
              isActive
                ? 'bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] font-bold border border-[var(--color-brand-border)]/70 shadow-2xs'
                : 'font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-raised)]'
            }`}
          >
            <span>{item.label}</span>
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
