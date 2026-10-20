# ARCH — Kiến trúc

**Trạng thái: toàn bộ `proposed`** — chờ AG-01 (inventory) và AG-02 (chốt). Không có code.

## Ứng dụng (master plan §4.1) — `proposed`
Một codebase TypeScript, module rõ ranh giới, chưa microservices.

| Lớp | Đề xuất | Trạng thái |
|---|---|---|
| Web công khai + quản trị | Next.js | `proposed` |
| UI | Tailwind + shadcn/ui, icon Lucide | `proposed` |
| Form/validation | React Hook Form + Zod | `proposed` |
| Database | PostgreSQL | `proposed` |
| Test | Vitest (unit), Playwright (E2E) | `proposed` |

Phiên bản: khóa (lock) khi khởi tạo tại AG-09; không dùng “latest” trong contract.

## Hạ tầng (master plan §4.2) — `unknown`
| Lớp | Phương án | Trạng thái |
|---|---|---|
| Hosting | — | `unknown` (O1, O2) |
| Database | — | `unknown` |
| Authentication | — | `unknown` |
| Storage ảnh | — | `unknown` |
| Email | — | `unknown` |

AG-02 phải chọn **đúng một** phương án mỗi lớp, ghi lý do, chi phí cần xác minh, giới hạn, người chịu trách nhiệm. Không mặc định Supabase/Vercel; không self-host thêm chỉ vì có VPS.

Ghi chú quan sát (AG-00, chưa phải quyết định): workspace là Mắt Bão Cloud IDE, có sẵn quy trình `mb-deploy` → Coolify, domain `*.dev.matbao.ai`. Đánh giá tại AG-01.

## Module dự kiến
Identity & access · Recipe catalog & publishing · Ingredient & taxonomy · Search & discovery · Serving adjustment · Cooking session · Meal planning & shopping · Media management · (sau) community, AI, nutrition, diary.

Quy tắc: reuse-first; không tạo editor thứ hai hoặc engine gộp nguyên liệu thứ hai.
