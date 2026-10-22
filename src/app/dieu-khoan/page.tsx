import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, HeartPulse, Scale, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Điều khoản Sử dụng & Miễn trừ Y khoa Dinh dưỡng (Terms of Use)',
  description:
    'Điều khoản sử dụng dịch vụ, quy định đóng góp công thức cộng đồng và tuyên bố miễn trừ trách nhiệm y khoa về chỉ số dinh dưỡng trên Ăn Gì Mom.',
  alternates: {
    canonical: '/dieu-khoan',
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <section className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-[var(--color-border-subtle)] pb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
            <FileText className="w-3.5 h-3.5" />
            <span>Quy định Sử dụng & Minh bạch Dinh dưỡng</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
            Điều khoản Sử dụng &amp; Miễn trừ Trách nhiệm Dinh dưỡng
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
            Áp dụng cho mọi người dùng truy cập và sử dụng nền tảng ĂN GÌ MOM
          </p>
        </div>

        <div className="space-y-5 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-1.5">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-amber-700 shrink-0" />
              <span>1. Tuyên bố Miễn trừ Y khoa &amp; Dinh dưỡng (Medical &amp; Nutrition Disclaimer)</span>
            </h2>
            <p className="text-xs leading-relaxed">
              Các thông số Năng lượng (Calo/kcal), Đạm (Protein), Béo (Fat), Tinh bột (Carbs), Chất xơ và Natri trên <strong>Ăn Gì Mom</strong> được tính toán dựa trên <em>Bảng Thành Phần Thực Phẩm Việt Nam (Viện Dinh Dưỡng — Bộ Y Tế)</em> và <em>USDA FoodData Central</em> nhằm mục đích <strong>tham khảo dinh dưỡng cho bữa ăn gia đình, hỗ trợ kiểm soát cân nặng và tập luyện thể thao</strong>. Thông tin này không thay thế cho phác đồ điều trị y khoa hoặc chỉ định chuyên biệt của bác sĩ đối với bệnh nhân tiểu đường, thận mạn tính hoặc dị ứng thực phẩm nghiêm trọng.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[var(--color-brand-primary)]" />
              <span>2. Bản quyền Công thức &amp; Nội dung</span>
            </h2>
            <p>
              Các công thức do Ban biên tập Ăn Gì Mom biên soạn, chuẩn hóa định lượng và cấu trúc hướng dẫn 4 giai đoạn thuộc bản quyền của Ăn Gì Mom. Bạn được phép lưu trữ, in ấn hoặc chia sẻ đường dẫn (link) cho gia đình và bạn bè phục vụ mục đích nấu ăn phi thương mại.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-brand-primary)]" />
              <span>3. Quy tắc Đóng góp Công thức Cộng đồng</span>
            </h2>
            <p>
              Khi gửi công thức lên chuyên mục <Link href="/contribute" className="text-[var(--color-brand-primary)] font-semibold underline">Góp món ngon</Link>, người đóng góp cam kết nội dung và hình ảnh là trung thực, an toàn vệ sinh thực phẩm và không vi phạm bản quyền của bên thứ ba. Ban biên tập có quyền hiệu đính định lượng nguyên liệu để đồng bộ với hệ thống tính Calo tự động trước khi xuất bản công khai.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
