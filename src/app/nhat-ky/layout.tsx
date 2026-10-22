import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nhật ký Bữa cơm & Theo dõi Calo Hàng ngày',
  description:
    'Ghi chép lịch sử các bữa ăn gia đình, theo dõi tổng lượng Calo, Đạm, Béo, Tinh bột nạp vào mỗi ngày trên Ăn Gì Mom.',
  alternates: {
    canonical: '/nhat-ky',
  },
};

export default function DiaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
