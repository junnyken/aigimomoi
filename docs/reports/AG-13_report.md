# AG-13 Report — Structured Recipe Editor

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã triển khai hoàn chỉnh Trình biên tập công thức có cấu trúc (Structured Recipe Editor) và hệ thống API quản lý vòng đời công thức (`/api/recipes`, `/api/recipes/[id]`), bảo vệ nghiêm ngặt các bất biến ẩm thực cốt lõi (Invariants §5.1, §5.2, §5.3, §5.4). Giao diện trực quan tại `/editor/recipes`, `/editor/recipes/new`, `/editor/recipes/[id]` cho phép biên tập viên liên kết nguyên liệu từ điển, thiết lập chính sách co giãn (`scalePolicy`), thiết lập bước nấu có hẹn giờ an toàn, gắn nhãn đa trục và quản lý trạng thái (`DRAFT` / `SUBMITTED` / `PUBLISHED`).

## 2. Invariants & Domain Rules Verified
- **Tách bạch Dish và Recipe (Invariants §5.1)**:
  - Một Recipe luôn liên kết với một `dishId` (khái niệm món ăn tổng quát). Nếu chưa có Dish, API tự động khởi tạo Dish tương ứng.
- **Nguyên liệu có cấu trúc (Invariants §5.3, §5.4)**:
  - 100% dòng nguyên liệu liên kết với bản ghi chuẩn trong bảng `ingredients`.
  - Có đầy đủ định lượng số (`amount`), đơn vị chuẩn (`unit`), chính sách co giãn (`scalePolicy`: `LINEAR` / `FIXED` / `MANUAL_ADJUST`), chỉ dẫn sơ chế (`preparation`), và cờ tùy chọn (`isOptional`).
- **Bước nấu có cấu trúc & Timer an toàn (Invariants §5.2)**:
  - Phân đoạn rõ ràng (`Sơ chế`, `Chế biến`, `Hoàn thành`).
  - Hỗ trợ số giây hẹn giờ `timerSeconds` (hoặc phút trên UI), mẹo nấu dân gian `tipText` ("Mẹo của mẹ").
  - Không có cơ chế tự nhảy bước, đảm bảo an toàn tuyệt đối khi đứng bếp thực tế.
- **Bảo vệ tính bất biến của công thức đã xuất bản (Invariants §5.1)**:
  - API `PUT /api/recipes/[id]` và `DELETE /api/recipes/[id]` từ chối trực tiếp nếu công thức có trạng thái `PUBLISHED` (HTTP 400 Bad Request kèm thông điệp hướng dẫn quy trình Revision ở AG-15).
  - Giao diện `/editor/recipes/[id]` hiển thị banner ổ khóa và khóa các trường nhập liệu khi công thức đã ở trạng thái `PUBLISHED`.

## 3. Changed & Created Files
- `src/app/api/recipes/route.ts`: API `GET` (tìm kiếm, lọc vai trò/trạng thái) và `POST` (tạo recipe nháp kèm ingredients, steps, taxonomies trong transaction).
- `src/app/api/recipes/[id]/route.ts`: API `GET` (chi tiết đầy đủ quan hệ), `PUT` (cập nhật có kiểm tra cấm sửa `PUBLISHED`), `DELETE` (xóa bản nháp).
- `src/app/editor/recipes/page.tsx`: Giao diện danh sách quản lý công thức, thống kê trạng thái, thẻ bài trực quan và bộ lọc.
- `src/app/editor/recipes/new/page.tsx`: Màn hình soạn thảo trực quan 4 phần (Thông tin chung, Bảng nguyên liệu động, Bước nấu có timer, Thẻ phân loại đa trục).
- `src/app/editor/recipes/[id]/page.tsx`: Màn hình xem & chỉnh sửa chi tiết công thức kèm bảo vệ khóa `PUBLISHED`.
- `src/scripts/test_recipes_crud.ts`: Script kiểm thử tự động tạo công thức, truy vấn quan hệ và kiểm chứng Invariants §5.1.
- `docs/reports/AG-13_report.md`: Báo cáo nghiệm thu này.
- `docs/DECISIONS.md`: Bổ sung D33.
- `docs/TEST_LOG.md`: Ghi nhận log kiểm thử AG-13.
- `docs/ROADMAP.md`: Cập nhật AG-13 thành `awaiting-close`.

## 4. Test & Verification Results
- **Postgres Database Container**: Đã kích hoạt container `angimom_postgres` (Postgres 16 Alpine), nạp toàn bộ 11 bảng và 6 enum schemas, seed 2 tài khoản quản trị + 29 nguyên liệu chuẩn + 15 taxonomies Batch 0.
- **Unit & Invariants Test**: `npx tsx src/scripts/test_recipes_crud.ts` hoàn thành 100% không lỗi:
  - Tạo công thức có cấu trúc kèm quan hệ Dish.
  - Kiểm tra ràng buộc cấm sửa trực tiếp `PUBLISHED` recipe.
- **Production Next.js Build**: `npm run build` thành công 100% với 14 routes sạch lỗi type check và prerender:
  - `/api/recipes`
  - `/api/recipes/[id]`
  - `/editor/recipes`
  - `/editor/recipes/new`
  - `/editor/recipes/[id]`

## 5. Next Steps
Chủ sản phẩm duyệt đóng AG-13 để chuyển sang:
- **AG-14 Media pipeline**: Xử lý upload và lưu trữ hình ảnh món ăn, ảnh bước nấu và tối ưu responsive WebP/AVIF.
- **AG-15 Publishing & revision gate**: Hoàn tất quy trình duyệt xuất bản (`SUBMITTED` -> `APPROVED` -> `PUBLISHED`) và kiểm soát phiên bản sửa đổi (Revision snapshots).
