import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { HeaderNav } from "@/components/navigation/HeaderNav";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { UserNavButton } from "@/components/navigation/UserNavButton";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { ScrollToTopButton } from "@/components/navigation/ScrollToTopButton";
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
            <div className="w-full lg:max-w-[95vw] xl:max-w-[92vw] mx-auto px-3.5 sm:px-5 py-2.5 sm:py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <Link href="/" className="flex flex-col no-underline shrink-0">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight leading-none" data-no-i18n="true">
                    <span className="text-[var(--color-brand-primary)]">ĂN GÌ</span>
                    <span className="text-[var(--color-accent-primary)] ml-1">MOM</span>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 hidden xl:inline whitespace-nowrap">
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

          {/* Mobile Bottom Navigation Bar & Floating Scroll-to-Top Button */}
          <MobileBottomNav />
          <ScrollToTopButton />

          {/* Semantic SEO Footer with Internal Link Silos */}
          <footer className="bg-[var(--color-surface-white)] border-t border-[var(--color-border-base)] pt-8 sm:pt-10 pb-32 md:pb-10 mt-auto">
            <div className="w-full lg:max-w-[88vw] xl:max-w-[85vw] mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-6 sm:gap-8 text-left">
                {/* Col 1: Brand & Mission + E-E-A-T Trust Links (Full width on mobile, 1 col on desktop) */}
                <div className="col-span-2 lg:col-span-1 space-y-2.5 pb-5 border-b border-[var(--color-border-subtle)] lg:pb-0 lg:border-b-0">
                  <div className="text-lg font-bold tracking-tight" data-no-i18n="true">
                    <span className="text-[var(--color-brand-primary)]">ĂN GÌ</span>
                    <span className="text-[var(--color-accent-primary)] ml-1">MOM</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Nền tảng gợi ý bữa cơm gia đình Việt Nam, chuẩn hóa định lượng nguyên liệu theo khẩu phần và tính toán Calo/Macro dựa trên Bảng Thành Phần Thực Phẩm Việt Nam (Viện Dinh Dưỡng).
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold text-[var(--color-brand-primary)]">
                    <Link href="/gioi-thieu" className="px-2.5 py-1 rounded-full bg-[var(--color-brand-light)]/70 hover:bg-[var(--color-brand-light)] transition-colors">
                      Về Ăn Gì Mom
                    </Link>
                    <Link href="/hoi-dap" className="px-2.5 py-1 rounded-full bg-[var(--color-brand-light)]/70 hover:bg-[var(--color-brand-light)] transition-colors">
                      Hỏi đáp (FAQ)
                    </Link>
                    <Link href="/contribute" prefetch={false} className="px-2.5 py-1 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors">
                      Góp món ngon
                    </Link>
                  </div>
                </div>

                {/* Col 2: Danh mục Món ăn Cơm nhà (Cột trái trên điện thoại) */}
                <nav aria-label="Danh mục món ăn" className="col-span-1 space-y-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                    Danh mục Món ăn
                  </h2>
                  <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                    <li><Link href="/mon-an" className="hover:text-[var(--color-brand-primary)]">Tất cả công thức nấu ăn</Link></li>
                    <li><Link href="/mon-an?role=MAIN" className="hover:text-[var(--color-brand-primary)]">Món chính (Mặn) đưa cơm</Link></li>
                    <li><Link href="/mon-an?role=SOUP" className="hover:text-[var(--color-brand-primary)]">Món canh thanh mát</Link></li>
                    <li><Link href="/mon-an?role=SIDE" className="hover:text-[var(--color-brand-primary)]">Món phụ &amp; Rau xào</Link></li>
                    <li><Link href="/mon-an?role=ONE_DISH_MEAL" className="hover:text-[var(--color-brand-primary)]">Món một đĩa (Bún, Phở, Mì)</Link></li>
                  </ul>
                </nav>

                {/* Col 3: Chuyên mục Dinh dưỡng & Mục tiêu (Cột phải trên điện thoại — Cân đối 2 bên) */}
                <nav aria-label="Chuyên mục dinh dưỡng" className="col-span-1 space-y-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                    Mục tiêu Dinh dưỡng
                  </h2>
                  <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                    <li><Link href="/tinh-calo" className="font-semibold text-[var(--color-brand-primary)] hover:underline">⚖️ Tính TDEE, BMI &amp; Calo</Link></li>
                    <li><Link href="/mon-an?tax=giam-can-it-calo" className="hover:text-[var(--color-brand-primary)]">Thực đơn Giảm cân · Ít Calo</Link></li>
                    <li><Link href="/mon-an?tax=tap-gym-tang-co" className="hover:text-[var(--color-brand-primary)]">Thực đơn Tập Gym · Tăng cơ</Link></li>
                    <li><Link href="/mon-an?maxCalories=300&sort=calories_asc" className="hover:text-[var(--color-brand-primary)]">Món dưới 300 kcal/phần</Link></li>
                    <li><Link href="/mon-an?maxCalories=500&sort=calories_asc" className="hover:text-[var(--color-brand-primary)]">Bữa dưới 500 kcal/phần</Link></li>
                  </ul>
                </nav>

                {/* Col 4: Công cụ Bếp thông minh (Chia 2 cột cân đối trên điện thoại, 1 cột trên máy tính) */}
                <nav aria-label="Công cụ bếp gia đình" className="col-span-2 lg:col-span-1 space-y-2.5 pt-4 border-t border-[var(--color-border-subtle)] lg:pt-0 lg:border-t-0">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                    Tiện ích Bếp gia đình
                  </h2>
                  <ul className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-2 text-xs text-[var(--color-text-secondary)]">
                    <li><Link href="/meal" className="hover:text-[var(--color-brand-primary)]">Ghép Mâm cơm 3 món</Link></li>
                    <li><Link href="/ke-hoach-tuan" className="hover:text-[var(--color-brand-primary)]">Kế hoạch Thực đơn Tuần</Link></li>
                    <li><Link href="/tu-lanh" className="hover:text-[var(--color-brand-primary)]">Tủ lạnh nhà tôi (Đồ sẵn có)</Link></li>
                    <li><Link href="/shopping" className="hover:text-[var(--color-brand-primary)]">Danh sách Đi chợ theo quầy</Link></li>
                    <li><Link href="/sitemap.xml" prefetch={false} className="hover:text-[var(--color-brand-primary)]">Sơ đồ trang web (Sitemap)</Link></li>
                    <li><Link href="/editor/recipes" prefetch={false} className="hover:text-[var(--color-brand-primary)]">Ban biên tập</Link></li>
                  </ul>
                </nav>
              </div>

              <div className="pt-5 border-t border-[var(--color-border-subtle)] pr-12 sm:pr-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-[var(--color-text-muted)]">
                <p>© 2026 ĂN GÌ MOM — Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.</p>
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                  <Link href="/gioi-thieu" className="hover:text-[var(--color-brand-primary)]">Giới thiệu &amp; Phương pháp FCT</Link>
                  <span>•</span>
                  <Link href="/hoi-dap" className="hover:text-[var(--color-brand-primary)]">Hỏi đáp (FAQ)</Link>
                  <span>•</span>
                  <Link href="/chinh-sach-bao-mat" className="hover:text-[var(--color-brand-primary)]">Chính sách Bảo mật</Link>
                  <span>•</span>
                  <Link href="/dieu-khoan" className="hover:text-[var(--color-brand-primary)]">Điều khoản &amp; Miễn trừ Y khoa</Link>
                </div>
              </div>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
