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
