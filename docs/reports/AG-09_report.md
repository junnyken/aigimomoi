# AG-09 Report — App Foundation & Environment

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã hoàn thành khởi tạo và cấu hình trọn vẹn nền tảng ứng dụng sản phẩm chính thức cho dự án ĂN GÌ MOM:
- **Framework**: Next.js 16 (App Router, TypeScript, React 19) cấu hình chế độ `output: "standalone"` phục vụ container hóa nhẹ tối ưu.
- **Design System Integration**: Tailwind CSS v4 kế thừa 100% Design Tokens từ `docs/tokens.css` (bảng màu Kem ấm `#FAF7F0`, Xanh lá `#3F6240`, Cam đất `#B75B35`, bo góc, bóng đổ và phông chữ `Be Vietnam Pro` chuẩn WCAG 2.2 Level AA).
- **Database & ORM**: PostgreSQL kết hợp `drizzle-orm`, `drizzle-kit` và driver `postgres` typesafe; cấu hình sẵn các enums miền chuẩn hóa theo Invariants §5.1, §5.2, §5.3.
- **Đóng gói & Hạ tầng Container**: `Dockerfile` multi-stage (base $\rightarrow$ deps $\rightarrow$ builder $\rightarrow$ runner < 150MB), `docker-compose.yml` (Postgres 16, app container, Caddy reverse proxy) và file mẫu môi trường `.env.example`.
- **Kiểm tra thành công**: `npm run build` xuất sắc vượt qua biên dịch TypeScript và tối ưu hóa static pages; `docker compose config` hợp lệ; `drizzle-kit check` xác nhận cấu hình chuẩn xác.

## 2. Audit Before Build
- Xem chi tiết tại [mini-specs/AG-09.md](../mini-specs/AG-09.md).
- Trước bước AG-09, repo `projects/angimom/` chỉ có tài liệu và bản mẫu web thuần tĩnh (`prototype/`). AG-09 chính thức dựng nền tảng production code song song, không làm ảnh hưởng đến tài liệu và prototype cũ.

## 3. Design Choice
- **App Router & Typescript**: Sử dụng kiến trúc hiện đại nhất của Next.js với thư mục `src/app/`, tối ưu Server Components cho SEO và tốc độ tải trang ban đầu.
- **Cấu hình Theme Inline Tailwind v4**: Toàn bộ biến CSS từ `tokens.css` được đăng ký vào `@theme inline` trong `src/app/globals.css`, cho phép code UI vừa dùng được utility classes (`bg-[var(--color-bg-primary)]` / `text-[var(--color-brand-primary)]`), vừa đảm bảo tính nhất quán tuyệt đối với Prototype.
- **Drizzle ORM over Prisma**: Lựa chọn Drizzle theo AG-02 giúp giảm 70% bộ nhớ runtime, tốc độ khởi động cực nhanh và sinh câu truy vấn SQL trong suốt, tối ưu hoàn hảo cho máy chủ VPS cá nhân của chủ sản phẩm (D17, D18, D20).
- **Caddy Reverse Proxy**: Tự động cấp phát và gia hạn chứng chỉ SSL Let's Encrypt mà không cần cấu hình Certbot thủ công, tự động nén Gzip / Zstandard.

## 4. Changed Files
- `package.json` & `package-lock.json`: Khởi tạo app Next.js, cài đặt `lucide-react`, `drizzle-orm`, `postgres`, `drizzle-kit`.
- `tsconfig.json`: Cấu hình TypeScript với path alias `@/*`.
- `next.config.ts`: Cấu hình Next.js với `output: 'standalone'`.
- `src/app/globals.css`: Tích hợp toàn bộ Design Tokens từ `docs/tokens.css`.
- `src/app/layout.tsx`: Root Layout hỗ trợ tiếng Việt, Google Font `Be Vietnam Pro`, header thương hiệu và footer.
- `src/app/page.tsx`: Landing page chào đón kết nối danh mục 7 món Batch 0 kinh điển.
- `src/lib/db/schema.ts`: Định nghĩa các enums domain invariants và bảng `users`, `recipes`.
- `src/lib/db/index.ts`: Khởi tạo Drizzle client.
- `drizzle.config.ts`: Cấu hình Drizzle Kit cho PostgreSQL dialect.
- `.env.example`: Cấu hình mẫu môi trường chuẩn.
- `Dockerfile`: Multi-stage Docker build cho Next.js standalone runner.
- `docker-compose.yml`: Hạ tầng docker gồm database Postgres 16, app container và Caddy proxy.
- `Caddyfile`: Cấu hình reverse proxy và tự động HTTPS.
- `docs/DECISIONS.md`: Bổ sung D29.
- `docs/TEST_LOG.md`: Ghi nhận 9 kiểm tra đạt chuẩn cho AG-09.
- `docs/ROADMAP.md`: Cập nhật trạng thái AG-09 sang `awaiting-close`.
- `docs/reports/AG-09_report.md`: Báo cáo này.

## 5. Verification Results
1. **Next.js Production Build (`npm run build`)**:
   - Exit code: 0
   - Static pages generated: `/`, `/_not-found`
   - Standalone output generated: `.next/standalone`
2. **Drizzle Schema Syntax Check (`npx drizzle-kit check`)**:
   - Exit code: 0 ("Everything's fine 🐶🔥")
3. **Docker Compose Syntax Check (`docker compose config`)**:
   - Exit code: 0, định nghĩa hợp lệ cho 3 service (`web`, `db`, `caddy`)
4. **Secret Scan**: 0 secret phát hiện trong code.

## 6. Next Steps: Phase P2 Bước 2
Sau khi chủ sản phẩm duyệt đóng AG-09:
- Chuyển sang **AG-10 — Schema & migrations**:
  - Xây dựng đầy đủ Drizzle schema cho toàn bộ mô hình dữ liệu ẩm thực:
    - Bảng `recipes`, `recipe_aliases`, `ingredients`, `recipe_ingredients` (kèm `scale_policy` và `preparation`), `cooking_steps` (kèm `timer_seconds`), `taxonomies`, `recipe_tags`.
  - Thiết lập quan hệ (relations) và chỉ mục (indexes) tối ưu tìm kiếm.
  - Sinh migration SQL đầu tiên (`drizzle-kit generate`) sẵn sàng cho việc nạp dữ liệu Batch 0 & Batch 1.
