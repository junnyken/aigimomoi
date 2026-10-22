import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sổ tay Món ăn Đã lưu — Tủ công thức yêu thích của gia đình',
  description:
    'Danh sách các công thức nấu ăn gia đình, món giảm cân ít calo và món tập gym bạn đã lưu lại để nấu bất kỳ lúc nào.',
  alternates: {
    canonical: '/da-luu',
  },
};

export default function SavedRecipesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
