# Q30: Từ lúc gọi `setState` tới lúc mắt thấy UI đổi, React đã làm những bước gì?

## Câu hỏi

> Nói chính xác việc UI render lại khi data đổi — từ lúc gọi `setX` cho đến khi trình duyệt paint.
> Có mấy pha, mỗi pha làm gì? Và khi component cha render, con có nhất thiết render theo không (chưa kể `memo`)? Con nào render, con nào không?

## Trả lời ngắn (elevator pitch, 30 giây)
- 4 bước từ `setState` tới mắt thấy: (1) **lên lịch** — không vẽ ngay, gộp nhiều set thành một; (2) **tính lại giao diện** bằng object JS (chưa chạm trình duyệt); (3) **so cũ/mới** tìm chỗ khác; (4) **sửa đúng chỗ đó** trên DOM thật rồi mới hiện.
- Mặc định cha vẽ thì **mọi con vẽ theo** (dù props y hệt) — đó là lý do có `memo` để chặn.
- Con đứng yên khi: cha không vẽ, hoặc con bọc `memo` mà props không đổi. Nhớ phân biệt: "vẽ lại" (tính toán) khác "đổi DOM" (mắt thấy).

## Trả lời chi tiết

### 1. 4 pha pipeline (từng pha + vì sao)

```
[1] SCHEDULE — setState
    - đánh dấu component (và các cha cần) là "dirty"
    - KHÔNG render ngay: React LÊN LỊCH (scheduler)
    - BATCH: N setState cùng 1 tick/event (click, Promise, timeout) gộp → 1 lần render (Q26)

[2] RENDER — "tính JSX" (pure)
    - React chạy lại component function (cha → con "cascading")
    - tạo cây element MỚI (virtual tree) — CPU, chưa DOM
    - phải PURE (đọc được 2 lần dev/StrictMode, Q3/Q27)

[3] RECONCILE (DIFF) — so cây CŨ vs cây MỚI
    - so theo "type + key" (Q8): "giống → dùng lại, khác → tạo mới"
    - loại "chênh lệch" (diff) → danh sách "hành động DOM" (update/insert/delete)
    - memo (Q16): "cha render, con props không đổi → bỏ qua con" (giảm "việc render con")

[4] COMMIT — "chạm DOM thật"
    - thêm/xóa/sửa node DOM (trình duyệt layout)
    - chạy "useLayoutEffect" TRƯỚC paint (Q27: "đo-đặt DOM, không nháy")
    - trình duyệt "PAINT" (người thấy)
    - chạy "useEffect" SAU paint (fetch/subscription, không chặn vẽ)
```

**Vì sao tách pha (nói được = ăn điểm)**: render (tính JSX) **nặng + pure** (React có thể **bỏ dở/hoãn** — concurrent, Q29); commit (chạm DOM) **có thứ tự + không đảo ngược** (tính đúng DOM). Tách "tính" khỏi "chạm" = **interruptible** (urgent cắt non-urgent được).

### 2. "Cha render → con render theo" — chính xác (chưa kể `memo`)

Khi cha **nhập pha 2 (render)**, React **gọi lại function con** (mỗi con là "element mới") — vì **cây element được tạo lại từ trên xuống** (cha tạo con mới, dù props "giống").

> **Mấu chốt**: "render lại con" ≠ "chạm DOM con". Con **chạy function render** (có thể "đắt" nếu render con nặng), rồi **reconcile** so con cũ/mới — **props/DOM không đổi** thì **không chạm DOM con** (DOM con giữ nguyên). Vì vậy con **có render (CPU) nhưng không nhất thiết "đổi UI" (DOM)**.

**Con NÀO được render (CPU) / NÀO không đổi DOM (chưa kể memo)**:

| Component | Render (CPU, chạy function)? | Đổi DOM (paint)? |
|---|---|---|
| Component **đang đổi state** (gọi `setState`) | **Có** (rất) | **Có** (nếu DOM khác) |
| **Con của component đang render** (cha render) | **Có** (cha render → con "cascading" render) | **Chỉ khi reconcile** "dù khác" (props/DOM đổi) |
| Component **không đổi state + cha không render** | **Không** (đứng yên) | **Không** |

→ **Giới hạn render = "component đổi state + mọi con của nó" (cha → cascade)**. Ngoài "vùng cascade" → **không render** (state "độc lập", Q8/`key` + Context Q14 chọn "vùng").

### 3. Vì sao `memo` (Q16) tồn tại — cắt "cascade render" (chưa kể DOM)

Cha render → con **chạy function** (CPU) **dù props không đổi**. `memo` = "chặn con chạy function khi props `Object.is` giống" (Q16: "đo trước, memo sau"). Không memo: **"con render (CPU) nhưng DOM không đổi"** (thừa render — Profiler "chỉ đỏ" ở đây).

> **Cụm từ ăn điểm**: "render = tính JSX (CPU, pha 2)"; "commit = chạm DOM (pha 4, paint)"; **"cha render kéo con render theo (cascade, mặc định) — `memo` chặn 'CPU con' khi props không đổi; DOM con vẫn giữ nguyên (reconcile 'dù khác')"** — 3 câu này trả lời "con nào render, con nào đổi UI" (phân biệt **CPU** vs **DOM** = lõi câu).

### 4. Angular so sánh (điểm ăn điểm)

| Angular (Change Detection) | React (Reconcile + Cascade) | Ghi chú |
|---|---|---|
| **Zone.js** "ngửi" (sniff) mọi async (click, timer, Promise) → "chạy 1 lần" **Change Detection** (trên tree component, "so" `ngIf`/binding) | React **báo cáo** (`setState`) → scheduler → **render + reconcile** (so type+key) | Angular "khiến" CDK chạy (Zone); React "biết" bạn đổi gì (explicit) — **nhanh hơn** nhưng **phải khai báo đúng** (Q1/Q5 "ngửi vs báo") |
| CDK "lên từ root, xuống từng component" (mỗi lần = "so" binding) | "Cha render kéo con render theo (cascade)" (mặc định) | "Giống" ("root xuống"), khác "khi nào chạy" (Zone vs `setState` + concurrent) |
| `OnPush` (chỉ check khi `@Input` ref đổi) | **`memo`** (Q16, chặn cascade khi props không đổi) | "Cùng ý": "con không đổi props → bỏ qua" (Angular `OnPush` là **class + `@Input`**; React `memo` là **function wrap**) |

> **Nói đúng câu chốt**: "React **báo cáo** (explicit, `setState`) + **concurrent** (bỏ dở/hoãn); Angular **ngửi** (Zone.js, mọi async). Pipeline React: **schedule → render (tính JSX, pure, interruptible) → reconcile (so type+key) → commit (chạm DOM + `useLayoutEffect`) → paint → `useEffect`**. **Cha render kéo con render (cascade, CPU) — `memo` chặn 'CPU con', DOM con giữ nguyên.**"

## Bẫy khi phỏng vấn

1. **"Nói 'giữa React là DOM thật, không virtual DOM' (hoặc ngược: 'virtual DOM nhanh hơn DOM thật')"** → (a) React **có** virtual DOM (cây element, pha 2/3), so bằng reconcile (Q5 "vì sao cần", "nhanh hơn DOM?" — thường **không**, mục tiêu là **giới hạn DOM mutations**). (b) "UI cập nhật" thật = **pha 4 (commit, paint)** — không phải lúc `setState` (pha 1 chỉ **schedule**).
2. **"Nói 'con component không render nếu props không đổi' (thiếu điều kiện 'memo')"** → **sai**: **mặc định** cha render → con **render (CPU)** dù props không đổi (cascade). **Không** "render theo" chỉ khi **`memo`** (Q16) chặn. "Đâu cần 'cụ thể'" là điểm ăn điểm.
3. **"Nói 'render = DOM đổi'"** → sai: render = **tính JSX (CPU)**; DOM đổi = **reconcile quyết + commit** (có thể "render mà DOM không đổi" — "chưa kể memo" (Q16)).
4. **Nhiều `setState` "mỗi cái = 1 render"** → **sai** (React 18+ **batch**, Q26: N set cùng tick = 1 render). "React 17 (chỉ batch trong React event)" = trường hợp cũ (không phải 2026).
5. **"Đổi state ở con = cả app render"** → **sai**: state "ở đâu" (colocation, Q9 "lifting state up") quyết định "vùng cascade" (state ở root = cả cây; state ở List = chỉ List) — "state gần nơi dùng" (bài performance guide).

## Gợi ý câu chốt

> "Pipeline: **setState → (1) Schedule (dirty + batch, không render ngay) → (2) Render (tính JSX, pure, từ dirty xuống, 'con cascade') → (3) Reconcile (so type+key, Q8, 'chênh lệch' thành 'hành động DOM') → (4) Commit (chạm DOM + `useLayoutEffect`) → Paint → `useEffect` (sau paint)**. **Cha render → mọi con 'cascading' render (chạy function con, CPU) dù props không đổi — đây là 'giới hạn mặc định'; `memo` (Q16) chặn 'CPU con' khi props `Object.is` giống, DOM con giữ nguyên (reconcile 'dù khác').** 'Render = tính JSX (CPU, pha 2)' ≠ 'commit = chạm DOM (pha 4, paint)' — UI thật cập nhật ở **commit**, không phải `setState`. 2026: batch (18), concurrent (giản interruptible), Compiler (tự memo, 'viết tự nhiên')."

## Reference

- [`3_react-tutorial/0-react-explore`](../../3_react-tutorial/0-react-explore) — "React = render UI theo state (state → UI)", "render + commit (pure tính) rồi mới chạm DOM", concurrent
- [`3_react-tutorial/1-jsx-data-display`](../../3_react-tutorial/1-jsx-data-display) — controlled input (gõ → `onChange` → `setState` → re-render → DOM cập nhật), "batch" ("gõ nhanh 5 phím không phải 5 lần vẽ full cây")
- [`2_react-techniques/8_best-practices/4_performance-guide`](../../2_react-techniques/8_best-practices/4_performance-guide) — "Render & Commit (pure tính rồi chạm DOM)", "state gần nơi dùng (phạm vi render)", Profiler "render count/duration"
- Q5 (Virtual DOM) — "vì sao cần" (giới hạn DOM mutations) + "nhanh hơn DOM thật?" (bẫy)
- Q16 (`memo`) — chặn "CPU con" khi props không đổi (giải thích "cha render, con render theo (mặc định)" + "con nào không đổi DOM")
- Q26 (batching + stale) — "N `setState` = 1 render (batch, 18+)"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q8 — key ảnh hưởng pha reconcile (diff) ra sao?](../08-key-index/README.md) · [Q16 — memo chặn render con (pha nào)?](../16-memo/README.md)
- **Đào sâu (xuyên nhóm)**: [Q25 — "state theo thứ tự hook" (cơ chế render)?](../25-rules-of-hooks/README.md) · [Q26 — 2 setState render 1 hay 2 lần (batching)?](../26-batching-stale-closure/README.md) · [Q27 — effect chạy ở pha nào (commit)?](../27-which-effect-when/README.md) · [Q34 — ref callback (gắn lúc commit, không phải render)](../34-ref-callback-n-items/README.md)
