import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye, Database, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chính sách Bảo mật & Quyền riêng tư (Privacy Policy)',
  description:
    'Chính sách bảo mật thông tin người dùng, dữ liệu sổ tay bữa ăn, tủ lạnh gia đình và cookie trên hệ thống Ăn Gì Mom.',
  alternates: {
    canonical: '/chinh-sach-bao-mat',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <section className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-[var(--color-border-subtle)] pb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Cam kết bảo vệ quyền riêng tư người dùng</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
            Chính sách Bảo mật (Privacy Policy)
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
            Cập nhật lần cuối: Tháng 10/2026 • Áp dụng cho toàn bộ nền tảng ĂN GÌ MOM
          </p>
        </div>

        <div className="space-y-5 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Database className="w-4 h-4 text-[var(--color-brand-primary)]" />
              <span>1. Thông tin chúng tôi thu thập</span>
            </h2>
            <p>
              <strong>Ăn Gì Mom</strong> hướng tới trải nghiệm không rào cản: bạn có thể tra cứu công thức nấu ăn, tính Calo theo khẩu phần, ghép mâm cơm và tạo danh sách đi chợ mà <strong>không bắt buộc phải đăng ký tài khoản</strong>. Khi bạn chọn tạo tài khoản để đồng bộ dữ liệu giữa nhiều thiết bị, chúng tôi chỉ lưu trữ:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tên hiển thị và địa chỉ Email đăng nhập (được bảo mật mật khẩu bằng thuật toán băm một chiều).</li>
              <li>Danh sách công thức đã lưu, nguyên liệu trong &ldquo;Tủ lạnh nhà&rdquo;, lịch ăn tuần và Nhật ký bữa cơm của riêng bạn.</li>
              <li>Các công thức hoặc hình ảnh món ăn do chính bạn chủ động gửi đóng góp lên cộng đồng.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--color-brand-primary)]" />
              <span>2. Cách chúng tôi sử dụng và bảo vệ dữ liệu</span>
            </h2>
            <p>
              Toàn bộ dữ liệu cá nhân của bạn chỉ được dùng để cá nhân hóa gợi ý thực đơn, tính toán nhu cầu dinh dưỡng và đồng bộ danh sách đi chợ của gia đình bạn. Chúng tôi <strong>tuyệt đối không bán, trao đổi hoặc chia sẻ dữ liệu cá nhân</strong> của người dùng cho bất kỳ bên thứ ba quảng cáo nào.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[var(--color-brand-primary)]" />
              <span>3. Cookie &amp; Bộ nhớ cục bộ (Local Storage)</span>
            </h2>
            <p>
              Website sử dụng Cookie phiên đăng nhập an toàn (`HttpOnly`, `SameSite`) và bộ nhớ trình duyệt (`localStorage`) để lưu tùy chọn ngôn ngữ (`Tiếng Việt / English`), danh sách đi chợ tạm thời và các món bạn đã lưu khi chưa đăng nhập.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-primary)]" />
              <span>4. Quyền làm chủ dữ liệu của bạn</span>
            </h2>
            <p>
              Bạn có toàn quyền xuất dữ liệu Nhật ký bữa ăn ra file hoặc xóa toàn bộ lịch sử nhật ký, danh sách tủ lạnh và tài khoản bất kỳ lúc nào ngay trong trang <Link href="/profile" className="text-[var(--color-brand-primary)] font-semibold underline">Quản lý Tài khoản</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
