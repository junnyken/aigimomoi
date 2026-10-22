import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tính TDEE, BMR, BMI Chuẩn Người Việt & Thực Đơn Calo Cá Nhân Hóa',
  description:
    'Công cụ tính chỉ số BMI (chuẩn WHO Châu Á – Bộ Y Tế), BMR (phương trình Mifflin-St Jeor), TDEE và lượng Calo, Đạm (Protein), Béo, Tinh bột cần ăn mỗi bữa để Giảm cân, Giữ dáng hoặc Tập Gym tăng cơ.',
  keywords: [
    'tính tdee',
    'tính bmr',
    'tính bmi chuẩn người việt',
    'tính calo giảm cân',
    '1 ngày cần bao nhiêu calo',
    'thực đơn giảm cân theo tdee',
    'tính macro tập gym',
  ],
  alternates: {
    canonical: '/tinh-calo',
  },
};

export default function CalorieCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
