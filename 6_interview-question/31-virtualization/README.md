# Q31: Nếu UI bắt buộc phải render 10.000 record thì làm thế nào?

## Câu hỏi

> Nếu UI bắt buộc phải render 10.000 record thì làm thế nào?
> Virtualization (windowing) là gì, tại sao DOM vẫn nhỏ cố định dù data lên tới 1 triệu item?
> Các option của `useVirtualizer` (`count`, `getScrollElement`, `estimateSize`, `overscan`, `measureElement`) để làm gì?
> Kết hợp với `useInfiniteQuery` thì thế nào? Khác pagination ở đâu?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "lời mở màn 30 giây" — nói trôi khúc này là người phỏng vấn đã gật, phần dưới chỉ để đỡ khi bị hỏi đào sâu.

- Vẽ hết 10.000 dòng là tạo 10.000+ node DOM thật — cuộn là giật, RAM phình, so sánh tốn.
- **Virtualization**: chỉ vẽ vài chục dòng vừa khung hình + ít dòng đệm, cuộn tới đâu tính tới đó. DOM nhỏ cố định dù data 10k hay 1 triệu.
- List vài trăm dòng trở lên hoặc dòng nặng (ảnh, iframe) thì virtualize. Dưới ~200 dòng thì phân trang là đủ, đừng bày vẽ.
- Feed dài vô hạn: Query **nạp dần** từng trang + virtualizer **vẽ ít** — hai thứ giải hai việc khác nhau nên đi cùng nhau. Hoãn thời điểm vẽ (transition/deferred) là việc khác nữa.

## Trả lời chi tiết

Mục này lần lượt trả lời: vì sao render hết là chết, `useVirtualizer` vận hành thế nào, và khi nào nên/không nên virtualize — đọc để biến "biết thuật ngữ" thành "giải thích được cơ chế".

### 1. Vì sao "render hết" chết (con số cụ thể)

| Cách | Node DOM (50k dòng, ~5 node/dòng) | Layout/paint mỗi scroll |
|---|---|---|
| Render hết (map toàn bộ) | **~250.000** | **Toàn bộ** (trình duyệt layout 250k node mỗi frame scroll) |
| **Virtualize** | **~15–30** (cửa sổ viewport + overscan) | **Chỉ cửa sổ** (DOM ổn định khi cuộn) |

> **Cách đọc bảng này:** mỗi dòng là một cách tiếp cận; cột giữa cho biết bao nhiêu node DOM thật phải dựng lên (con số quyết định RAM và tốc độ), cột phải cho biết mỗi lần cuộn trình duyệt phải vẽ lại bao nhiêu — so chéo 2 cột là thấy ngay vì sao một bên giật, một bên mượt.

Bằng chứng đo: DevTools Performance → **DOM Nodes** ổn định khi cuộn qua hàng nghìn dòng (virtual) vs tăng vọt (không virtual).

Ví von cho cơ chế này: virtualization giống như đi ngắm thành phố từ toa tàu — bạn chỉ cần khung cửa sổ sạch để nhìn, không cần dựng cả thành phố bên ngoài; tới đâu, khung cửa "rết" tới đó.

### 2. `useVirtualizer` — 4–5 option sống còn

> 📄 **Code ví dụ:** [`examples/01-2-usevirtualizer-4-5-option-song-con.tsx`](examples/01-2-usevirtualizer-4-5-option-song-con.tsx)

**Mỗi option làm gì (nói được = ăn điểm)**:
- **`count`**: tổng item → virtualizer biết "thước toàn list" (tính scroll range).
- **`getScrollElement`**: trả **ref ổn định** (đọc `scrollTop`/`clientHeight` ở đâu) — **không được** `createElement` (mất mốc đo, mỗi render null/mới → rỗng).
- **`estimateSize`**: cao ước lượng trước khi đo (sai nhiều → scroll lệch tạm, rồi `measureElement` hiệu chỉnh).
- **`overscan`**: đệm 2 đầu (scroll nhanh không "trắng"); quá lớn (> 20) mất lợi ích.
- **`measureElement` + `getItemKey`**: **row cao động** (text 1–3 dòng) — đo thật sau render, không "chỉ estimate" (sai tổng cao **tích lũy**, càng cuộn càng lệch/đè).

### 3. Vì sao "absolutely positioned + translateY" (cơ chế, không phải vẹt)

- Container phải có **height hữu hạn + overflow:auto** — không có = không scroll event, virtualizer chỉ vẽ vài dòng (list "trắng" — lỗi #1).
- Row dùng **`top:0; transform: translateY(start)`** thay `top: start` → trình duyệt chỉ **composite** (layer đã vẽ) — **không layout lại** mỗi scroll (layout = chậm, đúng thứ muốn tránh).
- `getTotalSize()` làm "thước" ảo: canvas cao bằng tổng → **thanh cuộn dài đúng**, dù DOM chỉ vài chục row.

### 4. Khi nào VIRTUALIZE, khi nào KHÔNG (quy tắc 1 trang)

| Trường hợp | Dùng |
|---|---|
| List **> vài trăm dòng** có scroll (log 50k, feed, table 10k, dropdown 5k option) | **Virtualize** |
| Row chứa **ảnh/iframe/table** (nặng) | **Virtualize** (dù số dòng ít hơn) |
| List **< 200 dòng** | **Không** (virtualization chi phí đo + absolute **không lợi** — render thường + pagination) |
| **Table** lớn + cột dính | `TanStack Table` (logic cột/sort) + `TanStack Virtual` (cửa sổ) — combo, không tự bịa CSS |

> **Cách đọc bảng này:** mỗi dòng là một tình huống thực tế; cột Dùng là quyết định cuối cùng — dò theo đúng hoàn cảnh dự án của bạn, đừng học thuộc cả bảng. Dòng 3 là "ranh giới" được hỏi nhiều nhất: dưới 200 dòng thì công sức virtualize không hoàn lại.

### 5. Kết hợp Query (feed vô hạn) — combo 2026

> 📄 **Code ví dụ:** [`examples/02-5-ket-hop-query-feed-vo-han-combo.tsx`](examples/02-5-ket-hop-query-feed-vo-han-combo.tsx)

> **Phân biệt** (ăn điểm): **Infinite (không virtualize)** = mỗi page render hết → DOM **phình theo số page**. **Virtual + Infinite** = DOM **cố định** (cửa sổ), memory = page đã nạp. "Chỉ infinite (không virtual) là **nửa vời**".

### 6. Khác `pagination` (thường hỏi kèm)

| | Pagination | Virtualization |
|---|---|---|
| Ai chia dữ liệu | **Server** (nhiều click, 1 lần N trang) | **Client** (DOM nhỏ, "scroll một") |
| UX | Nhiều click (mất "scroll one") | Liền mạch (scroll) |
| Server | Nhẹ (trả 1 trang) | Nặng hơn (nạp dần, không trả hết) |
| **Chuẩn mới** | **Server paginate + client virtualize trang đang mở** (infinite + virtual — "cả hai", không chọn 1) |

> **Cách đọc bảng này:** mỗi dòng là một khía cạnh so sánh (ai chia dữ liệu, UX, tải của server); dòng cuối là câu trả lời "chuẩn 2026" — thường được hỏi để xem bạn chọn một hay "cả hai".

## Bẫy khi phỏng vấn

Mục này liệt kê 6 cách trả lời nghe hợp lý nhưng sai — như biển báo "đường ngập" trước khi bạn lái vào: biết trước chỗ ngập thì không bao giờ chết máy.

1. **"Nói virtualization = giảm render (giống memo/deferred)"** → **sai** (khác trục): virtual **giảm số node DOM** ("vẽ bao nhiêu"), deferred/transition **hoãn thời điểm render** (Q29), memo **giảm CPU render con** (Q16). List khổng lồ: **cần cả virtual (DOM) + deferred (hoãn) + memo (CPU)**.
2. **"List ngắn (< 200 dòng) virtualize cho 'xịn'"** → **sai** (chi phí đo + absolute positioning **không lợi** — render thường + pagination). "Quy tắc 200 dòng" là điểm ăn điểm.
3. **Key dùng `index` (render)** → sort/filter/reorder là **React nhầm node** (Q8), row lệch/đo sai. **Key ổn định** (id thật / `vi.key`).
4. **Dùng `top: start` (không `translateY`)** → **layout mỗi scroll** (chậm) — composite (translate) là đúng (Q "vì sao 60fps").
5. **Container không `height` + `overflow:auto`** → "list trắng" (không scroll event, virtualizer không tính) — lỗi "thực chiến" #1 (phải kiểm tra đầu tiên khi "trắng").
6. **"`useInfiniteQuery` là đủ, không cần virtual"** → "nửa vời": DOM phình theo số page (bảng §5) — "combo" (infinite + virtual) mới đúng feed dài.

> **Tóm gọn 1 câu:** Virtualization là "vẽ chỉ mỗi khung cửa sổ đang nhìn" — DOM nhỏ cố định dù data triệu dòng, và chỉ đáng làm khi list dài hoặc row nặng; còn thiếu `translateY` hay `overflow:auto` là rơi ngay ra hai lỗi kinh điển.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói một hơi, rồi diễn đạt lại bằng giọng của mình.

> "50k `<li>` = 50k node DOM (× ~5 = ~250k) — layout/paint mỗi scroll chết. **Virtualization (windowing)** chỉ vẽ **cửa sổ viewport + overscan** (DOM ~15–30) dù data 1M: container `overflow:auto` + height, canvas cao `getTotalSize()`, row **`absolute; transform: translateY(start)`** (composite, không layout mỗi scroll). `useVirtualizer`: `count`/`getScrollElement` (ref ổn định, không createElement)/`estimateSize`/`overscan`/`measureElement`+`getItemKey` (row động). **Quy tắc: list > vài trăm dòng (hoặc row nặng) → virtual; < 200 → pagination**. Feed dài: **`useInfiniteQuery` (nạp dần, server) + virtual (DOM nhỏ, client)** — cả hai, không 1. Khác deferred/memo: virtual **giảm node DOM** (trục 'vẽ bao nhiêu'), deferred **hoãn thời điểm** (Q29), memo **giảm CPU** (Q16) — list khổng lồ cần cả ba."

## Reference

- [`2_react-techniques/3_performance-optimization/2-virtualization`](../../2_react-techniques/3_performance-optimization/2-virtualization) — `useVirtualizer` (4 option + measureElement + getItemKey), cơ chế "canvas ảo + absolute + translateY", "row động", "scrollToIndex", bảng "vs Pagination / vs Infinite / vs react-window", "list < 200 không virtual"
- [`5_react-crud-jsonplaceholder`](../../5_react-crud-jsonplaceholder) — "Search dùng `useDeferredValue` + filter" (combo deferred + list), Query server state
- [`2_react-techniques/8_best-practices/4_performance-guide`](../../2_react-techniques/8_best-practices/4_performance-guide) — "không thay virtualization (hoãn thời điểm vs giảm node)", deferred + virtual cùng lúc
- Q8 (key = index) — "key ổn định" (row virtual không dùng index render, reorder lệch)
- Q29 (transition/deferred) — deferred **hoãn** (trục thời gian) vs virtual **giảm node** (trục DOM) — "cần cả hai"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q29 — list nặng, giữ UI mượt (startTransition)?](../29-concurrency-transition-deferred/README.md) · [Q8 — key = id (không index) cho N item?](../08-key-index/README.md)
- **Đào sâu (xuyên nhóm)**: [Q20/32 — infinite query (load phân trang vô hạn)?](../20-data-fetching/README.md) · [Q34 — giữ ref cho N phần tử (virtualize + focus item)?](../34-ref-callback-n-items/README.md)
