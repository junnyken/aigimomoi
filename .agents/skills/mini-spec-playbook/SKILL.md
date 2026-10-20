---
name: mini-spec-playbook
description: Grammar bắt buộc để viết, audit, test và báo cáo một MINI-SPEC trong dự án ĂN GÌ MOM. Dùng khi chuẩn bị, triển khai hoặc báo cáo bất kỳ capability AG-xx nào; khi cần audit trước build, chọn một phương án thiết kế, lập test plan hoặc viết Mini-Spec Report. Use when drafting, auditing, implementing or reporting any MINI-SPEC (AG-xx) for this project.
---

# Mini-Spec Playbook (wrapper)

Skill này là lớp kích hoạt. Nội dung chuẩn nằm nguyên văn trong
[references/MINI_SPEC_PLAYBOOK.md](references/MINI_SPEC_PLAYBOOK.md) (Mini-Spec Playbook v2, do chủ sản phẩm cung cấp).

## Khi nào kích hoạt
- Chuẩn bị MINI-SPEC mới cho một ID trong [docs/ROADMAP.md](../../../docs/ROADMAP.md).
- Bắt đầu build một MINI-SPEC đã được duyệt.
- Viết báo cáo sau build hoặc cập nhật `docs/TEST_LOG.md`.

## Bắt buộc
1. **Đọc toàn bộ** `references/MINI_SPEC_PLAYBOOK.md` trước khi viết hoặc build. Không làm theo trí nhớ.
2. Đọc `docs/DECISIONS.md` và `docs/AN_GI_MOM_MASTER_PLAN.md` (§0 thứ tự ưu tiên, §14 template).
3. Điền đủ skeleton: Header, Context, Goal (1 câu), Constraints, Scope A–E, Audit Before Build, Design Choice (một phương án), Test Plan, Success Criteria, Stop conditions.
4. Audit bằng evidence thực tế; không đánh dấu audit đã xong từ tài liệu kế hoạch.
5. Trình spec và **dừng chờ chủ sản phẩm duyệt**. Im lặng không phải đồng ý.
6. Sau build: báo cáo đúng 8 mục của Playbook §7; test không chạy được ghi `not-run`/`blocked`, không PASS giả.
7. **Không tự chạy MINI-SPEC kế tiếp**, kể cả cùng phase.

## Lưu file
- Spec: `docs/mini-specs/<ID>.md`
- Báo cáo: `docs/reports/<ID>_report.md`
- Ghi quyết định mới vào `docs/DECISIONS.md`.
