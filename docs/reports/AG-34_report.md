# Báo cáo Nghiệm thu Kỹ thuật AG-34: Cooked-it Feedback & Photos

**Mã ticket**: AG-34  
**Thuộc Phase**: P5 — Cộng đồng và Văn hóa Món ăn (Nghiệm thu toàn bộ Gate P5)  
**Trạng thái**: `HOÀN TẤT & ĐẠT CHUẨN 100%`  
**Ngày hoàn thành**: 21/10/2026  

---

## 1. Mục tiêu Đã Thực Hiện
- Cung cấp tính năng "Tôi đã nấu món này!" (Cooked-it feedback) cho độc giả tại chân trang công thức `/cong-thuc/[slug]`.
- Cho phép người nấu gửi ảnh đĩa cơm gia đình thực tế kèm số sao vừa miệng (1-5 sao) và ghi chú mẹo nêm nếm thực tế.
- Xây dựng Hàng đợi Kiểm duyệt Ảnh & Phản hồi (`/editor/feedbacks`) dành riêng cho Ban biên tập.
- Thiết lập cơ chế chống spam nghiêm ngặt (Upsert 1 review / user / recipe).

---

## 2. Các Thành phần Kỹ thuật Đã Triển khai
1. **Database Schema & Migration**:
   - `drizzle/0007_ag34_cooked_feedback.sql`:
     - Enum `feedback_status`: `'PENDING'`, `'APPROVED'`, `'REJECTED'`.
     - Bảng `recipe_cooked_feedbacks` với các chỉ mục: `(recipe_id)`, `(status)`, `(created_at)`, `(recipe_id, user_id)`.
     - Khóa ngoại cascade khi xóa công thức, set null khi xóa user.
2. **API Routes**:
   - `POST /api/recipes/[id]/feedback`: Nhận feedback & ảnh (auto-approve phản hồi text của user, đưa phản hồi có ảnh hoặc của khách vào `PENDING`).
   - `GET /api/recipes/[id]/feedback`: Công khai, chỉ trả về các feedback `APPROVED`, tính toán số lượt nấu và điểm đánh giá trung bình.
   - `GET /api/editor/feedbacks`: Hàng đợi duyệt dành riêng cho `EDITOR` / `ADMIN` (chặn `COOK` HTTP 403).
   - `PATCH /api/editor/feedbacks/[id]`: Duyệt hoặc từ chối phản hồi.
3. **Frontend Components**:
   - `src/components/recipe/CookedItSection.tsx`: Component đĩa cơm cộng đồng, thống kê sao, thư viện ảnh nấu thật và danh sách mẹo nêm nếm.
   - `src/app/editor/feedbacks/page.tsx`: Giao diện duyệt ảnh & feedback 1-click cho Ban biên tập.
   - Tích hợp liền mạch vào trang chi tiết `/cong-thuc/[slug]`.

---

## 3. Kết quả Kiểm thử Tự động (`src/scripts/test_cooked_feedback.ts`)
- **Tổng số test cases**: 23/23 tests
- **Tỷ lệ thành công**: 100% PASS
  - ✓ Chặn rating ngoài 1..5 và thiếu tên người nấu (HTTP 400).
  - ✓ Khách gửi feedback kèm ảnh -> tự động vào hàng đợi `PENDING`.
  - ✓ Độc giả có session gửi phản hồi -> gắn `userId` chuẩn xác.
  - ✓ API công khai lọc sạch bài `PENDING`, chỉ hiển thị bài `APPROVED`.
  - ✓ Phân quyền: chặn `COOK` vào dashboard kiểm duyệt (HTTP 403).
  - ✓ `EDITOR` duyệt feedback kèm ảnh -> xuất hiện tức thì trên trang công thức.
  - ✓ Tính năng Upsert chống spam: cập nhật đánh giá cũ thay vì duplicate bản ghi.

---

## 4. Tuyên bố Hoàn thành Gate P5
- Toàn bộ 4 năng lực của Phase P5:
  - **AG-31**: Đóng góp công thức cộng đồng (Contributor submissions).
  - **AG-32**: Báo cáo vi phạm & Hàng đợi gỡ bài (Abuse moderation).
  - **AG-33**: Biến thể vùng miền & Câu chuyện bếp nhà (Regional variants & Kitchen stories).
  - **AG-34**: Nấu thử & Ảnh đĩa cơm gia đình (Cooked-it feedback & Community photos).
- **CHÍNH THỨC ĐẠT CHUẨN TOÀN BỘ TIÊU CHÍ GATE P5: Mạng lưới Bếp Nhà Cộng Đồng có kiểm duyệt an toàn, tôn trọng bản sắc văn hóa và không bị biến tướng thành mạng xã hội rác!**
