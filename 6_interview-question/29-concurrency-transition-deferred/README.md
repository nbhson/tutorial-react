# Q29: Ô search gõ chữ nào là list 10.000 dòng giật theo, em làm sao cho gõ vẫn mượt?

## Câu hỏi

> Ô search lọc 10.000 item, mỗi phím gõ list giật — concurrent rendering đã có rồi mà vẫn nặng.
> Cách nào để nói với React: "gõ phím là ưu tiên gấp, còn việc lọc list thì xếp sau"?
> `startTransition`, `useTransition`, `useDeferredValue` khác nhau ở đâu, mỗi cái dùng ở đâu, vì sao không dùng 1 cái cho hết?

## Trả lời ngắn (elevator pitch, 30 giây)
- React 18 chia update thành 2 làn: **gấp** (gõ phím, click — phản hồi ngay) và **hoãn được** (lọc list, kết quả tìm).
- Đang gọi `setState` thì bọc bằng `startTransition`/`useTransition` (kèm `isPending` để hiện "đang lọc..."). Giá trị từ nơi khác đưa tới mà muốn vẽ trễ thì dùng `useDeferredValue`.
- Bản chất: update hoãn được sẽ bị **bỏ dở** nếu user gõ tiếp — gõ 5 chữ chỉ vẽ kết quả chữ cuối, không dồn 5 lần vẽ.

## Trả lời chi tiết

### 1. Bài toán gốc: keystroke vs list (urgent vs non-urgent)

> 📄 **Code ví dụ:** [`examples/01-1-bai-toan-goc-keystroke-vs-list-urgent.tsx`](examples/01-1-bai-toan-goc-keystroke-vs-list-urgent.tsx)

Mỗi phím gõ: `setQ` (urgent, phải nhanh) **+** lọc 10k + render list (nặng, non-urgent) — **gộp trong 1 render** = input giật. Cần tách: input **urgent**, list **non-urgent**.

### 2. Cách 1: `useTransition` (bọc phía "sản xuất" — nơi bạn gọi `setState`)

> 📄 **Code ví dụ:** [`examples/02-2-cach-1-usetransition-boc-phia-san-xuat.tsx`](examples/02-2-cach-1-usetransition-boc-phia-san-xuat.tsx)

- `startTransition` = nói với React "update này **được hoãn**": urgent (gõ chữ sau) tới trước, transition **bỏ dở + làm lại từ giá trị mới nhất** (gõ 5 chữ = chỉ render bản "abcde", không stack 5).
- `isPending` = `true` khi transition đang chạy → hiện indicator (mờ list / "đang lọc") **mà không chặn input**.

> **2 state (q gốc + query chạy) trông "thừa"?** Không — q là **nguồn** (input đọc, urgent), query là **bản deferred** (list đọc). Đây chính là "phía sản xuất" (bạn chủ động `setQuery`).

### 3. Cách 2: `useDeferredValue` (bọc phía "tiêu thụ" — bạn không kiểm soát việc gọi)

> 📄 **Code ví dụ:** [`examples/03-3-cach-2-usedeferredvalue-boc-phia-tieu-thu.tsx`](examples/03-3-cach-2-usedeferredvalue-boc-phia-tieu-thu.tsx)

- **1 state** (gọn hơn `useTransition`), `dq` tự "trễ" theo `q`. Chọn khi **giá trị đến từ prop/state của component khác** mà bạn chỉ muốn **trễ nó khi render con** (không muốn sửa mọi chỗ gọi `setState`).

### 4. So sánh 3 thứ (bảng 1 trang, ăn điểm)

| | `startTransition(fn)` | `useTransition()` | `useDeferredValue(v)` |
|---|---|---|---|
| **Vị trí** | Phía **sản xuất** (bọc `setState`) | Phía **sản xuất** (hook, kèm `isPending`) | Phía **tiêu thụ** (bọc giá trị render con) |
| **Kiểm soát** | Bạn chủ động gọi update | Bạn chủ động gọi update | Giá trị "đến từ ngoài" (prop/state khác) |
| **Kèm indicator** | Không (chỉ hoãn) | **Có** `isPending` | Không (so `q !== dq` tự làm) |
| **Kể từ** | 18 | 18 | 18 |
| **Bỏ dở khi urgent tới** | **Có** (làm lại từ giá trị mới nhất) | **Có** | **Có** (giữ render cũ tới khi bản mới xong) |

> **Cách đọc bảng này:** ba cột sau hàng tiêu đề là ba API — so từng dòng ngang để thấy chúng chỉ khác nhau ở **vị trí bọc** (sản xuất vs tiêu thụ) và **có sẵn `isPending` hay không**; hai dòng cuối là dòng quyết định khi chọn.

**Chọn (quy tắc 1 câu)**: đang **cùng component, bạn gọi `setState`** → `useTransition` (được `isPending`); giá trị **từ prop/component khác, chỉ render con** → `useDeferredValue`.

### 5. Kết hợp Suspense (transition = "giữ UI cũ, không nháy fallback")

Khi đổi route/widget có `<Suspense>` + data chậm, `startTransition` quanh điều hướng → React **giữ UI cũ** (không hiện fallback trắng khi điều hướng còn gần xong) thay vì nháy loading mỗi link. (Liên hệ Q13 lazy/Suspense + Q24 guard: guard ở **loader** chạy **trước render**, transition giữ UX **trong** render — 2 tầng khác nhau, không thay nhau.)

### 6. Vì sao deferred không "giải quyết hết" — giới hạn (điểm ăn điểm sâu)

- **Giữ render cũ** (không giảm node): list 50k item → deferred chỉ **hoãn thời điểm** render nặng; node DOM **vẫn 50k**. List khổng lồ cần **virtualization** (Q30) + deferred **cùng lúc** (một cái "hoãn khi nào", một cái "vẽ bao nhiêu node").
- **`useDeferredValue` trả "trễ 1 nhịp"**: render giữa chừng có thể thấy `q` đã đổi mà `dq` chưa (hình "giữa chừng" = `q !== dq`). Muốn "chỉ render khi ổn định" → debounce thêm (không phải deferred).
- **Compiler (2026)**: auto-memo giúp "viết tự nhiên" (Q16) — nhưng **urgent vs non-urgent là quyết định UI (product)**, không phải việc compiler tự lo — transition vẫn viết tay (giữ input nhạy + list nặng).

> **Tóm gọn 1 câu:** `useTransition`/`useDeferredValue` xếp việc lọc list vào "hàng chờ thư giãn" cho phím gõ đi trước — gõ liên tục thì việc cũ bị bỏ dở lấy việc mới, nhưng DOM vẫn nặng đúng mức: list khổng lồ vẫn phải virtualize.

## Bẫy khi phỏng vấn

1. **"`useDeferredValue` và `useTransition` là 1 thứ"** → **sai**: khác **vị trí** (sản xuất vs tiêu thụ) + `useTransition` có `isPending`. "Kết quả gần tương đương" ≠ "đồng nhất" — đặt **sai phía** thì phải sửa nhiều chỗ gọi.
2. **Lý do "giật" khi 1 state cho cả input + list** → không tách urgent/non-urgent (gộp 1 render). Fix: 2 giá trị (q gốc + deferred/transition), input đọc gốc, list đọc bản trễ.
3. **Tưởng deferred làm list "nhanh hơn" (giảm node)** → deferred chỉ **hoãn thời điểm**, DOM vẫn to. List khổng lồ: **virtualize** (Q30) + deferred. "Không giảm node = chưa giải quyết" là câu ăn điểm.
4. **Nói transition "chặn" urgent (đợi non-urgent xong)** → ngược: urgent **luôn chạy trước**, non-urgent **bị hoãn/bỏ dở** (gõ liên tục → chỉ render bản cuối). `isPending` là cờ "đang hoãn", không phải "đang chờ".
5. **`useDeferredValue` mà muốn "chỉ hiện khi ổn định" (không thấy frame giữa)** → deferred vẫn render bản giữa (q !== dq). Cần **debounce** (không phải deferred) — phân biệt rõ "hoãn" vs "chờ ổn định".

## Gợi ý câu chốt

> "Concurrent (18+) chia update thành **urgent** (gõ, click — nhanh) và **non-urgent** (lọc list, đổi tab — được hoãn). `startTransition`/`useTransition` bọc **phía sản xuất** (bọc `setState`, 'update này được hoãn', `useTransition` kèm `isPending`); `useDeferredValue` bọc **phía tiêu thụ** (trả 'bản trễ' của giá trị render con). Chọn: cùng component + bạn `setState` → `useTransition`; giá trị từ prop/state khác → `useDeferredValue`. Transition bị **hoãn + bỏ dở** khi urgent tới (gõ 5 chữ chỉ render bản cuối). Giới hạn: deferred **hoãn thời điểm, không giảm node** — list khổng lồ cần **virtualization** (Q30) cùng lúc. React 18 trước đây phải tự debounce — giờ có API thật (concurrent)."

## Reference

- [`4_react-new-feature/1_react-18/3_transitions-suspense`](../../4_react-new-feature/1_react-18/3_transitions-suspense) — `startTransition`/`useTransition`/`useDeferredValue` (urgent vs non-urgent, 'giữ UI cũ'), `Suspense` streaming SSR
- [`2_react-techniques/3_performance-optimization/4-deferred-transition`](../../2_react-techniques/3_performance-optimization/4-deferred-transition) — deferred + transition trong app (pattern input nhạy + list nặng)
- [`2_react-techniques/8_best-practices/4_performance-guide`](../../2_react-techniques/8_best-practices/4_performance-guide) — "`useDeferredValue`/`useTransition` — input nhạy, nặng hoãn; không thay virtualization"
- Q30 (virtualization) — deferred **hoãn** vs virtualization **giảm node** (cần cả hai)
- Q13 (lazy/Suspense) — transition "giữ UI cũ" khi điều hướng (không nháy fallback)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q30 — pipeline render (transition tách "gấp" khỏi "từ từ")?](../30-rerender-pipeline/README.md) · [Q31 — list 50.000 item (virtualize, không chờ render hết)?](../31-virtualization/README.md)
- **Đào sâu (xuyên nhóm)**: [Q16 — memo chặn re-render thừa (kết hợp transition)?](../16-memo/README.md) · [Q29↔Q2 — concurrency là nền React 18/19 (Q2)](../02-react-18-vs-19/README.md)
