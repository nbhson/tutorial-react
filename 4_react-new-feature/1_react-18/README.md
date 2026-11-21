# React 18 New Features

## Mô tả
- README tổng cho version **React 18** (ra mắt **03/2022**, toàn bộ tính năng dưới đây **stable**) — là version đặt nền móng cho **Concurrent Rendering** và thay đổi mọi thứ sau đó (19, 19.2, 19.3...).
- Đóng vai trò **điều hướng**: mỗi folder con là một bài học chi tiết (README + `example.tsx`).

## Bối cảnh version

Mục này trả lời câu hỏi "vì sao React 18 là bước ngoặt" — khác biệt so với 17 nằm ở kiến trúc chứ không chỉ tính năng.

- React 17 (10/2020) là bản "cầu nối" — không thêm feature, chỉ đổi cơ chế xuất (bag-of-exports) để nâng cấp dần. React 18 mới là bản **kiến trúc lại lõi**. Hãy hình dung 17 như sửa ống nước từng đoạn, còn 18 là thay toàn bộ hệ thống dẫn nước trong nhà.
- Động lực chính: UI đứng hình khi có update nặng. React 18 thay renderer đồng bộ bằng **concurrent renderer** — React có thể *tạm dừng, ưu tiên lại, hủy* công việc render. Đây là nền cho mọi feature ưu tiên sau này (kể cả Server Components).
- Ba trụ cột: **concurrent renderer + `createRoot`**, **automatic batching**, **transitions + Suspense**. Hai hook `useId`/`useSyncExternalStore` là API mới thiết yếu cho SSR và external store.
- Đây là version **bắt buộc phải migrate** (`createRoot`) — mọi version sau đều giả định bạn đã ở trên concurrent renderer.

## Mục tiêu
- Hiểu ba trụ cột: concurrent renderer + `createRoot`, automatic batching, transitions/suspense.
- Nắm 2 hook mới thiết yếu cho app thực tế: `useId` (SSR-safe ID) và `useSyncExternalStore` (external store).
- Biết lộ trình migrate từ React 17: `createRoot`, bỏ legacy `ReactDOM.render`, sửa effect không cleanup khi bật StrictMode.

## Vấn đề giải quyết
- Render đồng bộ đến cùng block main thread → UI đứng hình khi có update nặng.
- Batching chỉ hoạt động trong event handler → code async render thừa nhiều lần.
- Không có cách phân loại update khẩn cấp/có thể trễ → input giật khi filter list lớn.
- SSR/hydration mismatch vì ID tự sinh khác nhau giữa server/client; external store subscribe kiểu `useEffect` bị tearing dưới concurrent.

## Khái niệm cốt lõi
- **Concurrent Rendering**: render chia 2 phase — *render phase* (tinh khiết, có thể ngắt) và *commit phase* (nguyên tử). Scheduler chia lát thời gian, ưu tiên update khẩn cấp, bỏ dở render lỗi thời.
- **`createRoot`**: entry point mới bật concurrent behaviors; legacy `ReactDOM.render` bị deprecation. Bọc `<StrictMode>` để dev phát hiện side-effect không an toàn.
- **Automatic Batching**: mọi `setState` trong cùng task (kể cả async) → 1 render; thoát khẩn cấp bằng `flushSync`.
- **Transitions & Suspense**: update non-urgent chạy nền (`startTransition`/`useTransition`/`useDeferredValue`); `<Suspense>` cho lazy + streaming SSR.
- **`useId`/`useSyncExternalStore`**: ID tất định cho a11y; subscription ngoài React không tearing, SSR-safe.

> **Tóm gọn 1 câu:** React 18 bán "khả năng ngắt nghỉ và ưu tiên" cho renderer — mọi tính năng khác trong bản này đều là khách mời của kiến trúc concurrent đó.

## Điều hướng bài học

Mục này là "mục lục" của folder: 4 bài con, mỗi bài khai thác một mỏ của React 18. Đọc theo thứ tự bảng để đi từ nền tảng tới API thiết yếu.

| # | Bài | Feature (1-2 dòng) |
|---|-----|--------------------|
| 1 | [Concurrent & createRoot](1_concurrent/README.md) | `createRoot` thay `ReactDOM.render`; render có thể ngắt/ưu tiên/hủy để giữ UI responsive với update nặng. |
| 2 | [Automatic Batching](2_automatic-batching/README.md) | Gom mọi `setState` trong cùng task (timer/promise/native event) thành 1 render; `flushSync` để commit ngay. |
| 3 | [Transitions, Suspense](3_transitions-suspense/README.md) | `startTransition`/`useTransition`/`useDeferredValue` đánh dấu update non-urgent; Suspense cho lazy + SSR streaming. |
| 4 | [useId & useSyncExternalStore](4_useId-useSyncExternalStore/README.md) | ID ổn định server/client cho a11y; hook subscribe store ngoài React an toàn concurrent (không tearing). |

> **Cách đọc bảng này:** mỗi hàng là một bài con — cột "#" cho biết thứ tự nên đọc, cột "Feature" tóm tắt đủ để bạn quyết định đọc ngay hay quay lại sau; bấm vào tên bài để mở chi tiết.

## Cú pháp / API (tóm tắt)

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api-tom-tat.tsx`](examples/01-cu-phap-api-tom-tat.tsx)

## Luồng hoạt động (Flow)

Mục này vẽ lại "một ngày làm việc" của concurrent renderer: từ keystroke của user tới commit DOM và giữ store ngoài đồng bộ.

1. User tương tác → update vào lane khẩn cấp (urgent).
2. Update batch + scheduler hoãn các việc non-urgent (transition).
3. Render phase dựng fiber (có thể bị ngắt giữa chừng khi có việc khẩn cấp hơn).
4. Commit phase áp DOM một lần → hydration & effects.
5. Các hook nền (`useSyncExternalStore`) giữ store ngoài luôn đồng bộ qua từng commit.

> **Tóm gọn 1 câu:** Giống nhà bếp có đầu bếp trưởng: việc gấp làm ngay, việc chậm được hoãn hoặc bỏ dở khi có đơn gấp hơn — mà món ra bàn (commit) vẫn nguyên vẹn một lần.

## So sánh với React 17 (cách làm cũ)

Bảng dưới nêu 5 khía cạnh thay đổi lớn nhất giữa hai version. Đọc theo hàng: khía cạnh nào bạn đang dùng cách của 17 thì đó là chỗ cần migrate.

| Khía cạnh | React 17 | React 18 | Lợi ích |
|---|---|---|---|
| Entry point | `ReactDOM.render` | `createRoot` | Bật concurrent features |
| Render | Đồng bộ, không ngắt được | Interruptible, ưu tiên theo lane | UI mượt khi có update nặng |
| Batching | Chỉ trong React event | Mọi ngữ cảnh (async) | Ít render thừa |
| Phân loại độ khẩn cấp | Không có API | Transitions | Input không bị kẹt bởi filter nặng |
| ID / external store | Thủ công, dễ mismatch/tearing | `useId` + `useSyncExternalStore` | Hydrate khớp, concurrent-safe |

> **Cách đọc bảng này:** đọc theo hàng, mỗi hàng là một khía cạnh kiến trúc; hàng đầu (entry point) là thứ bắt buộc phải đổi, các hàng sau là lợi ích tự đến khi đã đổi.

## Breaking changes / Deprecations trong React 18

Mục này liệt kê những gì bị "gút mắt" khi lên 18 — phần lớn là cảnh báo chứ không phải lỗi chết, nhưng nên dọn sớm để lên 19 đỡ vất vả.
- **`ReactDOM.render` bị deprecate** → thay bằng `createRoot` (client) / `hydrateRoot` (SSR hydration). Vẫn chạy ở 18 nhưng cảnh báo và không bật concurrent.
- **`unmountComponentAtNode` deprecate** → dùng `root.unmount()`.
- **StrictMode double-invoke mạnh hơn** ở dev (mount → unmount → mount) để phát hiện effect thiếu cleanup — code cũ lộ bug. Đây **không** phải lỗi React mà là bug trong code.
- **`ReactDOMServer.renderToNodeStream` deprecate** → dùng `renderToPipeableStream` (Node) / `renderToReadableStream` (edge) cho streaming SSR.
- Không có "kiến trúc lại lớn" về API công khai khác — hầu hết code React 17 chạy được, chỉ cần đổi entry point và sửa effect.

## Nâng cấp từ React 17 cần lưu ý gì

Mục này là "checklist 7 bước" để nâng cấp — làm theo thứ tự sẽ ít gặp bất ngờ nhất, từ entry point tới kiểm tra thư viện bên thứ ba.

1. **Đổi entry point**: tìm mọi `ReactDOM.render(...)` → `createRoot(container).render(...)`; SSR dùng `hydrateRoot`. Đặt trong try/catch khi test.
2. **Đảm bảo mọi effect có cleanup** — bật `<StrictMode>` và chạy dev để lộ subscribe/timer chồng nhau; sửa trước khi lên production.
3. **Bọc `<StrictMode>`** ở root để hưởng lợi từ cảnh báo sớm (đặc biệt khi chuẩn bị lên 19).
4. **Cập nhật React types** (`@types/react`, `@types/react-dom`) cùng version để có type cho API mới.
5. **`ReactDOM.render` trong test**: Testing Library phiên bản mới đã tự dùng `createRoot` — nâng RTL nếu gặp cảnh báo.
6. **Kiểm tra third-party** còn dùng legacy lifecycle (`UNSAFE_*`, `findDOMNode`) — nâng cấp hoặc thay thế.
7. Đây là bước đệm cho React 19: `ref`-as-prop, Actions... đều dựa trên nền concurrent + `createRoot`.

> **Tóm gọn 1 câu:** Nâng cấp 18 chỉ thật sự có một việc nặng: đổi `createRoot` và dọn effect — phần còn lại là được miễn phí nhờ concurrent.

## Lỗi thường gặp

Mục này gom 5 lỗi nâng cấp hay gặp nhất — đứng đầu là "quên đổi entry point" và "effect thiếu cleanup bị StrictMode soi".
1. **Giữ `ReactDOM.render`** → vì sao: legacy renderer không concurrent, có warning → fix: `createRoot`.
2. **Effect không cleanup trong StrictMode** → vì sao: double-invoke làm subscribe/setState chạy 2 lần → fix: trả cleanup.
3. **Lạm dụng `flushSync`** → vì sao: phá batching + warning trong lifecycle → fix: dùng `useLayoutEffect` để đo layout.
4. **Bọc update khẩn cấp vào transition** (input value) → vì sao: input trễ, ngược ý nghĩa → fix: urgent để ngoài, non-urgent mới bọc.
5. **`getSnapshot` trả object mới mỗi lần** → vì sao: infinite re-render → fix: snapshot ổn định reference.

> **Tóm gọn 1 câu:** Chín trên mười lỗi lên 18 là "còn sót đá cũ": entry cũ, effect không dọn, hoặc update gấp bị nhốt trong làn chậm.

## Khi nào dùng / Khi nào không
- **Dùng**: mọi dự án React 18+ — migrate `createRoot` bắt buộc; transitions cho search/filter/tab; external store qua `useSyncExternalStore`; `useId` cho a11y.
- **Không**: transition cho logic cần xác nhận ngay; `useSyncExternalStore` cho state nội bộ thuần; `useId` cho `key` list.

## Bài tập nhỏ

Bài tập "cải tạo tổng hợp": lấy một component 17 cũ và áp lần lượt cả 4 kỹ thuật của bản 18, sau đó đo bằng Profiler để thấy con số cải thiện.

- Lấy một component React 17 cũ: (1) migrate `createRoot`, (2) tách input/search dùng `startTransition`, (3) đổi một external subscription (window resize) sang `useSyncExternalStore` + `getServerSnapshot`, (4) thay `Math.random()` id bằng `useId`. Đo bằng Profiler: số render/lần tương tác giảm bao nhiêu.

> **Tóm gọn 1 câu:** Làm trọn bài này là bạn đã đi hết hành trình migrate 17 → 18 trong một component duy nhất.

## Reference
- [React 18 Release](https://react.dev/blog/2022/03/29/react-v18-0)
- [createRoot](https://react.dev/reference/react-dom/client/createRoot)
- [Automatic Batching](https://react.dev/blog/2022/03/29/react-v18-0#new-feature-automatic-batching)
- [startTransition](https://react.dev/reference/react/startTransition)
- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [useId](https://react.dev/reference/react/useId)

## Yêu cầu & chạy thử
- React 18+, Node.js 16+.
- `npx create-vite@latest demo -- --template react-ts && npm i react@18 react-dom@18 && npm run dev`
- Xem tiếp: [React 19](../2_react-19/README.md) — nơi Actions/`use()`/ref-as-prop xây trên nền concurrent của bản này.
