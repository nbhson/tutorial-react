# 1. Concurrent Rendering & createRoot

## Mô tả
- Bài này giới thiệu **Concurrent Rendering** — thay đổi lớn nhất của React 18 (ra mắt 03/2022, **status: stable**).
- Concurrent renderer cho phép một render **bị tạm dừng, hoãn, ưu tiên lại hoặc hủy bỏ** — điều renderer legacy (React 17 trở về trước) không thể làm.
- Entry point mới: **`createRoot`** (`react-dom/client`) thay thế `ReactDOM.render`, là điều kiện bắt buộc để bật các tính năng concurrent.

## Mục tiêu
- Hiểu tại sao "concurrent" ≠ "chạy song song trên nhiều luồng" mà là *"render có thể bị ngắt để xử lý việc khẩn cấp hơn"*.
- Biết migrate từ `ReactDOM.render` → `createRoot` và nắm các lỗi liên quan StrictMode double-effect.
- Phân biệt render phase (có thể gián đoạn) và commit phase (nguyên tử) để biết đâu là nơi merge ảnh hưởng.

## Vấn đề giải quyết
- Trước React 18, mọi `setState` dẫn tới **render đồng bộ đến cùng**: render một cây 10.000 dòng sẽ **block main thread** — người dùng gõ phím không thấy chữ, click không phản hồi, mọi thứ đứng hình tới khi render xong.
- Không có cách nào "can thiệp" giữa chừng: một render đã bắt đầu thì phải chạy hết, dù có update khẩn cấp hơn xen vào.
- Fragment nền càng nặng thì thời gian "đứng hình" càng lớn → UI feel lag, đặc biệt tệ trên máy yếu.
- Concurrent giải quyết bằng cách chia render thành **đơn vị nhỏ**, nhường quyền điều khiển cho browser ở giữa, và nếu có update khẩn cấp (typing, click) thì **bỏ dở** render đang chạy để xử lý cái mới.

## Khái niệm cốt lõi
- **Hai phase của render:**
  - *Render phase*: React dựng lại cây fiber, tính toán element mới. Phase này **tinh khiết, không chạm DOM**, và **có thể bị ngắt/bỏ dở**.
  - *Commit phase*: React áp thay đổi lên DOM. Phase này **nguyên tử (atomic)** — chạy một mạch, không thể ngắt nửa chừng (nếu không thì DOM sẽ nửa mới nửa cũ).
- **Time slicing (chia lát thời gian)**: React cắt render thành nhiều "lát" nhỏ, giữa các lát **nhường lại cho browser** (vẽ, xử lý input...). Browser không bao giờ bị chiếm giữ quá lâu.
- **Lanes (làn ưu tiên)**: scheduler xếp mỗi update vào một lane theo độ khẩn cấp — update từ click/typing vào lane cao (urgent), update trong `startTransition` vào lane thấp (đã nói ở bài 3).
- **Interruptible + resumable**: render bị ngắt không phải vứt bỏ hết — React có thể ưu tiên lại thứ tự; nếu render cũ không còn cần thiết (state đã đổi tiếp) thì discard.
- **`createRoot`** là công tắc bật concurrent behaviors; **`ReactDOM.render` (legacy)** chỉ render đồng bộ kiểu cũ và bị cảnh báo deprecation.
- **StrictMode double-invoke**: `createRoot` với `<StrictMode>` ở dev sẽ gọi render + effect **2 lần liên tiếp** để lộ side-effect không an toàn — effect phải idempotent (có cleanup đúng).

## Cú pháp / API

```tsx
import { createRoot } from 'react-dom/client';

// Thay cho: ReactDOM.render(<App />, container)
const root = createRoot(container, options?); // options: { onUncaughtError?, onRecoverableError?, identifierPrefix?... }
root.render(<App />);   // render (có thể bị ngắt nếu có update khẩn cấp hơn)
root.unmount();         // gỡ cây, dọn listener (thay cho ReactDOM.unmountComponentAtNode)
```

Lưu ý: không còn callback `ReactDOM.render(<App/>, el, callback)` — dùng `useEffect`/`useLayoutEffect` trong component thay thế. JSX chỉ render `root.render(<React.StrictMode><App /></React.StrictMode>)` ở chính entry.

## Luồng hoạt động (Flow)

1. User tương tác (gõ, click) → React tạo update trên **lane khẩn cấp**.
2. Scheduler đánh dấu cần render, **yield** cho browser xử lý các tác vụ khác trước.
3. **Render phase** bắt đầu: dựng lại fiber từng phần; mỗi lát nhỏ xong thì **kiểm tra** — có update khẩn cấp hơn? Có thì **pause/discard** render hiện tại, chuyển sang cái mới.
4. Khi render không còn bị ngắt → **Commit phase**: áp mutation DOM một mạch, gọi layout effects, refs.
5. Browser paint + React gọi `useEffect` (passive effects).

Ví dụ thực tế: đang filter 5000 items (render nặng) mà user gõ thêm ký tự → keystroke mới nhảy vào lane urgent, render filter cũ bị bỏ dở, input phản hồi ngay.

## Ví dụ chi tiết

```tsx
// example.tsx — Concurrent + createRoot (React 18)
import { createRoot } from 'react-dom/client';
import { StrictMode, useState } from 'react';

// Entry point React 18: createRoot thay ReactDOM.render
const el = document.getElementById('root')!;
const root = createRoot(el); // tạo root MỘT LẦN, tái sử dụng cho mọi render sau

const ITEMS = Array.from({ length: 5000 }, (_, i) => `Item ${i + 1}`);

function App() {
  const [query, setQuery] = useState('');

  // Render nặng: filter 5000 phần tử ngay trong render.
  // Với renderer legacy (17) mỗi keystroke chạy khối này đồng bộ → input giật.
  // Với concurrent renderer: React có thể NGẮT render này để xử lý keystroke,
  // rồi quay lại hoàn tất lọc khi rảnh → gõ phím luôn mượt.
  const filtered = ITEMS.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <h2>Concurrent + createRoot (React 18)</h2>
      <input
        value={query}                    // value controlled
        onChange={(e) => setQuery(e.target.value)} // keystroke = urgent update
        placeholder="Gõ để lọc 5000 items..."
      />
      <p>Kết quả: {filtered.length}</p>
      <ul>
        {filtered.slice(0, 100).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

root.render(
  <StrictMode>   {/* dev: double-invoke render/effect để lộ side-effect không an toàn */}
    <App />
  </StrictMode>,
);
```

## Giải thích từng phần
- `createRoot(el)` — tạo một root concurrent gắn với `<div id="root">`; chạy đúng **một lần** khi app khởi động, về sau chỉ gọi `root.render()`.
- `root.render(<App />)` — có thể gọi lại nhiều lần (React diff như bình thường), mỗi lần gọi theo lịch trình concurrent, không cam kết commit đồng bộ.
- `<StrictMode>` — bật double-invoke: nếu effect không có cleanup sạch (đăng ký listener không trả về unsubscribe, mutable ngoài), dev console sẽ log trùng/vỡ để bạn sửa. Không có tác dụng gì ở production.
- Filter đặt thẳng trong render — ví dụ cho thấy "concurrent không tự tăng tốc": filter vẫn nặng, nhưng **không còn chặn input** vì bị ngắt giữa chừng. Để giảm công việc thật sự, kết hợp `startTransition`/`useDeferredValue` (bài 3).
- `root.unmount()` — gỡ toàn bộ cây + dọn listener DOM; dùng khi app cần "tắt" (test, hot swap).

## So sánh với cách làm cũ

| Cách cũ (`ReactDOM.render`) | Cách mới (`createRoot`) | Lợi ích |
|---|---|---|
| Render đồng bộ, không thể ngắt | Render theo lịch, có thể interrupt/discard | UI không đứng hình vì render nặng |
| Không hỗ trợ Transitions/Suspense data | Bật toàn bộ tính năng concurrent | Dùng được `startTransition`, `useDeferredValue`... |
| Callback tham số thứ 3 (`render(el, dom, cb)`) | Không có callback root level | Bắt buộc dùng Effect; loại bỏ anti-pattern |
| Không StrictMode double-invoke | StrictMode do bạn bọc chủ động | Lộ bug side-effect sớm ở dev |

## Lỗi thường gặp
1. **Vẫn dùng `ReactDOM.render` trong project 18** → vì sao: legacy renderer không có concurrent behaviors, console log cảnh báo *"ReactDOM.render is no longer supported"* → fix: thay bằng `createRoot(...).render(...)`, thường là 3 dòng ở entry file.
2. **Kỳ vọng concurrent tự làm render nhanh hơn** → vì sao: concurrent chỉ phân phối lại thời gian, không giảm tổng công việc → fix: bọc update không khẩn cấp trong `startTransition`/`useDeferredValue` (bài 3) để render nặng đi đường non-urgent.
3. **Effect không cleanup → StrictMode chạy 2 lần gây bug khó hiểu** (subscribe 2 lần, setState sau unmount) → fix: mọi effect trong `<StrictMode>` phải trả về hàm cleanup; test kỹ ở dev.
4. **Đọc DOM ngay sau `setState` trong cùng function mong đợi giá trị mới** → vì sao: commit có thể bị trễ theo lịch concurrent → fix: đọc trong `useLayoutEffect` (chạy ngay sau commit DOM).
5. **Tạo `createRoot` lại mỗi lần render/HMR thủ công** → fix: tạo root ở module scope / `main.tsx`, chỉ unmount khi cần (ví dụ test).

## Khi nào dùng / Khi nào không
- **Dùng**: mọi project React 18+ — migrate `createRoot` là bắt buộc để dùng concurrent features; list/filter/dashboard render nặng; app cần giữ input responsive lúc có update lớn.
- **Không dùng**: logic phụ thuộc *thứ tự commit đồng bộ tuyệt đối* giữa nhiều root (hiếm); cũng đừng lạm dụng StrictMode trong production (nó là công cụ dev).

## Bài tập nhỏ
- Tạo list 50.000 item + ô lọc, chạy bằng `ReactDOM.render`. Mở DevTools Performance, gõ liên tục vào ô lọc, chú ý task dài (>200ms) làm input miss keystroke.
- Đổi sang `createRoot` + bọc `startTransition(( ) => setQuery(value))` cho phần lọc. Đo lại Long Tasks + cảm giác gõ phím → ghi nhận khác biệt (bài 3 giải thích chi tiết `startTransition`).

## Reference
- [React 18 Release Blog](https://react.dev/blog/2022/03/29/react-v18-0)
- [createRoot API](https://react.dev/reference/react-dom/client/createRoot)
- [Suspense loading states (context concurrent)](https://react.dev/reference/react/Suspense)
- [StrictMode](https://react.dev/reference/react/StrictMode)