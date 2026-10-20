# AG-21 Report — Meal Composition & Replacement (Ghép bữa cơm & Thuật toán đổi món)

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, sẵn sàng đóng ticket**.

---

## 1. Summary
Đã triển khai hoàn chỉnh tính năng cốt lõi của ĂN GÌ MOM — Ghép mâm cơm gia đình 3 món (`Meal Composition & Replacement`) tại route `/meal`:
- **Cấu trúc chuẩn bữa cơm Việt Nam**: 3 vị trí (slots) đại diện cho 3 vai trò:
  - **Món Mặn (MAIN)**: Đậm đà, cung cấp đạm chính.
  - **Món Canh (SOUP)**: Thanh nhiệt, đưa cơm.
  - **Món Rau/Xào/Phụ (SIDE)**: Tươi mát, bổ sung chất xơ.
- **Thuật toán Đổi món (Slot Replacement)**: Người dùng bấm "Đổi món" ở bất kỳ vị trí nào để mở modal chọn món khác cùng vai trò mà **giữ nguyên vẹn 2 món còn lại** trong mâm cơm.
- **Thuật toán Gợi ý ngẫu nhiên (Randomize / Re-compose)**: Tự động ghép ngẫu nhiên một mâm cơm 3 món hài hòa từ kho công thức `PUBLISHED` (`/api/meal/random`).
- **Đồng bộ Khẩu phần ăn cả mâm (`servings: 1..20`)**: Tích hợp logic co giãn từ **AG-18**, đồng bộ khẩu phần cho cả 3 món ăn trong bữa cơm.
- **Trải nghiệm khách vãng lai & Deep Link (Invariants §6.7)**:
  - Không bắt buộc đăng nhập để ghép mâm cơm hay đổi món.
  - Đồng bộ trạng thái mâm cơm lên URL (`/meal?main=...&soup=...&side=...&servings=...`) và lưu vết tự động vào `localStorage` (`angimom_current_meal`).
- **Thanh tóm tắt & CTA Đi chợ**: Tính toán ước tính thời gian nấu thông minh và nút chuyển tiếp sẵn sàng cho **AG-22 (Gộp nguyên liệu đi chợ)**.

## 2. Invariants & Security Verified
- **Invariants §5.1 (Chỉ hiển thị công thức `PUBLISHED`)**:
  - Toàn bộ danh sách gợi ý và thay thế chỉ truy vấn các bản ghi `status = 'PUBLISHED'`.
  - Nếu slug trên URL thuộc bản nháp (`DRAFT`) hoặc lưu trữ (`ARCHIVED`) hoặc không tồn tại, thuật toán phân giải `resolveMealSelection()` tự động fallback về món `PUBLISHED` đầu tiên hợp lệ.
  - Chống tấn công SQL Injection và XSS trong slug an toàn.
- **Invariants §5.3 (Cấu trúc 3 món chuẩn mực)**:
  - Mỗi slot chỉ nhận công thức có role tương ứng (`MAIN`, `SOUP`, `SIDE`).
- **Invariants §5.4 (Co giãn nguyên liệu & bất biến thời gian)**:
  - Khẩu phần ăn toàn mâm áp dụng đồng bộ cho cả 3 món. Thời gian nấu không bị nhân tuyến tính theo khẩu phần.
- **Invariants §6.7 (Không bắt buộc đăng nhập)**:
  - Khách vãng lai thao tác mâm cơm hoàn toàn mượt mà.

## 3. Changed & Created Files
- `src/lib/meal/mealQueries.ts`: Truy vấn các món PUBLISHED theo vai trò, phân giải lựa chọn 3 món và thuật toán gợi ý ngẫu nhiên.
- `src/lib/meal/mealClient.ts`: Quản lý state mâm cơm phía client, đồng bộ đa chiều (`localStorage`, URL query, custom events).
- `src/app/api/meal/options/route.ts`: API endpoint `GET /api/meal/options?role=...` trả về danh sách các món thay thế.
- `src/app/api/meal/random/route.ts`: API endpoint `GET /api/meal/random` trả về 3 slugs ngẫu nhiên.
- `src/components/meal/MealServingsSelector.tsx`: Bộ điều khiển khẩu phần ăn toàn mâm (1..20 người).
- `src/components/meal/SwapDishModal.tsx`: Hộp thoại/Drawer đổi món có bộ lọc tìm kiếm nhanh theo tên.
- `src/components/meal/MealSlotCard.tsx`: Thẻ hiển thị từng vị trí trong mâm cơm (badge màu vai trò, hình ảnh, thời gian, nút đổi món, nút xem nấu).
- `src/components/meal/MealSummaryBar.tsx`: Thanh tóm tắt thời gian nấu và nút CTA đi chợ.
- `src/components/meal/MealView.tsx`: Client container điều phối toàn bộ tương tác mâm cơm.
- `src/app/meal/page.tsx`: Server Component trang mâm cơm với Next.js 16 Partial Prerendering và metadata SEO.
- `src/scripts/test_meal_composition.ts`: Kịch bản kiểm thử tự động toàn diện.

## 4. Test & Verification Results
- `npx tsx src/scripts/test_meal_composition.ts`: **37/37 PASS** (Cấu trúc 3 món, Invariants PUBLISHED, fallback slug nháp/lạ, đổi món cục bộ, gợi ý ngẫu nhiên, khẩu phần toàn mâm).
- `npx tsx src/scripts/test_saved_recipes.ts`: **25/25 PASS** (Không hồi quy AG-20).
- `npx tsx src/scripts/test_cooking_mode.ts`: **19/19 PASS** (Không hồi quy AG-19).
- `npx tsx src/scripts/test_serving_adjustment.ts`: **40/40 PASS** (Không hồi quy AG-18).
- `npx tsx src/scripts/test_search_filters.ts`: **36/36 PASS** (Không hồi quy AG-17).
- `npx tsc --noEmit -p .`: PASS 100% không có lỗi kiểu dữ liệu.
- `npm run build`: PASS 100% (30/30 routes biên dịch sạch sẽ).

## 5. Next Steps
Chuyển sang ticket tiếp theo trong Phase P3: **AG-22 (Ingredient aggregation)** — Bộ máy tự động gộp nguyên liệu trùng nhau từ cả 3 món trong mâm cơm theo đơn vị chuẩn, phân tách gia vị nêm nếm `MANUAL_ADJUST`, và truy vết nguồn gốc từng nguyên liệu theo Invariants §5.4.
