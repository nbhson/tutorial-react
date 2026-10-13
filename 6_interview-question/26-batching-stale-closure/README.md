# Q26: Trong một cú click mà gọi `setCount` hai lần liên tiếp, UI render mấy lần? Giá trị cuối là gì?

## Câu hỏi

> Ghi `setCount(c => c + 1)` hai lần liên tiếp trong cùng một click, UI hiện +1 hay +2? Vì sao?
> Hai `setState` trong cùng một event thì React render lại một lần hay hai?
> State đọc ra trễ một nhịp (stale) là trường hợp nào, cách sửa chuẩn là gì?

## Trả lời ngắn (elevator pitch, 30 giây)
- Nhiều `setState` trong cùng một cú click thì React gộp thành **1 lần vẽ** (batching — từ 18 áp dụng mọi nơi, kể cả Promise/timeout).
- Gọi `setCount(count + 1)` hai lần chỉ +1 vì cả hai cùng đọc giá trị cũ. Muốn +2 thì dùng dạng hàm `setCount(c => c + 1)` — mỗi update xếp hàng nhận giá trị mới nhất.
- Luật vàng: update nào dựa trên giá trị cũ (đếm, nối mảng, bật/tắt) thì luôn dùng dạng hàm. Đọc state trong `setTimeout`/listener mà thấy "trễ một nhịp" thì kiểm tra deps hoặc dùng dạng hàm/`ref`.

## Trả lời chi tiết

### 1. Automatic batching (React 18) — "N setState, 1 render"

```tsx
// Bấm 1 lần:
function Inc() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");
  const onBtn = () => {
    setCount(1);          // update #1 — KHÔNG render ngay
    setCount((c) => c + 1); // update #2 (xếp hàng)
    setName("a");          // update #3 (component khác? cùng tree)
  };
  // → React GỘP: re-render 1 lần với count = 2, name = "a"
}
```

- **Trước 18**: batch chỉ trong event handler của React; `Promise.then`, `setTimeout`, native listener → **mỗi setState 1 render**. **Từ 18**: **mọi context** đều batch (scheduler gộp).
- **Hệ quả**: **không đọc được state ngay sau khi `set` trong cùng 1 tick** — `setCount(c => c + 1); console.log(count)` vẫn in giá trị **cũ** (render là việc của scheduler).

### 2. Functional update — vì sao `c => c + 1` không "mất update"

React xếp **update thành hàng (queue)**, chạy tuần tự khi render:

| Cách gọi (bấm 2 nút tăng cùng event) | Kết quả | Vì sao |
|---|---|---|
| `setCount(1); setCount(1);` (trị giá) | **1** | Mỗi cái "ghi đè thành 1" — không cộng dồn |
| `setCount(c => c + 1); setCount(c => c + 1);` (functional) | **2** | Mỗi update nhận **giá trị trước đó trong hàng** (c = kết quả của update trên) |
| `const n = 1; setCount(n); setCount(n);` | **1** | Trị giá (kể cả qua biến) — không "biết" mình bị gọi 2 lần |

**Quy tắc 1 câu**: **cộng dồn/xây trên giá trị cũ** → **hàm**; **đặt thành giá trị độc lập** (kết quả fetch, `e.target.value`, hằng số) → **trị giá**.

### 3. Stale closure — vì sao state "trễ 1 nhịp" (điểm sâu nhất)

Closure **đóng gói giá trị THỜI ĐIỂM TẠO**, không "biến đổi theo thời gian":

```tsx
// ❌ setTimeout đọc count "cũ":
useEffect(() => {
  setTimeout(() => console.log(count), 3000); // in 0 dù 3s sau đã bấm nhiều lần
}, [count]); // ← deps CHƯA đủ: không [count] thì effect không chạy lại → closure mãi count=0

// ✅ (a) deps đủ: effect chạy lại mỗi khi count đổi → closure MỚI (đọc giá trị hiện tại)
useEffect(() => {
  const id = setTimeout(() => console.log(count), 3000);
  return () => clearTimeout(id);
}, [count]);

// ✅ (b) functional: không cần closure "đúng", React cấp giá trị hiện tại
setTimeout(() => setCount((c) => c + 1), 3000); // c luôn = giá trị ở THỜI ĐIỂM CHẠY

// ✅ (c) useRef giữ "giá trị sống" (đọc mới mà không re-create effect):
const countRef = useRef(0);
// render: countRef.current = count;
// effect (deps []): setTimeout(() => console.log(countRef.current), 3000); // LUÔN đọc mới
```

> **Mẹo nhận dạng stale**: (1) log/state trong **callback setTimeout/listener** khác với giá trị hiện tại; (2) **event listener tự đăng ký** (không qua React) giữ closure mount; (3) **effect deps thiếu** → effect không chạy lại → closure cũ. (Liên hệ Q27: `useEffectEvent` = "đọc mới nhất mà không thêm deps" — 19.2+.)

### 4. React 19: `setState` ngoài render (Actions) — ngoại lệ đáng biết

React 18+ cho phép `setState` **trong event handler của RSC/Actions** (`useActionState`): React **chờ action xong rồi render** (optimistic + rollback) — khác "gộp batch rồi render". SPA thường vẫn là batch; Actions là **kịch bản server roundtrip** (kết hợp Q2 `use()`/Actions).

### 5. Angular so sánh (điểm ăn điểm)

| Angular (Zone.js) | React | Ghi chú |
|---|---|---|
| Zone.js "sniff" mọi async (promise, timer, event) → **1 lần CDK** (change detection) sau mỗi microtask | React **báo cáo** (`setState`) → scheduler **batch** mọi update trong event | Angular "khiến" CDK chạy; React "biết" bạn đổi gì (explicit) — nhẹ hơn, nhưng **phải khai báo đúng** (Q1, Q5) |
| `ngOnInit` đọc data đồng bộ (class, không closure) | **Closure** (function) → **stale** nếu deps thiếu | Angular "không dính" stale (field class sống theo instance); React **bắt đầu** từ **thời điểm render** (bản closure) |
| `(click)` xử lý đồng bộ | Click handler của React **cũng batch** (mọi `setState` cùng tick) | Giống nhau về "1 event = 1 xử lý", khác **cơ chế** (Zone vs scheduler) |

> **Nói đúng câu chốt**: "React 18 batch **mọi** `setState` trong 1 tick (click, Promise, timeout) thành **1 render** (scheduler). Functional update là 'xếp hàng' (cộng dồn); trị giá là 'ghi đè'. Stale closure là **đặc tính function** (đóng gói thời điểm tạo) — sửa bằng **deps đủ / functional / ref**; Angular (field class) không dính dạng lỗi này, nhưng trả giá bằng Zone.js + CDK."

## Bẫy khi phỏng vấn

1. **"Tôi gọi 2 lần `setCount(count + 1)` (trị giá) sẽ +2"** → **sai** (+1, cả 2 đọc `count` cùng lúc). Muốn +2: **functional** `c => c + 1` gọi 2 lần.
2. **"React render 1 lần mỗi `setState` (như console.log sau set)"** → **sai** (batch). Nhưng: `setState` trong **`setTimeout`/Promise ở React 17** → **không batch** (mỗi tick 1 render) — **từ 18 có batch**. (Phân biệt "React 18 vs trước".)
3. **Stale trong `setTimeout` mà "chỉ cần đọc đúng nhất"** → **deps thiếu / closure cũ**. Fix theo thứ tự: **(a) deps đủ**, **(b) functional**, **(c) ref** (Q25/Q27).
4. **"Nhiều store/Context `set` cùng event = N lần re-render"** → **sai** (React 18+ batch **liên store + context** trong cùng tick — gộp 1 vòng render; liên hệ Q15).
5. **Nói "optimistic update (Action) là batch thường"** → sai: Actions (RSC) **chờ server** + **rollback** (khác SPA thuần batch đồng bộ) — Q2 (React 19).

## Gợi ý câu chốt

> "React 18+ **batch mọi `setState` trong cùng 1 tick** (click, Promise, timeout) → **1 lần re-render** (scheduler). Update **cộng dồn** phải **functional** (`c => c + 1`, xếp hàng theo giá trị trước đó); **đặt trị giá** (fetch/event) dùng thường. **Stale closure** = closure **đóng gói giá trị thời điểm tạo** (setTimeout/listener/effect deps thiếu) — sửa: (a) **deps đủ** (effect chạy lại, closure mới), (b) **functional**, (c) **`useRef`** (đọc mới, không re-create effect; 19.2 có `useEffectEvent`). Angular (Zone.js + field class) **không dính** stale dạng này nhưng trả giá **CDK sau mỗi async**."

## Reference

- [`3_react-tutorial/1-jsx-data-display`](../../3_react-tutorial/1-jsx-data-display) — controlled input + **batching** ("gõ nhanh 5 phím không phải 5 lần vẽ full cây")
- [`3_react-tutorial/3-props-interaction/question-answer.md`](../../3_react-tutorial/3-props-interaction/question-answer.md) — "bấm +1 hai lần" (batching + functional) + "mất 1 update" (trị giá)
- [`3_react-tutorial/8-external-store`](../../3_react-tutorial/8-external-store) — "React 18+ **batch** nhiều `set` cùng event → một vòng re-render; nhiều store cùng đổi 1 event cũng gộp"
- [`4_react-new-feature/1_react-18`](../../4_react-new-feature/1_react-18) — concurrent rendering + automatic batching (18), `useActionState` (19)
- Q2 (React 18 vs 19) — Actions (optimistic + rollback, khác batch đồng bộ)
- Q25 (rules of hooks) / Q27 (effect nào khi nào) — `useEffectEvent` (19.2), deps + cleanup (cùng họ stale/loop)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q25 — vì sao không gọi hook trong if/for?](../25-rules-of-hooks/README.md) · [Q30 — 2 setState thì render 1 hay 2 lần?](../30-rerender-pipeline/README.md)
- **Đào sâu (xuyên nhóm)**: [Q28 — state phức tạp, chuyển useReducer (functional update)?](../28-usereducer-vs-usestate/README.md) · [Q27 — stale closure trong effect, sửa bằng functional update?](../27-which-effect-when/README.md)
