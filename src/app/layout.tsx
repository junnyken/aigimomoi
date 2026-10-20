import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ĂN GÌ MOM — Bữa cơm nhà, bớt nghĩ hôm nay ăn gì",
  description: "Website giúp người nấu cơm gia đình tìm món, chuẩn bị nguyên liệu đúng khẩu phần, ghép một bữa cơm và làm theo từng bước.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-[var(--color-surface-white)] border-b border-[var(--color-border-base)] shadow-xs">
          <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="flex flex-col no-underline">
              <div className="text-2xl font-bold tracking-tight leading-none">
                <span className="text-[var(--color-brand-primary)]">ĂN GÌ</span>
                <span className="text-[var(--color-accent-primary)] ml-1">MOM</span>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] mt-1 hidden sm:inline">
                Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.
              </span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2" aria-label="Điều hướng chính">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <span>Trang chủ</span>
              </Link>
              <Link
                href="/mon-an"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <span>Tìm món</span>
              </Link>
              <Link
                href="/da-luu"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <span>Đã lưu</span>
              </Link>
              <Link
                href="/meal"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <span>Mâm cơm</span>
              </Link>
              <Link
                href="/shopping"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <span>Đi chợ</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-[var(--color-surface-white)] border-t border-[var(--color-border-base)] py-6 text-center mt-auto">
          <p className="text-xs text-[var(--color-text-muted)]">
            ĂN GÌ MOM — Bữa cơm nhà, bớt nghĩ hôm nay ăn gì. Nền tảng Next.js Production (Phase P3).
          </p>
        </footer>
      </body>
    </html>
  );
}
