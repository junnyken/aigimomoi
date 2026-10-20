# AG-18 Report — Serving Adjustment

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, sẵn sàng đóng ticket**.

---

## 1. Summary
Tính năng điều chỉnh khẩu phần ăn tương tác (`Serving Adjustment`) đã được triển khai hoàn chỉnh trên trang chi tiết công thức `/cong-thuc/[slug]`. Người dùng có thể linh hoạt tăng hoặc giảm số người ăn (từ 1 đến 20 người) thông qua bộ điều khiển `ServingSelector`. Hệ thống tự động tính toán lại định lượng từng nguyên liệu theo đúng hợp đồng Invariants §5.4 (D21) và đồng bộ mượt mà lên URL parameter `?servings=X` mà không gây giật lag hay reload trang.

## 2. Invariants & Domain Rules Verified (§5.4, D21)
- **Tỷ lệ co giãn chuẩn xác**: $R = \text{targetServings} / \text{baseServings}$.
- **Tuân thủ ScalePolicy**:
  - `LINEAR`: Định lượng tự động nhân theo tỷ lệ $R$ (ví dụ: $4 \to 8$ người, 500g ba chỉ $\to$ 1000g).
  - `FIXED`: Giữ nguyên định lượng gốc (hương liệu, thảo mộc như gừng nướng, hoa hồi không nhân đôi để tránh làm nồng gắt món ăn).
  - `MANUAL_ADJUST`: Giữ nguyên định lượng gốc kèm ghi chú rõ ràng nêm nếm gia giảm dần dần theo khẩu vị gia đình.
- **Không nhân thời gian nấu**: Thời gian sơ chế, thời gian nấu và lửa giữ nguyên vẹn, không nhân theo $R$.
- **Làm tròn số hiển thị (D21)**: Làm tròn chỉ diễn ra ở tầng hiển thị UI (tối đa 2 chữ số thập phân), không lưu đè giá trị làm tròn vào state tính toán để tránh sai số lũy tiến.
- **Giới hạn biên an toàn**: Chặn các giá trị không hợp lệ, giữ số khẩu phần an toàn trong khoảng từ 1 đến 20 người.
- **Đồng bộ URL**: Tự động phản ánh `?servings=X` trên thanh địa chỉ thông qua `window.history.replaceState`, hỗ trợ người dùng copy và chia sẻ link công thức đúng theo số người ăn đã chọn.

## 3. Changed & Created Files
- `src/lib/recipes/scaling.ts`: Module thuần tính toán tỷ lệ co giãn, định dạng hiển thị, và chuẩn hóa biên khẩu phần.
- `src/components/recipe/ServingSelector.tsx`: Component bộ chọn khẩu phần tương tác (nút [-], [+], hiển thị tỷ lệ $R$, nút đặt lại về khẩu phần gốc).
- `src/components/recipe/IngredientList.tsx`: Nâng cấp thành Client Component phản ứng thời gian thực, tích hợp `ServingSelector`, hiển thị định lượng đã scale và nhãn chỉ dẫn Invariants §5.4.
- `src/app/cong-thuc/[slug]/page.tsx`: Cập nhật nhãn "Khẩu phần gốc" trong bảng tóm tắt Stat.
- `src/scripts/test_serving_adjustment.ts`: Kịch bản kiểm thử tự động toàn diện.

## 4. Test & Verification Results
- `npx tsx src/scripts/test_serving_adjustment.ts`: **40/40 PASS** (Scale up, scale down, scale lẻ, scale 1 người, chính sách LINEAR/FIXED/MANUAL_ADJUST, clampServings, formatScaledAmount, bất biến thời gian nấu).
- `npx tsx src/scripts/test_search_filters.ts`: **36/36 PASS** (Không hồi quy AG-17).
- `npx tsx src/scripts/test_public_rendering.ts`: **31/31 PASS** (Không hồi quy AG-16).
- `npx tsc --noEmit -p .`: PASS 100% không có lỗi TypeScript.
- `npm run build`: PASS 100% (21/21 routes biên dịch thành công).

## 5. Next Steps
Chuyển sang ticket tiếp theo trong Phase P3: **AG-19 (Cooking mode)** — Chế độ nấu tập trung toàn màn hình từng bước (fullscreen cooking step-by-step), hẹn giờ an toàn và mở nhanh danh sách nguyên liệu mà không mất vị trí nấu.
