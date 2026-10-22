import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ArrowRight, Flame, Utensils, ShoppingBag, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Câu hỏi thường gặp (FAQ) — Giải đáp về Công thức, Tính Calo & Thực đơn Gia đình',
  description:
    'Giải đáp chi tiết các câu hỏi thường gặp khi sử dụng Ăn Gì Mom: cách tính Calo chuẩn Viện Dinh Dưỡng, ghép mâm cơm 3 món, thực đơn giảm cân Eat Clean và tập Gym.',
  alternates: {
    canonical: '/hoi-dap',
  },
};

export const FAQ_ITEMS = [
  {
    q: 'Chỉ số Calo và Dinh dưỡng trên Ăn Gì Mom được tính từ nguồn nào?',
    a: 'Toàn bộ chỉ số Năng lượng (kcal), Đạm (Protein), Béo (Fat), Tinh bột (Carbs) trên Ăn Gì Mom được tính tự động từ Bảng Thành Phần Thực Phẩm Việt Nam (Viện Dinh Dưỡng Quốc Gia — Bộ Y Tế), kết hợp với cơ sở dữ liệu USDA FoodData Central cho các nguyên liệu Eat Clean hiện đại. Đặc biệt, hệ thống đã trừ hao hụt phần thải bỏ (xương, vỏ, gốc rau già) để phản ánh đúng lượng thực ăn vào cơ thể.',
  },
  {
    q: 'Làm sao để biết hôm nay ăn gì cho gia đình 4 người mà không bị trùng món?',
    a: 'Bạn chỉ cần bấm vào mục "Ghép mâm cơm 3 món" (/meal) hoặc "Kế hoạch tuần" (/ke-hoach-tuan). Hệ thống sẽ gợi ý trọn bộ 1 Món Mặn + 1 Món Canh + 1 Món Rau xào cân bằng dinh dưỡng, tự động nhân chia định lượng nguyên liệu theo đúng số người ăn trong nhà.',
  },
  {
    q: 'Tôi đang muốn giảm cân (Eat Clean) hoặc tập Gym tăng cơ thì chọn món như thế nào?',
    a: 'Trên trang "Khám phá món ăn" (/mon-an), bạn có thể bấm trực tiếp vào nhãn "🥗 Giảm cân · Ít Calo" (các món hấp, luộc, áp chảo dưới 350–500 kcal/khẩu phần theo chuẩn NHS & BBC Good Food) hoặc "💪 Tập Gym · Tăng cơ – Giảm mỡ" (các món giàu Protein từ 25g–45g đạm/khẩu phần theo chuẩn Eat the Gains).',
  },
  {
    q: 'Tính năng "Tủ lạnh nhà tôi" và "Danh sách Đi chợ" hoạt động ra sao?',
    a: 'Tại trang "Tủ lạnh nhà" (/tu-lanh), bạn đánh dấu những nguyên liệu đang có sẵn trong bếp, hệ thống sẽ gợi ý ngay các món ăn khớp nhất để tránh lãng phí đồ ăn. Khi đã chọn xong mâm cơm hoặc lịch ăn cả tuần, trang "Đi chợ" (/shopping) sẽ tự động cộng dồn toàn bộ nguyên liệu theo từng quầy chợ (Thịt cá, Rau củ, Gia vị) để bạn đi chợ 1 lần duy nhất.',
  },
  {
    q: 'Lượng Calo 1 khẩu phần của món ăn đã bao gồm cơm trắng chưa?',
    a: 'Đối với các món rời trong mâm cơm (Món mặn, Món canh, Món rau xào), chỉ số Calo hiển thị là năng lượng của riêng món đó trên 1 người ăn. Khi dùng kèm cơm, bạn cộng thêm khoảng 130 kcal cho 1 chén cơm trắng vừa (100g chín) hoặc 110 kcal cho 1 chén cơm gạo lứt. Riêng với các "Món một đĩa" (Phở, Bún, Miến, Cơm tấm, Cơm chiên), Calo đã bao gồm trọn vẹn cả bún/phở/cơm trong tô.',
  },
  {
    q: 'Tôi có thể đóng góp công thức nấu ăn gia truyền của mình lên Ăn Gì Mom không?',
    a: 'Hoàn toàn được! Bạn có thể bấm vào nút "Góp món ngon" (/contribute/new) để chia sẻ công thức của mình. Khi bạn nhập danh sách nguyên liệu, AI và từ điển Viện Dinh Dưỡng của Ăn Gì Mom sẽ tự động tính toán bảng Calo & Macro cho món ăn của bạn.',
  },
];

export default function FaqPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c'),
        }}
      />

      <section className="rounded-3xl bg-gradient-to-br from-[var(--color-brand-light)]/80 via-[var(--color-surface-white)] to-[var(--color-accent-light)]/40 border border-[var(--color-border-base)] p-6 sm:p-10 shadow-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-surface-white)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)] mb-3">
          <HelpCircle className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
          <span>Trung tâm Giải đáp & Hỗ trợ Bếp Gia Đình</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-bold text-[var(--color-text-primary)]">
          Câu hỏi thường gặp (FAQ)
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-2 leading-relaxed">
          Giải đáp nhanh mọi thắc mắc về cách tra cứu công thức nấu ăn, cách tính Calo &amp; Macro chuẩn Viện Dinh Dưỡng, lên thực đơn giảm cân / tập gym và đi chợ thông minh.
        </p>
      </section>

      <section className="space-y-3.5">
        {FAQ_ITEMS.map((item, idx) => (
          <details
            key={idx}
            open={idx < 2}
            className="group rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 shadow-2xs transition-all"
          >
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)]">
              <span>
                {idx + 1}. {item.q}
              </span>
              <span className="w-6 h-6 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-brand-primary)] flex items-center justify-center text-xs font-bold shrink-0 group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <p className="mt-3 pt-3 border-t border-[var(--color-border-subtle)] text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Link
          href="/mon-an?tax=giam-can-it-calo"
          className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-emerald-950">Món Giảm cân · Ít Calo</span>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0" />
        </Link>

        <Link
          href="/meal"
          className="p-4 rounded-2xl bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] flex items-center justify-between gap-2 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Utensils className="w-5 h-5 text-[var(--color-accent-primary)] shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">Ghép Mâm cơm 3 món</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
        </Link>

        <Link
          href="/shopping"
          className="p-4 rounded-2xl bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] flex items-center justify-between gap-2 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[var(--color-brand-primary)] shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">Danh sách Đi chợ</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
        </Link>
      </section>
    </div>
  );
}
