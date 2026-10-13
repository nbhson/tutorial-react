# Q34: Có list 50 ô input, muốn focus đúng ô thứ 20 thì em giữ ref kiểu gì?

## Câu hỏi

> Muốn focus ô input trong list 50 ô (hoặc scroll tới dòng cụ thể, đo kích thước N element) — bạn giữ ref thế nào?
> `useRef` 1 cái thì làm được gì, khi nào không đủ?
> Ref callback khác `useRef` ở đâu (lúc mount/unmount)?
> Vì sao nên `Map` + callback ref chứ không phải mảng `useRef` push trong render?
> React 19 thì ref-as-prop thay đổi gì?

## Trả lời ngắn (elevator pitch, 30 giây)
- Một `useRef` chỉ giữ một node. List N dòng mà gọi N `useRef` trong vòng lặp là phạm luật hook.
- Dùng **ref callback + Map theo id**: mount thì `map.set(id, node)`, unmount (node null) thì `map.delete(id)`. Muốn focus/scroll/đo dòng nào thì lấy từ Map.
- Đừng push ref vào mảng trong lúc render — mỗi lần vẽ push thêm, mảng phình vô hạn. React 19 thì `ref` là prop thường, khỏi `forwardRef`.

## Trả lời chi tiết

### 1. `useRef` (1 box) — đủ khi nào, thiếu khi nào

| Case | Dùng gì |
|---|---|
| **1** node (1 input, 1 div đo) | `useRef<T>(null)` + `<input ref={ref}>` (sau mount `ref.current` = node) |
| **N** node (list 50 input, N row) | **KHÔNG** "N `useRef`" (vi phạm Q25: hook trong loop) → **callback ref + Map** (§2) |

> `useRef` **1 lần = 1 box** (tham chiếu **ổn định** qua các render, Q10: `.current` đổi **không** re-render). Muốn "N box" mà viết N `useRef` = N hook → **dở số hook** (Q25). **Không có cách "N `useRef` hợp lệ"** → ref callback (giải pháp "đúng").

### 2. Ref callback — mount/unmount (cơ chế, điểm ăn điểm)

```tsx
// callback: "nước" node THẬT vào 1 "cửa" (Map) — React gọi "lúc" node "thật" (gắn/gỡ)
const itemRefs = useRef(new Map<string, HTMLInputElement>());

function InputList({ items }: { items: { id: string; label: string }[] }) {
  const setRef = (id: string) => (node: HTMLInputElement | null) => {
    if (node) itemRefs.current.set(id, node);   // MOUNT (gắn node "thật")
    else itemRefs.current.delete(id);           // UNMOUNT (node "biến mất" → "dọn")
  };

  return (
    <>
      {items.map((it) => (
        <input key={it.id} ref={setRef(it.id)} placeholder={it.label} />
      ))}
    </>
  );
}
// "dùng": itemRefs.current.get("3")?.focus(); (sau render, node "đã" "gắn")
```

**Vì sao callback (không phải `useRef` + effect)** (điểm ăn điểm):
- **`useRef` + `useEffect`**: effect chạy **sau render** (đọc `ref.current`) — **trễ 1 nhịp**, + phải **tự** "theo dõi" node (effect deps) — **dễ stale** (Q27).
- **callback ref**: React gọi **đúng lúc** node **gắn** (mount) / **gỡ** (unmount, **`null`**) — **không trễ**, **không** effect phụ thuộc (Q27 "effect vs render": đây là "sự kiện DOM", không "tính data").
- **unmount = `null`**: callback **biết** node "đi" (dọn Map) — `useRef` + effect "không biết" (phải viết cleanup + deps, dễ sót).

### 3. Vì sao `Map`, KHÔNG phải "mảng push trong render" (bẫy #1)

```tsx
// ❌ SAI: "push" trong render (mỗi render "thêm" → "tích lũy" SAI, array "phình" "vô hạn")
const refs = useRef([]);
{items.map((it) => <input key={it.id} ref={(el) => refs.current.push(el)} />)}
// render 1: [a,b,c]; render 2 (list đổi): [a,b,c, newA,newB] — "trùng" + "chết" (không "xóa")

// ✅ ĐÚNG: "Map" (key = "id", "set/delete" — "sạch" mỗi "đổi" list)
{items.map((it) => <input key={it.id} ref={setRef(it.id)} />)}  // "set(id, node)" / "del(id)" (unmount)
```

> **Quy tắc 1 câu**: **"N node" → `Map` (key = `id`, **set/delete** theo lifecycle)". **KHÔNG** "mảng push trong render" (tích lũy sai, bẫy #1). (Nếu chỉ "1 node" (không N): `useRef` (Q10) đủ, không Map.)

### 4. Vì sao "không dùng `key` (list) làm key Map (nghiêng bẫy)" (liên hệ Q8)

- Map **key = `id` THẬT** (data), **KHÔNG** "index render" (Q8: index = "bẫy" key) — nếu dùng `index` làm key Map, **reorder** list là **Map "lệch"** (id "đổi chỗ" nhưng index "giữ") → "trùng/lệch" (Q8). **Key Map = `id`** (ổn định, không "chết" reorder).

### 5. React 19: `ref`-as-prop (thay đổi gì, ăn điểm)

```tsx
// Trước (≤18): "bọc" forwardRef (cần "thông báo" "giữ" ref "cho" "cha")
const MyInput = forwardRef<HTMLInputElement, Props>((props, ref) => <input ref={ref} {...props} />);

// React 19: ref "là prop "thường" (destructure) — không forwardRef (cập nhật "thường")
function MyInput({ ref, ...rest }: Props & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...rest} />; // "gắn" ref "xuống" "DOM "thật"
}
// "dùng": <MyInput ref={inputRef} /> (cha "gửi" ref, "con" "truyền" "xuống" "DOM")
```

- **18 → 19**: `ref` **trở thành prop thường** (không "kèm" forwardRef) — code "cũ" (lib chưa nâng) **vẫn** `forwardRef`. "Ăn điểm": "React 19 giảm ceremony (không 'bọc' forwardRef) — ref 'dành cho' DOM (cha → con → DOM)".

### 6. `useImperativeHandle` (liên hệ Q11) — "phơi" method qua ref (đúng cách)

Khi cần **cha "gọi" method của con** (focus, scrollTo, ...): `useImperativeHandle(ref, () => ({ focus() {...} }))` — con **"quyết"** "API" "phơi" (không "truyền" "DOM" "ref" "nguyên xi") (Q11: "3 cách" (state/prop → useImperativeHandle → "pass DOM ref (rough)")). **Không** "phơi" "cả" DOM node (mở **API** (focus/reset), không "lộ" DOM (cha không "nên" "chạm" "DOM" con trực tiếp — "kết hợp" (bọc) (Q11)).

## Bẫy khi phỏng vấn

1. **"N node bằng N `useRef` (gọi hook trong loop)"** → **vi phạm** rules of hooks (Q25: số hook "đổi", "dở") — **sai** "cơ bản". **Đúng**: "ref callback + Map" (Q25 "top-level" — hook "một" lần (Map), "callback" "đặt" "nhiều").
2. **"Mảng `useRef` push trong render" (tích lũy sai)** → render N lần = N push (phình, trùng, chết không xóa) — **bẫy** #1. **Đúng**: Map (key=`id`, set/delete, sạch).
3. **"Callback ref = `useRef` (1 thứ)"** → **khác** (trục "khi"): `useRef` = "giữ" "1 box" ("tham chiếu" "ổn định", ".current" "đổi không" render); callback = "React gọi LÚC" (gắn/gỡ node, "null unmount) — "sự kiện" (mount/unmount), không "tính" (Q27). "Dùng "cùng" (Map + "callback" "vào" "Map"): "callback" "lúc" "node gắn/gỡ, "Map" "giữ" (N node).
4. **"Dùng `key` (index) làm key Map"** → reorder "lệch" (Q8) — "key Map = `id`" (ổn định).
5. **"React 19 không cần `forwardRef` (đã bỏ)"** → **sai** (19 **giữ** ref-as-prop + **giữ** `forwardRef` (hỗ trợ code cũ/lib chưa nâng) — "giảm ceremony", không "xóa".

## Gợi ý câu chốt

> "N node (list N input/row): **không** N `useRef` (vi phạm Q25, hook trong loop) → **ref callback + Map** (key=`id`): `ref={(node) => node ? map.set(id, node) : map.delete(id)}` — callback chạy **lúc** node **gắn** (mount) / **gỡ** (unmount, `null`), **không** effect phụ thuộc (trễ/stale, Q27). **Không** 'mảng push trong render' (tích lũy sai — bẫy #1). **Key Map = `id`** (không index, Q8). **React 19**: ref = **prop thường** (không `forwardRef`, code cũ/lib chưa nâng vẫn `forwardRef`). **1 node** (không N): `useRef` (Q10) đủ. Khi cần 'cha gọi method con': `useImperativeHandle` (Q11, 'phơi API', không lộ DOM)."

## Reference

- [`3_react-tutorial/4-ref-template-variable`](../../3_react-tutorial/4-ref-template-variable) — "callback ref (run lúc node gắn/gỡ, `null` unmount)", "nhiều node: Map + callback ref (không mảng push trong render)", "`@ViewChildren` ↔ callback ref giữ Set/Map", "React 19 ref-as-prop (không forwardRef)"
- [`4_react-new-feature/2_react-19/4_ref-as-prop`](../../4_react-new-feature/2_react-19/4_ref-as-prop) — "ref prop" (React 19, không forwardRef)
- Q10 (`useRef` vs `useState`) — "1 box", `.current` không re-render (nền)
- Q11 (cha gọi method con) — `useImperativeHandle` ("phơi API" qua ref)
- Q8 (key = index) — "key Map = `id`" (không index, reorder lệch)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q10 — useRef làm gì (1 box)?](../10-useref-vs-usestate/README.md)
- **Đào sâu (xuyên nhóm)**: [Q8 — key = id (không index) cho N phần tử?](../08-key-index/README.md) · [Q31 — list 50.000 item, virtualize?](../31-virtualization/README.md) · [Q11 — cha gọi hành vi con (useImperativeHandle)?](../11-parent-calls-child-method/README.md)
