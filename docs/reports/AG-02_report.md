# AG-02 Report — Architecture & Domain Decisions

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã hoàn thành phân tích và chốt hợp đồng kiến trúc phần mềm, hạ tầng container hóa độc lập và mô hình dữ liệu cốt lõi cho ĂN GÌ MOM. Khóa cứng toàn bộ stack công nghệ (Next.js, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Drizzle ORM, Vitest, Playwright) và các enum nghiệp vụ trọng yếu (`RecipePublishStatus`, `MealRole`, `ScalePolicy`, `NutritionDataStatus`), giải quyết triệt để bài toán không phụ thuộc nhà cung cấp đóng (no vendor lock-in).

## 2. Audit Before Build
- Xem chi tiết tại [mini-specs/AG-02.md](../mini-specs/AG-02.md) §5.
- Gap đã xác nhận: `ARCH.md` và `DATA_MODEL.md` trước đó ở trạng thái `proposed` hoặc khung sơ bộ; thiếu sự thống nhất giữa môi trường dev (Mắt Bão Coolify/Docker) và nền production chính (VPS riêng của chủ sản phẩm - D17).

## 3. Design Choice
- **Lớp ứng dụng**: Next.js App Router (TypeScript) kết hợp Drizzle ORM và PostgreSQL tạo nên kiến trúc cực nhẹ, type-safe từ database đến giao diện, phù hợp năng lực vận hành của 1 người (D11).
- **Lớp hạ tầng**: Container hóa chuẩn qua Dockerfile multi-stage build + Docker Compose + Caddy HTTPS proxy. Mô hình này hoàn toàn di động (portable), chạy mượt trên VPS riêng mà không cần mua dịch vụ SaaS đắt đỏ, đồng thời test được ngay trong môi trường dev Mắt Bão.
- **Lớp dữ liệu & nghiệp vụ**: Tách biệt Dish và Recipe; khóa cứng tính bất biến của RecipeVersion đã xuất bản; quy định đổi khẩu phần chỉ làm tròn ở hiển thị UI; gộp nguyên liệu có kiểm tra tương thích đơn vị và trạng thái.

## 4. Changed Files
- `docs/ARCH.md`: Cập nhật toàn bộ stack ứng dụng, chiến lược hạ tầng và ranh giới 8 mô-đun cốt lõi.
- `docs/DATA_MODEL.md`: Khóa danh sách thực thể, 4 enum chuẩn và 6 quy tắc bất biến (invariants).
- `docs/API.md`: Xác định quy ước Server Actions / Route Handlers, mã lỗi và phân quyền RBAC.
- `docs/DECISIONS.md`: Bổ sung D19, D20, D21; cập nhật O2, O3.
- `docs/ROADMAP.md`: Cập nhật AG-02 thành `awaiting-close`.
- `docs/TEST_LOG.md`: Ghi nhận kết quả kiểm thử tính nhất quán của AG-02.
- `docs/reports/AG-02_report.md`: Báo cáo này.

## 5. New API/DB/State
- Không tạo runtime code/DB table trực tiếp (nằm ở P2).
- Khóa định nghĩa các State & Enum:
  - `RecipePublishStatus`: `DRAFT` | `SUBMITTED` | `PUBLISHED` | `NEEDS_CHANGES` | `ARCHIVED`
  - `MealRole`: `MAIN` | `SOUP` | `SIDE` | `ONE_DISH_MEAL` | `DESSERT` | `BEVERAGE`
  - `ScalePolicy`: `LINEAR` | `FIXED` | `MANUAL_ADJUST`
  - `NutritionDataStatus`: `NO_DATA` | `INCOMPLETE` | `ESTIMATED`

## 6. Tests
- **App Tests**: N/A (chưa có runtime app).
- **Consistency Verification**:
  - Không còn nhãn `unknown` hay `proposed` trong stack ứng dụng của `ARCH.md`.
  - Không có mâu thuẫn giữa Master Plan §4-5 và các hợp đồng trong `DATA_MODEL.md`.
  - Kiểm tra secret scan: 0 secret phát hiện.

## 7. Live Verification
N/A (tài liệu hợp đồng kiến trúc).

## 8. Remaining Limits / Follow-ups
- Các chi tiết cụ thể của VPS riêng (IP, SSH, OS cụ thể) sẽ được cung cấp và kiểm tra ở khâu triển khai thực tế.
- Bước tiếp theo trong P0: **AG-03 Content operations plan** (Kế hoạch vận hành nội dung, quy trình kiểm công thức và phân công trách nhiệm) để hoàn thành trọn vẹn Gate P0.
