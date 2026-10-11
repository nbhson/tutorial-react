# AI Design Patterns (React)

> Nguồn: https://react.dev/learn — tương đương `angular.dev/ai/design-patterns`

## Mục tiêu
- Nắm các pattern đã kiểm chứng khi dùng AI sinh React: generate-then-verify, small slices, example-driven.
- Dựng UI streaming cho kết quả AI bằng `Suspense` + `use()`.
- Kết hợp pattern với Server Actions/`useActionState` (Next.js) cho form AI có validation server.

## Tổng quan
- AI sinh code là "tăng tốc", không phải "thay review". Pattern giúp giữ chất lượng: **luôn có vòng verify**, **khai thác mô hình theo mẩu** (small slices), **kèm ví dụ** (few-shot).
- Với UI sinh nội dung (chat/AI form), cần pattern **streaming + loading/error state** — không để người dùng nhìn trang đứng im.
- Áp dụng mọi dự án tích hợp AI vào frontend, và cho chính quy trình sinh code bằng AI.

## Khái niệm cốt lõi
- **Generate → Verify**: AI sinh code → CI chạy `tsc`, `eslint`, `vitest`; lỗi thì agent đọc log và tự sửa. Vòng lặp "agent - compiler/test" thay cho review thủ công từng dòng.
- **Small slices**: yêu cầu từng component/hook nhỏ thay vì "viết hộ cả app" — model lạc context, output có ích hơn khi 1 nhiệm vụ 1 lúc.
- **Example-driven (few-shot)**: đính kèm 1 file mẫu đúng chuẩn repo → model "bắt chước" cấu trúc, đặt tên, test — chính xác hơn mô tả dài.
- **Streaming UI với `Suspense` + `use()`**: `use(promise)` cho phép component đọc giá trị Promise; Suspense render fallback tới khi resolve — đúng mô hình React cho UI chờ AI.
- **`useActionState`** (React 19): quản lý state/validation của server action khi submit form (trả `state`, `isPending`).

### Tổng hợp pattern
| Pattern | Vấn đề giải quyết | Dấu hiệu nên dùng |
|---|---|---|
| Generate → Verify | AI sinh code thiếu chắc chắn | Mọi output AI; gate bằng tsc/eslint/vitest |
| Small slices | Model lạc context khi làm lớn | Task > 1 component/hook |
| Example-driven | Output lệch chuẩn repo | Có file mẫu chuẩn sẵn |
| Streaming UI | Chờ AI lâu, trang đứng im | Kết quả dạng text/chat |
| Action state | Form AI thiếu validation/pending | Submit gọi model/server action |

## Luồng hoạt động / Cách áp dụng
1. Khai báo pattern đầu repo: nhóm code theo "slices", agent sinh kèm test.
2. Mỗi slice: prompt ngắn + file mẫu đính kèm → agent sinh → verify (tsc/eslint/vitest) → lặp nếu đỏ.
3. UI AI: nhận `Promise<string>` từ action/server; render qua `Suspense` + `use()`.
4. Form AI: dùng `useActionState` để validation server + trạng thái pending.
5. Giữ mọi output AI trong PR nhỏ, review nhanh, rollback dễ.

## Ví dụ chi tiết
```tsx
// example.tsx — Streaming UI: render dần khi AI trả lời
import { Suspense, use } from 'react';

// Component đọc Promise từ action — suspend cho tới khi có kết quả
function AiAnswer({ work }: { work: Promise<string> }) {
  const text = use(work);
  return <article>{text}</article>;
}

export function ChatAnswer({ work }: { work: Promise<string> }) {
  return (
    // ⏳ fallback hiện ngay khi Promise chưa resolve — không block cả trang
    <Suspense fallback={<p role="status">AI đang trả lời…</p>}>
      <AiAnswer work={work} />
    </Suspense>
  );
}
```

```tsx
// Form AI + Server Actions (Next.js) — validation server + trạng thái submit
import { useActionState } from 'react';

async function askAction(prev: { answer?: string; error?: string }, formData: FormData) {
  const q = formData.get('question'); // đọc dữ liệu form ở server
  if (!q || String(q).trim().length < 10) {
    return { error: 'Câu hỏi quá ngắn (tối thiểu 10 ký tự).' }; // validation server
  }
  const answer = await askAI(String(q)); // gọi model ở server — giữ key bí mật
  return { answer };
}

export function AskForm() {
  const [state, formAction, isPending] = useActionState(askAction, {});
  return (
    <form action={formAction}>
      <label htmlFor="q">Hỏi AI</label>
      <input id="q" name="question" required />
      {state.error && <p role="alert">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Đang hỏi…' : 'Gửi'}
      </button>
      {state.answer && <AiAnswer work={Promise.resolve(state.answer)} />}
    </form>
  );
}
```

```text
# Few-shot prompt — "bắt chước" file mẫu hơn là mô tả
"Viết UserList theo đúng mẫu widgets/user-table.tsx đính kèm:
 props typed, dùng TanStack Query, kèm test Vitest."

> user-table.tsx: [dán file mẫu chuẩn của repo]
```

## Giải thích từng phần
- `use(work)`: đọc Promise "như suspense" — thay cho `then` lồng nhau trong component.
- `Suspense fallback`: UI chờ không block; `role="status"` cho screen reader biết trạng thái.
- `useActionState`: state từ server action + `isPending` để disable nút đợi.
- Ở server (`askAction`): giữ model API key — không lộ ra client.
- Few-shot: file mẫu là "chuẩn vàng" — model bắt chước naming/structure/import.

## Lỗi thường gặp / Chống chỉ định
- **Yêu cầu AI làm cả app cùng lúc**: context vỡ, code không nối được → chia slices nhỏ + hợp dần.
- **Không có vòng verify**: lỗi type/lập lại API tầng tầng → gate `tsc`+`eslint`+`vitest` vào pipeline PR.
- **Gọi AI ở client (lộ key, chậm)**: gọi ở server action/BFF; client chỉ nhận `Promise<string>`.
- **`Suspense` không bắt lỗi khi Promise reject**: treo mãi → bọc ErrorBoundary (bài 8/3) quanh `AiAnswer`.
- **Không xử lý `isPending` cho form**: user submit nhiều lần, double-charge API → disable khi pending.

## Best practices / Mẹo
- Tách async logic vào server action/BFF; client tối giản.
- Kèm fallback ấn tượng + nút "hỏi lại" với ErrorBoundary.
- Để AI sinh test cùng slice — verify sớm nhất.
- Duy trì thư viện "file mẫu" (templates) trong repo làm few-shot chuẩn.
- Log token/latency AI để tối ưu prompt (thấy prompt dài/lạc đâu).

## Bài tập nhỏ
Lấy ví dụ `ChatAnswer`, thêm ErrorBoundary + nút "Thử lại" khi AI lỗi. Viết tiny server action (hoặc mock Promise chậm 1.5s) và test Vitest kiểm tra fallback xuất hiện trước khi resolve.

## Reference
- [React — Suspense](https://react.dev/reference/react/Suspense)
- [React — use](https://react.dev/reference/react/use)
- [React — useActionState](https://react.dev/reference/react/useActionState)
- [Vercel AI SDK](https://sdk.vercel.ai/)