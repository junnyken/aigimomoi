# AG-14 Report — Media Pipeline & Image Storage

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã hoàn thành toàn diện Media Pipeline và cơ chế lưu trữ hình ảnh cho ĂN GÌ MOM. Xây dựng module lưu trữ an toàn `src/lib/storage/index.ts` kết hợp API `/api/upload` (hỗ trợ cả upload và xóa tệp), component UI trực quan tái sử dụng `src/components/ui/ImageUpload.tsx`, tích hợp tải và xem trước ảnh đại diện món ăn (`heroImage`) cũng như ảnh từng bước nấu (`step.image`) trong các màn hình biên tập `/editor/recipes/new` và `/editor/recipes/[id]`. Cấu hình volume lưu trữ bền vững `uploads_data` trong `docker-compose.yml` đảm bảo tính di động cao trên VPS riêng của chủ sản phẩm (D17, D20).

## 2. Security & Infrastructure Boundaries Verified
- **Phân quyền RBAC**: Chỉ tài khoản có session hợp lệ với role `ADMIN` hoặc `EDITOR` mới có quyền gọi API tải tệp (`POST /api/upload`) hoặc xóa tệp (`DELETE /api/upload`).
- **Kiểm soát Content-Type & MIME**: Chỉ chấp nhận các định dạng ảnh phổ biến chuẩn web: `image/jpeg`, `image/png`, `image/webp`, `image/avif`. Từ chối mọi file thực thi hoặc script (.html, .js, .sh).
- **Giới hạn dung lượng**: Chặn tệp vượt quá 5MB (`MAX_FILE_SIZE = 5MB`).
- **Chống Directory Traversal & Ghi đè**: Tên tệp được sinh ngẫu nhiên bằng `crypto.randomUUID()` kết hợp timestamp; tham số thư mục con `subfolder` được làm sạch triệt để chỉ giữ các ký tự an toàn.
- **Lưu trữ độc lập (Self-hosted & Portable)**: Toàn bộ ảnh được lưu vào `public/uploads/` và được mount qua Docker Volume `uploads_data`, không phụ thuộc bất kỳ dịch vụ SaaS trả phí nào (D17, D20), đồng thời tuân thủ mẫu Adapter để sẵn sàng kết nối S3/Cloudflare R2 trong tương lai.

## 3. Changed & Created Files
- `src/lib/storage/index.ts`: Module xử lý lưu trữ tệp tin an toàn (`saveUploadedFile`, `deleteUploadedFile`).
- `src/app/api/upload/route.ts`: Endpoint `POST` (upload tệp multipart/form-data) và `DELETE` (xóa tệp cũ).
- `src/components/ui/ImageUpload.tsx`: Component UI tải ảnh có preview, hiển thị spinner khi upload, nút gỡ ảnh và thông báo lỗi.
- `src/app/editor/recipes/new/page.tsx`: Tích hợp `ImageUpload` cho ảnh bìa món ăn và ảnh minh họa từng bước nấu.
- `src/app/editor/recipes/[id]/page.tsx`: Tích hợp `ImageUpload` cho màn hình xem & chỉnh sửa công thức.
- `docker-compose.yml`: Bổ sung volume `uploads_data:/app/public/uploads` cho container `web`.
- `public/uploads/recipes/.gitkeep` & `.gitignore`: Thiết lập cấu trúc thư mục và loại trừ ảnh tải lên khỏi Git tracking.
- `src/scripts/test_upload_pipeline.ts`: Script kiểm thử tự động kiểm tra lưu trữ, xóa tệp, chặn dung lượng vượt ngưỡng, chặn MIME type độc hại và chống Directory Traversal.
- `docs/reports/AG-14_report.md`: Báo cáo nghiệm thu này.
- `docs/DECISIONS.md`: Bổ sung D34.
- `docs/TEST_LOG.md`: Ghi nhận log kiểm thử AG-14.
- `docs/ROADMAP.md`: Cập nhật AG-14 thành `awaiting-close`.

## 4. Test & Verification Results
- **Automated Storage Tests**: Chạy `npx tsx src/scripts/test_upload_pipeline.ts` vượt qua 100% 5 trường hợp kiểm thử:
  1. Lưu trữ ảnh hợp lệ trên đĩa cứng: PASS.
  2. Xóa ảnh an toàn: PASS.
  3. Chặn tệp vượt quá 5MB: PASS.
  4. Chặn tệp không đúng MIME type (text/html): PASS.
  5. Chống Directory Traversal: PASS.
- **Production Next.js Build**: `npm run build` thành công rực rỡ với 15 routes sạch lỗi (exit code 0).

## 5. Next Steps
Chủ sản phẩm duyệt đóng AG-14 để chuyển sang:
- **AG-15 Publishing & revision gate**: Hoàn tất quy trình duyệt xuất bản (`SUBMITTED` -> `APPROVED` -> `PUBLISHED`), kiểm soát phiên bản sửa đổi (Revision snapshot) và phân quyền duyệt bài.
- **AG-16 Public recipe rendering**: Xây dựng trang hiển thị công thức công khai động bằng Next.js App Router (thay thế cho prototype tĩnh).
- Nghiệm thu Gate P2.
