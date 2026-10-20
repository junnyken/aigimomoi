# Báo Cáo Nghiệm Thu AG-31 — Contributor Submissions

| Thông tin | Giá trị |
|---|---|
| Mã công việc | **AG-31** |
| Phân hệ | P5 — Cộng đồng và Văn hóa Món ăn |
| Ngày hoàn thành | 21/10/2026 |
| Trạng thái | **ACCEPTED & CLOSED** |
| Bộ kiểm thử | `src/scripts/test_contributor_submissions.ts` (19/19 PASS, 100%) |

---

## 1. Mục tiêu Đã Đạt Được
- **Mở cổng đóng góp công thức cộng đồng**: Thành viên có tài khoản (`role = 'COOK'`) có thể tự tay đóng góp công thức món ngon gia đình tại `/contribute/new` và quản lý danh sách tại `/contribute`.
- **Tái sử dụng Structured Recipe Editor**: Đảm bảo toàn bộ công thức do cộng đồng đóng góp vẫn chuẩn hóa cấu trúc định lượng (nguyên liệu, đơn vị đo lường, `scalePolicy` cho việc co giãn khẩu phần, các bước nấu có chia giai đoạn và canh thời gian).
- **Hỗ trợ AI Draft Pre-fill**: Contributor có thể dùng trợ lý AI để tạo khung sườn công thức nhanh từ gợi ý văn bản, sau đó tự điều chỉnh định lượng thực tế của gia đình.

---

## 2. Invariants Gate P5 Đã Xác Minh & Bảo Toàn
1. **Chặn Tuyệt Đối Tự Xuất Bản (No Instant Publishing)**:
   - Contributor không có quyền gán `status = 'PUBLISHED'`.
   - Bài nộp chỉ có 2 trạng thái: `DRAFT` (lưu nháp riêng) hoặc `SUBMITTED` (chuyển vào hàng đợi kiểm duyệt của Ban biên tập).
2. **Provenance & Attribution Minh Bạch**:
   - Trường `provenance` bắt buộc là `'COMMUNITY_SUBMITTED'`.
   - Trường `authorId` gắn chặt với `user.id` của người đóng góp.
   - Nhãn kiểm duyệt (`isEditorialReviewed`, `isCookTested`) mặc định là `false` và không thể bị sửa đổi bởi người dùng thường.
3. **Quyền Sở Hữu & Cô Lập Dữ Liệu An Toàn (Ownership Guard)**:
   - Người dùng A không thể truy cập, sửa đổi hoặc xóa bài đóng góp của Người dùng B (trả về HTTP 404/403).
   - Khi bài viết đã nộp vào hàng đợi (`SUBMITTED`), hệ thống khóa sửa đổi (HTTP 409 Conflict) nhằm tránh việc thay đổi nội dung sau lưng ban biên tập.
   - Khi ban biên tập yêu cầu sửa đổi (`NEEDS_CHANGES`), tác giả được mở quyền cập nhật và nộp lại thành công.

---

## 3. Kết Quả Kiểm Thử Tự Động (`src/scripts/test_contributor_submissions.ts`)
| STT | Kịch bản kiểm thử | Kết quả |
|---|---|---|
| 1 | Chặn truy cập API khi chưa đăng nhập (401 Unauthorized) | ✓ PASS |
| 2 | Contributor tạo bản nháp công thức gia đình (status = DRAFT) | ✓ PASS |
| 3 | Kiểm tra Invariants DB: provenance = COMMUNITY_SUBMITTED, authorId, flags = false | ✓ PASS |
| 4 | Danh sách công thức cá nhân và cô lập dữ liệu giữa 2 Contributor | ✓ PASS |
| 5 | Bảo vệ quyền sở hữu: Chặn Contributor 2 sửa hoặc xóa bài của Contributor 1 | ✓ PASS |
| 6 | Nộp bài vào Hàng đợi Kiểm duyệt (SUBMITTED) và kích hoạt khóa sửa đổi (409 Conflict) | ✓ PASS |
| 7 | Luồng Ban biên tập yêu cầu sửa (`NEEDS_CHANGES`) -> Tác giả cập nhật và nộp lại thành công | ✓ PASS |

**Tổng kết**: 19/19 assertions PASS (100%). TypeScript build sạch (`npx tsc --noEmit` code 0).
