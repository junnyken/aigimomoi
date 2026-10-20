import { BadgeCheck, ChefHat, PenLine, Leaf } from 'lucide-react';

interface Props {
  isEditorialReviewed: boolean;
  isCookTested: boolean;
  isNutritionVerified: boolean;
}

// D23: chỉ hiển thị nhãn đã được ADMIN xác nhận; không có nhãn nào thì nói rõ.
export function VerificationBadges({ isEditorialReviewed, isCookTested, isNutritionVerified }: Props) {
  const badges = [
    isEditorialReviewed && { key: 'edit', icon: PenLine, label: 'Đã biên tập' },
    isCookTested && { key: 'cook', icon: ChefHat, label: 'Đã nấu thử' },
    isNutritionVerified && { key: 'nutri', icon: Leaf, label: 'Dinh dưỡng đã kiểm' },
  ].filter(Boolean) as Array<{ key: string; icon: typeof PenLine; label: string }>;

  if (badges.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Nhãn kiểm chứng">
      {badges.map(({ key, icon: Icon, label }) => (
        <li
          key={key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-success-bg)] text-[var(--color-success-base)] border border-[var(--color-success-border)]"
        >
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          {label}
          <BadgeCheck className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}
