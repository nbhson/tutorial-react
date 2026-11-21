# AI Design Patterns (React)

> Nguồn: https://react.dev/learn — tương đương `angular.dev/ai/design-patterns`

AI sinh code nhanh là một chuyện, sinh code đáng tin lại là chuyện khác. Mục này tổng hợp các pattern đã kiểm chứng để bạn tận dụng tốc độ của AI mà không đánh đổi chất lượng — kèm cả cách dựng UI cho những phần tử chờ AI trả lời.

## Mục tiêu

Mục này nói về 3 đích khi dùng AI trong quy trình React. Đọc để biết sau bài này bạn có bộ công cụ gì.

- Nắm các pattern đã kiểm chứng khi dùng AI sinh React: generate-then-verify, small slices, example-driven.
- Dựng UI streaming cho kết quả AI bằng `Suspense` + `use()`.
- Kết hợp pattern với Server Actions/`useActionState` (Next.js) cho form AI có validation server.

> **Tóm gọn 1 câu:** Sau bài này bạn có cả hai mảnh: quy trình dùng AI có vòng kiểm (3 pattern) và UI chịu được thời gian chờ của AI (streaming + form).

## Tổng quan

Mục này phác nguyên tắc nền: AI là tăng tốc, không phải thay review. Đọc để hiểu tư duy trước khi vào từng pattern.

- AI sinh code là "tăng tốc", không phải "thay review". Pattern giúp giữ chất lượng: **luôn có vòng verify**, **khai thác mô hình theo mẩu** (small slices), **kèm ví dụ** (few-shot).
- Với UI sinh nội dung (chat/AI form), cần pattern **streaming + loading/error state** — không để người dùng nhìn trang đứng im.
- Áp dụng mọi dự án tích hợp AI vào frontend, và cho chính quy trình sinh code bằng AI.

Hãy hình dung AI như một **thợ phụ rất nhanh tay nhưng cần bị soát**: nó hoàn thành mảnh việc trong vài giây, nhưng bạn — người thợ chính — vẫn phải kiểm tra từng mảnh trước khi lắp vào tòa nhà.

> **Tóm gọn 1 câu:** AI tăng tốc chứ không thay người duyệt — luôn có vòng verify, chia việc nhỏ, kèm ví dụ mẫu, và UI phải biết "đợi có văn hóa".

## Khái niệm cốt lõi

Mục này định nghĩa 5 pattern: 3 pattern quy trình (verify, slices, few-shot) và 2 pattern UI (streaming, action state). Đọc để chọn đúng pattern cho đúng tình huống.

- **Generate → Verify**: AI sinh code → CI chạy `tsc`, `eslint`, `vitest`; lỗi thì agent đọc log và tự sửa. Vòng lặp "agent - compiler/test" thay cho review thủ công từng dòng.
- **Small slices**: yêu cầu từng component/hook nhỏ thay vì "viết hộ cả app" — model lạc context, output có ích hơn khi 1 nhiệm vụ 1 lúc.
- **Example-driven (few-shot)**: đính kèm 1 file mẫu đúng chuẩn repo → model "bắt chước" cấu trúc, đặt tên, test — chính xác hơn mô tả dài.
- **Streaming UI với `Suspense` + `use()`**: `use(promise)` cho phép component đọc giá trị Promise; Suspense render fallback tới khi resolve — đúng mô hình React cho UI chờ AI.
- **`useActionState`** (React 19): quản lý state/validation của server action khi submit form (trả `state`, `isPending`).

Ví von cho few-shot: muốn con bắt chước chữ đẹp, đưa cho nó **một trang chữ mẫu** sẽ hơn là diễn giải bằng lời "viết nghiêng nhẹ, gọn ổn áp" — model cũng bắt chước mẫu tốt hơn miêu tả.

### Tổng hợp pattern
| Pattern | Vấn đề giải quyết | Dấu hiệu nên dùng |
|---|---|---|
| Generate → Verify | AI sinh code thiếu chắc chắn | Mọi output AI; gate bằng tsc/eslint/vitest |
| Small slices | Model lạc context khi làm lớn | Task > 1 component/hook |
| Example-driven | Output lệch chuẩn repo | Có file mẫu chuẩn sẵn |
| Streaming UI | Chờ AI lâu, trang đứng im | Kết quả dạng text/chat |
| Action state | Form AI thiếu validation/pending | Submit gọi model/server action |

> **Cách đọc bảng này:** mỗi dòng là một pattern, xếp từ quy trình (3 dòng đầu) sang UI (2 dòng sau). Cột "Dấu hiệu nên dùng" là điểm bắt đầu — thấy đúng dấu hiệu thì dùng đúng pattern, chi tiết quay lại mục Khái niệm.

> **Tóm gọn 1 câu:** 5 pattern chia đôi: 3 cái cho cách ra lệnh AI (verify, slices, few-shot), 2 cái cho cách đỡ người dùng khi AI chậm (streaming, action state).

## Luồng hoạt động / Cách áp dụng

Mục này là quy trình 5 bước để áp pattern vào dự án thật, từ khai báo chuẩn repo đến giữ PR nhỏ. Làm tuần tự theo vòng lặp slice.

1. Khai báo pattern đầu repo: nhóm code theo "slices", agent sinh kèm test.
2. Mỗi slice: prompt ngắn + file mẫu đính kèm → agent sinh → verify (tsc/eslint/vitest) → lặp nếu đỏ.
3. UI AI: nhận `Promise<string>` từ action/server; render qua `Suspense` + `use()`.
4. Form AI: dùng `useActionState` để validation server + trạng thái pending.
5. Giữ mọi output AI trong PR nhỏ, review nhanh, rollback dễ.

> **Tóm gọn 1 câu:** Vòng lặp: ra lệnh nhỏ kèm mẫu → AI sinh → máy kiểm → đỏ thì lặp — còn UI AI thì Suspense đợi và `useActionState` giữ form.

## Ví dụ chi tiết

Mục này đưa ví dụ dùng thật: 2 file code + một prompt few-shot mẫu. Đọc để thấy pattern "kèm file mẫu" vận hành như thế nào trong thực tế.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

```text
# Few-shot prompt — "bắt chước" file mẫu hơn là mô tả
"Viết UserList theo đúng mẫu widgets/user-table.tsx đính kèm:
 props typed, dùng TanStack Query, kèm test Vitest."

> user-table.tsx: [dán file mẫu chuẩn của repo]
```

> **Tóm gọn 1 câu:** Prompt few-shot ngắn gọn chừng ấy vẫn chuẩn vì file mẫu đã "nói thay" cả ngàn chữ mô tả.

## Giải thích từng phần

Mục này bóc từng API trong ví dụ để bạn hiểu cơ chế bên dưới. Đọc khi cần debug hoặc mở rộng tính năng.

- `use(work)`: đọc Promise "như suspense" — thay cho `then` lồng nhau trong component.
- `Suspense fallback`: UI chờ không block; `role="status"` cho screen reader biết trạng thái.
- `useActionState`: state từ server action + `isPending` để disable nút đợi.
- Ở server (`askAction`): giữ model API key — không lộ ra client.
- Few-shot: file mẫu là "chuẩn vàng" — model bắt chước naming/structure/import.

> **Tóm gọn 1 câu:** `use()` đọc Promise, Suspense lo màn hình chờ, `useActionState` lo form — còn key thì ở lại server, đừng cho client bao giờ.

## Lỗi thường gặp / Chống chỉ định

Mục này liệt kê 5 lỗi hay gặp khi dùng AI + dựng UI AI. Đọc để tránh trả giá bằng bug trước khi rơi vào.

- **Yêu cầu AI làm cả app cùng lúc**: context vỡ, code không nối được → chia slices nhỏ + hợp dần.
- **Không có vòng verify**: lỗi type/lập lại API tầng tầng → gate `tsc`+`eslint`+`vitest` vào pipeline PR.
- **Gọi AI ở client (lộ key, chậm)**: gọi ở server action/BFF; client chỉ nhận `Promise<string>`.
- **`Suspense` không bắt lỗi khi Promise reject**: treo mãi → bọc ErrorBoundary (bài 8/3) quanh `AiAnswer`.
- **Không xử lý `isPending` cho form**: user submit nhiều lần, double-charge API → disable khi pending.

Lỗi "AI làm cả app cùng lúc" giống nhờ một người **nấu cả 10 món trong một hơi** — món nào cũng dở một chút; giao từng món thì mỗi món ra ngon.

> **Tóm gọn 1 câu:** Năm lỗi chung một gốc: đụng AI quá nhiều (nhiều việc, không kiểm, key lộ) hoặc quá ít (không đợi, không chặn) — cân lại bằng slices, gate, và state pending.

## Best practices / Mẹo

Mục này gom các mẹo nâng chất lượng sau khi đã áp pattern cơ bản. Đọc để hệ thống dần "mượt" theo thời gian.

- Tách async logic vào server action/BFF; client tối giản.
- Kèm fallback ấn tượng + nút "hỏi lại" với ErrorBoundary.
- Để AI sinh test cùng slice — verify sớm nhất.
- Duy trì thư viện "file mẫu" (templates) trong repo làm few-shot chuẩn.
- Log token/latency AI để tối ưu prompt (thấy prompt dài/lạc đâu).

> **Tóm gọn 1 câu:** Server giữ việc nặng, client giữ giao diện, kho file mẫu giữ chuẩn — còn log token cho bạn biết prompt nào đang "đốt tiền vô ích".

## Bài tập nhỏ

Lấy ví dụ `ChatAnswer`, thêm ErrorBoundary + nút "Thử lại" khi AI lỗi. Viết tiny server action (hoặc mock Promise chậm 1.5s) và test Vitest kiểm tra fallback xuất hiện trước khi resolve.

## Reference
- [React — Suspense](https://react.dev/reference/react/Suspense)
- [React — use](https://react.dev/reference/react/use)
- [React — useActionState](https://react.dev/reference/react/useActionState)
- [Vercel AI SDK](https://sdk.vercel.ai/)
