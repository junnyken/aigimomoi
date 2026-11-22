# ĂN GÌ MOM — Hiện trạng dự án (cập nhật 22/11/2026)

> Tài liệu này dùng để nạp cho chatbot/AI trợ lý, giúp nó nắm tình trạng thật của website trước khi đề xuất việc tiếp theo.
> Nguồn: đọc trực tiếp mã nguồn trong `src/`, `drizzle/`, các file Docker và `docs/` tại nhánh `main` (`https://github.com/junnyken/aigimomoi.git`, commits `0cdd791`, `8703701`, `e9cceda`).
> Quy ước: **[đã kiểm]** = đã xác minh bằng lệnh hoặc đọc code hôm nay · **[theo docs]** = do tài liệu dự án tự ghi, chưa chạy lại để xác nhận.

---

## 1. Tóm tắt nhanh

- **Sản phẩm:** nền tảng Bếp Việt & Dinh dưỡng Gia đình chuẩn Viện Dinh Dưỡng Quốc Gia: AI quét ảnh bữa ăn / tủ lạnh / nhãn bao bì kèm giọng nói tiếng Việt → Tính Kcal & TDEE chuẩn Châu Á → Ghép mâm cơm 4 ô & Chia khẩu phần 2–5 thành viên → Giỏ đi chợ đồng bộ PostgreSQL 24h & Trừ đồ Tủ lạnh tự động → Cooking Mode rảnh tay → Visual Food Diary & Điểm Đĩa Harvard.
- **Tiến độ hoàn thành:** Đã đóng toàn bộ **P0 → P7 (`AG-00` → `AG-41`)**, **Phase R (`R0` → `R8`)** và **Phase U (`U0` → `U5`: Competitor Upgrade & Family Nutrition Ecosystem)** **[đã kiểm]**. Còn lại `P8` (thanh toán/thu phí trực tuyến `R9–R10`) chủ động chờ dữ liệu vận hành & pháp nhân.
- **Nội dung & Từ điển:** ~60+ món chính/món nước/chay/giảm cân/gym + 5 công thức nước chấm gia truyền + ~185–195 nguyên liệu FCT + **167 món hàng quán/ăn sáng/trà sữa Việt Nam** (`vietnameseEatingOutCatalog.ts`) **[đã kiểm]**. Công thức seed giữ `isCookTested: false` minh bạch theo D23.
- **Code & Kiểm thử:** `tsc --noEmit` exit `0`, `npm run lint` `0 errors`, `test_data_honesty.ts` (`38/38 PASS`), `npm run test:security` (`66/66 PASS`), và `next build` thành công trên **Next.js `16.4.6`** tạo **87/87 trang tĩnh** **[đã kiểm]**. Nhánh `main` đã đẩy đầy đủ lên `origin/main` (`junnyken/aigimomoi.git`).

---

## 2. Công nghệ đang dùng thật

| Lớp | Thực tế trong code [đã kiểm] | Ghi chú |
|---|---|---|
| Framework | Next.js **16.4.6** App Router (Turbopack, Cache Components & Partial Prefetching), React 19.3, TypeScript | `proxy.ts` Node runtime |
| UI & Media | Tailwind CSS v4 + `lucide-react` + `WakeLock API` + `SpeechSynthesis` / `SpeechRecognition` (`vi-VN`) + Web Audio API | Tự nén ảnh client-side |
| Form/validate | Tự viết có cấu trúc + kiểm tra MIME/magic bytes/SSRF/CSRF server-side | Không có Zod |
| DB | PostgreSQL 16 + Drizzle ORM 0.45, **16 file SQL migration (`drizzle/0000` → `0015`, 24 bảng)** | Auto-apply via `autoBootstrap.ts` + `migrate_production.js` |
| Đăng nhập | Scrypt hash + HMAC-SHA256 cookie `HttpOnly` có `sessionVersion` thu hồi phiên tức thì (`AUTH_SECRET` fail-closed) | Vai trò: `ADMIN`, `EDITOR`, `COOK` |
| Lưu ảnh | Adapter Cloudflare R2 / S3 hoặc ổ đĩa local (`/uploads/recipes`, `/uploads/feedback`, `/uploads/diary`) | `src/lib/storage/` |
| Email | Native Node.js TLS SMTP Mắt Bão (`mailer.ts`) / Resend + dev mock fallback | Đặt lại mật khẩu HMAC 15p |
| AI Vision & Text | AI Gateway đa tầng (`Gemini Vision + OpenAI Vision + DeepSeek + Vietnam FCT Heuristic`), key mã hóa AES-256-GCM trong DB | Hỗ trợ `MEAL`, `FRIDGE`, `LABEL`, soạn công thức, gợi ý mâm |
| Kiểm thử | Bộ test chuyên biệt `test_data_honesty.ts` (38/38), `npm run test:security` (66/66), `test:core`, Playwright E2E, CI GitHub Actions | Không dùng `alert()` |
| PWA & Hạ tầng | `public/manifest.json` + `public/sw.js` + `Dockerfile` + `Dockerfile.prod` + `docker-compose.prod.yml` + `Caddyfile` | Deploy qua Git / Docker |

---

## 3. Tiến độ theo phase [đã kiểm — `docs/ROADMAP.md`]

| Phase | Nội dung | Spec | Trạng thái |
|---|---|---|---|
| P0 | Audit workspace, hạ tầng, kiến trúc, kế hoạch nội dung | AG-00 → 03 | Đã đóng |
| P1 | Design tokens, prototype HTML, responsive | AG-04 → 08 | Đã đóng |
| P2 | Nền ứng dụng, schema, đăng nhập/RBAC, nguyên liệu, trình soạn công thức, upload, xuất bản | AG-09 → 16 | Đã đóng |
| P3 | Tìm kiếm & lọc, đổi khẩu phần, Cooking Mode, lưu món, ghép mâm, đi chợ, SEO, health check | AG-17 → 26 | Đã đóng |
| P4 | AI: ranh giới & ngân sách, gợi ý mâm cơm, soạn nháp AI, đánh giá chống bịa | AG-27 → 30 | Đã đóng |
| P5 | Cộng đồng: gửi công thức, kiểm duyệt, báo cáo vi phạm, biến thể vùng miền, "Đã nấu thử" + Cooksnap | AG-31 → 34 | Đã đóng |
| P6 | Dinh dưỡng: đối chiếu FCT, tính Kcal/Macro, nhật ký bữa ăn & tổng kết ngày | AG-35 → 38 | Đã đóng |
| P7 | Mở rộng catalog (món nước, chay, đồ uống, tráng miệng), Tủ lạnh `/tu-lanh`, Kế hoạch 7 ngày | AG-39 → 41 | Đã đóng |
| R0–R8 | Secret fail-closed, Data Honesty, Core & E2E CI, Drizzle 11/11, Đăng ký, Quên mật khẩu/SMTP, Chợ công thức & Gating | R0 → R8 | Đã đóng |
| **Phase U** | **Next.js `16.4.6`, Cooksnap & đơn vị bếp nhà, đa timer/WakeLock/TTS, AI Scanner 3 chế độ + giọng nói VN, Visual Food Diary + 167 hàng quán VN, Hồ sơ gia đình 2–5 người + Guardrail bệnh lý, Giỏ đi chợ live 24h & Trừ đồ Tủ lạnh** | **U0 → U5** | **Đã đóng (22/11/2026)** |
| P8 | Kinh doanh & thanh toán trực tuyến (`R9–R10`) | — | Chờ dữ liệu thật & pháp nhân |

---

## 4. Các trang cho người dùng [đã kiểm — `src/app/`]

| Đường dẫn | Chức năng |
|---|---|
| `/` | Trang chủ, **Hero Food Scanner AI** (chia mâm chung, giọng nói `vi-VN`, lưu Visual Timeline), khám phá món |
| `/mon-an` | Tìm theo tên/alias/nguyên liệu + bộ lọc đa trục + chip dinh dưỡng (`≤ 300 kcal`, `≤ 250 kcal`, `≤ 20 phút`, bảng Dinh dưỡng) |
| `/cong-thuc/[slug]` | Chi tiết công thức: đơn vị chuẩn `g/ml` ↔ `Bếp nhà` (`lạng/muỗng/chén`), đổi khẩu phần, nhãn kiểm chứng thật, bảng FCT, Cooksnap nén ảnh R2/local, JSON-LD `Recipe` |
| `/cong-thuc/[slug]/nau` | Chế độ nấu toàn màn hình: **WakeLock giữ sáng màn hình**, **đọc giọng nói tiếng Việt**, **đa đồng hồ hẹn giờ chạy nền**, ngăn kéo nguyên liệu |
| `/tinh-calo` | Tính **BMI Châu Á (`>= 23`) / BMR / TDEE**, bàn **AI Scanner 3 chế độ (`MEAL` · `FRIDGE` · `LABEL`)**, **Tra cứu 167 món hàng quán VN**, **đồng bộ TDEE sang Hồ sơ Gia đình** |
| `/meal` | Ghép mâm **4 ô** (`Mặn · Canh · Rau · Nước chấm`), **8 preset bệnh lý/thể trạng + Chấm điểm Guardrail**, **Chia khẩu phần 2–5 thành viên**, gợi ý AI từ tủ lạnh |
| `/shopping` | Gộp nguyên liệu đi chợ theo quầy, **tự động phát hiện & trừ đồ còn hạn trong Tủ lạnh**, **Giỏ đồng bộ PostgreSQL 24h** kèm **đồ mua thêm ngoài mâm** & xuất Zalo |
| `/tu-lanh` | Quản lý 3 ngăn (`Mát/Đông/Kho`), cảnh báo cận hạn, **Camera AI quét ảnh Tủ lạnh trực tiếp**, cất 1 chạm từ giỏ đi chợ |
| `/ke-hoach-tuan` | Kế hoạch 7 ngày (đủ 4 bữa gồm `SNACK`), gộp giỏ chợ trừ đồ tủ lạnh, ghi nhật ký 1 chạm |
| `/nhat-ky` | Nhật ký ăn uống, **167 món hàng quán + nút gạt giảm Calo/Natri**, **Visual Food Timeline**, **Điểm Đĩa Harvard (0–100)**, **Streak**, **Nước uống**, **Adaptive TDEE** & **lọc theo thành viên** |
| `/da-luu` | Món đã lưu, thư mục cá nhân & nút mở nhanh **AI Recipe Clipper** (`/contribute/new?ai=1`) |
| `/nguoi-nau/[slug]` | Hồ sơ người nấu công khai, công thức & Creator Bundles + nút nhận dùng thử |
| `/contribute`, `/contribute/new`, `/contribute/[id]` | Bếp Nhà cộng đồng: tạo/sửa công thức, bóc tách công thức bằng AI, quản lý Creator Bundles |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/profile` | Đầy đủ luồng tài khoản, đặt lại mật khẩu qua email & quản lý hồ sơ cá nhân/Creator |

## 5. Khu biên tập/quản trị (`/editor/*`, cần vai trò EDITOR/ADMIN)

`/editor/recipes` (danh sách + tạo/sửa công thức có cấu trúc, nút "Soạn bằng AI"), `/editor/recipes/review` (hàng đợi duyệt bài cộng đồng), `/editor/ingredients` (từ điển nguyên liệu), `/editor/taxonomies` (phân loại), `/editor/reports` (báo cáo vi phạm, gỡ bài), `/editor/feedbacks` (duyệt phản hồi "đã nấu").

Quy tắc nghiệp vụ đã cài: công thức đã xuất bản không sửa trực tiếp mà tạo revision; bản nháp AI luôn ở `DRAFT` + đánh dấu `AI_ASSISTED`, không tự xuất bản; dinh dưỡng thiếu dữ liệu thì không hiển thị thành 0.

## 6. API (~43 route trong `src/app/api/`)

`auth` (login/logout/me) · `recipes` (CRUD, publish, reject, revisions, report, feedback, nutrition, pantry-check) · `ingredients`, `taxonomies`, `upload` · `meal` (options, random, aggregate) · `saved-recipes` (+ sync, cards) · `ai/meal-suggestion`, `ai/recipe-draft` · `contribute/recipes` · `editor/reports`, `editor/feedbacks` · `diary` (+ export, clear) · `pantry` (+ sync-from-shopping) · `meal-plans` (+ to-shopping, log-to-diary) · `health`. Có kiểm tra cùng nguồn (same-origin) cho request thay đổi dữ liệu (`src/lib/http/sameOrigin.ts`).

---

## 7. Nội dung & dữ liệu [đã kiểm — script seed]

- `seed_production_catalog.ts`: **12 món cơm nhà** (thịt ba chỉ kho tiêu, cá basa kho tộ, gà rang gừng, sườn rim chua ngọt, thịt nạc xào ớt chuông, canh chua cá lóc, canh gà gừng, canh rau ngót thịt băm, canh sườn nấu chua, đậu cove xào tỏi, rau muống xào tỏi, đậu hũ sốt cà chua).
- `seed_p7_catalog.ts`: **5 món** (phở bò Hà Nội, bún bò Huế, đậu hũ sốt cà chua chay, chè bưởi, nước sâm bí đao).
- Tổng khoảng **17 món**, mục tiêu Batch 1 cho MVP là **30 món** (D22). Ảnh `heroImage` là ảnh Unsplash.
- **Mâu thuẫn:** cả hai script seed đặt `isEditorialReviewed: true` và `isCookTested: true` cho mọi món, trong khi quyết định D23 chỉ cho bật `COOK_TESTED` khi đã nấu thử thật. Chưa có bằng chứng các món đã được nấu thử.
- Không có DB nào đang chạy trong workspace lúc kiểm (không có container nào), nên chưa đếm được số bản ghi thật trong DB.

---

## 8. Vấn đề phát hiện khi rà code [đã kiểm]

| # | Mức | Vấn đề | Chỗ | Trạng thái (21/10/2026) |
|---|---|---|---|---|
| 1 | **Nghiêm trọng** | Code đọc khoá phiên từ `AUTH_SECRET`, nhưng `docker-compose.prod.yml` chỉ truyền `JWT_SECRET`. Deploy prod như hiện tại thì code dùng chuỗi mặc định viết cứng `angimom_default_fallback_secret_...`, nên ai biết chuỗi này có thể tự ký cookie admin | `src/lib/auth/session.ts:6`, `docker-compose.prod.yml:35` | ✅ **ĐÃ GIẢI QUYẾT TẠI R0** (D58): Thống nhất `AUTH_SECRET`, xóa fallback mặc định, lazy fail-closed, tích hợp 503 readiness. |
| 2 | Cao | Mật khẩu DB/JWT mặc định viết sẵn trong `docker-compose.prod.yml` (dạng `${VAR:-giá_trị}`) và mẫu mật khẩu trong `docs/PRODUCTION_DEPLOYMENT_GUIDE.md`. Quên đặt biến là chạy luôn với mật khẩu công khai | các file trên | ✅ **ĐÃ GIẢI QUYẾT TẠI R0** (D58): Chuyển thành cú pháp bắt buộc `${VAR:?error}` trong compose prod & dev. |
| 3 | Cao | Nhãn "đã nấu thử / đã biên tập" bật sẵn cho mọi món seed, trái D23. Người dùng sẽ thấy nhãn kiểm chứng không đúng sự thật | `src/scripts/seed_*_catalog.ts` | ✅ **ĐÃ GIẢI QUYẾT TẠI R1** (D59): Tắt `isCookTested = false` cho toàn bộ 17 món hạt giống, gán nhãn `Ảnh minh họa` cho ảnh Unsplash trên mọi bề mặt UI, hiển thị `Chờ kiểm nghiệm bếp mẫu` trung thực. |
| 4 | Trung bình | Chưa có trang đăng ký / quên mật khẩu | `src/app/` | ✅ **ĐÃ GIẢI QUYẾT TẠI R5–R6** (D63, D64): Đầy đủ `/register`, `/forgot-password`, `/reset-password`, `/profile`, native SMTP Mắt Bão. |
| 5 | Trung bình | Test & Migration journal chưa đồng bộ đầy đủ | `drizzle/meta/_journal.json`, `Dockerfile.prod` | ✅ **ĐÃ GIẢI QUYẾT TẠI R4 & Phase U**: Đồng bộ 16/16 SQL migrations (`0000` → `0015`), `Dockerfile.prod` copy đầy đủ `drizzle/`, bổ sung `test_webapp_security_audit.ts` (66/66 PASS). |
| 6 | Thấp | Tài liệu lỗi thời: README, FEATURES.md, HIEN_TRANG_DU_AN.md, ROADMAP.md, API.md | `docs/`, `README.md` | ✅ **ĐÃ ĐỒNG BỘ TẠI Phase U (22/11/2026)**: Đồng bộ toàn bộ tài liệu theo code thật trên `main`. |
| 7 | Thấp | Mở rộng hệ sinh thái AI Scanner, Hàng quán VN & Giỏ đi chợ live | `src/` | ✅ **ĐÃ GIẢI QUYẾT TẠI Phase U (U0–U5)**: D67–D72 đã hoàn tất, verified qua `tsc`, `eslint`, `next build` (`16.4.6`). |

Đã kiểm ngày `22/11/2026`: `node ./node_modules/typescript/bin/tsc --noEmit` (`0`), `npm run lint` (`0 errors`), `npx tsx src/scripts/test_data_honesty.ts` (`38/38`), `npm run test:security` (`66/66`), và `node ./node_modules/next/dist/bin/next build` (`87/87` trang tĩnh).

---

## 9. Thông tin còn thiếu (phải có từ chủ sản phẩm)

- VPS: nhà cung cấp, cấu hình, OS. Domain (docs gợi ý `angimom.vn`, chưa xác nhận). DNS.
- Ngân sách tháng (O3), khoá Gemini/OpenAI có dùng thật không, tài khoản Cloudflare R2 và Resend.
- Ai là người nấu thử và duyệt nội dung cuối (D23).
- Logo chính thức (D08: hiện chỉ có wordmark tạm).

---

## 10. Hướng dẫn vận hành tiếp theo (sau 22/11/2026)

Toàn bộ các bước kỹ thuật P0 → P7, R0 → R8 và Phase U (`U0` → `U5`) đã hoàn tất. Thứ tự tiếp theo thiên về vận hành thực tế:

1. **Redeploy production** từ nhánh `main` (`git push origin main` đã xong; `Dockerfile.prod` tự động kèm thư mục `drizzle/` để `autoBootstrap.ts` hoặc `node scripts/migrate_production.js` chạy đủ `0000` → `0015`).
2. **Nạp / kiểm tra khóa API Vision** (Gemini / OpenAI / DeepSeek) trong cổng `/editor/ai-settings` để bảo đảm tính năng AI Quét ảnh bữa ăn / Tủ lạnh / Nhãn bao bì hoạt động với model thực tế.
3. **Nấu thử & xác thực ảnh món thật** trên điện thoại thông qua tính năng Cooksnap trong trang chi tiết món ăn, chỉ bật `isCookTested = true` đối với món đã nấu kiểm chứng thật (D23).
4. **Theo dõi chỉ số người dùng thật** trên `/tinh-calo`, `/meal`, `/shopping` và `/nhat-ky` trước khi mở `P8` / `R9–R10` (thanh toán trực tuyến).

---

## 11. Tài liệu tham chiếu trong repo

`docs/AN_GI_MOM_MASTER_PLAN.md` (kế hoạch gốc) · `docs/ROADMAP.md` · `docs/DECISIONS.md` (D01 → D72) · `docs/FEATURES.md` · `docs/API.md` · `docs/PRODUCT_BRIEF.md` · `docs/DATA_MODEL.md` · `docs/DESIGN_SYSTEM.md` · `docs/CONTENT_GUIDELINES.md` · `docs/TEST_LOG.md` · `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` · `docs/mini-specs/AG-xx.md`.
