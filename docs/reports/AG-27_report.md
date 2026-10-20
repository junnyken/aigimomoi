# AG-27 Report — AI Provider Boundary & Budget (Ranh giới AI, Bảo mật Khóa & Quản lý Ngân sách)

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, sẵn sàng đóng ticket**.

---

## 1. Summary
Đã thiết lập hoàn chỉnh cổng giao tiếp AI có kiểm soát (`Controlled AI Gateway`) cho dự án Ăn Gì Mom, mở đầu **Phase P4 (AI có kiểm soát)** và giải quyết dứt điểm câu hỏi mở **O4**:
- **Kiến trúc Adapter đa nền tảng (`src/lib/ai/`)**:
  - `GeminiProvider`: Tích hợp chuẩn Google Generative AI REST API (`gemini-1.5-flash`), tốc độ cao, tối ưu chi phí và hỗ trợ JSON mode chuẩn hóa.
  - `OpenAiProvider`: Tương thích OpenAI API (`gpt-4o-mini`), sẵn sàng kết nối OpenRouter, DeepSeek hoặc Local Ollama.
  - `MockHeuristicProvider`: Chốt chặn cuối cùng cung cấp gợi ý bữa ăn và công thức dựa trên thuật toán heuristic nội bộ, hoạt động offline 100% không phụ thuộc internet hay API key bên ngoài.
- **Ranh giới bảo mật Server-only (Server Boundary)**:
  - Mọi thao tác gọi AI thực thi tại server-side (`src/lib/ai/gateway.ts`), khóa API (`GEMINI_API_KEY`, `OPENAI_API_KEY`) tuyệt đối không lộ ra trình duyệt (không có tiền tố `NEXT_PUBLIC_`), tự động được làm sạch (`[REDACTED]`) khi ghi log hệ thống.
- **Kiểm soát Ngân sách & Hạn mức (Budget Capping & Rate Limiting)**:
  - Áp trần token đầu ra tối đa 1200 tokens (`maxOutputTokens: 1200`).
  - Timeout nghiêm ngặt tối đa 10 giây (`timeoutMs: 10000`) qua `AbortController` chống nghẽn luồng.
  - Bộ giới hạn tần suất trong bộ nhớ (`maxRequestsPerMinute: 15` trên mỗi client IP) chống lạm dụng chi phí.
- **Cơ chế Tự động Fallback & Phục hồi lỗi (Graceful Degradation)**:
  - Khi provider chính bị lỗi (hết quota, 429, timeout hoặc chưa cấu hình API key), `AiGateway` tự động bắt lỗi và chuyển tiếp liền mạch sang `MockHeuristicProvider`.
  - Tuyệt đối không để lộ exception 500 hay làm gián đoạn trải nghiệm người dùng cuối.

## 2. Invariants & Usability Verified
- **Invariants Gate P4**:
  - AI không tạo đường tắt publish: Output AI chỉ mang tính chất gợi ý hoặc bản nháp thô, không thể bypass quy trình biên tập viên.
  - AI không gây chi phí không kiểm soát: Trần token và timeout được thực thi ở tầng middleware gateway.
- **Đóng câu hỏi mở O4**: Chốt nhà cung cấp và ngân sách theo Quyết định `D47`.

## 3. Changed & Created Files
- `src/lib/ai/types.ts`: Định nghĩa interfaces chuẩn cho Provider, Token usage, Budget config.
- `src/lib/ai/geminiProvider.ts`: Adapter Google Gemini REST API.
- `src/lib/ai/openaiProvider.ts`: Adapter OpenAI-compatible API.
- `src/lib/ai/mockProvider.ts`: Adapter Heuristic Mock Fallback.
- `src/lib/ai/gateway.ts`: Cổng điều phối trung tâm với rate limit, token cap và fallback chain.
- `src/scripts/test_ai_boundary_budget.ts`: Kịch bản kiểm thử tự động 20/20 test cases.

## 4. Test & Verification Results
- `npx tsx src/scripts/test_ai_boundary_budget.ts`: **20/20 PASS** (Server-only secrets, token capping, timeout abort, rate limiting, automatic fallback chain, provider availability).
- `npx tsx src/scripts/test_p3_pilot_gate.ts`: **36/36 PASS** (Không hồi quy Gate P3).
- `npx tsc --noEmit -p .`: PASS 100% không có lỗi kiểu dữ liệu.
- `npm run build`: PASS 100% (35/35 routes biên dịch tối ưu).

## 5. Next Steps
Chuyển sang ticket tiếp theo trong Phase P4:
- **AG-28 (AI recipe & meal suggestion)**: Xây dựng tính năng và giao diện UI gợi ý mâm cơm thông minh dựa trên nguyên liệu có sẵn trong tủ lạnh và sở thích gia đình, nối trực tiếp vào `AiGateway` và validate grounding vào 100% công thức `PUBLISHED`.
