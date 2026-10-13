# 2. Automatic Batching

## Mô tả
- Bài này giới thiệu **Automatic Batching** — tính năng mới của React 18 (03/2022, **status: stable**).
- Từ React 18, **mọi** `setState` xảy ra trong cùng một task (event handler, `setTimeout`, `Promise.then`, native event, callback async...) được gom thành **một lần render duy nhất**.
- Không có API mới — đây là **hành vi mặc định**, app cũ nâng cấp lên 18 là tự hưởng lợi, không cần sửa code.

## Mục tiêu
- Hiểu vì sao React 17 chỉ batch được trong React event handler còn 18 batch được ở mọi nơi.
- Biết dùng `flushSync` khi thật sự cần commit đồng bộ và hiểu chi phí phải trả.
- Nhận diện được hành vi "nghĩ là 2 lần render nhưng thực ra 1 lần" để debug đúng.

## Vấn đề giải quyết
- Trước React 18, batching chỉ hoạt động trong **React event handler** (onClick, onChange...):
  ```tsx
  // React 17 — batch: 1 render
  function onClick() { setA(1); setB(2); }
  // React 17 — KHÔNG batch: 2 render
  fetch('/api').then(() => { setA(1); setB(2); });
  setTimeout(() => { setA(1); setB(2); }, 0); // cũng 2 render
  ```
- App hiện đại cập nhật state rất nhiều từ **async context**: kết quả fetch, socket message, timer, native event → mỗi chỗ set nhiều state = nhiều lần render thừa = re-render cả cây nhiều lần, UI giật và tốn CPU.
- React 18 gom tất cả các trường hợp trên về **1 render**, giảm công việc mà không đổi cách viết.

## Khái niệm cốt lõi
- **Batch = gom nhiều `setState` trong cùng một "đợt" thành 1 re-render** của cùng components.
- React **luôn render đồng bộ theo từng batch** — chưa từng render "giữa chừng" giữa `setA` và `setB`; re-render chỉ xảy ra khi call stack trả về.
- Trong React 17, cơ chế batch gắn với vòng đời event hệ thống (React bọc handler trong `batchedUpdates`). Ngoài scope đó (timer/promise/native), không có "đường ống" batch → render rời rạc.
- React 18 dời batching lên **scheduler concurrent**: toàn bộ update trong một task — dù từ đâu — được xếp chung một lượt rồi render một lần. Nếu có nhiều update của cùng state thì dùng functional update `(c) => c + 1` để tuyến tính hóa chính xác.
- **Batching giảm số render nhưng không gộp kiểu "nhảy cóc" state**: mỗi `setState` vẫn áp dụng theo thứ tự; chỉ là chúng được "tính chung" trong một vòng render.
- **`flushSync`**: phá batching có chủ đích — ép React commit ngay trong call, hữu ích khi cần đọc DOM ngay sau khi set (đo layout, focus) trước khi dùng giá trị mới. Lạm dụng sẽ mất lợi ích batching và có thể gây cảnh báo khi dùng sai chỗ (trong lifecycle).

## Cú pháp / API

```tsx
// Không có API batching — mặc định:
function handleAsync() {
  fetch('/x').then(() => { setA(1); setB(2); setC(3); }); // 1 render ở React 18
}

// Ép commit ngay (hiếm):
import { flushSync } from 'react-dom';
function measure() {
  flushSync(() => setCount(c => c + 1)); // DOM đã đổi, đọc được ngay
  console.log(el.getBoundingClientRect().height);
}
```

Luật nhớ: default = batch mọi thứ; `flushSync` = ngắt batch, dùng chỉ khi cần đọc DOM ngay sau update.

## Luồng hoạt động (Flow)

1. User click → handler chạy, gọi `setCount` và `setText`.
2. Các update được đẩy vào **queue của scheduler** trong cùng một task (không render ngay).
3. Call stack rỗng → React kích hoạt **một lượt render duy nhất** đọc toàn bộ queue.
4. Nếu các update cùng một state (ví dụ đếm nhiều lần), áp dụng tuần tự qua functional updater.
5. Commit DOM một lần → gọi effects một lần.

Ví dụ trong `example.tsx`: bấm nút "Update trong setTimeout" → 2 setState trong `setTimeout` → console chỉ log **1 dòng `[render #N]`** thay vì 2 như React 17.

## Ví dụ chi tiết

```tsx
// example.tsx — Automatic Batching (React 18)
import { useEffect, useState } from 'react';

let renderCount = 0; // module-scope: đếm tổng số lần render từ lúc mount

export default function BatchingDemo() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('idle');

  renderCount += 1; // mỗi lần render (kể cả re-render) là +1

  useEffect(() => {
    // Chạy sau mỗi commit — mở console để đếm số render.
    console.log(`[render #${renderCount}] count=${count}, text=${text}`);
  });

  function handleAsyncUpdate() {
    // React 18: cả 2 setState trong setTimeout cùng task → batch → 1 render.
    // React 17: 2 render riêng biệt.
    setTimeout(() => {
      setCount((c) => c + 1);
      setText('updated');
    }, 100);
  }

  function handlePromiseUpdate() {
    // Promise.then cũng được batch từ 18.
    Promise.resolve().then(() => {
      setCount((c) => c + 1);
      setText('from-promise');
    });
  }

  return (
    <div>
      <h2>Automatic Batching (React 18)</h2>
      <p>count={count}, text={text} — mỗi click chỉ log 1 render.</p>
      <button onClick={handleAsyncUpdate}>Update trong setTimeout</button>
      <button onClick={handlePromiseUpdate}>Update trong Promise</button>
    </div>
  );
}
```

## Giải thích từng phần
- `let renderCount = 0` ở module scope — không reset theo re-render, dùng làm bộ đếm render thô.
- `renderCount += 1` ngay trong thân component — chạy ở **mọi render** (initial + re-render), đây là cách đếm giản lược không cần DevTools.
- `useEffect(() => { console.log(...) })` *không có deps* — log sau mỗi commit; với 2 setState được batch sẽ thấy đúng 1 log.
- `setCount((c) => c + 1)` — functional updater an toàn khi có nhiều update cùng state; an toàn cả khi bị batch.
- Hai nút demo hai ngữ cảnh async điển hình (timer, promise) — đều batch ở 18.

## So sánh với cách làm cũ

| Cách cũ (React 17) | Cách mới (React 18) | Lợi ích |
|---|---|---|
| Batch chỉ trong React event handler | Batch trong mọi task (timer/promise/native) | Ít render thừa từ code async |
| Set 3 state sau fetch → 3 render | Set 3 state sau fetch → 1 render | Giảm re-render cây, UI mượt hơn |
| Muốn batch phải tự gom state lại 1 object | Không cần thay đổi gì | Code giữ nguyên, hiệu năng cải thiện |
| — | `flushSync` khi cần commit ngay | Có lối thoát khi đo layout/DOM |

## Lỗi thường gặp
1. **Dùng `flushSync` tràn lan "cho chắc"** → vì sao: phá batching, mỗi lần gọi là một commit riêng → hiệu năng giảm; còn có thể ném cảnh báo nếu gọi trong lifecycle/concurrent render → fix: chỉ dùng khi cần đọc DOM/layout ngay giữa chuỗi update, và bọc bên ngoài sự kiện khi có thể.
2. **Tin rằng 2 setState chắc chắn 2 render để debug bằng log** → vì sao: từ 18 mọi ngữ cảnh async đều batch → fix: khai báo count render (như example) hoặc dùng React DevTools Profiler thay vì đoán.
3. **Set state dựa trên giá trị cũ trong cùng batch mà không dùng functional updater** → vì sao: `setCount(count + 1)` nhiều lần trong cùng batch có thể đọc `count` cũ → fix: `setCount((c) => c + 1)`.
4. **Gọi `flushSync` trong lifecycle (`useEffect`, render)** → vì sao: React có thể báo lỗi *"flushSync was called from inside a lifecycle method"* vì phá vỡ bất biến scheduling → fix: di chuyển chỗ cần đo sang `useLayoutEffect` hoặc bọc trong event.
5. **Nghĩ batch "hợp nhất" state kiểu reducer** → vì sao: batch chỉ gộp lượt render, mỗi setState vẫn áp dụng theo thứ tự → fix: hiểu rõ, nếu cần hợp nhất logic dùng `useReducer` hoặc 1 state object.

## Khi nào dùng / Khi nào không
- **Dùng**: mặc định — không cần làm gì, mọi app React 18 tự hưởng lợi; đặc biệt có lợi cho app nhiều fetch/socket/interval cập nhật nhiều state cùng lúc.
- **Không nên**: gắn `flushSync` khắp nơi; không bọc code async trong các micro-optimization thủ công cố "bắt chước" batching — React đã lo.

## Bài tập nhỏ
- Nhân bản `BatchingDemo`, thêm nút set 5 state trong một `Promise.all([...])`. Đếm số render bằng `useEffect` — kỳ vọng 1. Sau đó bọc một trong các setState bằng `flushSync` và đếm lại — ghi nhận số render tăng lên để hiểu giá của việc phá batch.

## Reference
- [React 18 Release Blog — Automatic Batching](https://react.dev/blog/2022/03/29/react-v18-0#new-feature-automatic-batching)
- [flushSync (react-dom)](https://react.dev/reference/react-dom/flushSync)