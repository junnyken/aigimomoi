'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { HEADER_LABELS } from '@/lib/i18n/dictionary';

interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  role: string;
}

export function UserNavButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { locale } = useI18n();
  const labels = HEADER_LABELS[locale];

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--color-surface-raised)] animate-pulse shrink-0" />
    );
  }

  if (user) {
    const initials = user.displayName?.slice(0, 2).toUpperCase() || 'AM';
    const isStaff = user.role === 'ADMIN' || user.role === 'EDITOR';
    const cleanDisplayName =
      user.displayName === 'Quản trị viên Ăn Gì Mom'
        ? locale === 'en'
          ? 'Editorial Admin'
          : 'Quản trị viên'
        : user.displayName;
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" data-no-i18n="true">
        {isStaff && (
          <Link
            href="/editor/recipes"
            prefetch={false}
            title="Vào trang Quản trị & Ban biên tập"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm leading-5 font-bold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="hidden sm:inline">{labels.admin}</span>
          </Link>
        )}
        <Link
          href="/profile"
          prefetch={false}
          title={`${labels.account}: ${user.displayName}`}
          className="inline-flex items-center gap-1.5 p-1 sm:px-3 sm:py-1.5 rounded-full bg-[var(--color-brand-light)] hover:bg-[var(--color-brand-border)]/40 text-[var(--color-brand-primary)] border border-[var(--color-brand-border)] text-xs sm:text-sm leading-5 font-semibold transition-colors shrink-0"
        >
          <span className="w-5 h-5 rounded-full bg-[var(--color-brand-primary)] text-white flex items-center justify-center text-[10px] font-bold">
            {initials}
          </span>
          <span className="hidden lg:inline max-w-[130px] truncate">{cleanDisplayName}</span>
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      prefetch={false}
      data-no-i18n="true"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-[var(--color-brand-primary)] bg-[var(--color-brand-light)] hover:bg-[var(--color-brand-border)]/40 border border-[var(--color-brand-border)] transition-colors shrink-0"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span>{labels.login}</span>
    </Link>
  );
}
