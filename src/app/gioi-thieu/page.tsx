import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ChefHat, Flame, Scale, BookOpen, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Về Ăn Gì Mom — Sứ mệnh & Phương pháp tính Dinh dưỡng Bếp Việt',
  description:
    'Tìm hiểu về Ăn Gì Mom: Nền tảng công thức nấu ăn gia đình Việt Nam, quy trình kiểm chứng định lượng thực tế và phương pháp tính Calo chuẩn Viện Dinh Dưỡng Quốc Gia.',
  alternates: {
    canonical: '/gioi-thieu',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-10 pb-12">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-[var(--color-brand-light)] via-[var(--color-surface-white)] to-[var(--color-accent-light)]/50 border border-[var(--color-border-base)] p-6 sm:p-10 shadow-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-surface-white)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)] mb-3">
          <ChefHat className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
          <span>Câu chuyện & Tiêu chuẩn E-E-A-T của Ăn Gì Mom</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
          ĂN GÌ MOM — Để câu hỏi &ldquo;Hôm nay ăn gì?&rdquo; trở thành niềm vui sum vầy mỗi chiều
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-3 leading-relaxed max-w-3xl">
          Chúng tôi xây dựng <strong>Ăn Gì Mom</strong> dành cho những người giữ lửa căn bếp gia đình Việt Nam, người bận rộn muốn ăn lành mạnh (Eat Clean), và người tập luyện thể thao cần kiểm soát chính xác lượng Calo &amp; Đạm (Protein) trong từng bữa cơm nhà.
        </p>
      </section>

      {/* 3 Trụ cột chuyên môn */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            1. Định lượng chuẩn xác theo khẩu phần
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Không còn cảnh ước lượng &ldquo;một ít&rdquo; hay &ldquo;vừa đủ&rdquo;. Mọi công thức trên Ăn Gì Mom đều chuẩn hóa theo gram, ml, muỗng canh và tự động co giãn thông minh từ 1 đến 12 người ăn.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            2. Chuẩn Viện Dinh Dưỡng Quốc Gia (FCT)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Chỉ số Năng lượng (kcal), Đạm, Béo, Tinh bột, Chất xơ và Natri được đối chiếu từ <strong>Bảng Thành Phần Thực Phẩm Việt Nam (Bộ Y Tế)</strong>, kết hợp với <strong>USDA FoodData Central</strong> và <strong>FAO ASEANFOODS</strong>.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            3. Khấu trừ hao hụt sơ chế (Edible Portion)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Khác với các công cụ tính Calo thông thường, Ăn Gì Mom áp dụng <strong>Tỷ lệ phần ăn được (Edible Rate)</strong> sau khi bỏ xương cá, vỏ tôm, gốc rau già và tính đúng lượng muối/nước chấm thực tế thấm vào món ăn.
          </p>
        </div>
      </section>

      {/* Quy trình biên tập & Nguồn dữ liệu */}
      <section className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)]">
          <BookOpen className="w-4 h-4" />
          <span>Phương pháp luận & Nguồn dữ liệu khoa học</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
          Làm thế nào Ăn Gì Mom tính toán Calo cho một bữa cơm Việt?
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            Ẩm thực Việt Nam có đặc thù nấu chung cho cả mâm cơm (4–6 người), có nước kho, nước canh và chén nước chấm đi kèm. Để đảm bảo độ tin cậy cao nhất cho người dùng giảm cân, người tập gym và người nội trợ, hệ thống của chúng tôi thực hiện 3 bước kiểm định:
          </p>
          <ul className="space-y-2.5 pt-1">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Chuẩn hóa hơn 210 nguyên liệu Bếp Việt:</strong> Từ ức gà, cá lóc đồng, thịt ba chỉ, rau muống, bông điên điển đến nước mắm truyền thống, mắm nêm, yến mạch, hạt chia.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Tham chiếu thực đơn quốc tế uy tín:</strong> Tích hợp tiêu chuẩn bữa ăn giảm cân bền vững dưới 500–600 kcal từ <em>NHS Better Health</em>, <em>BBC Good Food</em> và thực đơn giàu Protein (Macro-friendly) từ <em>Eat the Gains</em>, <em>Fit Men Cook</em> được Việt hóa 100% nguyên liệu chợ Việt.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Kiểm duyệt 4 chặng (Editorial Gate):</strong> Mọi công thức cộng đồng hoặc AI hỗ trợ đều phải đi qua quy trình <em>Bản thảo (DRAFT) &rarr; Chờ duyệt (SUBMITTED) &rarr; Kiểm nghiệm định lượng &rarr; Xuất bản (PUBLISHED)</em>.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[var(--color-accent-primary)]" />
            <span>Bắt đầu lên thực đơn cho gia đình bạn ngay hôm nay</span>
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            Khám phá kho công thức nấu ăn hoặc tự tay ghép mâm cơm 3 món chuẩn dinh dưỡng.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/mon-an"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
          >
            <span>Khám phá món ăn</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/hoi-dap"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-surface-white)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] text-xs sm:text-sm font-semibold hover:bg-[var(--color-brand-light)] transition-colors"
          >
            <span>Xem Câu hỏi thường gặp (FAQ)</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
