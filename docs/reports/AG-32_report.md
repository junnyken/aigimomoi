# Báo Cáo Nghiệm Thu AG-32 — Content Moderation, Abuse Reports & Resubmission

| Thông tin | Giá trị |
|---|---|
| Mã công việc | **AG-32** |
| Phân hệ | P5 — Cộng đồng và Văn hóa Món ăn |
| Ngày hoàn thành | 21/10/2026 |
| Trạng thái | **ACCEPTED & CLOSED** |
| Bộ kiểm thử | `src/scripts/test_recipe_moderation.ts` (20/20 PASS, 100%) |

---

## 1. Mục tiêu Đã Đạt Được
- **Cơ chế báo cáo vi phạm nội dung mở**: Độc giả (kể cả khách vãng lai) có thể gửi báo cáo vi phạm công thức tại `/cong-thuc/[slug]` thông qua modal `ReportRecipeModal` với các lý do: An toàn thực phẩm, Sai lệch công thức, Vi phạm bản quyền, Ngôn từ không phù hợp hoặc lý do khác.
- **Hàng đợi kiểm duyệt chuyên dụng cho Ban biên tập**: Giao diện `/editor/reports` cho phép Ban biên tập (`EDITOR`, `ADMIN`) xem thống kê và phân loại các báo cáo theo trạng thái (`PENDING`, `RESOLVED`, `DISMISSED`).
- **Thao tác xử lý vi phạm & Gỡ bài an toàn (Takedown)**: Biên tập viên có thể kích hoạt hành động Takedown, ngay lập tức chuyển công thức về trạng thái `NEEDS_CHANGES`, lưu vết lý do góp ý vào `reviewNotes`, đồng thời đánh dấu báo cáo là `RESOLVED`.
- **Luồng tác giả sửa và nộp lại**: Công thức bị gỡ sẽ lập tức ẩn khỏi trang chủ công khai (Invariants §5.1), tác giả được xem hướng dẫn sửa đổi trong Bếp Nhà, cập nhật và gửi lại vào hàng chờ duyệt.

---

## 2. Invariants Gate P5 Đã Xác Minh & Bảo Toàn
1. **Public Safety Reporting**: Báo cáo an toàn thực phẩm mở cho cả khách vãng lai mà không ép buộc đăng nhập, nhưng lưu đúng `reporterId` nếu người gửi có session.
2. **Access Control**: Chỉ vai trò `EDITOR` hoặc `ADMIN` mới được quyền truy cập `/api/editor/reports` và `/editor/reports`. Người dùng thường (`role = COOK`) bị từ chối với HTTP 403 Forbidden.
3. **Audit Trail Đầy Đủ**: Mọi hành động giải quyết báo cáo và gỡ bài đều lưu lại định danh biên tập viên (`resolvedById`), thời gian xử lý (`resolvedAt`) và ghi chú (`moderatorNotes`).
4. **Bảo Vệ Độc Giả (Invariants §5.1)**: Ngay khi biên tập viên thực hiện Takedown, công thức chuyển sang `NEEDS_CHANGES` và biến mất 100% khỏi danh mục công khai (`queryPublishedRecipeBySlug` trả về `null`).

---

## 3. Kết Quả Kiểm Thử Tự Động (`src/scripts/test_recipe_moderation.ts`)
| STT | Kịch bản kiểm thử | Kết quả |
|---|---|---|
| 1 | Khách vãng lai gửi báo cáo an toàn thực phẩm không cần login | ✓ PASS |
| 2 | Thành viên đã đăng nhập gửi báo cáo vi phạm bản quyền (gắn đúng `reporterId`) | ✓ PASS |
| 3 | Chặn báo cáo thiếu lý do hoặc không hợp lệ (HTTP 400 Bad Request) | ✓ PASS |
| 4 | Chặn vai trò `COOK` truy cập hàng đợi kiểm duyệt (HTTP 403 Forbidden) | ✓ PASS |
| 5 | Biên tập viên xem danh sách hàng đợi báo cáo (`status = PENDING`) | ✓ PASS |
| 6 | Biên tập viên xử lý Takedown công thức vi phạm về `NEEDS_CHANGES`, lưu `reviewNotes` | ✓ PASS |
| 7 | Invariants §5.1: Công thức bị gỡ biến mất khỏi catalog công khai | ✓ PASS |
| 8 | Tác giả xem góp ý của BTV, chỉnh sửa nội dung và nộp lại thành công | ✓ PASS |

**Tổng kết**: 20/20 assertions PASS (100%). TypeScript build sạch (`npx tsc --noEmit` code 0).
