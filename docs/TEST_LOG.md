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
