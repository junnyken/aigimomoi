import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { HeaderNav } from "@/components/navigation/HeaderNav";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { UserNavButton } from "@/components/navigation/UserNavButton";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { getSiteUrl, buildWebsiteJsonLd } from "@/lib/seo/siteConfig";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ĂN GÌ MOM — Hôm nay ăn gì? Công thức cơm nhà, Thực đơn Giảm cân & Tập Gym",
    template: "%s | ĂN GÌ MOM",
  },
  description:
    "Nền tảng công thức nấu ăn gia đình Việt Nam 3 miền, tự động tính Calo & Macro chuẩn Viện Dinh Dưỡng, gợi ý thực đơn giảm cân ít calo, tập gym tăng cơ và đi chợ thông minh.",
  keywords: [
    "hôm nay ăn gì",
    "ăn gì mom",
    "công thức nấu ăn gia đình",
    "bữa cơm gia đình",
    "thực đơn giảm cân ít calo",
    "thực đơn tập gym tăng cơ",
    "tính calo món ăn việt nam",
    "bảng thành phần thực phẩm việt nam",
    "mâm cơm hàng ngày",
  ],
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
    languages: {
      "vi-VN": "/",
      "en-US": "/recipes",
    },
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: "ĂN GÌ MOM",
    title: "ĂN GÌ MOM — Hôm nay ăn gì? Công thức cơm nhà & Thực đơn Dinh dưỡng",
    description:
      "Tìm món cơm nhà 3 miền, tự động tính Calo & Đạm/Béo/Tinh bột theo khẩu phần, ghép mâm cơm và lên danh sách đi chợ thông minh.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ĂN GÌ MOM — Bữa cơm nhà, bớt nghĩ hôm nay ăn gì",
    description:
      "Kho công thức nấu ăn gia đình Việt Nam kèm chỉ số Calo & Macro chuẩn Viện Dinh Dưỡng.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteJsonLd = JSON.stringify(buildWebsiteJsonLd()).replace(/</g, "\\u003c");

  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased overflow-x-hidden`}>
      <body className="min-h-full w-full max-w-full overflow-x-hidden flex flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
        />
        <I18nProvider>
          <ServiceWorkerRegister />
          {/* Sticky Header */}
          <header className="sticky top-0 z-40 w-full bg-[var(--color-surface-white)] border-b border-[var(--color-border-base)] shadow-xs">
            <div className="w-full lg:max-w-[88vw] xl:max-w-[85vw] mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <Link href="/" className="flex flex-col no-underline shrink-0">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight leading-none" data-no-i18n="true">
                    <span className="text-[var(--color-brand-primary)]">ĂN GÌ</span>
                    <span className="text-[var(--color-accent-primary)] ml-1">MOM</span>
                  </div>
                  <span className="text-[11px] text-[var(--color-text-secondary)] mt-1 hidden xl:inline">
                    Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.
                  </span>
                </Link>

                {/* Desktop & Tablet Navigation (Single Row) */}
                <div className="hidden md:flex items-center justify-center min-w-0 flex-1">
                  <HeaderNav />
                </div>

                <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                  <LanguageSwitcher />

                  <UserNavButton />
                </div>
              </div>

              {/* Mobile Secondary Quick Bar (< md) — Không bao giờ bị chật trên màn hình điện thoại */}
              <div className="flex md:hidden items-center justify-center border-t border-[var(--color-border-subtle)] pt-1.5">
                <HeaderNav />
              </div>
            </div>
          </header>

          {/* Main Page Content (có padding bottom trên mobile để không cấn bottom bar) */}
          <main className="flex-1 w-full lg:max-w-[88vw] xl:max-w-[85vw] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 pb-24 md:pb-10 overflow-x-hidden">
            {children}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <MobileBottomNav />

          {/* Semantic SEO Footer with Internal Link Silos */}
          <footer className="bg-[var(--color-surface-white)] border-t border-[var(--color-border-base)] pt-10 pb-28 md:pb-10 mt-auto">
            <div className="w-full lg:max-w-[88vw] xl:max-w-[85vw] mx-auto px-4 sm:px-6 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
                {/* Col 1: Brand & Mission + E-E-A-T Trust Links */}
                <div className="space-y-3">
                  <div className="text-lg font-bold tracking-tight" data-no-i18n="true">
                    <span className="text-[var(--color-brand-primary)]">ĂN GÌ</span>
                    <span className="text-[var(--color-accent-primary)] ml-1">MOM</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Nền tảng gợi ý bữa cơm gia đình Việt Nam, chuẩn hóa định lượng nguyên liệu theo khẩu phần và tính toán Calo/Macro dựa trên Bảng Thành Phần Thực Phẩm Việt Nam (Viện Dinh Dưỡng).
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs font-semibold text-[var(--color-brand-primary)]">
                    <Link href="/gioi-thieu" className="hover:underline">Về Ăn Gì Mom</Link>
                    <span>•</span>
                    <Link href="/hoi-dap" className="hover:underline">Hỏi đáp (FAQ)</Link>
                  </div>
                </div>

                {/* Col 2: Danh mục Món ăn Cơm nhà */}
                <nav aria-label="Danh mục món ăn" className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                    Danh mục Món ăn
                  </h2>
                  <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                    <li><Link href="/mon-an" className="hover:text-[var(--color-brand-primary)]">Tất cả công thức nấu ăn</Link></li>
                    <li><Link href="/mon-an?role=MAIN" className="hover:text-[var(--color-brand-primary)]">Món chính (Mặn) đưa cơm</Link></li>
                    <li><Link href="/mon-an?role=SOUP" className="hover:text-[var(--color-brand-primary)]">Món canh thanh mát</Link></li>
                    <li><Link href="/mon-an?role=SIDE" className="hover:text-[var(--color-brand-primary)]">Món phụ & Rau xào</Link></li>
                    <li><Link href="/mon-an?role=ONE_DISH_MEAL" className="hover:text-[var(--color-brand-primary)]">Món một đĩa (Bún, Phở, Mì)</Link></li>
                  </ul>
                </nav>

                {/* Col 3: Chuyên mục Dinh dưỡng & Mục tiêu */}
                <nav aria-label="Chuyên mục dinh dưỡng" className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                    Mục tiêu Dinh dưỡng
                  </h2>
                  <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                    <li><Link href="/tinh-calo" className="font-semibold text-[var(--color-brand-primary)] hover:underline">⚖️ Tính TDEE, BMI &amp; Calo cá nhân</Link></li>
                    <li><Link href="/mon-an?tax=giam-can-it-calo" className="hover:text-[var(--color-brand-primary)]">Thực đơn Giảm cân · Ít Calo</Link></li>
                    <li><Link href="/mon-an?tax=tap-gym-tang-co" className="hover:text-[var(--color-brand-primary)]">Thực đơn Tập Gym · Tăng cơ</Link></li>
                    <li><Link href="/mon-an?maxCalories=300&sort=calories_asc" className="hover:text-[var(--color-brand-primary)]">Món ăn dưới 300 kcal/khẩu phần</Link></li>
                    <li><Link href="/mon-an?maxCalories=500&sort=calories_asc" className="hover:text-[var(--color-brand-primary)]">Bữa ăn dưới 500 kcal/khẩu phần</Link></li>
                  </ul>
                </nav>

                {/* Col 4: Công cụ Bếp thông minh */}
                <nav aria-label="Công cụ bếp gia đình" className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                    Tiện ích Bếp gia đình
                  </h2>
                  <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                    <li><Link href="/meal" className="hover:text-[var(--color-brand-primary)]">Ghép Mâm cơm 3 món</Link></li>
                    <li><Link href="/ke-hoach-tuan" className="hover:text-[var(--color-brand-primary)]">Lập Kế hoạch Thực đơn Tuần</Link></li>
                    <li><Link href="/tu-lanh" className="hover:text-[var(--color-brand-primary)]">Tủ lạnh nhà tôi (Gợi ý từ đồ sẵn có)</Link></li>
                    <li><Link href="/shopping" className="hover:text-[var(--color-brand-primary)]">Danh sách Đi chợ theo quầy</Link></li>
                    <li><Link href="/sitemap.xml" prefetch={false} className="hover:text-[var(--color-brand-primary)]">Sơ đồ trang web (Sitemap XML)</Link></li>
                  </ul>
                </nav>
              </div>

              <div className="pt-6 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
                <p>© 2026 ĂN GÌ MOM — Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.</p>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  <Link href="/gioi-thieu" className="hover:text-[var(--color-brand-primary)]">Giới thiệu & Phương pháp FCT</Link>
                  <Link href="/hoi-dap" className="hover:text-[var(--color-brand-primary)]">Câu hỏi thường gặp (FAQ)</Link>
                  <Link href="/chinh-sach-bao-mat" className="hover:text-[var(--color-brand-primary)]">Chính sách Bảo mật</Link>
                  <Link href="/dieu-khoan" className="hover:text-[var(--color-brand-primary)]">Điều khoản & Miễn trừ Y khoa</Link>
                  <Link href="/contribute" prefetch={false} className="hover:text-[var(--color-brand-primary)]">Góp món ngon</Link>
                  <Link href="/editor/recipes" prefetch={false} className="hover:text-[var(--color-brand-primary)]">Ban biên tập</Link>
                </div>
              </div>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
