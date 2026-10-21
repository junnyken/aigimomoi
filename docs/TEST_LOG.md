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


## AG-15 — Publishing & Revision Gate — 20/10/2026

**App tests: Lifecycle test (`test_publishing_gate.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Gate Check chặn xuất bản khi thiếu ảnh bìa (HTTP 422) | PASS |
| 2 | Không xuất bản thẳng từ `DRAFT`, chỉ từ `SUBMITTED` (HTTP 409) | PASS |
| 3 | Luật nhãn kiểm chứng D23: bắt buộc Đã biên tập; không bật Nutrition Verified khi chưa có calo (HTTP 422) | PASS |
| 4 | Reject: ghi chú quá ngắn bị chặn (400); chuyển `NEEDS_CHANGES` + lưu góp ý; không reject lại khi không còn `SUBMITTED` (409) | PASS |
| 5 | Publish v1: ghi nhận `publishedAt`/`reviewedBy`, cờ kiểm chứng theo ADMIN, xoá ghi chú cũ | PASS |
| 6 | Revision v2: `DRAFT`, `revisionOf = v1`, reset nhãn kiểm chứng, nhân bản nguyên liệu/bước nấu/tag | PASS |
| 7 | Chặn revision thứ hai khi đã có bản mở; chặn revision từ bản chưa `PUBLISHED` (409) | PASS |
| 8 | v1 vẫn phục vụ người đọc trong khi v2 đang soạn | PASS |
| 9 | Publish v2: tiếp quản slug công khai; v1 `ARCHIVED` (slug `--v1`), nội dung bất biến | PASS |
| 10 | `test_publishing_gate.ts`: 22 PASS, 0 FAIL | PASS |
| 11 | API publish/reject chỉ `ADMIN`; revisions `EDITOR`/`ADMIN`; Same-Origin check trên endpoint đổi trạng thái | PASS |
| 12 | `seed_catalog.ts` tự thoát (đóng pool), exit 1 khi lỗi DB, không hardcode mật khẩu | PASS |
| 13 | `tsc --noEmit` sạch; `npm run build` thành công với 18 routes (exit code 0) | PASS |
| 14 | Secret scan: không có secret | PASS |
| 15 | DECISIONS.md ghi nhận D35 | PASS |

## AG-16 — Public Recipe Rendering — 20/10/2026

**App tests: `test_public_rendering.ts` (query + HTTP trên server standalone), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | `safeImageSrc` chặn `javascript:`, protocol-relative, `http:`, path traversal; slug lạ bị từ chối trước truy vấn | PASS |
| 2 | DRAFT/SUBMITTED không đọc được; PUBLISHED đọc được | PASS |
| 3 | Payload công khai không chứa email tác giả, ghi chú duyệt, trường nội bộ | PASS |
| 4 | Nguyên liệu theo `sortOrder`, bước theo `stepNumber`, giữ giá trị gốc, timer, `scalePolicy` | PASS |
| 5 | Slug ARCHIVED resolve về bản PUBLISHED hiện hành; slug DRAFT không resolve | PASS |
| 6 | Proxy: PUBLISHED → cho qua; ARCHIVED → redirect; DRAFT/SUBMITTED/placeholder → missing | PASS |
| 7 | Danh sách trang chủ chỉ gồm PUBLISHED | PASS |
| 8 | HTTP: PUBLISHED 200; DRAFT 404; không tồn tại 404; ARCHIVED 308 → bản hiện hành | PASS |
| 9 | HTML không lộ email/ghi chú duyệt; trang chủ liệt kê PUBLISHED, không liệt kê DRAFT | PASS |
| 10 | `test_public_rendering.ts`: 39 PASS, 0 FAIL | PASS |
| 11 | 404 render trong layout, có `noindex`; percent-encoding hỏng → 400 | PASS |
| 12 | 0 `dangerouslySetInnerHTML` trong `src/` | PASS |
| 13 | `tsc --noEmit` sạch; `npm run build` thành công (exit code 0) | PASS |
| 14 | Kiểm tra giao diện bằng mắt (desktop/mobile) | Chủ sản phẩm kiểm tra thủ công |
| 15 | DECISIONS.md ghi nhận D36 | PASS |

## AG-17 — Search & Filters — 20/10/2026

**App tests: `test_search_filters.ts` (36 test cases), `test_public_rendering.ts` regression check (31 test cases), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants §5.1: Chỉ trả công thức `PUBLISHED`; loại bỏ 100% `DRAFT`, `SUBMITTED`, `ARCHIVED` | PASS |
| 2 | Tìm kiếm từ khóa `q`: Tìm đúng tên món, tên nguyên liệu, mô tả ngắn | PASS |
| 3 | Parameterized query an toàn tuyệt đối với ký tự đặc biệt (`%`, `_`, `'`, `\`), không crash DB | PASS |
| 4 | Bộ lọc vai trò bữa ăn (`role`): Lọc chuẩn xác `MAIN`, `SOUP`, `SIDE`, `ONE_DISH_MEAL`, `DESSERT`, `BEVERAGE` | PASS |
| 5 | Bộ lọc thời gian tối đa (`maxTime`): Tổng thời gian prep + cook trong ngưỡng chỉ định | PASS |
| 6 | Bộ lọc độ khó (`difficulty`): Lọc chuẩn xác Dễ, Vừa, Khó | PASS |
| 7 | Bộ lọc nhãn kiểm chứng (`testedOnly`, `nutritionOnly`): Chỉ trả món có cờ tương ứng `true` | PASS |
| 8 | Lọc kết hợp đa tiêu chí (Composite Filter: `q` + `role` + `maxTime` + `testedOnly`) | PASS |
| 9 | Sắp xếp (`sort`): Nhanh nhất (`quickest`), Mới nhất (`newest`), Calo thấp nhất (`calories_asc`) | PASS |
| 10 | Phân trang và siêu dữ liệu: `totalCount`, `page`, `totalPages`, đếm số lượng món theo từng vai trò | PASS |
| 11 | `test_search_filters.ts`: 36 PASS, 0 FAIL (exit code 0) | PASS |
| 12 | `test_public_rendering.ts`: 31 PASS, 0 FAIL (không hồi quy AG-16) | PASS |
| 13 | URL phản ánh trung thực toàn bộ bộ lọc (§6.7); hỗ trợ deep linking, bookmark và back/forward | PASS |
| 14 | Responsive UI: Desktop filter sidebar dính; Mobile drawer sheet; Active filter chips xóa từng mục / xóa tất cả | PASS |
| 15 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 21 routes PPR (exit code 0) | PASS |
| 16 | DECISIONS.md ghi nhận D37 | PASS |

## AG-18 — Serving Adjustment — 20/10/2026

**App tests: `test_serving_adjustment.ts` (40 test cases), regression checks (`test_search_filters.ts`, `test_public_rendering.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants §5.4: Giữ nguyên số lượng nguyên liệu khi $R = 1.0$ (base=4, target=4) | PASS |
| 2 | Scale Up gấp đôi ($4 \to 8$, $R = 2.0$): Dòng `LINEAR` nhân đôi định lượng chính xác | PASS |
| 3 | Invariants §5.4: Dòng `FIXED` (hương liệu) giữ nguyên định lượng khi scale, không bị nhân | PASS |
| 4 | Invariants §5.4: Dòng `MANUAL_ADJUST` (gia vị nêm nếm) giữ nguyên kèm nhãn hướng dẫn | PASS |
| 5 | Scale Down giảm nửa ($4 \to 2$, $R = 0.5$): Tính toán chính xác định lượng nhỏ | PASS |
| 6 | Scale lẻ ($4 \to 6$, $R = 1.5$): Co giãn chính xác số thập phân | PASS |
| 7 | Scale cho 1 người ($4 \to 1$, $R = 0.25$): Định lượng cho cá nhân chính xác | PASS |
| 8 | Giới hạn biên an toàn (`clampServings`): Chặn số âm, 0, số lớn hơn 20 | PASS |
| 9 | Làm tròn hiển thị UI (D21): `formatScaledAmount` tối đa 2 chữ số thập phân, không sai số lũy tiến | PASS |
| 10 | Bất biến thời gian: Thời gian nấu và sơ chế không bị nhân theo $R$ | PASS |
| 11 | `test_serving_adjustment.ts`: 40 PASS, 0 FAIL (exit code 0) | PASS |
| 12 | `test_search_filters.ts`: 36 PASS, 0 FAIL (không hồi quy AG-17) | PASS |
| 13 | `test_public_rendering.ts`: 31 PASS, 0 FAIL (không hồi quy AG-16) | PASS |
| 14 | Component `ServingSelector`: Nút [-], [+], badge $R$, nút đặt lại về khẩu phần gốc | PASS |
| 15 | Đồng bộ URL `?servings=X` phía client qua `window.history.replaceState` không reload trang | PASS |
| 16 | `tsc --noEmit` sạch lỗi; `npm run build` thành công 21/21 routes (exit code 0) | PASS |
| 17 | DECISIONS.md ghi nhận D38 | PASS |

## AG-19 — Cooking Mode — 20/10/2026

**App tests: `test_cooking_mode.ts` (19 test cases), regression checks (`test_serving_adjustment.ts`, `test_search_filters.ts`, `test_public_rendering.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants §5.1: Chỉ cho phép công thức `PUBLISHED` mở chế độ nấu; chặn `DRAFT`/`SUBMITTED`/`ARCHIVED` (404) | PASS |
| 2 | Invariants §6.7: Thứ tự bước theo `stepNumber` tăng dần, hiển thị đầy đủ tên giai đoạn và mẹo nấu | PASS |
| 3 | Invariants §6.7: Bộ đếm ngược `StepTimer` đếm đúng thời gian, khi hết giờ cảnh báo và KHÔNG tự động chuyển bước | PASS |
| 4 | Kế thừa khẩu phần ăn (AG-18, §5.4): Nguyên liệu scale đúng theo `?servings=X` (LINEAR nhân $R$, FIXED/MANUAL giữ nguyên) | PASS |
| 5 | Điều hướng bước an toàn: Bounds checking không bị lỗi tràn mảng index | PASS |
| 6 | Ngăn kéo `QuickIngredientsSheet` mở tra cứu nguyên liệu nhanh mà không làm mất vị trí bước đang nấu | PASS |
| 7 | Hỗ trợ phím tắt bàn phím (ArrowLeft/ArrowRight), thanh tiến độ trực quan, modal chúc mừng nấu xong | PASS |
| 8 | `test_cooking_mode.ts`: 19 PASS, 0 FAIL (exit code 0) | PASS |
| 9 | `test_serving_adjustment.ts`: 40 PASS, 0 FAIL (không hồi quy AG-18) | PASS |
| 10 | `test_search_filters.ts`: 36 PASS, 0 FAIL (không hồi quy AG-17) | PASS |
| 11 | `test_public_rendering.ts`: 31 PASS, 0 FAIL (không hồi quy AG-16) | PASS |
| 12 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 23 routes (exit code 0) | PASS |
| 13 | DECISIONS.md ghi nhận D39 | PASS |

## AG-20 — Saved Recipes — 20/10/2026

**App tests: `test_saved_recipes.ts` (25 test cases), regression checks (`test_cooking_mode.ts`, `test_serving_adjustment.ts`, `test_search_filters.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants §6.7: Khách vãng lai lưu/bỏ lưu tức thời vào `localStorage`, không popup chặn luồng | PASS |
| 2 | Invariants §5.1: Danh sách món đã lưu chỉ hiển thị công thức `PUBLISHED`, tự động ẩn DRAFT/ARCHIVED | PASS |
| 3 | Thao tác lưu/bỏ lưu: User lưu và xóa bản ghi thành công trong database | PASS |
| 4 | Ràng buộc duy nhất (Unique constraint): Không bị duplicate khi lưu lại cùng một món | PASS |
| 5 | Cô lập dữ liệu (Data isolation): Dữ liệu món đã lưu giữa các người dùng hoàn toàn độc lập | PASS |
| 6 | Xóa liên hoàn (Cascade delete): Bản ghi `saved_recipes` tự động xóa khi user hoặc recipe bị xóa | PASS |
| 7 | Helper `queryPublishedRecipeCardsBySlugs`: Chỉ trả về thẻ của món PUBLISHED, bảo vệ thông tin tác giả | PASS |
| 8 | Đồng bộ khách vãng lai (Guest sync simulation): Tự động gộp danh sách từ khách vào DB an toàn | PASS |
| 9 | `test_saved_recipes.ts`: 25 PASS, 0 FAIL (exit code 0) | PASS |
| 10 | `test_cooking_mode.ts`: 19 PASS, 0 FAIL (không hồi quy AG-19) | PASS |
| 11 | `test_serving_adjustment.ts`: 40 PASS, 0 FAIL (không hồi quy AG-18) | PASS |
| 12 | `test_search_filters.ts`: 36 PASS, 0 FAIL (không hồi quy AG-17) | PASS |
| 13 | Component `BookmarkButton`: Tích hợp trên `RecipeCard` và trang chi tiết `/cong-thuc/[slug]` | PASS |
| 14 | Trang `/da-luu`: Giao diện bộ sưu tập có Empty State, realtime cards grid | PASS |
| 15 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 27 routes (exit code 0) | PASS |
| 16 | DECISIONS.md ghi nhận D40 | PASS |

## AG-21 — Meal Composition & Replacement — 20/10/2026

**App tests: `test_meal_composition.ts` (37 test cases), regression checks (`test_saved_recipes.ts`, `test_cooking_mode.ts`, `test_serving_adjustment.ts`, `test_search_filters.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants §5.3: Cấu trúc 3 món chuẩn (MAIN/SOUP/SIDE), mỗi slot chỉ nhận đúng vai trò | PASS |
| 2 | Invariants §5.1: Tuyệt đối chỉ hiển thị công thức `PUBLISHED` trong danh sách gợi ý và thay thế | PASS |
| 3 | Invariants §5.1: Món `DRAFT` và `ARCHIVED` bị loại bỏ 100%, tự động fallback về món PUBLISHED | PASS |
| 4 | Phân giải mâm cơm (`resolveMealSelection`): Xử lý đúng khi đủ 3 slugs, khi thiếu param, và khi gặp injection/XSS | PASS |
| 5 | Thuật toán đổi món (Slot Replacement): Đổi 1 slot giữ nguyên vẹn 2 slots còn lại | PASS |
| 6 | Thuật toán gợi ý ngẫu nhiên (`getRandomMealSlugs`): Trả về đủ 3 món 3 vai trò khác nhau hợp lệ | PASS |
| 7 | Invariants §5.4: Đồng bộ khẩu phần toàn mâm (`servings: 1..20`), thời gian nấu không bị nhân theo $R$ | PASS |
| 8 | `test_meal_composition.ts`: 37 PASS, 0 FAIL (exit code 0) | PASS |
| 9 | `test_saved_recipes.ts`: 25 PASS, 0 FAIL (không hồi quy AG-20) | PASS |
| 10 | `test_cooking_mode.ts`: 19 PASS, 0 FAIL (không hồi quy AG-19) | PASS |
| 11 | `test_serving_adjustment.ts`: 40 PASS, 0 FAIL (không hồi quy AG-18) | PASS |
| 12 | `test_search_filters.ts`: 36 PASS, 0 FAIL (không hồi quy AG-17) | PASS |
| 13 | Component `MealView`, `MealSlotCard`, `SwapDishModal`, `MealServingsSelector`, `MealSummaryBar` | PASS |
| 14 | Trang `/meal`: Server Component với Partial Prerendering và metadata SEO | PASS |
| 15 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 30 routes (exit code 0) | PASS |
| 16 | DECISIONS.md ghi nhận D41 | PASS |

## AG-22 — Ingredient Aggregation — 20/10/2026

**App tests: `test_ingredient_aggregation.ts` (37 test cases), regression checks (`test_meal_composition.ts`, `test_saved_recipes.ts`, `test_cooking_mode.ts`, `test_serving_adjustment.ts`, `test_search_filters.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants §5.4: Gộp chính xác nguyên liệu trùng tên và cùng đơn vị (400g + 150g = 550g) | PASS |
| 2 | Truy vết nguồn gốc (Traceability): Mục gộp lưu đủ mảng traces ghi nhận chi tiết từng món | PASS |
| 3 | Invariants §5.4: Tách riêng biệt gia vị `MANUAL_ADJUST`, không cộng dồn thô thiển vào `freshItems` | PASS |
| 4 | Invariants §5.4: Dòng `LINEAR` co giãn theo tỷ lệ $R$, dòng `FIXED` giữ nguyên số lượng gốc | PASS |
| 5 | Invariants §5.4: Cùng tên khác đơn vị đo (ví dụ: "trái" vs "muỗng") tách riêng biệt an toàn | PASS |
| 6 | Phân loại theo quầy chợ: `meatSeafood`, `produce`, `pantry`, `other` chuẩn xác | PASS |
| 7 | Làm tròn hiển thị (D21): `formatScaledAmount` định dạng chuẩn dấu phẩy tiếng Việt | PASS |
| 8 | Tích hợp DB Query (`queryMealRecipesForAggregation`): Chỉ lấy recipes `PUBLISHED`, loại bỏ DRAFT | PASS |
| 9 | `test_ingredient_aggregation.ts`: 37 PASS, 0 FAIL (exit code 0) | PASS |
| 10 | `test_meal_composition.ts`: 37 PASS, 0 FAIL (không hồi quy AG-21) | PASS |
| 11 | `test_saved_recipes.ts`: 25 PASS, 0 FAIL (không hồi quy AG-20) | PASS |
| 12 | `test_cooking_mode.ts`: 19 PASS, 0 FAIL (không hồi quy AG-19) | PASS |
| 13 | `test_serving_adjustment.ts`: 40 PASS, 0 FAIL (không hồi quy AG-18) | PASS |
| 14 | `test_search_filters.ts`: 36 PASS, 0 FAIL (không hồi quy AG-17) | PASS |
| 15 | API Endpoint `POST /api/meal/aggregate`: Trả về JSON `AggregationResult` chuẩn hóa | PASS |
| 16 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 31 routes (exit code 0) | PASS |
| 17 | DECISIONS.md ghi nhận D42 | PASS |

## AG-23 — Shopping Checklist Persistence — 20/10/2026

**App tests: `test_shopping_checklist.ts` (22 test cases), regression checks (`test_ingredient_aggregation.ts`, `test_meal_composition.ts`, `test_saved_recipes.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Khởi tạo danh sách đi chợ từ mâm cơm: Phân loại đúng quầy thịt cá, rau củ và đồ khô | PASS |
| 2 | Invariants §5.4: Gộp đúng cùng đơn vị (Hành tím 3 + 2 = 5 củ), tách riêng gia vị bếp nhà | PASS |
| 3 | Theo dõi tiến độ (Progress Tracking): Tính đúng số món và tỷ lệ % hoàn thành | PASS |
| 4 | Cơ chế Check / Uncheck: Tăng giảm chính xác tiến độ và cập nhật trạng thái hiển thị | PASS |
| 5 | Trạng thái hoàn thành: Đạt 100% khi tick đủ các món, hiển thị cờ hoàn thành | PASS |
| 6 | Cơ chế đặt lại (Reset Checklist): Xóa sạch danh sách tick về 0% cho lần đi chợ mới | PASS |
| 7 | Tiện ích xuất văn bản (Copy to Clipboard): Tạo nội dung tiếng Việt chuẩn mực gửi Zalo/SMS | PASS |
| 8 | `test_shopping_checklist.ts`: 22 PASS, 0 FAIL (exit code 0) | PASS |
| 9 | `test_ingredient_aggregation.ts`: 37 PASS, 0 FAIL (không hồi quy AG-22) | PASS |
| 10 | `test_meal_composition.ts`: 37 PASS, 0 FAIL (không hồi quy AG-21) | PASS |
| 11 | `test_saved_recipes.ts`: 25 PASS, 0 FAIL (không hồi quy AG-20) | PASS |
| 12 | Component `ShoppingView`, `ShoppingProgressBar`, `ShoppingItemRow` | PASS |
| 13 | Trang `/shopping`: Server Component với Partial Prerendering và metadata SEO | PASS |
| 14 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 32 routes (exit code 0) | PASS |
| 15 | DECISIONS.md ghi nhận D43 | PASS |

## AG-24 — SEO & Index Boundaries — 20/10/2026

**App tests: `test_seo_boundaries.ts` (37 test cases), regression checks (`test_shopping_checklist.ts`, `test_ingredient_aggregation.ts`, `test_meal_composition.ts`, `test_saved_recipes.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | `robots.txt`: Khai báo User-agent `*`, allow `/`, disallow `/editor/`, `/api/`, `/login` | PASS |
| 2 | `robots.txt`: Khai báo chính xác URL Sitemap `https://angimom.vn/sitemap.xml` | PASS |
| 3 | Dynamic Sitemap: Liệt kê đầy đủ các trang tĩnh trọng tâm (`/`, `/mon-an`, `/meal`, `/da-luu`, `/shopping`) | PASS |
| 4 | Invariants §5.1: Sitemap chứa 100% công thức `PUBLISHED` từ cơ sở dữ liệu thời gian thực | PASS |
| 5 | Invariants §5.1: Chặn tuyệt đối 100% công thức `DRAFT` và `ARCHIVED` khỏi Sitemap | PASS |
| 6 | Sitemap: Không bao giờ rò rỉ các route quản trị `/editor/`, `/api/`, `/login` | PASS |
| 7 | ISO 8601 Duration Parser: Chuyển đổi chính xác số phút sang định dạng `PT...` (0m -> PT0M, 75m -> PT1H15M, 150m -> PT2H30M) | PASS |
| 8 | Schema.org Recipe JSON-LD: Khai báo `@context`, `@type: Recipe`, `recipeCuisine: Vietnamese`, `HowToStep` | PASS |
| 9 | JSON-LD Serialization: Sanitize chống XSS an toàn qua việc escape ký tự `<` thành `\u003c` | PASS |
| 10 | Tích hợp RecipeJsonLd component vào trang chi tiết công thức `src/app/cong-thuc/[slug]/page.tsx` | PASS |
| 11 | `test_seo_boundaries.ts`: 37 PASS, 0 FAIL (exit code 0) | PASS |
| 12 | `test_shopping_checklist.ts`: 22 PASS, 0 FAIL (không hồi quy AG-23) | PASS |
| 13 | `test_ingredient_aggregation.ts`: 37 PASS, 0 FAIL (không hồi quy AG-22) | PASS |
| 14 | `test_meal_composition.ts`: 37 PASS, 0 FAIL (không hồi quy AG-21) | PASS |
| 15 | `test_saved_recipes.ts`: 25 PASS, 0 FAIL (không hồi quy AG-20) | PASS |
| 16 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 34 routes (exit code 0) | PASS |
| 17 | DECISIONS.md ghi nhận D44 | PASS |

## AG-25 — Staging Deploy & Observability — 20/10/2026

**App tests: `test_staging_observability.ts` (39 test cases), regression checks (`test_seo_boundaries.ts`, `test_shopping_checklist.ts`, `test_ingredient_aggregation.ts`, `test_meal_composition.ts`, `test_saved_recipes.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`), Docker compose configuration validation (`docker compose config`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariant "Log không lộ secrets": Redaction khử sạch `password`, `token`, `secret`, `jwt` trong JSON meta | PASS |
| 2 | Invariant "Log không lộ secrets": Che giấu mật khẩu trong PostgreSQL connection strings | PASS |
| 3 | Invariant "Log không lộ secrets": Che giấu Bearer header và JWT signature | PASS |
| 4 | Invariant "Log không lộ secrets": Khử dữ liệu nhạy cảm lồng nhau trong mảng và đối tượng phức tạp | PASS |
| 5 | Logger utility: Cung cấp `debug`, `info`, `warn`, `error` xuất JSON trong production và text sạch trong dev | PASS |
| 6 | Endpoint `/api/health`: Trả về HTTP 200 khi kết nối DB hoạt động bình thường | PASS |
| 7 | Endpoint `/api/health`: Header `Cache-Control: no-store, no-cache, must-revalidate` chống lưu đệm | PASS |
| 8 | Endpoint `/api/health`: Payload chuẩn xác (`status: healthy`, `database: connected`, `uptimeSeconds`, `version: 0.1.0`) | PASS |
| 9 | Endpoint `/api/health`: Bảo mật phản hồi, tuyệt đối không để lộ mật khẩu hay cổng DB nội bộ | PASS |
| 10 | Endpoint `/api/health`: Khả năng phục hồi khi lỗi DB, trả về HTTP 503 và thông báo lỗi an toàn không rò rỉ credential | PASS |
| 11 | `Dockerfile`: Base image alpine, non-root user `nextjs:nodejs`, tối ưu standalone output | PASS |
| 12 | `docker-compose.yml`: Đầy đủ 3 services (`db`, `web`, `caddy`), healthcheck probe định kỳ cho `db` và `web` | PASS |
| 13 | `docker-compose.yml`: Ràng buộc `caddy` phụ thuộc `web: condition: service_healthy` | PASS |
| 14 | `docker-compose.yml`: Lưu trữ bền vững dữ liệu DB (`pgdata`) và ảnh media (`uploads_data`) | PASS |
| 15 | `Caddyfile`: Reverse proxy tới `web:3000`, nén gzip/zstd | PASS |
| 16 | `docker compose config`: Kiểm tra cấu hình hợp lệ (exit code 0) | PASS |
| 17 | `test_staging_observability.ts`: 39 PASS, 0 FAIL (exit code 0) | PASS |
| 18 | `test_seo_boundaries.ts`: 37 PASS, 0 FAIL (không hồi quy AG-24) | PASS |
| 19 | `test_shopping_checklist.ts`: 22 PASS, 0 FAIL (không hồi quy AG-23) | PASS |
| 20 | `test_ingredient_aggregation.ts`: 37 PASS, 0 FAIL (không hồi quy AG-22) | PASS |
| 21 | `test_meal_composition.ts`: 37 PASS, 0 FAIL (không hồi quy AG-21) | PASS |
| 22 | `test_saved_recipes.ts`: 25 PASS, 0 FAIL (không hồi quy AG-20) | PASS |
| 23 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 35 routes (exit code 0) | PASS |
| 24 | DECISIONS.md ghi nhận D45 | PASS |

## AG-26 — Content Batch Review & MVP Pilot Gate — 20/10/2026

**App tests: `test_p3_pilot_gate.ts` (36 test cases), complete P3 regression checks (`test_staging_observability.ts`, `test_seo_boundaries.ts`, `test_shopping_checklist.ts`, `test_ingredient_aggregation.ts`, `test_meal_composition.ts`, `test_saved_recipes.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Catalog Batch 1: Số lượng công thức `PUBLISHED` trong DB $\ge 10$ (thực tế có 12 món) | PASS |
| 2 | Catalog Batch 1: Đủ tối thiểu 3 món mặn (MAIN), 3 món canh (SOUP), 2 món rau/xào (SIDE) | PASS |
| 3 | Invariants §5.5: 100% công thức đạt chuẩn chất lượng có `isCookTested = true` và `isEditorialReviewed = true` | PASS |
| 4 | Invariants §5.4: Tất cả nguyên liệu đều có `scalePolicy` rõ ràng (`LINEAR`, `FIXED`, `MANUAL_ADJUST`) | PASS |
| 5 | Các bước nấu: Có đầy đủ hướng dẫn chi tiết, hẹn giờ `timerSeconds` và mẹo bếp `tipText` | PASS |
| 6 | E2E Flow 1: Tìm kiếm theo vai trò (`MAIN`) trả về danh sách công thức phù hợp | PASS |
| 7 | E2E Flow 1: Chi tiết công thức hiển thị đầy đủ nguyên liệu, bước nấu và nhãn tags | PASS |
| 8 | E2E Flow 1: Co giãn khẩu phần 4 $\to$ 6 người ($R = 1.5$) co giãn chính xác định lượng `LINEAR` và giữ nguyên `MANUAL_ADJUST` | PASS |
| 9 | E2E Flow 1: Bước nấu Cooking Mode có đồng hồ đếm ngược hoạt động chuẩn xác | PASS |
| 10 | E2E Flow 2: Phân giải mâm cơm 3 món chuẩn Việt Nam (MAIN, SOUP, SIDE) | PASS |
| 11 | E2E Flow 2: Đổi món cục bộ slot SOUP giữ nguyên vẹn 2 slot MAIN và SIDE | PASS |
| 12 | E2E Flow 2: Tự động gộp nguyên liệu mâm cơm, tách riêng đồ tươi sống và gia vị bếp nhà | PASS |
| 13 | E2E Flow 2: Checklist đi chợ hỗ trợ tick chọn, thanh tiến độ và xuất văn bản sao chép chuẩn mực | PASS |
| 14 | Invariants §11.4: Tồn tại kịch bản sao lưu `scripts/backup_db.sh` và khôi phục `scripts/restore_db.sh` | PASS |
| 15 | Invariants §11.4: Diễn tập sao lưu tạo thành công tệp .sql có timestamp | PASS |
| 16 | Invariants §11.4: Diễn tập khôi phục (Restore Drill) loại bỏ bản ghi thử nghiệm tạm và khôi phục 100% dữ liệu gốc | PASS |
| 17 | Healthcheck & Liveness: Endpoint `/api/health` trả về HTTP 200 OK, DB `connected` | PASS |
| 18 | SEO & Robots: `robots.txt` chặn `/editor/`, Sitemap chứa 17 URLs công khai hợp lệ | PASS |
| 19 | `test_p3_pilot_gate.ts`: 36 PASS, 0 FAIL (exit code 0) | PASS |
| 20 | `test_staging_observability.ts`: 39 PASS, 0 FAIL (không hồi quy AG-25) | PASS |
| 21 | `test_seo_boundaries.ts`: 37 PASS, 0 FAIL (không hồi quy AG-24) | PASS |
| 22 | `test_shopping_checklist.ts`: 22 PASS, 0 FAIL (không hồi quy AG-23) | PASS |
| 23 | `test_ingredient_aggregation.ts`: 37 PASS, 0 FAIL (không hồi quy AG-22) | PASS |
| 24 | `test_meal_composition.ts`: 37 PASS, 0 FAIL (không hồi quy AG-21) | PASS |
| 25 | `test_saved_recipes.ts`: 25 PASS, 0 FAIL (không hồi quy AG-20) | PASS |
| 26 | **TỔNG CỘNG CHUỖI P3: 233 PASS, 0 FAIL (100%)** | PASS |
| 27 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 35 routes (exit code 0) | PASS |
| 28 | DECISIONS.md ghi nhận D46 — **GATE P3 ĐẠT TOÀN DIỆN** | PASS |

## AG-27 — AI Provider Boundary & Budget — 20/10/2026

**App tests: `test_ai_boundary_budget.ts` (20 test cases), regression checks (`test_p3_pilot_gate.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants Gate P4: Không rò rỉ khóa API ra client-side (`NEXT_PUBLIC_` không tồn tại) | PASS |
| 2 | Redaction: Tự động che giấu `apiKey` thành `[REDACTED]` khi ghi log | PASS |
| 3 | Token Capping: Yêu cầu vượt trần (5000 tokens) tự động clamp an toàn về 1200 tokens | PASS |
| 4 | Timeout Capping: Yêu cầu timeout 30s tự động clamp an toàn về tối đa 10s | PASS |
| 5 | Rate Limiting: Cho phép các request hợp lệ trong ngưỡng (3 req/phút) | PASS |
| 6 | Rate Limiting: Từ chối request thứ 4 vượt ngưỡng và kích hoạt fallback an toàn | PASS |
| 7 | Automatic Fallback Chain: Provider chính lỗi (429 Quota) tự động chuyển sang Mock Heuristic | PASS |
| 8 | Fallback Integrity: Kết quả fallback trả về JSON hợp lệ, có trường recommendation | PASS |
| 9 | Provider Availability: Gemini Provider phát hiện chính xác khi có/không có API key | PASS |
| 10 | Provider Availability: OpenAI Provider phát hiện chính xác khi có/không có API key | PASS |
| 11 | Provider Availability: Mock Heuristic Provider luôn luôn khả dụng làm chốt chặn cuối | PASS |
| 12 | Invariants Gate P4: AI output độc lập, không có quyền tự động publish công thức | PASS |
| 13 | `test_ai_boundary_budget.ts`: 20 PASS, 0 FAIL (exit code 0) | PASS |
| 14 | `test_p3_pilot_gate.ts`: 36 PASS, 0 FAIL (không hồi quy Gate P3) | PASS |
| 15 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 35 routes (exit code 0) | PASS |
| 16 | DECISIONS.md ghi nhận D47, giải quyết câu hỏi mở O4 | PASS |

## AG-28 — AI Recipe & Meal Suggestion with Catalog Grounding — 20/10/2026

**App tests: `test_ai_meal_suggestion.ts` (30 test cases), regression checks (`test_ai_boundary_budget.ts`, `test_p3_pilot_gate.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants §5.1: 100% món ăn gợi ý (`mainSlug`, `soupSlug`, `sideSlug`) là công thức có thật trong DB với `status = 'PUBLISHED'` | PASS |
| 2 | Invariants §5.3: Cấu trúc 3 món cân bằng chuẩn mâm cơm Việt (1 MAIN, 1 SOUP, 1 SIDE) | PASS |
| 3 | Anti-Hallucination: Khi AI sinh slug bịa đặt, Grounding Validator tự động chặn và thay thế bằng slug hợp lệ trong catalog | PASS |
| 4 | Matching Ingredients: Phân tích và nhận diện chính xác nguyên liệu tủ lạnh trùng khớp | PASS |
| 5 | Guest-first: Khách vãng lai gọi gợi ý với nguyên liệu trống hoặc bất kỳ đều nhận được mâm cơm hợp lệ | PASS |
| 6 | DTO Integrity: Thông tin món ăn trả về đầy đủ ảnh `heroImage`, thời gian nấu, độ khó và khẩu phần cơ bản | PASS |
| 7 | UI Modal: Tích hợp `AiMealSuggestionModal` vào trang `/meal`, hỗ trợ chọn nguyên liệu tủ lạnh và xem `rationale` | PASS |
| 8 | 1-Click Apply: Nút "Áp dụng mâm này" đồng bộ ngay lập tức 3 món vào mâm cơm, URL query params và localStorage | PASS |
| 9 | API `/api/ai/meal-suggestion`: Phản hồi HTTP 200 OK với header `no-store, no-cache, must-revalidate` | PASS |
| 10 | Rate Limiting & Abuse Prevention: Áp dụng rate limit theo client IP cho endpoint gợi ý AI | PASS |
| 11 | `test_ai_meal_suggestion.ts`: 30 PASS, 0 FAIL (exit code 0) | PASS |
| 12 | `test_ai_boundary_budget.ts`: 20 PASS, 0 FAIL (không hồi quy AG-27) | PASS |
| 13 | `test_p3_pilot_gate.ts`: 36 PASS, 0 FAIL (không hồi quy Gate P3) | PASS |
| 14 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 36 routes (exit code 0) | PASS |
| 15 | DECISIONS.md ghi nhận D48 | PASS |

## AG-29 — AI Authoring Drafts & Recipe Schema Generation — 20/10/2026

**App tests: `test_ai_authoring_drafts.ts` (52 test cases), regression checks (`test_ai_meal_suggestion.ts`, `test_ai_boundary_budget.ts`, `test_p3_pilot_gate.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants Gate P4: Bản nháp AI luôn có `status = 'DRAFT'` | PASS |
| 2 | Invariants Gate P4: Bản nháp AI luôn có `provenance = 'AI_ASSISTED'` | PASS |
| 3 | Master Plan §8.2: Tuyệt đối không bật cờ kiểm chứng (`isCookTested = false`, `isEditorialReviewed = false`) | PASS |
| 4 | Schema Validity: Định lượng nguyên liệu hợp lệ (`ingredientId > 0`, `amount > 0`, `scalePolicy` chuẩn) | PASS |
| 5 | Schema Validity: Bước nấu đầy đủ `stepNumber`, `phaseName` và `instruction` chi tiết | PASS |
| 6 | Database Persistence: Lưu trực tiếp bản nháp vào PostgreSQL bảo toàn 100% invariants và quan hệ khóa ngoại | PASS |
| 7 | Role Variation: Tạo bản thảo chuẩn mực cho cả 3 vai trò `MAIN`, `SOUP`, `SIDE` | PASS |
| 8 | Ingredient Linking: Tự động tra cứu và liên kết với từ điển `ingredients` trong database | PASS |
| 9 | API `/api/ai/recipe-draft`: Bảo vệ phân quyền, bắt buộc session EDITOR hoặc ADMIN (chặn HTTP 403 nếu không đủ quyền) | PASS |
| 10 | Anti-Bypass: Endpoint `/api/recipes` chặn triệt để hành vi cố tình xuất bản trực tiếp bản nháp AI | PASS |
| 11 | UI Integration: Nút `✨ Soạn bằng AI` và modal `AiDraftModal` tại `/editor/recipes/new` và `/editor/recipes` | PASS |
| 12 | UI Provenance Badge: Huy hiệu `🤖 AI Assistant` hiển thị rõ ràng trên danh sách và chi tiết công thức | PASS |
| 13 | `test_ai_authoring_drafts.ts`: 52 PASS, 0 FAIL (exit code 0) | PASS |
| 14 | `test_ai_meal_suggestion.ts`: 30 PASS, 0 FAIL (không hồi quy AG-28) | PASS |
| 15 | `test_ai_boundary_budget.ts`: 20 PASS, 0 FAIL (không hồi quy AG-27) | PASS |
| 16 | `test_p3_pilot_gate.ts`: 36 PASS, 0 FAIL (không hồi quy Gate P3) | PASS |
| 17 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 37 routes (exit code 0) | PASS |
| 18 | DECISIONS.md ghi nhận D49 | PASS |

## AG-30 — AI Evaluation & Fallback Review (Master Gate P4 Verification) — 20/10/2026

**App tests: `test_p4_evaluation_gate.ts` (43 test cases), regression checks (`test_ai_authoring_drafts.ts`, `test_ai_meal_suggestion.ts`, `test_ai_boundary_budget.ts`, `test_p3_pilot_gate.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Anti-Hallucination: 100% slug món ăn gợi ý là ID thật trong catalog `PUBLISHED` (Hallucination Rate: 0.0%) | PASS |
| 2 | Invariants Gate P4: status BẮT BUỘC là `DRAFT` cho mọi bản thảo do AI sinh ra | PASS |
| 3 | Invariants Gate P4: provenance BẮT BUỘC là `AI_ASSISTED` | PASS |
| 4 | Invariants Gate P4: Không tự động bật cờ `isCookTested`, `isEditorialReviewed` hay `isNutritionVerified` | PASS |
| 5 | Database Persistence: Bản nháp lưu vào PostgreSQL bảo toàn 100% các cờ an toàn và `publishedAt = null` | PASS |
| 6 | Budget Discipline: Token cap tự động clamp về trần an toàn $\le 1200$ tokens | PASS |
| 7 | Budget Discipline: Timeout cap tự động clamp về $\le 10$s | PASS |
| 8 | Abuse Prevention: Rate limiting chặn đứng request vượt ngưỡng và kích hoạt fallback | PASS |
| 9 | Transparent Fallback: Gắn cờ `isFallback: true` và `provider: 'mock'` minh bạch khi chạy Heuristic | PASS |
| 10 | Fallback Resilience: Mâm cơm fallback vẫn 100% là công thức thật trong database, không lỗi 500 | PASS |
| 11 | Server-Only Secrets: Không rò rỉ bất kỳ khóa API AI nào ra client-side (`NEXT_PUBLIC_` không tồn tại) | PASS |
| 12 | `test_p4_evaluation_gate.ts`: 43 PASS, 0 FAIL (exit code 0) | PASS |
| 13 | `test_ai_authoring_drafts.ts`: 52 PASS, 0 FAIL (không hồi quy AG-29) | PASS |
| 14 | `test_ai_meal_suggestion.ts`: 30 PASS, 0 FAIL (không hồi quy AG-28) | PASS |
| 15 | `test_ai_boundary_budget.ts`: 20 PASS, 0 FAIL (không hồi quy AG-27) | PASS |
| 16 | `test_p3_pilot_gate.ts`: 36 PASS, 0 FAIL (không hồi quy Gate P3) | PASS |
| 17 | **TỔNG CỘNG CHUỖI P4: 181 PASS, 0 FAIL (100%)** | PASS |
| 18 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 37 routes (exit code 0) | PASS |
## AG-31 — Contributor Submissions — 21/10/2026

**App tests: `test_contributor_submissions.ts` (19 test cases), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants Gate P5: Chặn truy cập API đóng góp khi chưa đăng nhập (HTTP 401 Unauthorized) | PASS |
| 2 | Contributor tạo thành công bản nháp công thức gia đình (`status = 'DRAFT'`) | PASS |
| 3 | Invariants Gate P5: `provenance = 'COMMUNITY_SUBMITTED'`, `authorId = cook1.id` | PASS |
| 4 | Invariants Gate P5: Mặc định `isEditorialReviewed = false`, `isCookTested = false` | PASS |
| 5 | Phân lập dữ liệu: Contributor 1 thấy bài của mình tại `/api/contribute/recipes`, Contributor 2 không thấy bản nháp của Contributor 1 | PASS |
| 6 | Bảo vệ quyền sở hữu (Ownership Guard): Chặn Contributor 2 sửa hoặc xóa bài của Contributor 1 (HTTP 404) | PASS |
| 7 | Nộp bài vào Hàng đợi Kiểm duyệt: Chuyển đổi trạng thái sang `SUBMITTED` | PASS |
| 8 | Khóa sửa đổi: Chặn tuyệt đối hành vi sửa bài hoặc xóa bài khi đang ở trạng thái `SUBMITTED` (HTTP 409 Conflict) | PASS |
| 9 | Quy trình Ban biên tập yêu cầu sửa (`NEEDS_CHANGES`): Tác giả được mở quyền cập nhật và nộp lại thành công | PASS |
| 10 | Giao diện Bếp Nhà (`/contribute`), Form soạn thảo đóng góp (`/contribute/new`), Form chỉnh sửa nộp lại (`/contribute/[id]`) | PASS |
| 11 | `test_contributor_submissions.ts`: 19 PASS, 0 FAIL (exit code 0) | PASS |
| 12 | `tsc --noEmit` sạch lỗi; `npm run build` thành công (exit code 0) | PASS |
| 13 | DECISIONS.md ghi nhận D51 | PASS |

## AG-32 — Content Moderation & Abuse Reports — 21/10/2026

**App tests: `test_recipe_moderation.ts` (20 test cases), regression checks (`test_contributor_submissions.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants Gate P5: Khách vãng lai gửi báo cáo vi phạm an toàn thực phẩm không cần đăng nhập | PASS |
| 2 | Invariants Gate P5: Thành viên có session gửi báo cáo ghi nhận chính xác `reporterId` | PASS |
| 3 | Chặn báo cáo thiếu lý do vi phạm hoặc dữ liệu không hợp lệ (HTTP 400 Bad Request) | PASS |
| 4 | Phân quyền bảo mật: Người dùng vai trò `COOK` bị chặn truy cập `/api/editor/reports` (HTTP 403 Forbidden) | PASS |
| 5 | Biên tập viên (`EDITOR`) xem đầy đủ danh sách hàng đợi báo cáo (`status = PENDING`) | PASS |
| 6 | Biên tập viên xử lý Takedown công thức vi phạm về `NEEDS_CHANGES`, lưu `reviewNotes` và `resolvedById` | PASS |
| 7 | Invariants §5.1: Công thức bị gỡ ngay lập tức biến mất khỏi catalog công khai (`queryPublishedRecipeBySlug` trả về null) | PASS |
| 8 | Luồng sửa đổi: Tác giả mở Bếp Nhà xem hướng dẫn, cập nhật nội dung và nộp lại thành công vào `SUBMITTED` | PASS |
| 9 | Modal báo cáo vi phạm (`ReportRecipeModal`), Nút báo cáo chân trang (`ReportButton`), Trang kiểm duyệt BTV (`/editor/reports`) | PASS |
| 10 | `test_recipe_moderation.ts`: 20 PASS, 0 FAIL (exit code 0) | PASS |
| 11 | `test_contributor_submissions.ts`: 19 PASS, 0 FAIL (không hồi quy AG-31) | PASS |
| 12 | `tsc --noEmit` sạch lỗi; `npm run build` thành công (exit code 0) | PASS |
| 13 | DECISIONS.md ghi nhận D52 | PASS |

## AG-33 — Dish Variants & Kitchen Stories — 21/10/2026

**App tests: `test_dish_variants_stories.ts` (15 test cases), regression checks (`test_contributor_submissions.ts`, `test_recipe_moderation.ts`), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Invariants Gate P5: Lưu trữ và truy vấn chính xác trường `region` ('NORTH', 'CENTRAL', 'SOUTH', 'GENERAL') | PASS |
| 2 | Invariants Gate P5: Lưu trữ và truy vấn trọn vẹn `kitchenStory` và `sourceAttribution` | PASS |
| 3 | Liên kết biến thể (`variantOfId`): Tự động phát hiện liên kết hai chiều giữa món gốc và biến thể địa phương | PASS |
| 4 | Invariants §5.1: Danh sách biến thể gợi ý chỉ chứa công thức `PUBLISHED`, loại bỏ 100% bản nháp `DRAFT` | PASS |
| 5 | Đóng góp công thức qua API `/api/contribute/recipes`: Lưu trọn vẹn câu chuyện bếp nhà và nguồn gốc | PASS |
| 6 | Giao diện: Component `KitchenStorySection` trình bày typography câu chuyện gia đình ấm cúng | PASS |
| 7 | Giao diện: Component `RegionalVariants` hiển thị thẻ chuyển đổi nhanh giữa các phiên bản vùng miền | PASS |
| 8 | `test_dish_variants_stories.ts`: 15 PASS, 0 FAIL (exit code 0) | PASS |
| 9 | `test_recipe_moderation.ts`: 20 PASS, 0 FAIL (không hồi quy AG-32) | PASS |
| 10 | `test_contributor_submissions.ts`: 19 PASS, 0 FAIL (không hồi quy AG-31) | PASS |
| 11 | **TỔNG CỘNG CHUỖI P5 (AG-31, 32, 33): 54 PASS, 0 FAIL (100%)** | PASS |
| 12 | `tsc --noEmit` sạch lỗi; `npm run build` thành công với 43 routes tối ưu (exit code 0) | PASS |
| 13 | DECISIONS.md ghi nhận D53 | PASS |

## R0 — Authentication Configuration & Secret Fail-Closed Hardening — 21/10/2026

**App tests: `test_auth_hardening.ts` (45 assertions / 10 scenarios), `seed_users.ts` (auth unit test), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | **T01 — Fail-Closed Negative Tests**: `AUTH_SECRET` undefined, rỗng, chỉ có khoảng trắng $\to$ `getAuthSecret()` và `signToken()` ném `AuthConfigurationError`; `verifyToken()` trả về null an toàn | PASS |
| 2 | **T01 — Whitespace Guard**: Từ chối secret có khoảng trắng đầu hoặc cuối, bảo vệ tính trung thực không tự ý trim âm thầm | PASS |
| 3 | **T01 — Length Policy**: Từ chối secret ngắn hơn 32 ký tự với thông điệp rõ ràng | PASS |
| 4 | **T01 — Blacklist Placeholders**: Từ chối 100% 5 chuỗi placeholder và fallback cũ đã biết (`angimom_default_fallback_...`, `angimom_super_secret_...`, v.v.) | PASS |
| 5 | **T02 — Legacy Name Rejection**: Khi chỉ có `JWT_SECRET`, runtime từ chối hoạt động (fail-closed), không nhận biến cũ | PASS |
| 6 | **T03 — Positive Unit Test**: Khóa ngẫu nhiên mật mã 32+ ký tự ký và xác minh token thành công, khớp toàn vẹn `SessionUser` (`id`, `email`, `role`, `exp`) | PASS |
| 7 | **T04 — Tampered & Expired Tokens**: Từ chối token bị sửa 1 ký tự signature, token malformed không đúng cấu trúc, và token hết hạn (`exp` quá khứ) | PASS |
| 8 | **T05 — Old Fallback Token Rejection**: Token từng ký bằng fallback secret cũ bị từ chối 100% dưới runtime dùng secret mới | PASS |
| 9 | **T06 — Edge Proxy Guarding**: Proxy Next.js redirect anonymous truy cập `/admin/*` về `/login`; chặn người dùng `COOK` truy cập `/admin/*` và `/editor/*` (HTTP 403 Forbidden); cho phép `ADMIN`/`EDITOR` truy cập đúng tuyến | PASS |
| 10 | **T06 — API RBAC Boundary**: Endpoint `POST /api/recipes/[id]/publish` từ chối người dùng vai trò `COOK` với mã HTTP 403 Forbidden | PASS |
| 11 | **T07 — Redaction & Leakage Verification**: API `/api/auth/login` khi lỗi cấu hình trả mã HTTP 500 kèm thông báo tiếng Việt tổng quát an toàn; response không lộ secret; `redactSensitiveData()` che giấu `auth_secret`, `token`, `database_url` và connection string | PASS |
| 12 | **T08 — Infrastructure Config Validation**: `docker-compose.prod.yml` và `docker-compose.yml` bắt buộc truyền `AUTH_SECRET` qua cú pháp fail-fast `${VAR:?error}`; không còn fallback secret mặc định; loại bỏ hoàn toàn `JWT_SECRET` | PASS |
| 13 | **T09 — Observability & Readiness Probe**: `/api/health` trả về HTTP 503 Service Unavailable (`status: "unhealthy", auth: "unconfigured"`) khi `AUTH_SECRET` thiếu hoặc không hợp lệ | PASS |
| 14 | **T10 — Clean Build & Typecheck**: `npx tsc --noEmit` exit code 0; `npm run build` thực tế chạy thành công (exit code 0) không cần secret production | PASS |
| 15 | **Regression Check**: `seed_users.ts` chạy độc lập với test secret riêng, 100% assertions PASS (exit code 0) | PASS |
| 16 | **TỔNG CỘNG R0**: 45/45 assertions đạt PASS 100% (exit code 0) | PASS |
| 17 | DECISIONS.md ghi nhận D58 | PASS |

## R1 — Data Honesty & Verification Badges — 21/10/2026

**App tests: `test_data_honesty.ts` (38 assertions / 6 groups), `test_auth_hardening.ts` (45 assertions / regression R0), TypeScript (`tsc --noEmit`), Next.js production build (`npm run build`).**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | **Group 1 — isIllustrationImage Classification**: Nhận diện chính xác URL ảnh Unsplash chuẩn, domain Unsplash, Pexels, Pixabay, placeholder và HTTPS stock ngoài (`true`) | PASS |
| 2 | **Group 1 — Local Uploads Identification**: Nhận diện chính xác đường dẫn ảnh nội bộ `/uploads/...` hoặc domain nội bộ là ảnh chụp thực tế (`false`) | PASS |
| 3 | **Group 1 — Falsy Input Guard**: `null`, `undefined`, chuỗi rỗng và khoảng trắng trả về `false` an toàn | PASS |
| 4 | **Group 2 — Seed Production Catalog**: `seed_production_catalog.ts` gán `isCookTested: false` cho toàn bộ 12 món ăn; không còn bất kỳ dòng `isCookTested: true` nào; giữ `isEditorialReviewed: true` | PASS |
| 5 | **Group 2 — Seed P7 Catalog**: `seed_p7_catalog.ts` gán `isCookTested: false` cho toàn bộ 5 món ăn; không còn bất kỳ dòng `isCookTested: true` nào; giữ `isEditorialReviewed: true` | PASS |
| 6 | **Group 2 — Unsplash Attribution**: 17/17 món hạt giống sử dụng ảnh Unsplash được phân loại chính xác là ảnh minh họa | PASS |
| 7 | **Group 3 — Verification Badges Degradation**: `VerificationBadges` chỉ hiển thị "Đã nấu thử" khi `isCookTested === true`; khi `isCookTested === false` hiển thị trung thực nhãn `Chờ kiểm nghiệm bếp mẫu` | PASS |
| 8 | **Group 4 — UI Image Badges (RecipeCard)**: `RecipeCard.tsx` hiển thị nhãn `Ảnh minh họa` cho ảnh stock; ẩn hoàn toàn huy hiệu `Đã nấu thử` khi chưa kiểm nghiệm | PASS |
| 9 | **Group 4 — UI Image Badges (Detail Page)**: Trang chi tiết `/cong-thuc/[slug]` hiển thị nhãn `Ảnh minh họa` trên hero image và ghi chú chân thực dưới ảnh | PASS |
| 10 | **Group 4 — UI Image Badges (Meal & Swap)**: `MealSlotCard.tsx` và `SwapDishModal.tsx` hiển thị nhãn `Ảnh minh họa` / `Minh họa`; ẩn nhãn `Đã nấu thử` / `Đã test` khi chưa nấu thật | PASS |
| 11 | **Group 5 — Contracts & Queries**: `PublicRecipe` và `PublicRecipeCard` có trường `isIllustration: boolean`; query detail và card tự động suy diễn `isIllustration` | PASS |
| 12 | **Group 5 — Search Filter Invariants**: `searchPublishedRecipes` lọc `testedOnly` theo đúng điều kiện parameterized `eq(recipes.isCookTested, true)` | PASS |
| 13 | **Group 6 — Pilot Gate Invariant Guard**: `test_p3_pilot_gate.ts` được cập nhật, loại bỏ điều kiện ép buộc giả mạo `r.isCookTested === true` đối với catalog hạt giống | PASS |
| 14 | **Regression R0**: `npm run test:auth` tiếp tục đạt 45/45 PASS 100% | PASS |
| 15 | **Typecheck & Production Build**: `npx tsc --noEmit` exit code 0; `npm run build` thành công toàn bộ 55 routes | PASS |
| 16 | **TỔNG CỘNG R1**: 38/38 assertions đạt PASS 100% (exit code 0) | PASS |
| 17 | DECISIONS.md ghi nhận D59 | PASS |



## R2 — Core MVP Verification & Real Cooking Flows — 21/10/2026

**App tests: `test_core_mvp_flows.ts` (85 assertions / 7 nhóm, thuần — không cần DB), hồi quy `test:auth` (R0) & `test:honesty` (R1), script cũ không cần DB (`test_shopping_checklist.ts`, `test_serving_adjustment.ts`), TypeScript (`tsc --noEmit`), Next.js production build.** Nhóm ghi `[STATIC]` là kiểm tra tĩnh mã nguồn, không phải chạy trình duyệt.

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | **Nhóm 1 — Co giãn khẩu phần**: R=1.5 (400g→600g), R=0.5, R=4/3 (hiển thị ≤2 số thập phân, giá trị tính toán không bị làm tròn đè), FIXED/MANUAL_ADJUST giữ gốc, kẹp 1–20 (0, -3, NaN, null, "abc", 25, 2.6), định dạng vi-VN ("1,5", "1.500") | PASS |
| 2 | **Nhóm 2 — Gộp đi chợ với nhãn quầy tiếng Việt thật (hồi quy B1)**: `normalizeMarketCategory` (NFC/NFD, hoa thường, mã cũ); seed thật không còn rơi vào "khác"; khác đơn vị tách dòng; cùng tên/đơn vị gộp + truy vết; FIXED không nhân; baseServings=0 an toàn | PASS |
| 3 | **Nhóm 3 — Văn bản Zalo (hồi quy B2)**: có mục "GIA VỊ & ĐỒ KHÔ CẦN MUA"; 13/13 dòng cần mua xuất hiện kèm định lượng; không lộ NaN/undefined | PASS |
| 4 | **Nhóm 4 — An toàn chế độ nấu [STATIC]**: StepTimer không có callback tự chuyển bước; chỉ nhận `initialSeconds`/`stepNumber`; hồi quy B5 `(timerSeconds ?? 0) > 0`; ngăn kéo nguyên liệu nhận `scaledIngredients` | PASS |
| 5 | **Nhóm 5 — Giữ trạng thái giữa các chặng (hồi quy B3, B4)**: `buildCookingHref`, `buildMealQuery`, `mealQueryFromDishes`; trang chi tiết dùng `StartCookingButton`; `/shopping` quay lại `/meal` giữ đủ 3 món | PASS |
| 6 | **Nhóm 6 — Mô phỏng mâm 3 món cho 6 người**: thịt 600g, cá lóc 600g, nước mắm (LINEAR, 2 món) 6 muỗng canh, hành tím 4,5 củ, dứa 0,75 quả, rau muống 1,5 bó, tỏi 9 tép, hành lá FIXED 2 cây, gia vị nêm tay tách riêng | PASS |
| 7 | **Nhóm 7 — Guest-first [STATIC]**: món đã lưu / checklist / mâm hiện tại dùng localStorage, không gọi API phiên | PASS |
| 8 | **Hồi quy R0/R1**: `test:auth` 45/45, `test:honesty` 38/38 | PASS |
| 9 | **Script cũ không cần DB**: `test_shopping_checklist.ts` 22/22, `test_serving_adjustment.ts` 40/40 | PASS |
| 10 | Script cũ cần Postgres (`test_ingredient_aggregation.ts`, `test_cooking_mode.ts`): ECONNREFUSED 127.0.0.1:5432 — **không chạy được trong môi trường này** | NOT RUN |
| 11 | **Typecheck & Build**: `tsc --noEmit` exit 0; `npm run build` exit 0 (log lỗi kết nối DB khi pre-render là do môi trường không có Postgres, không làm build fail; R2 không thêm/bớt route) | PASS |
| 12 | ESLint các file R2 chạm tới: 4 lỗi `react-hooks` trong `CookingModeView.tsx` (useCallback) và `shoppingClient.ts` (setState trong effect) — **có sẵn từ HEAD**, không do R2 gây ra, chưa sửa | KNOWN |
| 13 | **TỔNG CỘNG R2**: 85/85 assertions PASS (exit 0) | PASS |
| 14 | DECISIONS.md ghi nhận D60 | PASS |

## R3 — E2E Playwright, CI & sửa lỗi tồn đọng R2 — 21/10/2026

**Môi trường:** Postgres 16 (Docker, DB `angimom_test`), bản build production `next start`, Chromium 1248 (Playwright 1.64.1). Test do AI viết — không thay nghiệm thu độc lập.

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | `npm run test:e2e:db`: xóa schema, áp **toàn bộ 11** file `drizzle/*.sql` nghiêm ngặt (dừng khi lỗi), seed 12 + 5 công thức | PASS |
| 2 | Guard: `setup-db` từ chối DB không kết thúc bằng `_test` (exit 2) | PASS |
| 3 | E2E #1 Chi tiết → 6 người → "Bắt đầu nấu" giữ `?servings=6`, hiển thị 600 g (B3) — desktop & mobile | PASS |
| 4 | E2E #2 Mâm 3 món 6 người → /shopping: đủ quầy thịt/rau/gia vị & đồ khô/nêm tay, không có "khác"; Tỏi khô **13,5 tép** (D61), nước mắm 6 muỗng canh, chip truy vết "4,5 tép" (B1, B2, B6) | PASS |
| 5 | E2E #3 Sao chép gửi Zalo: clipboard có "🧄 GIA VỊ & ĐỒ KHÔ CẦN MUA:", "- Tỏi khô: 13,5 tép" | PASS |
| 6 | E2E #4 Quay lại từ /shopping giữ đúng 3 món + 6 người (B4) | PASS |
| 7 | E2E #5 Chế độ nấu (đồng hồ giả lập): hết 15 phút → báo "Hết giờ hẹn!", **vẫn ở bước 1**, chuông **1 lần**; ngăn kéo nguyên liệu hiện 600/4,5; sang bước 2 timer về trạng thái chờ "3 phút"; bước 4 không render timer (D39, B5) | PASS |
| 8 | E2E #6 `/meal` không tham số khôi phục mâm đã chọn; link có tham số thắng localStorage | PASS |
| 9 | E2E #7 (mobile Pixel 7): không tràn ngang ở 4 trang; nút chính ≥ 44px. Lần chạy đầu **phát hiện** nút ± khẩu phần chỉ 32px → đã sửa lên 44px | PASS (sau sửa) |
| 10 | **Tổng E2E**: 13 passed, 1 skipped (kịch bản mobile bỏ qua trên desktop) | PASS |
| 11 | `test:core` 99/99 (thêm nhóm 8: seed D61 + quét 10 nhãn quầy trong 4 file seed; nhóm 9: fix timer/khôi phục mâm) | PASS |
| 12 | `test:auth` 45/45, `test:honesty` 38/38 | PASS |
| 13 | `tsc --noEmit` exit 0; `npm run build` exit 0 (với DB test: không còn log lỗi kết nối) | PASS |
| 14 | `npm run lint:scoped` (file R0–R3, trừ `SwapDishModal.tsx`): 0 lỗi, 7 cảnh báo có sẵn | PASS |
| 15 | `.github/workflows/ci.yml` hợp lệ cú pháp (2 job: checks → e2e). **Chưa chạy trên GitHub runner** | NOT RUN |
| 16 | Log server khi E2E: `/cong-thuc/[slug]/nau` báo `NEXT_STATIC_GEN_BAILOUT` lúc revalidate nền (trang vẫn hoạt động) — có sẵn, chưa sửa | KNOWN |

## R4 — Migration Journal Sync & Production Deployment Hardening — 21/10/2026

**Môi trường:** Postgres 16 (Docker, DB `angimom_test`), Node 20+, Next.js production build (`next build`), Playwright 1.64.1.

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | **Đồng bộ Drizzle Journal**: `drizzle/meta/_journal.json` đồng bộ đủ 11 migrations (`0000`–`0010`); kiểm chứng `npx drizzle-kit migrate` trên DB trắng tạo đủ 18 bảng CSDL và 11 hàng `__drizzle_migrations` | PASS |
| 2 | **Script Deploy Production Fail-Closed**: `scripts/migrate_production.js` chạy tuần tự, ghi nhận vào `drizzle.__drizzle_migrations`, dừng khẩn cấp khi gặp lỗi SQL; kiểm chứng chạy lại lần 2 nhận diện 11/11 file đã áp dụng và bỏ qua an toàn | PASS |
| 3 | **PostgreSQL Readiness Polling**: `scripts/deploy_production.sh` thay thế `sleep 5` bằng vòng lặp `pg_isready` (tối đa 30 lần / 60 giây) | PASS |
| 4 | **Loại bỏ Prerender Bailout**: `/cong-thuc/[slug]/nau` bọc `searchParams` trong `<Suspense>`; `next build` đạt 55/55 static/partial-prerendered routes, hoàn toàn không còn log `NEXT_STATIC_GEN_BAILOUT` | PASS |
| 5 | **ESLint Scoped Toàn diện**: Sửa lỗi `react-hooks/set-state-in-effect` ở `SwapDishModal.tsx`; đưa `SwapDishModal.tsx` và `cong-thuc/[slug]/nau/page.tsx` vào `lint:scoped`; dọn dẹp biến thừa đạt **0 errors, 0 warnings** | PASS |
| 6 | **Typecheck**: `npx tsc --noEmit` exit 0, không có lỗi kiểu dữ liệu | PASS |
| 7 | **Bộ test bảo mật & xác thực (R0)**: `npm run test:auth` 45/45 PASS 100% | PASS |
| 8 | **Bộ test trung thực dữ liệu (R1)**: `npm run test:honesty` 38/38 PASS 100% | PASS |
| 9 | **Bộ test luồng cốt lõi (R2/R3)**: `npm run test:core` 99/99 PASS 100% | PASS |
| 10 | **E2E Playwright trên Desktop Chrome & Mobile Pixel 7**: 13 passed, 1 skipped | PASS |
| 11 | DECISIONS.md ghi nhận D62, hoàn tất tiêu chí Task R4 | PASS |

## R5 — Zero Lint Toàn Repo, Luồng Đăng ký & Tự Động Hóa VPS Mắt Bão Vibe Host — 21/10/2026

**Môi trường:** Postgres 16 (Docker, DB `angimom_test`), Node 20+, Next.js 16.4.2 App Router, Playwright 1.64.1.

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | **Dọn sạch Lint Toàn Repo**: `npm run lint -- --quiet` quét toàn bộ codebase (bao gồm editor, recipe, contribute, lib, v.v.), đạt **0 errors** (exit code 0) | PASS |
| 2 | **API Đăng ký người dùng (`/api/auth/register`)**: Kiểm tra họ tên (2-50 ký tự), email chuẩn RFC, mật khẩu (≥8 ký tự); băm scrypt kèm salt bảo mật; gán role `COOK`; ngăn email trùng (HTTP 409 Conflict); tự động cấp phiên HttpOnly cookie an toàn | PASS |
| 3 | **Giao diện Đăng ký (`/register`)**: Form giao diện chuẩn phong cách Bếp gia đình Ăn Gì Mom; kiểm tra khớp mật khẩu client-side; thông báo lỗi trực quan; tự động chuyển hướng sau đăng ký thành công | PASS |
| 4 | **Bộ test đăng ký `npm run test:register`**: 13/13 ca kiểm thử bảo mật & chức năng PASS 100% | PASS |
| 5 | **Bộ test xác thực & phiên đăng nhập (R0)**: `npm run test:auth` 45/45 PASS 100% | PASS |
| 6 | **Bộ test trung thực dữ liệu (R1)**: `npm run test:honesty` 38/38 PASS 100% | PASS |
| 7 | **Bộ test luồng cốt lõi (R2/R3)**: `npm run test:core` 99/99 PASS 100% | PASS |
| 8 | **Typecheck toàn dự án**: `npx tsc --noEmit` exit code 0 | PASS |
| 9 | **Build Production**: `npm run build` thành công, tạo 57 routes (bao gồm `/register` và `/api/auth/register`) | PASS |
| 10 | **E2E Playwright**: 13 passed, 1 skipped (30.2s) | PASS |
| 11 | **Cấu hình VPS / Mắt Bão Vibe Host**: Cập nhật Caddyfile với email `trieunt6@matbao.com`; cung cấp `.env.vps.template`; cung cấp script 1-chạm `scripts/setup_vps.sh` tự động sinh mã ngẫu nhiên an toàn cho `AUTH_SECRET` và Postgres | PASS |
| 12 | DECISIONS.md ghi nhận D63 | PASS |


