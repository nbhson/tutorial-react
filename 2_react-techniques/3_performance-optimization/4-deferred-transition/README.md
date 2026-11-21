# useDeferredValue + useTransition

> Nguồn: https://react.dev/reference/react/useDeferredValue — https://react.dev/reference/react/useTransition

## Mục tiêu

### 1. Giữ input/search phản hồi tức thì ngay cả khi phía sau là render danh sách nặng

**Vì sao:** mỗi phím gõ `setQuery` → filter 50k phần tử → render cả list. Làm đồng bộ thì keypress bị block, gõ delay, UX tệ (INP cao). Người dùng tha thứ list cập nhật chậm 200ms nhưng không tha thứ ô input đơ.

**Cơ chế scheduling:** React chia update thành urgent (nhập chữ — tức thì) và non-urgent (lọc/render list — chờ được). Input đọc giá trị gốc (urgent, vẽ ngay); list đọc bản trễ (non-urgent, vẽ khi rảnh). Main bận thì React hoãn render list, ưu tiên sự kiện gõ mới; list bắt kịp dần, không mất phím nào.

> 📄 **Code ví dụ:** [`examples/01-1-giu-input-search-phan-hoi-tuc-thi.tsx`](examples/01-1-giu-input-search-phan-hoi-tuc-thi.tsx)

**Usecase thực tế:** search 20k nhân viên, filter table 50k đơn, tab chuyển view phức tạp, sort lớn. Quy tắc nhận diện: "render nặng theo input" (mỗi phím gây render > 50ms) → deferred/transition. Render nhẹ (< 50ms) → đừng thêm, phí hoãn.

### 2. Dùng `useTransition` đánh dấu update ít ưu tiên (giữ UI cũ + `isPending`)

**Vì sao:** đổi tab/wizard/query nặng mà làm đồng bộ thì UI trắng/chớp giữa chừng. `startTransition(() => setState(...))` bảo React "giữ màn hình cũ, render mới ở nền, xong mới đổi". `isPending` cho badge nhẹ ("Đang lọc…") mà không chặn thao tác. Ví von: giống như nhà hàng nói "món mới đang chế biến, bàn vẫn phục vụ đồ cũ trong lúc chờ" — khách không phải ngồi bàn trống.

### 3. Dùng `useDeferredValue` trì hoãn giá trị cho render nặng (filter/sort/search)

**Vì sao:** đơn giản hơn transition — không bọc `setState`, chỉ "đọc nơi khác": input `setQuery` thẳng, list đọc `deferred`. Một dòng là có scheduling, không cần restructure update.

> **Tóm gọn 1 câu:** Mục tiêu của bài: gõ phím luôn nhạy, phần render nặng chạy nền — "input urgent, output deferred".

## Tổng quan

Khi gõ ô tìm kiếm, mỗi phím kích hoạt `setQuery` → filter 50.000 phần tử → render lại cả list. Nếu làm "ngay mà không suy nghĩ", keypress bị block, gõ bị delay — UX tệ. Hai hook sinh đôi trong React 18+ giải quyết bằng **ưu tiên tác vụ** (scheduling): React chia update thành *urgent* (nhập chữ — phải tức thì) và *non-urgent* (lọc/render list — có thể chờ).

`useTransition` quấn `setState` vào `startTransition` để "hạ độ ưu tiên"; `useDeferredValue` tạo **bản sao trễ** của giá trị dùng riêng cho render nặng — gốc cập nhật ngay (input nhạy), bản trễ cập nhật khi rảnh. Áp dụng cho: filter/search to, tab chuyển view phức tạp, sort lớn, bất kỳ "render nặng theo input". Không thay virtualization (deferred lo *khi* render, virtual lo *bao nhiêu* node) — list khổng lồ dùng cả hai + memo.

## Khái niệm cốt lõi

Mục này giải nghĩa 7 mảnh ghép: concurrency là gì, hai hook sinh khác nhau ra sao, kết hợp thế nào với memo/virtual, và khác debounce ở điểm nào. Đọc để không nhầm "hoãn" với "đợi".

### 1. Concurrency — render non-urgent hủy giữa chừng được, UI cũ giữ nguyên

**Vì sao:** trước đây render là đồng bộ không hủy. Nay React có thể render list mới dở dang, thấy phím gõ mới (urgent) thì bỏ bản dở, giữ màn hình cũ hoàn hảo tới khi bản mới sẵn sàng. Không chớp trắng, không nửa vời. Ví von: như người vẽ biển hiệu — có khách mới ghé là ngừng bút, ra cửa chào khách, rồi quay lại vẽ tiếp chứ không xé tờ giấy đang dở.

### 2. `useTransition` — `[isPending, startTransition]`, bọc setState thành low-priority

`startTransition(() => setTab('reports'))` — React giữ tab cũ + `isPending: true` lúc đang render nền. Dùng `isPending` cho spinner nhẹ/opacity, không early-return trắng (pending là báo hiệu, không phải loading ban đầu).

> 📄 **Code ví dụ:** [`examples/02-2-usetransition-ispending-starttransition-boc-setstate-thanh-low.tsx`](examples/02-2-usetransition-ispending-starttransition-boc-setstate-thanh-low.tsx)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/03-2-usetransition-ispending-starttransition-boc-setstate-thanh-low.tsx`](examples/03-2-usetransition-ispending-starttransition-boc-setstate-thanh-low.tsx)

### 3. `useDeferredValue(value)` — "lazy twin", gốc nhạy, trễ cho nặng

Khởi đầu giữ giá trị cũ, bắt kịp khi rảnh. Render đọc `value` gốc là urgent; render đọc `deferred` là non-urgent. Không cần bọc setState — chỉ cần đọc đúng biến ở đúng nơi. React 19 thêm `useDeferredValue(value, initialValue)` cho lần đầu.

> 📄 **Code ví dụ:** [`examples/04-3-usedeferredvalue-value-lazy-twin-goc-nhay-tre.tsx`](examples/04-3-usedeferredvalue-value-lazy-twin-goc-nhay-tre.tsx)

### 4. Kết hợp memo/Compiler — deferred lo *khi*, memo lo *ai*

Deferred vẫn render (dù trễ) — list 1.000 Row mà không memo thì mỗi lần bắt kịp vẫn vẽ 1.000. Tổ hợp đúng: deferred hoãn thời điểm + memo bỏ phần không đổi + virtual giảm node. Ba lớp cộng hưởng, không thay nhau.

### 5. Khác debounce — deferred không đợi dừng gõ, không mất phím cuối

Debounce đợi ngưng 300ms mới chạy (cảm giác "imo", mất cập nhật giữa). Deferred lọc theo tốc độ sẵn sàng, bắt kịp dần. Debounce còn cần khi giới hạn request server (chống spam API); deferred không thay việc đó — có thể dùng kèm (deferred cho render, debounce cho network).

### 6. Hai phiên bản giá trị — bản khẩn cho input, bản trễ cho list

Main bận (đang vẽ list cũ) thì React hoãn deferred, ưu tiên sự kiện mới. Render deferred chỉ chạy lúc idle. Hiểu để không hoảng khi thấy list chậm hơn input 1–2 nhịp — đó là thiết kế, không phải bug.

### 7. Lib đã bọc transition sẵn; multi-deferred cho nhiều giá trị

Router (điều hướng), TanStack Table (sort/filter) đã quấn transition — thấy mượt mà không cần đụng. Một màn hình nhiều `useDeferredValue` được (query + filter cùng lúc), miễn mỗi phần đọc đúng biến trễ của mình.

> **Tóm gọn 1 câu:** `useTransition` hạ độ ưu tiên cho cả update, `useDeferredValue` tạo bản sao trễ cho một giá trị — hai anh em cùng phục vụ nguyên tắc "input urgent, output deferred".

## Luồng hoạt động / Cách áp dụng

Mục này là 5 bước nhận diện "render nặng theo input" rồi gắn đúng hook vào đúng chỗ — cắm nhầm biến là gõ chậm ngược đời.

### Bước 1. Xác định "render nặng theo input"

Filter/sort list lớn, recharts lớn, template nặng. Đo: gõ nhanh mà input delay → đích thị cần. Render nhẹ thì thôi.

### Bước 2. Input đơn giản → `useDeferredValue(query)` cho list, `setQuery` thẳng cho input

Một dòng, không restructure. List đọc deferred, input đọc gốc.

### Bước 3. Update cấu trúc (đổi tab/query) → `startTransition` + `isPending` nhẹ

Bọc setState lớn, badge "Đang…" font nhẹ, giữ thao tác. Không early-return trắng.

### Bước 4. `useMemo` kết quả theo deferred value

`useMemo(() => filter(items, deferred), [items, deferred])` — không tính lại khi query đổi mà deferred chưa bắt kịp. Compiler tự làm nếu tuân rules, nhưng giữ tường minh khi filter đắt.

### Bước 5. Đo: gõ nhanh input không delay; Profiler thấy 2 khối tách (urgent nhỏ, non-urgent lớn)

Gộp thành một là đọc sai biến (list đọc gốc thay vì trễ). Đo INP trên Lighthouse, không chỉ cảm giác.

> **Tóm gọn 1 câu:** Luồng cắm chuẩn: input đọc giá trị gốc, phần nặng đọc bản trễ, `isPending` chỉ để báo nhẹ — đo lại bằng Profiler thấy 2 khối tách là đúng.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

## Giải thích từng phần

### `query` gốc cho input — urgent, không lag gõ

Mỗi phím React cập nhật ô input ngay, không chờ filter xong. Đảo lại (input đọc deferred) là gõ chậm — lỗi ngược đời phổ biến nhất, giống như bạn đưa chìa khóa xe chậm nhất cho người cần đi gấp.

### `deferred` cho list — non-urgent, vẽ khi rảnh

List đọc deferred nên React hoãn khi main bận, giữ UI cũ tới khi sẵn sàng. `startTransition` quanh `setQuery` là tùy chọn khi đã có deferred — giữ để có `isPending` feedback, bỏ cũng không sai.

### `useMemo` theo deferred — không lọc thừa

Query đổi 5 phím mà deferred mới bắt kịp 2 lần thì chỉ lọc 2 lần, không phải 5. Không memo là mỗi render (kể cả defer chưa đổi) lọc lại 100k — phí.

### `slice(0, 50)` — giới hạn render; deferred + memo + virtual là full combo

Deferred hoãn, memo bớt tính, slice/virtual bớt node. Thiếu một lớp là một chiều vẫn yếu: deferred không giảm node, virtual không giảm lag gõ.

## So sánh (nếu có)

### `useDeferredValue` vs `useTransition`

Deferred: không đụng setState, "lọc nơi đọc", gọn cho 1 list theo input. Transition: bọc nguyên update, `isPending` tổng, hợp đổi cả view (tab/wizard/route). Một list nặng → deferred; đổi view/query nặng → transition; cần cả badge + list → cả hai như ví dụ.

### vs debounce

Debounce hoãn toàn bộ tới khi dừng (300ms) — server đỡ spam nhưng UX "imo". Ví von: debounce như bạn đợi khách nói xong cả câu mới ghi, deferred như người ghi chép nhanh — khách nói tới đâu ghi theo tới đó, chậm một nhịp nhưng không bỏ sót chữ. Deferred lọc theo sẵn sàng, không mất phím. Debounce vẫn cần cho network (giới hạn request); deferred cho render. Dùng kèm khi search gọi API: deferred mượt input, debounce giảm request.

### vs `memo`

Deferred quyết định *khi* render; memo quyết định *bớt phần nào*. Kết hợp, không "or".

## Lỗi thường gặp / Chống chỉ định

### 1. Deferred cho input chính → ô nhập trễ

Input đọc gốc, nặng đọc trễ. Đảo là ngược đời — fix bằng cách kiểm tra mỗi `value={...}` đang đọc biến nào.

### 2. Quên `useMemo` quanh filter → lọc lại 100k mỗi render

`useMemo` deps `[items, deferred]`; hoặc tin Compiler nếu tuân rules. Đo Performance trước/sau để thấy filter thừa.

### 3. `isPending` early-return trắng → mất giữ UI cũ

Pending chỉ điều khiển opacity/badge/`aria-live`, không thay skeleton trắng. Early-return là biến concurrent thànhSync, phí cả hook.

### 4. Tưởng deferred giảm request server → vẫn spam

Deferred chỉ hoãn render client. Muốn giảm network thì debounce ở tầng query + `staleTime`/dedupe. Kết hợp cả hai cho search API.

### 5. Chống chỉ định: render nhẹ, OTP/mật khẩu/auto-save từng ký tự

< 50ms thì hoãn vô ích. OTP/mật khẩu cần tức thì tuyệt đối — trễ là mất chữ/lag cảm giác. Auto-save từng ký tự mà trễ là lưu thiếu.

> **Tóm gọn 1 câu:** 5 lỗi kinh điển: input đọc trễ, quên `useMemo`, `isPending` thành màn trắng, tưởng deferred giảm request, và hoãn những thứ cần tức thì như OTP.

## Câu hỏi thường gặp

### Deferred khác debounce?

Debounce đợi dừng mới chạy (trễ cố định); deferred giữ nhạy + bắt kịp khi rảnh, không mất phím. Một cái giảm request, một cái mượt render — khác việc.

### Khi nào transition, khi nào deferred?

Một giá trị gây nặng → deferred. Một update đổi cả view/query/route → transition. Cần cả hai như ví dụ thì dùng cả hai.

### Có cần cả hai?

Thường có cho case vừa list vừa view (transition cho setState lớn, deferred cho giá trị lọc). Một trong hai đủ cho case đơn.

### `isPending` để làm gì?

Báo nhẹ nền đang chạy (giữ UI cũ), không chặn render, không thay loading đầu. Bật `aria-live` để screen reader cũng biết.

### Thay virtualization?

Không — deferred hoãn thời điểm, virtual giảm node. List khổng lồ cần cả hai.

## Ghi chú 2026

- **React 19 concurrent chuẩn:** deferred/transition là API ưu tiên tác vụ chính thức, Router v7 tự quấn cho điều hướng (chuyển route nặng không đơ).
- **Compiler + deferred chia việc:** Compiler bớt render dư, deferred bớt block gõ — filter/sort thật nặng vẫn cần deferred dù đã Compiler.

## Best practices / Mẹo

### Input urgent, output deferred — cắm chuẩn cho search/filter

`isPending` badge nhẹ không chặn. Profiler phải thấy 2 khối tách; gộp là đọc sai biến. List khổng lồ: deferred + memo row + virtual. Compiler giảm việc nhưng filter đắt vẫn giữ `useMemo` rõ ý đồ. `isPending` chỉ opacity/badge, không chặn input. `useDeferredValue(v, init)` cho lần đầu. OTP/mật khẩu không deferred. `isPending` lâu bất thường → loop khiến deferred không bắt kịp. INP là thước, không phải cảm giác. `aria-live` cho pending. Không đẩy pending vào global store (vẽ cả app). Nhẹ thì đừng thêm. Tab/wizard nội bộ bọc transition. Gốc cho input, trễ cho lọc — không trộn.

> **Tóm gọn 1 câu:** Gốc cho input, trễ cho phần nặng — ba lớp deferred + memo + virtual cộng hưởng chứ không thay nhau.

## Bài tập nhỏ

1. Search 20.000 string, đo bản thô (setQuery → filter → render): ghi delay phím, giật list.
2. Thêm `useDeferredValue` cho filter — đo lại, so delay phím.
3. Thêm `useTransition` + badge — đo lại, so cảm giác "imo".
4. So với debounce 300ms — ghi 3 cảm nhận (delay phím, giật list, độ trễ kết quả) và chọn tổ hợp giữ lại + lý do.

## Reference

- [useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [useTransition](https://react.dev/reference/react/useTransition)
- [React docs — concurrency scheduling](https://react.dev/learn/render-and-commit)
