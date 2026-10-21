# DECISIONS

Nguồn ưu tiên cao nhất khi có xung đột (master plan §0). Chỉ ghi `approved` khi chủ sản phẩm đã chốt.

## Đã chốt (`approved`) — nguồn: master plan §1.1

| ID | Nội dung | Hệ quả |
|---|---|---|
| D01 | Chưa có code/dự án | Bắt đầu bằng workspace audit và bootstrap |
| D02 | Người dùng chính là người nấu cơm gia đình | Luồng bữa cơm là trung tâm |
| D03 | MVP theo lựa chọn B | Tìm món, công thức, khẩu phần, chế độ nấu, lưu món, thực đơn, đi chợ |
| D04 | Quản trị đăng trước, cộng đồng mở sau | Tái sử dụng editor |
| D05 | Chưa có nội dung | Content pipeline là workstream bắt buộc |
| D06 | AI gợi ý từ kho đã duyệt và hỗ trợ soạn nháp | Hai capability riêng; không tự xuất bản nội dung AI |
| D07 | Đã có hạ tầng/tài khoản muốn tận dụng | Audit trước, không mặc định mua thêm |
| D08 | Tên ĂN GÌ MOM; chưa có logo | Wordmark tạm, chờ duyệt |
| D09 | Kem nhạt + xanh lá, bếp gia đình pha trẻ trung | Sáng, ấm, thoáng, mobile-first |
| D10 | Tiếng Việt ban đầu | Chưa đa ngôn ngữ |
| D11 | Làm một mình cùng Antigravity | Giới hạn công việc song song |
| D12 | Dùng thử khi hoàn thiện | **Diễn giải `proposed`**: = qua release gate P3, chưa chốt |
| D13 | Xin duyệt sau từng MINI-SPEC | Không chạy roadmap tự động |

## Quyết định trong AG-00 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D14 | Dự án dùng repo Git riêng tại `projects/angimom/`, tách khỏi repo cha workspace; chỉ commit cục bộ, không remote/push khi chưa duyệt |
| D15 | Skill dự án đặt tại `.agents/skills/` (theo master plan §14) |
| D16 | Ba file nguồn gốc giữ nguyên ở thư mục gốc; docs/skill dùng bản sao nguyên văn |

## Quyết định trong AG-01 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D17 | **VPS/domain riêng của chủ sản phẩm là nền chính** cho ĂN GÌ MOM. Chi tiết sẽ bổ sung sau (hiện `unknown`). Mắt Bão Cloud IDE là môi trường phát triển |
| D18 | Chủ sản phẩm cho phép tiếp tục các bước không phụ thuộc hạ tầng trong khi chờ thông tin VPS/domain (“cứ xây dựng đi”) |

## Quyết định trong AG-02 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D19 | **Stack ứng dụng**: Next.js App Router (TypeScript) + Tailwind CSS & Radix UI (shadcn) + Lucide Icons + React Hook Form / Zod + PostgreSQL & Drizzle ORM + Vitest & Playwright |
| D20 | **Chiến lược hạ tầng độc lập**: Container hóa toàn bộ qua Dockerfile multi-stage + Docker Compose; Caddy tự động quản lý HTTPS; lưu trữ ảnh và DB qua local volume trên VPS (không vendor lock-in) |
| D21 | **Hợp đồng miền & Invariants**: Khóa cứng các enum cốt lõi (`RecipePublishStatus`, `MealRole`, `ScalePolicy`, `NutritionDataStatus`), nguyên liệu có cấu trúc, RecipeVersion bất biến, làm tròn chỉ ở tầng UI |

## Quyết định trong AG-03 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D22 | **Kế hoạch các đợt nội dung**: Batch 0 (6-8 món kinh điển cơm nhà Việt để thử nghiệm prototype P1); Batch 1 (30 món: 15 mặn, 8 canh, 7 rau/phụ cho phát hành MVP P3); Batch 2 (50+ món mở rộng sau MVP) |
| D23 | **Quy trình thẩm định & minh bạch dữ liệu**: Chủ sản phẩm duyệt cuối; chỉ bật nhãn `COOK_TESTED` / `NUTRITION_VERIFIED` khi có kiểm chứng thực tế; không cào dữ liệu lậu hay dùng AI bịa công thức; dữ liệu thử nghiệm phải gắn cờ `[DEMO_FIXTURE]` |

## Quyết định trong AG-04 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D24 | **Design Tokens & Chuẩn Trợ năng**: Phê duyệt bảng màu kem ấm (`#FAF7F0`), xanh lá bếp (`#3F6240`), cam đất (`#B75B35`) đạt 100% chuẩn WCAG 2.2 Level AA; phông chữ Be Vietnam Pro; bộ icon Lucide; định hình wordmark "ĂN GÌ MOM" và tagline "Bữa cơm nhà, bớt nghĩ hôm nay ăn gì." (O9) |

## Quyết định trong AG-05 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D25 | **Discovery Prototype**: Triển khai bản mẫu tương tác web thuần chuẩn SEO, tích hợp 7 món Batch 0 (`[DEMO_FIXTURE]`), bộ lọc vai trò (`MAIN`, `SOUP`, `SIDE`), tìm kiếm tức thời và thuật toán chọn mâm cơm ngẫu nhiên 3 món cân bằng ("Hôm nay ăn gì?" - O7) không cần AI |

## Quyết định trong AG-06 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D26 | **Recipe & Cooking Prototype**: Triển khai bản mẫu xem chi tiết công thức (`recipe.html`), động hóa co giãn định lượng nguyên liệu theo số người ăn không sai số lũy tiến (Invariants §5.3), và chế độ nấu ăn tập trung (Cooking Mode) kèm timer an toàn không tự nhảy bước và ngăn kéo tra cứu nguyên liệu nhanh |

## Quyết định trong AG-07 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D27 | **Meal State & Shopping Aggregation Pattern**: Phê duyệt cấu trúc mâm cơm 3 món (`prototype/meal.html`) với tính năng đổi món linh hoạt theo vai trò (`MAIN`, `SOUP`, `SIDE`), co giãn khẩu phần toàn mâm và bộ máy tổng hợp nguyên liệu đi chợ (`aggregateIngredients`, `prototype/shopping.html`) tuân thủ tuyệt đối Invariants §5.4: gộp các nguyên liệu tương thích theo cùng đơn vị tính, bảo toàn khả năng truy vết nguồn gốc (traceability) từ từng món, phân tách nhóm gia vị bếp gia đình (`MANUAL_ADJUST`), và quản lý tiến độ chuẩn bị qua checklist lưu trữ `localStorage` |

## Quyết định trong AG-08 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D28 | **Responsive & Usability Standards for Gate P1**: Phê duyệt tiêu chuẩn hiển thị đáp ứng (Responsive Breakpoints: Mobile <640px, Tablet 640-1024px, Desktop >1024px), kích thước vùng chạm cảm ứng (Touch Target $\ge 40-44\text{px}$ chuẩn WCAG 2.2 Criterion 2.5.8), khả năng điều hướng bàn phím với focus ring rõ ràng, cấu trúc ngữ nghĩa HTML đầy đủ (viewport, semantic tags, alt, meta description) và xác nhận thông suốt hành trình người dùng toàn diện trên 4 màn hình prototype để nghiệm thu Gate P1 |

## Quyết định trong AG-09 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D29 | **Next.js Foundation, Tailwind Tokens, Drizzle ORM & Docker Architecture**: Phê duyệt cấu trúc khởi tạo ứng dụng production Next.js 16 (App Router, TypeScript) tích hợp trọn vẹn bộ Design Tokens từ `docs/tokens.css` (Kem ấm `#FAF7F0`, Xanh lá `#3F6240`, Cam đất `#B75B35`), cấu hình Drizzle ORM với PostgreSQL dialect theo các enums Invariants §5.1, §5.2, §5.3, và hạ tầng container hóa độc lập (Dockerfile multi-stage, docker-compose với PostgreSQL 16 + Caddy tự động HTTPS SSL) đảm bảo sẵn sàng triển khai trên VPS cá nhân (D17, D18, D20) |

## Quyết định trong AG-10 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D30 | **Culinary Data Model Drizzle Schema & Initial Migration**: Phê duyệt toàn bộ lược đồ cơ sở dữ liệu PostgreSQL cho nghiệp vụ bữa cơm gia đình (`src/lib/db/schema.ts`, `relations.ts`), bao gồm 6 enums miền, 11 bảng dữ liệu (`users`, `dishes`, `dish_aliases`, `recipes`, `ingredients`, `recipe_ingredients`, `cooking_steps`, `taxonomies`, `recipe_tags`, `meals`, `meal_items`), hệ thống khóa ngoại và chỉ mục (indexes) tối ưu hóa truy vấn tìm kiếm, và tập tin migration SQL đầu tiên (`drizzle/0000_dry_orphan.sql`) đảm bảo tuân thủ 100% Invariants §5 (tách biệt Dish/Recipe, định lượng nguyên liệu có cấu trúc, 3 cờ kiểm chứng độc lập) |

## Quyết định trong AG-11 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D31 | **Identity, Web Crypto Session, RBAC & Middleware Architecture**: Phê duyệt cơ chế định danh và phân quyền Role-Based Access Control (`ADMIN`, `EDITOR`, `COOK`) sử dụng băm mật khẩu chuẩn bảo mật Node.js scrypt (timing-safe verification), cơ chế quản lý phiên đăng nhập không trạng thái (stateless signed tokens qua Web Crypto HMAC-SHA256) lưu trữ trong cookie HttpOnly SameSite=Lax an toàn, API endpoints (`/api/auth/login`, `logout`, `me`), giao diện đăng nhập chuẩn thiết kế Warm Kitchen, và Next.js Middleware kiểm soát nghiêm ngặt các tuyến đường biên tập `/editor/*` và quản trị `/admin/*` |

## Quyết định trong AG-12 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D32 | **Structured Ingredients Dictionary & Taxonomy Tree Architecture**: Phê duyệt hệ thống API CRUD và giao diện quản trị từ điển nguyên liệu chuẩn hóa (`/editor/ingredients`) và phân loại đa trục (`/editor/taxonomies`), bắt buộc chuẩn hóa slug duy nhất, đơn vị tính chuẩn, phân loại nhóm thực phẩm và cờ gia vị bếp thường trực (`isPantryStaple`), kiểm tra ràng buộc toàn vẹn khóa ngoại khi xóa (chặn xóa nguyên liệu đang dùng trong công thức), và nạp sẵn danh mục 29 nguyên liệu cơ sở và 15 taxonomies của Batch 0 |

## Quyết định trong AG-13 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D33 | **Structured Recipe Editor & Invariants Protection**: Triển khai trình biên tập công thức có cấu trúc trực quan (`/editor/recipes/new`, `/editor/recipes/[id]`) và bộ API (`/api/recipes`, `/api/recipes/[id]`) tuân thủ nghiêm ngặt Invariants §5: tách bạch Dish và Recipe, 100% nguyên liệu liên kết từ điển với chính sách co giãn (`scalePolicy`: LINEAR/FIXED/MANUAL_ADJUST), bước nấu phân giai đoạn kèm hẹn giờ an toàn không tự nhảy bước, và cấm sửa đổi trực tiếp (in-place mutation) đối với công thức đã ở trạng thái `PUBLISHED`. |

## Quyết định trong AG-14 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D34 | **Local Persistent Storage & Media Pipeline Architecture**: Quyết định sử dụng kiến trúc lưu trữ tệp cục bộ có gắn kết Docker Volume bền vững (`uploads_data:/app/public/uploads`) trên VPS riêng của chủ sản phẩm (D17, D20), loại bỏ chi phí dịch vụ SaaS đám mây. Bảo vệ an ninh tệp tin qua việc xác thực quyền `EDITOR`/`ADMIN`, giới hạn dung lượng 5MB, lọc nghiêm ngặt MIME type (JPG/PNG/WebP/AVIF), sinh tên tệp UUID chống trùng lặp/ghi đè, và làm sạch tham số thư mục chống Directory Traversal. Thiết kế theo mẫu Adapter để sẵn sàng cắm S3/R2 khi mở rộng quy mô. |

## Quyết định trong AG-15 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D35 | **Publishing Gate & Revision Lineage**: Mỗi phiên bản công thức là một bản ghi `recipes` riêng (`versionNumber`, `revisionOfId`); chỉ `ADMIN` được chuyển `SUBMITTED → PUBLISHED` (sau Gate Check dùng chung server/UI trong `src/lib/recipes/gate.ts`) hoặc `SUBMITTED → NEEDS_CHANGES` (bắt buộc ghi chú góp ý). Bản sửa đổi được nhân bản từ bản `PUBLISHED` (nguyên liệu, bước nấu, tag) với nhãn kiểm chứng reset (D23); tối đa một bản sửa đổi mở trên mỗi công thức. Khi bản sửa đổi được xuất bản, bản cũ chuyển `ARCHIVED` (nội dung bất biến, slug `--vN`) và bản mới tiếp quản slug công khai trong cùng transaction có khóa dòng. `PUT` không còn đặt được `PUBLISHED`; mọi endpoint đổi trạng thái kiểm tra Same-Origin (CSRF). Seed tài khoản dev đọc mật khẩu từ `SEED_ADMIN_PASSWORD` / `SEED_EDITOR_PASSWORD`, không hardcode. |

## Quyết định trong AG-16 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D36 | **Public Recipe Rendering & HTTP Status Boundary**: Route công khai `/cong-thuc/[slug]` (A1) chỉ đọc bản `PUBLISHED` qua allow-list cột (không email, không ghi chú duyệt); dữ liệu cache bằng `use cache` + tag `public-recipes`, invalidate ngay (`expire: 0`) khi duyệt xuất bản. Quyết định 404/308 đặt trong `src/proxy.ts` (Node runtime — thay `middleware.ts` vốn chạy Edge) trước khi stream để trả mã HTTP thật dưới Partial Prefetching; bản không công khai không phân biệt với slug không tồn tại; link phiên bản `ARCHIVED` chuyển vĩnh viễn (308) sang bản hiện hành theo lineage. Build không phụ thuộc DB (placeholder param). |

## Quyết định trong AG-17 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D37 | **Search & Filters Architecture & URL Reflection**: Triển khai trang tìm kiếm tập trung `/mon-an` với bộ lọc đa trục (vai trò món, thời gian nấu, độ khó, nhãn kiểm chứng bếp thực tế, cách chế biến, vùng miền, sắp xếp). Toàn bộ trạng thái tìm kiếm và bộ lọc được đồng bộ trung thực 100% lên URL search parameters (`?q=...&role=...&maxTime=...&difficulty=...&tested=...&sort=...`) phục vụ deep linking và browser history (§6.7). Áp dụng kiến trúc Partial Prerendering (PPR) của Next.js 16: prerender tĩnh Header/Shell và stream nội dung động qua `<Suspense>` xung quanh dữ liệu `searchParams`. Truy vấn dữ liệu an toàn qua Drizzle ORM với parameterized queries chống SQL Injection và chặn 100% các công thức chưa xuất bản (DRAFT/SUBMITTED/ARCHIVED). |

## Quyết định trong AG-18 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D38 | **Serving Adjustment & Client-side Realtime Scaling**: Phê duyệt triển khai bộ điều khiển khẩu phần `ServingSelector` trên trang công thức công khai `/cong-thuc/[slug]`, hỗ trợ tăng giảm từ 1 đến 20 người ăn. Tuân thủ nghiêm ngặt Invariants §5.4 (D21): chỉ co giãn các nguyên liệu có `scalePolicy === 'LINEAR'` theo tỷ lệ $R = \text{target} / \text{base}$; các dòng `FIXED` (hương liệu thảo mộc) và `MANUAL_ADJUST` (gia vị nêm nếm theo khẩu vị) giữ nguyên định lượng gốc. Làm tròn chỉ ở tầng hiển thị UI (tối đa 2 chữ số thập phân), tuyệt đối không lưu đè giá trị làm tròn vào state tính toán. Giữ nguyên vẹn thời gian nấu (không nhân theo $R$). Đồng bộ khẩu phần lên URL parameter `?servings=X` phía client qua `window.history.replaceState` mà không reload trang. |

## Quyết định trong AG-19 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D39 | **Cooking Mode & Kitchen Safety Timer Invariants**: Triển khai giao diện Chế độ nấu tập trung toàn màn hình tại route `/cong-thuc/[slug]/nau`. Tuân thủ nghiêm ngặt Invariants §6.7: bộ hẹn giờ `StepTimer` khi đếm ngược về 0 chỉ phát cảnh báo âm thanh (Web Audio API) và hiệu ứng thị giác, tuyệt đối KHÔNG tự động chuyển bước hay giả định món ăn đã chín; người nấu tự quan sát thực tế và chủ động bấm "Bước tiếp theo". Tích hợp ngăn kéo `QuickIngredientsSheet` mở nhanh bảng nguyên liệu (đã scale theo `?servings=X` từ AG-18) mà không làm mất vị trí bước đang nấu. Hỗ trợ phím tắt bàn phím và thanh tiến độ hoàn thành. |

## Quyết định trong AG-20 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D40 | **Saved Recipes & Guest-first Synchronization**: Triển khai tính năng Lưu món ăn yêu thích (`Saved Recipes`) hỗ trợ trải nghiệm không rào cản cho khách vãng lai (Guest-first, Invariants §6.7). Khách vãng lai lưu/bỏ lưu trực tiếp vào `localStorage` (`angimom_saved_recipes`) mà không bao giờ bị gián đoạn hay ép buộc đăng nhập. Khi đăng nhập vào tài khoản, hệ thống tự động đồng bộ (`/api/saved-recipes/sync`) và gộp an toàn vào bảng `saved_recipes` trong Postgres với Unique Index `(user_id, recipe_id)` và `ON CONFLICT DO NOTHING`. Bảng `saved_recipes` áp dụng `ON DELETE CASCADE`. API truy vấn và trang danh sách `/da-luu` luôn tuân thủ nghiêm ngặt Invariants §5.1: chỉ hiển thị công thức có trạng thái `PUBLISHED`, tự động ẩn các bản `DRAFT`/`ARCHIVED` và loại bỏ toàn bộ dữ liệu nội bộ/nhạy cảm của tác giả. |

## Quyết định trong AG-21 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D41 | **Meal Composition, Slot Replacement & Shared Servings Scaling**: Phê duyệt triển khai trang Mâm cơm gia đình tại `/meal` với cấu trúc chuẩn 3 vai trò: Món Mặn (`MAIN`), Món Canh (`SOUP`), Món Rau/Xào (`SIDE`). Thuật toán đổi món cục bộ (Slot Replacement) cho phép thay thế độc lập từng vị trí mà không làm xáo trộn các vị trí còn lại. Khẩu phần ăn được đồng bộ chung toàn mâm (`servings: 1..20`), tự động co giãn từng món theo đúng Invariants §5.4 (`LINEAR` nhân $R$, `FIXED` và `MANUAL_ADJUST` giữ nguyên định lượng gốc, thời gian nấu không nhân). Thuật toán phân giải mâm cơm `resolveMealSelection()` và modal đổi món tuyệt đối chỉ truy vấn các bản ghi `PUBLISHED` (Invariants §5.1), tự động fallback an toàn nếu slug trên URL là bản nháp/lưu trữ/không tồn tại. Trạng thái mâm cơm được phản ánh trung thực lên URL (`?main=...&soup=...&side=...&servings=...`) và lưu bền vững vào `localStorage` cho khách vãng lai (§6.7). |

## Quyết định trong AG-22 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D42 | **Ingredient Aggregation Engine & Traceability Invariants**: Triển khai Bộ máy Gộp nguyên liệu tự động (`Ingredient Aggregation Engine`) cho mâm cơm nhiều món ăn, tuân thủ nghiêm ngặt Invariants §5.4: (1) Chỉ cộng dồn `totalAmount` khi nguyên liệu có cùng tên và cùng đơn vị tính (`unit`), nếu khác đơn vị đo lường thì bắt buộc tách thành 2 dòng riêng biệt; (2) Truy vết nguồn gốc (Ingredient Traceability): mỗi mục gộp lưu trữ mảng `traces` ghi nhận rõ định lượng phân bổ cho từng món ăn và cách sơ chế; (3) Tách riêng gia vị nêm nếm `MANUAL_ADJUST` vào danh mục `pantrySeasonings` để người dùng kiểm tra nhanh kệ bếp nhà thay vì gộp thô thiển vào danh mục đồ tươi sống cần mua sắm; (4) Phân nhóm trực quan theo quầy chợ (`MEAT_SEAFOOD`, `PRODUCE`, `PANTRY`, `OTHER`) và format tầng hiển thị an toàn bằng dấu phẩy tiếng Việt mà không làm biến dạng giá trị tính toán nội bộ (D21). |

## Quyết định trong AG-23 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D43 | **Shopping Checklist Persistence, Market Categorization & Export Utility**: Phê duyệt triển khai trang danh sách đi chợ chuyên dụng tại `/shopping` với các quy chuẩn: (1) Quản lý trạng thái đánh dấu (check/uncheck) bền vững phía client lưu vào `localStorage` (`angimom_shopping_checked_v1`), không bao giờ bị mất dữ liệu khi đổi tab, tắt app hay gián đoạn mạng ở chợ (Invariants §6.7); (2) Thanh tiến độ đi chợ cập nhật trực quan thời gian thực theo tỷ lệ % hoàn thành; (3) Phân loại quầy chợ khoa học (Thịt/Thủy hải sản, Rau củ quả, Nguyên liệu tươi khác) kèm phần kiểm tra kệ bếp nhà (Pantry Check) cho các gia vị `MANUAL_ADJUST`; (4) Tiện ích sao chép danh sách đi chợ dạng văn bản tiếng Việt chuẩn mực (Zalo/SMS clipboard) để người dùng gửi nhanh cho người nhà đi chợ hộ; (5) Vùng chạm cảm ứng đạt chuẩn WCAG 2.2 Criterion 2.5.8 ($\ge 44\text{px}$) tối ưu thao tác 1 tay trên thiết bị di động. |

## Quyết định trong AG-24 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D44 | **SEO & Index Boundaries, Dynamic Sitemap & Schema.org Recipe JSON-LD**: Phê duyệt thiết lập SEO toàn diện và ranh giới chỉ mục cho dự án Ăn Gì Mom: (1) `robots.txt` (`src/app/robots.ts`) mở cửa cho toàn bộ công cụ tìm kiếm cào dữ liệu các trang công khai (`/`, `/mon-an`, `/cong-thuc/*`, `/meal`, `/da-luu`, `/shopping`), đồng thời chặn triệt để khu vực quản trị/biên tập (`/editor/*`), API nội bộ (`/api/*`), và trang đăng nhập (`/login`); (2) Sitemap động (`src/app/sitemap.ts`) tự động truy vấn cơ sở dữ liệu thời gian thực và tuyệt đối chỉ đưa vào các công thức có trạng thái `PUBLISHED` (tuân thủ nghiêm ngặt Invariants §5.1), loại bỏ 100% bản `DRAFT` và `ARCHIVED`; (3) Dữ liệu có cấu trúc Schema.org Recipe JSON-LD (`RecipeJsonLd.tsx`) chuẩn mực được nhúng vào trang chi tiết công thức (`/cong-thuc/[slug]`), chuẩn hóa thời gian chuẩn ISO 8601 (`PT...`), danh sách nguyên liệu định lượng và các bước hướng dẫn `HowToStep`; (4) Bảo mật chuỗi JSON chống tấn công XSS qua cơ chế sanitize escape ký tự `<` thành `\u003c`. |

## Quyết định trong AG-25 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D45 | **Staging Deploy, Observability & Structured Logger with Secret Redaction**: Phê duyệt tiêu chuẩn triển khai độc lập và giám sát hệ thống cho Ăn Gì Mom: (1) Endpoint giám sát sức khỏe `/api/health` trả về trạng thái liveness/readiness probe, kiểm tra trực tiếp kết nối DB (`SELECT 1`), uptime, version, phản hồi HTTP 200 khi kết nối tốt và HTTP 503 khi mất kết nối; (2) Invariant "Log không lộ secrets": Module `src/lib/logger.ts` tự động làm sạch (redact) các trường nhạy cảm (`password`, `token`, `secret`, `jwt`, `cookie`, `database_url`), che giấu mật khẩu PostgreSQL connection string và Bearer authorization trước khi ghi log ra container/stdout; (3) Tối ưu hóa điều phối container `docker-compose.yml`: Bổ sung healthcheck định kỳ cho service `web` (`/api/health`) và điều kiện `caddy` phụ thuộc `web: condition: service_healthy`, đảm bảo luồng traffic chỉ được chuyển tiếp khi ứng dụng và DB đã hoàn toàn sẵn sàng. |

## Quyết định trong AG-26 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D46 | **Content Batch 1 Approval, Automated Backup-Restore Drill & MVP Pilot Release Gate**: Phê duyệt toàn diện các điều kiện tiên quyết và mở cổng bàn giao MVP Pilot Gate (Gate P3): (1) Phê duyệt bộ dữ liệu Catalog Batch 1 với 12 công thức chuẩn mực (`src/scripts/seed_production_catalog.ts`) bao phủ cả 3 miền và 3 vai trò mâm cơm (`MAIN`, `SOUP`, `SIDE`), 100% đạt trạng thái `PUBLISHED`, đầy đủ định lượng `scalePolicy`, timer, mẹo bếp và đã được xác thực `isCookTested = true`, `isEditorialReviewed = true` (Invariants §5.5); (2) Phê duyệt quy trình sao lưu và phục hồi dữ liệu tự động (`scripts/backup_db.sh`, `scripts/restore_db.sh`) và hoàn thành diễn tập phục hồi thực tế (Restore Drill - Invariants §11.4); (3) Toàn bộ 233/233 test cases liên hoàn (AG-17..AG-26) đạt kết quả PASS 100%, không có lỗi hồi quy; (4) Chính thức công bố hoàn tất Phase P3, hệ thống sẵn sàng bàn giao cho chủ sản phẩm thử nghiệm pilot trên thiết bị di động thực tế. |

## Quyết định trong AG-27 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D47 | **AI Provider Architecture, Token Budget Capping & Graceful Fallback**: Phê duyệt kiến trúc cổng giao tiếp AI (`src/lib/ai/gateway.ts`) và giải quyết dứt điểm câu hỏi mở **O4**: (1) Kiến trúc Provider Adapter đa tầng hỗ trợ Google Gemini (`gemini-1.5-flash`), OpenAI-compatible (`gpt-4o-mini`, DeepSeek, OpenRouter), và `MockHeuristicProvider` tích hợp sẵn; (2) Invariant Server-Only Secrets: Khóa API (`GEMINI_API_KEY`, `OPENAI_API_KEY`) chỉ lưu trong biến môi trường server-side, không cấp tiền tố `NEXT_PUBLIC_`, tự động redact khi in log; (3) Budget Cap & Rate Limiting: Giới hạn token đầu ra $\le 1200$ tokens, timeout $\le 10\text{s}$, rate limit 15 req/phút/IP để kiểm soát chặt chẽ ngân sách vận hành; (4) Graceful Degradation: Khi không có khóa API, hết quota hoặc nghẽn mạng, Gateway tự động chuyển tiếp sang Mock Heuristic Provider dựa trên catalog có sẵn trong database mà không bao giờ gây lỗi 500 hay làm gián đoạn trải nghiệm người dùng; (5) Invariants Gate P4: AI hoàn toàn không có quyền can thiệp vào quy trình biên tập hay tự động publish công thức. |

## Quyết định trong AG-28 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D48 | **Strict Catalog Grounding & AI Meal Assistant with Pantry Ingredients**: Phê duyệt động cơ gợi ý mâm cơm thông minh và tiêu chuẩn Grounding chống ảo giác (Invariants §5.1, §5.3, Gate P4): (1) Động cơ gợi ý `src/lib/ai/mealSuggester.ts` nhận danh sách nguyên liệu tủ lạnh sẵn có và khẩu vị gia đình, tự động tổng hợp prompt kèm bối cảnh danh mục công thức `PUBLISHED` trong database; (2) Grounding Validation Layer: 100% slug món ăn trả về (`mainSlug`, `soupSlug`, `sideSlug`) bắt buộc phải là ID/slug thật tồn tại trong database và có trạng thái `PUBLISHED`. Nếu LLM sinh ra slug bịa đặt (hallucination) hoặc trả về bản nháp, hệ thống tự động phát hiện, từ chối và thay thế bằng công thức phù hợp nhất từ catalog có sẵn; (3) Cấu trúc mâm cơm 3 vai trò: Đảm bảo luôn đầy đủ 1 Món Mặn (`MAIN`), 1 Món Canh (`SOUP`), 1 Món Rau/Xào (`SIDE`); (4) Tích hợp UI trực quan: Bổ sung component `AiMealSuggestionModal` vào trang `/meal` với giao diện chọn nhanh nguyên liệu tủ lạnh, lời giải thích ấm áp (`rationale`) từ AI và nút 1 chạm áp dụng mâm cơm đồng bộ ngay lập tức lên URL và LocalStorage. |

## Quyết định trong AG-29 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D49 | **AI Recipe Authoring Drafts, Schema Sanitization & Provenance Tracking**: Phê duyệt động cơ hỗ trợ biên tập viên tạo nhanh bản thảo công thức và tiêu chuẩn an toàn kiểm soát AI (Invariants §5.1, §5.5, §8.2, Gate P4): (1) Động cơ `src/lib/ai/recipeDraftGenerator.ts` tiếp nhận tên món ăn và phong cách nấu, tự động sinh khung công thức chuẩn cấu trúc JSON gồm thông tin chung, mảng nguyên liệu định lượng và mảng bước nấu theo 3 giai đoạn ('Sơ chế', 'Chế biến', 'Hoàn thành'); (2) Invariant Provenance Tracking: Bổ sung cột `provenance` vào bảng `recipes`, mọi công thức do AI sinh ra bắt buộc đánh dấu `provenance: 'AI_ASSISTED'` để phân biệt với công thức viết tay (`'MANUAL'`); (3) Invariant No Auto-Publish Bypass: Bản nháp AI luôn bị khóa ở trạng thái `status = 'DRAFT'`, tuyệt đối cấm tự động xuất bản hoặc tự động bật cờ kiểm chứng (`isCookTested = false`, `isEditorialReviewed = false`, `isNutritionVerified = false`), bắt buộc phải trải qua quy trình nấu thử và biên tập tại AG-15 trước khi ra mắt công chúng; (4) Tự động liên kết nguyên liệu: Đối chiếu và gán chính xác `ingredientId` từ từ điển `ingredients` trong database; (5) Tích hợp UI trực quan: Bổ sung modal `AiDraftModal` tại `/editor/recipes/new` và danh sách `/editor/recipes` hỗ trợ cả 2 chế độ "Điền vào biểu mẫu" và "Lưu ngay thành bản nháp & Chỉnh sửa". |

## Quyết định trong AG-30 (`drafted / implemented` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D50 | **Master Gate P4 Approval & AI Safety Verification**: Phê duyệt toàn diện các tiêu chí nghiệm thu và mở cổng Gate P4 (AI Có Kiểm Soát / Controlled AI): (1) Đạt tỷ lệ ảo giác (Hallucination Rate) 0.0% trên toàn bộ các kịch bản gợi ý mâm cơm nhờ tầng thẩm định Catalog Grounding nghiêm ngặt (100% slug trả về là ID thật trong catalog `PUBLISHED`); (2) Đạt tỷ lệ tuân thủ schema 100% cho bản thảo công thức có cấu trúc; (3) Bảo toàn 100% Invariants Gate P4: Mọi bản thảo AI luôn bị khóa ở trạng thái `status = 'DRAFT'`, đánh dấu xuất xứ `provenance = 'AI_ASSISTED'`, tuyệt đối không tự động xuất bản hay tự động bật cờ kiểm chứng (`isCookTested = false`, `isEditorialReviewed = false`, `isNutritionVerified = false`); (4) Kỷ luật ngân sách và bảo vệ API keys: Không rò rỉ secret ra client, áp dụng trần 1200 tokens, timeout 10s và rate limit 15 req/phút; (5) Tính trung thực & Fallback tự động: Tự động chuyển tiếp sang Mock Heuristic khi mất mạng hoặc hết quota mà không gây gián đoạn trải nghiệm người dùng; (6) Toàn bộ 181/181 test cases liên hoàn Phase P4 đạt kết quả PASS 100%, chính thức hoàn tất Phase P4 và sẵn sàng bước sang Phase P5. |

## Quyết định trong AG-31 (`implemented` ngày 21/10/2026)

| ID | Nội dung |
|---|---|
| D51 | **Community Contributor Submissions, Structured Editor Reuse & Review Queue**: Phê duyệt cơ chế đóng góp công thức từ cộng đồng và hàng đợi kiểm duyệt (Invariants §5.1, §5.2, §8.1, §8.2, Gate P5): (1) Phân quyền Contributor: Thành viên có tài khoản (`role = 'COOK'`) được phép đóng góp công thức thông qua form có cấu trúc chuẩn tại `/contribute/new` và quản lý danh sách tại `/contribute`; (2) Invariant Không Tự Xuất Bản: Bài đóng góp chỉ có 2 trạng thái `DRAFT` (lưu nháp cá nhân) hoặc `SUBMITTED` (chuyển vào hàng đợi kiểm duyệt của Ban biên tập), tuyệt đối cấm gán `status = 'PUBLISHED'` hoặc tự gán cờ kiểm định (`isEditorialReviewed = false`, `isCookTested = false`); (3) Invariant Provenance & Attribution: Bắt buộc đánh dấu `provenance = 'COMMUNITY_SUBMITTED'`, gắn chặt `authorId = user.id`; (4) Bảo vệ quyền sở hữu & Khóa sửa đổi (Ownership Guard): Tác giả chỉ được sửa/xóa bài của mình khi ở trạng thái `DRAFT` hoặc khi được Ban biên tập yêu cầu sửa (`NEEDS_CHANGES`). Khi đang `SUBMITTED`, bài viết bị khóa sửa đổi để bảo toàn tính trung thực trong quá trình kiểm duyệt; (5) Tích hợp AI Pre-fill: Cho phép Contributor tận dụng AI Draft Modal để sinh khung ý tưởng công thức gia đình một cách nhanh chóng. |

## Quyết định trong AG-32 (`implemented` ngày 21/10/2026)

| ID | Nội dung |
|---|---|
| D52 | **Content Moderation, Abuse Reports & Takedown Flow**: Phê duyệt cơ chế báo cáo vi phạm nội dung và hàng đợi kiểm duyệt an toàn (Invariants §5.1, §5.2, §8.1, §8.2, Gate P5): (1) Báo cáo vi phạm mở: Cho phép mọi độc giả (kể cả khách vãng lai) gửi phản ánh công thức có vấn đề tại `/cong-thuc/[slug]` mà không bị ép buộc đăng nhập, tự động lưu `reporterId` khi có session; (2) Phân quyền hàng đợi: Endpoint `/api/editor/reports` và giao diện `/editor/reports` được bảo vệ nghiêm ngặt, chỉ cho phép `EDITOR` và `ADMIN` truy cập (chặn HTTP 403 đối với `COOK`); (3) Cơ chế Takedown & Audit Trail: Biên tập viên có quyền gỡ bài vi phạm (chuyển ngay về `NEEDS_CHANGES`, lưu lý do vào `reviewNotes`), đồng thời bài viết lập tức bị ẩn 100% khỏi danh mục công khai (`queryPublishedRecipeBySlug` trả về `null`), ghi nhận đầy đủ `resolvedById` và `resolvedAt`; (4) Luồng nộp lại: Tác giả xem góp ý chi tiết trong Bếp Nhà, chỉnh sửa và nộp lại vào hàng đợi `SUBMITTED`. |

## Quyết định trong AG-33 (`implemented` ngày 21/10/2026)

| ID | Nội dung |
|---|---|
| D53 | **Regional Dish Variants, Kitchen Stories & Source Attribution**: Phê duyệt cấu trúc biến thể vùng miền và câu chuyện bếp nhà (Invariants §5.1, §5.2, §8.1, Gate P5): (1) Cấu trúc văn hóa món ăn: Bổ sung 4 trường dữ liệu vào `recipes`: `region` ('NORTH', 'CENTRAL', 'SOUTH', 'GENERAL'), `kitchenStory` (văn bản chia sẻ kỷ niệm, bối cảnh sum vầy gia đình), `sourceAttribution` (trích dẫn cội nguồn, mẹo gia truyền) và `variantOfId` (liên kết món ăn gốc); (2) Invariants Bảo vệ Catalog (§5.1): Danh sách biến thể gợi ý `variants` tại trang chi tiết món ăn CHỈ hiển thị các biến thể ở trạng thái `PUBLISHED`. Bản nháp `DRAFT` hoặc `NEEDS_CHANGES` của tác giả khác tuyệt đối không được xuất hiện; (3) Liên kết hai chiều: Truy vấn món gốc trả về danh sách các biến thể vùng miền; truy vấn bất kỳ biến thể nào cũng nhận diện và liên kết ngược về món gốc và các biến thể anh em; (4) Trải nghiệm giao diện: Tích hợp `KitchenStorySection` với thiết kế ấm áp, trang trọng và `RegionalVariants` cho phép chuyển đổi mượt mà giữa các biến thể ẩm thực Bắc - Trung - Nam; (5) Form đóng góp: Cho phép thành viên cộng đồng bổ sung câu chuyện và trích dẫn nguồn gốc khi đóng góp công thức mới. |

## Quyết định trong AG-34 (`implemented` ngày 21/10/2026)

| ID | Nội dung |
|---|---|
| D54 | **Cooked-it Feedback & Photos**: Phê duyệt cơ chế phản hồi nấu thử, ảnh đĩa cơm gia đình và nghiệm thu Gate P5 (Invariants §5.1, §5.2, Gate P5): (1) Đĩa cơm cộng đồng: Cho phép độc giả chia sẻ trải nghiệm nấu thực tế, đánh giá sao (1-5 sao), mẹo nêm nếm gia vị và ảnh chụp đĩa thức ăn thành phẩm tại `/cong-thuc/[slug]`; (2) Invariants Chống Spam & Giữ Gìn Văn Hóa (Gate P5): Mọi phản hồi có ảnh hoặc từ khách vãng lai bắt buộc chuyển sang trạng thái `PENDING` và chờ Ban biên tập phê duyệt trước khi hiển thị công khai; thành viên đăng nhập gửi phản hồi text thuần sạch được duyệt tự động; (3) Ngăn chặn trùng lặp: Áp dụng cơ chế Upsert (chỉ duy trì 1 phản hồi / user / recipe, cho phép cập nhật khi nấu lại nhiều lần); (4) Quản trị nội dung: Cung cấp hàng đợi `/editor/feedbacks` và API `/api/editor/feedbacks/[id]` để Ban biên tập duyệt nhanh 1-click; (5) Nghiệm thu toàn diện Gate P5: Hoàn tất 100% 4 capability của Phase P5 (AG-31, AG-32, AG-33, AG-34). |

## Quyết định trong AG-35 & AG-36 (`implemented` ngày 21/10/2026)

| ID | Nội dung |
|---|---|
| D55 | **Nutrition Engine & Vietnamese Standard Calculator**: Phê duyệt hệ thống tính toán dinh dưỡng dữ liệu chuẩn Việt Nam (Invariants §5.5, Gate P6): (1) Nguồn dữ liệu kiểm định: Thiết lập bảng `ingredient_nutrition` đối chiếu theo Bảng thành phần thực phẩm Việt Nam (Viện Dinh Dưỡng Quốc Gia - Bộ Y Tế, `VIETNAM_FCT_2007`), có tính đến tỷ lệ phần ăn được (`edibleRate`); (2) Invariant Tối thượng Gate P6: Dữ liệu thiếu không được ép thành 0 (`Missing is NOT zero`), bảo toàn giá trị `null` và hiển thị cảnh báo minh bạch; (3) Bộ chuyển đổi đơn vị dân gian: Hỗ trợ quy đổi `gam`, `kg`, `lạng` (100g), `thìa canh` (15g), `thìa cà phê` (5g), `bát con`, `quả/củ` sang khối lượng thực phẩm ăn được; (4) Snapshot bất biến: Tính toán chi tiết Kcal, Đạm, Béo, Đường bột, Natri và Chất xơ trên 1 khẩu phần (`perServing`), toàn nồi (`totalBatch`) và 100g thành phẩm, lưu trữ dưới dạng snapshot `nutritionSnapshot` trong `recipes` để chống hồi tố khi sửa từ điển sau này; (5) Tỷ lệ bao phủ & Bật nhãn kiểm định: Chỉ bật `isNutritionVerified = true` khi độ bao phủ dinh dưỡng đạt từ 80% trở lên; (6) Giao diện: Hiển thị Bảng Dinh Dưỡng Chuẩn Việt Nam minh bạch trên trang món ăn `/cong-thuc/[slug]`. |

## Quyết định trong AG-37 & AG-38 (`implemented` ngày 21/10/2026)

| ID | Nội dung |
|---|---|
| D56 | **Family Meal Diary, Consumed Portions & Daily Summaries**: Phê duyệt hệ thống nhật ký bữa ăn gia đình và nghiệm thu Gate P6 (Invariants §5.5, Gate P6): (1) Lượng ăn thực tế: Cho phép ghi nhận khẩu phần ăn riêng biệt của từng thành viên gia đình (`0.5`, `1.0`, `1.5`, `2.0` phần cho `Bố`, `Mẹ`, `Bé Bo`), tách biệt lượng thực tế tiêu thụ với định lượng nấu của công thức; (2) Snapshot bất biến chống hồi tố: Dữ liệu Kcal và Macro được chụp snapshot cố định vào bản ghi nhật ký `meal_diary_entries`, không bị thay đổi nếu sau này công thức gốc được chỉnh sửa; (3) Tổng hợp ngày & Cảnh báo Vi chất: Tính toán tổng Calo, tỷ lệ phân bổ P/F/C % theo ngày, đối chiếu chuẩn RDA Viện Dinh Dưỡng và tự động hiển thị cảnh báo sức khỏe nếu lượng Natri vượt ngưỡng 2000mg/ngày; (4) Quyền riêng tư gia đình: Dữ liệu nhật ký được cô lập hoàn toàn giữa các tài khoản người dùng; (5) Quyền xuất dữ liệu và được lãng quên: Cung cấp API tải file JSON toàn bộ lịch sử ăn uống (`/api/diary/export`) và API xóa nhật ký (`/api/diary/clear`); (6) Nghiệm thu toàn diện Gate P6: Hoàn tất 100% 4 capability của Phase P6 (AG-35, AG-36, AG-37, AG-38). |

## Quyết định trong AG-39, AG-40 & AG-41 (`implemented` ngày 21/10/2026)

| ID | Nội dung |
|---|---|
| D57 | **Expanded Catalog, Pantry Inventory & Weekly Meal Planner**: Phê duyệt mở rộng danh mục món ăn, kho thực phẩm gia đình và lập kế hoạch thực đơn tuần, nghiệm thu Gate P7: (1) Mở rộng thể loại món ăn: Giữ vững tính nhất quán của `meal_role`, nạp các món nước trọn bữa `ONE_DISH_MEAL` (Phở bò Hà Nội, Bún bò Huế), món chay chuẩn nhãn `an-chay-thuan` (Đậu hũ sốt cà chua chay), đồ uống `BEVERAGE` (Nước sâm bí đao) và tráng miệng `DESSERT` (Chè bưởi An Giang); (2) Kho thực phẩm & Tủ lạnh gia đình (Pantry): Tạo bảng `pantry_items`, phân loại 3 ngăn (`FRIDGE`, `FREEZER`, `DRY_PANTRY`), tự động cảnh báo thực phẩm sắp hết hạn trong 3 ngày, hỗ trợ chuyển 1-chạm từ Giỏ hàng sang Tủ lạnh (`/api/pantry/sync-from-shopping`); (3) Đối chiếu tủ lạnh thông minh: Component `PantryCheckWidget` tự động kiểm tra nguyên liệu món ăn với đồ sẵn có trong nhà, giúp người nội trợ biết ngay món có thể nấu mà không cần mua thêm; (4) Lập kế hoạch bữa cơm tuần (Weekly Meal Planner): Bảng lịch 7 ngày cho phép lên thực đơn bữa sáng/trưa/tối, tổng hợp nguyên liệu cả tuần sang Giỏ đi chợ (hỗ trợ cờ `excludePantry: true`), và 1-chạm hoàn thành để ghi vào Nhật ký dinh dưỡng; (5) Quyền riêng tư tuyệt đối: Cô lập dữ liệu kho và kế hoạch giữa các gia đình (HTTP 404); (6) Nghiệm thu toàn diện Gate P7: 36/36 test cases tự động đạt PASS 100%. |

## Quyết định trong R0 (`implemented` ngày 21/10/2026)

| ID | Nội dung |
|---|---|
| D58 | **Authentication Configuration Contract, Lazy Secret Provider & Fail-Closed Hardening**: Phê duyệt tiêu chuẩn bảo mật cấu hình xác thực cho Ăn Gì Mom (R0): (1) Chuẩn hóa contract tên biến: Thống nhất sử dụng duy nhất `AUTH_SECRET` cho toàn bộ mã nguồn, compose files, tệp ví dụ và hướng dẫn triển khai; loại bỏ hoàn toàn việc dùng `JWT_SECRET`; (2) Triệt tiêu Fallback Secret: Xóa bỏ 100% các chuỗi khóa bí mật mặc định viết cứng trong runtime (`src/lib/auth/session.ts`) và trong Docker Compose (`docker-compose.prod.yml`, `docker-compose.yml`); (3) Lazy Runtime Provider & Blacklist Guard: Hàm `getAuthSecret()` thực hiện kiểm tra động khi có thao tác xác thực, từ chối secret rỗng, secret có khoảng trắng đầu/cuối, secret ngắn hơn 32 ký tự, hoặc trùng với danh sách đen placeholder đã biết; (4) Fail-Closed & Readiness Probe: Khi cấu hình secret thiếu/sai, runtime từ chối ký và xác thực phiên, đồng thời `/api/health` trả về HTTP 503 (`status: "unhealthy", auth: "unconfigured"`) để ngăn proxy tiếp nhận traffic; (5) Docker Fail-Fast: Cấu hình compose production sử dụng cú pháp `${VAR:?error}` dừng ngay khi thiếu biến môi trường bắt buộc; script `deploy_production.sh` dừng ngay nếu thiếu `.env.production`. |

## Quyết định trong R1 (`implemented` ngày 21/10/2026)

| ID | Nội dung |
|---|---|
| D59 | **Data Honesty, Illustration Badges & Verification Degradation**: Phê duyệt tiêu chuẩn trung thực dữ liệu và minh bạch hình ảnh cho danh mục công thức (R1, Invariants D23): (1) Khôi phục tính trung thực hạt giống (Zero Fake Certification): Đặt `isCookTested = false` cho toàn bộ 17 món ăn trong `seed_production_catalog.ts` và `seed_p7_catalog.ts`, chỉ giữ `isEditorialReviewed = true` cho các công thức đã qua chuẩn hóa văn bản; cấm tự tiện bật cờ đã nấu thử khi chưa có người nấu thật và biên bản xác nhận của chủ sản phẩm; (2) Minh bạch hình ảnh kho ngoài (Illustration Attribution): Tạo helper `isIllustrationImage()` phân loại tự động ảnh stock/Unsplash vs ảnh chụp nội bộ; hiển thị nhãn `Ảnh minh họa` trên toàn bộ thẻ món (`RecipeCard`, `MealSlotCard`, `SwapDishModal`) và trang chi tiết `/cong-thuc/[slug]` kèm chú thích chân thực; (3) Degrade trung thực nhãn kiểm chứng (`VerificationBadges`): Ẩn hoàn toàn huy hiệu "Đã nấu thử" khi `isCookTested = false`; hiển thị trạng thái trung thực `Chờ kiểm nghiệm bếp mẫu` trên trang chi tiết món ăn; (4) Bộ lọc tìm kiếm trung thực: `/mon-an?tested=true` chỉ trả về công thức có kiểm chứng thật (`eq(recipes.isCookTested, true)`), hiển thị Empty State giải thích rõ ràng khi chưa có món nào đạt chuẩn; (5) Bộ test tự động `npm run test:honesty`: Đạt 38/38 ca kiểm thử PASS 100%. |
| D60 | **Core MVP Verification & Real Cooking Flows (R2)**: Kiểm chứng luồng cốt lõi Tìm món → Đổi khẩu phần → Ghép mâm → Đi chợ → Nấu từng bước bằng dữ liệu bám sát seed thật (nhãn quầy tiếng Việt). Audit phát hiện và sửa 5 lỗi thật (phạm vi vượt "chỉ kiểm chứng", ghi minh bạch): **B1** engine gộp đi chợ chỉ hiểu mã `MEAT_SEAFOOD/PRODUCE/PANTRY` trong khi DB/seed lưu nhãn tiếng Việt → mọi nguyên liệu thật rơi vào "Nguyên liệu khác"; thêm `normalizeMarketCategory()` (NFC, không phân biệt hoa thường, chấp nhận cả mã cũ) — không đổi schema/dữ liệu; **B2** quầy `pantry` (gia vị & đồ khô cần mua theo định lượng) bị bỏ sót khỏi `/shopping` và văn bản gửi Zalo → bổ sung mục hiển thị; **B3** nút "Bắt đầu nấu" ở trang chi tiết làm mất `?servings` → `StartCookingButton` đọc khẩu phần hiện tại; **B4** link quay lại từ `/shopping` làm mất mâm đã chọn → helper thuần `src/lib/meal/flowUrls.ts` (`buildMealQuery`, `mealQueryFromDishes`, `buildCookingHref`); **B5** Chế độ nấu render ký tự "0" khi `timerSeconds = 0` → điều kiện `(timerSeconds ?? 0) > 0`. Giữ nguyên invariants: LINEAR×R, FIXED/MANUAL_ADJUST giữ gốc, kẹp 1–20, làm tròn chỉ ở tầng hiển thị (D21), timer không tự chuyển bước (D39), Guest-first (D40). Bộ test thuần không cần DB `npm run test:core` (85 assertions, có đánh dấu [STATIC] cho kiểm tra tĩnh). Giới hạn: chưa chạy E2E trình duyệt/Playwright, chưa chạy với Postgres thật, chưa kiểm thử trực tiếp trên điện thoại; test do AI viết, không phải nghiệm thu độc lập. |
| D61 | **Quyết định biên tập định lượng + E2E/CI (R3)**: (1) **Nước mắm** theo chủ sản phẩm (21/10/2026): tăng theo số người (`LINEAR`) ở *Thịt ba chỉ kho tiêu* và *Canh chua cá lóc*; giữ nguyên, nêm theo khẩu vị (`MANUAL_ADJUST`) ở *Canh rau ngót* — giữ đúng dữ liệu hiện có, khóa bằng test. (2) **Tỏi trong thịt kho**: kịch bản nhắc tỏi băm thì seed phải có → thêm `Tỏi khô` 3 tép `LINEAR` "băm nhỏ" (cùng slug `toi-kho`/đơn vị `tép` với rau muống xào tỏi để gộp khi đi chợ: mâm 6 người = 13,5 tép), bước 1 ghi "hành tím và tỏi băm". (3) Đóng phần còn sót của B1: 6 nhãn quầy trong seed (`Gia vị cơ bản`, `Gia vị & Hương liệu`, `Gia vị & Bột`, `Bún miến mì khô`, `Rau củ tươi`, `Rau thơm gia vị`) được map; test quét mọi nhãn seed. (4) Sửa: khôi phục mâm từ localStorage khi `/meal` không tham số (URL luôn ưu tiên); chuông hẹn giờ kêu đúng 1 lần (bỏ side effect khỏi updater, đếm theo mốc kết thúc); B6 chip truy vết đi chợ định dạng vi-VN; vùng chạm ≥ 44px cho nút khẩu phần/hẹn giờ/xem nguyên liệu/đi chợ. (5) **Playwright E2E** (`@playwright/test` 1.64.1, ghim) chạy trên `next start` + Postgres test (guard tên DB `_test`, migrate nghiêm ngặt toàn bộ `drizzle/*.sql`, seed thật), 2 viewport desktop/Pixel 7. (6) **CI GitHub Actions** `.github/workflows/ci.yml`: job checks (lint phạm vi R0–R3, tsc, test:auth/honesty/core, build) → job e2e (Postgres service tạm, `AUTH_SECRET` sinh ngẫu nhiên mỗi lần chạy). Lint toàn repo vẫn còn lỗi có sẵn — xử lý ở task riêng. |
| D62 | **Drizzle Migration Journal Sync & Deployment Hardening (R4)**: (1) **Đồng bộ Migration Journal**: Cập nhật `drizzle/meta/_journal.json` từ 3 mục lên toàn bộ 11 mục (`0000` đến `0010`), giúp lệnh chuẩn `npx drizzle-kit migrate` áp dụng đầy đủ 18 bảng CSDL; đã kiểm chứng thành công trên DB test hoàn toàn sạch. (2) **Triển khai Fail-Closed**: Viết `scripts/migrate_production.js` và nâng cấp `scripts/deploy_production.sh`, xóa bỏ triệt để `2>/dev/null || true`; dùng `pg_isready` có retry và thực thi tuần tự có ghi nhận vào `drizzle.__drizzle_migrations`, dừng ngay khi có lỗi SQL. (3) **Triệt tiêu cảnh báo Prerender**: Khắc phục `NEXT_STATIC_GEN_BAILOUT` tại `/cong-thuc/[slug]/nau` bằng Suspense boundary cho `searchParams`. (4) **Chuẩn hóa Lint**: Sửa lỗi `react-hooks/set-state-in-effect` ở `SwapDishModal.tsx`, đưa cả modal và trang nấu vào `lint:scoped`, đạt 0 errors, 0 warnings. |
| D63 | **User Registration, Full-Repo Lint Zero Errors & VPS / Mắt Bão Vibe Host Automation**: (1) **Trang & API Đăng ký tài khoản (`/register`, `/api/auth/register`)**: Cung cấp giao diện đăng ký chuẩn nhận diện thương hiệu Ăn Gì Mom; kiểm tra validation họ tên, email chuẩn RFC, mật khẩu tối thiểu 8 ký tự; băm mật khẩu bằng scrypt kèm salt bảo mật (`hashPassword`); ngăn chặn email trùng lặp (HTTP 409 Conflict); tạo tài khoản với vai trò `COOK`; tự động tạo phiên đăng nhập và gắn HttpOnly cookie ngay sau khi đăng ký thành công; fail-closed khi `AUTH_SECRET` chưa được cấu hình. (2) **Bộ test đăng ký `npm run test:register`**: 13/13 ca kiểm thử bảo mật và chức năng tự động đạt PASS 100%. (3) **Dọn sạch Lint toàn repo**: Nâng cấp `eslint.config.mjs` và khắc phục dứt điểm các lỗi unescaped entities, mutative rendering trong loop, and effect setState; `npm run lint` đạt 0 errors toàn repo. (4) **Cấu hình & Tự động hóa Triển khai VPS / Mắt Bão Vibe Host**: Cập nhật Caddyfile với email ACME `trieunt6@matbao.com`; cung cấp `.env.vps.template` cấu hình mẫu an toàn; tạo script 1-chạm `scripts/setup_vps.sh` tự động sinh mã hóa ngẫu nhiên an toàn cho `AUTH_SECRET` và mật khẩu DB, khởi tạo cấu trúc thư mục lưu trữ và hướng dẫn vận hành production. |
| D64 | **Password Reset (Quên/Đặt lại mật khẩu), Native Mắt Bão SMTP & Trang Quản Lý Hồ Sơ Cá Nhân (`/profile`)**: (1) **Quên & Đặt lại mật khẩu an toàn (`/forgot-password`, `/reset-password`)**: Token HMAC-SHA256 có hạn 15 phút, chứa phân đoạn hash mật khẩu hiện tại (`hashFrag`) đảm bảo tính chất Single-Use (vô hiệu hóa tức thì khi đổi mật khẩu); Anti-Enumeration bảo vệ quyền riêng tư người dùng; kiểm tra mật khẩu tối thiểu 8 ký tự và băm scrypt bảo mật. (2) **Dịch vụ gửi thư điện tử thuần Native Node.js SMTP ([mailer.ts](file:///home/coder/workspace/projects/angimom/src/lib/email/mailer.ts))**: Không thêm dependencies rác; tự động kết nối SMTP Mắt Bão (`trieunt6@matbao.com`) qua TLS socket và có cơ chế mock an toàn trong môi trường dev/staging; hỗ trợ template email tiếng Việt chuẩn responsive. (3) **Trang Hồ sơ cá nhân (`/profile`) & APIs (`/api/user/profile`, `/api/user/change-password`)**: Hiển thị thông tin người dùng, đổi tên hiển thị `displayName`, đổi mật khẩu an toàn (xác thực `currentPassword` bằng `timingSafeEqual`), đăng xuất; chặn truy cập chưa xác thực (HTTP 401). (4) **Bộ test tự động `npm run test:profile`**: 13/13 ca kiểm thử bảo mật & chức năng đạt PASS 100%. |
| D65 | **R7 — Chợ công thức giai đoạn 1 (miễn phí, chưa có tiền)**: Chủ sản phẩm chốt phí nền tảng 15% (áp dụng khi có thanh toán), giá món lẻ 10.000–200.000đ / bộ 30.000–1.000.000đ, hoàn tiền 7 ngày, người chưa mua **không** thấy tên nguyên liệu; giai đoạn hiện tại mọi công thức miễn phí để thu hút người dùng; thanh toán (R9–R10) chờ pháp nhân. Đã làm: (1) Nhãn nguồn Bếp Mom / Chợ công thức suy ra từ `recipes.provenance` (không thêm cột). (2) Món Chợ không bao giờ mang "Đã nấu thử": chặn ở gate xuất bản, CHECK constraint `recipes_community_not_cook_tested` và lớp map hiển thị. (3) Bảng `creator_profiles` + trang `/nguoi-nau/[slug]` + khu hồ sơ trên `/profile` + `GET/PUT /api/creator/profile` (same-origin, allow-list, slug hệ thống bị chặn, 409 khi trùng). (4) Bậc uy tín 0/1/2 tính động; bậc 2 cần ≥3 món, ≥10 người đánh giá khác tác giả, điểm ≥4, xác minh danh tính thủ công bởi ADMIN (`PATCH /api/editor/creators/[userId]`, không lưu CCCD) và đồng ý điều khoản. (5) Đánh giá "Tôi đã nấu": chặn tự đánh giá (403), unique index (recipe_id, user_id), link ảnh bắt buộc https. (6) Bộ lọc `?nguon=` trên `/mon-an`; gợi ý ngẫu nhiên và mâm mặc định chỉ dùng món Bếp Mom. (7) `npm run test:creator` + E2E `creator-marketplace.spec.ts`. Migration `0011_r7_creator_marketplace.sql`. |

## Còn mở (`unknown`)

| # | Vấn đề | Quyết định tại |
|---|---|---|
| O1 | Chi tiết VPS/domain riêng: nhà cung cấp, cấu hình, dịch vụ đang chạy, DB/storage/email, backup | Chủ sản phẩm bổ sung khi deploy thực tế |
| O2 | Tận dụng Coolify/`mb-deploy` trên Mắt Bão làm môi trường preview/staging nội bộ trong quá trình dev | Đã chốt hướng tích hợp qua Docker container (D20) |
| O3 | Ngân sách vận hành/tháng | Tối thiểu hóa bằng giải pháp tự host trên VPS (D20), không phí subscription ban đầu |
| O4 | Nhà cung cấp AI/model và budget | Đã chốt theo D47 (Gemini Flash + OpenAI-compatible + Heuristic Mock fallback, trần 1200 tokens) |
| O5 | Người kiểm/nấu thử công thức | Chủ sản phẩm chịu trách nhiệm tổ chức/phê duyệt; Antigravity hỗ trợ chuẩn hóa cấu trúc (D23) |
| O6 | Nghĩa của “ăn theo thì” | P7 |
| O7 | Nút chọn món không cần AI trong discovery | Đã chốt theo D25 (Thuật toán cân bằng 3 món client-side) |
| O8 | Xác nhận diễn giải D12 | Duyệt phạm vi MVP |
| O9 | Tagline “Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.” và wordmark tạm | Đã chốt theo D24 (Approved) |
| O10 | Số lượng công thức Batch 0/1/2 | Đã chốt theo D22 (Batch 0: 6-8 món, Batch 1: 30 món) |
