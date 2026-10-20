# ARCH — Kiến trúc Ứng dụng & Hạ tầng

**Trạng thái:** `approved` tại AG-02 (20/10/2026).

---

## 1. Kiến trúc Ứng dụng (Application Stack)
Một codebase TypeScript duy nhất, cấu trúc module ranh giới rõ ràng, hướng tới vận hành hiệu quả bởi 1 người (D11).

| Lớp | Công nghệ đã duyệt | Lý do & Tiêu chuẩn |
|---|---|---|
| **Web & Admin Portal** | Next.js (App Router, TypeScript) | Server Components bảo mật secrets; SSR/SSG tối ưu SEO công thức món ăn; Server Actions xử lý mutations type-safe |
| **Giao diện (UI)** | Tailwind CSS + Radix UI (shadcn/ui pattern) | Quản lý qua hệ thống Design Tokens (màu, font, spacing); accessible theo chuẩn WCAG 2.2 AA; tải nhanh |
| **Biểu tượng (Icon)** | Lucide Icons | Đồng bộ 1 bộ icon duy nhất trong toàn hệ thống, stroke width đồng nhất, kích thước 16/20/24px |
| **Biểu mẫu & Xác thực** | React Hook Form + Zod | Chia sẻ schema Zod kiểm tra dữ liệu giữa client và server; bắt lỗi chi tiết từng trường |
| **Cơ sở dữ liệu & ORM** | PostgreSQL + Drizzle ORM | PostgreSQL mạnh mẽ, chuẩn ACID; Drizzle ORM cực nhẹ, type-safe thuần TypeScript, migration minh bạch dạng SQL |
| **Kiểm thử (Testing)** | Vitest (unit/integration) + Playwright (E2E) | Vitest chạy nhanh, tương thích ESM; Playwright kiểm thử E2E đa kích thước màn hình (mobile 375px, desktop) |

*Nguyên tắc:* Khóa cứng (lock) phiên bản chính xác trong `package.json` khi khởi tạo dự án ở AG-09; không dùng từ khóa `"latest"` bất định.

---

## 2. Chiến lược Hạ tầng & Triển khai (Infrastructure Strategy)
Tuân thủ nguyên tắc không phụ thuộc nhà cung cấp (no vendor lock-in). Toàn bộ hệ thống được container hóa chuẩn qua Docker, chạy độc lập trên VPS riêng (D17) và tương thích hoàn toàn với môi trường dev Mắt Bão Coolify.

| Lớp | Phương án đã duyệt | Ranh giới & Cơ chế vận hành |
|---|---|---|
| **Containerization** | Dockerfile multi-stage build (Alpine Linux + Node standalone) + `docker-compose.yml` | Đóng gói gọn nhẹ, tối ưu RAM/dung lượng; tách biệt app và database service |
| **Reverse Proxy & SSL** | Caddy Server | Tự động cấp và gia hạn chứng chỉ HTTPS Let's Encrypt; cấu hình reverse proxy đơn giản, an toàn |
| **Cơ sở dữ liệu Host** | PostgreSQL 16 container có persistent volume mount | Chạy trên VPS riêng; cronjob backup `pg_dump` định kỳ lưu vào thư mục an toàn |
| **Xác thực (Auth)** | NextAuth.js (Auth.js v5) session lưu trữ trên PostgreSQL | Cookie HttpOnly an toàn, CSRF protection; phân quyền 3 cấp (Guest, Member, Admin) phía server |
| **Lưu trữ Media/Ảnh** | Local persistent volume mount phục vụ qua web server | Xử lý resize, nén sang WebP trước khi lưu; cấu trúc thư mục `/uploads/recipes/...`; sẵn sàng nâng cấp lên S3 nếu sau này có nhu cầu |
| **Email gửi đi** | SMTP (Nodemailer) | Cấu hình qua biến môi trường; dùng tài khoản email domain riêng hoặc dịch vụ transaction email |

---

## 3. Bản đồ Mô-đun (Module Boundaries)
1. **Identity & Access**: Xác thực, phân quyền Guest / Member / Admin, phiên đăng nhập.
2. **Recipe Catalog & Publishing**: Quản lý Dish, Recipe, RecipeVersion, quy trình duyệt nháp và xuất bản.
3. **Ingredient & Taxonomy**: Quản lý nguyên liệu chuẩn hóa, danh mục phân loại đa trục (vai trò, chế biến, vùng miền).
4. **Search & Discovery**: Tìm kiếm theo tên/alias/nguyên liệu, bộ lọc thông minh đa tiêu chí.
5. **Serving Adjustment Engine**: Quy tắc đổi khẩu phần (tuyến tính, cố định, điều chỉnh tay), không scale mù.
6. **Cooking Mode Session**: Trình diễn từng bước nấu ăn, checklist nguyên liệu, timer hỗ trợ (không tự chuyển bước).
7. **Meal Planning & Shopping**: Ghép bữa cơm, đổi món giữ bữa, gộp nguyên liệu cùng đơn vị, checklist đi chợ.
8. **Media Management**: Upload, nén ảnh WebP, kiểm tra quyền sở hữu và gán alt text.

*Nguyên tắc:* Tái sử dụng tối đa (Reuse-first); không tạo editor thứ hai hoặc engine gộp nguyên liệu thứ hai khi mở rộng cộng đồng sau này.
