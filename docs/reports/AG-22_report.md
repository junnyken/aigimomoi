# AG-22 Report — Ingredient Aggregation (Bộ máy gộp nguyên liệu đi chợ từ mâm cơm)

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, sẵn sàng đóng ticket**.

---

## 1. Summary
Đã triển khai hoàn chỉnh Bộ máy Gộp nguyên liệu tự động (`Ingredient Aggregation Engine`) cho mâm cơm gia đình:
- **Gộp thông minh cùng đơn vị tính (Invariants §5.4)**: Tự động cộng dồn số lượng các nguyên liệu trùng nhau từ cả 3 món ăn trong mâm (ví dụ: Thịt ba chỉ 400g cho món kho + 150g cho món canh $\to$ Tổng gộp: 550g).
- **Truy vết nguồn gốc rõ ràng (Ingredient Traceability)**: Mỗi mục nguyên liệu gộp lưu trữ mảng `traces` ghi nhận chi tiết tên món ăn, slug, định lượng gốc, định lượng sau khi scale và cách sơ chế (`preparation`), giúp người dùng hiểu rõ mục đích sử dụng khi chuẩn bị nguyên liệu.
- **Tách riêng Gia vị nêm nếm & Đồ khô (`MANUAL_ADJUST`)**: Phân tách rành mạch giữa nguyên liệu tươi sống cần mua sắm ngoài chợ (`freshItems`) và gia vị nêm nếm sẵn có trong bếp nhà (`seasoningItems`), giải quyết triệt để vấn đề hiểu nhầm định lượng gia vị.
- **Co giãn khẩu phần toàn mâm**: Tích hợp logic co giãn từ **AG-18**: dòng `LINEAR` nhân $R = \text{target} / \text{base}$, dòng `FIXED` giữ nguyên số lượng gốc, dòng `MANUAL_ADJUST` giữ nguyên kèm hướng dẫn nêm nếm.
- **Phân loại quầy chợ chuyên nghiệp**: Phân nhóm nguyên liệu theo từng quầy mua sắm phổ biến (`MEAT_SEAFOOD`, `PRODUCE`, `PANTRY`, `OTHER`) phục vụ trực tiếp cho trang checklist đi chợ ở **AG-23**.
- **Làm tròn an toàn tầng hiển thị (D21)**: Dùng `formatScaledAmount` làm tròn tối đa 2 chữ số thập phân, bảo toàn độ chính xác số học nội bộ.

## 2. Invariants & Business Logic Verified
- **Invariants §5.1 (Chỉ công thức `PUBLISHED`)**:
  - Hàm `queryMealRecipesForAggregation()` chỉ lọc các công thức có trạng thái `PUBLISHED`, loại bỏ hoàn toàn các bản `DRAFT` và `ARCHIVED`.
- **Invariants §5.4 (Quy tắc gộp nguyên liệu)**:
  - Chỉ cộng dồn khi cùng tên và cùng đơn vị đo lường. Khác đơn vị (ví dụ "trái" vs "muỗng") được tách riêng thành 2 mục độc lập.
  - Phân tách riêng biệt gia vị `MANUAL_ADJUST`.
- **An toàn đầu vào**:
  - Chống SQL injection qua Drizzle ORM, giới hạn tối đa 10 slugs/lần yêu cầu, chuẩn hóa slug an toàn.

## 3. Changed & Created Files
- `src/lib/recipes/aggregation.ts`: Bộ máy gộp nguyên liệu thuần túy (pure engine) độc lập với UI.
- `src/lib/meal/mealQueries.ts`: Thêm hàm `queryMealRecipesForAggregation(slugs: string[])` kết nối quan hệ bảng nguyên liệu từ PostgreSQL.
- `src/app/api/meal/aggregate/route.ts`: API endpoint `POST /api/meal/aggregate` nhận mảng slugs và số khẩu phần, trả về kết quả gộp chuẩn hóa `AggregationResult`.
- `src/scripts/test_ingredient_aggregation.ts`: Bộ kiểm thử tự động toàn diện.

## 4. Test & Verification Results
- `npx tsx src/scripts/test_ingredient_aggregation.ts`: **37/37 PASS** (Unit logic, cộng dồn cùng đơn vị, traceability, co giãn $R$, bất biến FIXED, tách riêng MANUAL_ADJUST, phân loại quầy chợ, tích hợp DB query).
- `npx tsx src/scripts/test_meal_composition.ts`: **37/37 PASS** (Không hồi quy AG-21).
- `npx tsx src/scripts/test_saved_recipes.ts`: **25/25 PASS** (Không hồi quy AG-20).
- `npx tsx src/scripts/test_cooking_mode.ts`: **19/19 PASS** (Không hồi quy AG-19).
- `npx tsx src/scripts/test_serving_adjustment.ts`: **40/40 PASS** (Không hồi quy AG-18).
- `npx tsx src/scripts/test_search_filters.ts`: **36/36 PASS** (Không hồi quy AG-17).
- `npx tsc --noEmit -p .`: PASS 100% không có lỗi kiểu dữ liệu.
- `npm run build`: PASS 100% (31/31 routes biên dịch tối ưu).

## 5. Next Steps
Chuyển sang ticket tiếp theo: **AG-23 (Shopping checklist persistence)** — Xây dựng trang đi chợ `/shopping` tương tác, checklist đánh dấu đã mua/chưa mua lưu vào `localStorage`, phân nhóm theo quầy chợ và thanh tiến độ hoàn thành đi chợ theo thời gian thực.
