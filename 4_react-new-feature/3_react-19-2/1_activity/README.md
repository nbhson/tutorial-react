# 1. Activity Component

## Mô tả
- Bài này giới thiệu **`<Activity>`** — component mới của React 19.2 (ra mắt **10/2025**, **status: stable** cho case visible/hidden; trước đó là `<Offscreen>` experimental).
- Cho phép **ẩn/hiện một subtree mà không unmount**: state, DOM và khả năng re-render của con được giữ lại, chỉ Effects bị dọn theo chính sách.
- Dùng như "background activity": thay thế pattern conditional render `{show && <Panel/>}` vốn xóa sạch state mỗi lần ẩn.

## Mục tiêu
- Hiểu cơ chế `mode="visible" | "hidden"`: ẩn bằng `display:none`, giữ state/DOM, **destroy Effects** của con.
- Dùng `<Activity>` để giữ draft tab/wizard và **pre-render** nội dung sẽ hiện ra.
- Tránh bẫy: effect không cleanup (side-effect DOM như `<video>` vẫn chạy), subtree ẩn quá nặng.

## Vấn đề giải quyết

Mục này so bài toán "ẩn tab" giữa 2 cách cùng sai và 1 cách đúng: conditional render mất hết state, CSS display:none giữ state nhưng treo subscription, còn `<Activity>` giữ state mà vẫn dọn Effects. Đọc để biết nó đứng ở đâu trong 3 lựa chọn đó.

- Chuyển tab bằng `{tab === 'a' && <A/>}` → quay lại tab cũ mất hết: form nhập dở, focus, scroll, position của `<video>`... phải nhập lại/refetch. Ví von: như mỗi lần ra khỏi phòng bị ai đó dọn sạch bàn làm việc — quay vào phải dựng lại từ đầu; `<Activity>` chỉ tắt đèn phòng chứ không ai đụng vào bàn.
- Giữ tất cả tab luôn mounted → mọi tab render/effect cùng lúc, tốn kém và sidebar ẩn vẫn chạy subscription.
- `<Activity>` cho ẩn "rẻ": React detach khỏi layout (không vẽ), giữ state/DOM cho lần quay lại, đồng thời **dọn Effects** nên subscription của phần ẩn không còn chạy.
- Thêm nữa: ẩn ngay từ đầu (`mode="hidden"`) lại **pre-render** con ở priority thấp — tải trước code/data cho tab sắp mở.

## Khái niệm cốt lõi

Mục này là "luật vận hành" của `<Activity>`: hidden thì sao, visible thì sao, pre-render và selective hydration nằm ở đâu trong bức tranh. Hãy hình dung như phòng nghỉ của nhân viên: người vẫn ở công ty (state/DOM giữ), điện thoại work tạm ngắt (Effects dọn), quay lại vị trí là làm tiếp ngay.

- `<Activity mode={...}>children</Activity>`, mode `"visible"` (mặc định, hoặc bỏ prop) | `"hidden"`.
- **Khi hidden**:
  - React ẩn children bằng `display: none` — **DOM vẫn tồn tại** (giữ state DOM: textarea draft, scroll, video timecode).
  - **Effects bị destroy** (gọi cleanup của mọi Effect) — subscriptions không chạy cho phần ẩn.
  - Con **vẫn re-render theo props mới** nhưng ở **priority thấp hơn** phần đang hiển thị.
- **Khi visible trở lại**: hiện children với **state cũ được phục hồi**; Effects được **tạo lại** (chạy setup lần nữa).
- **Pre-rendering**: Activity hidden từ lần render đầu vẫn render con (priority thấp, không mount Effect) → code/data (đọc qua `use`/Suspense) được tải sẵn; khi chuyển visible nội dung hiện nhanh hơn.
- **Selective Hydration**: Activity chia cây thành đơn vị độc lập → React hydrate nút/tab trước, mount phần ẩn sau → tương tác sớm hơn ngay cả khi không ẩn gì.
- **Cảnh báo DOM side-effect**: DOM không bị hủy nên hiệu ứng từ DOM vẫn tiếp diễn (video vẫn phát). Cần thêm Effect với cleanup (nên dùng `useLayoutEffect`) để dừng.

> **Tóm gọn 1 câu:** `<Activity>` = "ẩn người, không đuổi việc": state và DOM ở lại, Effects tạm nghỉ, và phần ẩn còn được giao việc nhẹ (pre-render) chờ lượt.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

Props: `children`, `mode` (`'visible' | 'hidden'`, mặc định `'visible'`).

## Luồng hoạt động (Flow)

Mục này đi qua vòng đời một `<Activity>`: mount đầu tiên (kể cả hidden), chuyển hidden, nhận props khi ẩn, và trở lại visible.

1. Render `<Activity mode={...}>`; lần đầu React mount con (kể cả hidden — pre-render, không Effect).
2. Chuyển `hidden`: React set `display:none`, chạy cleanup toàn bộ Effect của con; state + DOM giữ nguyên.
3. Con vẫn nhận props mới và re-render ở priority thấp (chuẩn bị sẵn nội dung).
4. Chuyển `visible`: React gỡ `display:none`, phục hồi state cũ, **mount lại Effects** (subscription hoạt động trở lại).

> **Tóm gọn 1 câu:** Hidden = tắt đèn, khóa điện, giữ nguyên đồ đạc; visible = bật đèn, cắm điện lại — mọi thứ tiếp tục từ chỗ đã dừng.

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- Nhập gì đó vào ô chat → bấm "Settings" → bấm "Chat": `draft` **vẫn còn** dù `ChatPanel` đã bị ẩn — vì Activity không hủy state.
- Hai panel đều được mount ngay từ đầu (cả panel hidden cũng render) — đây là pre-render: code/layout đã sẵn sàng, lần hiện đầu nhanh hơn.
- Effects bên trong panel (nếu có subscription) sẽ được **cleanup khi ẩn** và **chạy lại khi hiện** — đúng ngữ nghĩa "background activity".
- Đổi sang conditional render `{tab === 'chat' && <ChatPanel/>}` sẽ mất draft → minh chứng lợi ích Activity.

## So sánh với cách làm cũ

Bảng dưới xếp 4 giải pháp cũ cạnh `<Activity>`. Đọc theo hàng: mỗi dòng là một cách ẩn tab từng dùng và cái giá của nó.

| Cách cũ | Cách mới (`<Activity>`) | Lợi ích |
|---|---|---|
| `{show && <Panel/>}` (unmount) | Ẩn bằng `display:none`, giữ state | Không mất draft/focus/scroll |
| Luôn mounted bằng CSS `display:none` | Chính sách dọn Effects khi ẩn | Subscription ẩn không chạy |
| Tab lazy mount lần đầu | Pre-render hidden sẵn | Chuyển tab nhanh hơn |
| Toàn trang hydrate một lượt | Selective hydration theo Activity | Tab/nút tương tác sớm |

> **Cách đọc bảng này:** hàng 1 và 2 là hai thái cực cũ (mất state vs. treo subscription), hai hàng sau là tính năng cộng thêm (pre-render, hydration) — `<Activity>` nằm ở "điểm cân bằng" của cả 4.

## Lỗi thường gặp

Mục này là 5 bẫy của `<Activity>` — quan trọng nhất là quên cleanup Effect cho DOM side-effect như video vẫn phát khi ẩn (số 1).
1. **Effect không cleanup, tưởng ẩn là "đã dừng"** → vì sao: DOM còn đó, side-effect DOM vẫn chạy (video/audio vẫn phát) → fix: thêm `useLayoutEffect` trả cleanup (pause media, dọn listener) cho các DOM có tác dụng phụ.
2. **Dùng `<Activity>` cho list hàng nghìn item ẩn** → vì sao: giữ DOM + memory tốn → fix: unmount thật hoặc virtualize; Activity hợp cho panel/tab ít item.
3. **Kỳ vọng Effect chạy luôn khi ẩn** → vì sao: hidden **destroy Effects** (concept như unmount giữ state) → fix: chuyển việc cần làm vào cleanup, hoặc dùng `visible` khi cần chạy.
4. **Không bọc `<StrictMode>` để phát hiện effect lỗi** → vì sao: StrictMode chủ động unmount/mount Activity để lộ cleanup sai → fix: bật StrictMode ở dev.
5. **Bỏ `mode` rồi tưởng mặc định hidden** → vì sao: mặc định `visible` → fix: luôn truyền `mode` rõ ràng khi cần ẩn.

> **Tóm gọn 1 câu:** `<Activity>` ẩn "người" nhưng không ẩn "đồ đạc" — nên media/video cần bạn tự dọn bằng Effect, và list khổng lồ thì đừng nhét vào đây.

## Khi nào dùng / Khi nào không
- **Dùng**: tab/accordion/wizard multi-step, modal giữ draft, sidebar có state mở/đóng, media player giữ timecode, pre-render tab sắp mở, cải thiện hydration.
- **Không dùng**: subtree ẩn quá nặng hoặc nhiều bản sao (tốn DOM/memory); nội dung không bao giờ quay lại (unmount thật sẽ tốt hơn).

## Bài tập nhỏ

Bài tập chứng minh cả hai mặt của `<Activity>`: state được giữ (timecode) và side-effect được dọn (video pause) — rồi so với conditional render để thấy khác biệt.

- Dựng 3 tab (Chat/Settings/Video) bằng `<Activity>`. Ở tab Video: nhúng `<video>` phát nhạc; khi chuyển sang tab khác, thêm `useLayoutEffect` cleanup để **pause** video — chứng minh DOM được giữ (timecode không reset) nhưng side-effect được dọn. So sánh với bản conditional render để thấy mất timecode.

> **Tóm gọn 1 câu:** Timecode không reset mà nhạc tự dừng — bạn đã chạm đúng "linh hồn" của `<Activity>`.

## Reference
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2)
- [<Activity> reference](https://react.dev/reference/react/Activity)
- [StrictMode](https://react.dev/reference/react/StrictMode)