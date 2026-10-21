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
| AG-30 | AI evaluation & fallback | AG-28, 29 | `closed` (20/10/2026) |

Gate P4: AI không tạo đường tắt publish, không suy số dinh dưỡng và không gây chi phí không kiểm soát. — **GATE P4 ĐÃ ĐẠT (M4 AI AN TOÀN & CÓ KIỂM SOÁT)**

## P5 — Cộng đồng
| ID | Capability | Dependency | Trạng thái |
|---|---|---|---|
| AG-31 | Contributor submission & editor reuse | AG-13, 15 | `closed` (21/10/2026) |
| AG-32 | Moderation & abuse reports | AG-31 | `closed` (21/10/2026) |
| AG-33 | Dish variants & kitchen stories | AG-31 | `closed` (21/10/2026) |
| AG-34 | Cooked-it feedback & photos | AG-31, 32 | `closed` (21/10/2026) |

Gate P5: nội dung cộng đồng có queue duyệt, quyền sở hữu và xử lý báo cáo; không biến thành social feed trước khi vận hành ổn. — **GATE P5 ĐÃ ĐẠT (M5 CỘNG ĐỒNG BẾP NHÀ AN TOÀN)**

## P6 — Dinh dưỡng và nhật ký
| ID | Capability | Dependency | Trạng thái |
|---|---|---|---|
| AG-35 | Nutrition source audit & mapping | AG-13 | `closed` (21/10/2026) |
| AG-36 | Recipe nutrition calc & missing-data rules | AG-15, 35 | `closed` (21/10/2026) |
| AG-37 | Consumed portions & diary snapshots | AG-36 | `closed` (21/10/2026) |
| AG-38 | Daily summaries & privacy | AG-37 | `closed` (21/10/2026) |

Gate P6: nguồn truy vết, lượng đã ăn khác lượng đã nấu, dữ liệu thiếu không thành 0, nhật ký riêng tư và không hồi tố theo revision mới. — **GATE P6 ĐÃ ĐẠT (M6 DINH DƯỠNG & NHẬT KÝ BẾP NHÀ)**

## P7 — Mở rộng catalog và thực đơn
| ID | Capability | Dependency | Trạng thái |
|---|---|---|---|
| AG-39 | Expanded catalog: Món nước trọn bữa, món chay, đồ uống & tráng miệng | AG-16, 21 | `closed` (21/10/2026) |
| AG-40 | Pantry inventory: Quản lý kho thực phẩm, đối chiếu công thức & đồng bộ giỏ chợ | AG-23, 39 | `closed` (21/10/2026) |
| AG-41 | Weekly meal planner: Kế hoạch 7 ngày, xuất giỏ chợ & ghi nhật ký dinh dưỡng | AG-37, 40 | `closed` (21/10/2026) |

Gate P7: Mở rộng thể loại món ăn không làm vỡ taxonomy và engine; kho tủ lạnh phân quyền chặt chẽ; kế hoạch tuần tích hợp thông suốt với giỏ đi chợ và nhật ký dinh dưỡng. — **GATE P7 ĐÃ ĐẠT (M7 MỞ RỘNG CATALOG, TỦ LẠNH VÀ KẾ HOẠCH TUẦN)**

## Phase R — Recovery / Stabilization (Hardening trước khi triển khai thật)
| ID | Capability | Dependency | Trạng thái |
|---|---|---|---|
| R0 | Authentication Configuration & Secret Fail-Closed Hardening | AG-11, AG-25 | `closed` (21/10/2026 - D58) |
| R1 | Data Honesty & Verification Badges | R0, AG-15, AG-26 | `closed` (21/10/2026 - D59) |
| R2 | Core MVP Verification & Real Cooking Flows | R1 | `closed` (21/10/2026 - D60) — E2E trình duyệt đã bổ sung ở R3; còn chờ kiểm thử trên điện thoại thật |
| R3 | E2E Playwright, CI tự động & sửa lỗi tồn đọng R2 | R2 | `closed` (21/10/2026 - D61) — CI chạy tự động qua GitHub Actions |
| R4 | Migration Journal Sync & Production Deployment Hardening | R3 | `closed` (21/10/2026 - D62) — Đồng bộ 11 migrations, fail-closed deploy script |
| R5 | User Registration, Zero Lint & VPS Setup Automation | R4 | `closed` (21/10/2026 - D63) — Trang & API đăng ký, lint 0 lỗi, script VPS Mắt Bão |
| R6 | Password Reset, Mắt Bão Native SMTP & User Profile | R5 | `closed` (21/10/2026 - D64) — Quên/đổi mật khẩu, profile, native SMTP mailer |

## P8 — Kinh doanh và scale
Chỉ sau dữ liệu sử dụng thật. Payment/subscription là phạm vi riêng.

## Mốc
M1 scope/kiến trúc/prototype duyệt · M2 catalog + nội dung thật · M3 MVP pilot · M4 AI an toàn · M5+ mở rộng theo evidence · MR0 Secret Fail-Closed & Auth Hardening · MR1 Data Honesty & Badges · MR2 Core MVP Flows Verified · MR3 E2E trình duyệt + CI sẵn sàng · MR4 Drizzle Journal 11/11 & Fail-Closed Deploy · MR5 Zero Lint, Registration & VPS Vibe Host Ready · MR6 Password Reset, Mắt Bão SMTP & Profile Ready.



