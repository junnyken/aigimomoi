# AG-16 Report — Public Recipe Rendering

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Người đọc xem được công thức `PUBLISHED` thật từ DB tại `/cong-thuc/[slug]` mà không cần đăng nhập. Trang chủ bỏ mảng fixture cứng, chỉ liệt kê công thức đã xuất bản (có empty state). Bản chưa công khai trả **404 thật**, link tới phiên bản `ARCHIVED` được **308** sang bản hiện hành (D35, D36). Hoàn tất vòng **Gate P2: tạo → kiểm → xuất bản → đọc lại**.

## 2. Security & Invariants Verified
- **Chỉ `PUBLISHED` là công khai**: DRAFT/SUBMITTED/NEEDS_CHANGES/APPROVED cho cùng phản hồi 404 với slug không tồn tại (không tiết lộ sự tồn tại).
- **Allow-list cột công khai** (`publicQueries.ts`): không email tác giả, không ghi chú duyệt, không `reviewedById`/`status`.
- **Không render HTML từ dữ liệu**: 0 `dangerouslySetInnerHTML`; ảnh chỉ nhận `/uploads/...` hoặc `https://` (chặn `javascript:`, `data:`, protocol-relative, path traversal).
- **Nhãn trung thực (D23)**: badge chỉ hiện khi cờ `true`; calo chỉ hiện khi `nutritionStatus = ESTIMATED`.
- **Làm tròn chỉ ở hiển thị (D21)**: `Intl.NumberFormat` tối đa 2 chữ số thập phân; giá trị gốc không đổi.
- **Slug & URL**: slug kiểm regex + độ dài trước khi truy vấn; percent-encoding hỏng → 400.

## 3. Kiến trúc render (Next 16, Cache Components + Partial Prefetching)
- Dữ liệu đọc qua `'use cache'` + `cacheTag('public-recipes')` + `cacheLife('days')`; route `POST /api/recipes/[id]/publish` gọi `revalidateTag('public-recipes', { expire: 0 })` để bản mới/redirect có hiệu lực ngay.
- Partial Prefetching stream app shell (200) trước khi `notFound()` chạy → chỉ có "soft 404". Vì vậy quyết định 404/308 đặt trong **`src/proxy.ts`** (một truy vấn theo index unique `slug`) trước khi render; slug không công khai được rewrite sang trang placeholder `/cong-thuc/_khong-tim-thay` (prerender tĩnh thành 404).
- **Đổi `src/middleware.ts` → `src/proxy.ts`**: convention cũ chạy Edge runtime (không có module `net`, không kết nối Postgres được); `proxy.ts` chạy Node runtime. Guard `/editor`, `/admin` giữ nguyên.
- `generateStaticParams` trả placeholder để build không cần DB (Docker build không có DB); trang chủ đọc danh sách sau `connection()` trong `<Suspense>`.

## 4. Changed & Created Files
- `src/lib/recipes/publicQueries.ts`: truy vấn thuần (chi tiết, lineage ARCHIVED → bản hiện hành, danh sách thẻ, resolve slug cho proxy, `safeImageSrc`).
- `src/lib/recipes/public.ts`: lớp cache Next.js.
- `src/lib/recipes/labels.ts`: nhãn & định dạng hiển thị, hằng route.
- `src/app/cong-thuc/[slug]/page.tsx`, `not-found.tsx`: trang công khai + 404 thân thiện.
- `src/components/recipe/*`: `IngredientList`, `StepList`, `VerificationBadges`, `NutritionNotice`, `RecipeCard`.
- `src/app/page.tsx`: trang chủ dùng dữ liệu thật, skeleton + empty state.
- `src/proxy.ts` (đổi tên từ `middleware.ts`): gate slug công khai.
- `src/app/api/recipes/[id]/publish/route.ts`: revalidate cache sau khi duyệt.
- `src/app/editor/recipes/[id]/page.tsx`: nút "Xem trang công khai".
- `src/scripts/test_public_rendering.ts`: kiểm thử.

## 5. Test & Verification Results
- `npx tsx src/scripts/test_public_rendering.ts` với `PUBLIC_BASE_URL` trỏ server standalone: **39 PASS, 0 FAIL** (tầng truy vấn + HTTP: 200 / 404 / 404 / 308, trang chủ).
- `test_publishing_gate.ts` (AG-15) vẫn pass; `tsc --noEmit` sạch; `npm run build` thành công.
- Kiểm tra HTML render: đủ hero, nhãn, nguyên liệu (nhóm tuỳ chọn, dấu nêm theo khẩu vị), các bước theo giai đoạn, dinh dưỡng, canonical + og:image; trang 404 nằm trong layout, có `noindex`.
- Kiểm tra bằng mắt: trình duyệt tự động không chạy được trong môi trường (không tải được Playwright driver) — chủ sản phẩm kiểm tra thủ công.

## 6. Known Limitations / Follow-ups
- Mỗi request `/cong-thuc/*` tốn một truy vấn index trong proxy (không cache) — chấp nhận cho MVP; có thể thêm cache ngắn hạn ở AG-25.
- `metadataBase` chưa đặt (OG URL tuyệt đối) → AG-24 SEO.
- Nút hero trang chủ vẫn trỏ prototype `localhost:8090` (thuộc AG-21/23).

## 7. Next Steps
Chủ sản phẩm duyệt đóng AG-16 và **Gate P2**, chuyển sang P3: AG-17 Search & filters, AG-18 Serving adjustment.
