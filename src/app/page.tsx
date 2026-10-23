import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  Sparkles,
  Utensils,
  ShoppingBag,
  ChefHat,
  Clock,
  Flame,
  Soup,
  Salad,
  CheckCircle2,
  ArrowRight,
  Refrigerator,
  HeartPulse,
  Droplets,
  CupSoda,
  Scale,
  ShieldCheck,
  BookOpen,
  PlusCircle,
  Info,
} from "lucide-react";
import { listPublishedRecipes } from "@/lib/recipes/public";
import { searchPublishedRecipes } from "@/lib/recipes/searchQueries";
import { resolveMealSelection } from "@/lib/meal/mealQueries";
import { buildMealQuery } from "@/lib/meal/flowUrls";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { QuickRandomMealSpinner } from "@/components/meal/QuickRandomMealSpinner";
import { HeroFoodScannerCard } from "@/components/nutrition/HeroFoodScannerCard";

const QUICK_MOOD_CHIPS = [
  {
    label: "Nhanh gọn ≤ 25 phút",
    href: "/mon-an?maxTime=25&sort=quickest",
    icon: Clock,
  },
  {
    label: "Món mặn đưa cơm",
    href: "/mon-an?role=MAIN",
    icon: Flame,
  },
  {
    label: "Canh thanh mát",
    href: "/mon-an?role=SOUP",
    icon: Soup,
  },
  {
    label: "Rau xào xanh giòn",
    href: "/mon-an?role=SIDE",
    icon: Salad,
  },
  {
    label: "Giảm cân ≤ 350 kcal",
    href: "/mon-an?maxCalories=350&sort=calories_asc",
    icon: HeartPulse,
  },
  {
    label: "Nước chấm & Sốt",
    href: "/mon-an?role=DIPPING_SAUCE",
    icon: Droplets,
  },
  {
    label: "Đã nấu thử tại bếp",
    href: "/mon-an?tested=true",
    icon: CheckCircle2,
  },
];

const CULINARY_CATEGORIES = [
  {
    title: "Món Mặn Đưa Cơm",
    subtitle: "Kho tộ, rim mặn ngọt, chiên sả, nướng đậm đà",
    badge: "Trụ cột mâm cơm",
    href: "/mon-an?role=MAIN",
    icon: Flame,
    tone: "bg-[var(--color-accent-light)]/70 text-[var(--color-accent-primary)] border-[var(--color-accent-primary)]/20",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Món Canh Thanh Mát",
    subtitle: "Canh chua, canh rau tôm thịt, hầm xương ngọt nước",
    badge: "Dịu vị bữa ăn",
    href: "/mon-an?role=SOUP",
    icon: Soup,
    tone: "bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] border-[var(--color-brand-border)]",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Rau Xào & Món Phụ",
    subtitle: "Rau luộc chấm kho quẹt, xào tỏi xanh giòn, gỏi trộn",
    badge: "Giàu chất xơ",
    href: "/mon-an?role=SIDE",
    icon: Salad,
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Nước Chấm & Sốt",
    subtitle: "Nước mắm tỏi ớt, mắm nêm, kho quẹt, muối ớt xanh",
    badge: "Linh hồn món Việt",
    href: "/mon-an?role=DIPPING_SAUCE",
    icon: Droplets,
    tone: "bg-amber-50 text-amber-700 border-amber-200",
    image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Món Giảm Cân • Ít Calo",
    subtitle: "Hấp, luộc, áp chảo ít dầu mỡ ≤ 350 kcal/khẩu phần",
    badge: "Eat Clean kiểu Việt",
    href: "/mon-an?tax=giam-can-it-calo",
    icon: HeartPulse,
    tone: "bg-rose-50 text-rose-700 border-rose-200",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Món Nước & Trọn Bữa",
    subtitle: "Bún, phở, miến gà, hủ tiếu, cơm chiên đổi vị cuối tuần",
    badge: "Đổi gió 1 tô",
    href: "/mon-an?role=ONE_DISH_MEAL",
    icon: Utensils,
    tone: "bg-sky-50 text-sky-700 border-sky-200",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Tráng Miệng & Đồ Uống",
    subtitle: "Chè thanh nhiệt, sữa hạt, nước sâm, trà trái cây",
    badge: "Ngọt lành",
    href: "/mon-an?role=DESSERT",
    icon: CupSoda,
    tone: "bg-purple-50 text-purple-700 border-purple-200",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Tập Gym • Giàu Protein",
    subtitle: "Ức gà, thăn bò, cá hồi, tôm trứng chuẩn Macro tăng cơ",
    badge: "25–45g Đạm/phần",
    href: "/mon-an?tax=tap-gym-tang-co",
    icon: ShieldCheck,
    tone: "bg-[var(--color-surface-raised)] text-[var(--color-brand-primary)] border-[var(--color-border-base)]",
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80",
  },
];

const HEALTH_MEAL_SCENARIOS = [
  {
    goal: "Giảm cân nhẹ nhàng (Eat Clean Việt)",
    targetKcal: "380 – 480 kcal / bữa",
    dailyRef: "~1.300 – 1.500 kcal/ngày",
    formula: "½ – 1 chén cơm (~90 kcal) + Món mặn hấp/kho ít mỡ (~190 kcal) + Canh rau (~50 kcal) + Rau luộc/gỏi (~70 kcal)",
    tip: "Ưu tiên ức gà, cá hấp, đậu hũ, tôm thịt nạc; chấm nước mắm nguyên chất pha loãng thay vì sốt sệt nhiều đường.",
    href: "/mon-an?maxCalories=350&sort=calories_asc",
    ctaLabel: "Xem món ≤ 350 kcal",
    badgeTone: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    goal: "Giữ dáng & Cơm nhà cân bằng",
    targetKcal: "550 – 650 kcal / bữa",
    dailyRef: "~1.800 – 2.000 kcal/ngày",
    formula: "1 – 1.5 chén cơm (~160 kcal) + Món mặn kho/rim vừa (~260 kcal) + Canh (~70 kcal) + Rau xào (~90 kcal)",
    tip: "Công thức chuẩn cho bữa tối gia đình 4 người: đủ 3 nhóm chất Đạm – Xơ – Tinh bột, không lo tích mỡ thừa.",
    href: "/meal",
    ctaLabel: "Ghép mâm cân bằng",
    badgeTone: "bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] border-[var(--color-brand-border)]",
  },
  {
    goal: "Tăng cơ • Ngày vận động nhiều",
    targetKcal: "700 – 850 kcal / bữa",
    dailyRef: "~2.200 – 2.500 kcal/ngày",
    formula: "1.5 – 2 chén cơm (~240 kcal) + Món mặn giàu đạm thịt/cá/trứng (~350 kcal) + Canh hầm (~120 kcal) + Rau củ (~90 kcal)",
    tip: "Tăng khẩu phần thịt bò, cá thu, trứng, thịt heo nạc vai để đạt 30–40g Protein tự nhiên trong mỗi bữa ăn.",
    href: "/mon-an?role=MAIN&nutrition=true",
    ctaLabel: "Xem món giàu đạm",
    badgeTone: "bg-[var(--color-accent-light)] text-[var(--color-accent-text)] border-[var(--color-accent-primary)]/20",
  },
];

const KITCHEN_CALORIE_EQUIVALENTS = [
  {
    item: "1 chén cơm trắng vừa (100g chín)",
    kcal: "~130 kcal",
    detail: "28g tinh bột • 2.7g đạm",
  },
  {
    item: "1 chén cơm gạo lứt (100g chín)",
    kcal: "~110 kcal",
    detail: "Giàu chất xơ gấp 3 lần, no lâu",
  },
  {
    item: "1 muỗng canh dầu ăn / mỡ (10ml)",
    kcal: "~90 kcal",
    detail: "Lưu ý khi chiên ngập dầu hoặc xào bóng",
  },
  {
    item: "1 chén nhỏ nước chấm / kho quẹt",
    kcal: "15 – 55 kcal",
    detail: "Chứa ~600–900mg Natri (cần giảm nếu huyết áp cao)",
  },
];

const FAMILY_HEALTH_MENUS = [
  {
    title: "Thực đơn Eat Clean • Giảm mỡ",
    desc: "Ưu tiên món hấp, luộc, ít dầu mỡ ≤ 350 kcal/phần kèm ½ chén cơm gạo lứt & muối ớt xanh.",
    badge: "380–480 kcal/bữa",
    href: "/meal?profile=eat-clean",
  },
  {
    title: "Thực đơn Mẹ bầu & Sau sinh",
    desc: "Giàu đạm tự nhiên, sắt, canxi và canh hầm ngọt lành, ít cay nồng.",
    badge: "Giàu Đạm & Sắt",
    href: "/meal?profile=me-bau",
  },
  {
    title: "Thực đơn Người lớn tuổi",
    desc: "Món mềm dễ tiêu, canh thanh nhiệt, cá/đậu hũ, giảm muối Natri tốt cho huyết áp.",
    badge: "Ít dầu mỡ • Dịu mặn",
    href: "/meal?profile=nguoi-lon-tuoi",
  },
  {
    title: "Thực đơn Cho bé dễ ăn",
    desc: "Mềm ngọt tự nhiên, không cay, giàu đạm và vitamin giúp bé ăn ngon miệng.",
    badge: "Không cay • Đưa cơm",
    href: "/meal?profile=cho-be",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      {/* TẦNG 1: Hero Section — Gian Bếp Gia Đình Ấm Áp (Warm Family Kitchen) */}
      <section className="relative overflow-hidden py-7 sm:py-10 lg:py-12 px-4 sm:px-8 lg:px-10 bg-gradient-to-br from-[#EEF5EE] via-[#FDF8F2] to-[#FCEEE5] border border-[var(--color-border-base)] rounded-3xl shadow-xs">
        {/* Điểm nhấn ánh sáng ấm áp nền sau */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Cột Trái: Câu chuyện Bữa cơm nhà + Thanh Tìm kiếm + Quick Mood Chips */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--color-surface-white)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)] shadow-2xs mb-3.5">
              <ChefHat className="w-4 h-4 text-[var(--color-accent-primary)]" />
              <span>Gian bếp của Mẹ • Bữa cơm gia đình ấm áp mỗi ngày</span>
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-brand-primary)] tracking-tight leading-tight mb-3">
              Hôm nay nhà mình ăn gì?
            </h1>

            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-5 max-w-3xl leading-relaxed">
              Từ mâm cơm 3 món sum vầy (Mặn • Canh • Rau), bát nước chấm gia truyền đến thực đơn{" "}
              <strong className="text-[var(--color-text-primary)]">Giảm cân ít Calo &amp; Tập Gym</strong> — tất cả đã được cân chỉnh định lượng chuẩn xác cho gia đình Việt.
            </p>

            {/* Quick search input leading to /mon-an */}
            <form action="/mon-an" method="GET" className="w-full max-w-3xl mb-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="q"
                  placeholder="Tìm món ăn hoặc nguyên liệu: thịt kho trứng, canh chua, ức gà, cá hồi..."
                  className="w-full pl-4 pr-28 py-3.5 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] shadow-xs"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-2 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Tìm món
                </button>
              </div>
            </form>

            {/* Quick Mood / Context Filter Chips */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6" aria-label="Gợi ý tìm món nhanh">
              {QUICK_MOOD_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <Link
                    key={chip.href}
                    href={chip.href}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-surface-white)]/90 text-[var(--color-text-secondary)] border border-[var(--color-border-base)] hover:border-[var(--color-brand-border)] hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand-primary)] transition-colors shadow-2xs"
                  >
                    <Icon className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
                    <span>{chip.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/meal"
                className="col-span-2 sm:col-span-1 min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-[var(--color-accent-primary)] text-white shadow-sm hover:bg-[var(--color-accent-hover)] transition-transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <Utensils className="w-4 h-4 shrink-0" />
                <span>Ghép mâm cơm 3 món</span>
              </Link>
              <Link
                href="/shopping"
                className="min-h-11 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl font-semibold bg-[var(--color-surface-white)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] hover:bg-[var(--color-surface-raised)] transition-colors text-xs sm:text-sm"
              >
                <ShoppingBag className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
                <span className="truncate">Đi chợ</span>
              </Link>
              <Link
                href="/tu-lanh"
                className="min-h-11 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-medium bg-[var(--color-surface-white)]/80 text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] border border-[var(--color-border-base)] transition-colors text-xs sm:text-sm"
              >
                <Refrigerator className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
                <span className="truncate">Tủ lạnh nhà</span>
              </Link>
            </div>

            {/* Vòng quay 1 chạm Hôm nay ăn gì + Lối tắt Tính TDEE / BMI */}
            <QuickRandomMealSpinner />
          </div>

          {/* Cột Phải: Khung AI Quét Ảnh Đĩa Ăn Trực Quan — Biết Ngay Kcal & Thành Phần */}
          <HeroFoodScannerCard />
        </div>
      </section>

      {/* TẦNG 2: Khám Phá 8 Nhóm Món Cơm Nhà (Bento Category Grid Kèm Hình Ảnh Trực Quan) */}
      <section aria-labelledby="categories-heading" className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-primary)]">
              Danh mục bếp nhà
            </span>
            <h2 id="categories-heading" className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mt-0.5">
              Chọn món theo đúng vị & mục tiêu hôm nay
            </h2>
          </div>
          <Link
            href="/mon-an"
            className="text-xs sm:text-sm font-semibold text-[var(--color-brand-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>Mở bộ lọc tất cả món</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {CULINARY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                href={cat.href}
                className="group rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] hover:border-[var(--color-brand-border)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden h-full"
              >
                {/* Ảnh đại diện danh mục bắt mắt */}
                <div className="relative h-24 sm:h-32 w-full overflow-hidden bg-[var(--color-surface-raised)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.image}
                    alt={cat.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs backdrop-blur-xs bg-white/95 ${cat.tone}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/95 text-[var(--color-text-primary)] shadow-xs truncate max-w-[125px] sm:max-w-none">
                      {cat.badge}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-2.5">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors leading-snug">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed line-clamp-2">
                      {cat.subtitle}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--color-brand-primary)]">
                    <span>Khám phá</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TẦNG 3: Mâm cơm 3 món gợi ý hôm nay (kèm tổng thời gian & ước tính Calo trung thực) */}
      <Suspense fallback={<TodayMealTraySkeleton />}>
        <TodayMealTrayShowcase />
      </Suspense>

      {/* TẦNG 4: Góc Tham Khảo Calo & Dinh Dưỡng Chuẩn Sức Khỏe Việt */}
      <section
        aria-labelledby="calorie-guide-heading"
        className="rounded-3xl border border-[var(--color-border-base)] bg-gradient-to-br from-[var(--color-surface-white)] via-[var(--color-bg-primary)]/50 to-[var(--color-brand-light)]/30 p-6 sm:p-8 shadow-xs flex flex-col gap-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[var(--color-border-subtle)]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)] mb-1">
              <Scale className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
              <span>Cẩm nang dinh dưỡng cơm nhà • Viện Dinh Dưỡng Quốc Gia</span>
            </div>
            <h2 id="calorie-guide-heading" className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
              Tham khảo Calo mâm cơm Việt sao cho chuẩn sức khỏe?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              Khác với món Âu ăn theo đĩa riêng, cơm gia đình Việt Nam là <strong className="text-[var(--color-text-primary)]">mâm cơm gắp chung kèm cơm trắng và nước chấm</strong>. Để kiểm soát cân nặng và sức khỏe thật chuẩn mà không cần cân tiểu ly từng miếng, bạn chỉ cần nắm quy tắc 3 kịch bản dưới đây:
            </p>
          </div>

          <Link
            href="/mon-an?nutrition=true&sort=calories_asc"
            className="min-h-11 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs sm:text-sm font-semibold transition-colors shrink-0 self-start md:self-auto"
          >
            <HeartPulse className="w-4 h-4" />
            <span>Tra cứu món đã kiểm định Calo</span>
          </Link>
        </div>

        {/* 3 Kịch bản sức khỏe */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {HEALTH_MEAL_SCENARIOS.map((sc) => (
            <div
              key={sc.goal}
              className="rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 flex flex-col justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sc.badgeTone}`}>
                    {sc.targetKcal}
                  </span>
                  <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                    {sc.dailyRef}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {sc.goal}
                </h3>
                <div className="p-3 rounded-xl bg-[var(--color-surface-raised)]/80 border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] leading-relaxed">
                  <span className="font-semibold text-[var(--color-brand-primary)]">Cấu trúc 1 bữa: </span>
                  {sc.formula}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  💡 {sc.tip}
                </p>
              </div>

              <Link
                href={sc.href}
                className="min-h-10 inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-brand-light)] text-xs font-semibold text-[var(--color-brand-primary)] transition-colors"
              >
                <span>{sc.ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* 4 Thực đơn theo thể trạng gia đình */}
        <div className="rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-subtle)] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
              <span>Gợi ý Mâm cơm theo thể trạng thành viên trong nhà (1 chạm áp dụng ngay)</span>
            </h3>
            <Link
              href="/meal"
              className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
            >
              Mở bàn ghép mâm &amp; tính Calo theo chén cơm &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FAMILY_HEALTH_MENUS.map((m) => (
              <Link
                key={m.title}
                href={m.href}
                className="group p-3.5 rounded-xl bg-[var(--color-bg-primary)]/70 hover:bg-[var(--color-brand-light)]/50 border border-[var(--color-border-subtle)] hover:border-[var(--color-brand-border)] transition-all flex flex-col justify-between gap-2"
              >
                <div>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-text)] mb-1.5">
                    {m.badge}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)]">
                    {m.title}
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-brand-primary)] inline-flex items-center gap-1">
                  <span>Áp dụng mâm này</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Bảng quy đổi đơn vị bếp nhà & Lưu ý trung thực */}
        <div className="rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-subtle)] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-[var(--color-accent-primary)] shrink-0" />
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Quy đổi nhanh &quot;Đơn vị Bếp Nhà&quot; (Phần hay bị quên khi tính Calo)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {KITCHEN_CALORIE_EQUIVALENTS.map((eqItem) => (
              <div
                key={eqItem.item}
                className="p-3 rounded-xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] flex flex-col justify-between gap-1"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {eqItem.item}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-accent-primary)] shrink-0">
                    {eqItem.kcal}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--color-text-secondary)]">
                  {eqItem.detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kệ món Ít Calo / Đã kiểm định dinh dưỡng lấy trực tiếp từ DB */}
        <Suspense fallback={<div className="h-44 rounded-2xl bg-[var(--color-surface-raised)] animate-pulse" />}>
          <LowCalorieHighlightShelf />
        </Suspense>
      </section>

      {/* TẦNG 5: Kệ Món Ngon Phân Khu Theo Cấu Trúc Mâm Cơm (Mặn • Canh • Rau) & Khám Phá Tổng Hợp */}
      <Suspense fallback={<PublishedShowcaseSkeleton />}>
        <CategorizedShelvesShowcase />
      </Suspense>

      {/* TẦNG 6: 3 bước thảnh thơi vào bếp cùng Mom + Lời mời đóng góp công thức */}
      <section
        aria-label="Quy trình 3 bước nấu cơm nhà"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="p-5 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-subtle)] flex items-start gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] font-bold text-sm flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              Chọn mâm 3 món cân bằng
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              Đủ 1 Món Mặn + 1 Món Canh + 1 Món Rau. Tự động nhân chia nguyên liệu và ước tính Calo chuẩn xác theo số người ăn.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-subtle)] flex items-start gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent-primary)] font-bold text-sm flex items-center justify-center shrink-0">
            2
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              Đi chợ 1 lần theo từng quầy
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              Tự động cộng dồn hành, tỏi, thịt cá của cả 3 món theo quầy hàng và gửi nhanh qua Zalo cho người nhà.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-subtle)] flex items-start gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] font-bold text-sm flex items-center justify-center shrink-0">
            3
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              Đứng bếp nhàn tênh từng giai đoạn
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              Thanh tiến trình 4 giai đoạn (Sơ chế &rarr; Ướp &rarr; Nấu &rarr; Trình bày), bấm giờ từng bước và gợi ý nấu song song.
            </p>
          </div>
        </div>
      </section>

      {/* Banner cộng đồng & sổ tay gia đình */}
      <section className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent-primary)] mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Góc Bếp Cộng Đồng & Gia Truyền</span>
          </span>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Bạn có bí quyết món kho, bát canh hay chén nước chấm tâm đắc?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
            Chia sẻ công thức của gia đình bạn lên Ăn Gì Mom để hệ thống tự động tính bảng dinh dưỡng chuẩn Viện Dinh Dưỡng và lưu giữ cho gian bếp Việt.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          <Link
            href="/contribute/new"
            className="min-h-11 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">Gửi công thức</span>
          </Link>
          <Link
            href="/nhat-ky"
            className="min-h-11 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-brand-light)] text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] text-xs sm:text-sm font-semibold border border-[var(--color-border-base)] transition-colors"
          >
            <span className="truncate">Nhật ký bữa cơm</span>
          </Link>
        </div>
      </section>

      {/* TẦNG 7: Câu hỏi thường gặp (FAQ) chuẩn Google SEO E-E-A-T */}
      <section aria-labelledby="home-faq-heading" className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)]">
              Giải đáp nhanh cho Bếp Nhà
            </span>
            <h2 id="home-faq-heading" className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mt-0.5">
              Câu hỏi thường gặp về Ăn Gì Mom &amp; Tính Calo Cơm Nhà
            </h2>
          </div>
          <Link
            href="/hoi-dap"
            className="text-xs sm:text-sm font-semibold text-[var(--color-brand-primary)] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Xem toàn bộ Câu hỏi thường gặp (FAQ)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] space-y-1.5">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              1. Chỉ số Calo &amp; Đạm trên Ăn Gì Mom được tính như thế nào?
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Mọi công thức được đối chiếu từ <strong>Bảng Thành Phần Thực Phẩm Việt Nam (Viện Dinh Dưỡng — Bộ Y Tế)</strong> và <strong>USDA</strong>, đã trừ hao hụt phần thải bỏ (xương, vỏ, gốc rau) để tính đúng năng lượng thực ăn trên 1 người.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] space-y-1.5">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              2. Làm sao ghép mâm cơm 3 món dưới 500–600 kcal/bữa?
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Bạn chỉ cần vào mục <Link href="/meal" className="text-[var(--color-brand-primary)] font-semibold underline">Ghép mâm cơm</Link> hoặc chọn chế độ <strong>Eat Clean • Giảm mỡ</strong>, hệ thống sẽ tự chọn 1 Món Mặn + 1 Canh + 1 Rau xào cân bằng định lượng và tổng kết Calo cả mâm.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] space-y-1.5">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              3. Tôi có thể đổi số người ăn từ 4 người sang 2 hoặc 6 người không?
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Có! Trên mọi trang công thức và mâm cơm, khi bạn bấm tăng/giảm số người ăn, định lượng từng nguyên liệu (thịt, cá, rau, gia vị) sẽ tự động co giãn theo quy tắc bếp thực tế.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] space-y-1.5">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              4. Danh sách đi chợ có gộp chung nguyên liệu nhiều món không?
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Có! Tính năng <Link href="/shopping" className="text-[var(--color-brand-primary)] font-semibold underline">Đi chợ</Link> tự động cộng dồn hành, tỏi, thịt cá của tất cả các món trong mâm hoặc cả tuần và chia sẵn theo từng quầy hàng chợ Việt.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

async function TodayMealTrayShowcase() {
  await connection();
  const selection = await resolveMealSelection({});
  const dishes = [
    { roleLabel: "Món Mặn", badgeColor: "bg-[var(--color-accent-light)] text-[var(--color-accent-text)]", dish: selection.main },
    { roleLabel: "Món Canh", badgeColor: "bg-[var(--color-brand-light)] text-[var(--color-brand-primary)]", dish: selection.soup },
    { roleLabel: "Món Rau / Xào", badgeColor: "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]", dish: selection.side },
    { roleLabel: "Nước Chấm Đi Kèm", badgeColor: "bg-amber-100 text-amber-800", dish: selection.sauce ?? null },
  ].filter((item) => item.dish !== null);

  if (dishes.length === 0) return null;

  const query = buildMealQuery({
    mainSlug: selection.main?.slug,
    soupSlug: selection.soup?.slug,
    sideSlug: selection.side?.slug,
    sauceSlug: selection.sauce?.slug,
    servings: 4,
  });

  const maxDishTime = Math.max(...dishes.map((d) => d.dish?.totalTimeMinutes ?? 0));
  const sumPrepTime = dishes.reduce((acc, d) => acc + (d.dish?.prepTimeMinutes ?? 0), 0);
  const parallelMinutes = Math.max(maxDishTime, Math.min(sumPrepTime + 20, maxDishTime + 15));

  // Tính tổng Calo 1 khẩu phần của các món đã có dữ liệu dinh dưỡng (Gate P6)
  const dishesWithCalories = dishes.filter(
    (d) =>
      typeof d.dish?.caloriesPerServing === "number" &&
      d.dish.caloriesPerServing > 0 &&
      d.dish.nutritionStatus !== "NO_DATA"
  );
  const dishesKcalPerPerson = dishesWithCalories.reduce(
    (sum, d) => sum + (d.dish?.caloriesPerServing ?? 0),
    0
  );
  const fullMealWithRiceKcal = dishesKcalPerPerson + 130; // + 1 chén cơm trắng chuẩn 100g (~130 kcal)

  return (
    <section
      aria-labelledby="today-meal-heading"
      className="rounded-3xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-6 sm:p-8 shadow-xs"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-[var(--color-border-subtle)]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent-primary)] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gợi ý thực đơn gia đình hôm nay</span>
          </div>
          <h2 id="today-meal-heading" className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
            Mâm cơm 3 món tròn vị (4 người)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Kết hợp hài hòa đạm, canh thanh mát và chất xơ • Ước tính đứng bếp song song khoảng{" "}
            <strong className="text-[var(--color-brand-primary)]">{parallelMinutes} phút</strong>
            {dishesWithCalories.length === dishes.length && dishesKcalPerPerson > 0 && (
              <>
                {" "}• Năng lượng ước tính:{" "}
                <strong className="text-[var(--color-accent-primary)]">
                  ~{dishesKcalPerPerson} kcal/người
                </strong>{" "}
                (khoảng <strong>~{fullMealWithRiceKcal} kcal</strong> nếu ăn kèm 1 chén cơm trắng).
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Link
            href={`/meal?${query}`}
            className="min-h-11 inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-brand-light)] text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] text-xs sm:text-sm font-semibold border border-[var(--color-border-base)] transition-colors"
          >
            <Utensils className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
            <span className="truncate">Tùy chỉnh mâm</span>
          </Link>
          <Link
            href={`/shopping?${query}`}
            className="min-h-11 inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="truncate">Đi chợ ngay</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline shrink-0" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dishes.map(({ roleLabel, badgeColor, dish }) => {
          if (!dish) return null;
          const hasKcal =
            typeof dish.caloriesPerServing === "number" &&
            dish.caloriesPerServing > 0 &&
            dish.nutritionStatus !== "NO_DATA";
          const targetHref = dish.isBuiltInPreset ? `/meal?${query}` : `/cong-thuc/${dish.slug}`;

          return (
            <Link
              key={dish.slug}
              href={targetHref}
              className="group rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]/60 hover:bg-[var(--color-surface-raised)]/80 hover:border-[var(--color-brand-border)] p-4 flex flex-col justify-between gap-3 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeColor}`}>
                    {roleLabel}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    {hasKcal && (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-[var(--color-accent-text)]">
                        <Flame className="w-3 h-3 text-[var(--color-accent-primary)]" />
                        ~{dish.caloriesPerServing} kcal
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dish.totalTimeMinutes}p
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors line-clamp-1">
                  {dish.name}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mt-1 leading-relaxed">
                  {dish.spoonRatioFormula ? `🥄 ${dish.spoonRatioFormula}` : dish.shortDescription}
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--color-brand-primary)]">
                <span>Độ khó: {dish.difficulty}</span>
                <span className="group-hover:translate-x-0.5 transition-transform">
                  {dish.isBuiltInPreset ? "Tùy chỉnh nước chấm \u2192" : "Xem cách nấu \u2192"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

async function LowCalorieHighlightShelf() {
  await connection();
  const lowCalResult = await searchPublishedRecipes({
    maxCalories: 400,
    sort: "calories_asc",
    limit: 4,
  });

  if (lowCalResult.items.length === 0) return null;

  return (
    <div className="pt-2 border-t border-[var(--color-border-subtle)]">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Gợi ý món Thanh Đạm & Ít Calo (≤ 400 kcal/phần)</span>
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Đã đối chiếu định lượng nguyên liệu từ Bảng Thành Phần Thực Phẩm Việt Nam.
          </p>
        </div>
        <Link
          href="/mon-an?maxCalories=350&sort=calories_asc"
          className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline shrink-0"
        >
          Xem thêm món giảm cân &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {lowCalResult.items.map((recipe) => (
          <RecipeCard key={recipe.slug} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

async function CategorizedShelvesShowcase() {
  await connection();
  const [allRecipes, mainRes, soupRes, sideRes] = await Promise.all([
    listPublishedRecipes(12),
    searchPublishedRecipes({ role: "MAIN", limit: 4 }),
    searchPublishedRecipes({ role: "SOUP", limit: 4 }),
    searchPublishedRecipes({ role: "SIDE", limit: 4 }),
  ]);

  if (allRecipes.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-white)] p-10 text-center">
        <ChefHat className="mx-auto mb-3 w-10 h-10 text-[var(--color-text-muted)]" aria-hidden="true" />
        <p className="font-semibold text-[var(--color-text-primary)]">Chưa có công thức nào được xuất bản</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Các món sẽ xuất hiện ở đây ngay khi được duyệt xuất bản.
        </p>
      </div>
    );
  }

  const roleShelves = [
    {
      id: "shelf-main",
      title: "Món Mặn Đưa Cơm",
      subtitle: "Kho, rim, chiên, nướng đậm đà làm tâm điểm cho mâm cơm gia đình",
      href: "/mon-an?role=MAIN",
      items: mainRes.items,
    },
    {
      id: "shelf-soup",
      title: "Món Canh Thanh Mát",
      subtitle: "Canh chua, canh rau, canh hầm ngọt nước giúp bữa cơm dịu vị, dễ ăn",
      href: "/mon-an?role=SOUP",
      items: soupRes.items,
    },
    {
      id: "shelf-side",
      title: "Rau Xào & Món Phụ Giòn Ngon",
      subtitle: "Bổ sung chất xơ và vitamin tự nhiên, cân bằng dinh dưỡng mỗi ngày",
      href: "/mon-an?role=SIDE",
      items: sideRes.items,
    },
  ].filter((shelf) => shelf.items.length > 0);

  return (
    <div className="flex flex-col gap-12">
      {roleShelves.map((shelf) => (
        <section key={shelf.id} aria-labelledby={shelf.id}>
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 id={shelf.id} className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                {shelf.title}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
                {shelf.subtitle}
              </p>
            </div>
            <Link
              href={shelf.href}
              className="text-xs sm:text-sm font-semibold text-[var(--color-brand-primary)] hover:underline shrink-0 inline-flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {shelf.items.map((recipe) => (
              <RecipeCard key={recipe.slug} recipe={recipe} />
            ))}
          </div>
        </section>
      ))}

      {/* Khám phá toàn bộ công thức mới xuất bản */}
      <section aria-labelledby="published-heading">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="published-heading" className="text-2xl font-bold text-[var(--color-text-primary)]">
              Món ngon mới lên kệ
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Công thức cơm nhà đã qua biên tập, kiểm chứng định lượng và duyệt xuất bản.
            </p>
          </div>
          <Link
            href="/mon-an"
            className="text-xs sm:text-sm font-semibold text-[var(--color-brand-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>Khám phá tất cả món</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {allRecipes.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TodayMealTraySkeleton() {
  return (
    <div
      className="rounded-3xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-6 sm:p-8 animate-pulse"
      aria-busy="true"
      aria-label="Đang tải mâm cơm gợi ý hôm nay"
    >
      <div className="h-6 w-64 bg-[var(--color-surface-raised)] rounded mb-3" />
      <div className="h-4 w-96 max-w-full bg-[var(--color-surface-subtle)] rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-[var(--color-surface-raised)]" />
        ))}
      </div>
    </div>
  );
}

function PublishedShowcaseSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Đang tải công thức">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] overflow-hidden animate-pulse">
          <div className="h-48 bg-[var(--color-surface-raised)]" />
          <div className="p-4 space-y-2">
            <div className="h-5 w-2/3 rounded bg-[var(--color-surface-raised)]" />
            <div className="h-3 w-full rounded bg-[var(--color-surface-subtle)]" />
            <div className="h-3 w-4/5 rounded bg-[var(--color-surface-subtle)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
