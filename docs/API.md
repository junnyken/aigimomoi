# API — Hợp đồng Giao tiếp & Quy ước Endpoint

**Trạng thái:** `approved` tại AG-02 (20/10/2026). Sẽ được hiện thực hóa chi tiết theo từng MINI-SPEC từ P2 (AG-09) trở đi.

---

## 1. Phong cách Kiến trúc (Architecture Style)
- Sử dụng **Next.js App Router**:
  - **Server Actions** cho các thao tác gửi biểu mẫu, tạo sửa dữ liệu nội bộ (Type-safe qua Zod schema, bảo mật tự động với CSRF token của Next.js).
  - **Route Handlers (`/api/...`)** cho các truy vấn dữ liệu công khai, tìm kiếm nhanh và webhook.
- Định dạng dữ liệu: JSON chuẩn cho request/response.
- Mã lỗi HTTP chuẩn (200, 201, 400, 401, 403, 404, 500) kèm phản hồi có cấu trúc:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Dữ liệu nhập không hợp lệ",
      "details": [{ "field": "servings", "message": "Khẩu phần phải lớn hơn 0" }]
    }
  }
  ```

---

## 2. Quy ước Phân quyền & Endpoint (RBAC & Boundaries)

| Tuyến đường (Route) | Thao tác | Quyền hạn | Mô tả |
|---|---|---|---|
| `GET /api/recipes` | Đọc danh sách | Khách (Guest) | Chỉ trả về các bản ghi `RecipePublishStatus === PUBLISHED` |
| `GET /api/recipes/:slug` | Đọc chi tiết | Khách (Guest) | Chi tiết công thức, snapshot nguyên liệu, các bước nấu |
| `POST /api/recipes/:id/save` | Lưu món yêu thích | Thành viên (Member) | Lưu công thức vào danh sách cá nhân |
| `GET /api/meal-plan` | Lấy thực đơn | Thành viên (Member) | Bữa ăn đã ghép và danh sách đi chợ |
| `POST /api/admin/recipes` | Tạo/sửa nháp | Quản trị (Admin/Editor) | Quản lý bản nháp, revision |
| `POST /api/admin/recipes/:id/publish` | Duyệt xuất bản | Quản trị (Admin) | Xuất bản công thức, ghi nhật ký ModerationEvent |

*Quy tắc bất biến:*
1. Phân quyền kiểm tra chặt chẽ ở Server-side; không tin tưởng client.
2. Tuyệt đối không để lộ dữ liệu chưa duyệt (`DRAFT`, `SUBMITTED`, `ARCHIVED`) ra API công khai.
3. Không trả về thông tin nhạy cảm (email, session hash, secret keys) trong payload công thức.
