# ROADMAP

Nguồn: master plan §7. Đây là backlog định hướng — **không** có nghĩa các spec đã được duyệt. Không cam kết ngày/tuần trước audit.

Trạng thái spec: `not-started` · `spec-drafted` · `approved-for-build` · `in-build` · `awaiting-close` · `closed` · `blocked`.

## P0 — Nền móng
| ID | Capability | Dependency | Trạng thái |
|---|---|---|---|
| AG-00 | Workspace audit & skill setup | Tài liệu gốc | `closed` (20/10/2026) |
| AG-01 | Existing infrastructure inventory | AG-00 | `closed` (20/10/2026 - S2 pending details) |
| AG-02 | Architecture & domain decisions | AG-01 | `closed` (20/10/2026) |
| AG-03 | Content operations plan | AG-00 | `closed` (20/10/2026) |

Gate P0: scope, thuật ngữ, kiến trúc, người duyệt và khoản chưa biết được ghi rõ. — **GATE P0 ĐÃ ĐẠT**

## P1 — UX/UI và prototype
| ID | Capability | Dependency | Trạng thái |
|---|---|---|---|
| AG-04 | Design tokens & primitives | AG-02 | `closed` (20/10/2026) |
| AG-05 | Discovery prototype | AG-04 | `closed` (20/10/2026) |
| AG-06 | Recipe & cooking prototype | AG-04 | `closed` (20/10/2026) |
| AG-07 | Meal & shopping prototype | AG-06 | `closed` (20/10/2026) |
| AG-08 | Responsive & usability review | AG-05..07 | `closed` (20/10/2026) |

Gate P1: chủ sản phẩm duyệt luồng/thiết kế trước wiring dữ liệu thật. — **GATE P1 ĐÃ ĐẠT**

## P2 — Core catalog và biên tập
| ID | Capability | Dependency | Trạng thái |
|---|---|---|---|
| AG-09 | App foundation & environment | AG-02, AG-08 | `closed` (20/10/2026) |
| AG-10 | Schema & migrations | AG-09 | `closed` (20/10/2026) |
| AG-11 | Identity & authorization | AG-10 | `closed` (20/10/2026) |
| AG-12 | Ingredient & taxonomy CRUD | AG-11 | `closed` (20/10/2026) |
| AG-13 | Structured recipe editor | AG-12 | `closed` (20/10/2026) |
| AG-14 | Media pipeline | AG-11 | `closed` (20/10/2026) |
| AG-15 | Publishing & revision gate | AG-13, 14 | `closed` (20/10/2026) |
| AG-16 | Public recipe rendering | AG-15 | `closed` (20/10/2026) |

Gate P2: tạo → kiểm → xuất bản → đọc lại chạy được. — **GATE P2 ĐÃ ĐẠT**

## P3 — MVP bữa cơm và đi chợ
| ID | Capability | Dependency | Trạng thái |
|---|---|---|---|
| AG-17 | Search & filters | AG-16 | `closed` (20/10/2026) |
| AG-18 | Serving adjustment | AG-16 | `closed` (20/10/2026) |
| AG-19 | Cooking mode | AG-18 | `closed` (20/10/2026) |
| AG-20 | Saved recipes | AG-11, 16 | `closed` (20/10/2026) |
| AG-21 | Meal composition & replacement | AG-17, 18 | `closed` (20/10/2026) |
| AG-22 | Ingredient aggregation | AG-21 | `closed` (20/10/2026) |
| AG-23 | Shopping checklist persistence | AG-22 | `closed` (20/10/2026) |
| AG-24 | SEO & index boundaries | AG-16, 17 | `closed` (20/10/2026) |
| AG-25 | Staging deploy & observability | Core tests pass | `closed` (20/10/2026) |
| AG-26 | Content batch review & MVP pilot gate | AG-03, 15, 23, 25 | `closed` (20/10/2026) |

Gate P3 = MVP đủ dùng thử (không cần P4–P8). — **GATE P3 ĐÃ ĐẠT (M3 MVP PILOT READY)**

## P4 — AI có kiểm soát
| ID | Capability | Dependency | Trạng thái |
|---|---|---|---|
| AG-27 | AI provider boundary & budget | AG-26 + duyệt provider | `closed` (20/10/2026) |
| AG-28 | AI recipe suggestion | AG-27 | `closed` (20/10/2026) |
| AG-29 | AI authoring drafts | AG-27, 13, 15 | `closed` (20/10/2026) |
| AG-30 | AI evaluation & fallback | AG-28, 29 | `not-started` |

Gate P4: AI không tạo đường tắt publish, không suy số dinh dưỡng và không gây chi phí không kiểm soát.

## P5 — Cộng đồng
AG-31 contributor submission · AG-32 moderation · AG-33 dish variants & stories · AG-34 cooked-it feedback — `not-started`.

## P6 — Dinh dưỡng và nhật ký
AG-35 nutrition source audit · AG-36 recipe nutrition calc · AG-37 consumed portions & snapshots · AG-38 daily summaries & privacy — `not-started`.

## P7 — Mở rộng catalog
Món nước, đồ uống, bánh/ngọt, món chay, kế hoạch tuần/pantry, “ăn theo thì” (chờ O6). Mỗi nhánh cần ID mới khi duyệt.

## P8 — Kinh doanh và scale
Chỉ sau dữ liệu sử dụng thật. Payment/subscription là phạm vi riêng.

## Mốc
M1 scope/kiến trúc/prototype duyệt · M2 catalog + nội dung thật · M3 MVP pilot · M4 AI an toàn · M5+ mở rộng theo evidence.
