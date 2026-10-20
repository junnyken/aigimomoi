# AG-17 Report — Search & Filters

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, sẵn sàng đóng ticket**.

---

## 1. Summary
Trang tìm kiếm và khám phá món ăn tập trung `/mon-an` đã được xây dựng và tích hợp thành công, đánh dấu bước khởi đầu vững chắc của **Phase P3 — MVP bữa cơm và đi chợ**. Người dùng có thể tìm kiếm công thức theo tên/mô tả, lọc theo vai trò món (`MAIN`, `SOUP`, `SIDE`...), thời gian nấu tối đa, độ khó, huy hiệu kiểm chứng ("Đã nấu thử", "Dinh dưỡng đã kiểm"), phương pháp chế biến và vùng miền. Toàn bộ trạng thái tìm kiếm được đồng bộ trung thực lên URL search parameters. Hero banner trang chủ `/` và navigation layout đã được tích hợp liên kết mượt mà sang `/mon-an`.

## 2. Security & Invariants Verified
- **Chỉ công thức `PUBLISHED` được xuất hiện**: Các bản ghi `DRAFT`, `SUBMITTED`, `NEEDS_CHANGES`, hoặc `ARCHIVED` bị loại bỏ 100% khỏi kết quả tìm kiếm và bộ lọc.
- **An toàn truy vấn SQL**: Sử dụng parameterized query qua Drizzle ORM (`sql` template, `ilike` escape), chống triệt để SQL Injection khi tìm từ khóa có ký tự đặc biệt (`%`, `_`, `'`, `\`).
- **Bảo mật dữ liệu công khai**: Payload trả về qua `PublicRecipeCard` chỉ chứa các trường cho phép hiển thị, không rò rỉ `authorId`, email, hay `reviewNotes`.
- **URL phản ánh trung thực (§6.7)**: Mọi thao tác tìm kiếm và thay đổi bộ lọc đều được phản ánh lên URL (`?q=...&role=...&maxTime=...&tested=...`), hỗ trợ deep link, bookmark và nút Back/Forward mà không mất trạng thái.
- **Trạng thái giao diện đầy đủ (§6.8)**: Có `ActiveFilterChips` hiển thị các tiêu chí đang lọc với nút xóa nhanh từng tiêu chí và "Xóa tất cả", `SearchEmptyState` thân thiện khi không có kết quả, và Skeleton loading khi đang tải dữ liệu.

## 3. Kiến trúc kỹ thuật (Next.js 16 + Partial Prerendering)
- `src/lib/recipes/searchQueries.ts`: Engine truy vấn thuần DB, lọc đa trục linh hoạt, đếm `totalCount` và phân trang chuẩn xác (`limit`, `offset`), cung cấp `getSearchFilterMeta` để hiển thị số lượng món theo từng vai trò và danh mục taxonomies thực tế.
- Tận dụng chuẩn Partial Prerendering (PPR) của Next.js 16: Trang `/mon-an/page.tsx` prerender tĩnh phần Page Header (Shell) và bọc toàn bộ nội dung động phụ thuộc `searchParams` bên trong `<Suspense fallback={<SearchResultsSkeleton />}>`.
- Hỗ trợ responsive toàn diện: Desktop hiển thị sidebar bộ lọc dính (sticky w-64); Mobile có nút mở Filter Drawer mượt mà (`SearchFilterSheet`).

## 4. Changed & Created Files
- `src/lib/recipes/searchQueries.ts`: Engine tìm kiếm, lọc đa trục, và đếm số lượng bộ lọc.
- `src/lib/recipes/labels.ts`: Bổ sung nhãn sắp xếp (`SORT_LABELS`) và khoảng thời gian (`TIME_PRESETS`).
- `src/components/search/SearchInput.tsx`: Ô tìm kiếm có debounce, nút clear và nút tìm.
- `src/components/search/RoleFilterTabs.tsx`: Thanh tab chọn nhanh vai trò món trong bữa ăn.
- `src/components/search/FilterSidebar.tsx`: Bộ lọc chi tiết cho desktop và mobile drawer.
- `src/components/search/SearchFilterSheet.tsx`: Drawer bộ lọc cho màn hình di động.
- `src/components/search/ActiveFilterChips.tsx`: Thanh hiển thị nhãn lọc đang kích hoạt.
- `src/components/search/SearchEmptyState.tsx`: Giao diện khi không có kết quả tìm kiếm.
- `src/components/search/SearchPagination.tsx`: Điều hướng phân trang theo URL.
- `src/app/mon-an/page.tsx`: Server component trang tìm kiếm với SEO metadata động và PPR Suspense.
- `src/app/page.tsx`: Cập nhật Hero với form tìm kiếm nhanh trỏ sang `/mon-an` và link khám phá tất cả.
- `src/app/layout.tsx`: Thêm nav link "Tìm món" (`/mon-an`) và cập nhật footer Phase P3.
- `src/scripts/test_search_filters.ts`: Kịch bản kiểm thử tự động toàn diện.

## 5. Test & Verification Results
- `npx tsx src/scripts/test_search_filters.ts`: **36/36 PASS** (100% test cases đạt: Invariants PUBLISHED, keyword search, role filter, time filter, difficulty filter, verification badges, composite filter, sorting, pagination).
- `npx tsx src/scripts/test_public_rendering.ts`: **31/31 PASS** (Không gây bất kỳ regression nào cho AG-16).
- `npx tsc --noEmit -p .`: PASS 100% không có lỗi TypeScript.
- `npm run build`: PASS 100% (Route `◐ /mon-an` biên dịch thành công dưới dạng Partial Prerender).

## 6. Next Steps
Chuyển sang ticket tiếp theo trong Phase P3: **AG-18 (Serving adjustment)** — Điều chỉnh khẩu phần ăn động cho công thức công khai và trang nấu theo quy tắc Invariants §5.4 (D21).
