import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lập Kế hoạch Thực đơn Tuần (Weekly Meal Planner) — Chuẩn Calo Gia đình',
  description:
    'Lên lịch ăn uống 7 ngày trong tuần (Sáng, Trưa, Tối) cho cả gia đình, người giảm cân Eat Clean hoặc tập Gym. Tự động tổng hợp danh sách đi chợ cả tuần chỉ với 1 chạm.',
  alternates: {
    canonical: '/ke-hoach-tuan',
  },
};

export default function WeeklyPlannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
