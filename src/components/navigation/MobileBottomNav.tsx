'use client';

// Mobile Bottom Navigation Bar — Tối ưu trải nghiệm sử dụng trên Smartphone / PWA
import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, Calendar, BookOpen, Refrigerator } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/meal', label: 'Mâm cơm', icon: UtensilsCrossed },
  { href: '/tu-lanh', label: 'Tủ lạnh', icon: Refrigerator },
  { href: '/ke-hoach-tuan', label: 'Kế hoạch', icon: Calendar },
  { href: '/nhat-ky', label: 'Nhật ký', icon: BookOpen },
];

function MobileBottomNavInner() {
  const pathname = usePathname();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 flex items-center justify-around shadow-lg safe-area-bottom"
      aria-label="Điều hướng di động"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-[var(--color-brand-primary)] font-bold'
                : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
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

