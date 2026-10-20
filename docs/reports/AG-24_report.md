# AG-24 Report — SEO & Index Boundaries (Sitemap động, Robots.txt & Recipe JSON-LD)

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, sẵn sàng đóng ticket**.

---

## 1. Summary
Đã triển khai hoàn chỉnh hệ thống SEO và ranh giới lập chỉ mục (`SEO & Index Boundaries`) cho ứng dụng Ăn Gì Mom theo tiêu chuẩn Next.js 16 App Router và Google Search Central:
- **Tập tin chỉ dẫn robots (`src/app/robots.ts`)**:
  - Tự động sinh `robots.txt` tại `/robots.txt`.
  - Mở cửa (`allow: '/'`) cho tất cả công cụ tìm kiếm hợp lệ cào dữ liệu các trang công khai (`/`, `/mon-an`, `/cong-thuc/*`, `/meal`, `/da-luu`, `/shopping`).
  - Chặn triệt để (`disallow`) các khu vực nội bộ/quản trị: `/editor/`, `/api/`, `/login`.
  - Khai báo chính xác đường dẫn sitemap: `https://angimom.vn/sitemap.xml`.
- **Sitemap động (`src/app/sitemap.ts`)**:
  - Tự động sinh `sitemap.xml` tại `/sitemap.xml` theo chuẩn Sitemaps.org.
  - Bao gồm các URL trang tĩnh trọng điểm (`/`, `/mon-an`, `/meal`, `/da-luu`, `/shopping`).
  - Truy vấn cơ sở dữ liệu thời gian thực cho danh sách công thức: **Tuân thủ nghiêm ngặt Invariants §5.1**, chỉ đưa các công thức có trạng thái `PUBLISHED` vào sitemap. Loại bỏ 100% bản `DRAFT` và `ARCHIVED`.
  - Ghi nhận `lastModified` chuẩn xác từ thời gian cập nhật công thức (`updatedAt` hoặc `publishedAt`).
- **Dữ liệu có cấu trúc Schema.org Recipe JSON-LD (`src/components/seo/RecipeJsonLd.tsx`)**:
  - Nhúng thẻ `<script type="application/ld+json">` chuẩn mực vào trang chi tiết công thức (`/cong-thuc/[slug]`).
  - Chuẩn hóa thời gian nấu nướng sang định dạng ISO 8601 (`PT...`) qua hàm `minutesToIsoDuration()` (ví dụ: `15` phút $\to$ `PT15M`, `75` phút $\to$ `PT1H15M`).
  - Khai báo đầy đủ thuộc tính phong phú cho Google Recipe Rich Results: `name`, `description`, `image`, `author`, `datePublished`, `recipeYield`, `prepTime`, `cookTime`, `totalTime`, `recipeCuisine: 'Vietnamese'`, `recipeIngredient`, `recipeInstructions` (`HowToStep`).
  - Bảo mật chuỗi JSON chống tấn công Cross-Site Scripting (XSS) qua cơ chế serialize an toàn (`replace(/</g, '\\u003c')`).

## 2. Invariants & Usability Verified
- **Invariants §5.1 (Chỉ hiển thị món PUBLISHED)**:
  - Ranh giới lập chỉ mục được kiểm soát tuyệt đối: robots và sitemap không bao giờ để lộ các công thức bản nháp (`DRAFT`) hoặc lưu trữ (`ARCHIVED`) ra ngoài công cụ tìm kiếm.
- **Invariants §6.7 (Offline-friendly & Trải nghiệm công khai)**:
  - Khách vãng lai và bot tìm kiếm tiếp cận nội dung nhanh chóng, metadata và JSON-LD được render ngay từ server-side giúp tối ưu SEO và tốc độ lập chỉ mục.
- **Tiêu chuẩn dữ liệu Google Search Console**:
  - Schema Recipe hợp lệ theo tài liệu hướng dẫn Google Search Central Recipe Rich Results.

## 3. Changed & Created Files
- `src/app/robots.ts`: Metadata route handler sinh `robots.txt` với ranh giới disallow rõ ràng.
- `src/app/sitemap.ts`: Metadata route handler sinh `sitemap.xml` động từ cơ sở dữ liệu.
- `src/components/seo/RecipeJsonLd.tsx`: Component sinh JSON-LD Schema.org Recipe an toàn và hàm chuyển đổi ISO 8601 duration.
- `src/app/cong-thuc/[slug]/page.tsx`: Tích hợp `RecipeJsonLd` vào trang chi tiết món ăn công khai.
- `src/scripts/test_seo_boundaries.ts`: Kịch bản kiểm thử tự động cho ranh giới SEO, robots, sitemap, ISO duration parser và JSON-LD structure.

## 4. Test & Verification Results
- `npx tsx src/scripts/test_seo_boundaries.ts`: **37/37 PASS** (Robots rules, sitemap generation, lọc DRAFT/ARCHIVED, ISO duration, Schema.org Recipe JSON-LD, XSS escape).
- `npx tsx src/scripts/test_shopping_checklist.ts`: **22/22 PASS** (Không hồi quy AG-23).
- `npx tsx src/scripts/test_ingredient_aggregation.ts`: **37/37 PASS** (Không hồi quy AG-22).
- `npx tsx src/scripts/test_meal_composition.ts`: **37/37 PASS** (Không hồi quy AG-21).
- `npx tsx src/scripts/test_saved_recipes.ts`: **25/25 PASS** (Không hồi quy AG-20).
- `npx tsc --noEmit -p .`: PASS 100% không có lỗi kiểu dữ liệu.
- `npm run build`: PASS 100% (34/34 routes biên dịch tối ưu bao gồm `○ /robots.txt` và `ƒ /sitemap.xml`).

## 5. Next Steps
Chuyển sang ticket tiếp theo trong Phase P3:
- **AG-25 (Staging deploy & observability)**: Đảm bảo Dockerfile production, thiết lập cấu hình container/proxy (Caddy), endpoint `/api/health` kiểm tra kết nối DB, và structured logging cơ bản.
