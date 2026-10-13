# 2. useEffectEvent

## Mô tả
- Bài này giới thiệu **`useEffectEvent`** — hook mới của React 19.2 (ra mắt **10/2025**, **status: stable**).
- Tách **logic non-reactive** (event callback đọc props/state mới nhất) ra khỏi Effect, để Effect chỉ re-run khi **reactive deps thật sự** đổi.
- Xóa bỏ nhu cầu `eslint-disable exhaustive-deps`, pattern `useRef` mirror callback, hay bọc callback trong `useCallback` để "chống" re-run.

## Mục tiêu
- Hiểu "Effect Event" là gì và vì sao nó không cần dependency array.
- Viết Effect subscribe kết nối đúng theo `roomId`, dùng event callback đọc `theme`/props mới nhất mà **không reconnect thừa**.
- Phân biệt nơi được gọi: chỉ trong Effect/event handler, tuyệt đối không gọi trong render.

## Vấn đề giải quyết
- Effect subscribe chat room: muốn reconnect khi `roomId` đổi, nhưng `onMessage` callback cần đọc `theme` mới nhất → phải thêm `theme` vào deps → **reconnect mỗi lần đổi theme** (sai, tốn kết nối).
- Workaround cũ: dùng `useRef` giữ callback mới nhất (`ref.current = fn` trong effect/render) + `eslint-disable-next-line react-hooks/exhaustive-deps` → dễ stale closure, khó hiểu, eslint "què".
- `useEffectEvent` chuẩn hóa khái niệm này: một hàm **luôn thấy giá trị mới nhất** nhưng **identity ổn định** và **không tính là dependency**.

## Khái niệm cốt lõi
- `useEffectEvent(fn)` trả về một **Effect Event** — hàm ổn định (identity không đổi giữa các render) mà thân hàm luôn đọc được props/state **mới nhất** tại thời điểm gọi.
- **Không có dependency array**: Effect Event không phải reactive value; đừng đưa nó vào deps của `useEffect` và cũng không cần liệt kê các biến nó đọc.
- **Quy tắc gọi**: chỉ gọi Effect Event **bên trong Effect** hoặc trong event handler liên quan (onClick, onMessage...). **Không gọi trong render**, không truyền vào component/dùng làm prop handler độc lập (nó gắn với ngữ cảnh effect).
- **Conceptual**: "effect event" = việc xảy ra **bởi** Effect nhưng **hợp logic là event** (ví dụ nhận message, toast). Nó là cầu nối giữa reactive thế giới (props/state) và vòng đời Effect.
- Không dùng để "im lặng" lint một cách tùy tiện — nếu logic thực sự cần reactive (phải chạy lại khi giá trị đổi), hãy giữ trong Effect với deps.

## Cú pháp / API

```tsx
import { useEffect, useEffectEvent } from 'react';

function Chat({ roomId, theme }: { roomId: string; theme: string }) {
  // Effect Event: luôn đọc theme mới nhất, identity ổn định
  const onMessage = useEffectEvent((msg: string) => {
    showToast(`[${theme}] ${msg}`);
  });

  useEffect(() => {
    const conn = connect(roomId, onMessage); // dùng event trong Effect
    return () => conn.disconnect();
  }, [roomId]); // chỉ roomId — KHÔNG thêm onMessage/theme
}
```

## Luồng hoạt động (Flow)

1. Render: `useEffectEvent` tạo/cập nhật con trỏ tới callback mới nhất, trả về hàm identity ổn định.
2. `useEffect([roomId])` chạy khi `roomId` đổi → dùng `onMessage` (event) đăng ký.
3. `theme` đổi → component re-render, Effect Event nội bộ cập nhật giá trị mới; **Effect không re-run** (deps không đổi).
4. Khi connection gọi `onMessage(msg)` → hàm đọc `theme` **hiện tại** → toast đúng theme mới nhất.

## Ví dụ chi tiết

```tsx
// example.tsx — useEffectEvent (React 19.2)
import { useEffect, useEffectEvent, useState } from 'react';

function fakeConnect(roomId: string, onMsg: (m: string) => void) {
  console.log(`[connect] room=${roomId}`);
  const id = setInterval(() => onMsg(`ping từ ${roomId}`), 3000);
  return { disconnect: () => { console.log(`[disconnect] room=${roomId}`); clearInterval(id); } };
}

function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  const [log, setLog] = useState<string[]>([]);

  // Non-reactive: luôn đọc theme mới nhất, không gây re-connect.
  const onMessage = useEffectEvent((msg: string) => {
    setLog((l) => [...l.slice(-4), `[${theme}] ${msg}`]);
  });

  useEffect(() => {
    const conn = fakeConnect(roomId, onMessage);
    return () => conn.disconnect();
  }, [roomId]); // đổi theme KHÔNG reconnect — xem console

  return (
    <div>
      <p>Room: {roomId} — Theme: {theme}</p>
      <ul>{log.map((m, i) => <li key={i}>{m}</li>)}</ul>
    </div>
  );
}

export default function EffectEventDemo() {
  const [roomId, setRoomId] = useState('general');
  const [theme, setTheme] = useState('sáng');
  return (
    <div>
      <h2>useEffectEvent (React 19.2)</h2>
      <button onClick={() => setRoomId(roomId === 'general' ? 'random' : 'general')}>
        Đổi room (reconnect)
      </button>
      <button onClick={() => setTheme(theme === 'sáng' ? 'tối' : 'sáng')}>
        Đổi theme (không reconnect)
      </button>
      <ChatRoom roomId={roomId} theme={theme} />
    </div>
  );
}
```

## Giải thích từng phần
- `onMessage` đọc `theme` — nếu để trực tiếp trong effect, eslint buộc thêm `theme` vào deps → reconnect. `useEffectEvent` gỡ "ràng buộc sai" đó.
- `useEffect(..., [roomId])` — chỉ `roomId` là reactive deps đúng; đổi theme không đụng effect.
- Quan sát console: `[connect]` chỉ khi đổi room; `[disconnect]`/`[connect]` không xuất hiện khi đổi theme — nhưng toast vẫn mang theme mới.
- `setLog` bên trong event dùng functional update — an toàn, không cần `log` trong deps.

## So sánh với cách làm cũ

| Vấn đề | Cách cũ | Cách mới (`useEffectEvent`) | Lợi ích |
|---|---|---|---|
| Callback đọc giá trị mới trong Effect | Thêm hết vào deps → effect re-run thừa | Event không tính là dep | Chỉ chạy lại khi cần |
| Tránh re-run bằng ref mirror | `ref.current = fn` + stale closure risk | Hook chính thức, luôn mới | Không stale, dễ đọc |
| Lint `exhaustive-deps` la | `eslint-disable` rải rác | Không cần disable | Đúng chuẩn, lint sạch |
| Callback identity | `useCallback` để ổn định | Event đã ổn định | Bớt code |

## Lỗi thường gặp
1. **Gọi Effect Event trong render** → vì sao: vi phạm quy tắc; React sẽ cảnh báo *"A function wrapped in useEffectEvent can't be called during rendering"* → fix: chỉ gọi từ Effect/event handler.
2. **Thêm Effect Event vào deps của Effect** → vì sao: nó không phải reactive value; thêm vào là sai mục đích → fix: bỏ khỏi deps (eslint của React 19 sẽ hướng dẫn).
3. **Dùng `useEffectEvent` để "chữa" logic thực sự cần reactive** → vì sao: nếu hành vi phải chạy lại khi giá trị đổi, đó là deps thật → fix: giữ trong Effect với deps, không lạm dụng event.
4. **Chỉ để tắt cảnh báo lint cho xong** → vì sao: code dễ sai ngữ nghĩa, bug tinh vi khi props/side-effect khác → fix: dùng khi đúng bản chất "sự kiện phát ra từ Effect".
5. **Gán Effect Event cho prop của component con để dùng như onClick tự do** → vì sao: nó gắn ngữ cảnh effect; truyền ra ngoài tùy tiện dễ sai → fix: giữ trong phạm vi effect/handler liên quan.

## Khi nào dùng / Khi nào không
- **Dùng**: Effect subscribe/socket/timer/observer mà callback cần đọc props/state hay đổi (theme, `onMessage` từ parent); thay `ref.current = fn` + eslint-disable.
- **Không dùng**: logic cần chạy trong render; logic thực sự reactive (phải re-run theo giá trị) — cái đó vẫn là `useEffect` với deps.

## Bài tập nhỏ
- Viết component kết nối WebSocket giả (interval) theo `userId`, log message kèm `theme` hiện tại. Thêm nút đổi theme (không reconnect) và nút đổi user (reconnect). Dùng `useEffectEvent` cho handler; kiểm chứng console chỉ connect lại khi đổi user, và log luôn hiển thị theme mới nhất.

## Reference
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2)
- [useEffectEvent](https://react.dev/reference/react/useEffectEvent)
- [Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)