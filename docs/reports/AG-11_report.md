# AG-11 Report — Identity & Authorization

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã hoàn thành xây dựng và kiểm thử toàn diện hệ thống **Định danh (Identity), Quản lý phiên đăng nhập bảo mật (Session Management) và Phân quyền theo vai trò (Role-Based Access Control - RBAC)** cho ứng dụng sản phẩm ĂN GÌ MOM:
- **Mã hóa mật khẩu chuẩn công nghiệp**: Sử dụng hàm băm mật mã Node.js `scrypt` với muối ngẫu nhiên (salt 16 bytes), kiểm tra so sánh thời gian bất biến (`crypto.timingSafeEqual`) chống tấn công vét cạn (timing attack).
- **Session không trạng thái chuẩn Web Crypto**: Sử dụng chữ ký số HMAC-SHA256 thông qua Web Crypto API chuẩn (`crypto.subtle`), tương thích hoàn hảo cả trên Node.js server runtime và Next.js Edge Runtime (Middleware).
- **Bảo mật Cookie**: Lưu trữ session qua cookie `angimom_session_v1` với các cờ `HttpOnly` (chống đánh cắp qua XSS), `SameSite=Lax` (chống tấn công CSRF) và `Secure` trên môi trường production HTTPS.
- **Tuyến phòng thủ Middleware**: Tự động chặn và chuyển hướng người dùng chưa đăng nhập khi truy cập `/admin/*` và `/editor/*`, đồng thời kiểm tra vai trò `ADMIN` hoặc `EDITOR` trả về mã lỗi 403 Forbidden nếu không đủ thẩm quyền.
- **Giao diện & API**: Cung cấp trang đăng nhập `/login` chuẩn thiết kế Warm Kitchen kèm `<Suspense>` pre-render an toàn, các API endpoint `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.

## 2. Audit Before Build
- Xem chi tiết tại [mini-specs/AG-11.md](../mini-specs/AG-11.md).
- Trước AG-11, bảng `users` chỉ mới có cấu trúc thông tin cơ bản, chưa có trường mật khẩu và chưa có cơ chế đăng nhập. AG-11 đã bổ sung trường `password_hash`, tạo migration `drizzle/0001_happy_talon.sql` và thiết lập hệ thống bảo mật theo đúng hợp đồng [SECURITY.md](../SECURITY.md).

## 3. Design Choice
- **Web Crypto thay vì thư viện bên ngoài**: Sử dụng trực tiếp API `crypto.subtle` giúp ứng dụng không phải phụ thuộc vào các thư viện nặng ký bên ngoài, giảm kích thước bundle và chạy siêu tốc trên Edge Middleware của Next.js.
- **Kiến trúc RBAC 3 cấp độ**:
  - `ADMIN`: Quản trị toàn quyền, xem và cấu hình toàn bộ hệ thống.
  - `EDITOR`: Duyệt công thức, chuẩn hóa nguyên liệu và phân loại taxonomies (chuẩn bị cho AG-12, AG-13, AG-15).
  - `COOK`: Người dùng thông thường lưu món, lên mâm cơm cá nhân.
- **Phân tách trách nhiệm định danh**: Tách biệt rõ giữa middleware (chỉ xác thực chữ ký token và vai trò) và route handler (xác thực database và thiết lập cookie).

## 4. Changed Files
- `src/lib/db/schema.ts`: Bổ sung cột `password_hash` vào bảng `users`.
- `drizzle/0001_happy_talon.sql`: File migration bổ sung cột `password_hash`.
- `src/lib/auth/password.ts`: Module băm và so khớp mật khẩu bằng Node.js scrypt.
- `src/lib/auth/session.ts`: Module ký, xác thực và quản lý cookie session bằng Web Crypto HMAC-SHA256.
- `src/app/api/auth/login/route.ts`: Endpoint xác thực đăng nhập và cấp phát cookie.
- `src/app/api/auth/logout/route.ts`: Endpoint đăng xuất và xóa cookie.
- `src/app/api/auth/me/route.ts`: Endpoint kiểm tra thông tin phiên làm việc hiện tại.
- `src/middleware.ts`: Next.js Edge Middleware bảo vệ các tuyến đường `/admin/*` và `/editor/*`.
- `src/app/login/page.tsx`: Giao diện trang đăng nhập thiết kế Warm Kitchen thân thiện.
- `src/scripts/seed_users.ts`: Script kiểm thử tự động băm mật khẩu, ký token và giải mã session.
- `docs/DECISIONS.md`: Bổ sung D31.
- `docs/TEST_LOG.md`: Ghi nhận 10 kiểm tra đạt chuẩn cho AG-11.
- `docs/ROADMAP.md`: Cập nhật trạng thái AG-11 sang `awaiting-close`.
- `docs/reports/AG-11_report.md`: Báo cáo này.

## 5. Verification Results
1. **Auth & Session Unit Tests (`src/scripts/seed_users.ts`)**:
   - Exit code: 0
   - Băm mật khẩu và so khớp mật khẩu chính xác: `PASS ✓`
   - Từ chối mật khẩu sai: `PASS ✓`
   - Ký và giải mã token session: `PASS ✓`
2. **Next.js Production Build (`npm run build`)**:
   - Exit code: 0
   - Routes sinh thành công: `/login` (Static), `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` (Dynamic), Middleware proxy (Edge).
3. **Secret Scan**: 0 secret phát hiện trong code.

## 6. Next Steps: Phase P2 Bước 4
Sau khi chủ sản phẩm duyệt đóng AG-11:
- Chuyển sang **AG-12 — Ingredient & taxonomy CRUD**:
  - Xây dựng API và giao diện quản trị từ điển nguyên liệu chuẩn hóa (tên gốc, đơn vị mặc định, nhóm thực phẩm, cờ gia vị bếp).
  - Quản lý hệ thống phân loại đa trục (Taxonomies: vùng miền, phương pháp nấu, sở thích ăn uống).
  - Bảo vệ các endpoint bằng quyền `EDITOR` / `ADMIN` vừa thiết lập tại AG-11.
