# 4. useId & useSyncExternalStore

## Mô tả
- Bài này giới thiệu 2 hook mới của React 18 (03/2022, **status: stable**):
  - **`useId`**: sinh **ID duy nhất, ổn định giữa server và client** — dùng cho a11y (`htmlFor`, `aria-*`, SVG `defs`).
  - **`useSyncExternalStore`**: subscribe vào **store ngoài React** (Redux, Zustand, `localStorage`, media query, socket) an toàn với concurrent rendering (không tearing, không miss update).
- Cả hai là nền tảng cho hàng loạt thư viện: `useId` làm nền cho các thư viện form/headless UI, `useSyncExternalStore` là lõi của Redux v9+ và nhiều store manager.

## Mục tiêu
- Chấm dứt pattern tự sinh ID bằng `Math.random()` hoặc `useState(uuid)` vốn gây hydration mismatch.
- Subscribe store ngoài đúng kiểu: `useEffect + useState` là sai từ React 18; hiểu cách dùng `useSyncExternalStore`.
- Nắm 3 tham số `subscribe / getSnapshot / getServerSnapshot` và các bẫy (snapshot không ổn định → infinite loop).

## Vấn đề giải quyết
- **Với ID**: cần `id` cho `<label htmlFor>`, `aria-describedby`, `<defs>`... Server render ra ID A, client render ra ID B (vì `Math.random()` hoặc thời gian) → **hydration mismatch** → toàn bộ cây không hydrate được, form mất focus, a11y hỏng. `useId` sinh ra đúng chuỗi trên cả 2 phía.
- **Với external store**: subscribe bằng `useEffect(() => { store.subscribe(cb); setState(store.get()); }, [])` có 2 vấn đề với concurrent:
  1. **Tearing**: render lần đầu đọc snapshot cũ, render lần sau đọc snapshot mới (store đổi giữa chừng) → UI không nhất quán.
  2. **Miss update**: subscription lại trong effect → nếu store đổi **giữa render và effect chạy**, update bị bỏ lỡ.
- `useSyncExternalStore` đăng ký subscription **trong render phase** (kiểu `useLayoutEffect` nội bộ) → không tearing, không miss.

## Khái niệm cốt lõi
- **`useId()`**:
  - Trả về chuỗi dạng `:r0:` / `:r1:` — có hậu tố đếm theo thứ tự gọi trong cây. Chiến lược này giúp **reconcile**: khi cây re-render, cùng một vị trí nhận cùng ID.
  - **Prefix `:r...:` hợp lệ cho `querySelector`** và giảm xung đột ID toàn cục.
  - Mỗi lần gọi `useId()` trả **một ID mới**; muốn tạo nhiều ID liên kết (input + label + hint) thì **concat hậu tố**: `${id}-input`, `${id}-hint`.
  - Không dùng cho `key` list (không ổn định giữa các vị trí) hay ID nghiệp vụ (cần từ DB).
- **`useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)`**:
  - `subscribe(callback)` — đăng ký, phải **trả về hàm hủy**. React gọi mỗi khi cần và cleanup khi unmount.
  - `getSnapshot()` — hàm **thuần** trả snapshot hiện tại; React cache + **so sánh `Object.is`**; nếu trả object mới mỗi lần gọi → kẹt vòng lặp re-render.
  - `getServerSnapshot()` — snapshot dùng khi **SSR/hydration**; phải ổn định (const) để HTML server = HTML client ban đầu.
  - `useLayoutEffect` nội bộ đăng ký subscriber trong khi render → store đổi trong *render window* vẫn bắt được, kết hợp `useInsertionEffect` cho thư viện.

## Cú pháp / API

```tsx
import { useId, useSyncExternalStore } from 'react';

// useId
const id = useId();                        // ":r0:"
const inputId = `${id}-email`;             // ":r0:-email"

// useSyncExternalStore
const snapshot = useSyncExternalStore(
  subscribe,          // (onStoreChange: () => void) => unsubscribe: () => void
  getSnapshot,        // () => T  — phải trả cùng reference nếu không đổi
  getServerSnapshot?, // () => T  — dùng khi server render / hydrate
);
```

## Luồng hoạt động (Flow)

1. Component render → `useId()` gán ID theo vị trí trong cây → server/client ra cùng chuỗi → hydrate OK.
2. Component render → `useSyncExternalStore` đăng ký subscription ngay trong render-phase lifecycle.
3. Store đổi → React gọi lại subscribe, đọc `getSnapshot()` mới.
4. React so sánh snapshot cũ/mới bằng `Object.is` → khác → **schedule re-render** (không tearing vì snapshot đọc từng điểm trong commit).
5. Unmount → React gọi unsubscribe trả về từ `subscribe`.

## Ví dụ chi tiết

```tsx
// example.tsx — useId + useSyncExternalStore (React 18)
import { useId, useSyncExternalStore } from 'react';

// --- useSyncExternalStore: cửa sổ resize ---
function subscribeWidth(callback: () => void) {
  window.addEventListener('resize', callback); // gọi mỗi khi resize
  return () => window.removeEventListener('resize', callback); // cleanup bắt buộc
}
function getWidthSnapshot() {
  return window.innerWidth; // snapshot thô (number — ổn định reference)
}
function getWidthServerSnapshot() {
  return 1024; // SSR: giá trị cố định → server HTML khớp client ban đầu
}

// --- useId: label gắn input ---
function EmailField() {
  const id = useId(); // ổn định server/client, ví dụ ":r0:"
  return (
    <div>
      {/* nối hậu tố để có id riêng cho từng element */}
      <label htmlFor={`${id}-email`}>Email</label>
      <input id={`${id}-email`} type="email" placeholder="ban@example.com" />
    </div>
  );
}

export default function IdStoreDemo() {
  // Số 1: đọc innerWidth + re-render khi đổi (subscribe ngoài React)
  const width = useSyncExternalStore(
    subscribeWidth,
    getWidthSnapshot,
    getWidthServerSnapshot,
  );

  return (
    <div>
      <h2>useId + useSyncExternalStore (React 18)</h2>
      {/* 2 lần gọi → 2 ID khác nhau, không xung đột label/input */}
      <EmailField />
      <EmailField />
      <p>Chiều rộng cửa sổ (subscribe ngoài React): {width}px</p>
      <p>Chế độ: {width < 768 ? 'Mobile' : 'Desktop'}</p>
    </div>
  );
}
```

## Giải thích từng phần
- `subscribeWidth` — `window` chỉ tồn tại ở client; trả về `removeEventListener` để `useSyncExternalStore` tự cleanup.
- `getWidthServerSnapshot` trả `1024` cố định — nếu thiếu, React sẽ *khóa* hydrate bằng snapshot client đầu tiên gây cảnh báo *"The result of getServerSnapshot should be cached"*/mismatch.
- `EmailField` gọi `useId()` — 2 instance render 2 ID khác nhau (`:r0:` và `:r1:`), label trỏ đúng input.
- Toàn bộ pattern này không cần `useEffect` — React lo đời sống subscription, đúng chuẩn concurrent.

## So sánh với cách làm cũ

| Vấn đề | Cách cũ | Cách mới | Lợi ích |
|---|---|---|---|
| ID cho a11y | `Math.random()` / `useState(uuid)` | `useId()` | Không hydration mismatch, không render lại vì uuid |
| Subscribe external store | `useEffect + useState` | `useSyncExternalStore` | Không tearing, không miss update, SSR-safe |
| Media query/responsive | matchMedia + effect riêng từng chỗ | `useSyncExternalStore(matchMedia)` | Một pattern chuẩn, tái sử dụng |
| Server fallback | `typeof window` check rải rác | `getServerSnapshot` | Hydrate khớp, không nháy layout |

## Lỗi thường gặp
1. **`getSnapshot` trả object/array mới mỗi lần gọi** → vì sao: React so sánh bằng `Object.is` → thấy "đổi" mãi → **infinite re-render** → fix: cache snapshot (`useMemo` ở store, hoặc trả primitive/`===` ổn định).
2. **Quên trả unsubscribe trong `subscribe`** → vì sao: leak listener, store đổi nhưng không re-render → fix: luôn `return () => ...` (nếu không có gì hủy thì trả `() => {}`).
3. **Bỏ `getServerSnapshot` trong app SSR** → vì sao: React không biết dùng gì ở server → hydration báo lỗi → fix: cung cấp snapshot cố định, không đọc `window` trên server.
4. **Dùng `useId` cho `key`** → vì sao: ID theo vị trí, đổi khi reorder — sai ý nghĩa key → fix: key dùng id dữ liệu của item (`item.id`).
5. **Lạm dụng `useSyncExternalStore` cho state nội bộ** → vì sao: overhead không cần thiết; state nội bộ `useState`/`useReducer` đã tối ưu → fix: chỉ dùng khi nguồn state **nằm ngoài React** và nhiều component cùng đọc.

## Khi nào dùng / Khi nào không
- **Dùng `useId`**: mọi `label htmlFor`, `aria-describedby`, `aria-labelledby`, `datalist`, SVG `defs`/`clipPath` cần id ổn định.
- **Dùng `useSyncExternalStore`**: app tự viết store toàn cục (Redux, Zustand thay lõi bằng hook này), media query, online/offline status, localStorage theo dõi, WebSocket feed.
- **Không**: state chỉ một component dùng, hoặc khi đã dùng store có sẵn hỗ trợ hook này — đừng tự bọc thêm.

## Bài tập nhỏ
- Viết custom hook `useMediaQuery(query: string)` dùng `useSyncExternalStore` + `window.matchMedia`, rồi render nav mobile/desktop theo kết quả. Bọc thêm một component đọc `navigator.onLine` bằng cùng pattern — kiểm tra không có cảnh báo hydration khi render qua `renderToStaticMarkup`.

## Reference
- [useId](https://react.dev/reference/react/useId)
- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [React 18 Release Blog](https://react.dev/blog/2022/03/29/react-v18-0)