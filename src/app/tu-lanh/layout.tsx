import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tủ lạnh nhà tôi — Gợi ý món ăn từ nguyên liệu sẵn có',
  description:
    'Quản lý nguyên liệu trong tủ lạnh, ngăn đông và tủ đồ khô gia đình. Tự động gợi ý món ăn khớp nhất từ đồ sẵn có để tránh lãng phí thực phẩm.',
  alternates: {
    canonical: '/tu-lanh',
  },
};

export default function PantryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
