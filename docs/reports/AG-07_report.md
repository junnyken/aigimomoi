# AG-07 Report — Meal & Shopping Prototype

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã hoàn thành xây dựng bản mẫu web tương tác (Interactive Web Prototype) cho **Mâm cơm gia đình 3 món** (`prototype/meal.html`) và **Danh sách đi chợ thông minh** (`prototype/shopping.html`), kết nối liên hoàn 4 trang web của dự án ĂN GÌ MOM.
Triển khai bộ máy tổng hợp nguyên liệu Invariants §5.4 (`aggregateIngredients`) tự động gộp các nguyên liệu tương thích theo cùng đơn vị tính từ 3 món trong mâm cơm (ví dụ: thịt ba chỉ 400g kho tiêu + 100g nấu canh rau ngót = 500g cần mua), bảo toàn khả năng truy vết nguồn gốc (traceability), tách biệt nhóm gia vị gian bếp (`MANUAL_ADJUST`), hỗ trợ đổi món độc lập từng vai trò (`MAIN`, `SOUP`, `SIDE`), co giãn khẩu phần toàn mâm và quản lý tiến độ checklist đi chợ theo thời gian thực lưu trong `localStorage`.

## 2. Audit Before Build
- Xem chi tiết tại [mini-specs/AG-07.md](../mini-specs/AG-07.md) §5.
- Gap đã xác nhận: Người dùng chưa có giao diện mâm cơm 3 món để đổi món riêng lẻ mà giữ nguyên 2 món còn lại; chưa có cơ chế tính toán tổng lượng nguyên liệu cần đi chợ của cả bữa cơm; chưa có checklist đi chợ lưu trạng thái.

## 3. Design Choice
- **State Architecture (`prototype/scripts/meal_state.js`)**:
  - Quản lý mâm cơm hiện tại trong `localStorage` (`angimom_current_meal_v1`), cho phép chuyển đổi nhịp nhàng giữa Trang chủ $\leftrightarrow$ Chi tiết món $\leftrightarrow$ Mâm cơm $\leftrightarrow$ Đi chợ.
  - Hỗ trợ đổi từng món theo vai trò: `swapMealDish(role, newDishId)`.
  - Bộ chọn khẩu phần chung cả mâm: `setMealServings(servings)` từ 1 đến 16 người.
- **Invariants §5.4: Aggregation Engine**:
  - Gộp các nguyên liệu theo khóa chuẩn `${name}__${unit}`.
  - Các nguyên liệu có `scalePolicy === 'LINEAR'` được nhân theo tỷ lệ khẩu phần $R = \text{mealServings} / \text{baseServings}$ trước khi cộng dồn.
  - Mỗi nguyên liệu sau khi gộp giữ mảng `traces: [{dishName, amount, baseAmount, unit, preparation}]` để người dùng luôn biết nguyên liệu này đến từ món nào.
  - Các gia vị có `scalePolicy === 'MANUAL_ADJUST'` được tách sang bảng riêng "Gia vị & nếp bếp có sẵn", tránh cộng dồn sai lệch (ví dụ: nước mắm nêm theo khẩu vị gia đình).
- **Trang Mâm cơm (`prototype/meal.html` & `prototype/scripts/meal.js`)**:
  - 3 Thẻ vai trò: Món mặn chính (`MAIN`), Món canh thanh mát (`SOUP`), Món rau/xào (`SIDE`).
  - Nút "Đổi món này" mở cửa sổ Modal lọc đúng các món ứng cử viên trong Batch 0 có cùng vai trò, bấm đổi là cập nhật ngay lập tức.
  - Nút "Gợi ý mâm khác" đổi ngẫu nhiên cả 3 món.
  - Nút CTA chuyển thẳng sang Trang Đi chợ.
- **Trang Đi chợ (`prototype/shopping.html` & `prototype/scripts/shopping.js`)**:
  - Danh sách chia làm 2 phân hệ rõ ràng: "Nguyên liệu tươi sống & rau củ" (đã gộp số lượng) và "Gia vị & nếp bếp có sẵn".
  - Mỗi thẻ nguyên liệu có checkbox tick chọn đã mua/đã có, tự động gạch ngang chữ và làm mờ khi tick.
  - Thanh tiến độ đi chợ (Progress Bar) hiển thị số lượng và % nguyên liệu đã chuẩn bị.
  - Nút "Đặt lại" để tái sử dụng checklist cho lần đi chợ kế tiếp.
  - Lưu trạng thái checklist bền vững vào `localStorage` (`angimom_shopping_checked_v1`).

## 4. Changed Files
- `prototype/scripts/meal_state.js`: Module quản lý state mâm cơm và bộ máy gộp nguyên liệu Invariants §5.4.
- `prototype/meal.html`: Trang HTML Mâm cơm gia đình 3 món và Modal đổi món.
- `prototype/scripts/meal.js`: Logic điều khiển giao diện mâm cơm, đổi món, đổi khẩu phần.
- `prototype/shopping.html`: Trang HTML Danh sách đi chợ thông minh.
- `prototype/scripts/shopping.js`: Logic render danh sách đi chợ, tương tác checklist, thanh tiến độ.
- `prototype/index.html`: Cập nhật thanh điều hướng chính (`header-nav`) và nút CTA từ thẻ mâm cơm gợi ý sang `meal.html`.
- `prototype/recipe.html`: Cập nhật thanh điều hướng chính đồng bộ 3 liên kết (Khám phá, Mâm cơm, Đi chợ).
- `prototype/scripts/app.js`: Đồng bộ mâm cơm ngẫu nhiên sinh ra từ "Hôm nay ăn gì?" vào state lưu trữ chung.
- `prototype/styles/main.css`: Bổ sung CSS cho Header Navigation, Meal Slots, Modal đổi món, Shopping Items, Checklist và Progress Bar; giải quyết triệt để cảnh báo `line-clamp`.
- `docs/DECISIONS.md`: Bổ sung D27 (Meal State & Shopping Aggregation Pattern).
- `docs/TEST_LOG.md`: Ghi nhận 8 kiểm tra đạt chuẩn cho AG-07.
- `docs/ROADMAP.md`: Cập nhật trạng thái AG-07 sang `awaiting-close`.
- `docs/reports/AG-07_report.md`: Báo cáo này.

## 5. New API/DB/State
- Không phát sinh backend API hay DB (vẫn là thuần client-side prototype theo Playbook P1).
- Trạng thái `localStorage`:
  - `angimom_current_meal_v1`: `{ servings: 4, mainId: '...', soupId: '...', sideId: '...' }`
  - `angimom_shopping_checked_v1`: danh sách các key nguyên liệu đã tick chọn.

## 6. Tests
- **Node Syntax Check (`node --check`)**: 100% các file script (`meal_state.js`, `meal.js`, `shopping.js`, `app.js`, `recipe.js`) đều vượt qua kiểm tra cú pháp không có lỗi.
- **HTTP Server Responses (Port 8090)**:
  - `http://localhost:8090/prototype/index.html` $\rightarrow$ 200 OK
  - `http://localhost:8090/prototype/recipe.html` $\rightarrow$ 200 OK
  - `http://localhost:8090/prototype/meal.html` $\rightarrow$ 200 OK
  - `http://localhost:8090/prototype/shopping.html` $\rightarrow$ 200 OK
- **Invariants §5.4 Check**: Nguyên liệu thịt ba chỉ từ 2 món khác nhau được gộp chính xác theo phép cộng số học, hiển thị trace nguồn gốc rõ ràng.
- **CSS Lint Check**: Đã bổ sung `line-clamp: 2;` chuẩn CSS cùng `-webkit-line-clamp: 2;`, giải quyết triệt để 2 cảnh báo lint.
- **Secret scan**: 0 secret phát hiện.

## 7. Live Verification
Chủ sản phẩm có thể mở trực tiếp trình duyệt và kiểm tra toàn bộ luồng tương tác 4 trang tại máy chủ cổng 8090:
- Trang chủ / Khám phá: `http://localhost:8090/prototype/index.html`
- Trang Mâm cơm: `http://localhost:8090/prototype/meal.html`
- Trang Đi chợ: `http://localhost:8090/prototype/shopping.html`
- Trang Chi tiết công thức: `http://localhost:8090/prototype/recipe.html?id=thit-ba-chi-kho-tieu`

## 8. Remaining Limits / Follow-ups
- Bước tiếp theo trong Phase P1: **AG-08: Responsive & usability review** (Đánh giá tổng thể độ tương thích hiển thị trên các kích thước màn hình điện thoại / máy tính bảng / máy tính để bàn, độ tương phản WCAG 2.2 AA, bàn phím và khả năng tiếp cận - bước cuối cùng trước khi đóng Gate P1 và chuyển sang Phase P2 Core Catalog & Next.js backend).
