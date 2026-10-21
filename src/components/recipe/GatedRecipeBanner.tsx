import { Lock, ShieldCheck, Check, Info } from 'lucide-react';
import { formatPriceVND } from '@/lib/gating/pricing';
import { ClaimRecipeButton } from './ClaimRecipeButton';

interface GatedRecipeBannerProps {
  recipeId: number;
  recipeSlug: string;
  recipeName: string;
  authorName: string | null;
  price: number;
  isLoggedIn: boolean;
}

export function GatedRecipeBanner({
  recipeId,
  recipeSlug,
  recipeName,
  authorName,
  price,
  isLoggedIn,
}: GatedRecipeBannerProps) {
  const authorDisplay = authorName ?? 'Người nấu';

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-amber-300 bg-linear-to-br from-amber-50/90 via-orange-50/50 to-amber-100/40 p-6 sm:p-8 shadow-sm"
      data-testid="gated-recipe-banner"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-700">
              <Lock className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Chợ công thức · Độc quyền
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                Công thức được khóa bởi {authorDisplay}
              </h2>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-amber-100/80 border border-amber-300/80 text-amber-900 font-extrabold text-lg sm:text-xl">
            {formatPriceVND(price)}
          </div>
        </div>

        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
          Tên nguyên liệu, định lượng chi tiết và các bước nấu của món <strong>{recipeName}</strong> đã được khóa theo quy chế bảo vệ bản quyền công thức.
        </p>

        {/* Các quyền lợi khi mở khóa */}
        <div className="rounded-2xl bg-white/80 border border-amber-200/70 p-4 sm:p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Quyền lợi sau khi mở khóa
          </h3>
          <ul className="grid sm:grid-cols-2 gap-2.5 text-sm text-[var(--color-text-primary)]">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Xem đầy đủ danh sách & định lượng nguyên liệu</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Co giãn khẩu phần ăn linh hoạt (2, 4, 6 người)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Gộp vào mâm cơm và xuất danh sách đi chợ</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Bật chế độ nấu bếp từng bước kèm chuông hẹn giờ</span>
            </li>
          </ul>
        </div>

        {/* Nút hành động mở khóa */}
        <div className="pt-2">
          <ClaimRecipeButton
            recipeId={recipeId}
            recipeSlug={recipeSlug}
            price={price}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* Dòng miễn trừ trách nhiệm (D65, D66) */}
        <div className="flex items-start gap-2 pt-2 border-t border-amber-200/60 text-xs text-[var(--color-text-muted)] leading-relaxed">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>Miễn trừ trách nhiệm:</strong> Công thức này do {authorDisplay} chia sẻ và tự chịu trách nhiệm về nội dung, định lượng và hướng dẫn nấu. Ăn Gì Mom là nền tảng kết nối trung gian, không kiểm nghiệm hương vị và không chịu trách nhiệm về kết quả nấu ăn hoặc vấn đề dị ứng phát sinh.
          </p>
        </div>
      </div>
    </section>
  );
}
