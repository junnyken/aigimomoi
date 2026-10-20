# ĂN GÌ MOM — MASTER PLAN TRIỂN KHAI

Phiên bản: 1.0  
Ngày: 15/10/2026  
Chủ sản phẩm: Nguyễn Thiên Triều  
Phương thức triển khai: một người vận hành cùng Antigravity  
Ngôn ngữ sản phẩm: tiếng Việt  
Trạng thái: kế hoạch nền; chưa có audit repo hoặc hạ tầng; chưa phải giấy phép chạy toàn bộ roadmap.

---

## 0. Cách sử dụng tài liệu

Đây là nguồn định hướng sản phẩm, phạm vi và thứ tự triển khai. Tài liệu không thay thế MINI-SPEC của từng capability, không chứng minh code đã tồn tại và không cho phép agent tự xây toàn bộ roadmap.

Đọc kèm hai tài liệu gốc do chủ sản phẩm cung cấp:
- MINI_SPEC_PLAYBOOK.md: grammar bắt buộc cho MINI-SPEC, audit, test và report.
- SKILL-UI-UX-Resource-Navigator.md: quy trình brief, tham chiếu, token, component, trạng thái và QA.

Thứ tự ưu tiên khi có xung đột:
1. Quyết định mới nhất được chủ sản phẩm duyệt và ghi trong DECISIONS.md.
2. Các guardrail bảo mật, trung thực dữ liệu và phạm vi của MINI-SPEC đã duyệt.
3. Hai skill gốc.
4. Master plan này.
5. Đề xuất tự sinh của agent.

Nếu phát hiện xung đột: dừng, nêu xung đột và xin quyết định; không âm thầm bỏ yêu cầu.

### Quy tắc duyệt
- Trước build: agent trình MINI-SPEC hoàn chỉnh, chủ sản phẩm duyệt scope.
- Sau build: agent trình bằng chứng, chủ sản phẩm duyệt đóng MINI-SPEC.
- Không tự chạy MINI-SPEC kế tiếp, kể cả cùng phase.
- Không coi im lặng là đồng ý.
- Việc duyệt roadmap không phải duyệt deploy, mua dịch vụ hoặc thay đổi production.
- Phát sinh scope mới sau audit: cập nhật spec và xin duyệt lại.

---

## 1. Quyết định đã chốt và thông tin còn thiếu

### 1.1. Quyết định từ chủ sản phẩm

| ID | Nội dung đã chốt | Hệ quả trong kế hoạch |
|---|---|---|
| D01 | Chưa có code/dự án | Bắt đầu bằng workspace audit và bootstrap |
| D02 | Người dùng chính là người nấu cơm gia đình | Luồng bữa cơm là trung tâm |
| D03 | MVP theo lựa chọn B | Có tìm món, công thức, khẩu phần, chế độ nấu, lưu món, thực đơn và đi chợ |
| D04 | Quản trị đăng trước, cộng đồng mở sau | Tái sử dụng editor; bổ sung quyền cộng đồng ở giai đoạn sau |
| D05 | Chưa có nội dung | Content pipeline là một workstream bắt buộc |
| D06 | AI gợi ý từ kho đã duyệt và hỗ trợ soạn nháp | Xây hai capability riêng; không tự xuất bản nội dung AI |
| D07 | Đã có hạ tầng/tài khoản muốn tận dụng | Audit trước, không mặc định mua thêm hoặc chuyển nền tảng |
| D08 | Tên ĂN GÌ MOM; chưa có logo | Tạo định hướng nhận diện và wordmark tạm, chờ duyệt |
| D09 | Kem nhạt + xanh lá, bếp gia đình pha trẻ trung | Thiết kế sáng, ấm, thoáng và mobile-first |
| D10 | Tiếng Việt ban đầu | Nội dung UI quản lý tập trung; chưa làm đa ngôn ngữ |
| D11 | Làm một mình cùng Antigravity | Giới hạn công việc đang chạy; ưu tiên dễ vận hành |
| D12 | Dùng thử khi hoàn thiện | Hiểu là hoàn thiện MVP qua release gate, không chờ toàn bộ tầm nhìn |
| D13 | Xin duyệt sau từng MINI-SPEC | Không chạy roadmap tự động |

D12 là cách diễn giải đề xuất để tránh trì hoãn dùng thử vô hạn; chủ sản phẩm có thể sửa trước khi duyệt phạm vi MVP.

### 1.2. Thông tin chưa xác minh

| Thông tin | Trạng thái | Xử lý |
|---|---|---|
| Domain đang có và domain dùng cho dự án | Chưa biết | Xác nhận trong AG-01; không thay DNS tự động |
| VPS: cấu hình, OS, tài nguyên còn trống | Chưa biết | Audit chỉ đọc, không in secrets |
| Dịch vụ đang chạy trên VPS | Chưa biết | Kiểm tra nguy cơ ảnh hưởng trước deploy |
| Hosting/tài khoản DB/storage/email | Chưa biết | Lập inventory, chốt theo điều kiện thực tế |
| Ngân sách vận hành mỗi tháng | Chưa cung cấp | Chưa cam kết chi phí, không mặc định bằng 0 |
| Nhà cung cấp AI/model và budget | Chưa cung cấp | Quyết định trước triển khai AI |
| Người kiểm công thức/nấu thử | Chưa xác định | Chủ sản phẩm chịu trách nhiệm tổ chức hoặc phê duyệt nguồn |
| Cụm “ăn theo thì” | Chưa rõ nghĩa | Không suy thành ăn theo mùa hay nhịn ăn gián đoạn |
| Nút chọn món không cần AI | Chưa xác nhận trực tiếp | Đề xuất đưa vào discovery; xin duyệt tại spec |

Không cần gửi mật khẩu, SSH private key hoặc API key trong hội thoại/tài liệu. Agent chỉ dùng quyền và secrets được cấp qua môi trường phù hợp.

---

## 2. Tầm nhìn và mục tiêu

### 2.1. Định vị

ĂN GÌ MOM là website giúp người nấu cơm gia đình tìm món, chuẩn bị nguyên liệu đúng khẩu phần, ghép một bữa cơm và làm theo từng bước; về sau là nơi lưu món truyền thống, công thức cộng đồng và nhật ký ăn uống.

Tagline đề xuất, chờ duyệt: “Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.”

Không mặc định “MOM” giới hạn người dùng là phụ nữ hoặc người mẹ. Giọng thương hiệu thân thiện và bao quát mọi người nấu ăn trong gia đình.

### 2.2. Vòng giá trị

Tìm món → xem công thức → chọn khẩu phần → ghép bữa ăn → biết còn thiếu gì → nấu → lưu công thức/thực đơn.

Mở rộng: chia sẻ công thức → biên tập → xuất bản → người khác nấu thử → ghi nhận phần đã ăn và dinh dưỡng ước tính.

### 2.3. Tiêu chí mục tiêu
- Người dùng hoàn thành luồng chính không cần trợ giúp kỹ thuật.
- Định lượng và hướng dẫn đủ rõ để chuẩn bị/nấu thử.
- Nội dung xuất bản có nguồn và tình trạng biên tập rõ.
- Chất lượng công thức và trải nghiệm ưu tiên hơn số lượng món.
- Có thể quản trị và vận hành bởi một người.
- Không đánh đổi tính trung thực dữ liệu để tạo giao diện đẹp hoặc AI có vẻ thông minh.

---

## 3. Phạm vi MVP và ranh giới dài hạn

### 3.1. MVP bắt buộc

1. Trang chủ và khám phá món trong bữa cơm hằng ngày.
2. Tìm theo tên/alias/nguyên liệu và bộ lọc cơ bản.
3. Trang công thức có tác giả/nguồn, nguyên liệu, khẩu phần, thời gian, dụng cụ, các bước.
4. Đổi khẩu phần theo quy tắc được khai báo.
5. Chế độ nấu từng bước, dùng được không cần đăng nhập.
6. Tài khoản và lưu món yêu thích.
7. Ghép bữa cơm, đổi một món, giữ phần còn lại.
8. Gộp nguyên liệu và checklist đi chợ.
9. Quản trị công thức, nguyên liệu, ảnh, duyệt và xuất bản.
10. Bộ nội dung ban đầu đã kiểm tra và được chủ sản phẩm duyệt.
11. SEO kỹ thuật cơ bản, staging, backup, quan sát lỗi và release checklist.

AI được chủ sản phẩm chốt trong tầm nhìn. Đề xuất triển khai sau khi có kho nội dung và luồng MVP ổn; không phải dependency chặn MVP. Nếu chủ sản phẩm muốn AI xuất hiện ngay khi ra mắt, cần duyệt điều chỉnh roadmap, scope và chi phí trước build.

### 3.2. Chưa làm trong MVP
- Cộng đồng tự đăng công khai, bảng tin, chat và follow.
- Nhật ký calo cá nhân và thực đơn bệnh lý.
- Nhận diện món/định lượng từ ảnh.
- Thanh toán, thuê bao, đặt hàng hoặc giao đồ ăn.
- App native.
- Video tự tạo hàng loạt, 3D và hiệu ứng trang trí nặng.
- AI tự nghĩ công thức rồi xuất bản.
- Gợi ý mục tiêu calo y khoa hoặc khẳng định món phù hợp điều trị.

### 3.3. Nhóm nội dung
MVP: món mặn, canh, rau/món phụ trong bữa cơm gia đình.

Sau MVP: món nước ăn thành bữa (bún/phở/cháo), đồ uống, bánh/món ngọt, món chay, bộ sưu tập theo hoàn cảnh.

Phân loại theo nhiều trục, không trộn mọi khái niệm thành một danh mục ngang hàng:
- Vai trò: món chính, món phụ, canh, bữa độc lập, tráng miệng, đồ uống.
- Cách chế biến: kho, xào, hấp, luộc, chiên, nướng.
- Nguyên liệu chính.
- Vùng miền và tên địa phương, có nguồn khi tuyên bố nguồn gốc.
- Thời gian và độ khó.
- Kiểu ăn theo tiêu chí rõ ràng, chỉ gắn nhãn khi đủ thông tin.

---

## 4. Kiến trúc và quy tắc chọn hạ tầng

### 4.1. Phương án ứng dụng đề xuất

Một codebase TypeScript, các module có ranh giới rõ; chưa tách microservices.

- Next.js cho website công khai và khu vực quản trị.
- Tailwind + shadcn/ui cho component, token thống nhất.
- Lucide cho icon.
- React Hook Form + Zod cho form và validation.
- PostgreSQL cho dữ liệu quan hệ.
- Vitest cho unit; Playwright cho luồng end-to-end.

Đây là đề xuất cần audit và duyệt tại AG-02. Agent kiểm phiên bản tương thích và lock dependency khi khởi tạo; không dùng từ “latest” không xác định trong contract triển khai.

### 4.2. Hạ tầng chưa chốt

Không mặc định Supabase hoặc Vercel là bắt buộc. Ưu tiên tận dụng tài nguyên đang có nếu phù hợp và không làm ảnh hưởng hệ thống khác.

AG-01 phải kiểm:
- CPU/RAM/disk, dung lượng còn trống, OS và runtime.
- Reverse proxy, TLS, firewall, container/process manager nếu có.
- DB, storage, email, log/monitoring và backup hiện có.
- Domain, DNS và môi trường staging.
- Những dịch vụ khác đang dùng chung tài nguyên.
- Phương án cập nhật, rollback và khôi phục.

AG-02 phải chọn đúng một phương án cho từng lớp: hosting, database, authentication, storage và email. Ghi lý do chọn, chi phí cần xác minh, giới hạn và người chịu trách nhiệm.

Nếu dùng Supabase: kiểm DB permissions/RLS và storage policies. Nếu dùng PostgreSQL tự quản: áp dụng authorization phía server, tài khoản DB hạn chế quyền, backup và quản lý migration. Không coi cơ chế của hai phương án là giống nhau.

Không self-host thêm dịch vụ chỉ vì đã có VPS; cân nhắc công vận hành của một người.

### 4.3. Module
- Identity & access.
- Recipe catalog & publishing.
- Ingredient & taxonomy.
- Search & discovery.
- Serving adjustment.
- Cooking session.
- Meal planning & shopping.
- Media management.
- Sau này: community, AI assistance, nutrition, diary.

Quy tắc: reuse-first, không tạo editor cộng đồng hoặc engine gộp nguyên liệu thứ hai.

---

## 5. Domain model và invariants

### 5.1. Đối tượng

| Entity | Vai trò | Mốc triển khai |
|---|---|---|
| Dish | Món tổng quát và tên gọi/alias | Core |
| Recipe | Công thức cụ thể của một tác giả | Core |
| RecipeVersion | Bản công thức cố định có lịch sử | Core publishing |
| Ingredient | Nguyên liệu chuẩn hóa | Core |
| RecipeIngredient | Lượng, đơn vị, trạng thái, nhóm nguyên liệu | Core |
| RecipeStep | Giai đoạn, nội dung, thời gian, tham chiếu nguyên liệu | Core |
| TaxonomyTerm | Bộ phân loại mở rộng | Core |
| MediaAsset | Ảnh, chủ sở hữu, nguồn, quyền và trạng thái | Core |
| Profile | Người dùng/tác giả | Core |
| SavedRecipe | Món đã lưu riêng tư | MVP |
| MealPlan/MealPlanItem | Bữa ăn và món trong bữa | MVP |
| ShoppingList/ShoppingListItem | Nguyên liệu gộp và trạng thái đã có | MVP |
| ModerationEvent | Lịch sử quyết định duyệt | Core, mở rộng cộng đồng |
| AIJob | Task AI, trạng thái, provenance và chi phí | Sau MVP |
| NutrientSource/IngredientNutrient | Nguồn và ánh xạ dinh dưỡng | Dinh dưỡng |
| MealLog/MealLogItem | Lượng đã ăn và snapshot | Nhật ký |

Chỉ tạo schema cần cho spec hiện tại. Với entity tương lai, ghi contract định hướng, không tạo bảng giả dùng để tuyên bố feature đã hoàn thành.

### 5.2. Quy tắc công thức
- Dish không đồng nghĩa Recipe; một món có nhiều cách nấu.
- Ingredient lưu dữ liệu có cấu trúc; không chỉ một chuỗi văn bản.
- Số lượng và đơn vị là hai trường riêng.
- Cho phép optional ingredient và quantity chưa định lượng, nhưng phải ghi rõ giới hạn.
- Trạng thái sống/chín và phần ăn được phải có khi ảnh hưởng tính toán.
- Số khẩu phần, vai trò trong bữa và khối lượng thành phẩm là thông tin khác nhau.
- RecipeVersion đã xuất bản không bị sửa âm thầm.
- Sửa bản công khai tạo revision; bản cũ tiếp tục hiển thị cho đến khi revision được duyệt, trừ trường hợp cần ẩn vì an toàn/quyền.
- Các nhãn “đã biên tập”, “đã nấu thử” và “đủ dữ liệu dinh dưỡng” độc lập.

### 5.3. Đổi khẩu phần
- Lưu base servings và quy tắc scale cho từng dòng nguyên liệu khi cần.
- Chính sách MVP có thể gồm: tuyến tính, giữ cố định, cần người dùng tự điều chỉnh.
- Phải nói rõ những lượng chưa scale được; không tạo số có vẻ chính xác.
- Không mặc định thời gian, dụng cụ và lượng nước đều tăng tuyến tính.
- Làm tròn chỉ ở bước hiển thị; quy tắc riêng cho số quả/thìa được khai báo.
- Đổi qua lại khẩu phần không tích lũy sai số từ giá trị đã làm tròn.

### 5.4. Gộp nguyên liệu
Chỉ gộp khi cùng ingredient identity, trạng thái phù hợp và đơn vị tương thích.

Ví dụ: 300 g và 0,2 kg có thể gộp theo quy tắc chuyển đổi đã chốt; một bó và 100 g không được tự cộng nếu chưa có mapping.

- Không gộp sống với chín một cách mặc định.
- Không gộp nguyên liệu thay thế với nguyên liệu chính khi chưa chọn thay thế.
- Truy được mỗi dòng về từng công thức.
- Đổi món hoặc khẩu phần phải tính lại; không giữ kết quả cũ gây hiểu nhầm.
- Lượng tùy khẩu vị hiển thị riêng.

### 5.5. Trạng thái đề xuất
Publishing: draft → submitted → published; rejected/needs_changes và archived theo workflow được chốt trong spec.

Nhãn dinh dưỡng: chưa có dữ liệu / thiếu dữ liệu / ước tính có nguồn. Không dùng cùng enum publishing để mô tả dinh dưỡng.

Tên enum cụ thể được khóa tại schema spec, không tự thêm synonym qua mỗi phase.

---

## 6. UX/UI specification

### 6.1. Brief
- Loại sản phẩm: website khách hàng, có backoffice quản trị.
- Người dùng: người nấu cơm gia đình, mức quen công nghệ đa dạng.
- Việc chính: chọn món/bữa; chuẩn bị đủ; làm theo cách nấu.
- Mobile-first, desktop đầy đủ.
- Tiếng Việt; sáng trước; không bắt buộc dark mode MVP.
- Công khai xem và nấu không cần login.
- Login cho lưu lâu dài và đồng bộ dữ liệu cá nhân.
- Guest meal plan/checklist đề xuất lưu cục bộ; đồng bộ khi login cần spec tránh mất/nhân đôi dữ liệu.

### 6.2. Tham chiếu và nhận diện
- Dùng ảnh đã gửi làm hướng bố cục/không khí, không sao chép thương hiệu Bếp An Nhiên.
- Nếu file ảnh không còn truy cập được, yêu cầu cung cấp lại; không giả đã xem.
- Chọn tối đa 2–3 tham chiếu mỗi màn hình, ghi cấu trúc học được.
- Nguồn trong skill là danh mục để chọn; phải mở và kiểm quyền trước khi sử dụng tài nguyên.
- Wordmark tạm “ĂN GÌ MOM” chờ duyệt; không tự tạo logo phức tạp làm dependency.
- Trẻ trung bằng chip, illustration nhỏ có chức năng, nhịp bố cục và câu chữ gần gũi; không biến thành giao diện trẻ em.

### 6.3. Token khởi điểm — chờ kiểm tra tương phản

| Token | Đề xuất |
|---|---|
| Background | #FAF7F0 |
| Surface | #FFFFFF |
| Text primary | #253126 |
| Text secondary | #596454 |
| Brand primary | #3F6240 |
| Accent | #B75B35 |
| Border | #E5E7DE |
| Font | Be Vietnam Pro, kiểm giấy phép và dấu tiếng Việt trước dùng |
| Body | 16px, line-height khoảng 1.6 |
| Type scale | 12, 14, 16, 20, 24, 32, 40; vai trò cụ thể trong design system |
| Spacing | 4, 8, 12, 16, 24, 32, 48 |
| Radius | 8, 12, 16, 24 |
| Shadow | Nhẹ; ưu tiên viền cho bảng/form |
| Icons | Lucide 16/20/24, cùng stroke |

Phải bổ sung token text tertiary, semantic success/warning/error/info, hover/active/disabled/focus và layer/z-index trước khi chốt. Palette chưa phải bằng chứng đạt AA.

### 6.4. Component
RecipeCard, RecipeMeta, ServingSelector, IngredientRow, CookingStep, CategoryChip, SearchFilterSheet, RecipeSourceInfo, EditorialBadge, DataStatusBadge, MealPlanCard, ShoppingListItem, EmptyState, ErrorState, Skeleton, FormErrorSummary, ConfirmationDialog.

Không trộn bộ icon/component. Không thêm chart trước khi có nhu cầu và dữ liệu nhật ký thật.

### 6.5. Sitemap MVP
- / : khám phá và entry tìm món.
- /mon-an : tìm kiếm/bộ lọc.
- /cong-thuc/[slug] : công thức công khai.
- /cong-thuc/[slug]/nau : chế độ nấu.
- /thuc-don : tạo/xem bữa ăn.
- /di-cho : checklist.
- /da-luu : công thức đã lưu.
- /tai-khoan : tài khoản.
- /quan-tri/... : backoffice có quyền.

Đây là route đề xuất, chốt tại contract spec. Không index trang riêng tư, nháp hoặc quản trị.

### 6.6. Luồng

A. Tìm và nấu:
Trang chủ → tìm/lọc → mở món → chọn khẩu phần → checklist nguyên liệu → bắt đầu nấu → tự xác nhận hoàn thành.

B. Chốt bữa cơm:
Thêm công thức vào bữa → chọn khẩu phần từng món hoặc áp dụng số người và rà lại → đổi một món → chốt → xem nguyên liệu đã gộp → đánh dấu đã có → đi chợ.

C. Biên tập:
Tạo nháp → nhập nguyên liệu/bước → ghi nguồn/ảnh → xem preview → kiểm tra → gửi duyệt → xuất bản → đọc lại bản công khai.

### 6.7. Yêu cầu tương tác
- Không bắt đăng nhập giữa luồng đọc/nấu.
- Tìm kiếm có URL phản ánh bộ lọc.
- Chế độ nấu có bước trước/sau, tổng quan và mở nguyên liệu không mất vị trí.
- Timer không tự chuyển bước; không mặc định món chín chỉ vì timer hết.
- Không đặt quảng cáo/animation che bước nấu.
- Mất mạng hoặc lưu thất bại phải nêu rõ, không báo thành công giả.
- Hành động ẩn/xóa/xuất bản có hậu quả phải xác nhận phù hợp và có nhật ký; không bắt gõ chuỗi xác nhận cho mọi việc như tick đi chợ.

### 6.8. Trạng thái màn hình

| Surface | Trạng thái cần thiết kế |
|---|---|
| Home | Loading, ít nội dung, lỗi từng khối |
| Search | Loading, không kết quả, lỗi, bộ lọc đang áp dụng |
| Recipe | Không tồn tại, không công khai, thiếu ảnh, thiếu định lượng |
| Cooking | Đang tải, chưa có bước, không khôi phục tiến độ, offline nếu có |
| Saved | Chưa login, chưa lưu, lỗi |
| Meal plan | Trống, món bị ẩn, đổi món thất bại, lưu chưa xong |
| Shopping | Trống, đơn vị không gộp được, dữ liệu tính lại, lưu thất bại |
| Editor | Lỗi field, thay đổi chưa lưu, đang lưu, thiếu nguồn, preview |
| Admin | Không quyền, không có bài chờ, lỗi thao tác |
| AI về sau | Đang xử lý, hết budget, provider lỗi, không đủ món phù hợp |

### 6.9. Copy và trợ năng
- Copy tiếng Việt lưu tập trung; agent đề xuất đánh dấu chờ duyệt trong tài liệu review, không để marker nội bộ lọt ra production.
- Nhãn form rõ, lỗi nêu ô cần sửa và cách sửa.
- Icon-only có accessible name.
- Focus nhìn thấy, thao tác bàn phím được.
- Kiểm text contrast theo skill: chữ thường 4.5:1, chữ lớn 3:1; vẫn kiểm các tiêu chí liên quan khác.
- Thử dấu tiếng Việt ở font size nhỏ nhất.
- Respect reduced motion; ảnh có kích thước, alt phù hợp, nén và lazy loading khi thích hợp.

---

## 7. Roadmap và dependency

Không cam kết lịch ngày/tuần khi chưa audit. Mỗi MINI-SPEC phải đủ hẹp; nếu có nhiều outcome độc lập, tách trước build. Bảng dưới là backlog định hướng, không phải tất cả spec đã được duyệt.

### P0 — Nền móng

| ID | Capability | Dependency | Acceptance chính |
|---|---|---|---|
| AG-00 | Workspace audit & skill setup | Tài liệu gốc | Có audit, skill và docs nền; chưa build app |
| AG-01 | Existing infrastructure inventory | AG-00 | Có inventory và giới hạn; không thay production |
| AG-02 | Architecture & domain decisions | AG-01 | Chọn một stack/hạ tầng và contract nền |
| AG-03 | Content operations plan | AG-00 | Có nguồn, checklist, quy trình kiểm và trách nhiệm |

Gate P0: scope, thuật ngữ, kiến trúc, người duyệt và các khoản chưa biết được ghi rõ.

### P1 — UX/UI và prototype

| ID | Capability | Dependency | Acceptance chính |
|---|---|---|---|
| AG-04 | Design tokens & primitives | AG-02 | Theme/component nhất quán |
| AG-05 | Discovery prototype | AG-04 | Home/search thao tác được với fixture có nhãn |
| AG-06 | Recipe & cooking prototype | AG-04 | Xem/đổi khẩu phần/nấu thử UI |
| AG-07 | Meal & shopping prototype | AG-06 | Ghép/đổi món/đi chợ thử UI |
| AG-08 | Responsive & usability review | AG-05..07 | Có lỗi, fix và evidence; không chỉ screenshot đẹp |

Gate P1: chủ sản phẩm duyệt luồng và thiết kế trước wiring dữ liệu thật. Prototype không chứng minh engine hoặc DB đã chạy.

### P2 — Core catalog và biên tập

| ID | Capability | Dependency | Acceptance chính |
|---|---|---|---|
| AG-09 | App foundation & environment | AG-02, AG-08 | App scaffold, env validation, CI/checks nền |
| AG-10 | Schema & migrations | AG-09 | Tạo DB sạch được, có migration plan |
| AG-11 | Identity & authorization | AG-10 | Positive/negative permission tests |
| AG-12 | Ingredient & taxonomy CRUD | AG-11 | Dữ liệu chuẩn dùng được trong editor |
| AG-13 | Structured recipe editor | AG-12 | Tạo/sửa/preview nháp đầy đủ |
| AG-14 | Media pipeline | AG-11 | Upload, giới hạn file, quyền và metadata |
| AG-15 | Publishing & revision gate | AG-13,14 | Draft không công khai; revision có kiểm |
| AG-16 | Public recipe rendering | AG-15 | Đọc bản published thật, xử lý unavailable |

Gate P2: quy trình tạo → kiểm → xuất bản → đọc lại chạy được. Nội dung thiếu không bị xuất bản bằng đường tắt.

### P3 — MVP bữa cơm và đi chợ

| ID | Capability | Dependency | Acceptance chính |
|---|---|---|---|
| AG-17 | Search & filters | AG-16 | Tìm đúng bộ seed kiểm và data thật |
| AG-18 | Serving adjustment | AG-16 | Rule rõ, không scale mù, tests rounding |
| AG-19 | Cooking mode | AG-18 | Bước/ingredients/progress dùng được |
| AG-20 | Saved recipes | AG-11,16 | Dữ liệu cá nhân chỉ đúng owner đọc/ghi |
| AG-21 | Meal composition & replacement | AG-17,18 | Thêm/đổi món giữ phần còn lại |
| AG-22 | Ingredient aggregation | AG-21 | Chỉ gộp tương thích, trace về món |
| AG-23 | Shopping checklist persistence | AG-22 | Đã có/còn thiếu không mất sau tải lại |
| AG-24 | SEO & index boundaries | AG-16,17 | Public metadata/sitemap; private không index |
| AG-25 | Staging deploy & observability | Core tests pass | Deploy tách biệt, log không lộ secrets |
| AG-26 | Content batch review & MVP pilot gate | AG-03,15,23,25 | Nội dung đủ, E2E đạt, backup restore kiểm |

Gate P3 = MVP hoàn thiện để dùng thử. Không yêu cầu P4–P8 hoàn tất.

### P4 — AI hỗ trợ có kiểm soát

| ID | Capability | Dependency | Acceptance chính |
|---|---|---|---|
| AG-27 | AI provider boundary & budget | AG-26 + duyệt provider | Server-only secrets, caps, retry giới hạn |
| AG-28 | AI recipe suggestion | AG-27 | Chỉ trả món published và ID thật |
| AG-29 | AI authoring drafts | AG-27,13,15 | Output schema valid, nháp có provenance, không tự publish |
| AG-30 | AI evaluation & fallback review | AG-28,29 | Có bộ kiểm, lỗi trung thực, fallback search |

Gate P4: AI không tạo đường tắt publish, không suy số dinh dưỡng và không gây chi phí không kiểm soát.

### P5 — Cộng đồng và văn hóa món ăn
- AG-31: Contributor permissions & submission, reuse editor.
- AG-32: Moderation, abuse reports, edit resubmission.
- AG-33: Dish variants & stories, nguồn và attribution.
- AG-34: Cooked-it feedback/photos, giới hạn spam và moderation.

Gate: nội dung cộng đồng có queue duyệt, quyền sở hữu và xử lý báo cáo; không biến thành social feed trước khi vận hành ổn.

### P6 — Dinh dưỡng và nhật ký
- AG-35: Nutrition source audit, license, data mapping và versioning.
- AG-36: Recipe nutrition calculation với missing-data rules.
- AG-37: Consumed portions & diary snapshots.
- AG-38: Daily summaries, privacy, export/delete policy.

Gate: nguồn truy vết, lượng đã ăn khác lượng đã nấu, dữ liệu thiếu không thành 0, nhật ký riêng tư và không hồi tố theo revision mới.

### P7 — Mở rộng catalog và thực đơn
Các nhánh độc lập, phải sinh ID mới trong roadmap khi duyệt:
- Món nước ăn thành bữa.
- Đồ uống.
- Bánh, món ngọt.
- Món chay với định nghĩa nhãn rõ.
- Kế hoạch tuần, bộ sưu tập và pantry nếu có nhu cầu.
- “Ăn theo thì”: chỉ tạo spec sau khi chủ sản phẩm giải thích.

Gate từng nhánh: taxonomy, đơn vị, hướng dẫn, ảnh và engine hiện có phục vụ được; không xây lại catalog.

### P8 — Kinh doanh và scale
Chỉ sau dữ liệu sử dụng thật: affiliate có nhãn, tính năng premium đã kiểm nhu cầu, hợp tác tác giả, tối ưu tìm kiếm/ảnh/chi phí. Payment và subscription là phạm vi riêng có duyệt, không nằm trong MVP.

---

## 8. Content roadmap — bắt đầu từ chưa có nội dung

### 8.1. Nhân sự và trách nhiệm
Chủ sản phẩm là người duyệt cuối. Chưa có chuyên gia hoặc người nấu thử được xác định; không ghi trong UI rằng đã được chuyên gia kiểm khi chưa có người và evidence.

Antigravity hỗ trợ form, nhập dữ liệu có cấu trúc, kiểm thiếu; không thay thế việc xác nhận công thức thực tế.

### 8.2. Quy trình
Chọn danh sách món → chọn nguồn hợp lệ → biên soạn → chuẩn hóa nguyên liệu → kiểm định lượng/bước → nấu thử hoặc kiểm theo quy trình được duyệt → ảnh có quyền → biên tập → publish.

Nguồn có thể là công thức gia đình, nội dung tự làm hoặc cộng tác được phép; không scrape/copy hàng loạt rồi đổi chữ để coi là nội dung mới.

AI có thể tạo nháp sau AG-29; mọi nháp giữ trạng thái chưa kiểm, không đánh dấu đã nấu thử.

### 8.3. Batch đề xuất
- Batch 0: 6–10 công thức thật đại diện để thử schema và UI.
- Batch 1: khoảng 30 công thức tối thiểu theo mục tiêu đề xuất: 15 món mặn, 8 canh, 7 rau/món phụ.
- Batch 2: mở đến 50 công thức khi quy trình ổn, không phải bắt buộc mới cho dùng thử.

Số lượng là mục tiêu cần chủ sản phẩm duyệt tại AG-03. Nếu chưa đủ nguồn, báo content-blocked; không bù bằng data giả.

### 8.4. Checklist công thức
- Tên, aliases, nhóm món, vai trò trong bữa.
- Tác giả/nguồn và quyền sử dụng.
- Khẩu phần mặc định và ý nghĩa khẩu phần.
- Nguyên liệu, lượng, đơn vị, optional/substitution.
- Giai đoạn, bước, lửa/thời gian khi có căn cứ, dấu hiệu hoàn thành.
- Dụng cụ và ghi chú đổi khẩu phần.
- Ảnh đúng món, quyền và alt text.
- Tình trạng biên tập/nấu thử và evidence riêng.
- Dinh dưỡng chỉ hiện khi có nguồn và công thức tính được kiểm.

### 8.5. Không trộn data
Fixture/design seed không được đưa lên production như nội dung thật. Mọi data demo có tag/môi trường; release checklist kiểm không lọt sample tác giả, review hoặc counters giả.

---

## 9. AI requirements

### 9.1. Gợi ý món từ kho đã duyệt
Input: nguyên liệu đang có, số người, thời gian và bộ lọc người dùng chọn.

Flow đề xuất: filter/search nội bộ → lấy candidates đã published → AI sắp xếp/giải thích → validate recipe IDs → trả kết quả và link thật.

- AI không tự tạo recipe ID hoặc công thức công khai ngoài catalog.
- Giải thích vì sao phù hợp và nguyên liệu còn thiếu.
- Không cam kết kiểm dị ứng đầy đủ nếu metadata thiếu.
- Không có kết quả phù hợp: nói rõ; không bịa để lấp.
- Timeout/provider lỗi: fallback search, không mất bữa ăn đã chọn.
- Input/output và trạng thái job có giới hạn lưu trữ; không log dữ liệu riêng tư dư thừa.

### 9.2. Soạn nháp
- Structured output theo schema editor.
- Validation deterministic trước khi lưu.
- Provenance: provider/model/version nếu biết, thời điểm, user và trạng thái review.
- Quantity/bước không đủ căn cứ được đánh dấu cần kiểm; không tự tạo verified flag.
- Người dùng/admin sửa và duyệt; AI không có quyền publish.
- AI không tự suy calories hoặc claims y khoa.

### 9.3. Chi phí và an toàn
- API keys server-side.
- Per-user/IP rate limit phù hợp.
- Token/input limits, retry caps và budget alerts.
- Tách external/user content khỏi instructions; không cho nội dung công thức điều khiển tool hành động.
- Bộ evaluation có: yêu cầu hợp lệ, thiếu dữ liệu, món không tồn tại, input độc hại, provider lỗi, budget hết.

---

## 10. Dinh dưỡng tương lai — chưa triển khai MVP

Định vị: ước tính năng lượng và thành phần nạp vào, không đo chính xác cơ thể hoặc thay lời khuyên chuyên môn.

Ba lớp độc lập:
1. Tổng công thức.
2. Một khẩu phần hoặc 100 g thành phẩm khi đủ dữ liệu.
3. Phần người dùng thực sự ăn.

Yêu cầu:
- Nguồn dữ liệu thực phẩm được kiểm quyền sử dụng và version.
- Mapping nguyên liệu, trạng thái, phần ăn được có thể audit.
- Quy tắc xử lý nước/dầu/thành phẩm được định nghĩa và kiểm chuyên môn trước công bố.
- Công thức chia sẻ chung không mặc định chia đều theo số người.
- Thiếu nguyên liệu dinh dưỡng phải hiện incomplete; nếu hiển thị subtotal, ghi rõ chỉ phần đã tính, không gọi tổng cả món.
- Không gắn nhãn calorie-free vì không có dữ liệu.
- Snapshot nhật ký gồm recipe version, lượng ăn, nutrient calculation version và giá trị tại lúc ghi.
- Sửa công thức không đổi nhật ký lịch sử.
- Mục tiêu ăn kiêng/calo cá nhân và thực đơn bệnh lý là phạm vi khác, cần tiêu chí chuyên môn; không giao AI tự quyết.

---

## 11. Security, privacy và vận hành

### 11.1. Quyền
- Guest: đọc published; dùng luồng guest đã chốt.
- Member: quản lý saved/meal/checklist của mình; cộng đồng chỉ khi đã mở phase.
- Editor/admin: biên soạn/duyệt theo contract.
- Không dựa vào ẩn nút để bảo vệ API.
- Kiểm quyền cả resource owner và action; test request cố truy cập user khác.

### 11.2. Ảnh và nội dung
- Giới hạn file type, dung lượng, xác minh file thực tế và xử lý tên/path.
- Không dùng quyền bucket public để công khai ảnh nháp tùy tiện.
- Chỉ published media được public theo policy đã chọn.
- Rich text được sanitize; không render script từ user/AI.
- Lưu nguồn, permission và quy trình gỡ nội dung bị báo cáo.

### 11.3. Môi trường
- Local/dev, staging và production tách cấu hình/dữ liệu.
- Secrets không commit hoặc đưa vào tài liệu report.
- Migration có review, backup/rollback strategy và quyền duyệt.
- Không overwrite dịch vụ đang chạy trên VPS.
- Production deploy phải xin duyệt riêng.
- Migration destructive hoặc DNS/firewall changes cần plan và duyệt cụ thể.

### 11.4. Quan sát và backup
- Error tracking, structured logs và health checks.
- Audit actions: xuất bản, ẩn, duyệt, đổi quyền, thay nội dung quan trọng.
- Không log mật khẩu, token hoặc nguyên văn secrets.
- Chốt tần suất backup, retention, nơi lưu và restore drill tại deployment spec.
- Không gọi backup healthy chỉ vì có file; phải kiểm restore theo phạm vi.
- Chốt mục tiêu khôi phục dựa trên hạ tầng; chưa đặt RPO/RTO giả trong master plan.

---

## 12. Test và gate nghiệm thu

### 12.1. Mỗi MINI-SPEC
Unit + integration + regression theo scope; live verification khi có môi trường/dữ liệu thật. Không mock chính boundary đang muốn chứng minh.

Chạy lint/typecheck/build và test liên quan; nếu không chạy được, ghi lý do và trạng thái blocked/not-run. Không tự hạ tiêu chí để PASS.

### 12.2. Cases bắt buộc theo engine
- Serving: tăng/giảm, số quả, optional, fixed rules, undefined quantity, đổi qua lại.
- Aggregation: g/kg, ml/l, đơn vị không tương thích, raw/cooked, substitution, đổi món.
- Publishing: draft inaccessible, permission deny, revision, archived/missing.
- Privacy: user A không đọc/ghi saved/plan/list/diary của B.
- UI: loading/empty/error/no permission/partial; Vietnamese text; keyboard/focus.
- AI: valid IDs only, malformed output, timeout, budget cap, no publish bypass.
- Nutrition: missing not zero, snapshots immutable, cooked/raw mismatch cases.

### 12.3. UI QA
Kiểm 375px, 768px, 1280px+; ngoài các size này kiểm thực tế khi có thiết bị.

Checklist:
- Token/theme thống nhất; một icon set.
- Dấu tiếng Việt không cắt, chữ đủ đọc.
- Không tràn ngang; modal/filter không che hành động.
- Focus, label, keyboard và contrast.
- Motion giảm được.
- Ảnh kích thước/nén/phù hợp.
- Không còn copy marker nội bộ/data demo trong production.
- Ghi rõ tự động/kiểm thủ công/thiết bị thật chưa kiểm.

### 12.4. MVP release gate
GO khi:
- Scope AG-00..26 được nghiệm thu hoặc ngoại lệ duyệt rõ, không bỏ core flow.
- Có nội dung đạt ngưỡng AG-03 đã duyệt.
- Tìm → công thức → khẩu phần → nấu và ghép bữa → đi chợ đều E2E pass.
- Không có lỗi critical/high chưa giải quyết trong quyền, dữ liệu hoặc core flow.
- Đã kiểm deploy, log, backup restore và rollback plan.
- Chủ sản phẩm đã dùng thử trên điện thoại và duyệt UX.

WARN chỉ cho vấn đề không chặn core và có người chấp nhận, hạn khắc phục.
NO_GO cho thiếu quyền, mất/sai dữ liệu, bypass publish, nội dung không đủ hoặc chưa có evidence cần thiết.

Release gate kỹ thuật không đồng nghĩa product-market fit. Sau GO, chạy pilot với người thật và ghi nhận điều chỉnh.

### 12.5. Analytics đề xuất
search_submitted, recipe_opened, serving_changed, cooking_started, cooking_completed_self_reported, recipe_saved, meal_plan_created, meal_dish_replaced, shopping_list_opened.

Không coi mở bước cuối là nấu xong. Không coi visit là đã nhận giá trị. Không thu dữ liệu sức khỏe riêng tư vào analytics chung.

---

## 13. Quản lý công việc và chi phí

### 13.1. Một người + agent
- Chỉ một MINI-SPEC implementation đang active.
- Có thể chuẩn bị nội dung song song nhưng không làm migration/feature chồng scope.
- Agent report ngắn có evidence, docs đầy đủ trong repo.
- Feature branch/commit nhỏ; không commit unrelated changes hoặc tự push/deploy nếu chưa được cho phép.
- Done = code + tests + docs + review, không phải agent nói xong.

### 13.2. Mốc
- M1: scope/kiến trúc/prototype được duyệt.
- M2: catalog vận hành và nội dung thật có thể xuất bản.
- M3: MVP hoàn chỉnh đủ pilot (gồm meal/shopping).
- M4: AI an toàn và có budget.
- M5+: community/nutrition/catalog extension theo evidence.

Không ước tính deadline chắc chắn trước audit. Sau 2–3 MINI-SPEC có thể rà tốc độ thực tế và cập nhật kế hoạch.

### 13.3. Sổ chi phí
Theo dõi: hosting/VPS, DB, storage, bandwidth, email, monitoring, AI, ảnh/nội dung và dịch vụ trả phí.

Tách tài nguyên đang có khỏi chi phí phát sinh. Có VPS không đồng nghĩa mọi lớp miễn phí hoặc không cần công bảo trì. Agent không mua dịch vụ hoặc nâng gói tự động.

---

## 14. Bộ tài liệu và skill trong workspace

Cấu trúc đề xuất; xác nhận convention Antigravity tại AG-00:

```text
.agents/skills/
  mini-spec-playbook/
    SKILL.md
    references/MINI_SPEC_PLAYBOOK.md
  ui-ux-resource-navigator/
    SKILL.md

docs/
  AN_GI_MOM_MASTER_PLAN.md
  PRODUCT_BRIEF.md
  ROADMAP.md
  FEATURES.md
  ARCH.md
  API.md
  DATA_MODEL.md
  DESIGN_SYSTEM.md
  CONTENT_GUIDELINES.md
  SECURITY.md
  INFRA_INVENTORY.md
  TEST_LOG.md
  DECISIONS.md
  COST_LOG.md
  mini-specs/
  reports/
```

Không ghi đè thư mục convention cũ nếu repo đã có; ghi quyết định rõ. Nếu skill source không có trong workspace, yêu cầu cung cấp, không tự tái tạo từ trí nhớ.

SKILL.md của Playbook phải có frontmatter hợp lệ, điều kiện kích hoạt và yêu cầu đọc tài liệu gốc. UI/UX skill giữ nguyên logic nguồn, không đổi nguồn “chưa kiểm” thành “đã xác nhận”.

### Template MINI-SPEC

```text
ID / Name / Parent phase / Author / Date
Context:
- Docs bắt buộc và state hiện tại.
Goal:
- Một outcome quan sát được.
Constraints:
- Scope, quyền, reuse, unknown/blocked, approval.
Scope:
A. Domain model
B. Services/engine
C. API contract
D. UI surfaces
E. Tests
Audit Before Build:
- Những gì đã kiểm, gaps có evidence.
Design Choice:
- Một phương án được chọn và lý do.
Test Plan:
- Unit/integration/regression/live.
Success Criteria:
- Điều kiện cụ thể, failure modes không còn.
Stop conditions:
- Thiếu quyền/evidence, scope drift, production impact.
Approval:
- Chờ chủ sản phẩm duyệt trước build.
```

Báo cáo sau build theo Playbook: Summary; Audit; Design Choice; Changed Files; New API/DB/State; Tests; Live Verification; Remaining Limits/Follow-ups.

---

## 15. MINI-SPEC khởi động: AG-00

### Header
ID: AG-00  
Name: Workspace Audit & Skill Bootstrap  
Parent: P0  
Author: kế hoạch do assistant chuẩn bị; Antigravity phải hoàn thiện audit thực tế  
Date: 15/10/2026  
Approval state: chưa duyệt build.

### Context
- Chủ sản phẩm xác nhận chưa có dự án/code cho ĂN GÌ MOM.
- Đã có hạ tầng nhưng chưa biết chi tiết; audit hạ tầng thuộc AG-01.
- Đọc master plan và hai skill gốc.
- Workspace thực tế vẫn cần kiểm, không suy rằng thư mục hiện tại trống.

### Goal
Tạo nguồn context và cơ chế skill để các MINI-SPEC tiếp theo được triển khai đúng scope, có audit và có duyệt.

### Constraints
1. Chỉ audit read-only và tạo tài liệu/skill theo phạm vi sau duyệt.
2. Không cài dependency, scaffold app, migration hoặc deploy.
3. Không đọc/in/commit secrets.
4. Không xóa/ghi đè file đã có.
5. Không tự khẳng định tài nguyên hạ tầng phù hợp.
6. Không sửa ý nghĩa của hai skill gốc.
7. Không sinh công thức hoặc số dinh dưỡng để lấp nội dung.
8. Không tự chuyển AG-01.

### Scope
A. Domain: glossary và draft decisions, chưa tạo DB.
B. Services: không có implementation service.
C. API: không tạo endpoint; ghi N/A.
D. UI: ghi brief/tokens đề xuất, không dựng màn hình.
E. Tests: kiểm file, cấu trúc skill, tài liệu và Git diff; app tests N/A vì chưa có app.

### Audit Before Build
Agent phải điền sau khi kiểm root, file tree, Git status, docs và các package manifest nếu có. Không đánh dấu mục này đã hoàn thành từ master plan.

Gaps cần xác nhận: nguồn tài liệu có mặt hay chưa, skill convention, docs thiếu, workspace có unrelated files hay không.

### Design Choice
Tách skill dùng chung khỏi context sản phẩm. Giữ Playbook trong references; UI/UX skill là skill riêng. Tạo docs nền có trạng thái proposed/approved/unknown để không biến đề xuất thành quyết định.

### Test Plan
- Kiểm YAML frontmatter và SKILL.md tồn tại theo convention được xác nhận.
- Kiểm liên kết local/reference file có thật.
- Kiểm master/brief/roadmap không mâu thuẫn các quyết định D01..D13.
- Kiểm diff chỉ nằm trong scope tài liệu/skill đã duyệt.
- Lint/build/unit/integration app: N/A nếu app chưa tồn tại, không báo PASS giả.

### Success Criteria
- Có workspace audit thực tế và không lộ secrets.
- Tài liệu gốc được tìm thấy hoặc báo blocked chính xác.
- Docs nền và skill setup trong scope được tạo sau duyệt.
- Tách rõ decision, proposal, unknown.
- Không source app/DB/hạ tầng bị thay đổi.
- Có report và dừng chờ chủ sản phẩm.

### Stop conditions
Thiếu file gốc, không rõ target workspace, có thay đổi unrelated chưa được bảo vệ, hoặc phải thay hạ tầng: dừng và hỏi.

---

## 16. Prompt đầu tiên để đưa vào Antigravity

```text
PROJECT: ĂN GÌ MOM
TASK: Prepare AG-00 — Workspace Audit & Skill Bootstrap

Đọc AN_GI_MOM_MASTER_PLAN.md, MINI_SPEC_PLAYBOOK.md và
SKILL-UI-UX-Resource-Navigator.md được cung cấp.

Chủ sản phẩm làm một mình, chưa có code dự án; có hạ tầng muốn tận dụng.
MVP có công thức, đổi khẩu phần, chế độ nấu, lưu món, ghép bữa và đi chợ.
AI gợi ý/soạn nháp là roadmap đã chốt nhưng mặc định sau MVP.

BƯỚC NÀY CHỈ AUDIT READ-ONLY VÀ TRÌNH SPEC:
1. Xác nhận target workspace; kiểm root, Git status, manifests, docs/skills.
2. Xác nhận hai tài liệu nguồn có mặt; thiếu thì báo blocked.
3. Hoàn thiện MINI-SPEC AG-00 theo Playbook bằng evidence thực tế.
4. Đề xuất chính xác danh sách docs/skill files sẽ tạo hoặc cập nhật.
5. Liệt kê decisions chưa chốt, không tự quyết infra/provider/budget.
6. Không ghi file, cài dependency, scaffold app, chạy migration hoặc deploy.
7. Trình spec và xin duyệt để triển khai AG-00.

SAU KHI CHỦ SẢN PHẨM DUYỆT AG-00:
- Chỉ tạo/cập nhật docs và skill files đúng spec đã duyệt.
- Không overwrite file nguồn hoặc unrelated changes.
- Kiểm file/reference/frontmatter/diff.
- Báo cáo theo Mini-Spec Report Format.
- Không nói đã chạy app tests nếu chưa có app.
- Dừng xin duyệt đóng AG-00; không tự chạy AG-01.

Không coi prompt này là phép xây toàn bộ roadmap hoặc deploy production.
```

---

## 17. Giới hạn của bản kế hoạch và nguồn nền

Tài liệu này tổng hợp quyết định của chủ sản phẩm và master plan đã trao đổi, dựa trên hai tài liệu gốc. Chưa audit repo, chưa kiểm hạ tầng, chưa chọn model AI, chưa xác nhận budget và chưa có công thức thật.

Nguồn quy trình:
- MINI_SPEC_PLAYBOOK.md, Mini-Spec Playbook v2, do chủ sản phẩm cung cấp.
- SKILL-UI-UX-Resource-Navigator.md, version 1.0, do chủ sản phẩm cung cấp.

Các hướng kỹ thuật được tham khảo ở bước lập kế hoạch trước: tài liệu Agent Skills của Google Antigravity, Next.js Server/Client Components và Supabase permissions/storage. Agent phải kiểm lại documentation và giấy phép tương ứng tại lúc áp dụng; master plan không đảm bảo phiên bản, giá hay giới hạn dịch vụ còn nguyên.

Bản 1.0 dừng tại master plan và AG-00 khởi động. Những MINI-SPEC còn lại cần audit và viết đầy đủ trước khi được duyệt build; không giả đã hoàn tất hàng chục spec chỉ vì có backlog.
