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

Mục này kể câu chuyện hai "căn bệnh" kinh điển của SSR và store ngoài: ID lệch nhau giữa hai phía, và snapshot không nhất quán dưới concurrent. Đọc để hiểu vì sao 2 hook này ra đời.

- **Với ID**: cần `id` cho `<label htmlFor>`, `aria-describedby`, `<defs>`... Server render ra ID A, client render ra ID B (vì `Math.random()` hoặc thời gian) → **hydration mismatch** → toàn bộ cây không hydrate được, form mất focus, a11y hỏng. `useId` sinh ra đúng chuỗi trên cả 2 phía. Ví von: như hai chi nhánh cùng một ngân hàng phát hành số tài khoản riêng lẻ — khách đến nơi nào số cũng phải khớp sổ trung tâm, nếu không thì mọi giao dịch "đứng hình".
- **Với external store**: subscribe bằng `useEffect(() => { store.subscribe(cb); setState(store.get()); }, [])` có 2 vấn đề với concurrent:
  1. **Tearing**: render lần đầu đọc snapshot cũ, render lần sau đọc snapshot mới (store đổi giữa chừng) → UI không nhất quán.
  2. **Miss update**: subscription lại trong effect → nếu store đổi **giữa render và effect chạy**, update bị bỏ lỡ.
- `useSyncExternalStore` đăng ký subscription **trong render phase** (kiểu `useLayoutEffect` nội bộ) → không tearing, không miss.

## Khái niệm cốt lõi

Mục này mổ xẻ bên trong 2 hook: `useId` đánh số theo vị trí trong cây, còn `useSyncExternalStore` hoạt động như một "cửa sổ" đọc store ngoài mà React kiểm soát được. Hãy hình dung `useId` như số ghế in sẵn trên vé (cùng rạp, cùng chỗ, dù mua ở quầy nào) và `getSnapshot` như bảng điện tử trạm xăng — phải luôn trả đúng một con số tại một thời điểm, nếu nhảy loạn thì đồng hồ đo (React) báo lỗi vòng lặp.

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

> **Tóm gọn 1 câu:** `useId` là "số ghế in trên vé" — cố định theo vị trí để server/client trùng nhau; `useSyncExternalStore` là "cửa sổ quan sát chuẩn" đọc store ngoài mà không để UI nhìn thấy hai giá trị khác nhau cùng lúc.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

## Luồng hoạt động (Flow)

Mục này theo dõi vòng đời của cả hai hook trong cùng một lần render — từ lúc gán ID, đăng ký subscription, tới lúc so snapshot và dọn dẹp khi unmount.

1. Component render → `useId()` gán ID theo vị trí trong cây → server/client ra cùng chuỗi → hydrate OK.
2. Component render → `useSyncExternalStore` đăng ký subscription ngay trong render-phase lifecycle.
3. Store đổi → React gọi lại subscribe, đọc `getSnapshot()` mới.
4. React so sánh snapshot cũ/mới bằng `Object.is` → khác → **schedule re-render** (không tearing vì snapshot đọc từng điểm trong commit).
5. Unmount → React gọi unsubscribe trả về từ `subscribe`.

> **Tóm gọn 1 câu:** ID sinh theo vị trí nên hai phía trùng nhau; snapshot so bằng `Object.is` nên store đổi đúng một lần, đúng chỗ, không bao giờ "mất tin".

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- `subscribeWidth` — `window` chỉ tồn tại ở client; trả về `removeEventListener` để `useSyncExternalStore` tự cleanup.
- `getWidthServerSnapshot` trả `1024` cố định — nếu thiếu, React sẽ *khóa* hydrate bằng snapshot client đầu tiên gây cảnh báo *"The result of getServerSnapshot should be cached"*/mismatch.
- `EmailField` gọi `useId()` — 2 instance render 2 ID khác nhau (`:r0:` và `:r1:`), label trỏ đúng input.
- Toàn bộ pattern này không cần `useEffect` — React lo đời sống subscription, đúng chuẩn concurrent.

## So sánh với cách làm cũ

Bảng dưới xếp từng vấn đề cạnh giải pháp cũ và mới. Đọc theo hàng: mỗi dòng là một "căn bệnh" và thuốc chữa tương ứng.

| Vấn đề | Cách cũ | Cách mới | Lợi ích |
|---|---|---|---|
| ID cho a11y | `Math.random()` / `useState(uuid)` | `useId()` | Không hydration mismatch, không render lại vì uuid |
| Subscribe external store | `useEffect + useState` | `useSyncExternalStore` | Không tearing, không miss update, SSR-safe |
| Media query/responsive | matchMedia + effect riêng từng chỗ | `useSyncExternalStore(matchMedia)` | Một pattern chuẩn, tái sử dụng |
| Server fallback | `typeof window` check rải rác | `getServerSnapshot` | Hydrate khớp, không nháy layout |

> **Cách đọc bảng này:** đọc từ trên xuống theo mức độ thường gặp — ID là vấn đề ai cũng gặp, còn media query và server fallback là tình huống chuyên biệt hơn; cột "Cách cũ" chính là chỗ bạn nên dò code hiện tại của mình.

## Lỗi thường gặp

Mục này là danh sách 5 cái bẫy kinh điển — đặc biệt bẫy số 1 (snapshot không ổn định) từng "đốt" rất nhiều người mới bằng vòng lặp re-render vô tận.

1. **`getSnapshot` trả object/array mới mỗi lần gọi** → vì sao: React so sánh bằng `Object.is` → thấy "đổi" mãi → **infinite re-render** → fix: cache snapshot (`useMemo` ở store, hoặc trả primitive/`===` ổn định).
2. **Quên trả unsubscribe trong `subscribe`** → vì sao: leak listener, store đổi nhưng không re-render → fix: luôn `return () => ...` (nếu không có gì hủy thì trả `() => {}`).
3. **Bỏ `getServerSnapshot` trong app SSR** → vì sao: React không biết dùng gì ở server → hydration báo lỗi → fix: cung cấp snapshot cố định, không đọc `window` trên server.
4. **Dùng `useId` cho `key`** → vì sao: ID theo vị trí, đổi khi reorder — sai ý nghĩa key → fix: key dùng id dữ liệu của item (`item.id`).
5. **Lạm dụng `useSyncExternalStore` cho state nội bộ** → vì sao: overhead không cần thiết; state nội bộ `useState`/`useReducer` đã tối ưu → fix: chỉ dùng khi nguồn state **nằm ngoài React** và nhiều component cùng đọc.

> **Tóm gọn 1 câu:** Snapshot phải "một câu hỏi một câu trả lời", subscribe phải có lối thoát, còn `useId` chỉ làm việc với ID hiển thị — không phải chìa khóa dữ liệu.

## Khi nào dùng / Khi nào không
- **Dùng `useId`**: mọi `label htmlFor`, `aria-describedby`, `aria-labelledby`, `datalist`, SVG `defs`/`clipPath` cần id ổn định.
- **Dùng `useSyncExternalStore`**: app tự viết store toàn cục (Redux, Zustand thay lõi bằng hook này), media query, online/offline status, localStorage theo dõi, WebSocket feed.
- **Không**: state chỉ một component dùng, hoặc khi đã dùng store có sẵn hỗ trợ hook này — đừng tự bọc thêm.

## Bài tập nhỏ

Bài tập gom cả hai hook vào một custom hook thực dụng — làm xong bạn có luôn `useMediaQuery` dùng được trong dự án thật.

- Viết custom hook `useMediaQuery(query: string)` dùng `useSyncExternalStore` + `window.matchMedia`, rồi render nav mobile/desktop theo kết quả. Bọc thêm một component đọc `navigator.onLine` bằng cùng pattern — kiểm tra không có cảnh báo hydration khi render qua `renderToStaticMarkup`.

> **Tóm gọn 1 câu:** Nếu bạn viết được `useMediaQuery` không warning hydration, coi như đã nắm chắc pattern external store.

## Reference
- [useId](https://react.dev/reference/react/useId)
- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [React 18 Release Blog](https://react.dev/blog/2022/03/29/react-v18-0)