# AG-06 Report — Recipe & Cooking Prototype

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã hoàn thành xây dựng bản mẫu web tương tác (Interactive Web Prototype) cho **Trang chi tiết công thức** (`prototype/recipe.html`) và **Chế độ nấu ăn từng bước (Cooking Mode)**. Triển khai trọn vẹn thuật toán đổi khẩu phần động (Serving Adjustment) tuân thủ nghiêm ngặt nguyên tắc Invariants §5.3 (tuyến tính, cố định, tùy khẩu vị, không sai số lũy tiến), hệ thống checklist nguyên liệu tương tác, chế độ nấu ăn tập trung chữ to kèm bộ đếm thời gian (Timer an toàn không tự chuyển bước) và ngăn kéo tra cứu nguyên liệu nhanh (Quick Ingredients Drawer).

## 2. Audit Before Build
- Xem chi tiết tại [mini-specs/AG-06.md](../mini-specs/AG-06.md) §5.
- Gap đã xác nhận: Trước đó các thẻ món ở `prototype/index.html` chưa có liên kết dẫn sang trang chi tiết; chưa có cơ chế đổi khẩu phần trực quan và chưa có giao diện hỗ trợ người nấu khi đang đứng bếp.

## 3. Design Choice
- **Công nghệ & Bố cục**:
  - `recipe.html` bố cục rõ ràng: Hero banner ảnh lớn, thẻ thông số (chuẩn bị, nấu, khẩu phần, tác giả), bảng nguyên liệu kèm bộ chọn khẩu phần, danh sách bước nấu phân giai đoạn.
  - Chế độ nấu (`Cooking Mode`): Thiết kế dạng Fullscreen Overlay không gây xao nhãng (distraction-free), cỡ chữ 20px - 24px dễ đọc từ xa, tương phản cao, tối ưu khi đặt điện thoại trên kệ bếp.
- **Serving Adjustment Engine**:
  - Tỷ lệ co giãn $R = \text{targetServings} / \text{baseServings}$.
  - Phân loại rõ `ScalePolicy`: `LINEAR` co giãn theo $R$; `FIXED` giữ nguyên; `MANUAL_ADJUST` giữ nguyên định lượng kèm ghi chú nêm nếm.
  - Làm tròn số chỉ diễn ra ở bước hiển thị chuỗi UI (VD: `4.5` củ hành), lưu số thực trong state, đảm bảo đổi từ 4 $\rightarrow$ 6 $\rightarrow$ 4 người trả về chính xác 100% định lượng ban đầu.
- **Timer & Cooking Guardrails**:
  - Timer đếm ngược trực quan (Bắt đầu / Tạm dừng / Đặt lại).
  - Khi hết giờ: Phát tín hiệu thông báo nhưng **tuyệt đối không tự động nhảy bước** để đảm bảo an toàn thực phẩm và trải nghiệm người nấu.
  - Ngăn kéo tra cứu nhanh (Quick Drawer) trượt ra từ cạnh phải, xem lại định lượng mọi lúc mà không làm gián đoạn hay reset timer của bước đang nấu.

## 4. Changed Files
- `prototype/scripts/app.js`: Cập nhật liên kết từ thẻ món ăn và mâm cơm gợi ý sang `recipe.html?id=[id]`.
- `prototype/styles/main.css`: Bổ sung toàn bộ style cho trang chi tiết công thức, bộ chọn khẩu phần, danh sách bước nấu, thanh bar kích hoạt nấu ăn cố định và Cooking Mode.
- `prototype/recipe.html`: Trang HTML chi tiết công thức và Chế độ nấu ăn tập trung.
- `prototype/scripts/recipe.js`: Logic chi tiết công thức, tính toán co giãn khẩu phần, checklist nguyên liệu, timer và điều hướng bước nấu.
- `docs/DECISIONS.md`: Bổ sung D26.
- `docs/ROADMAP.md`: Cập nhật AG-06 sang `awaiting-close`.
- `docs/TEST_LOG.md`: Ghi nhận kết quả kiểm thử co giãn khẩu phần và phản hồi HTTP.
- `docs/mini-specs/AG-06.md`: Cập nhật trạng thái duyệt.
- `docs/reports/AG-06_report.md`: Báo cáo này.

## 5. New API/DB/State
- Không phát sinh backend API hay DB.
- Trạng thái client-side mới: `currentServings`, `checkedIngredients`, `currentStepIndex`, `timerSecondsRemaining`, `isTimerRunning`.

## 6. Tests
- **App Tests**: N/A.
- **Serving Invariant Test (Python script)**: Đổi 4 $\rightarrow$ 6 $\rightarrow$ 4 người cho toàn bộ các nhóm chính sách co giãn (`LINEAR`, `FIXED`, `MANUAL_ADJUST`) đều cho kết quả chính xác 100%, không bị trôi số.
- **HTTP Verification**: HTTP 200 OK trên `recipe.html` và `recipe.js`.
- **Navigation Verification**: Bấm từ trang chủ `index.html` mở đúng món `recipe.html?id=...`.
- **Secret scan**: 0 secret phát hiện.

## 7. Live Verification
- Đã kiểm tra trực tiếp qua máy chủ nội bộ: `http://localhost:8090/prototype/recipe.html?id=thit-ba-chi-kho-tieu`.
- Trải nghiệm chuyển đổi mượt mà giữa xem công thức và chế độ nấu ăn.

## 8. Remaining Limits / Follow-ups
- Bước tiếp theo trong Phase P1: **AG-07: Meal & shopping prototype** (Dựng giao diện Ghép mâm cơm gia đình, đổi món giữ nguyên bữa, gộp nguyên liệu cùng đơn vị và danh sách đi chợ tương tác).
