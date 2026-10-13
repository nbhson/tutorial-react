# 2. Memoization & Rules of React

## Mô tả

React Compiler 1.0 (**stable 10/2025**) tự động memoize **component, JSX, computed values và callback** dựa trên phân tích reactivity của code. Nó làm được điều này *chỉ khi* code tuân thủ **Rules of React** — bộ quy tắc đảm bảo component là hàm thuần (pure) và có thể dự đoán.

Đây là bài "hiểu đúng bản chất": compiler không phải phép thuật — nó chỉ an toàn khi code của bạn "sạch" theo các quy tắc dưới đây.

## Mục tiêu

- Hiểu compiler memoize **cái gì** và **dựa trên cơ chế nào**.
- Nắm 4 nhóm Rules of React bắt buộc để component được compile.
- Biết phân biệt "memo reactivity" (compiler làm) với "cache tính toán đắt" (bạn vẫn cần `useMemo`).

## Vấn đề giải quyết

Trước đây, re-render lan tràn vì những giá trị "mới mỗi render" nhưng thực chất không đổi về mặt ngữ nghĩa:

- `onClick={() => doSomething(id)}` — callback mới mỗi render ⇒ child bọc `memo` vẫn re-render.
- `style={{ color }}` / `config={{ theme }}` — object mới mỗi render ⇒ phá vỡ memo.
- `items.filter(...)` — mảng mới mỗi render ⇒ truyền xuống child gây render thừa.

Viết memo tay cho hàng trăm component là không khả thi và dễ sai. Compiler làm việc này **một cách hệ thống trên toàn codebase**, với điều kiện code tuân thủ Rules of React.

## Khái niệm cốt lõi

Compiler dựng một **đồ thị phụ thuộc** cho mỗi component: giá trị nào sinh ra từ state/props nào. Khi một phần state không đổi, mọi giá trị phụ thuộc chỉ vào state đó được giữ nguyên reference ⇒ child nhận reference cũ và bỏ qua render.

Điều kiện để phân tích này *đúng*:

1. **Render phải thuần (pure)**. Với cùng props/state, component phải trả về cùng JSX. Không side-effect trong render (trừ khi đó là side effect *hợp lệ* như tạo object local).
2. **Không mutate props, state, hoặc giá trị trả về từ hook/context**. Mutate làm compiler không tin được reference ⇒ bỏ qua tối ưu.
3. **Hook gọi ở top-level**, không trong điều kiện/vòng lặp/hàm lồng — để thứ tự hook luôn cố định.
4. **Không đọc/ghi DOM, ref.current hay biến bên ngoài trong render** — đó là "non-reactive read", làm kết quả render phụ thuộc thứ ngoài luồng React.

Khi code vi phạm, compiler **skip** component đó (không vỡ build) — nghĩa là bạn tưởng đã tối ưu nhưng thực ra không. Vì vậy ESLint là bạn đồng hành bắt buộc (bài 3).

## Cú pháp / API

Compiler không có API mới cho memoization — bạn chỉ cần viết code sạch. Một số directive và nguyên tắc:

```tsx
'use memo';    // bật compile cho file/component (opt-in)
'use no memo'; // tắt compile cho file/component (opt-out)
```

Bảng đối chiếu nhanh vi phạm → cách sửa:

| Vi phạm | Ví dụ sai | Cách sửa |
|---------|-----------|----------|
| Mutate props | `items.push(x)` | `const next = [...items, x]` |
| Mutate state | `state.count++` | tạo bản mới / dùng `setState` |
| Hook có điều kiện | `if (x) { useState() }` | đưa hook lên top-level |
| Non-reactive read | `label = ref.current` trong render | đọc ref trong event/effect |

## Luồng hoạt động (Flow)

1. Compiler đọc component, xác định state/props là "nguồn" dữ liệu.
2. Nó theo dõi cách các biến khác được suy ra từ nguồn đó (đạo hàm).
3. Compiler kiểm tra code có vi phạm Rules of React không.
4. **Hợp lệ** → chèn mã giữ nguyên reference của giá trị không đổi, và memo component/JSX.
5. **Vi phạm** → skip component, giữ code gốc (không tối ưu).
6. Kết quả: re-render chỉ lan tới nơi dữ liệu thực sự thay đổi.

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

```tsx
'use memo'; // Bật compiler cho file này

// ✅ GOOD: render THUẦN — Compiler tự memo `sorted` và callback.
export function GoodList({
  items,
  onPick,
}: {
  items: string[];
  onPick: (v: string) => void;
}) {
  // Copy rồi sort ⇒ KHÔNG mutate props `items`.
  // Compiler nhận ra `sorted` chỉ phụ thuộc `items`.
  const sorted = [...items].sort();

  return (
    <ul>
      {sorted.map((item) => (
        <li key={item}>
          {/* Callback inline vẫn ổn: compiler giữ identity ổn định khi cần */}
          <button onClick={() => onPick(item)}>{item}</button>
        </li>
      ))}
    </ul>
  );
}

// ❌ BAD: mutate props trong render ⇒ Compiler SKIP + lint báo lỗi.
// Sửa: const next = [...items, 'x'] rồi render từ `next`.
export function BadCounter({ items }: { items: string[] }) {
  // @ts-expect-error — minh họa vi phạm Rules of React
  items.push('mutated'); // vi phạm: mutate render input
  return <p>Tổng: {items.length}</p>;
}

// ✅ Vẫn giữ useMemo cho tính toán ĐẮT (compiler không thay việc này về semantic).
export function HeavyStats({ rows }: { rows: number[] }) {
  const stats = (() => {
    // Giả lập tính nặng trên mảng rows lớn
    return { sum: rows.reduce((a, b) => a + b, 0) };
  })();
  return <p>Tổng: {stats.sum}</p>;
}
```

## Giải thích từng phần

- **`const sorted = [...items].sort()`** — đây là "pure derivation": tạo giá trị mới từ props mà không sửa props. Compiler memo được `sorted` và chỉ tính lại khi `items` đổi.
- **`onClick={() => onPick(item)}`** — callback inline trông "mới mỗi render", nhưng compiler có thể giữ identity ổn định nếu `onPick` và `item` không đổi. Đây chính là thứ bạn từng phải `useCallback` bằng tay.
- **`BadCounter` với `items.push('mutated')`** — mutate chính props nhận vào. Điều này phá vỡ giả định pure render ⇒ compiler skip. Lint (`eslint-plugin-react-hooks` v6) cũng báo lỗi.
- **`HeavyStats`** — minh họa giới hạn: compiler memoize *theo reactivity* (chỉ tính lại khi `rows` đổi), nhưng nếu phép tính cực nặng và bạn muốn cache kết quả theo nghĩa khác (ví dụ theo giá trị, không chỉ reference), vẫn nên cân nhắc `useMemo` tường minh.

## So sánh với cách làm cũ

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| `useCallback` cho mọi handler | Compiler giữ identity ổn định tự động | Bớt code, không lo thiếu dep |
| `useMemo` cho mọi biến derived | Compiler memo derived value | Ít nhiễu, khó sai |
| `React.memo` bọc child nặng | Compiler memo child theo reactivity | Chính xác theo giá trị thật |
| Sợ mutate nhưng không rõ quy tắc | Rules of React tường minh + lint | Viết code an toàn, tự tin hơn |

## Lỗi thường gặp

1. **Mutate props/state trong render** (`items.push`, `obj.x = 1`) ⇒ compiler skip. *Fix:* tạo bản sao mới (`[...items]`, `{ ...obj }`).
2. **Hook gọi có điều kiện** (`if (flag) useState()`) ⇒ vi phạm thứ tự hook ⇒ skip + lint. *Fix:* đưa hook lên top-level, xử lý điều kiện trong thân hàm.
3. **Đọc `ref.current` hoặc biến ngoài trong render** ⇒ non-reactive read ⇒ skip. *Fix:* đọc trong event handler/`useEffect`, hoặc chuyển sang state.
4. **Nghĩ compiler thay được cache tính toán đắt** ⇒ vẫn chậm. *Fix:* vẫn dùng `useMemo` cho các phép tính cực nặng có chủ đích cache.
5. **Để compiler skip lặng lẽ** ⇒ tưởng tối ưu. *Fix:* bật lint ở mức `error` và đọc log khi build.

## Khi nào dùng / Khi nào không

**Dùng để:**
- Viết component theo hướng pure, bỏ dần memo thủ công.
- Hiểu vì sao một component **không được** compiler tối ưu (thường do vi phạm rules).

**Không lạm dụng:**
- Không thay `useMemo` cho **cache kết quả tính toán đắt theo semantic riêng** — compiler memoize reactivity, không phải một cache tùy ý.
- Với file interop thư viện mutable không thể sửa, dùng `"use no memo"` + comment rõ lý do thay vì để skip âm thầm.

## Bài tập nhỏ

Cho `ProductList({ items, onAdd })` truyền `onAdd` inline và `items.filter(p => p.active)` xuống một `ProductRow` có `console.log`. Đầu tiên viết bản **mutate** (`items.sort()` tại chỗ) để thấy compiler skip, sau đó sửa thành pure (`[...items].sort()`) và kiểm chứng `ProductRow` không re-render khi state không liên quan đổi.

## Reference

- [Rules of React (react.dev)](https://react.dev/reference/rules)
- [React Compiler docs](https://react.dev/learn/react-compiler)
- [React Compiler 1.0 Release](https://react.dev/blog/2025/10/07/react-compiler-1)
