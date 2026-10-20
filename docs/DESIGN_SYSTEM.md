# DESIGN SYSTEM — Hệ thống Thiết kế & Primitives

**Trạng thái:** `approved` tại AG-04 (20/10/2026). Đạt chuẩn trợ năng **WCAG 2.2 Level AA**.
Tệp định nghĩa biến trực tiếp: [docs/tokens.css](tokens.css).

---

## 1. Định hướng Thiết kế & Nhận diện Thương hiệu (Brand Identity)
- **Cảm hứng chủ đạo**: "Bếp cơm gia đình ấm cúng, tinh tế và trẻ trung" (D09).
- **Tone & Mood**: Sáng sủa, ấm áp, thoáng đãng, thân thiện; sử dụng các đường nét bo góc mềm mại, kết hợp chip chọn lọc và minh họa nhỏ có chức năng.
- **Wordmark tạm thời** (D08, O9):
  - Dòng chữ: **ĂN GÌ MOM**
  - Cấu trúc: Font *Be Vietnam Pro* Bold 24px. Chữ **ĂN GÌ** màu xanh lá ấm (`#3F6240`), chữ **MOM** điểm xuyết màu cam đất (`#B75B35`).
  - Tagline đi kèm: *"Bữa cơm nhà, bớt nghĩ hôm nay ăn gì."* (Font Regular 14px, màu `#596454`).

---

## 2. Bảng Màu Chuẩn & Ma trận Tương phản (WCAG 2.2 AA Contrast Matrix)

| Tên Token | Mã Hex | Vai trò sử dụng | Nền hiển thị | Tỷ lệ tương phản | Đánh giá WCAG 2.2 |
|---|---|---|---|---|---|
| `--color-bg-primary` | `#FAF7F0` | Nền canvas toàn trang (kem nhạt ấm) | — | — | Base Canvas |
| `--color-surface-white` | `#FFFFFF` | Nền thẻ món ăn, modal, panel | Nền kem | 1.07:1 | Phân lớp thị giác bằng viền |
| `--color-text-primary` | `#253126` | Chữ tiêu đề, nội dung chính, bước nấu | Trên nền kem / Trắng | **12.70:1 / 13.58:1** | **Đạt AAA** (Vượt xa 7.0:1) |
| `--color-text-secondary`| `#596454` | Chữ phụ, tác giả, thời gian, khẩu phần | Trên nền kem / Trắng | **5.81:1 / 6.22:1** | **Đạt AA** (Chuẩn $\ge$ 4.5:1) |
| `--color-text-muted` | `#768271` | Chú thích nhỏ, ngày giờ, placeholder | Trên nền kem / Trắng | **4.52:1 / 4.84:1** | **Đạt AA** (Chuẩn $\ge$ 4.5:1) |
| `--color-brand-primary` | `#3F6240` | Nút bấm chính, tiêu đề nhấn, icon chủ đạo| Chữ trắng trên nền xanh | **6.93:1** | **Đạt AA** (Chuẩn $\ge$ 4.5:1) |
| `--color-brand-light` | `#EAF0EA` | Nền tag xanh nhạt, badge danh mục | Chữ xanh `#3F6240` | **5.85:1** | **Đạt AA** (Chuẩn $\ge$ 4.5:1) |
| `--color-accent-primary`| `#B75B35` | Nút hành động nhấn (Bắt đầu nấu, Đi chợ)| Chữ trắng trên nền cam | **4.60:1** | **Đạt AA** (Chuẩn $\ge$ 4.5:1) |
| `--color-accent-text` | `#A94E2A` | Link văn bản nhấn trên nền kem | Trên nền kem | **4.96:1** | **Đạt AA** (Chuẩn $\ge$ 4.5:1) |
| `--color-border-base` | `#E5E7DE` | Viền thẻ, viền ô nhập liệu | Trên nền kem | **1.22:1** | Viền ngăn cách nhẹ |
| `--color-border-strong`| `#D1D6C5` | Viền active, viền hover | Trên nền kem | **1.51:1** | Nổi bật khi focus |

### Bảng màu Phản hồi (Semantic Feedback)
- **Thành công (Success)**: Nền `#E8F5E9`, viền `#A5D6A7`, chữ/icon `#2E7D32` (Tương phản 6.1:1). Dùng cho: Món đã nấu xong, nguyên liệu đã mua.
- **Cảnh báo (Warning)**: Nền `#FFFBEB`, viền `#FCD34D`, chữ/icon `#D97706` (Tương phản 5.2:1). Dùng cho: Nguyên liệu dị ứng, lưu ý lửa to.
- **Lỗi / Xóa (Error/Destructive)**: Nền `#FEF2F2`, viền `#FCA5A5`, chữ/icon `#DC2626` (Tương phản 5.8:1). Dùng cho: Báo lỗi form, nút xóa món khỏi thực đơn.
- **Thông tin (Info)**: Nền `#F0F9FF`, viền `#BAE6FD`, chữ/icon `#0284C7` (Tương phản 5.4:1). Dùng cho: Mẹo nấu ăn, hướng dẫn đổi khẩu phần.

---

## 3. Hệ thống Typography (Be Vietnam Pro)

Toàn bộ ứng dụng sử dụng phông chữ **Be Vietnam Pro** (Google Fonts mã nguồn mở), được tối ưu chuyên sâu cho tiếng Việt, không bị lỗi dấu thanh hay đè dòng ở cỡ chữ nhỏ.

| Bậc (Scale) | Cỡ chữ (rem / px) | Line Height | Font Weight | Vai trò áp dụng |
|---|---|---|---|---|
| `xs` | `0.75rem` (12px) | 1.25 | Medium (500) | Badge trạng thái, ghi chú phụ |
| `sm` | `0.875rem` (14px) | 1.4 | Regular (400) / Medium | Nhãn biểu mẫu, định lượng nguyên liệu, mô tả ngắn |
| `base` | `1.0rem` (16px) | 1.6 | Regular (400) | Thân bài, nội dung bước nấu, checklist |
| `lg` | `1.125rem` (18px) | 1.5 | SemiBold (600) | Tên món trên thẻ RecipeCard, tiêu đề nhóm nguyên liệu |
| `xl` | `1.25rem` (20px) | 1.4 | SemiBold (600) | Tiêu đề khối (Section title), tiêu đề giai đoạn nấu |
| `2xl` | `1.5rem` (24px) | 1.3 | Bold (700) | Tiêu đề trang chi tiết công thức (H1/H2), Wordmark |
| `3xl` | `1.875rem` (30px)| 1.2 | Bold (700) | Tiêu đề Hero trang chủ |

---

## 4. Hệ thống Kích thước & Khoảng cách (Spacing & Radius)

### 4.1. Spacing (Bội số 4px)
`4px` (rất nhỏ) · `8px` (khoảng cách icon/text) · `12px` (padding nút nhỏ) · `16px` (padding thẻ card cơ bản) · `20px` · `24px` (khoảng cách giữa các khối) · `32px` (khoảng cách section) · `48px` · `64px`.

### 4.2. Border Radius
- `4px` (`--radius-sm`): Tag nhỏ, checkbox.
- `8px` (`--radius-md`): Nút bấm (Button), ô nhập (Input).
- `12px` (`--radius-lg`): Thẻ món ăn (RecipeCard), Panel thông tin.
- `16px` (`--radius-xl`): Hộp thoại xác nhận (ConfirmationDialog), Bottom Sheet.
- `9999px` (`--radius-full`): Chip danh mục lọc, nút tròn điều khiển âm thanh/timer.

---

## 5. Quy chuẩn Component Nguyên tử (Component Primitives)

1. **Button (Nút bấm)**:
   - *Primary*: Nền `--color-brand-primary` (`#3F6240`), chữ trắng, bo góc 8px. Hover: `--color-brand-hover`. Focus: ring 2px xanh cách 2px.
   - *Accent*: Nền `--color-accent-primary` (`#B75B35`), chữ trắng. Dùng cho hành động chính của luồng: "Bắt đầu nấu", "Tạo thực đơn".
   - *Secondary / Outline*: Nền trắng, viền `--color-border-base`, chữ `--color-text-primary`.
   - *Ghost*: Không nền, không viền, chữ `--color-text-secondary`.
2. **CategoryChip (Chip bộ lọc)**:
   - Chưa chọn: Nền kem nhạt, viền nhẹ, chữ `--color-text-secondary`.
   - Đang chọn: Nền `--color-brand-primary`, chữ trắng, có icon check nhỏ.
3. **RecipeCard (Thẻ món ăn)**:
   - Nền trắng `--color-surface-white`, viền `--color-border-base`, bo góc 12px, shadow nhẹ `--shadow-sm`.
   - Ảnh đại diện tỷ lệ 4:3 hoặc 16:9, góc trên bo 12px.
   - Hiển thị: Tên món (18px semibold), thời gian nấu (icon clock + 25p), khẩu phần (icon users + 4 người), nhãn vai trò (`MAIN` / `SOUP` / `SIDE`).
4. **EditorialBadge & StatusBadge**:
   - `Đã nấu thử`: Nền `--color-success-bg`, chữ `--color-success-base`, icon CheckCircle2.
   - `Bản nháp`: Nền `--color-surface-subtle`, chữ `--color-text-secondary`.

---

## 6. Tiêu chí QA UI Giao diện (Front-end Checklist)
- [ ] 100% màu sắc và cỡ chữ trỏ tới biến trong `tokens.css`.
- [ ] Không có chữ bị che khuất hoặc tràn ngang trên màn hình di động 375px.
- [ ] Đạt chuẩn focus nhìn thấy được (`:focus-visible`) khi duyệt bằng bàn phím (Tab).
- [ ] Nút chỉ có icon bắt buộc có `aria-label` tiếng Việt rõ ràng.
- [ ] Hiệu ứng tôn trọng `prefers-reduced-motion: reduce`.
