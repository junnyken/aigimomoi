# AG-12 Report — Ingredient & Taxonomy CRUD

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã hoàn thành xây dựng và kiểm thử toàn diện **Hệ thống API CRUD và Giao diện quản trị Từ điển nguyên liệu chuẩn hóa & Phân loại đa trục (Taxonomies)** phục vụ trực tiếp cho Trình biên tập công thức có cấu trúc (AG-13):
- **API Quản lý Nguyên liệu (`/api/ingredients`)**: Hỗ trợ tìm kiếm theo từ khóa, lọc theo nhóm thực phẩm (Thịt, Thủy hải sản, Rau củ quả, Gia vị nêm nếm, Đồ khô), lọc theo cờ gia vị bếp có sẵn (`isPantryStaple`). Thao tác tạo/sửa/xóa được bảo vệ nghiêm ngặt bằng quyền `EDITOR` hoặc `ADMIN`.
- **Ràng buộc an toàn khóa ngoại**: API `DELETE /api/ingredients/[id]` tự động kiểm tra bảng `recipe_ingredients`, chặn xóa nguyên liệu nếu đang được sử dụng trong các công thức nấu ăn nhằm bảo vệ tính toàn vẹn dữ liệu.
- **API Quản lý Phân loại (`/api/taxonomies`)**: Quản lý 4 nhóm thẻ phân loại đa trục (`CUISINE_REGION`, `COOKING_METHOD`, `DIET_PREFERENCE`, `OCCASION`), tự động sinh slug duy nhất, kiểm tra ràng buộc trước khi xóa.
- **Seeder Danh mục Kinh điển (Batch 0)**: Nạp sẵn 29 nguyên liệu tiêu chuẩn và 15 thẻ phân loại đặc trưng của 7 món kinh điển Batch 0.
- **Giao diện Biên tập viên (`/editor/ingredients` & `/editor/taxonomies`)**: Bảng quản lý trực quan, tìm kiếm tức thời, modal tạo mới, responsive trên cả mobile và desktop, tuân thủ 100% Design Tokens Warm Kitchen.

## 2. Audit Before Build
- Xem chi tiết tại [mini-specs/AG-12.md](../mini-specs/AG-12.md).
- Trước AG-12, bảng `ingredients` và `taxonomies` đã có schema nhưng chưa có API quản trị và chưa có giao diện biên tập viên. AG-12 đã cung cấp đầy đủ công cụ để người biên tập chuẩn hóa từ điển nguyên liệu trước khi viết công thức tại AG-13.

## 3. Design Choice
- **Invariants §5.3 & §5.4 (Nguyên liệu có cấu trúc)**: Không cho phép nhập nguyên liệu dạng chuỗi văn bản tự do trong công thức; mọi nguyên liệu đều phải liên kết đến ID của từ điển `ingredients` để đảm bảo bộ máy co giãn khẩu phần và gộp nguyên liệu đi chợ hoạt động chuẩn xác 100%.
- **Phân tách cờ `isPantryStaple`**: Đánh dấu rõ các gia vị gia đình thường có sẵn (muối, tiêu, mắm, đường, dầu ăn, tỏi, hành tím) để khi người dùng xem danh sách đi chợ, hệ thống tự động xếp vào nhóm "Gia vị có sẵn trong bếp", tránh nhắc đi mua lặp lại không cần thiết.
- **Phân quyền Route Guarding**: Chỉ tài khoản có vai trò `EDITOR` hoặc `ADMIN` đã đăng nhập (qua session cookie từ AG-11) mới có quyền chỉnh sửa từ điển và gắn nhãn.

## 4. Changed Files
- `src/app/api/ingredients/route.ts`: API GET (search & filter) và POST (create) nguyên liệu.
- `src/app/api/ingredients/[id]/route.ts`: API GET, PUT và DELETE nguyên liệu có kiểm tra ràng buộc khóa ngoại.
- `src/app/api/taxonomies/route.ts`: API GET (filter theo type) và POST phân loại.
- `src/app/api/taxonomies/[id]/route.ts`: API DELETE phân loại có kiểm tra khóa ngoại.
- `src/scripts/seed_catalog.ts`: Script nạp 29 nguyên liệu cơ sở và 15 thẻ phân loại của Batch 0.
- `src/app/editor/ingredients/page.tsx`: Giao diện biên tập viên quản lý từ điển nguyên liệu.
- `src/app/editor/taxonomies/page.tsx`: Giao diện biên tập viên quản lý 4 nhóm thẻ phân loại đa trục.
- `docs/DECISIONS.md`: Bổ sung D32.
- `docs/TEST_LOG.md`: Ghi nhận 9 kiểm tra đạt chuẩn cho AG-12.
- `docs/ROADMAP.md`: Cập nhật trạng thái AG-12 sang `awaiting-close`.
- `docs/reports/AG-12_report.md`: Báo cáo này.

## 5. Verification Results
1. **Catalog Seeder Verification (`seed_catalog.ts`)**:
   - 29 nguyên liệu cơ sở được phân loại và chuẩn hóa đơn vị (g, ml, bó, quả, củ, tép).
   - 15 taxonomies được phân bổ đều cho 4 trục (Vùng miền, Phương pháp nấu, Đặc tính dinh dưỡng, Dịp ăn).
2. **Next.js Production Build (`npm run build`)**:
   - Exit code: 0
   - Routes biên dịch thành công:
     - `/api/ingredients`, `/api/ingredients/[id]` (Dynamic API)
     - `/api/taxonomies`, `/api/taxonomies/[id]` (Dynamic API)
     - `/editor/ingredients`, `/editor/taxonomies` (Static Pre-rendered)
3. **Secret Scan**: 0 secret phát hiện trong code.

## 6. Next Steps: Phase P2 Bước 5
Sau khi chủ sản phẩm duyệt đóng AG-12:
- Chuyển sang **AG-13 — Structured recipe editor**:
  - Xây dựng giao diện và API soạn thảo công thức có cấu trúc:
    - Chọn hoặc tạo Dish mới.
    - Chọn vai trò mâm cơm (`MAIN`, `SOUP`, `SIDE`).
    - Thêm nguyên liệu chọn từ từ điển `ingredients` (tìm kiếm autocomplete), nhập định lượng, chọn `scalePolicy` (`LINEAR`, `FIXED`, `MANUAL_ADJUST`), cách sơ chế `preparation`.
    - Thêm các bước nấu theo giai đoạn (Sơ chế, Chế biến, Hoàn thành), nhập thời gian đếm ngược an toàn `timerSeconds`, mẹo nấu `tipText`.
    - Gắn thẻ phân loại đa trục từ `taxonomies`.
    - Quản lý trạng thái vòng đời công thức (`DRAFT` $\rightarrow$ `SUBMITTED`).
