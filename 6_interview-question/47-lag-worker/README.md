# Q47: Bấm nút mà UI khựng 200ms vì tính toán nặng, em đẩy ra khỏi main thread kiểu gì?

## Câu hỏi

> Nút bấm chạy hàm tính toán nặng (parse file 10MB, render biểu đồ, filter 100k items) → UI treo 200ms.
> Làm sao push việc nặng ra **Web Worker** (không block main thread (Q30)), kết quả trả về component React? `Worker` + `postMessage` (Q30) là chuẩn? `useWorker` (Q16) hay `useEffect` (Q27) + `Worker`?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — nêu được "main thread block, Worker gánh việc nặng, ranh giới ~50ms" là đã ăn điểm; phần chi tiết bên dưới để đỡ khi bị hỏi từng loại Worker.

- **Vấn đề**: JS nặng chạy trên main thread sẽ block render/paint — UI khựng theo đúng thời gian tính toán.
- **Cách làm**: đẩy tính toán ra Web Worker (`new Worker` + `postMessage`/`onmessage`), kết quả về mới `setState`; trong lúc chờ giữ UI responsive (loading/disabled).
- **Khi nào dùng**: tác vụ trên ~50ms mà không cần DOM (parse file, filter list lớn, mã hóa). Không dùng khi cần chạm DOM (worker không có DOM) hoặc việc nhẹ hơn chi phí gửi message.

## Trả lời chi tiết

Mục này giải thích vì sao JS nặng làm treo UI, rồi so sánh các cách "gánh việc ra ngoài" (Worker, SharedWorker, useWorker) — đọc để biết chọn cỡ nào theo số tab và độ nặng của việc.

### 1. "JS nặng" (Q30) — vì sao (Q30, Q35)

> 📄 **Code ví dụ:** [`examples/01-1-js-nang-q30-vi-sao-q30-q35.js`](examples/01-1-js-nang-q30-vi-sao-q30-q35.js)

**Sai (Q30, Q35)**: **JS nặng trên main thread (Q30)** → **UI treo** (Q30, Q35) (Q30). Ví von: main thread là một đầu bếp vừa nấu vừa phải trả lời điện thoại khách — bắt máy 200ms là cả bếp dừng; Web Worker là thuê một phụ bếp ngồi ở bếp riêng, nấu xong bưng ra — đầu bếp (UI) vẫn phục vụ đều tay.

### 2. Cách 1: Vanilla `Worker` (Q30, Q35)

> 📄 **Code ví dụ:** [`examples/02-2-cach-1-vanilla-worker-q30-q35.js`](examples/02-2-cach-1-vanilla-worker-q30-q35.js)

**Đúng khi**: **1 tab (Q35), JS nặng (Q30)** (Q30, Q35). **Sai khi**: **Nhiều tab (Q35)** — "SharedWorker (Q35)" (Q35).

### 3. Cách 2: `useWorker` (Q16) (Q16, Q27)

> 📄 **Code ví dụ:** [`examples/03-3-cach-2-useworker-q16-q16-q27.tsx`](examples/03-3-cach-2-useworker-q16-q16-q27.tsx)

**Đúng khi**: **Nhiều component (Q16) dùng Worker (Q30)** (Q16, Q30). **Sai khi**: "1 component (Q10, Q30)" — "vanilla (Q30, Q35)" (Q30).

### 4. `Worker` vs `SharedWorker` (Q35) (Q35)

| | `Worker` (Q35) | `SharedWorker` (Q35) |
|---|---|---|
| **Chia sẻ (Q35)** | 1 (Q35) (tab (Q35)) | Nhiều (Q35) (tab (Q35)) (Q35) |
| **Khi nào dùng** | 1 tab (Q35) | Nhiều tab (Q35) (Q35) |
| **API (Q35)** | `postMessage` (Q30, Q35) | `onconnect` + `port.postMessage` (Q35) |
| **Độ phức tạp** | Đơn giản (Q30, Q35) | Phức tạp (Q35) |

> **Cách đọc bảng này:** mỗi dòng là một khía cạnh so sánh hai loại worker; cột giữa là `Worker` thường (một tab), cột phải là `SharedWorker` (dùng chung nhiều tab) — câu quyết định nằm ở dòng đầu: chỉ khi nhiều tab cần chia sẻ cùng một worker mới đáng trả tiền "độ phức tạp".

**Điểm ăn điểm (Q35)**: "1 tab (Q35) → `Worker` (Q35) (Q35); "nhiều tab (Q35) → `SharedWorker` (Q35)" (Q35).

### 5. `Worker` vs `useMemo`/`useCallback` (Q16, Q30) (Q16)

| | `useMemo`/`useCallback` (Q16) | `Worker` (Q30, Q35) |
|---|---|---|
| **Đặt (Q16, Q30)** | JS nhẹ (Q16) (Q16, Q30) | JS nặng (Q30) (Q30) |
| **Main thread** | Yes (Q30) (Q16, Q30) | No (Q30) (Q30, Q35) |
| **UI treo** | Có (Q30) (Q30) | Không (Q30, Q35) (Q30, Q35) |
| **Khi nào** | < 50ms (Q16, Q30) | > 50ms (Q30) |

> **Cách đọc bảng này:** mỗi dòng là một tiêu chí so sánh việc tính ngay trong React với việc gửi đi Worker; cột "Khi nào" (mốc ~50ms) là ranh giới ra quyết định — nhớ nhất: `useMemo` chỉ bớt tính lại nhưng vẫn chặn main thread, Worker mới nhả main thread ra.

**Điểm ăn điểm (Q16, Q30)**: "JS nhẹ (< 50ms) → `useMemo` (Q16) (Q16, Q30); "JS nặng (> 50ms) → `Worker` (Q30, Q35) (Q30, Q35)".

> **Tóm gọn 1 câu:** Việc nặng hơn ~50ms thì gửi cho "phụ bếp" Worker ở bếp riêng — main thread chỉ nhận kết quả về setState, còn Worker không chạm DOM được nên việc nào cần DOM thì phải ở lại nhà chính.

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 4 câu trả lời nghe hợp lý nhưng sai — đây là chỗ dễ nhầm "memo hóa" với "đưa việc ra ngoài".

1. **"JS nặng (Q30) trên main thread (Q30)"** → **Sai (Q30, Q35)**: "UI treo (Q30, Q35)" (Q30, Q35) — Worker (Q30, Q35) đúng (Q30, Q35).
2. **"`useMemo` (Q16) cho JS nặng (Q30)"** → **Sai (Q16, Q30)**: "`useMemo` (Q16) không (Q30) (Q16, Q30)" — Worker (Q30, Q35) đúng (Q30, Q35).
3. **"Không (Q30, Q35) Worker"** → **Sai (Q30, Q35)**: "`Worker` (Q30, Q35) = JS (Q30) (Q30, Q35)" (Q30, Q35).
4. **"Nhiều tab (Q35) dùng `Worker` (Q35)"** → **Sai (Q35)**: "`Worker` (Q35) = 1 tab (Q35)" (Q35) — "`SharedWorker` (Q35) = nhiều tab (Q35)" (Q35).

> **Tóm gọn 1 câu:** Bẫy lớn nhất là coi `useMemo` là thuốc chữa treo — nó chỉ cache kết quả chứ không nhả main thread; muốn main thread thở được thì phải gửi việc nặng sang Worker.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

> "Nút lag (Q30): "JS nặng (Q30) trên main thread (Q30)" (Q30, Q35). **2 cách (Q30, Q35)**: (1) **Vanilla `Worker` (Q30, Q35)** (Q35): `new Worker` + `postMessage` (Q30, Q35) + `onmessage` (Q10) (Q30, Q35) (Q30, Q35). (2) **`useWorker` (Q16)** (Q16, Q27): "hook (Q16, Q27) (Q16) quản lý (Q30, Q35)" (Q16, Q30). **JS nhẹ (< 50ms) → `useMemo` (Q16)** (Q16, Q30); **JS nặng (> 50ms) → `Worker` (Q30, Q35)** (Q30, Q35). **1 tab → `Worker` (Q35), nhiều tab → `SharedWorker` (Q35)** (Q35).

## Reference

- [`16-memo`](../16-memo/README.md) — "useMemo (Q16), JS nhẹ (Q16, Q30)"
- [`30-rerender-pipeline`](../30-rerender-pipeline/README.md) — "Main thread (Q30), re-render (Q30)"
- [`27-which-effect-when`](../27-which-effect-when/README.md) — "useEffect (Q27), deps (Q27)"
- [`35-type-safety`](../35-type-safety/README.md) — "Worker (Q35), type (Q35)"
- [`29-concurrency-transition-deferred`](../29-concurrency-transition-deferred/README.md) — "Transition (Q29), defer (Q29)"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q16 — Memo (useMemo (Q16), JS nhẹ (Q16, Q30)?](../16-memo/README.md) · [Q30 — Re-render pipeline (main thread (Q30), re-render (Q30)?](../30-rerender-pipeline/README.md)
- **Đào sâu (xuyên nhóm)**: [Q27 — useEffect (Q27), deps (Q27)?](../27-which-effect-when/README.md) · [Q35 — Type safety (Worker (Q35), type (Q35)?](../35-type-safety/README.md) · [Q29 — Concurrency (Transition (Q29), defer (Q29)?](../29-concurrency-transition-deferred/README.md)
