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

---

## 3. Danh sách Endpoint Đã Triển Khai Thực Tế (`src/app/api/`, cập nhật 22/11/2026)

- **Xác thực & Tài khoản (`/api/auth/*`, `/api/user/*`):** `login`, `admin-login`, `register`, `logout`, `me`, `forgot-password`, `reset-password`, `profile`, `change-password`.
- **Công thức & Cộng đồng (`/api/recipes/*`, `/api/contribute/*`, `/api/creator/*`, `/api/bundles/*`):**
  - `GET/POST /api/recipes`, `GET/PUT/DELETE /api/recipes/[id]`, `POST .../publish`, `.../reject`, `.../revisions`, `.../nutrition`, `.../pantry-check`, `.../report`, `GET/POST .../feedback`, `POST .../claim`.
  - `POST /api/bundles/[id]/claim`, `GET/POST /api/creator/bundles`, `GET/PUT /api/creator/profile`, `PATCH /api/creator/recipes/[id]/pricing`.
  - `GET/POST /api/contribute/recipes`, `GET/PUT/DELETE /api/contribute/recipes/[id]`.
- **Mâm cơm, Đi chợ & Lưu món (`/api/meal/*`, `/api/shopping/*`, `/api/saved-recipes/*`):**
  - `GET /api/meal/options`, `GET /api/meal/random`, `POST /api/meal/aggregate`.
  - `POST /api/shopping/sessions` (tạo phiên giỏ đi chợ đồng bộ PostgreSQL 24h) & `GET/PATCH /api/shopping/sessions/[token]` (lấy/đồng bộ trạng thái món đã tick & đồ mua thêm).
  - `GET/POST/DELETE /api/saved-recipes`, `POST /api/saved-recipes/cards`, `POST /api/saved-recipes/sync`.
- **AI Gateway (`/api/ai/*`):**
  - `POST /api/ai/food-scanner` (3 chế độ `MEAL` / `FRIDGE` / `LABEL`, Gemini Vision + OpenAI Vision + DeepSeek Text + FCT Fallback).
  - `POST /api/ai/meal-suggestion`, `POST /api/ai/recipe-draft`, `POST /api/ai/ingredient-nutrition`.
- **Tủ lạnh, Kế hoạch tuần & Nhật ký (`/api/pantry/*`, `/api/meal-plans/*`, `/api/diary/*`):**
  - `GET/POST /api/pantry`, `PUT/DELETE /api/pantry/[id]`, `POST /api/pantry/sync-from-shopping`.
  - `GET/POST /api/meal-plans`, `PUT/DELETE /api/meal-plans/[id]`, `POST .../log-to-diary`, `POST /api/meal-plans/to-shopping`.
  - `GET/POST /api/diary`, `DELETE /api/diary/[id]`, `GET /api/diary/export`, `DELETE /api/diary/clear`.
- **Biên tập, Từ điển, Media & Hạ tầng (`/api/editor/*`, `/api/ingredients/*`, `/api/taxonomies/*`):**
  - `GET /api/editor/overview`, `GET/PUT/POST /api/editor/ai-settings`, `PATCH /api/editor/creators/[userId]`, `POST /api/editor/daily-harvest`, `POST /api/editor/safety-audit`, `GET/PATCH /api/editor/feedbacks/[id]`, `GET/PATCH /api/editor/reports/[id]`, `GET/PATCH /api/editor/users/[id]`, `PATCH /api/editor/recipes/[id]/quick-badges`.
  - `GET/POST /api/ingredients`, `PUT/DELETE /api/ingredients/[id]`, `GET/POST /api/taxonomies`, `PUT/DELETE /api/taxonomies/[id]`, `POST/DELETE /api/upload`, `GET /api/health`.
