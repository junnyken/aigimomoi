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






