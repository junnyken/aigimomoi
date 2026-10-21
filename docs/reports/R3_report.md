# BÁO CÁO TRIỂN KHAI MINI-SPEC R3: E2E PLAYWRIGHT, CI & SỬA LỖI TỒN ĐỌNG R2

- **Parent Phase:** Recovery / Stabilization
- **Task ID:** `R3`
- **Đặc tả:** [docs/mini-specs/R3.md](file:///home/coder/workspace/projects/angimom/docs/mini-specs/R3.md)
- **Quyết định:** **D61** ([docs/DECISIONS.md](file:///home/coder/workspace/projects/angimom/docs/DECISIONS.md))
- **Trạng thái:** **IMPLEMENTED** — E2E chạy thật trên trình duyệt (cục bộ); CI sẵn sàng nhưng **chưa chạy trên GitHub**
- **Ngày:** 21/10/2026 · **Chủ sản phẩm:** Nguyễn Thiên Triều

> Báo cáo do agent tự lập; test do agent viết và chạy — **không phải nghiệm thu độc lập**.

---

## 1. Summary

- Quyết định biên tập của chủ sản phẩm đã vào dữ liệu: nước mắm giữ chính sách hiện có (khóa bằng test); **thịt kho có tỏi băm** → mâm 6 người gộp 13,5 tép tỏi.
- Có **Playwright E2E** chạy trên bản build production + Postgres + seed thật, cả desktop và mobile: **13 passed / 1 skipped**.
- Có **CI GitHub Actions** (checks → e2e) không dùng secret thật.
- Đã sửa 2 lỗi tồn đọng R2 (khôi phục mâm, chuông kêu 2 lần) và **các lỗi mới phát hiện** trong R3 (mục 2).

## 2. Lỗi/khoảng trống phát hiện trong R3

| Mã | Mức | Phát hiện | Xử lý |
|---|---|---|---|
| B1′ | Cao | 6 nhãn quầy khác trong seed vẫn rơi vào "khác" (R2 chỉ map một phần) | Đã map + test quét mọi nhãn seed |
| B6 | Thấp | Chip truy vết ở /shopping hiện số thô (`4.5`, có thể `1.3333…`) | Dùng `formatScaledAmount` (vi-VN) |
| A11Y | Trung bình | Nút ± khẩu phần 32px, nút hẹn giờ ~32px, nút "Xem nguyên liệu" trên mobile không có tên | Nâng lên ≥ 44px; thêm `aria-label` — **do E2E mobile bắt được** |
| MIG | **Cao (deploy)** | `drizzle/meta/_journal.json` chỉ khai 3/11 migration → `npm run db:migrate` trên DB mới **thiếu bảng/cột** (seed lỗi `column "provenance" does not exist`). `deploy_production.sh` chạy psql với `2>/dev/null \|\| true` nên lỗi bị nuốt | **Chưa sửa** (ngoài ràng buộc "không đổi migration"). E2E/CI dùng `setup-db.ts` áp tuần tự 11 file và dừng khi lỗi — đã chứng minh 11 file áp sạch trên DB mới |
| LOG | Thấp | `/cong-thuc/[slug]/nau` log `NEXT_STATIC_GEN_BAILOUT` khi revalidate nền | Chưa sửa; trang vẫn hoạt động |

## 3. Thay đổi chính

| Nhóm | File |
|---|---|
| Dữ liệu D61 | `src/scripts/seed_production_catalog.ts` (Tỏi khô thịt kho + bước 1) |
| Nhãn quầy | `src/lib/recipes/aggregation.ts` |
| Khôi phục mâm | `src/components/meal/MealView.tsx`, `src/app/meal/page.tsx` (cờ `hasExplicitSelection`, `key` theo mâm) |
| Timer | `src/components/cooking/StepTimer.tsx` (mốc kết thúc, chuông 1 lần, ≥44px), `CookingModeView.tsx` (`key` theo bước, `useEffectEvent`, bỏ memo thủ công lỗi) |
| Checklist | `src/lib/shopping/shoppingClient.ts` (`useSyncExternalStore`) |
| UI | `ShoppingItemRow.tsx` (B6), `ShoppingView.tsx`, `ServingSelector.tsx`, `MealServingsSelector.tsx` (≥44px) |
| Kiểu | `publicQueries.ts` (`any` → `RecipeNutritionSnapshot`), `session.ts` |
| E2E | `playwright.config.ts`, `e2e/setup-db.ts`, `e2e/core-flow.spec.ts` |
| CI | `.github/workflows/ci.yml`, `package.json` (`lint:scoped`, `test:e2e`, `test:e2e:db`, `@playwright/test@1.64.1`), `.gitignore` |

Không đổi schema/migration.

## 4. Kết quả kiểm thử

| Lệnh | Kết quả |
|---|---|
| `npm run test:e2e` | **13 passed, 1 skipped** (Desktop Chrome + Pixel 7) |
| `npm run test:core` | 99/99 |
| `npm run test:auth` / `test:honesty` | 45/45 / 38/38 |
| `npx tsc --noEmit` / `npm run build` | exit 0 / exit 0 |
| `npm run lint:scoped` | 0 lỗi (7 cảnh báo có sẵn) |
| CI trên GitHub | **NOT RUN** — chỉ có hiệu lực sau khi anh/chị push |

Chạy lại cục bộ:

```bash
docker run -d --name angimom_e2e_pg -e POSTGRES_USER=angimom -e POSTGRES_PASSWORD=<tạm> -e POSTGRES_DB=angimom_test -p 55432:5432 postgres:16-alpine
export DATABASE_URL=postgres://angimom:<tạm>@localhost:55432/angimom_test
npm run test:e2e:db && npm run build
AUTH_SECRET=$(openssl rand -hex 32) NODE_ENV=production npm run test:e2e
```

## 5. Remaining Limits

1. CI chưa từng chạy trên GitHub runner.
2. **Migration journal thiếu 8/11 mục** — rủi ro cao khi deploy lần đầu; đề xuất task R4 ngay trước deploy.
3. Lint toàn repo còn lỗi có sẵn (92 lỗi lúc audit); `SwapDishModal.tsx` chưa vào phạm vi lint.
4. Chưa kiểm thử trên điện thoại thật (E2E mobile là giả lập Pixel 7 trên Chromium; chưa có Safari/iOS).
5. Âm thanh chuông chỉ được đếm số lần tạo `AudioContext`, chưa nghe thật.
6. Seed chạy lại sẽ xóa/tạo lại recipe theo slug → môi trường đã có dữ liệu người dùng cần cân nhắc trước khi re-seed.

## 6. Đề xuất tiếp theo

- **Push** để CI chạy lần đầu, xem tab Actions; nếu đỏ, gửi log cho tôi.
- **R4 (đề xuất):** sửa migration journal / quy trình migrate cho deploy (bỏ `|| true`), xử lý log prerender trang nấu, mở rộng lint.
- Thử luồng trên điện thoại thật (iOS Safari + Android) theo kịch bản R2 §6.
