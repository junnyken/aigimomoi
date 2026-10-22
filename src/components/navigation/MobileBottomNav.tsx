'use client';

// Mobile Bottom Navigation Bar — Tối ưu trải nghiệm sử dụng trên Smartphone / PWA
import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, UtensilsCrossed, BookOpen, Refrigerator } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { HEADER_LABELS } from '@/lib/i18n/dictionary';

const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/mon-an', label: 'Tìm món', icon: Search },
  { href: '/meal', label: 'Mâm cơm', icon: UtensilsCrossed },
  { href: '/tu-lanh', label: 'Tủ lạnh', icon: Refrigerator },
  { href: '/nhat-ky', label: 'Nhật ký', icon: BookOpen },
];

function MobileBottomNavInner() {
  const pathname = usePathname();
  const { locale } = useI18n();
  const labels = HEADER_LABELS[locale];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--color-surface-white)]/95 backdrop-blur-md border-t border-[var(--color-border-base)] px-1.5 py-1.5 grid grid-cols-5 items-center shadow-lg safe-area-bottom"
      aria-label="Điều hướng di động"
      data-no-i18n="true"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const displayLabel = labels[item.href] || item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`min-h-11 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
              isActive
                ? 'text-[var(--color-brand-primary)] bg-[var(--color-brand-light)]/70 font-bold'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] tracking-tight truncate max-w-full">{displayLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  );
}

