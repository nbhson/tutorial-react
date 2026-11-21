# 3. Transitions, Suspense & useDeferredValue

## Mô tả
- Bài này giới thiệu nhóm API điều hướng "độ khẩn cấp" của React 18 (03/2022, **status: stable**): `startTransition` / `useTransition` / `useDeferredValue` + **Suspense** (dùng cho SSR streaming & lazy).
- Ý tưởng cốt lõi: chia update thành **urgent** (gõ phím, click — cần phản hồi ngay) và **non-urgent** (lọc list, chuyển tab, kết quả tìm kiếm — có thể trễ).
- Suspense trong 18 stable hóa cho **data fetching theo kiểu framework** và **streaming SSR** (`renderToPipeableStream`).

## Mục tiêu
- Dùng đúng `startTransition`/`useTransition` để giữ input mượt khi render nặng.
- Hiểu `useDeferredValue` khác gì `useTransition` và khi nào nên dùng.
- Biết `<Suspense>` hoạt động thế nào trong streaming SSR và lazy loading.

## Vấn đề giải quyết

Mục này mô tả "cơn đau" mà API trong bài được sinh ra để chữa: input giật vì render nặng, và SSR chậm vì phải đợi cả trang. Đọc để hiểu vì sao React cần khái niệm "độ khẩn cấp".

- Ô search lọc list lớn (10k+ items): mỗi keystroke → re-render cả list → input **giật**. Concurrent renderer (bài 1) giúp *không đứng hình*, nhưng vẫn render cùng lúc cả keystroke lẫn filter → vẫn nặng.
- Cần một cách nói với React: *"keystroke là gấp, list lọc là từ từ"* — vừa là urgent vừa là non-urgent. Trước 18 không có API nào làm được điều đó, phải thủ công debounce/`requestIdleCallback` (rất vất vả, dễ sai).
- SSR cũng vướng: server phải render xong toàn bộ mới trả HTML → TTFB chậm nếu có widget chậm (feed, chart). Suspense giúp stream từng phần.

## Khái niệm cốt lõi

Mục này là phần "định nghĩa luật chơi": transition là gì, hai hook chia nhau vai trò ra sao, và Suspense đóng cảnh nào. Hãy hình dung như nhà hàng: đơn gõ phím là món nước uống — phục vụ ngay; đơn lọc list là món nướng — để sau, khách đang ngồi nói chuyện vẫn vui; Suspense là cái biển "món đang chế biến" cắm trước bàn đang chờ.

- **Transition** = bọc update trong một "làn" **low priority**: React ưu tiên mọi urgent update (typing) chạy trước, transition bị hoãn, và nếu urgent liên tục đến thì transition **bỏ dở và làm lại từ giá trị mới nhất**.
- `useTransition()` trả về `[isPending, startTransition]`: `isPending = true` khi transition đang chạy → render indicator (mờ list, "đang lọc...") mà không chặn input.
- `useDeferredValue(value)`: trả về bản **trễ** của `value`. Render query mới vào *deferred* lane — UI cũ giữ nguyên cho tới khi bản mới sẵn sàng. Thích hợp khi **giá trị đến từ prop/state khác component**, không muốn sửa mọi chỗ gọi.
- So sánh nhanh: `useTransition` nằm ở **phía sản xuất update** (bọc `setState`); `useDeferredValue` nằm ở **phía tiêu thụ giá trị** (bọc giá trị trước khi render con). Kết quả gần tương đương, chọn theo nơi bạn đang kiểm soát.
- **Suspense**: component con *suspend* (ném Promise) → React chờ → hiện `fallback` cho tới khi Promise resolve. Trong 18 stable cho **lazy import** (`lazy()`) và dữ liệu qua framework (Next.js, react-suspense data libs).
- **Streaming SSR**: server render `<Suspense>` boundary nào xong trước thì **stream HTML phần đó về trước**; client hiện thị dần thay vì chờ cả trang. `renderToPipeableStream` là API server tương ứng.

> **Tóm gọn 1 câu:** Transition là "làn xe ưu tiên thấp" cho việc không gấp, `useDeferredValue` là phiên bản dành cho khi giá trị đến từ nơi khác, còn Suspense là biển "đang nạp dữ liệu" — cả ba cùng bảo vệ trải nghiệm tức thì của người dùng.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

## Luồng hoạt động (Flow)

Mục này bám theo một phiên gõ phím thực tế để xem urgent và non-urgent luân phiên nhau ra sao, từ keystroke đầu tới lúc list hiện kết quả.

1. User gõ ký tự → `setInput(value)` chạy ngay (urgent) → input hiển thị tức thì.
2. `startTransition(() => setQuery(value))` — update filter vào lan non-urgent.
3. React tiếp tục gõ → transition bị **hoãn/bỏ dở**, `isPending = true`.
4. User dừng gõ → transition chạy xong → `isPending = false`, list lọc mới hiện.
5. Trong list có `<Suspense>` (lazy/data) → fallback hiện trong lúc chờ, rồi thay bằng nội dung.

> **Tóm gọn 1 câu:** Gõ phím đi đường ưu tiên, lọc list đi làn chậm có thể bị "hủy chuyến" khi gõ tiếp — user chỉ thấy input nhạy và list tự cập nhật lúc lặng lẽ.

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- Tách `input` (hiển thị ngay) và `query` (dữ liệu lọc) — đây là pattern phổ biến nhất với transitions: một state "UI tức thì", một state "nội dung trì hoãn".
- `startTransition(() => setQuery(value))` — đánh dấu update lọc là non-urgent; keystroke tiếp theo của user có thể hủy dở và bắt đầu lại từ query mới nhất.
- `isPending` — render thông báo/mờ list trong lúc chờ; quan trọng cho UX để người dùng biết list đang cập nhật.
- `useDeferredValue` thay thế pattern trên khi bạn *chỉ có* `query` mà không muốn tạo state thứ hai:
  > 📄 **Code ví dụ:** [`examples/03-giai-thich-tung-phan.tsx`](examples/03-giai-thich-tung-phan.tsx)

## So sánh với cách làm cũ

Bảng dưới đối chiếu cách "tự xoay xở" trước React 18 với API chính thức bây giờ. Đọc theo hàng: cột đầu là cách làm tay từng gặp, cột giữa là thứ thay thế, cột cuối là vì sao đáng chuyển.

| Cách cũ (pre-18) | Cách mới (18) | Lợi ích |
|---|---|---|
| Debounce thủ công bằng timer | `startTransition`/`useDeferredValue` | Không cần chọn delay, không "trễ giả tạo"; React tự ưu tiên |
| Render filter đồng bộ mỗi keystroke | Filter chạy ở lane non-urgent | Input không giật, chỉ bỏ dở công việc thừa |
| `requestIdleCallback` tự build | API chuẩn của React | Cross-browser, tích hợp scheduler React |
| SSR render toàn trang rồi trả | Suspense stream từng boundary | TTFB giảm, user thấy nội dung sớm hơn |

> **Cách đọc bảng này:** mỗi hàng là một "chiêu cũ" bị thay thế; hàng cuối khác biệt nhất vì không phải tối ưu client mà là tối ưu thời gian trắng đầu tiên của trang (TTFB).

## Lỗi thường gặp

Mục này gom 5 cú "trật chân" hay gặp khi mới dùng transitions. Mỗi mục ghi rõ vì sao sai và cách sửa — đọc để khỏi lặp lại.

1. **Bọc cả `setInput` (urgent) trong `startTransition`** → vì sao: transition có thể bị trễ → ô input gõ chậm/giật, phản tác dụng → fix: chỉ bọc phần **không khẩn cấp** (lọc, chuyển tab); phần hiển thị input để ngoài.
2. **Dùng transition cho việc cần xác nhận ngay** (submit form, trạng thái disabled của nút gửi) → vì sao: pending kéo dài làm UI mơ hồ → fix: giữ urgent cho validation + UX tức thì.
3. **Quên `isPending` indicator** → vì sao: user không biết list đang cập nhật, tưởng app "đơ" → fix: hiển thị `isPending` (text mờ, skeleton).
4. **Không bọc child lazy/data trong `<Suspense>` mà dùng `use()` promise lỏng** → vì sao: suspend mà không có boundary → lỗi render → fix: luôn có `fallback` gần nhất.
5. **Nghĩ transition giảm được chi phí render** → vì sao: chỉ đổi thứ tự ưu tiên, tổng công việc có thể cao hơn (bỏ dở rồi làm lại) → fix: kết hợp memo hóa dữ liệu nặng & virtualize list thật sự.

> **Tóm gọn 1 câu:** Transition đổi "ai được đi trước", không đẻ thêm tài nguyên — urgent thì giữ ngoài, non-urgent thì bọc trong, và luôn cho user một `isPending` để biết máy vẫn sống.

## Khi nào dùng / Khi nào không
- **Dùng**: search/filter list lớn, tab/carousel/wizard chuyển view, giá trị thay đổi liên tục theo typing/scroll, lazy components + SSR streaming.
- **Không dùng**: update cần phản hồi ngay (controlled input value, toggle disabled, validation), hoặc khi render tính toán nặng có thể thay bằng memoization thực sự (useMemo) — transition **bổ sung**, không thay thế.

## Bài tập nhỏ

Bài tập ép bạn chứng minh bằng số liệu Profiler chứ không phải cảm tính — làm xong mới hiểu thật vì sao transition "tiết kiệm" cảm nhận thay vì tiết kiệm CPU.

- Viết ô tìm kiếm 20.000 items (như example) với `useDeferredValue` thay cho `useTransition`. Đo bằng Profiler: số render của `Results` so với số lần gõ phím; giải thích vì sao `Results` render ít hơn số keystroke. Thử bỏ `startTransition`/`useDeferredValue` và đo lại Long Tasks để thấy khác biệt.

> **Tóm gọn 1 câu:** Gỡ transition ra rồi đo lại Long Tasks — sự khác biệt chính là lý do API này tồn tại.

## Reference
- [startTransition](https://react.dev/reference/react/startTransition)
- [useTransition](https://react.dev/reference/react/useTransition)
- [useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [Suspense](https://react.dev/reference/react/Suspense)
- [lazy](https://react.dev/reference/react/lazy)