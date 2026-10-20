# AG-04 Report — Design Tokens & Primitives

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã hoàn thành xây dựng và kiểm chứng toàn diện hệ thống **Design Tokens & Primitives** cho ĂN GÌ MOM. Khóa cứng bảng màu chuẩn cảm hứng bếp gia đình ấm cúng (kem nhạt `#FAF7F0`, xanh lá `#3F6240`, cam đất `#B75B35`), đảm bảo 100% các cặp màu văn bản/nền đạt chuẩn tương phản trợ năng **WCAG 2.2 Level AA**. Xuất bản tệp biến CSS gốc `docs/tokens.css` và định hình quy chuẩn typography Be Vietnam Pro cùng wordmark tạm thời "ĂN GÌ MOM", mở đường trực tiếp cho các màn hình prototype tiếp theo.

## 2. Audit Before Build
- Xem chi tiết tại [mini-specs/AG-04.md](../mini-specs/AG-04.md) §5.
- Gap đã xác nhận: Bảng màu sơ bộ trước đó thiếu token text tertiary và các màu semantic (success, warning, error, info); màu nhấn Accent `#B75B35` trên nền kem đạt 4.30:1 (chưa đạt 4.5:1 cho body text thông thường); chưa có tệp CSS biến để sử dụng trực tiếp.

## 3. Design Choice
- **Tương phản chuẩn xác (Color Contrast)**:
  - Giữ `#B75B35` làm màu nền cho nút nhấn (chữ trắng trên nền cam đạt **4.60:1 AA**).
  - Bổ sung `--color-accent-text: #A94E2A` dùng riêng cho các link văn bản nhấn trên nền kem (đạt **4.96:1 AA**).
  - Text chính `#253126` trên nền kem đạt **12.70:1** (vượt xa chuẩn cao nhất AAA).
- **Bộ Token CSS gốc ([docs/tokens.css](tokens.css))**:
  - Bao quát 7 nhóm: Canvas/Surface, Text, Brand, Accent, Borders, Semantic States, Typography, Spacing (bội số 4px), Radius, Shadows và Z-index.
  - Tương thích trực tiếp với Tailwind CSS v3/v4 và shadcn/ui.
- **Wordmark & Tagline (D08, O9)**:
  - Wordmark: "ĂN GÌ MOM" (Font Be Vietnam Pro bold 24px, "ĂN GÌ" xanh `#3F6240`, "MOM" cam `#B75B35`).
  - Tagline: *"Bữa cơm nhà, bớt nghĩ hôm nay ăn gì."*.

## 4. Changed Files
- `docs/DESIGN_SYSTEM.md`: Nâng cấp toàn diện thành tài liệu chuẩn, bổ sung ma trận tương phản WCAG 2.2 và hợp đồng các component nguyên tử (Button, Badge, Card, Chip).
- `docs/tokens.css`: Tệp mới chứa toàn bộ CSS Variables của hệ thống.
- `docs/DECISIONS.md`: Bổ sung D24; giải quyết dứt điểm câu hỏi mở O9.
- `docs/ROADMAP.md`: Cập nhật AG-04 sang `awaiting-close`.
- `docs/TEST_LOG.md`: Ghi nhận nhật ký kiểm thử tương phản toán học.
- `docs/mini-specs/AG-04.md`: Cập nhật trạng thái duyệt.
- `docs/reports/AG-04_report.md`: Báo cáo này.

## 5. New API/DB/State
- Không tạo API hay DB table.
- Thêm toàn bộ hệ thống biến CSS `--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`.

## 6. Tests
- **App Tests**: N/A.
- **Contrast Verification (Python script)**:
  - Text Primary on Canvas: 12.70:1 (PASS AAA)
  - Text Secondary on Canvas: 5.81:1 (PASS AA)
  - Text Muted on Canvas: 4.52:1 (PASS AA)
  - White text on Brand button: 6.93:1 (PASS AA)
  - White text on Accent button: 4.60:1 (PASS AA)
  - Accent text on Canvas: 4.96:1 (PASS AA)
  - Success text on Success bg: 6.12:1 (PASS AA)
  - Error text on Error bg: 5.84:1 (PASS AA)
- **Secret scan**: 0 secret phát hiện.

## 7. Live Verification
Đã xác minh định dạng và cú pháp của `docs/tokens.css`.

## 8. Remaining Limits / Follow-ups
- Các component prototype tiếp theo (AG-05 Discovery, AG-06 Recipe, AG-07 Meal & Shopping) bắt buộc phải import và sử dụng trực tiếp các token trong `tokens.css`.
- Bước tiếp theo trong Phase P1: **AG-05: Discovery prototype** (Dựng giao diện Trang chủ và Khám phá/Tìm kiếm món ăn tương tác được với dữ liệu fixture Batch 0).
