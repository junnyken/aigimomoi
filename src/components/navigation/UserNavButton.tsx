'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, LogIn } from 'lucide-react';

interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  role: string;
}

export function UserNavButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
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
    return (
      <Link
        href="/profile"
        title={`Tài khoản: ${user.displayName}`}
        className="inline-flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-[var(--color-brand-light)] hover:bg-[var(--color-brand-border)]/40 text-[var(--color-brand-primary)] border border-[var(--color-brand-border)] text-xs font-semibold transition-colors shrink-0"
      >
        <span className="w-6 h-6 rounded-full bg-[var(--color-brand-primary)] text-white flex items-center justify-center text-[10px] font-bold">
          {initials}
        </span>
        <span className="hidden sm:inline max-w-[100px] truncate">{user.displayName}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-[var(--color-brand-primary)] bg-[var(--color-brand-light)] hover:bg-[var(--color-brand-border)]/40 border border-[var(--color-brand-border)] transition-colors shrink-0"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span>Đăng nhập</span>
    </Link>
  );
}
