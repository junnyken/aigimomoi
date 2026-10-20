# TEST LOG

## AG-00 — Workspace Audit & Skill Bootstrap — 20/10/2026

**App tests (unit/integration/lint/build/E2E): N/A — chưa có ứng dụng.** Không báo PASS.

Kiểm tra tài liệu/skill (script read-only, 8 nhóm):

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | 22 file theo spec §6 tồn tại | PASS |
| 2 | Không có file ngoài danh sách (trừ 3 file nguồn) | PASS |
| 3 | sha256 3 file nguồn không đổi; 3 bản sao nguyên văn trùng sha256 | PASS |
| 4 | 2 `SKILL.md` có YAML frontmatter với `name` + `description` | PASS |
| 5 | Mọi link tương đối trong README/docs/skill wrapper trỏ tới file có thật | PASS (sau fix) |
| 6 | Không có pattern secret trong file đã tạo | PASS |
| 7 | 11 docs nền có nhãn `approved`/`proposed`/`unknown`/N/A | PASS |
| 8 | D01–D13 có đủ trong DECISIONS.md | PASS |
| — | Repo cha: số dòng `git status` giữ nguyên 3.671 (angimom vẫn là 1 dòng `??`) | PASS |

### Bug thật tìm được
- **Link hỏng** trong `docs/mini-specs/AG-00.md`: tên file nguồn chứa `(1)`, dấu `)` kết thúc link Markdown sớm. **Fix**: mã hóa thành `%281%29`. Chạy lại: PASS.

### Chưa kiểm
- Antigravity có tự nạp skill từ `projects/angimom/.agents/skills/` khi mở thư mục này làm workspace root hay không — chưa xác minh trong IDE (xem report §8).

## AG-01 — Existing Infrastructure Inventory — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Mọi dòng bảng trong INFRA_INVENTORY có nhãn `verified`/`declared`/`unknown` | PASS |
| 2 | Secret scan trên docs | PASS |
| 3 | Chỉ chạy lệnh đọc (không create/redeploy/allow-ip/set-scope/preview) | PASS |
| 4 | Diff chỉ ở docs trong scope | PASS |

### Bug thật tìm được
- Không có.

### Chưa kiểm / blocked
- Toàn bộ S2 (VPS/domain riêng): chờ thông tin chủ sản phẩm.

## AG-02 — Architecture & Domain Decisions — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | ARCH.md chốt 100% stack ứng dụng và hạ tầng (không còn unassigned) | PASS |
| 2 | DATA_MODEL.md khóa các enum chuẩn và quy tắc bất biến theo Master Plan §5 | PASS |
| 3 | API.md định nghĩa rõ chuẩn Next.js Server Actions và REST boundaries | PASS |
| 4 | Secret scan trên docs | PASS |
| 5 | DECISIONS.md ghi nhận đủ D19, D20, D21 | PASS |

## AG-03 — Content Operations Plan & Editorial Gate — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | CONTENT_GUIDELINES.md chốt 5 bước biên tập và mẫu JSON Schema chuẩn | PASS |
| 2 | Danh mục Batch 0 (7 món) phủ đủ 3 nhóm mặn/canh/rau (`MAIN`, `SOUP`, `SIDE`) | PASS |
| 3 | Checklist 9 tiêu chí bao hàm toàn bộ Master Plan §8.4 | PASS |
| 4 | Secret scan trên docs: không có secret | PASS |
| 5 | DECISIONS.md ghi nhận D22, D23; giải quyết O5, O10 | PASS |

## AG-04 — Design Tokens & Primitives — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | docs/tokens.css khai báo đầy đủ 7 nhóm biến CSS chuẩn | PASS |
| 2 | Ma trận tương phản màu toán học đạt chuẩn WCAG 2.2 AA (chữ thường >= 4.5:1, chữ lớn >= 3:1) | PASS |
| 3 | DESIGN_SYSTEM.md quy định đầy đủ phông Be Vietnam Pro, kích thước, spacing và component primitives | PASS |
| 4 | Secret scan trên docs: không có secret | PASS |
| 5 | DECISIONS.md ghi nhận D24, giải quyết O9 | PASS |

## AG-05 — Discovery Prototype — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | HTTP server port 8090 phản hồi mã 200 OK trên index.html, main.css, batch0_fixtures.js | PASS |
| 2 | Tìm kiếm tức thời theo từ khóa tên món, alias, nguyên liệu hoạt động chính xác | PASS |
| 3 | Bộ lọc vai trò món (`ALL`, `MAIN`, `SOUP`, `SIDE`) lọc chính xác danh sách thẻ | PASS |
| 4 | Nút "Hôm nay ăn gì?" (O7) sinh mâm cơm 3 món ngẫu nhiên đủ 3 vai trò (1 Mặn + 1 Canh + 1 Rau) | PASS |
| 5 | Trạng thái rỗng (Empty State) xuất hiện khi tìm từ khóa không có thật | PASS |
| 6 | Secret scan: không có secret | PASS |
| 7 | DECISIONS.md ghi nhận D25, giải quyết O7 | PASS |

## AG-06 — Recipe & Cooking Prototype — 20/10/2026

**App tests: N/A.**

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | HTTP server port 8090 phản hồi mã 200 OK trên recipe.html và recipe.js | PASS |
| 2 | Invariant co giãn khẩu phần 4 -> 6 -> 4 người trả về chính xác 100% định lượng ban đầu cho cả 3 ScalePolicy | PASS |
| 3 | Chế độ nấu (Cooking Mode) mở toàn màn hình, điều hướng bước chính xác, timer an toàn không tự nhảy bước | PASS |
| 4 | Bảng tra cứu nguyên liệu nhanh (Quick Drawer) mở/đóng mượt mà không làm mất trạng thái bước nấu | PASS |
| 5 | Chuyển hướng từ trang chủ `index.html` sang `recipe.html?id=...` chuẩn xác | PASS |
| 6 | Secret scan: không có secret | PASS |
| 7 | DECISIONS.md ghi nhận D26 | PASS |
