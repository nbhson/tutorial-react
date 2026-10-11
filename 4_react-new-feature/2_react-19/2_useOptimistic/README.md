# 2. useOptimistic

## Mô tả
- Bài này giới thiệu **`useOptimistic`** — hook của React 19 (ra mắt **12/2024**, **status: stable**).
- Cho phép hiển thị **trạng thái lạc quan tạm thời** (optimistic UI) trong lúc action async đang chạy: tin nhắn, like, todo "hiện ngay" rồi được thay bằng kết quả thật khi server trả về (hoặc tự rollback nếu lỗi).
- Thường kết hợp Actions (`useActionState`) hoặc Server Actions; hoạt động với bọc `startTransition`.

## Mục tiêu
- Hiểu cơ chế hai lớp state: **actual state** (thật, chờ server) và **optimistic state** (tạm, hiển thị ngay).
- Viết `addOptimistic` đúng nơi (trong action/transition) và để React tự reconcile khi action xong/lỗi.
- Biết khi nào optimistic UI hợp lý và khi nào nên từ bỏ vì rủi ro.

## Vấn đề giải quyết
- Chat/like/todo: chờ server 500ms mới hiện thì UX chậm, cảm giác "trễ".
- Tự làm optimistic bằng `useState` thủ công rất dễ sai: phải nhớ **rollback** khi lỗi, phải merge dữ liệu thật vào list đang có optimistic, dễ trùng id, dễ quên xóa item tạm.
- `useOptimistic` tách rạch ròi: bạn cung cấp một **updater thuần** mô tả "state tạm trông ra sao", React lo phần duy trì + bỏ optimistic khi action kết thúc.

## Khái niệm cốt lõi
- `useOptimistic(actualState, updateFn)` trả về `[optimisticState, addOptimistic]`:
  - `optimisticState` — giá trị **hiển thị**: bằng `actualState` bình thường, nhưng khi có optimistic update đang treo thì là kết quả áp `updateFn`.
  - `addOptimistic(optimisticValue, ...rest)` — đẩy một `optimisticValue` vào; `updateFn(currentState, optimisticValue, ...rest) => nextOptimisticState`.
  - `actualState` đổi (server trả về) → optimistic được thay bằng actual (React ngừng áp updater cho value đã hết hạn).
  - Action throw → React **tự bỏ optimistic** (quay về actualState) — đó là rollback mặc định.
- **Tính chất "pending"**: kết quả của updater tồn tại tới khi *uỷ nhiệm* tương ứng settle; tin nhắn tạm đánh dấu `pending: true` để render mờ.
- Lưu ý: `useOptimistic` trả về state lạc quan **chỉ nên đọc**, không set trực tiếp; muốn cập nhật thật thì dùng state gốc (cùng nguồn với `actualState` đã truyền).

## Cú pháp / API

```tsx
const [optimisticState, addOptimistic] = useOptimistic(
  actualState,                                  // state thật (ví dụ từ useState)
  (currentState, optimisticValue, ...args) => { // updater thuần — trả state tạm
    return nextOptimisticState;
  },
);

async function action(formData: FormData) {
  addOptimistic(value);        // 1. hiện ngay item tạm
  try {
    const saved = await api.send(value);
    setActual(prev => [...prev, saved]); // 2. actual cập nhật → optimistic biến mất
  } catch {
    // 3. throw/lỗi → optimistic tự rollback
  }
}
```

Không được gọi `addOptimistic` trong render; gọi trong action/event, thường bọc bởi `startTransition` khi framework yêu cầu (Server Actions tự bọc).

## Luồng hoạt động (Flow)

1. User gửi → `addOptimistic(text)` → React tính `optimisticState` qua `updateFn` (thêm message tạm `pending: true`).
2. UI vẽ ngay message tạm (mờ, nhãn "đang gửi...").
3. `await api.send(...)` chạy nền.
4. Thành công: `setActual([...actual, saved])` → React thay message tạm bằng message thật (bỏ pending).
5. Thất bại (throw): React hủy optimistic → list quay về actual (message tạm biến mất) + bạn render lỗi riêng.

## Ví dụ chi tiết

```tsx
// example.tsx — useOptimistic (React 19)
import { useOptimistic, useState } from 'react';

type Msg = { id: string; text: string; pending?: boolean };

async function fakeSend(text: string): Promise<Msg> {
  await new Promise((r) => setTimeout(r, 800));
  if (Math.random() < 0.2) throw new Error('Mạng lỗi, thử lại!'); // 20% lỗi
  return { id: crypto.randomUUID(), text };
}

export default function OptimisticChat() {
  const [messages, setMessages] = useState<Msg[]>([]); // ACTUAL state
  const [error, setError] = useState('');

  // OPTIMISTIC view: bình thường = messages; khi addOptimistic → cập nhật qua updater
  const [optimistic, addOptimistic] = useOptimistic(
    messages,
    (current: Msg[], text: string): Msg[] => [
      ...current,
      { id: `temp-${Date.now()}`, text, pending: true }, // tin nhắn tạm
    ],
  );

  async function send(formData: FormData) {
    const text = String(formData.get('text') ?? '').trim();
    if (!text) return;
    setError('');
    addOptimistic(text); // 1. hiện ngay, user thấy tức thì
    try {
      const saved = await fakeSend(text);
      setMessages((m) => [...m, saved]); // 2. actual thay optimistic
    } catch {
      // 3. optimistic tự biến mất; chỉ cần hiện lỗi
      setError('Gửi thất bại — tin nhắn lạc quan đã tự rollback.');
    }
  }

  return (
    <div>
      <h2>useOptimistic (React 19)</h2>
      <ul>
        {optimistic.map((m) => (
          <li key={m.id} style={{ opacity: m.pending ? 0.5 : 1 }}>
            {m.text} {m.pending && <em>(đang gửi...)</em>}
          </li>
        ))}
      </ul>
      <form action={send}>
        <input name="text" placeholder="Nhắn gì đó..." />
        <button type="submit">Gửi</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

## Giải thích từng phần
- `useOptimistic(messages, updater)` — `messages` là actual; updater nhận `current` (đã gồm các optimistic đang treo) và `text` → trả list mới. Đây là hàm **thuần**: không side-effect.
- `id: temp-${Date.now()}` — id tạm ổn định trong thời gian pending; khi server trả id thật, re-render đổi key → không trùng.
- `opacity: pending ? 0.5 : 1` + `<em>(đang gửi...)</em>` — tín hiệu "chưa chắc chắn" cho user.
- Flow lỗi: không cần xóa tay message tạm — React lo; chỉ `setError` để hiện thông báo riêng.

## So sánh với cách làm cũ

| Cách cũ | Cách mới (`useOptimistic`) | Lợi ích |
|---|---|---|
| `useState(optimisticList)` + merge/rollback tay | Khai báo updater thuần, React tự forward/revert | Ít code, ít bug rollback |
| Hiện toast chờ "đang gửi..." 500ms | Item hiện ngay trong list | UX tức thì, không giật |
| Quên xóa item tạm khi lỗi → list "ma" | Action throw → tự xóa optimistic | Luôn đồng bộ với actual |
| Phải merge thủ công vào đúng vị trí | updater mô tả "kết quả trông ra sao" | Dễ hiểu, dễ test |

## Lỗi thường gặp
1. **Không gọi `addOptimistic` trong action mà gọi ngoài (render)** → vì sao: vi phạm quy tắc, optimistic không reconcile → fix: gọi trong action/handler, bọc transition nếu cần.
2. **Tự `setMessages` với chính message tạm** rồi sau lại set thật → vì sao: trùng/chồng optimistic, actual nhiễm item tạm → fix: actual chỉ chứa dữ liệu thật từ server.
3. **Updater mutate `current`** (`current.push(...)`) → vì sao: không thuần, React không so sánh được → fix: trả array/object mới.
4. **Kỳ vọng "tự sửa" khi action trả kết quả** — quên cập nhật actual sau khi action xong → vì sao: optimistic bị bỏ đi nhưng actual vẫn thiếu dữ liệu → fix: luôn `setActual` với kết quả thật trong `try`.
5. **Không disable submit khi pending** → vì sao: gửi 2 lần, optimistic chồng → fix: tổ hợp `useActionState`/`useFormStatus` hoặc cờ riêng.

## Khi nào dùng / Khi nào không
- **Dùng**: chat/comment, like/toggle, todo/tạo item, cập nhật nhanh ít rủi ro — xu hướng thành công >90%; UI cần phản hồi tức thì.
- **Không dùng**: thanh toán/xác nhận đặt hàng (hiển thị sai còn tệ hơn chậm), action dễ fail 50/50, hoặc khi rollback khó đảo ngược mặt hiển thị (ví dụ state lớn phức tạp).

## Bài tập nhỏ
- Mở rộng chat: nút "❤️ Like" mỗi tin — dùng `useOptimistic` để đổi số like + trạng thái tim **ngay**, action throw 20% để kiểm chứng rollback tự động về số cũ. Kiểm tra: bấm like rồi unlike nhanh — số cuối cùng phải khớp actual sau khi cả 2 action settle.

## Reference
- [useOptimistic](https://react.dev/reference/react/useOptimistic)
- [React 19 Release](https://react.dev/blog/2024/12/05/react-19)
- [Actions docs](https://react.dev/reference/react/useActionState)