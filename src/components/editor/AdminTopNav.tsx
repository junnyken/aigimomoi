'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Carrot,
  Tags,
  ShieldCheck,
  MessageSquare,
  Flag,
  ArrowLeft,
  ChefHat,
  Plus,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface AdminNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor?: string;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: '/editor/dashboard',
    label: 'Tổng quan & Số liệu',
    icon: LayoutDashboard,
  },
  {
    href: '/editor/users',
    label: 'Quản lý Tài khoản',
    icon: Users,
  },
  {
    href: '/editor/recipes',
    label: 'Kho Công thức',
    icon: BookOpen,
  },
  {
    href: '/editor/ingredients',
    label: 'Nguyên liệu FCT',
    icon: Carrot,
  },
  {
    href: '/editor/taxonomies',
    label: 'Nhãn phân loại',
    icon: Tags,
  },
  {
    href: '/editor/recipes/review',
    label: 'Hàng chờ duyệt',
    icon: ShieldCheck,
  },
  {
    href: '/editor/feedbacks',
    label: 'Đánh giá nấu thử',
    icon: MessageSquare,
  },
  {
    href: '/editor/reports',
    label: 'Báo cáo vi phạm',
    icon: Flag,
  },
  {
    href: '/editor/ai-settings',
    label: 'Kết nối AI (DeepSeek)',
    icon: Sparkles,
  },
];

interface AdminTopNavProps {
  title?: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
}

export function AdminTopNav({ title, subtitle, rightActions }: AdminTopNavProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network error on logout
    }
    window.location.assign('/admin-login');
  };

  return (
    <header className="bg-white border-b border-[#EADBC8] shadow-xs rounded-t-2xl">
      <div className="w-full mx-auto px-4 sm:px-6 pt-3.5 pb-3 space-y-3">
        {/* Hàng 1: Thương hiệu Quản trị + Nút thao tác nhanh bên phải */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C6A59] hover:text-[#3F6240] transition-colors px-2.5 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F3E9DD] border border-[#EADBC8]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Trang chủ Web</span>
            </Link>
            <div className="h-5 w-px bg-[#EADBC8] hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[#B75B35] shrink-0" />
                <span className="text-base sm:text-lg font-extrabold text-[#2F4F30]">
                  {title || 'Trung Tâm Quản Trị Ăn Gì Mom (Admin Portal)'}
                </span>
              </div>
              {subtitle && (
                <p className="text-[11px] text-[#7C6A59] hidden sm:block">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {rightActions || (
              <>
                <Link
                  href="/editor/users?create=1"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-emerald-50 text-[#2F4F30] border border-[#D8C7B0] text-xs font-bold transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>+ Tạo tài khoản</span>
                </Link>
                <Link
                  href="/editor/recipes/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#3F6240] hover:bg-[#324f33] text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Soạn bài / Công thức</span>
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
              title="Đăng xuất khỏi Cổng Quản Trị"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Hàng 2: Thanh Tab 8 Phân hệ Quản trị Thống nhất — Tự động co giãn trọn vẹn trên 1 hàng không thanh cuộn */}
        <nav
          aria-label="Phân hệ quản trị"
          className="flex flex-wrap items-center gap-1.5"
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/editor/recipes'
                ? pathname === '/editor/recipes' || pathname === '/editor/recipes/new'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-[#3F6240] text-white border-[#3F6240] shadow-2xs'
                    : 'bg-[#FAF7F0] text-[#5C4A3A] border-[#E5DAC8] hover:border-[#3F6240] hover:text-[#2F4F30]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
