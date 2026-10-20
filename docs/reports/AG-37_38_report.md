# Báo cáo Nghiệm thu Kỹ thuật AG-37 & AG-38: Family Meal Diary & Summaries

**Mã ticket**: AG-37 (Consumed portions & diary snapshots) & AG-38 (Daily summaries, family privacy & export/delete)  
**Thuộc Phase**: P6 — Dinh dưỡng và Nhật ký gia đình (Nghiệm thu toàn bộ Gate P6)  
**Trạng thái**: `HOÀN TẤT & ĐẠT CHUẨN 100%`  
**Ngày hoàn thành**: 21/10/2026  

---

## 1. Mục tiêu Đã Thực Hiện
- Cung cấp tính năng **Nhật Ký Bữa Ăn Gia Đình** (`/nhat-ky`) giúp các gia đình theo dõi lượng thực phẩm và mức năng lượng tiêu thụ hàng ngày.
- **Thực thi Invariant Gate P6:**
  - **Lượng đã ăn khác lượng đã nấu:** Cho phép người dùng ghi nhận khẩu phần thực tế (`0.5`, `1.0`, `1.5`, `2.0` phần) và phân chia theo từng thành viên (`Bố`, `Mẹ`, `Bé Bo`).
  - **Snapshot Bất biến chống Hồi tố:** Dinh dưỡng tại thời điểm ăn được lưu trữ cố định, không bị thay đổi hồi tố khi công thức gốc có bản sửa đổi mới.
  - **Dữ liệu thiếu không thành 0:** Bảo toàn giá trị `null` đối với các chất chưa có dữ liệu kiểm định.
- **Tổng hợp Ngày & Cảnh báo Sức khỏe (AG-38):**
  - Tự động cộng dồn Calo, Đạm, Béo, Tinh bột, Natri và Chất xơ theo 4 bữa ăn: Sáng, Trưa, Tối, Phụ.
  - Đối chiếu với Khuyến nghị Nhu cầu Dinh dưỡng cho người Việt Nam (RDA Viện Dinh Dưỡng): Tự động phát hiện và cảnh báo khi lượng Natri/muối nạp vào vượt ngưỡng 2000mg/ngày.
- **Chính sách Quyền Riêng tư & Quản lý Dữ liệu:**
  - Bảo mật riêng tư tuyệt đối giữa các tài khoản người dùng.
  - Cung cấp tính năng Xuất dữ liệu gia đình dạng file JSON (`/api/diary/export`).
  - Cung cấp quyền được lãng quên: Xóa từng món hoặc xóa toàn bộ lịch sử ăn uống (`/api/diary/clear`).

---

## 2. Các Thành phần Kỹ thuật Đã Triển khai
1. **Database Migration**:
   - `drizzle/0009_ag37_38_meal_diary.sql`:
     - Enum `diary_meal_type` (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`).
     - Bảng `meal_diary_entries` với các chỉ mục: `(user_id)`, `(user_id, diary_date)`, `(recipe_id)`.
2. **API Routes**:
   - `GET /api/diary?date=YYYY-MM-DD`: Lấy danh sách món theo bữa và bảng tổng hợp ngày.
   - `POST /api/diary`: Ghi món vào nhật ký kèm tính toán khẩu phần.
   - `DELETE /api/diary/[id]`: Xóa món ăn khỏi nhật ký (có kiểm tra quyền sở hữu).
   - `GET /api/diary/export`: Tải file JSON toàn bộ lịch sử ăn uống.
   - `DELETE /api/diary/clear`: Xóa sạch nhật ký của tài khoản.
3. **Frontend Page**:
   - `src/app/nhat-ky/page.tsx`: Giao diện nhật ký bữa ăn gia đình có thanh theo dõi Calo, tỷ lệ Macro P/F/C %, phân bổ 4 bữa ăn và modal thêm món nhanh.
   - Thêm nút *"Nhật ký"* trên thanh điều hướng chính (`src/app/layout.tsx`).

---

## 3. Kết quả Kiểm thử Tự động (`src/scripts/test_meal_diary.ts`)
- **Tổng số test cases**: 25/25 tests
- **Tỷ lệ thành công**: 100% PASS
  - ✓ Chặn khách vãng lai chưa đăng nhập (HTTP 401).
  - ✓ Tính đúng Kcal và Macro cho Bố (1.5 phần) và Bé Bo (0.5 phần).
  - ✓ Snapshot dinh dưỡng không bị ảnh hưởng khi sửa công thức gốc.
  - ✓ Tính tổng calo và phát hiện cảnh báo khi Natri > 2000mg.
  - ✓ Cô lập dữ liệu: Gia đình B không xem và không xóa được dữ liệu của Gia đình A.
  - ✓ Xóa món cập nhật calo ngày chính xác.
  - ✓ Xuất file JSON đầy đủ cấu trúc metadata và dữ liệu.
  - ✓ Xóa sạch lịch sử nhật ký thành công (Right to be forgotten).

---

## 4. Tuyên bố Hoàn thành Gate P6
- Toàn bộ 4 năng lực của Phase P6:
  - **AG-35**: Nutrition source audit, data mapping & licensing.
  - **AG-36**: Recipe nutrition calculation & missing-data rules.
  - **AG-37**: Consumed portions & diary snapshots.
  - **AG-38**: Daily summaries, privacy & export/delete policy.
- **CHÍNH THỨC ĐẠT CHUẨN TOÀN BỘ TIÊU CHÍ GATE P6: Dinh dưỡng Y học Có Kiểm định, Lượng ăn thực tế tách biệt lượng nấu, Dữ liệu thiếu không thành 0, Snapshot bất biến và Nhật ký Bữa cơm Gia đình riêng tư an toàn!**
