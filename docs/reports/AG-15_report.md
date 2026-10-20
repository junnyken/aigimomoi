# AG-15 Report — Publishing & Revision Gate

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Hoàn thành cổng kiểm duyệt xuất bản và cơ chế phiên bản sửa đổi cho công thức. ADMIN duyệt các công thức `SUBMITTED` tại `/editor/recipes/review` với checklist Gate Check và 3 nhãn kiểm chứng (D23); có thể phê duyệt xuất bản hoặc trả về `NEEDS_CHANGES` kèm góp ý. Công thức `PUBLISHED` được sửa qua bản sửa đổi (version + 1) — bản đang chạy tiếp tục phục vụ người đọc cho tới khi bản mới được xuất bản, lúc đó bản cũ chuyển `ARCHIVED` bất biến (D21, D35).

## 2. Security & Invariants Verified
- **Phân quyền (D31)**: `publish`/`reject` chỉ `ADMIN`; `revisions` cho `EDITOR`/`ADMIN`.
- **Không bypass gate**: `PUT /api/recipes/[id]` chỉ nhận `DRAFT`/`SUBMITTED`; bản `ARCHIVED` và `PUBLISHED` không sửa trực tiếp được.
- **Race condition**: publish/revision chạy trong transaction với `SELECT ... FOR UPDATE`; reject đặt điều kiện trạng thái trong `WHERE`.
- **CSRF**: endpoint đổi trạng thái kiểm tra Same-Origin (fail-closed) — `src/lib/http/sameOrigin.ts`.
- **Lộ dữ liệu**: người không phải staff chỉ thấy công thức `PUBLISHED`, không thấy email tác giả; tham số `role`/`status` kiểm tra theo allow-list enum.
- **Thông tin đăng nhập**: gỡ mật khẩu hardcode khỏi `seed_catalog.ts` và trang `/login`; seed đọc `SEED_ADMIN_PASSWORD` / `SEED_EDITOR_PASSWORD` (>= 12 ký tự).

## 3. Changed & Created Files
- `src/lib/db/schema.ts`, `drizzle/0002_ag15_publishing_revision.sql`: cột `version_number`, `revision_of_id`, `review_notes`, `reviewed_by_id`, `reviewed_at`, `published_at` + index lineage.
- `src/lib/recipes/gate.ts`: Gate Check thuần (dùng chung API & UI), luật nhãn kiểm chứng.
- `src/lib/recipes/publishing.ts`: `publishRecipe`, `rejectRecipe`, `createRevision`.
- `src/app/api/recipes/[id]/{publish,reject,revisions}/route.ts`: API mới.
- `src/app/api/recipes/route.ts`, `src/app/api/recipes/[id]/route.ts`: harden GET/PUT/DELETE.
- `src/app/editor/recipes/review/page.tsx`: hàng đợi kiểm duyệt.
- `src/app/editor/recipes/[id]/page.tsx`, `src/app/editor/recipes/page.tsx`: badge phiên bản, banner `NEEDS_CHANGES`/`ARCHIVED`, nút tạo/mở bản sửa đổi, bộ lọc trạng thái mới.
- `src/lib/http/sameOrigin.ts`: guard CSRF tối thiểu.
- `src/lib/db/index.ts`, `src/scripts/seed_catalog.ts`, `.env.example`, `src/app/login/page.tsx`: sửa seed treo process, bỏ hardcode credentials.
- `src/scripts/test_publishing_gate.ts`: kiểm thử vòng đời.

## 4. Test & Verification Results
- `npx tsx src/scripts/test_publishing_gate.ts`: **22 PASS, 0 FAIL** (DRAFT → SUBMITTED → NEEDS_CHANGES → SUBMITTED → PUBLISHED v1 → REVISION v2 → PUBLISHED v2 / v1 ARCHIVED).
- `npx tsc --noEmit`: sạch lỗi.
- `npm run build`: thành công, 18 routes (exit code 0).

## 5. Known Limitations / Follow-ups
- CSRF mới ở mức Same-Origin; TODO double-submit token và rate limiting toàn cục.
- Trạng thái `APPROVED` chưa dùng (luồng hiện tại publish trực tiếp từ `SUBMITTED`).
- Tài khoản seed cũ dùng mật khẩu yếu đã bị xoá khỏi DB local; cần đặt `SEED_*` trong `.env` rồi chạy lại seed.

## 6. Next Steps
Chủ sản phẩm duyệt đóng AG-15 để chuyển sang **AG-16 Public recipe rendering** (hoàn tất Gate P2: tạo → kiểm → xuất bản → đọc lại).
