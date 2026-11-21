# Q40: User gõ search 3 chữ liên tục, response về lộn xộn thì màn hình hiện kết quả của chữ nào?

## Câu hỏi

> User gõ nhanh ô search 3 lần liên tiếp (3 request đi ra, response về lộn xộn — request 2 về trước request 3). UI hiện dữ liệu của request nào?
> Có cách nào "chỉ lấy response mới nhất, bỏ response cũ" không? `AbortController`, `useEffect` cleanup, `stale-while-revalidate` của TanStack Query thì dùng ở đâu?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — nêu được hiện tượng race và "chỉ response mới nhất ghi state" là đã qua vòng đầu; phần chi tiết bên dưới để đỡ khi bị hỏi từng cách chặn.

- **Vấn đề**: 3 request đi cùng lúc, response **về lộn xộn** — response cũ về sau cùng sẽ **ghi đè** response mới, UI hiện data cũ.
- **3 cách chặn**: (1) Tự viết (`useEffect` + `AbortController`): query đổi thì abort request cũ, chỉ response mới nhất được ghi state. (2) TanStack Query: queryKey đổi thì nó **tự hủy request cũ**, không cần cleanup tay. (3) Giảm số request bằng debounce/`useDeferredValue` khi search gõ nhanh — nhưng cách này chỉ "gộp", không thay abort khi cần đúng thời điểm.
- **Nguyên tắc một câu**: chỉ response mới nhất được ghi state.

## Trả lời chi tiết

Mục này vẽ lại hiện tượng race bằng sơ đồ thời gian, rồi so 3 cách xử lý để bạn biết chọn cách nào cho từng hoàn cảnh — đọc để trả lời được "vì sao UI hiện sai" chứ không chỉ "biết từ khóa".

### 1. "Race condition (data race)" là gì (mô tả chính xác)

```
time:  t0        t1        t2        t3        t4
       │         │         │         │         │
User:  gõ "a"   gõ "ab"   gõ "abc"  (3 request đi)
API:   ─────► resp-a     resp-ab    resp-abc
                  │          │          │
response về:    (about)   (ab)     (abc)
                  ▼          ▼          ▼
               t1.5       t2.5       t3.5
```

**"Đúng"**: UI hiện `resp-abc` (mới nhất). **"Sai"**: `resp-a` về sau (t1.5) ghi state → **UI hiện "a"** (sai — "data stale"). Ví von: như ba lá thư gửi ra ba đợt nhưng về đến nhà lộn xộn — lá viết sớm nhất lại tới cuối cùng, mà ai cũng tin "lá vừa gõ cửa là lá mới nhất" thì cả nhà đọc tin cũ.

### 2. Cách 1: `AbortController` (tự viết, `useEffect` + `fetch`)

> 📄 **Code ví dụ:** [`examples/01-2-cach-1-abortcontroller-tu-viet-useeffect-fetch.tsx`](examples/01-2-cach-1-abortcontroller-tu-viet-useeffect-fetch.tsx)

**"Điểm ăn điểm"**: `AbortController` = "nêu rõ 'abort request cũ' (không 'để về sau ghi đè') — Q20, Q21". **Bẫy**: "thiếu cleanup (abort) → 'response cũ ghi state' (sai) — 'race'".

### 3. Cách 2: TanStack Query (`stale-while-revalidate` tự động)

> 📄 **Code ví dụ:** [`examples/02-3-cach-2-tanstack-query-stale-while-revalidate.tsx`](examples/02-3-cach-2-tanstack-query-stale-while-revalidate.tsx)

**"Khác tự viết (Q20)"**: TanStack = "quản lý cache + abort (tự động) + dedupe (không fetch trùng)" (Q32 — "cache, invalidate"); tự viết = "fetch + useState (cần 'abort' (Q21), 'dedupe' (thiếu))". **Điểm ăn điểm**: "Query = 'state management cho server data' (Q20, Q32) — không 'nên tự viết useEffect + fetch (nhiều, 'race')".

### 4. Cách 3: `useDeferredValue` (gộp, "hoãn" — không "abort")

> 📄 **Code ví dụ:** [`examples/03-4-cach-3-usedeferredvalue-gop-hoan-khong-abort.tsx`](examples/03-4-cach-3-usedeferredvalue-gop-hoan-khong-abort.tsx)

**"Khi nào hợp lý"**: "fetch nặng, 'gộp request' (search 10k) — không cần 'response về đúng thời điểm' (search, không payment)". **Sai**: "trả kết quả phải 'đúng' (mua hàng, login) — 'deferred' = 'hoãn' (sai, Q29) — cần 'abort' (Q21) hoặc 'Query' (Q20)".

### 5. Bảng "chọn cách nào" (quyết định)

| Trường hợp | Cách | Vì sao |
|---|---|---|
| Fetch **1 lần (đơn giản)** + user "click 1 lần" | "Không cần 'abort' (data không 'lộn xộn')" | "Race không xảy ra (1 request)" |
| **Search / filter (input nhanh, 'response lộn xộn')" | `AbortController` (tự viết) **hoặc** Query (Q20) + `useDeferredValue` (gộp) | "Chỉ 'mới nhất' (Q21) + 'gộp request' (Q29)" |
| **"Dùng TanStack Query (đã có)" (Q20, Q32)** | Query `staleTime` (caching, dedupe) + "queryKey (abort tự động) — không cần 'AbortController (tự viết)" | "Query = 'state server data' (Q20) — 'dedupe (không fetch trùng)' (Q32)" |
| **"Response phải về đúng thời điểm" (payment, login) | **Không debounce/defer** — "abort request cũ (Q21) (nếu 'gõ nhanh')" | "Deferred = 'hoãn' (sai) — 'abort' (đúng)" |

> **Cách đọc bảng này:** mỗi dòng là một hoàn cảnh cụ thể; cột "Cách" là quyết định, cột "Vì sao" là lý lẽ kèm theo — dò đúng dòng khớp với tình huống được hỏi, nhớ nhất là dòng cuối: việc cần độ chính xác tức thì thì hoãn/gộp đều là sai.

> **Tóm gọn 1 câu:** Race condition là "thư cũ về sau lại được tin là tin mới" — chặn bằng cách hủy request cũ khi query đổi (AbortController hoặc Query tự lo), còn `useDeferredValue` chỉ gộp bớt thư chứ không hủy thư.

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 4 câu trả lời nghe hợp lý nhưng sai — đây là chủ đề người phỏng vấn rất thích thử xem bạn phân biệt được "hủy" với "hoãn" không.

1. **"`useEffect` + `fetch` không cần 'abort' (data về 'đúng')"** → **sai** (Q20, Q21) — "query đổi → 'response cũ ghi state' (race, 'UI hiện dữ liệu cũ') — 'abort request cũ (Q21) (bắt buộc, 'sẽ về sau')"
2. **"`useDeferredValue` (Q29) = 'abort request cũ' (thay AbortController)"** → **sai** (deferred = "hoãn việc fetch (gộp)", không "abort response cũ" (Q21) — "khác cơ chế, khác mục đích").
3. **"`stale-while-revalidate` (TanStack Query) = 'fetch trùng (3 lần)'"** → **sai** (Q20, Q32) — "Query 'dedupe' (không fetch trùng) + 'cancel (stale) (Q21)" — "mới nhất wins".
4. **"2 request cùng lúc (không query đổi) = 'race'"** → **sai** ("Race = 'query đổi (response lộn xộn)' — 2 request 'cùng (không đổi) = 'dedupe (Query)' (Q32), không 'abort'").

> **Tóm gọn 1 câu:** Bẫy lớn nhất là tin fetch tự lo thứ tự — mạng không hứa "thư về đúng thứ tự gửi", không hủy request cũ là UI chậm một nhịp vẫn đọc tin cũ.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

> "Bấm 2 nút gọi 2 API, cái sau phủ cái trước = **race (data race)** (Q20, Q21). **3 cách chặn**: (1) **`AbortController`** (tự viết, 'query đổi → abort request cũ, chỉ mới nhất ghi state' (Q21)), (2) **TanStack Query `stale-while-revalidate`** (Q20, Q32: 'queryKey đổi → cancel + dedupe (không fetch trùng)' (auto, 'state server data')), (3) **`useDeferredValue`** (Q29: 'gộp (debounce) request (search 10k)' — 'hoãn, không abort' (sai nếu 'response phải đúng thời điểm'). **Quyết định**: 'input nhanh + fetch nặng' → Query + deferred (gộp); 'response phải đúng' (payment/login) → abort (Q21), không deferred. **Bẫy**: 'thiếu cleanup (abort) (Q20, Q21) → race (UI hiện cũ)'."

## Reference

- [`20-data-fetching`](../20-data-fetching/README.md) — "fetch data, 'AbortController' (Q20), 'abort request cũ' (Q21)"
- [`21-abort-on-navigate`](../21-abort-on-navigate/README.md) — "Abort khi navigate / query đổi ('abort request cũ')"
- [`29-concurrency-transition-deferred`](../29-concurrency-transition-deferred/README.md) — "`useDeferredValue` ('hoãn, gộp' (Q29))"
- [`32-query-mutations`](../32-query-mutations/README.md) — "TanStack Query (dedupe, cache, invalidate) — 'stale-while-revalidate'"
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [TanStack Query — Caching](https://tanstack.com/query/latest/docs/framework/react/overview)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q20 — fetch data, abort (Q20)?](../20-data-fetching/README.md) · [Q21 — abort khi navigate / query đổi?](../21-abort-on-navigate/README.md)
- **Đào sâu (xuyên nhóm)**: [Q29 — deferred / transition (gộp request)?](../29-concurrency-transition-deferred/README.md) · [Q32 — Query cache, dedupe?](../32-query-mutations/README.md)
