# Q16: Muốn chặn UI render không cần thiết ở một số component thì làm sao?

## Câu hỏi

> Trong app, có những component re-render nhiều lần mà props không đổi — muốn chặn render không cần thiết đó thì làm sao?
> Bao giờ bọc memo là vô dụng, thậm chí tốn hơn?
> Với React Compiler thì còn cần viết memo tay không?

## Trả lời ngắn (elevator pitch, 30 giây)

- **`memo(Component)` = "lính gác" chặn re-render của component khi props KHÔNG đổi** (so nông `Object.is` từng field). Cha render → mặc định mọi con render theo (cascade); `memo` giúp con **bỏ qua render** nếu props giống y hệt.
- **Khác `useMemo`**: `memo` chặn **render của component**; `useMemo` cache **kết quả tính** bên trong component (2 thứ khác nhau, hay bị nhầm).
- **Khi nào bọc**: (1) **item trong list lớn**, (2) **component render nặng** (biểu đồ, form sâu), (3) **Profiler "chỉ đỏ"** (bằng chứng render nhiều). **KHÔNG bọc**: component nhỏ giản đơn (so props còn tốn hơn vẽ lại), hoặc component nhận **props object/function mới mỗi lần render** (→ `memo` luôn miss, vô dụng).
- **Với React Compiler 1.0 (chuẩn 2026)**: Compiler **tự memo** — nên "viết tự nhiên", không "bọc tràn lan". Chỉ thêm `memo` tay khi (a) **đo được issue**, (b) cần **tham chiếu ổn định cho effect deps**, (c) **vùng Compiler chưa phủ** (thư viện bên thứ ba).

## Trả lời chi tiết

### 1. `memo` hoạt động ra sao

```tsx
function Row({ text }: { text: string }) {
  console.log("Row render:", text); // bằng chứng: chỉ in khi THẬT SỰ render
  return <li>{text}</li>;
}
const MemoRow = memo(Row); // bọc ngoài (không đổi code Row)
```

Cơ chế:
1. Cha render → React **dự định** render mọi con (cascade, "đúng" với hành vi mặc định).
2. Trước khi render con, **`memo` so props cũ vs props mới bằng `Object.is` (từng field, nông — shallow)**.
3. **Giống hệt** → **bỏ qua** (con giữ kết quả render cũ + state, DOM không đổi) — con **KHÔNG** render.
4. **Khác** (ít nhất 1 field) → render bình thường.

> "So nông" = mỗi field so `Object.is` (so **tham chiếu**, không "vào trong object"). Vì vậy **props object/array mới tạo mỗi render luôn "khác"** → **`memo` miss** (vô dụng) — xem bẫy §3.

### 2. `memo` (component) vs `useMemo` (giá trị) — khác nhau ở đâu (nói được = ăn điểm)

| | `memo(Component)` | `useMemo(fn, deps)` |
|---|---|---|
| Đối tượng | **Cả component** (chặn "nó render") | **Kết quả tính** (cache 1 giá trị bên trong) |
| So sánh | props cũ vs mới (`Object.is` từng field) | deps cũ vs mới (`Object.is`) |
| Kết quả | Con **không render** (giữ kết quả cũ) | **Giá trị không tính lại** (dùng cache) |
| Phạm vi | Bọc **bên ngoài** component | **Bên trong** render (hook) |

**Mối liên hệ**: `useMemo` *có thể* giúp `memo` (tạo props object **ổn định** để so ra "giống"), nhưng **không bắt buộc** — `memo` và `useMemo` là 2 công cụ độc lập.

### 3. Khi nào NÊN / KHÔNG NÊN bọc

**3 tín hiệu NÊN (đúng) bọc `memo`:**

| Tín hiệu | Ví dụ | Lý do |
|---|---|---|
| **Item trong list lớn** (100–1000+ item, cha render) | `Row`, `Card` trong `<List/>` | Cha (List) render khi filter/scroll → nhiều Row "render thừa" (props không đổi) |
| **Component render NẶNG** (biểu đồ, form phức tạp, subtree sâu) | `<Chart/>`, `<RichEditor/>` | Vẽ lại đắt; giữ render cũ tiết kiệm nhiều |
| **Profiler chỉ đỏ** (React DevTools show "nó render N lần trong khi input không đổi") | Bất kỳ component **được đo** | "Memo **sau** khi đo" (tránh "bọc bừa — sai còn tốn hơn") |

**4 trường hợp KHÔNG BAO GIỜ bọc (nói câu này = ăn điểm):**

| Trường hợp | Vì sao |
|---|---|
| Component **nhỏ, props nguyên thủy ít** (button, icon) | So 3–4 field "còn tốn hơn" vẽ lại nó — **`memo` "thâm hụt" (tốn > lợi)** |
| Props **object/array mới tạo mỗi lần render cha** (`style={{...}}`, `items={filteredList}`) | `Object.is` so **tham chiếu** → khác mỗi lần → **`memo` miss** (vô dụng, thêm chi phí so) |
| Nhận **callback/function mới mỗi lần** (`onClick={() => ...}` inline) | Function tham chiếu mới → khác → miss. (Compiler giúp — xem §4) |
| Nhận **`children` mới mỗi lần** (`<MemoCard><p>Hi {name}</p></MemoCard>` — children là element mới) | Mỗi lần cha render = children mới (JSX "đánh giá lại") → so khác → miss |

### 4. Với React Compiler 1.0 (2026) — điểm ăn điểm nhất (nếu bị hỏi về Compiler)

Compiler **tự động memoize** (component + hook + object) **ở build-time** — thay "bọc memo tay tràn lan". Quy tắc **2026**:

```tsx
// Trước (không Compiler — "tay"):
const Row = memo(({ text }) => <li>{text}</li>);
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
const stable = useCallback((x) => setX(x), []);

// Sau (Compiler 1.0 bật — "viết tự nhiên"):
function Row({ text }: { text: string }) { return <li>{text}</li>; }
const total = rows.reduce((a, b) => a + b, 0); // "tính lại chỉ khi rows đổi" (Compiler lo)
const stable = (x) => setX(x); // "Compiler giữ tham chiếu ổn định" (giúp effect deps)
```

**3 điều kiện khi "vẫn cần" `memo` thủ công** (dù có Compiler):

1. **Đo được issue** (Profiler "chỉ" "nó render N lần" "mà input không đổi").
2. **Cần tham chiếu ổn định cho `useEffect` deps** (function prop "từ cha" "mới mỗi render" khiến effect chạy thừa) — Compiler "cũng giúp", nhưng "viết" "thủ công" "an toàn" hơn.
3. **Vùng Compiler chưa bao phủ** (thư viện bên thứ ba không biên qua Compiler — ví dụ UI kit "nặng", hoặc dùng "bundler không cấu hình Compiler").

> **Nói "ăn điểm" với interviewer**: "Compiler 1.0 'đặt' 'mặc định' cho app mới — nên quy tắc 2026 là **viết tự nhiên trước**; chỉ 'thêm' `memo`/`useMemo` **sau khi đo** (Profiler 'chỉ đỏ'), hoặc khi cần **tham chiếu ổn định**. 'Bọc tràn lan' (chưa đo) = chi phí so **hơn** lợi ích."

### 5. 5 bẫy khi phỏng vấn

1. **"Nói `useMemo` và `memo` 'cùng một thứ'"** → **sai**: `memo` "chặn" "component render"; `useMemo` "cache" "kết quả tính" (bên trong component) — "khác" "hết".
2. **"Bọc 'mọi' component bằng memo"** (khuôn) → **sai** (tham khảo "quy tắc" "đo trước, memo sau" §3; "so" "props 1000 component nhỏ" "còn tốn hơn" "vẽ lại").
3. **"Memo component nhận object/array mới tạo mỗi render"** → **vô dụng** ("so tham chiếu → khác" "mỗi lần"). Fix: "tạo object 'ổn định' 'trước" (truyền value nguyên thủy, hoặc `useMemo` props).
4. **"Nhầm `useMemo` là 'chạy 1 lần'"** → **sai**: `useMemo(fn, [a,b])` "chạy lại" "khi" "a/b đổi" (đúng: "tính lại" "khi cần"); "muốn 1 lần" → `[]`, nhưng "dùng" "biến" "đổi theo thời gian" = **stale**.
5. **"Nói `memo` thay thế list virtualization"** (10000 item) → **sai**: `memo` "giữ render cũ", "nhưng DOM vẫn 10000 node" — cần **virtualization** (`react-window`, `@tanstack/virtual` — chỉ render phần visible) "khi" "list" "khổng lồ".

## Gợi ý câu chốt

> "`memo(Component)` là 'lính gác' chặn re-render của component khi props không đổi (so nông `Object.is` từng field); khác `useMemo` (cache KẾT QUẢ TÍNH bên trong, không chặn render cả component). **Quy tắc: đo trước, memo sau** (Profiler 'chỉ đỏ' → memo), chỉ bọc **item list lớn** hoặc **component render nặng** — không bọc **component nhỏ** (so tốn hơn vẽ) và **không bọc** component **nhận object/function mới mỗi lần render** (luôn miss). Với React Compiler 1.0 (chuẩn 2026, bật mặc định cho app mới) → **viết tự nhiên**, chỉ thêm `memo`/`useMemo` **sau khi đo** hoặc khi cần **tham chiếu ổn định cho effect deps**."

## Reference

- [`3_react-tutorial/10-memo-format`](../../3_react-tutorial/10-memo-format) — `memo` "chặn re-render khi props không đổi", `useMemo` "cache tính", Compiler "tự lo", 7 bẫy (deps mới mỗi render, lạm dụng, Intl mới, mutate stale, `memo` + `children` mới), "quy tắc đo trước"
- [`4_react-new-feature/5_react-compiler`](../../4_react-new-feature/5_react-compiler) — Compiler 1.0: auto-memo (thay "bọc" "thủ công")
- [`3_react-tutorial/0-react-explore`](../../3_react-tutorial/0-react-explore) — React "chỉ lo view" + concurrent rendering (cơ chế render)
- Q5 (Virtual DOM) — reconciliation so cây cũ/mới (`memo` so props là "bước trước render")
- Q3 (StrictMode) — double-invoke render (`memo` "giữ state giữa 2 lần" (cùng object))

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q14 — Context value đổi thì ai render?](../14-context-rerender/README.md) · [Q30 — vì sao cha render thì con render (cascade)?](../30-rerender-pipeline/README.md)
- **Đào sâu (xuyên nhóm)**: [Q29 — list nặng, kết hợp startTransition + memo?](../29-concurrency-transition-deferred/README.md) · [Q31 — 50.000 item thì virtualize (không phải memo)?](../31-virtualization/README.md)
