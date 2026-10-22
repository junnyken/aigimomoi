import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { HeaderNav } from "@/components/navigation/HeaderNav";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { UserNavButton } from "@/components/navigation/UserNavButton";
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
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased overflow-x-hidden`}>
      <body className="min-h-full w-full max-w-full overflow-x-hidden flex flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
        <ServiceWorkerRegister />
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 w-full bg-[var(--color-surface-white)] border-b border-[var(--color-border-base)] shadow-xs">
          <div className="max-w-[1680px] w-full mx-auto px-3.5 sm:px-6 lg:px-10 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
            <Link href="/" className="flex flex-col no-underline shrink-0">
              <div className="text-xl sm:text-2xl font-bold tracking-tight leading-none">
                <span className="text-[var(--color-brand-primary)]">ĂN GÌ</span>
                <span className="text-[var(--color-accent-primary)] ml-1">MOM</span>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] mt-1 hidden sm:inline">
                Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.
              </span>
            </Link>

            <div className="flex items-center justify-end gap-1.5 sm:gap-3 min-w-0 flex-1">
              <HeaderNav />

              <UserNavButton />
            </div>
          </div>
        </header>

        {/* Main Page Content (có padding bottom trên mobile để không cấn bottom bar) */}
        <main className="flex-1 max-w-[1680px] w-full mx-auto px-3.5 sm:px-6 lg:px-10 py-5 sm:py-6 pb-24 md:pb-8 overflow-x-hidden">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav />

        {/* Footer */}
        <footer className="bg-[var(--color-surface-white)] border-t border-[var(--color-border-base)] py-8 text-center mt-auto pb-28 md:pb-8">
          <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-10 space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              <Link href="/" className="hover:text-[var(--color-brand-primary)]">Trang chủ</Link>
              <Link href="/mon-an" className="hover:text-[var(--color-brand-primary)]">Món ăn</Link>
              <Link href="/meal" className="hover:text-[var(--color-brand-primary)]">Mâm cơm</Link>
              <Link href="/contribute" prefetch={false} className="hover:text-[var(--color-brand-primary)]">Góp món ngon</Link>
              <Link href="/profile" prefetch={false} className="hover:text-[var(--color-brand-primary)]">Tài khoản</Link>
              <Link href="/editor/recipes" prefetch={false} className="hover:text-[var(--color-brand-primary)]">Ban biên tập</Link>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              ĂN GÌ MOM — Bữa cơm nhà, bớt nghĩ hôm nay ăn gì. Nền tảng Bếp gia đình Việt.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
