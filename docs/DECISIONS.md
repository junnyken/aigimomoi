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

## Còn mở (`unknown`)

| # | Vấn đề | Quyết định tại |
|---|---|---|
| O1 | Chi tiết VPS/domain riêng: nhà cung cấp, cấu hình, dịch vụ đang chạy, DB/storage/email, backup | Chủ sản phẩm bổ sung khi deploy thực tế |
| O2 | Tận dụng Coolify/`mb-deploy` trên Mắt Bão làm môi trường preview/staging nội bộ trong quá trình dev | Đã chốt hướng tích hợp qua Docker container (D20) |
| O3 | Ngân sách vận hành/tháng | Tối thiểu hóa bằng giải pháp tự host trên VPS (D20), không phí subscription ban đầu |
| O4 | Nhà cung cấp AI/model và budget | Trước P4 |
| O5 | Người kiểm/nấu thử công thức | Chủ sản phẩm chịu trách nhiệm tổ chức/phê duyệt; Antigravity hỗ trợ chuẩn hóa cấu trúc (D23) |
| O6 | Nghĩa của “ăn theo thì” | P7 |
| O7 | Nút chọn món không cần AI trong discovery | Đã chốt theo D25 (Thuật toán cân bằng 3 món client-side) |
| O8 | Xác nhận diễn giải D12 | Duyệt phạm vi MVP |
| O9 | Tagline “Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.” và wordmark tạm | Đã chốt theo D24 (Approved) |
| O10 | Số lượng công thức Batch 0/1/2 | Đã chốt theo D22 (Batch 0: 6-8 món, Batch 1: 30 món) |
