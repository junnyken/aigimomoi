# AG-10 Report — Schema & Migrations

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã hoàn thành thiết kế, xây dựng và kiểm thử toàn diện **Lược đồ cơ sở dữ liệu (Drizzle Schema) & Quan hệ (Relations)** cho toàn bộ mô hình nghiệp vụ ẩm thực của dự án ĂN GÌ MOM, đồng thời sinh thành công tập tin migration SQL đầu tiên (`drizzle/0000_dry_orphan.sql`) sẵn sàng nạp dữ liệu.
Lược đồ tuân thủ tuyệt đối các nguyên tắc bất biến Domain Invariants (§5):
- 6 Enums miền: `recipe_publish_status`, `meal_role`, `scale_policy`, `nutrition_status`, `user_role`, `taxonomy_type`.
- 11 Bảng dữ liệu quan hệ chặt chẽ: `users`, `dishes`, `dish_aliases`, `recipes`, `ingredients`, `recipe_ingredients`, `cooking_steps`, `taxonomies`, `recipe_tags`, `meals`, `meal_items`.
- Định lượng nguyên liệu có cấu trúc (`recipe_ingredients` lưu `amount`, `unit`, `scale_policy`, `preparation`, `sort_order`).
- 3 Cờ kiểm chứng trung thực độc lập: `is_editorial_reviewed`, `is_cook_tested`, `is_nutrition_verified`.
- Thiết lập đầy đủ relations typesafe cho phép Drizzle ORM thực hiện nested queries (truy vấn lồng) mượt mà không cần viết raw SQL phức tạp.

## 2. Audit Before Build
- Xem chi tiết tại [mini-specs/AG-10.md](../mini-specs/AG-10.md).
- Trước AG-10, mới chỉ có schema khung ban đầu ở AG-09. AG-10 đã hiện thực hóa trọn vẹn hợp đồng dữ liệu từ `DATA_MODEL.md` (D21) và quy tắc co giãn/gộp nguyên liệu từ Invariants §5.3 và §5.4.

## 3. Design Choice
- **Tách biệt Dish và Recipe**: Bảng `dishes` đại diện cho khái niệm món ăn (VD: "Thịt kho tiêu", "Canh chua cá lóc"), cho phép tìm kiếm theo cả tên chuẩn lẫn bí danh địa phương (`dish_aliases`). Bảng `recipes` chứa công thức cụ thể của tác giả, đảm bảo tính bản quyền và sự đa dạng vùng miền.
- **Quan hệ Many-to-Many linh hoạt**: Bảng `recipe_tags` nối giữa `recipes` và `taxonomies` cho phép gắn nhãn đa trục (vùng miền Bắc/Trung/Nam, phương pháp xào/kho/luộc, món ăn theo mùa hoặc dịp lễ).
- **Hạ tầng Mâm cơm (Meals)**: Bảng `meals` và `meal_items` chuẩn bị sẵn nền tảng lưu trữ mâm cơm cá nhân hóa cho người dùng trong các Phase sau (P3 MVP).
- **Chỉ mục (Indexes) hiệu năng cao**: Tối ưu hóa sẵn index trên các trường tìm kiếm thường xuyên: `slug`, `name`, `alias_name`, `role`, `status`, `author_id`, và các khóa ngoại.

## 4. Changed Files
- `src/lib/db/schema.ts`: Định nghĩa 6 enums, 11 bảng dữ liệu, khóa chính, khóa ngoại và chỉ mục tìm kiếm.
- `src/lib/db/relations.ts`: Định nghĩa quan hệ Drizzle Relations typesafe cho cả 11 bảng.
- `src/lib/db/index.ts`: Nạp và export trọn vẹn client `db`, `schema` và `relations`.
- `drizzle/0000_dry_orphan.sql`: Tập tin migration SQL DDL hoàn chỉnh (150 dòng DDL chuẩn PostgreSQL).
- `drizzle/meta/_journal.json`: Nhật ký kiểm soát phiên bản migration của Drizzle Kit.
- `docs/DECISIONS.md`: Bổ sung D30.
- `docs/TEST_LOG.md`: Ghi nhận 7 kiểm tra đạt chuẩn cho AG-10.
- `docs/ROADMAP.md`: Cập nhật trạng thái AG-10 sang `awaiting-close`.
- `docs/reports/AG-10_report.md`: Báo cáo này.

## 5. Verification Results
1. **Drizzle Migration Generation (`npm run db:generate`)**:
   - Exit code: 0
   - 11 tables, 6 enums, 18 indexes, 11 foreign keys generated into `drizzle/0000_dry_orphan.sql`.
2. **Next.js Production Build (`npm run build`)**:
   - Exit code: 0
   - Static pages generated: `/`, `/_not-found`
   - Không có lỗi type mismatch giữa schema, relations và app code.
3. **Secret Scan**: 0 secret phát hiện trong code.

## 6. Next Steps: Phase P2 Bước 3
Sau khi chủ sản phẩm duyệt đóng AG-10:
- Chuyển sang **AG-11 — Identity & authorization**:
  - Triển khai cơ chế xác thực session an toàn (Session Cookies / NextAuth / IronSession).
  - Phân quyền theo vai trò: `ADMIN` (toàn quyền hệ thống), `EDITOR` (duyệt/xuất bản công thức), `COOK` (người dùng nấu ăn thông thường).
  - Bảo vệ các route biên tập và API endpoint theo nguyên tắc bảo mật web.
