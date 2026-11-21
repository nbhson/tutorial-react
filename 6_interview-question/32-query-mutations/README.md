# Q32: Bấm xóa xong, em cho UI cập nhật ngay hay ngồi chờ API trả về?

## Câu hỏi

> Sau khi gọi API (create/update/delete), cache của Query đã cũ — refresh bằng gì?
> `invalidateQueries` vs `setQueryData` khác nhau khi nào, chọn cái nào?
> Làm sao cho UI hiện ngay (optimistic), server đồng ý thì giữ, sai thì rollback —
> viết bằng `onMutate`/`onError`/`onSettled` ra sao? Khác `useOptimistic` (React 19) ở đâu?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản 30 giây" để trả lời gọn trước — nếu người phỏng vấn gật, mới mở phần chi tiết bên dưới ra nói tiếp.

- Ghi xong (thêm/sửa/xóa) thì cache cũ phải làm mới bằng 1 trong 2: `invalidateQueries` (đánh dấu cũ → tải lại, đúng nhất, tốn request) hoặc `setQueryData` (ghi thẳng vào cache, hiện ngay, tự chịu đúng/sai).
- **Optimistic**: chưa cần server trả lời đã hiện trước — trước khi gọi thì hủy query đang chạy + chụp cache cũ + ghi giá trị đoán; lỗi thì rollback về ảnh chụp, xong thì invalidate cho chắc.
- Bẫy hay quên: thiếu `cancelQueries` trong `onMutate` thì request cũ về ghi đè, UI "nhảy ngược". React 19 có `useOptimistic` cho roundtrip Actions, còn quản lý cache vẫn là việc của Query.

## Trả lời chi tiết

Mục này đi từ "làm sao làm mới cache sau ghi" tới "làm sao hiện UI trước cả khi server trả lời" (optimistic) — đọc để xử lý được cả câu hỏi tiếp nối: "vậy nếu server báo lỗi thì sao?".

### 1. Sau mutation, cache cũ — 2 cách cập nhật (chọn đúng = ăn điểm)

| Cách | Cơ chế | Dùng khi |
|---|---|---|
| **`qc.invalidateQueries({ queryKey })`** | Đánh query "stale" → Query **tự refetch** (active thì ngay, inactive khi focus/remount) | **Mặc định an toàn** — bạn không biết chắc data mới (vd delete "item nào trong list?" phải hỏi lại server) |
| **`qc.setQueryData(key, updater)`** | **Ghi thẳng** cache (mirror kết quả mutation vào cache) — **không request** | Bạn **biết chính xác** cache phải trông ra sao (create: append item; delete: filter id) — **instant, đỡ 1 request** |

> **Cách đọc bảng này:** mỗi dòng là một cách làm mới cache; cột Cơ chế nói nó vận hành ra sao, cột Dùng khi là câu trả lời "chọn dòng nào" — quy tắc nhanh: không chắc server trả gì thì đọc dòng 1, chắc chắn (thêm/xóa item trong list) thì đọc dòng 2.

> 📄 **Code ví dụ:** [`examples/01-1-sau-mutation-cache-cu-2-cach-cap.tsx`](examples/01-1-sau-mutation-cache-cu-2-cach-cap.tsx)

> **Vì sao "mirror" (setQueryData) hay hơn refetch (invalidate) với fake-API/demo**: đỡ 1 request, UI "không nháy loading" (list giữ ổn định). **Nhưng**: bạn đang "giả định" về data — server trả khác giả định là **cache lệch** (phải tin API "trả đúng thứ bạn nghĩ" — với API thật (mạng, versioning), **invalidate an toàn hơn**).

Ví von: `invalidateQueries` là bạn dán giấy "bản ghi này cũ" rồi nhờ kế toán (server) in lại bản mới — chậm nhưng chắc đúng; `setQueryData` là bạn tự tay sửa thẳng vào sổ — nhanh lẹ, nhưng sai một chữ là cả sổ lệch theo.

### 2. Optimistic update — `onMutate` / `onError` / `onSettled` (pattern 3 bước, thiếu 1 là bug)

> 📄 **Code ví dụ:** [`examples/02-2-optimistic-update-onmutate-onerror-onsettled-pattern-3.tsx`](examples/02-2-optimistic-update-onmutate-onerror-onsettled-pattern-3.tsx)

**Luồng UX (nói được = ăn điểm)**:
1. User bấm xóa → **UI xóa item ngay** (optimistic, không chờ 300ms mạng) — `onMutate` (1) (2).
2. API **thành công** → `onSettled` invalidate (cache "xác nhận" đúng) — "cảm giác" mượt.
3. API **lỗi** → `onError`: (a) **snapshot trả về** (item "hiện lại" — rollback), (b) **invalidate** (refetch thật, sửa lệch nếu có) — UX: "nó có, nó biến mất, nó hiện lại" (đúng hành vi server).

### 3. 3 hook lifecycle của mutation (nói tên = ăn điểm)

| Hook | Khi nào chạy | Làm gì (pattern) |
|---|---|---|
| **`onMutate`** | **TRƯỚC** khi gọi API (async, có thể cancel) | `cancelQueries` + `getQueryData` (snapshot) + `setQueryData` (phỏng đoán) → trả `context` (snapshot) |
| **`onError`** | API **lỗi** | rollback (context.snapshot) + invalidate |
| **`onSuccess`** | API **thành công** | (thường để trống nếu đã optimistic; hoặc "flash" + invalidate) |
| **`onSettled`** | **DÙ thành công hay lỗi** (sau 2 cái trên) | invalidate (xác nhận/sửa cache cuối) |

> **Cách đọc bảng này:** mỗi dòng là một hook theo đúng thứ tự chạy trong vòng đời mutation (trên xuống); cột giữa nêu thời điểm, cột phải nêu việc phải làm — học thuộc cột giữa là có ngay câu trả lời "3 hook chạy theo pipeline nào".

> **Trật tự đúng** (nói "3 hook chạy theo pipeline này"): `onMutate` (trước) → [gọi API] → `onSuccess`/`onError` (sau) → `onSettled` (cuối, cả 2 nhánh).

### 4. Vì sao `cancelQueries` trong `onMutate` là BẮT BUỘC (bẫy #1, ăn điểm)

Không có = **race**: query cũ (đang refetch khi mutation gọi) **về sau** optimistic → **ghi đè** cache "mới" bằng cache "cũ" → UI **nhảy ngược** (item bạn xóa **hiện lại**). `cancelQueries` **hủy** request cũ (abort), giữ **chỉ** cache "mới" (optimistic) là **chủ** khi request cũ về. Ví von: request cũ như bức thư gửi trước nhưng đến sau — nếu không thu hồi nó, bức thư cũ sẽ đè lên giấy tờ mới nhất trên bàn.

> 📄 **Code ví dụ:** [`examples/03-4-vi-sao-cancelqueries-trong-onmutate-la-bat.tsx`](examples/03-4-vi-sao-cancelqueries-trong-onmutate-la-bat.tsx)

### 5. `useOptimistic` (React 19) — "phiên bản hook" của optimistic (khác Query)

| | TanStack Query (optimistic) | `useOptimistic` (React 19) |
|---|---|---|
| **Mức** | **Cache** (server state, ngoài React) | **Render state** (trong component, React) |
| **Cơ chế** | `onMutate`/`onError`/`onSettled` + `setQueryData` (mirror/rollback cache) | `[optimisticState, addOptimistic]` — **2 lớp** (actual + optimistic, React **tự reconcile** khi action xong/lỗi) |
| **Rollback** | **Thủ công** (context snapshot + invalidate) | **Tự động** (action **throw** → React **bỏ** optimistic, **trả về** actual) |
| **Dùng với** | Server state (API + cache) | **Actions** (`useActionState`, RSC roundtrip) — "kèm" server action (Q2) |
| **Khi nào** | App **SPA** (Query = "chuẩn" Q20) | **Framework** (RSC/Actions) / "không cần cache layer" (state nội bộ) |

> **Cách đọc bảng này:** mỗi dòng là một khía cạnh so sánh (mức hoạt động, cơ chế, cách rollback...); cột giữa là TanStack Query, cột phải là `useOptimistic` — câu trả lời hay nhất nằm ở dòng cuối: đây là 2 công cụ cho 2 bối cảnh, không phải 2 lựa chọn thay nhau.

> 📄 **Code ví dụ:** [`examples/04-5-useoptimistic-react-19-phien-ban-hook-cua.tsx`](examples/04-5-useoptimistic-react-19-phien-ban-hook-cua.tsx)

> **Điểm ăn điểm nhất**: "Query = quản lý **server state + cache** (rollback **thủ công** qua 3 hook); `useOptimistic` = quản lý **render state nội bộ** (rollback **tự động**, React reconcile). **2 thứ khác nhau, không thay nhau** — 'muốn optimistic + cache + refetch đúng' = **Query**; 'muốn UI lạc quan với Actions (RSC)' = `useOptimistic` (Q2)."

> **Tóm gọn 1 câu:** Optimistic update là "khoe kết quả trước rồi mới đợi duyệt" — cancel request cũ, chụp ảnh cache trước khi sửa, lỗi thì lùi về ảnh chụp, xong thì luôn xin server xác nhận lần cuối.

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 5 câu trả lời nghe rất hợp lý nhưng sai — đọc xong bạn sẽ biết chỗ nào người phỏng vấn hay cài bẫy.

1. **Thiếu `cancelQueries` trong `onMutate`** → request cũ (refetch) **về sau** ghi đè optimistic (UI **nhảy ngược** — item xóa "hiện lại"). "3 bước đủ" = cancel + snapshot + (rollback khi lỗi) (Q21 liên hệ "abort request cũ").
2. **Nói "setQueryData = invalidate"** → **sai** (khác trục): `setQueryData` = **ghi thẳng** (instant, **bạn "giả định"** data mới đúng); `invalidate` = **đánh stale → refetch** (server "xác nhận", tốn request). "Chọn" = bạn "biết" cache phải ra sao không (biết → mirror; không biết → invalidate) (§1).
3. **"Optimistic = hiện UI trước khi server xác nhận (thế là đủ)"** → thiếu **rollback** (lỗi) + **invalidate cuối** (xác nhận/sửa) (3 hook: onMutate/onError/onSettled) — "hiện" mà không "lùi" được = bug (user thấy "mâu thuẫn" data).
4. **"Nói `useOptimistic` (19) thay thế được optimistic của Query"** → **sai** (khác "mức" — bảng §5): Query = cache layer (rollback **thủ công**, + refetch); `useOptimistic` = render state (rollback **tự động**, không cache) — "stack" quyết định (Q2/Q20).
5. **Snapshot `undefined` khi lỗi (rollback thành "xóa hết list")** → `onMutate` không có `old` (list chưa từng fetch) thì `getQueryData` trả `undefined` — rollback `setQueryData(key, undefined)` **xóa** cache (UI rỗng). Đúng: giữ snapshot (kể cả `undefined` là "danh sách rỗng hợp lệ") và rollback **an toàn** (`ctx.snapshot ?? []` — hoặc không rollback khi `snapshot === undefined`).

> **Tóm gọn 1 câu:** Bẫy chết người nhất là quên `cancelQueries` — cache bạn vừa "viết trước" sẽ bị bức thư cũ (request refetch) đến sau đè bẹp.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

> "Mutation (`useMutation`) = **ghi** (create/update/delete) — sau khi server OK, cache **đã cũ**: (a) **`invalidateQueries`** (đánh stale → refetch, an toàn, tốn request) hoặc (b) **`setQueryData`** (mirror thẳng cache, instant, 'bạn giả định data mới đúng'). **Optimistic (hiện ngay, không chờ server)**: **`onMutate`** (1) `cancelQueries` (2) `getQueryData` (snapshot) (3) `setQueryData` (phỏng đoán) → trả context; **`onError`** = rollback (snapshot) + invalidate (sửa); **`onSettled`** = invalidate (xác nhận/sửa). **Thiếu `cancelQueries`** = request cũ về **ghi đè** optimistic (UI nhảy ngược) — bẫy #1. **`useOptimistic` (React 19)** = phiên bản **hook render-state** (rollback **tự động** khi Action throw, không cache layer) — khác Query ('cache layer', rollback **thủ công** + refetch) (§5). Chọn: SPA + cache → **Query** (Q20); RSC/Actions, 'UI lạc quan nội bộ' → `useOptimistic` (Q2)."

## Reference

- [`5_react-crud-jsonplaceholder`](../../5_react-crud-jsonplaceholder) — "mutation mirror cache (setQueryData) thay vì refetch", "bài tập: optimistic delete (onMutate filter trước, onError rollback, onSettled invalidate)", bẫy "key chung cho mọi limit"
- [`4_react-new-feature/2_react-19/2_useOptimistic`](../../4_react-new-feature/2_react-19/2_useOptimistic) — `useOptimistic` (2 lớp actual + optimistic, rollback tự động, kết hợp Actions)
- [`3_react-tutorial/12-data-fetching`](../../3_react-tutorial/12-data-fetching) — Query v5 (cache/staleTime/gcTime/retry), server state ≠ client state
- Q20 (fetch data 3 tầng) — Query = "tầng prod" (mutation nằm trong tầng này)
- Q21 (abort khi navigate) — "cancelQueries trong onMutate" cùng họ "hủy request cũ" (chặn race)
## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q20 — query (đọc) khác mutation (ghi) chỗ nào?](../20-data-fetching/README.md) · [Q21 — cancelQueries/hủy request cũ?](../21-abort-on-navigate/README.md)
- **Đào sâu (xuyên nhóm)**: [Q33 — mutation trả về HTML user (rich text) thì sanitize trước khi render?](../33-xss-dangerously/README.md) · [Q35 — typing mutation input (Zod, generic)?](../35-type-safety/README.md)
