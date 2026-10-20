# TEST LOG

## AG-00 — Workspace Audit & Skill Bootstrap — 20/10/2026

**App tests (unit/integration/lint/build/E2E): N/A — chưa có ứng dụng.** Không báo PASS.

Kiểm tra tài liệu/skill (script read-only, 8 nhóm):

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | 22 file theo spec §6 tồn tại | PASS |
| 2 | Không có file ngoài danh sách (trừ 3 file nguồn) | PASS |
| 3 | sha256 3 file nguồn không đổi; 3 bản sao nguyên văn trùng sha256 | PASS |
| 4 | 2 `SKILL.md` có YAML frontmatter với `name` + `description` | PASS |
| 5 | Mọi link tương đối trong README/docs/skill wrapper trỏ tới file có thật | PASS (sau fix) |
| 6 | Không có pattern secret trong file đã tạo | PASS |
| 7 | 11 docs nền có nhãn `approved`/`proposed`/`unknown`/N/A | PASS |
| 8 | D01–D13 có đủ trong DECISIONS.md | PASS |
| — | Repo cha: số dòng `git status` giữ nguyên 3.671 (angimom vẫn là 1 dòng `??`) | PASS |

### Bug thật tìm được
- **Link hỏng** trong `docs/mini-specs/AG-00.md`: tên file nguồn chứa `(1)`, dấu `)` kết thúc link Markdown sớm. **Fix**: mã hóa thành `%281%29`. Chạy lại: PASS.

### Chưa kiểm
- Antigravity có tự nạp skill từ `projects/angimom/.agents/skills/` khi mở thư mục này làm workspace root hay không — chưa xác minh trong IDE (xem report §8).

## AG-01 — Existing Infrastructure Inventory — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Mọi dòng bảng trong INFRA_INVENTORY có nhãn `verified`/`declared`/`unknown` | PASS |
| 2 | Secret scan trên docs | PASS |
| 3 | Chỉ chạy lệnh đọc (không create/redeploy/allow-ip/set-scope/preview) | PASS |
| 4 | Diff chỉ ở docs trong scope | PASS |

### Bug thật tìm được
- Không có.

### Chưa kiểm / blocked
- Toàn bộ S2 (VPS/domain riêng): chờ thông tin chủ sản phẩm.

## AG-02 — Architecture & Domain Decisions — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | ARCH.md chốt 100% stack ứng dụng và hạ tầng (không còn unassigned) | PASS |
| 2 | DATA_MODEL.md khóa các enum chuẩn và quy tắc bất biến theo Master Plan §5 | PASS |
| 3 | API.md định nghĩa rõ chuẩn Next.js Server Actions và REST boundaries | PASS |
| 4 | Secret scan trên docs | PASS |
| 5 | DECISIONS.md ghi nhận đủ D19, D20, D21 | PASS |

## AG-03 — Content Operations Plan & Editorial Gate — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | CONTENT_GUIDELINES.md chốt 5 bước biên tập và mẫu JSON Schema chuẩn | PASS |
| 2 | Danh mục Batch 0 (7 món) phủ đủ 3 nhóm mặn/canh/rau (`MAIN`, `SOUP`, `SIDE`) | PASS |
| 3 | Checklist 9 tiêu chí bao hàm toàn bộ Master Plan §8.4 | PASS |
| 4 | Secret scan trên docs: không có secret | PASS |
| 5 | DECISIONS.md ghi nhận D22, D23; giải quyết O5, O10 | PASS |

## AG-04 — Design Tokens & Primitives — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | docs/tokens.css khai báo đầy đủ 7 nhóm biến CSS chuẩn | PASS |
| 2 | Ma trận tương phản màu toán học đạt chuẩn WCAG 2.2 AA (chữ thường >= 4.5:1, chữ lớn >= 3:1) | PASS |
| 3 | DESIGN_SYSTEM.md quy định đầy đủ phông Be Vietnam Pro, kích thước, spacing và component primitives | PASS |
| 4 | Secret scan trên docs: không có secret | PASS |
| 5 | DECISIONS.md ghi nhận D24, giải quyết O9 | PASS |

## AG-05 — Discovery Prototype — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | HTTP server port 8090 phản hồi mã 200 OK trên index.html, main.css, batch0_fixtures.js | PASS |
| 2 | Tìm kiếm tức thời theo từ khóa tên món, alias, nguyên liệu hoạt động chính xác | PASS |
| 3 | Bộ lọc vai trò món (`ALL`, `MAIN`, `SOUP`, `SIDE`) lọc chính xác danh sách thẻ | PASS |
| 4 | Nút "Hôm nay ăn gì?" (O7) sinh mâm cơm 3 món ngẫu nhiên đủ 3 vai trò (1 Mặn + 1 Canh + 1 Rau) | PASS |
| 5 | Trạng thái rỗng (Empty State) xuất hiện khi tìm từ khóa không có thật | PASS |
| 6 | Secret scan: không có secret | PASS |
| 7 | DECISIONS.md ghi nhận D25, giải quyết O7 | PASS |

## AG-06 — Recipe & Cooking Prototype — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | HTTP server port 8090 phản hồi mã 200 OK trên recipe.html và recipe.js | PASS |
| 2 | Invariant co giãn khẩu phần 4 -> 6 -> 4 người trả về chính xác 100% định lượng ban đầu cho cả 3 ScalePolicy | PASS |
| 3 | Chế độ nấu (Cooking Mode) mở toàn màn hình, điều hướng bước chính xác, timer an toàn không tự nhảy bước | PASS |
| 4 | Bảng tra cứu nguyên liệu nhanh (Quick Drawer) mở/đóng mượt mà không làm mất trạng thái bước nấu | PASS |
| 5 | Chuyển hướng từ trang chủ `index.html` sang `recipe.html?id=...` chuẩn xác | PASS |
| 6 | Secret scan: không có secret | PASS |
| 7 | DECISIONS.md ghi nhận D26 | PASS |

## AG-07 — Meal & Shopping Prototype — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | HTTP server port 8090 phản hồi mã 200 OK trên meal.html, meal.js, shopping.html, shopping.js, meal_state.js | PASS |
| 2 | Cú pháp JS (node --check) trên toàn bộ các file module prototype | PASS |
| 3 | Mâm cơm 3 món chuẩn hóa theo vai trò MAIN, SOUP, SIDE và hỗ trợ đổi món độc lập từng slot | PASS |
| 4 | Bộ máy gộp nguyên liệu (aggregateIngredients) tuân thủ Invariants §5.4: gộp đúng cùng đơn vị, truy vết nguồn gốc rõ ràng, tách riêng gia vị MANUAL_ADJUST | PASS |
| 5 | Checklist đi chợ lưu trạng thái vào localStorage và thanh tiến độ cập nhật % theo thời gian thực | PASS |
| 6 | Đồng bộ điều hướng 4 trang liên hoàn (Khám phá <-> Mâm cơm <-> Đi chợ <-> Chi tiết món) | PASS |
| 7 | Secret scan: không có secret | PASS |
| 8 | DECISIONS.md ghi nhận D27 | PASS |

## AG-08 — Responsive & Usability Review — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Automated audit `verify_ag08.py`: Kiểm tra viewport, semantic HTML, title, meta description trên toàn bộ 4 trang | PASS |
| 2 | CSS mobile breakpoint (`@media (max-width: 640px)`) tối ưu header, banner mâm cơm, lưới thẻ món và Cooking Mode | PASS |
| 3 | Tiêu chuẩn vùng chạm cảm ứng (Touch Target Size $\ge 40-44\text{px}$) chuẩn WCAG 2.2 Criterion 2.5.8 trên nút bấm, chips, serving selectors | PASS |
| 4 | Trợ năng bàn phím và chỉ báo focus (`:focus-visible` với `--focus-ring`) hoạt động trên mọi phần tử tương tác | PASS |
| 5 | HTTP server phản hồi 200 OK trên toàn bộ 4 màn hình | PASS |
| 6 | CSS Lint: Không có cảnh báo lỗi cú pháp | PASS |
| 7 | Secret scan: không có secret | PASS |
| 8 | DECISIONS.md ghi nhận D28, hoàn tất toàn bộ tiêu chí Gate P1 | PASS |

## AG-09 — App Foundation & Environment — 20/10/2026

**App tests: Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Khởi tạo Next.js 16 (App Router, TypeScript) trong repo `projects/angimom/` | PASS |
| 2 | Cấu hình Tailwind CSS và tích hợp trọn vẹn tokens từ `docs/tokens.css` vào `globals.css` | PASS |
| 3 | Cài đặt và cấu hình Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `postgres`), kiểm tra `npx drizzle-kit check` | PASS |
| 4 | Định nghĩa Invariants enums và bảng `users`, `recipes` trong `src/lib/db/schema.ts` | PASS |
| 5 | Cấu hình hạ tầng container hóa: `Dockerfile` multi-stage, `docker-compose.yml`, `Caddyfile`, `.env.example` | PASS |
| 6 | Kiểm tra `docker compose config` hợp lệ, không lỗi cú pháp | PASS |
| 7 | Kiểm tra `npm run build` biên dịch TypeScript và tối ưu hóa static pages thành công (exit code 0) | PASS |
| 8 | Secret scan: không có secret | PASS |
| 9 | DECISIONS.md ghi nhận D29 | PASS |

## AG-10 — Schema & Migrations — 20/10/2026

**App tests: Drizzle generate & Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Định nghĩa 6 enums miền và 11 bảng dữ liệu theo DATA_MODEL.md trong `src/lib/db/schema.ts` | PASS |
| 2 | Thiết lập quan hệ typesafe (Drizzle Relations) cho 11 bảng trong `src/lib/db/relations.ts` | PASS |
| 3 | Khởi tạo client kết nối cơ sở dữ liệu `db` tích hợp schema và relations trong `src/lib/db/index.ts` | PASS |
| 4 | Chạy `npm run db:generate` sinh thành công tập tin migration `drizzle/0000_dry_orphan.sql` (11 tables, 6 enums, 18 indexes, 11 foreign keys) | PASS |
| 5 | Chạy `npm run build` biên dịch thành công ứng dụng Next.js với đầy đủ schema và relations (exit code 0) | PASS |
| 6 | Secret scan: không có secret | PASS |
| 7 | DECISIONS.md ghi nhận D30 | PASS |

## AG-11 — Identity & Authorization — 20/10/2026

**App tests: Unit tests (`seed_users.ts`) & Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Bổ sung trường `password_hash` vào bảng `users` và sinh migration `drizzle/0001_happy_talon.sql` | PASS |
| 2 | Băm mật khẩu bằng Node.js scrypt và so sánh thời gian bất biến (timing-safe verification) | PASS |
| 3 | Ký và giải mã session token stateless bằng Web Crypto HMAC-SHA256 tương thích Edge Runtime | PASS |
| 4 | Cấu hình cookie session có cờ bảo mật `HttpOnly`, `SameSite=Lax`, `Secure` (production) | PASS |
| 5 | Các API endpoint xác thực `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | PASS |
| 6 | Next.js Middleware chặn truy cập trái phép vào `/admin/*` và `/editor/*`, chuyển hướng `/login` | PASS |
| 7 | Trang `/login` giao diện chuẩn Warm Kitchen kèm Suspense boundary pre-render an toàn | PASS |
| 8 | `npm run build` biên dịch thành công ứng dụng với middleware và dynamic auth routes (exit code 0) | PASS |
| 9 | Secret scan: không có secret | PASS |
| 10 | DECISIONS.md ghi nhận D31 | PASS |

## AG-12 — Ingredient & Taxonomy CRUD — 20/10/2026

**App tests: Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | API `/api/ingredients` (GET search, filter category/staple, POST có kiểm tra quyền EDITOR/ADMIN) | PASS |
| 2 | API `/api/ingredients/[id]` (GET, PUT, DELETE có kiểm tra ràng buộc khóa ngoại recipes) | PASS |
| 3 | API `/api/taxonomies` và `/[id]` (GET theo type, POST, DELETE có kiểm tra quyền EDITOR/ADMIN) | PASS |
| 4 | Seeder `src/scripts/seed_catalog.ts` chứa đầy đủ 29 nguyên liệu chuẩn hóa và 15 nhóm taxonomies cho Batch 0 | PASS |
| 5 | Giao diện `/editor/ingredients`: Bảng quản lý nguyên liệu, tìm kiếm tức thời, modal tạo mới, responsive | PASS |
| 6 | Giao diện `/editor/taxonomies`: Quản lý 4 nhóm thẻ phân loại đa trục, tạo mới và xóa thẻ | PASS |
| 7 | `npm run build` biên dịch thành công ứng dụng với tất cả API CRUD và trang biên tập viên (exit code 0) | PASS |
| 8 | Secret scan: không có secret | PASS |
| 9 | DECISIONS.md ghi nhận D32 | PASS |

## AG-13 — Structured Recipe Editor — 20/10/2026

**App tests: Unit tests (`test_recipes_crud.ts`), Postgres real DB integration, & Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Khởi động Postgres container `angimom_postgres`, áp dụng 2 migration SQL thành công | PASS |
| 2 | Nạp thành công seeder users và seeder catalog (29 nguyên liệu chuẩn hóa + 15 taxonomies) | PASS |
| 3 | API `/api/recipes` (GET tìm kiếm/lọc vai trò/trạng thái, POST tạo recipe có cấu trúc trong transaction) | PASS |
| 4 | API `/api/recipes/[id]` (GET trả về đầy đủ dish, ingredients, steps, tags; PUT cập nhật; DELETE xóa draft) | PASS |
| 5 | Bảo vệ Invariants §5.1: Cấm cập nhật trực tiếp hoặc xóa công thức đã xuất bản `PUBLISHED` | PASS |
| 6 | Giao diện `/editor/recipes`: Danh sách thẻ công thức, thống kê trạng thái, bộ lọc vai trò, responsive | PASS |
| 7 | Giao diện `/editor/recipes/new`: Form soạn thảo trực quan 4 phần (Thông tin chung, Bảng nguyên liệu động, Bước nấu có timer, Taxonomies) | PASS |
| 8 | Giao diện `/editor/recipes/[id]`: Xem/sửa công thức có cấu trúc kèm khóa bảo vệ banner khi `PUBLISHED` | PASS |
| 9 | `test_recipes_crud.ts` tự động kiểm thử CRUD và xác nhận Invariants §5.1 | PASS |
| 10 | `npm run build` biên dịch thành công ứng dụng với 14 routes sạch lỗi (exit code 0) | PASS |
| 11 | Secret scan: không có secret | PASS |
| 12 | DECISIONS.md ghi nhận D33 | PASS |

## AG-14 — Media Pipeline & Image Storage — 20/10/2026

**App tests: Storage unit tests (`test_upload_pipeline.ts`), Docker persistent volume config, & Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Module `saveUploadedFile` lưu tệp nhị phân an toàn vào thư mục `public/uploads/` | PASS |
| 2 | Hàm `deleteUploadedFile` xóa tệp sạch sẽ khi người dùng gỡ ảnh | PASS |
| 3 | Chặn tệp vượt quá giới hạn 5MB với thông báo lỗi tiếng Việt thân thiện | PASS |
| 4 | Chặn các tệp MIME type không phải ảnh (HTML, scripts, executable) | PASS |
| 5 | Chống tấn công Directory Traversal, làm sạch đường dẫn thư mục lưu trữ | PASS |
| 6 | API `/api/upload` (POST nhận multipart/form-data, DELETE xóa tệp, bảo vệ bởi session EDITOR/ADMIN) | PASS |
| 7 | Component UI `ImageUpload`: Preview hình ảnh, spinner loading khi tải, nút đổi ảnh/gỡ ảnh, responsive | PASS |
| 8 | Tích hợp tải ảnh bìa món ăn (`heroImage`) và ảnh từng bước nấu (`step.image`) trong `/editor/recipes/new` và `[id]` | PASS |
| 9 | Cấu hình volume lưu trữ bền vững `uploads_data:/app/public/uploads` trong `docker-compose.yml` | PASS |
| 10 | `npm run build` biên dịch thành công ứng dụng với 15 routes sạch lỗi (exit code 0) | PASS |
| 11 | Secret scan: không có secret | PASS |
| 12 | DECISIONS.md ghi nhận D34 | PASS |

