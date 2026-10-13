# Q3: Sao mở app Vite/Next lên lúc nào cũng thấy StrictMode bọc ngoài? Nó có chạy ở production không?

## Câu hỏi

> Mọi template React (Vite, Next.js) đều bọc app bằng StrictMode — nó thực sự làm gì, và vì sao bật sẵn?
> Nó ảnh hưởng gì đến production build không?
## Trả lời ngắn (elevator pitch, 30 giây)

- **StrictMode** là component *opt-in* chỉ hoạt động ở **dev**: nó **chạy render + lifecycle 2 lần** (double-invoke) và bật các cảnh báo thêm (deprecated APIs, effect không có cleanup, unstable IDs...) — để **lộ sớm** các bug mà code "trông như chạy đúng" nhưng thực ra không an toàn.
- Nó **không thay đổi gì** ở production build (zero runtime cost, không chạy lại).
- Cần vì sao: với **concurrent rendering + Suspense + strict effects** (React 18+), React có quyền **tạm dừng, chạy lại, mount-unmount-mount** component bất cứ lúc nào. Code có side-effect không idempotent (subscribe, fetch, `Math.random()` trong render, `Date.now()`...) sẽ phá UI (duplicated log, double subscription, tearing...). StrictMode bắt bạn phát hiện ngay trên dev.

## Trả lời chi tiết

### 1. StrictMode làm gì, chính xác (dev-only)

```tsx
// main.tsx — template Vite/Next mặc định
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Ở **dev**, với mỗi component trong cây:

| Việc | Hành vi |
|---|---|
| **Render functions & body của hook** | Gọi **2 lần** (kể cả derived state tính trong render) |
| **`useState`/`useRef` initializer** | Chạy 2 lần |
| **Effects (`useEffect`, `useLayoutEffect`)**: mount | Mount → chạy effect → **unmount giả lập** → mount lại (double-firing) |
| **`console.warn`** | Report các pattern không an toàn: deprecated lifecycle, `findDOMNode`, string ref, effect không cleanup... |

Ở **production build**: StrictMode là no-op hoàn toàn — không double-invoke, không log.

### 2. Tại sao lại cần (gốc rễ: concurrent)

React 18+ có thể **interrupt** render (chưa nói ở [`02-react-18-vs-19`](../02-react-18-vs-19)). Hệ quả: **không gì đảm bảo render function hay effect chạy đúng 1 lần**. Code an toàn phải thỏa:

- **Render tinh khiết (pure)**: cùng input → cùng output, không side-effect.
- **Effect idempotent + có cleanup đúng**.

StrictMode mô phỏng chính xác điều concurrent có thể làm ở runtime thật (chạy lại, unmount/remount), để bạn sửa **trên dev** chứ không để user production "phát hiện".

```tsx
// ❌ KHÔNG an toàn — StrictMode (và concurrent) làm lộ ngay:
function Search() {
  const [id] = useState(() => Math.random()); // initializer chạy 2 lần ở dev → ID lệch
  useEffect(() => {
    const sub = subscribe(store);       // mount chạy 2 lần → 2 subscription
    // không có cleanup → state lệch, memory leak
  }, []);
  return <p>id: {id}</p>;
}

// ✅ An toàn — StrictMode "không còn phàn nàn" (đặt import ở đầu file thật):
function Search() {
  const id = useId(); // import { useId } từ "react" — ID tất định (React 18), không random
  useEffect(() => {
    const sub = subscribe(store);
    return () => sub.unsubscribe();       // cleanup đúng → double-mount không hại gì
  }, []);
  return <p>id: {id}</p>;
}
```

Tương tự với fetch: `useEffect(() => fetch(...), [])` chạy 2 lần ở dev là **chính xác như hành vi có thể xảy ra ở production** (StrictMode chỉ mô phỏng) — nếu bạn chưa có cancellation (AbortController) hay cache (TanStack Query), bạn đã thấy "double request" ngay trên dev console.

### 3. Vì sao KHÔNG dùng làm "fix" bằng cách bỏ StrictMode

Nhiều project gặp log gấp đôi (2 fetch, 2 effect) rồi **bọc bỏ `<StrictMode>` để "im tiếng"** — sai, vì:

1. Nó giấu bug thay vì sửa bug. Concurrent sẽ "tự" double-invoke production nếu React cần (remount, interruption) — không có StrictMode cũng xảy ra, chỉ không có cảnh báo.
2. Sửa đúng = **idempotent render + cleanup effect** (như ví dụ trên), không phải tắt công cụ kiểm tra.
3. Bỏ StrictMode còn mất luôn các warning deprecated (string ref, `findDOMNode`, `UNSAFE_componentWillMount`...) giúp migrate an toàn lên React 19+ (đã dẹp các API này — xem Q2).

## Bẫy khi phỏng vấn

1. **"StrictMode làm app dev chạy chậm/đặc biệt"** → không phải "bug": dev double-invoke là *đặc biệt* (intentional). Production build thì zero impact (dead-code eliminate bằng `process.env.NODE_ENV !== 'production'`).
2. **Nhầm StrictMode với "chỉ dev" nghĩa là bỏ đi là hết vấn đề** → vấn đề thực là code không pure; StrictMode chỉ là đèn cảnh báo.
3. **Hiệu ứng của StrictMode với concurrent là "chỉ dev"** → thực tế concurrent + StrictMode là combo: StrictMode mô phỏng lại đúng hành vi concurrent có thể làm.
4. **Quên: initializer useState cũng chạy 2 lần** → không dùng `useState(() => Math.random())` cho ID; dùng `useId`.

## Gợi ý câu chốt

> "StrictMode là 'trò chơi stress-test' có kiểm soát: ở dev, React cố tình double-invoke render và mount-unmount-mount effect để lộ bất kỳ side-effect nào không an toàn — thứ mà concurrent rendering *về nguyên tắc* có thể làm ở production. Nó zero cost trong production build, và cách xử lý đúng là sửa code (render pure, effect có cleanup) chứ không phải gỡ StrictMode."

## Reference

- [React StrictMode](https://react.dev/reference/react/StrictMode) — double-invocation, development-only behavior
- [`4_react-new-feature/1_react-18/1_concurrent`](../../4_react-new-feature/1_react-18/1_concurrent/README.md) — "StrictMode double-invoke" và migrate `createRoot`
- Q2 (React 18 vs 19) — vì sao strict + concurrent mới thật sự "có ý nghĩa"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q4 — HMR?](../04-hmr/README.md) · [Q2 — React 18 vs 19?](../02-react-18-vs-19/README.md)
- **Đào sâu (xuyên nhóm)**: [Q27 — useEffect (effect chạy 2 lần trong StrictMode là bẫy?)](../27-which-effect-when/README.md)
