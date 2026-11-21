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
Mục này kể "câu chuyện trước khi có concurrent": vì sao render đồng bộ làm app đứng hình — đọc để hiểu concurrent ra đời nhằm giải quyết đúng bài toán này.
- Trước React 18, mọi `setState` dẫn tới **render đồng bộ đến cùng**: render một cây 10.000 dòng sẽ **block main thread** — người dùng gõ phím không thấy chữ, click không phản hồi, mọi thứ đứng hình tới khi render xong.
- Không có cách nào "can thiệp" giữa chừng: một render đã bắt đầu thì phải chạy hết, dù có update khẩn cấp hơn xen vào.
- Fragment nền càng nặng thì thời gian "đứng hình" càng lớn → UI feel lag, đặc biệt tệ trên máy yếu.
- Concurrent giải quyết bằng cách chia render thành **đơn vị nhỏ**, nhường quyền điều khiển cho browser ở giữa, và nếu có update khẩn cấp (typing, click) thì **bỏ dở** render đang chạy để xử lý cái mới.

## Khái niệm cốt lõi
Mục này định nghĩa 6 thuật ngữ nền của concurrent — đọc để nắm "từ vựng" trước khi xem luồng hoạt động phía sau.
- **Hai phase của render:**
  - *Render phase*: React dựng lại cây fiber, tính toán element mới. Phase này **tinh khiết, không chạm DOM**, và **có thể bị ngắt/bỏ dở**.
  - *Commit phase*: React áp thay đổi lên DOM. Phase này **nguyên tử (atomic)** — chạy một mạch, không thể ngắt nửa chừng (nếu không thì DOM sẽ nửa mới nửa cũ).
- **Time slicing (chia lát thời gian)**: React cắt render thành nhiều "lát" nhỏ, giữa các lát **nhường lại cho browser** (vẽ, xử lý input...). Browser không bao giờ bị chiếm giữ quá lâu.
- **Lanes (làn ưu tiên)**: scheduler xếp mỗi update vào một lane theo độ khẩn cấp — update từ click/typing vào lane cao (urgent), update trong `startTransition` vào lane thấp (đã nói ở bài 3).
- **Interruptible + resumable**: render bị ngắt không phải vứt bỏ hết — React có thể ưu tiên lại thứ tự; nếu render cũ không còn cần thiết (state đã đổi tiếp) thì discard.
- **`createRoot`** là công tắc bật concurrent behaviors; **`ReactDOM.render` (legacy)** chỉ render đồng bộ kiểu cũ và bị cảnh báo deprecation.
- **StrictMode double-invoke**: `createRoot` với `<StrictMode>` ở dev sẽ gọi render + effect **2 lần liên tiếp** để lộ side-effect không an toàn — effect phải idempotent (có cleanup đúng).

Ví von gộp lại cả mục: render phase là "nháp" (viết xong có thể xé, viết dở có thể bỏ), commit phase là "bản chính ký tên" (không sửa nửa chừng), time slicing là "làm việc theo ca ngắn", lanes là "làn ưu tiên trên cao tốc" — xe cứu thương (typing/click) luôn được nhường đường.

> **Tóm gọn 1 câu:** Concurrent là "render có thể bỏ dở để nhường đường": render phase làm nháp được ngắt, commit phase là bản chính một mạch, `createRoot` là công tắc bật chế độ này.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

Lưu ý: không còn callback `ReactDOM.render(<App/>, el, callback)` — dùng `useEffect`/`useLayoutEffect` trong component thay thế. JSX chỉ render `root.render(<React.StrictMode><App /></React.StrictMode>)` ở chính entry.

> **Tóm gọn 1 câu:** `createRoot` là hộp chiếu mới: dựng một lần ở entry, sau đó chiếu (render) bao nhiêu lần tùy thích — không còn callback "khi chiếu xong" ở tham số thứ 3.

## Luồng hoạt động (Flow)

Mục này đi qua 5 bước theo đúng nhịp một update khẩn cấp xen vào render nặng — đọc theo thứ tự để thấy "bỏ dở - nhường đường - làm lại" diễn ra thế nào.
1. User tương tác (gõ, click) → React tạo update trên **lane khẩn cấp**.
2. Scheduler đánh dấu cần render, **yield** cho browser xử lý các tác vụ khác trước.
3. **Render phase** bắt đầu: dựng lại fiber từng phần; mỗi lát nhỏ xong thì **kiểm tra** — có update khẩn cấp hơn? Có thì **pause/discard** render hiện tại, chuyển sang cái mới.
4. Khi render không còn bị ngắt → **Commit phase**: áp mutation DOM một mạch, gọi layout effects, refs.
5. Browser paint + React gọi `useEffect` (passive effects).

Ví dụ thực tế: đang filter 5000 items (render nặng) mà user gõ thêm ký tự → keystroke mới nhảy vào lane urgent, render filter cũ bị bỏ dở, input phản hồi ngay.

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- `createRoot(el)` — tạo một root concurrent gắn với `<div id="root">`; chạy đúng **một lần** khi app khởi động, về sau chỉ gọi `root.render()`.
- `root.render(<App />)` — có thể gọi lại nhiều lần (React diff như bình thường), mỗi lần gọi theo lịch trình concurrent, không cam kết commit đồng bộ.
- `<StrictMode>` — bật double-invoke: nếu effect không có cleanup sạch (đăng ký listener không trả về unsubscribe, mutable ngoài), dev console sẽ log trùng/vỡ để bạn sửa. Không có tác dụng gì ở production.
- Filter đặt thẳng trong render — ví dụ cho thấy "concurrent không tự tăng tốc": filter vẫn nặng, nhưng **không còn chặn input** vì bị ngắt giữa chừng. Để giảm công việc thật sự, kết hợp `startTransition`/`useDeferredValue` (bài 3).
- `root.unmount()` — gỡ toàn bộ cây + dọn listener DOM; dùng khi app cần "tắt" (test, hot swap).

## So sánh với cách làm cũ

Mục này đặt `ReactDOM.render` cạnh `createRoot` để thấy khác biệt cốt lõi — đọc cột "Lợi ích" nếu chỉ cần lý do migrate.
| Cách cũ (`ReactDOM.render`) | Cách mới (`createRoot`) | Lợi ích |
|---|---|---|
| Render đồng bộ, không thể ngắt | Render theo lịch, có thể interrupt/discard | UI không đứng hình vì render nặng |
| Không hỗ trợ Transitions/Suspense data | Bật toàn bộ tính năng concurrent | Dùng được `startTransition`, `useDeferredValue`... |
| Callback tham số thứ 3 (`render(el, dom, cb)`) | Không có callback root level | Bắt buộc dùng Effect; loại bỏ anti-pattern |
| Không StrictMode double-invoke | StrictMode do bạn bọc chủ động | Lộ bug side-effect sớm ở dev |

> **Cách đọc bảng này:** mỗi dòng là một khác biệt cũ ↔ mới; dòng 1 và dòng 2 là lý do chính đáng để migrate — các dòng sau là hệ quả đi kèm cần biết (mất callback, StrictMode tự bọc).

## Lỗi thường gặp
Mục này gom 5 lỗi chuyển đổi sang `createRoot` hay gặp nhất — mỗi lỗi đều có "vì sao" và "fix" ngay trong dòng.
1. **Vẫn dùng `ReactDOM.render` trong project 18** → vì sao: legacy renderer không có concurrent behaviors, console log cảnh báo *"ReactDOM.render is no longer supported"* → fix: thay bằng `createRoot(...).render(...)`, thường là 3 dòng ở entry file.
2. **Kỳ vọng concurrent tự làm render nhanh hơn** → vì sao: concurrent chỉ phân phối lại thời gian, không giảm tổng công việc → fix: bọc update không khẩn cấp trong `startTransition`/`useDeferredValue` (bài 3) để render nặng đi đường non-urgent.
3. **Effect không cleanup → StrictMode chạy 2 lần gây bug khó hiểu** (subscribe 2 lần, setState sau unmount) → fix: mọi effect trong `<StrictMode>` phải trả về hàm cleanup; test kỹ ở dev.
4. **Đọc DOM ngay sau `setState` trong cùng function mong đợi giá trị mới** → vì sao: commit có thể bị trễ theo lịch concurrent → fix: đọc trong `useLayoutEffect` (chạy ngay sau commit DOM).
5. **Tạo `createRoot` lại mỗi lần render/HMR thủ công** → fix: tạo root ở module scope / `main.tsx`, chỉ unmount khi cần (ví dụ test).

## Khi nào dùng / Khi nào không
- **Dùng**: mọi project React 18+ — migrate `createRoot` là bắt buộc để dùng concurrent features; list/filter/dashboard render nặng; app cần giữ input responsive lúc có update lớn.
- **Không dùng**: logic phụ thuộc *thứ tự commit đồng bộ tuyệt đối* giữa nhiều root (hiếm); cũng đừng lạm dụng StrictMode trong production (nó là công cụ dev).

> **Tóm gọn 1 câu:** `createRoot` là bắt buộc để bật concurrent — nhưng nhớ: nó chia lại thời gian chứ không bào mỏng công việc, render nặng vẫn cần `startTransition`/`useDeferredValue` đi cùng.

## Bài tập nhỏ
- Tạo list 50.000 item + ô lọc, chạy bằng `ReactDOM.render`. Mở DevTools Performance, gõ liên tục vào ô lọc, chú ý task dài (>200ms) làm input miss keystroke.
- Đổi sang `createRoot` + bọc `startTransition(( ) => setQuery(value))` cho phần lọc. Đo lại Long Tasks + cảm giác gõ phím → ghi nhận khác biệt (bài 3 giải thích chi tiết `startTransition`).

## Reference
- [React 18 Release Blog](https://react.dev/blog/2022/03/29/react-v18-0)
- [createRoot API](https://react.dev/reference/react-dom/client/createRoot)
- [Suspense loading states (context concurrent)](https://react.dev/reference/react/Suspense)
- [StrictMode](https://react.dev/reference/react/StrictMode)