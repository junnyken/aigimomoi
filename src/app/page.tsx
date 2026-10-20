import Link from "next/link";
import { Sparkles, Utensils, ShoppingBag, Clock, Users } from "lucide-react";

const BATCH_0_SHOWCASE = [
  {
    id: "thit-ba-chi-kho-tieu",
    name: "Thịt ba chỉ kho tiêu",
    role: "Món mặn",
    cookTime: 35,
    servings: 4,
    desc: "Thịt ba chỉ mềm rục, ngấm đều gia vị mặn ngọt đậm đà, thơm nồng hạt tiêu đen giã dập.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "ga-xao-sa-ot",
    name: "Gà xào sả ớt",
    role: "Món mặn",
    cookTime: 25,
    servings: 4,
    desc: "Thịt gà săn chắc xào vàng ruộm, quyện hương sả phi thơm nức và vị cay nồng của ớt tươi.",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "canh-rau-ngot-thit-bam",
    name: "Canh rau ngót thịt băm",
    role: "Món canh",
    cookTime: 15,
    servings: 4,
    desc: "Rau ngót vò kỹ nấu cùng thịt heo nạc băm xào thơm, nước canh trong ngọt tự nhiên.",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "canh-chua-ca-loc",
    name: "Canh chua cá lóc",
    role: "Món canh",
    cookTime: 30,
    servings: 4,
    desc: "Cá lóc đồng nấu cùng dứa, cà chua, đậu bắp, giá đỗ và me chua, rắc ngò gai rau ngổ thơm lừng.",
    image: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "rau-muong-xao-toi",
    name: "Rau muống xào tỏi",
    role: "Món rau",
    cookTime: 10,
    servings: 4,
    desc: "Rau muống xanh mướt giòn sần sật xào to lửa với tỏi đập dập thơm lừng cả gian bếp.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero Section */}
      <section className="text-center py-8 sm:py-12 bg-radial from-[rgba(63,98,64,0.08)] to-transparent rounded-3xl">
        <div className="max-w-2xl mx-auto px-4 flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Nền tảng Next.js Production (Phase P2)
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-brand-primary)] tracking-tight mb-3">
            Hôm nay nhà mình ăn gì?
          </h1>
          <p className="text-base text-[var(--color-text-secondary)] mb-6 max-w-lg">
            Tìm kiếm công thức nấu ăn chuẩn vị gia đình, định lượng rõ ràng theo số người, tự động gộp danh sách đi chợ.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="http://localhost:8090/prototype/meal.html"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-[var(--color-accent-primary)] text-white shadow-md hover:bg-[var(--color-accent-hover)] transition-transform hover:-translate-y-0.5"
            >
              <Utensils className="w-4 h-4" />
              <span>Gợi ý mâm cơm 3 món</span>
            </a>
            <a
              href="http://localhost:8090/prototype/shopping.html"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-[var(--color-surface-white)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Xem danh sách đi chợ</span>
            </a>
          </div>
        </div>
      </section>

      {/* Featured Batch 0 Catalog */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Món ngon quen thuộc
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Danh mục Batch 0 kinh điển cho bữa cơm người Việt.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-base)]">
            Batch 0: 7 món
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BATCH_0_SHOWCASE.map((dish) => (
            <article
              key={dish.id}
              className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all hover:-translate-y-1 flex flex-col"
            >
              <div className="relative w-full h-48 bg-[var(--color-surface-raised)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-primary)] text-white">
                  {dish.role}
                </span>
                <span className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[rgba(37,49,38,0.75)] text-white">
                  [DEMO_FIXTURE]
                </span>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                  {dish.name}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-4 flex-1">
                  {dish.desc}
                </p>

                <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {dish.cookTime} phút
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {dish.servings} người
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
