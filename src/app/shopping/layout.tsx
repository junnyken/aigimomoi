import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh sách Đi chợ Thông minh — Cộng dồn nguyên liệu theo quầy chợ',
  description:
    'Tự động cộng dồn định lượng thịt cá, rau củ, gia vị từ mâm cơm hoặc lịch ăn tuần và phân nhóm theo từng quầy chợ Việt Nam để đi chợ nhanh gọn 1 lần.',
  alternates: {
    canonical: '/shopping',
  },
};

export default function ShoppingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
