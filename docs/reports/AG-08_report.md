# AG-08 Report — Responsive & Usability Review (Gate P1 Sign-off)

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng và mở Gate P1**.

---

## 1. Summary
Đã hoàn thành rà soát toàn diện và tinh chỉnh responsive, khả năng tiếp cận (Accessibility WCAG 2.2 Level AA), kích thước vùng chạm cảm ứng (Touch Target Size $\ge 40-44\text{px}$), cấu trúc ngữ nghĩa HTML (SEO meta description, title, semantic tags) và thông suốt hành trình người dùng end-to-end trên toàn bộ 4 màn hình của Bản mẫu web tương tác ĂN GÌ MOM (`index.html`, `recipe.html`, `meal.html`, `shopping.html`).
Toàn bộ 5 năng lực của **Phase P1 (UX/UI và prototype)** gồm AG-04, AG-05, AG-06, AG-07, AG-08 đã sẵn sàng để chủ sản phẩm nghiệm thu đóng **Gate P1** và chuyển tiếp sang Phase P2 (Core Catalog & Next.js backend).

## 2. Audit Before Build & Gaps Resolved
- Xem chi tiết tại [mini-specs/AG-08.md](../mini-specs/AG-08.md).
- Gaps phát hiện và đã khắc phục qua công cụ tự động hóa `verify_ag08.py`:
  1. `recipe.html` ban đầu thiếu thẻ `<meta name="description">` và thẻ semantic `<footer>`: Đã bổ sung chuẩn SEO và semantic layout.
  2. Vùng chạm trên thiết bị di động (nút đổi khẩu phần `.serving-btn`, chips vai trò `.chip`, các nút bấm chính `.btn`): Đã chuẩn hóa đạt tối thiểu 40px - 44px theo WCAG 2.2 Criterion 2.5.8.
  3. Header trên màn hình nhỏ di động (<640px): Ẩn tagline phụ, co gọn padding thanh điều hướng để 3 liên kết "Khám phá", "Mâm cơm", "Đi chợ" dàn hàng ngang đẹp mắt không bị ngắt dòng.
  4. Banner mâm cơm và thanh tóm tắt chuẩn bị (`meal-summary-bar`): Tự động chuyển đổi dạng cột (stacked) trên mobile để người dùng thao tác một tay thuận tiện.

## 3. Design Choice
- **Responsive Breakpoints**:
  - **Mobile (<640px)**: Tối ưu cho người nội trợ cầm điện thoại 1 tay; Cooking Mode hiển thị nút bấm to (48px), thanh điều hướng bước nấu xếp dọc tiện bấm ngón cái; danh sách đi chợ thẻ to dễ tick.
  - **Tablet (640px - 1024px)**: Lưới 2 cột cân đối cho thẻ công thức và 3 món trong mâm cơm.
  - **Desktop (>1024px)**: Bố cục tối đa 1200px canh giữa màn hình sang trọng, màu kem ấm (`#FAF7F0`) kết hợp xanh lá bếp (`#3F6240`) và cam đất (`#B75B35`) tạo cảm giác bữa cơm gia đình đầm ấm.
- **Accessibility & Focus Indicators**:
  - Trạng thái `:focus-visible` sử dụng biến `--focus-ring` (3px viền xanh lá nhạt) giúp người dùng bàn phím dễ dàng nhận biết vị trí con trỏ.
  - Phím Escape hỗ trợ đóng Modal đổi món và Ngăn kéo tra cứu nguyên liệu nhanh.

## 4. Changed Files
- `prototype/recipe.html`: Bổ sung meta description chuẩn SEO và thẻ semantic footer.
- `prototype/styles/main.css`: Bổ sung quy tắc responsive chuyên sâu, kích thước vùng chạm cảm ứng $\ge 40-44\text{px}$, bộ định dạng container mâm cơm và thanh tổng hợp.
- `scratch/verify_ag08.py`: Script kiểm thử tự động cấu trúc HTML, SEO, Accessibility và CSS rules.
- `docs/DECISIONS.md`: Bổ sung D28 (Responsive & Usability Standards for Gate P1).
- `docs/TEST_LOG.md`: Ghi nhận 8 kiểm tra đạt chuẩn cho AG-08.
- `docs/ROADMAP.md`: Cập nhật trạng thái AG-08 sang `awaiting-close`.
- `docs/reports/AG-08_report.md`: Báo cáo này.

## 5. Gate P1 Sign-off Checklist (Nghiệm thu Phase P1)

| Hạng mục nghiệm thu | Trạng thái | Minh chứng |
|---|---|---|
| **1. Design Tokens & Primitives (AG-04)** | **ĐẠT** | `docs/tokens.css`, `docs/DESIGN_SYSTEM.md`, WCAG 2.2 AA (4.96:1 - 10.4:1) |
| **2. Discovery Prototype (AG-05)** | **ĐẠT** | `index.html`, 7 món Batch 0 `[DEMO_FIXTURE]`, tìm kiếm tức thời, thuật toán "Hôm nay ăn gì?" 3 món cân bằng không cần AI (D25, O7) |
| **3. Recipe & Cooking Prototype (AG-06)** | **ĐẠT** | `recipe.html`, đổi khẩu phần Invariants §5.3 không sai số lũy tiến, Cooking Mode toàn màn hình, Timer an toàn, Quick Drawer |
| **4. Meal & Shopping Prototype (AG-07)** | **ĐẠT** | `meal.html`, `shopping.html`, đổi món 3 vai trò, gộp nguyên liệu Invariants §5.4 có trace nguồn gốc, checklist `localStorage` |
| **5. Responsive & Usability (AG-08)** | **ĐẠT** | Cả 4 trang chạy mượt trên Mobile/Tablet/Desktop, touch target $\ge 40\text{px}$, 100% test `verify_ag08.py` pass |

## 6. Live Verification Links
Chủ sản phẩm có thể trải nghiệm trực tiếp toàn bộ 4 trang tại cổng 8090:
- Trang chủ / Khám phá: `http://localhost:8090/prototype/index.html`
- Trang Mâm cơm: `http://localhost:8090/prototype/meal.html`
- Trang Đi chợ: `http://localhost:8090/prototype/shopping.html`
- Trang Chi tiết công thức: `http://localhost:8090/prototype/recipe.html?id=thit-ba-chi-kho-tieu`

## 7. Next Steps: Phase P2 — Core catalog và biên tập
Sau khi chủ sản phẩm duyệt đóng AG-08 và phê duyệt Gate P1:
- Bắt đầu **AG-09 — App foundation & environment**:
  - Khởi tạo nền tảng ứng dụng Next.js (TypeScript, Tailwind CSS, shadcn UI) trong repo `projects/angimom`.
  - Cấu hình môi trường dev, Docker Compose, Postgres connection và Drizzle ORM theo đúng quyết định D17/D18/D20.
