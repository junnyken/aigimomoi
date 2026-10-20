# DESIGN SYSTEM

**Trạng thái: `proposed`** — chốt tại AG-04 theo skill [ui-ux-resource-navigator](../.agents/skills/ui-ux-resource-navigator/SKILL.md). Palette **chưa** được kiểm tương phản AA.

## Brief (skill §3 bước 1)
```text
Loại sản phẩm:      app khách hàng (website) + backoffice quản trị
Người dùng chính:   người nấu cơm gia đình, mức quen công nghệ đa dạng
Việc chính (top 3): chọn món/bữa; chuẩn bị đủ nguyên liệu; làm theo cách nấu
Dữ liệu chính:      nội dung (công thức), form (editor), checklist
Stack:              proposed — Next.js + Tailwind + shadcn/ui (chờ AG-02)
Ngôn ngữ giao diện: vi
Chế độ màu:         sáng (dark mode không bắt buộc MVP)
Mật độ:             thoáng (public), cân bằng (quản trị)
Ràng buộc:          mobile-first; trợ năng AA; kiểm giấy phép font/ảnh; không sao chép thương hiệu tham chiếu
```

Hướng nhận diện (D09): kem nhạt + xanh lá, bếp gia đình pha trẻ trung. Trẻ trung bằng chip, minh họa nhỏ có chức năng, câu chữ gần gũi — không thành giao diện trẻ em. Wordmark tạm “ĂN GÌ MOM” chờ duyệt (O9).

Ảnh tham chiếu bố cục (Bếp An Nhiên) **chưa có trong workspace** — cần chủ sản phẩm cung cấp lại trước AG-04; không giả đã xem.

## Token khởi điểm — `proposed`, chưa kiểm contrast
| Token | Giá trị |
|---|---|
| Background | #FAF7F0 |
| Surface | #FFFFFF |
| Text primary | #253126 |
| Text secondary | #596454 |
| Brand primary | #3F6240 |
| Accent | #B75B35 |
| Border | #E5E7DE |
| Font | Be Vietnam Pro — `unknown`: kiểm giấy phép + dấu tiếng Việt |
| Body | 16px, line-height ~1.6 |
| Type scale | 12, 14, 16, 20, 24, 32, 40 |
| Spacing | 4, 8, 12, 16, 24, 32, 48 |
| Radius | 8, 12, 16, 24 |
| Shadow | nhẹ; ưu tiên viền cho bảng/form |
| Icons | Lucide 16/20/24, cùng stroke |

**Còn thiếu trước khi chốt (`unknown`):** text tertiary; semantic success/warning/error/info; hover/active/disabled/focus; layer/z-index.

## Component dự kiến
RecipeCard, RecipeMeta, ServingSelector, IngredientRow, CookingStep, CategoryChip, SearchFilterSheet, RecipeSourceInfo, EditorialBadge, DataStatusBadge, MealPlanCard, ShoppingListItem, EmptyState, ErrorState, Skeleton, FormErrorSummary, ConfirmationDialog.

## Sitemap MVP — `proposed`
`/` · `/mon-an` · `/cong-thuc/[slug]` · `/cong-thuc/[slug]/nau` · `/thuc-don` · `/di-cho` · `/da-luu` · `/tai-khoan` · `/quan-tri/...` (không index trang riêng tư/nháp/quản trị).

## Trạng thái màn hình bắt buộc
Xem master plan §6.8. Mỗi màn hình dữ liệu: tải, rỗng, lỗi, không có quyền, một phần dữ liệu.

## Trợ năng & copy
Contrast 4.5:1 / 3:1; focus thấy rõ; bàn phím; icon-only có accessible name; reduced motion; thử dấu tiếng Việt ở cỡ nhỏ nhất. Copy tiếng Việt lưu tập trung, đề xuất gắn `[ĐỀ XUẤT — chờ duyệt]` trong tài liệu review, không lọt ra production.
