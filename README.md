# ĂN GÌ MOM

Website giúp người nấu cơm gia đình tìm món, chuẩn bị nguyên liệu đúng khẩu phần, ghép bữa cơm và làm theo từng bước.

**Trạng thái:** P0 — đang ở AG-00 (Workspace Audit & Skill Bootstrap). Chưa có code ứng dụng, DB hoặc hạ tầng.

## Nhãn trạng thái dùng trong docs
| Nhãn | Nghĩa |
|---|---|
| `approved` | Chủ sản phẩm đã chốt (có ID trong DECISIONS.md) |
| `proposed` | Đề xuất, chưa duyệt — không được coi là quyết định |
| `unknown` | Chưa có thông tin/evidence |

## Tài liệu
- [Master plan](docs/AN_GI_MOM_MASTER_PLAN.md) — bản sao nguyên văn của `AN_GI_MOM_MASTER_PLAN_v1 (1).md`
- [Product brief](docs/PRODUCT_BRIEF.md) · [Roadmap](docs/ROADMAP.md) · [Decisions](docs/DECISIONS.md) · [Glossary](docs/GLOSSARY.md)
- [Features](docs/FEATURES.md) · [Architecture](docs/ARCH.md) · [API](docs/API.md) · [Data model](docs/DATA_MODEL.md)
- [Design system](docs/DESIGN_SYSTEM.md) · [Content guidelines](docs/CONTENT_GUIDELINES.md) · [Security](docs/SECURITY.md)
- [Infra inventory](docs/INFRA_INVENTORY.md) · [Test log](docs/TEST_LOG.md) · [Cost log](docs/COST_LOG.md)
- [MINI-SPECs](docs/mini-specs/) · [Reports](docs/reports/)

## Skills (`.agents/skills/`)
- [mini-spec-playbook](.agents/skills/mini-spec-playbook/SKILL.md) — grammar MINI-SPEC
- [ui-ux-resource-navigator](.agents/skills/ui-ux-resource-navigator/SKILL.md) — quy trình UI/UX

## File nguồn gốc (không sửa)
`AN_GI_MOM_MASTER_PLAN_v1 (1).md`, `MINI_SPEC_PLAYBOOK.md`, `SKILL-UI-UX-Resource-Navigator.md` ở thư mục gốc.

## Quy tắc làm việc
Một MINI-SPEC active tại một thời điểm. Trình spec → duyệt → build → báo cáo → duyệt đóng. Không tự chạy spec kế tiếp, không deploy/push khi chưa được duyệt riêng.
