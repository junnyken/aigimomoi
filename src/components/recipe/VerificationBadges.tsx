import { BadgeCheck, ChefHat, PenLine, Leaf, Clock } from 'lucide-react';

interface Props {
  isEditorialReviewed: boolean;
  isCookTested: boolean;
  isNutritionVerified: boolean;
}

// Invariants D23 & R1: Chỉ hiển thị nhãn chứng nhận khi có kiểm chứng thực tế;
// chưa nấu thử thì hiển thị trạng thái chờ kiểm nghiệm minh bạch.
export function VerificationBadges({ isEditorialReviewed, isCookTested, isNutritionVerified }: Props) {
  const verifiedBadges = [
    isEditorialReviewed && { key: 'edit', icon: PenLine, label: 'Đã biên tập' },
    isCookTested && { key: 'cook', icon: ChefHat, label: 'Đã nấu thử' },
    isNutritionVerified && { key: 'nutri', icon: Leaf, label: 'Dinh dưỡng đã kiểm' },
  ].filter(Boolean) as Array<{ key: string; icon: typeof PenLine; label: string }>;

  const isAwaitingCookTest = !isCookTested;

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Nhãn kiểm chứng">
      {verifiedBadges.map(({ key, icon: Icon, label }) => (
        <li
          key={key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-success-bg)] text-[var(--color-success-base)] border border-[var(--color-success-border)]"
        >
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          {label}
          <BadgeCheck className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
        </li>
      ))}

      {isAwaitingCookTest && (
        <li
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
          title="Công thức đang trong lộ trình nấu thử nghiệm thu tại Bếp Ăn Gì Mom"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          <span>Chờ kiểm nghiệm bếp mẫu</span>
        </li>
      )}
    </ul>
  );
}
