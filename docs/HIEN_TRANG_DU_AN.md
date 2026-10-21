# ĂN GÌ MOM — Hiện trạng dự án (21/10/2026)

> Tài liệu này dùng để nạp cho chatbot/AI trợ lý, giúp nó nắm tình trạng thật của website trước khi đề xuất việc tiếp theo.
> Nguồn: đọc trực tiếp mã nguồn trong `src/`, `drizzle/`, các file docker và `docs/` tại commit `b9f5937`.
> Quy ước: **[đã kiểm]** = đã xác minh bằng lệnh hoặc đọc code hôm nay · **[theo docs]** = do tài liệu dự án tự ghi, chưa chạy lại để xác nhận.

---

## 1. Tóm tắt nhanh

- **Sản phẩm:** website tiếng Việt cho người nấu cơm gia đình: tìm món → xem công thức → đổi khẩu phần → ghép mâm cơm 3 món → gộp nguyên liệu đi chợ → nấu từng bước → lưu món.
- **Tiến độ trên giấy:** roadmap ghi **P0 → P7 đã đóng (AG-00 → AG-41)**, gồm cả AI, cộng đồng, dinh dưỡng, tủ lạnh và kế hoạch tuần. Còn lại P8 (kinh doanh/scale) chưa bắt đầu. **[theo docs]**
- **Thực tế:** toàn bộ được làm trong khoảng **20–21/10/2026 (~2 ngày, 1 người + AI)**. Các "Gate" do chính AI tự chấm, **chưa có người dùng thật dùng thử**, **chưa deploy lên đâu**, **chưa có domain/VPS**.
- **Nội dung:** khoảng **17 món** trong script seed (mục tiêu MVP là 30 món). Ảnh minh hoạ lấy từ Unsplash, không phải ảnh món thật.
- **Code:** TypeScript typecheck sạch (`tsc --noEmit` exit 0) **[đã kiểm]**. Code đã đẩy lên GitHub `junnyken/angimom`, nhánh `main` khớp với `origin/main` **[đã kiểm]**.
- **Rủi ro lớn nhất đang có:** nếu deploy production bằng `docker-compose.prod.yml` hiện tại thì **khoá ký phiên đăng nhập rơi về chuỗi mặc định viết cứng trong code**, nên ai biết chuỗi đó có thể giả mạo tài khoản admin (chi tiết ở mục 8).

---

## 2. Công nghệ đang dùng thật (khác một phần so với `docs/ARCH.md`)

| Lớp | Thực tế trong code [đã kiểm] | `ARCH.md` ghi |
|---|---|---|
| Framework | Next.js **16.4.2** App Router, React 19.3, TypeScript | Next.js App Router ✅ |
| UI | Tailwind CSS v4 + lucide-react. **Không có** Radix/shadcn | Tailwind + Radix/shadcn ❌ |
| Form/validate | Tự viết, **không có** React Hook Form / Zod | RHF + Zod ❌ |
| DB | PostgreSQL 16 + Drizzle ORM 0.45, 11 file migration (`drizzle/0000` → `0010`) | ✅ |
| Đăng nhập | Tự viết: mật khẩu băm scrypt + token ký HMAC-SHA256 trong cookie HttpOnly (`src/lib/auth/session.ts`). Vai trò: `ADMIN`, `EDITOR`, `COOK` | NextAuth v5 ❌ |
| Lưu ảnh | Adapter: Cloudflare R2 / S3 nếu có khoá, không có thì lưu ổ đĩa local (`src/lib/storage/`) | Chỉ local volume ⚠️ (đã đổi ở bước hạ tầng sau) |
| Email | Resend API, thiếu khoá thì chỉ ghi log (`src/lib/email/`) | SMTP Nodemailer ❌ |
| AI | Gateway riêng (`src/lib/ai/`): Gemini → OpenAI → Mock heuristic (dự phòng), có giới hạn token/timeout/rate limit | — |
| Kiểm thử | ~30 script `src/scripts/test_*.ts` tự in PASS/FAIL, chạy bằng tsx. **Không có** Vitest, Playwright, CI | Vitest + Playwright ❌ |
| PWA | `public/manifest.json` + `public/sw.js` (service worker offline) | — |
| Hạ tầng | Dockerfile + `docker-compose.yml` (dev), `Dockerfile.prod` + `docker-compose.prod.yml` + `Caddyfile` (prod, HTTPS tự động), `scripts/deploy_production.sh`, `backup_db.sh`, `restore_db.sh` | ✅ |

---

## 3. Tiến độ theo phase [theo docs — `docs/ROADMAP.md`]

| Phase | Nội dung | Spec | Trạng thái docs ghi |
|---|---|---|---|
| P0 | Audit workspace, hạ tầng, kiến trúc, kế hoạch nội dung | AG-00 → 03 | Đã đóng (hạ tầng VPS vẫn `unknown`) |
| P1 | Design tokens, prototype HTML (khám phá, công thức, mâm cơm, đi chợ), responsive | AG-04 → 08 | Đã đóng |
| P2 | Nền ứng dụng, schema, đăng nhập/phân quyền, CRUD nguyên liệu & phân loại, trình soạn công thức, upload ảnh, quy trình xuất bản, trang công thức công khai | AG-09 → 16 | Đã đóng |
| P3 | Tìm kiếm & lọc, đổi khẩu phần, chế độ nấu, lưu món, ghép mâm, gộp nguyên liệu, checklist đi chợ, SEO, health check/log, duyệt nội dung | AG-17 → 26 | Đã đóng, docs gọi là "MVP Pilot Ready" |
| P4 | AI: ranh giới & ngân sách, gợi ý mâm cơm từ kho món, AI soạn nháp, đánh giá chống bịa | AG-27 → 30 | Đã đóng |
| P5 | Cộng đồng: gửi công thức, kiểm duyệt & báo cáo vi phạm, biến thể vùng miền & câu chuyện bếp, phản hồi "đã nấu" + ảnh | AG-31 → 34 | Đã đóng |
| P6 | Dinh dưỡng: nguồn dữ liệu, tính dinh dưỡng, nhật ký ăn uống, tổng kết ngày | AG-35 → 38 | Đã đóng |
| P7 | Mở rộng catalog (món nước, chay, đồ uống, tráng miệng), tủ lạnh/kho, kế hoạch 7 ngày | AG-39 → 41 | Đã đóng |
| P8 | Kinh doanh & scale | — | Chưa làm, master plan nói chỉ làm khi có dữ liệu dùng thật |

Lưu ý: `README.md` vẫn ghi "đang ở AG-00, chưa có code" và `docs/FEATURES.md` vẫn ghi "chưa có capability nào". Hai file này **đã lỗi thời**.

---

## 4. Các trang cho người dùng [đã kiểm — `src/app/`]

| Đường dẫn | Chức năng |
|---|---|
| `/` | Trang chủ, khám phá món, nút "Hôm nay ăn gì?" (random mâm 3 món) |
| `/mon-an` | Tìm theo tên/alias/nguyên liệu + bộ lọc nhiều trục (vai trò, độ khó, thời gian…), filter phản ánh lên URL, phân trang |
| `/cong-thuc/[slug]` | Chi tiết công thức: nguyên liệu, đổi khẩu phần, các bước, nhãn kiểm chứng, dinh dưỡng, biến thể vùng miền, câu chuyện bếp, "đã nấu" + ảnh, báo cáo vi phạm, lưu món, ghi nhật ký, đối chiếu tủ lạnh, JSON-LD Recipe |
| `/cong-thuc/[slug]/nau` | Chế độ nấu toàn màn hình: từng bước, hẹn giờ (không tự chuyển bước), xem nhanh nguyên liệu |
| `/meal` | Ghép mâm cơm 3 món (mặn / canh / rau), đổi từng món, chỉnh khẩu phần cả mâm, gợi ý mâm bằng AI |
| `/shopping` | Danh sách đi chợ gộp từ mâm, tick đã mua (lưu localStorage), xuất danh sách |
| `/da-luu` | Món đã lưu (khách lưu localStorage, đăng nhập thì đồng bộ lên server) |
| `/tu-lanh` | Quản lý tủ lạnh/kho, nhập từ danh sách đi chợ |
| `/ke-hoach-tuan` | Kế hoạch 7 ngày, chuyển sang danh sách đi chợ, ghi vào nhật ký |
| `/nhat-ky` | Nhật ký ăn uống & tổng kết dinh dưỡng theo ngày, xuất / xoá dữ liệu |
| `/contribute`, `/contribute/new`, `/contribute/[id]` | "Bếp Nhà": thành viên gửi công thức, sửa khi bị yêu cầu chỉnh |
| `/login` | Đăng nhập (**chưa có trang đăng ký tài khoản**, tài khoản tạo qua script seed) |

Giao diện: mobile-first, có thanh điều hướng dưới cho mobile (`MobileBottomNav`). Màu kem `#FAF7F0`, xanh lá `#3F6240`, cam đất `#B75B35`, font Be Vietnam Pro.

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
| 4 | Trung bình | Chưa có trang đăng ký / quên mật khẩu, người dùng thật chưa tự tạo tài khoản được (dù có code gửi email) | `src/app/` |
| 5 | Trung bình | Test chỉ là script tự viết, cần DB thật, không có CI. Chưa có test giao diện end-to-end (Playwright) cho luồng chính | `src/scripts/test_*.ts` | 🟡 **MỘT PHẦN TẠI R2** (D60): Thêm `npm run test:core` thuần, không cần DB (85 assertions) cho co giãn/gộp đi chợ/văn bản Zalo/giữ trạng thái URL/an toàn timer. Audit R2 phát hiện & sửa 5 lỗi thật (B1 nhãn quầy tiếng Việt rơi hết vào "khác", B2 thiếu quầy gia vị & đồ khô, B3 mất `?servings` khi bấm "Bắt đầu nấu", B4 quay lại từ `/shopping` mất mâm, B5 hiện "0" ở bước timer = 0). **Còn mở:** chưa có CI, chưa có Playwright E2E, các script cũ vẫn cần Postgres. ➜ 🟢 **CẬP NHẬT R3** (D61): Đã có Playwright E2E (`npm run test:e2e`, desktop + Pixel 7, Postgres test + seed thật) và workflow GitHub Actions `.github/workflows/ci.yml`. **Vẫn mở:** CI chỉ được chứng minh khi push lên GitHub; lint toàn repo còn lỗi có sẵn; `drizzle/meta/_journal.json` chỉ khai báo 3/11 migration nên `npm run db:migrate` trên DB mới **không** dựng đủ schema (deploy script chạy psql và nuốt lỗi) — cần task riêng. |
| 6 | Thấp | Tài liệu lỗi thời: README, FEATURES.md, ARCH.md (NextAuth/Zod/Radix/local storage), INFRA_INVENTORY (VPS `unknown`) | `docs/` |
| 7 | Thấp | Vẫn còn file mẫu của Next (`public/next.svg`, `vercel.svg`…); `.env.example` chưa có `GEMINI_API_KEY` / `OPENAI_API_KEY` | `public/`, `.env.example` |

Chưa kiểm hôm nay: chạy `npm run build`, chạy bộ test script, thử giao diện trên trình duyệt. Số liệu "PASS" trong `docs/TEST_LOG.md` là do AI tự ghi lúc làm từng spec.

---

## 9. Thông tin còn thiếu (phải có từ chủ sản phẩm)

- VPS: nhà cung cấp, cấu hình, OS. Domain (docs gợi ý `angimom.vn`, chưa xác nhận). DNS.
- Ngân sách tháng (O3), khoá Gemini/OpenAI có dùng thật không, tài khoản Cloudflare R2 và Resend.
- Ai là người nấu thử và duyệt nội dung cuối (D23).
- Logo chính thức (D08: hiện chỉ có wordmark tạm).

---

## 10. Gợi ý hướng đi tiếp (để chatbot cân nhắc, chưa phải quyết định)

Master plan nói rõ P8 chỉ làm sau khi có dữ liệu dùng thật. Hiện chưa có người dùng thật nên **không nên mở thêm tính năng**. Thứ tự hợp lý:

1. **Sửa lỗi bảo mật trước khi deploy:** thống nhất biến khoá phiên (`AUTH_SECRET`), bỏ fallback viết cứng (thiếu biến thì không cho khởi động), bỏ mật khẩu mặc định trong compose prod.
2. **Trung thực dữ liệu:** tắt `isCookTested` / `isEditorialReviewed` ở seed, chỉ bật khi đã nấu thử thật. Thay ảnh Unsplash bằng ảnh món thật hoặc ghi rõ là ảnh minh hoạ.
3. **Nội dung:** nâng từ ~17 lên 30 món Batch 1 đã kiểm (15 mặn, 8 canh, 7 rau/phụ).
4. **Deploy staging thật** lên VPS/domain, chạy backup/restore thử một lần.
5. **Pilot với 5–10 người nấu thật** trên điện thoại, theo luồng: tìm món → ghép mâm → đi chợ → nấu. Ghi lại chỗ vướng.
6. **Bổ sung đăng ký tài khoản** (nếu pilot cần người dùng tự tạo tài khoản) và test E2E cho luồng chính.
7. **Cập nhật docs** cho khớp code (README, FEATURES, ARCH).
8. Sau pilot mới quyết định có giữ/thu gọn các phần P4–P7 (AI, cộng đồng, dinh dưỡng, tủ lạnh, kế hoạch tuần) hay không. Đây là nhiều tính năng cho một người vận hành (D11).

---

## 11. Tài liệu tham chiếu trong repo

`docs/AN_GI_MOM_MASTER_PLAN.md` (kế hoạch gốc) · `docs/ROADMAP.md` · `docs/DECISIONS.md` (D01 → D57) · `docs/PRODUCT_BRIEF.md` · `docs/DATA_MODEL.md` · `docs/DESIGN_SYSTEM.md` · `docs/CONTENT_GUIDELINES.md` · `docs/TEST_LOG.md` · `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` · `docs/mini-specs/AG-xx.md` (spec từng bước).
