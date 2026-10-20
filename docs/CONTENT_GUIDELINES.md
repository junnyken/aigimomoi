# CONTENT GUIDELINES — Tiêu chuẩn & Vận hành Nội dung

**Trạng thái:** `approved` tại AG-03 (20/10/2026).

---

## 1. Nguyên tắc Cốt lõi & Phân công Trách nhiệm
1. **Chủ sản phẩm là người phê duyệt cuối cùng**: Mọi công thức đưa lên bản phát hành công khai (`PUBLISHED`) phải được chủ sản phẩm đọc và duyệt (D04, D05).
2. **Không tự tạo công thức ảo**: Không dùng AI tự sinh công thức rồi tự ý xuất bản (D06). Antigravity hỗ trợ nhập liệu có cấu trúc, kiểm tra thiếu sót định lượng, nhưng không thay thế việc kiểm nghiệm nấu ăn thực tế.
3. **Trung thực về nguồn gốc (Attribution)**: Ghi nhận rõ tác giả, nguồn gốc (công thức gia đình, sách ẩm thực, người đóng góp). Tuyệt đối không cào dữ liệu hàng loạt từ các website khác.
4. **Tách biệt dữ liệu mẫu (Anti-mixing policy)**: Dữ liệu dùng thử nghiệm và thiết kế giao diện (fixtures/seed) phải gắn cờ `[DEMO_FIXTURE]`. Quy trình phát hành (release checklist) phải quét sạch dữ liệu mẫu, không để lọt tác giả giả mạo hay lượt đánh giá ảo vào cơ sở dữ liệu thật.

---

## 2. Kế hoạch Các Đợt Nội dung (Content Batches)

### 2.1. Batch 0 — Thử nghiệm & Dựng Mẫu UI (6 đến 8 món)
Cung cấp dữ liệu chuẩn, đã kiểm tra thực tế để phục vụ xây dựng prototype (P1) và kiểm thử luồng nghiệp vụ: xem công thức, đổi khẩu phần, ghép bữa cơm, tạo danh sách đi chợ.

| Nhóm | Tên món ăn | Vai trò (`MealRole`) | Khẩu phần cơ sở | Đặc điểm kiểm thử |
|---|---|---|---|---|
| **Mặn** | Thịt ba chỉ kho tiêu | `MAIN` | 4 người | Thử nghiệm scale mỡ/thịt, tiêu xay `MANUAL_ADJUST` |
| **Mặn** | Gà rang gừng lá chanh | `MAIN` | 4 người | Thử nghiệm gừng củ `FIXED`, thịt gà `LINEAR` |
| **Mặn** | Cá basa kho tộ | `MAIN` | 4 người | Nước hàng/nước màu, thời gian kho đun nhỏ lửa |
| **Canh** | Canh rau ngót nấu thịt băm | `SOUP` | 4 người | Gộp thịt băm với món khác, rau ngót tính theo bó/g |
| **Canh** | Canh chua cá lóc miền Tây | `SOUP` | 4 người | Thử nghiệm me chua, rau thơm, bạc hà/dứa |
| **Rau/Phụ** | Rau muống xào tỏi | `SIDE` | 4 người | Tỏi tép `LINEAR`, lửa lớn, thời gian xào ngắn |
| **Rau/Phụ** | Đậu hũ sốt cà chua | `SIDE` | 4 người | Đậu miếng `LINEAR`, hành lá `FIXED`/`MANUAL` |

### 2.2. Batch 1 — Phát hành MVP (30 món)
Đủ để một gia đình nấu cơm liên tục trong 3 tuần mà không bị lặp bữa:
- **15 món mặn**: Thịt kho tàu trứng, Sườn xào chua ngọt, Thịt luộc chấm mắm tôm/mắm nêm, Cá thu sốt cà, Tôm rim mặn ngọt, Bò xào cần tỏi, Chả lá lốt...
- **8 món canh**: Canh cua rau đay mồng tơi, Canh sườn nấu chua, Canh bí đỏ thịt băm, Canh mướp đắng nhồi thịt, Canh măng chua đầu cá...
- **7 món rau/phụ**: Bắp cải luộc chấm trứng dầm nước mắm, Cải ngồng xào nấm, Nộm dưa chuột tai heo, Cà pháo muối chua giòn...

### 2.3. Batch 2 — Mở rộng Sau MVP (50+ món)
Bổ sung các món bún/phở/cháo (`ONE_DISH_MEAL`), món chay, tráng miệng và thực đơn theo mùa.

---

## 3. Quy trình Biên tập 5 Bước (5-Step Editorial Pipeline)

```text
[1. Tiếp nhận nguồn] ──> [2. Cấu trúc hóa] ──> [3. Biên soạn bước] ──> [4. Thẩm định/Nấu thử] ──> [5. Xuất bản]
   Gia đình/Tài liệu       Tách amount, unit        Rõ lửa, dấu hiệu           Rà soát thực tế           Duyệt & Gắn ảnh
```

1. **Bước 1 — Tiếp nhận nguồn**: Thu thập công thức từ nguồn uy tín hoặc kinh nghiệm gia đình. Xác định vai trò món trong mâm cơm.
2. **Bước 2 — Cấu trúc hóa nguyên liệu**:
   - Tên nguyên liệu được ánh xạ vào danh mục `Ingredient` chuẩn hóa.
   - Định lượng tách riêng thành con số (`amount`) và đơn vị chuẩn (`unit`: `g`, `ml`, `quả`, `tép`...).
   - Gán chính sách đổi khẩu phần (`ScalePolicy`):
     - `LINEAR`: Thịt, cá, rau củ, đậu hũ.
     - `FIXED`: Hành củ, gừng, sả nướng tạo mùi thơm nền.
     - `MANUAL_ADJUST`: Nước mắm, muối, đường, ớt, tiêu (kèm hướng dẫn nêm theo khẩu vị).
3. **Bước 3 — Biên soạn các bước nấu**:
   - Phân đoạn rõ ràng: *Sơ chế nguyên liệu* $\rightarrow$ *Tẩm ướp* $\rightarrow$ *Chế biến nhiệt* $\rightarrow$ *Trình bày & Hoàn thiện*.
   - Mỗi bước nêu rõ: Hành động chính, dụng cụ cần dùng (chảo, nồi đất, xửng hấp), mức lửa (nhỏ, vừa, to) và **dấu hiệu trực quan** (VD: *"nước sốt sệt lại, thịt săn lại và có màu cánh gián"* thay vì chỉ ghi đơn thuần *"đun 15 phút"*).
4. **Bước 4 — Thẩm định & Nấu thử**:
   - Ban biên tập đọc rà soát, kiểm tra logic giữa các bước và danh sách nguyên liệu.
   - Nếu có người thực tế nấu thử thành công theo hướng dẫn: Gắn cờ `COOK_TESTED = true`.
5. **Bước 5 — Duyệt xuất bản**:
   - Bổ sung ảnh chụp thực tế chất lượng cao, định dạng WebP, có alt text mô tả món ăn.
   - Chủ sản phẩm bấm duyệt chuyển trạng thái sang `PUBLISHED`.

---

## 4. Bảng Kiểm Tra Nghiệm Thu Công Thức (Recipe Quality Checklist)

Mọi công thức trước khi ấn nút `PUBLISHED` phải đánh dấu đạt toàn bộ 9 tiêu chí sau:

- [ ] **1. Tên & Danh mục**: Tên món rõ ràng, thuần Việt, có kèm tên gọi/alias vùng miền nếu có (VD: *"Thịt kho hột vịt"* / *"Thịt kho tàu"*); gán đúng `MealRole`.
- [ ] **2. Nguồn & Bản quyền**: Có thông tin tác giả/nguồn tham khảo và xác nhận quyền sử dụng hình ảnh.
- [ ] **3. Khẩu phần cơ sở**: Nêu rõ `baseServings` (mặc định 4 người) và lượng thành phẩm ước tính (VD: *"đĩa 400g đủ cho 4 người ăn bữa cơm"*).
- [ ] **4. Nguyên liệu phân rã hoàn toàn**: 100% dòng nguyên liệu có số lượng, đơn vị rõ ràng; không có dòng văn bản gộp mơ hồ; gán đúng `ScalePolicy`.
- [ ] **5. Bước nấu rõ ràng**: Chia giai đoạn mạch lạc; có mức lửa và dấu hiệu nhận biết đạt độ chín; thời gian có căn cứ thực tế.
- [ ] **6. Dụng cụ & Lưu ý**: Ghi rõ loại nồi/chảo tối ưu và lưu ý khi đổi khẩu phần (VD: *"khi nấu cho 6 người trở lên cần chia làm 2 mẻ rán để thịt không bị ỉu"*).
- [ ] **7. Hình ảnh chuẩn mực**: Ảnh rõ nét, đúng món ăn thực tế, không có watermark, có alt text trợ năng mô tả màu sắc và cách trình bày.
- [ ] **8. Minh bạch thẩm định**: Chỉ bật nhãn `COOK_TESTED` hoặc `NUTRITION_VERIFIED` khi có biên bản/bằng chứng xác thực.
- [ ] **9. Kiểm tra dị ứng & Thay thế**: Có ghi chú các nguyên liệu dễ gây dị ứng (tôm, đậu phộng, hải sản) hoặc phương án thay thế nếu người ăn kiêng/thiếu nguyên liệu.

---

## 5. Mẫu Dữ liệu Công thức Chuẩn (Recipe JSON Schema Template)

Mẫu cấu trúc JSON để làm dữ liệu seed cho Batch 0 và contract cho editor:

```json
{
  "dishName": "Thịt ba chỉ kho tiêu",
  "aliases": ["Thịt kho tiêu", "Thịt lợn kho tiêu"],
  "role": "MAIN",
  "baseServings": 4,
  "author": "Bếp Gia Đình",
  "source": "Công thức gia đình truyền thống",
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 25,
  "difficulty": "EASY",
  "ingredients": [
    {
      "name": "Thịt ba chỉ heo",
      "amount": 400,
      "unit": "g",
      "preparation": "rửa sạch, thái con chì dày 1cm",
      "scalePolicy": "LINEAR",
      "isOptional": false
    },
    {
      "name": "Hành tím",
      "amount": 3,
      "unit": "củ",
      "preparation": "bóc vỏ, băm nhỏ",
      "scalePolicy": "LINEAR",
      "isOptional": false
    },
    {
      "name": "Tiêu đen xay",
      "amount": 1,
      "unit": "thìa cà phê",
      "preparation": "xay vỡ hạt",
      "scalePolicy": "MANUAL_ADJUST",
      "isOptional": false
    },
    {
      "name": "Nước mắm truyền thống",
      "amount": 2,
      "unit": "thìa canh",
      "preparation": "40 độ đạm",
      "scalePolicy": "LINEAR",
      "isOptional": false
    },
    {
      "name": "Đường hoa mai",
      "amount": 1,
      "unit": "thìa canh",
      "preparation": "để thắng nước màu",
      "scalePolicy": "LINEAR",
      "isOptional": false
    }
  ],
  "steps": [
    {
      "phase": "Sơ chế & Ướp",
      "order": 1,
      "content": "Thịt thái miếng vừa ăn, chần qua nước sôi 1 phút rồi rửa sạch lại. Ướp với 1 thìa canh nước mắm, hành tím băm và 1/2 thìa tiêu trong 15 phút.",
      "durationMinutes": 15,
      "heatLevel": "NONE"
    },
    {
      "phase": "Thắng nước màu",
      "order": 2,
      "content": "Cho 1 thìa canh đường vào nồi đất cùng 1 thìa con dầu ăn, đun lửa nhỏ đến khi đường chuyển màu cánh gián đậm thì cho thịt vào đảo đều.",
      "durationMinutes": 3,
      "heatLevel": "LOW"
    },
    {
      "phase": "Kho thịt",
      "order": 3,
      "content": "Xào cho thịt săn lại và ngấm màu nước hàng. Thêm 1 thìa canh nước mắm và 50ml nước sôi xâm xấp mặt thịt. Đậy vung đun nhỏ lửa liu riu đến khi nước sốt sệt lại, mỡ trong.",
      "durationMinutes": 20,
      "heatLevel": "LOW"
    },
    {
      "phase": "Hoàn thiện",
      "order": 4,
      "content": "Rắc phần tiêu xay còn lại và hành hoa thái nhỏ lên trên. Tắt bếp và dùng nóng với cơm trắng.",
      "durationMinutes": 2,
      "heatLevel": "NONE"
    }
  ],
  "editorialReviewed": true,
  "cookTested": true,
  "nutritionVerified": false
}
```
