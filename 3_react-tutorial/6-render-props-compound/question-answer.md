# DAY 6 — Hỏi & Đáp: Render props & Compound components

> File hỏi–đáp chi tiết cho `3_react-tutorial/6-render-props-compound`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (`Mouse` + Tabs rút gọn chạy được).

---

## 1. Render props là gì? Khác props thường ở đâu?

**Hỏi:** Prop là function thì khác gì prop là chuỗi/số?

**Đáp:**
- Render props = prop là **function nhận dữ liệu từ component và trả về JSX**.
  Component giữ **state/logic**, người dùng quyết **UI** — đảo ngược so với props dữ liệu thuần.
- Tương đương `ng-template` + `ngTemplateOutlet` (truyền context) của Angular: template render với dữ liệu
  do component cung cấp.
- Trong example, `Mouse` giữ `pos` (tọa độ chuột), gọi `children(pos)`; người dùng quyết hiển thị
  `<p>Mouse: {x}, {y}</p>` hay bất kỳ UI nào khác từ cùng một `pos`.

```tsx
<Mouse>{({ x, y }) => <p>Mouse: {x}, {y}</p>}</Mouse>
```

---

## 2. Function-as-children khác render props thế nào?

**Hỏi:** `render={...}` và `>{...}` dạng hàm có phải hai pattern khác nhau?

**Đáp:**
- **Cùng một ý tưởng**, khác vị trí đặt hàm: prop tên `render` vs chính `children` là function.
  Function-as-children (`<Mouse>{(pos) => ...}</Mouse>`) đọc tự nhiên hơn vì vẫn đúng cú pháp lồng JSX,
  nên là dạng hiện đại được ưa dùng.
- Nhận diện: thấy `{children(pos)}` trong thân component là biết children-dạng-hàm.

---

## 3. Compound components là gì? Vì sao không truyền props từng tầng?

**Hỏi:** `Tabs.Trigger`, `Tabs.Panel` hoạt động thống nhất mà không thấy truyền state cho nhau?

**Đáp:**
- Compound = nhóm component chia sẻ **state ngầm qua Context**: cha bọc `Provider` cấp `{ value, setValue }`,
  các con đọc cùng context qua `useContext` — **không prop drilling** qua tầng trung gian.
- Thêm con mới (ví dụ `Tabs.Badge`) không phải sửa cha hay các con cũ — mỗi con tự đọc context nó cần.
- Chuẩn thường khai các con là static members (`Tabs.List`, `Tabs.Trigger`, `Tabs.Panel`) để IDE gợi ý
  và API "tự tài liệu". Example rút gọn dùng button thường + `Provider` để thấy rõ cơ chế.

---

## 4. Đặt Trigger ngoài Provider thì sao?

**Hỏi:** Quên bọc `<TabsCtx.Provider>` mà con vẫn gọi `useContext(TabsCtx)`?

**Đáp:**
- `useContext` trả về **default value** (`null` trong example) → đọc `.value` trên `null` là **crash lúc render**.
- Vì vậy default nên là `null` (không phải object giả) để lỗi lộ ngay, và pattern chuẩn bọc hook guard
  `if (!ctx) throw new Error(...)` như DAY 7 — "chạy sai ngầm" tệ hơn "crash rõ ràng".

---

## 5. Khi nào dùng render props/compound thay hooks thuần?

**Hỏi:** Custom hook cũng chia sẻ logic được — khi nào cần 2 pattern này?

**Đáp:**
- **2026: 90% case hooks là đủ** (custom hook trả state + handler). Render props/compound giữ giá trị cho
  **UI kit headless** (Radix, shadcn/ui, Ark): bên dùng cần **toàn quyền quyết UI** mà vẫn ăn sẵn
  state/logic/a11y (`role="tablist"`, `aria-selected`, focus, keyboard).
- Render props có chi phí: function mới mỗi render (trừ khi Compiler memo) — chỉ dùng khi cần linh hoạt thật,
  đừng dùng cho mọi component.

---

## 6. Re-render lan thế nào trong compound + context?

**Hỏi:** Bấm Trigger đổi tab, những ai re-render?

**Đáp:**
- `setValue` → Provider value đổi → **mọi consumer** đã gọi `useContext(TabsCtx)` trong subtree re-render
  (cả Trigger lẫn Panel). Component không đọc context thì đứng yên.
- Dữ liệu lớn cập nhật nhanh (gõ search, drag) mà nhét vào context → re-render cả cụm vô tội vạ.
  Lúc đó tách context (state riêng/context riêng) hoặc dùng store + selector (DAY 8).

---

## 7. So nhanh Angular ↔ React cho 2 pattern này?

**Hỏi:** Mỗi khái niệm template Angular tương đương gì?

**Đáp:**

| Angular | React | Ghi chú |
|---|---|---|
| `ng-template` + `ngTemplateOutlet` + context | render props / function-as-children | Cùng ý: template render với dữ liệu |
| `ng-container` | fragment `<>...</>` | Nhóm không thêm DOM |
| Directive + template linh hoạt | compound + Context | Không macro template, dùng component + context |

---

## 8. Usecase thực tế: viết `Select` headless bằng render props thế nào?

**Hỏi:** Khi nào render props "đáng tiền" hơn hooks thuần? Cho ví dụ thật.

**Đáp:**
- Khi bạn cần **cùng một logic, nhiều UI khác nhau** mà hooks thuần không bao bọc được phần quyết định UI. Ví dụ điển hình: `Select` headless dùng ở 2 nơi — một nơi dropdown kiểu menu, một nơi kiểu popover có search. Logic chung (open, selected, toggle, select) nằm trong component cha, UI do từng nơi tự vẽ qua function.
- Cơ chế: component `Select` giữ `useState` cho `open`/`selected`, rồi gọi `children({ open, selected, toggle, select })`. Mỗi lần state đổi, `Select` re-render và gọi lại function với giá trị mới, nên UI luôn đồng bộ mà không cần prop drilling. Đây chính là chỗ hooks thuần thua: hooks trả state nhưng không "ôm" được a11y (`aria-expanded`, `role="listbox"`) và cấu trúc DOM dùng chung.
- Quy tắc nhận diện: nếu bạn thấy mình copy 3 hàm `open/toggle/select` sang 2 component khác nhau và mỗi nơi vẽ UI khác, đó là tín hiệu chuyển sang render props hoặc compound.

```tsx
import { useState, type ReactNode } from "react";

// Component headless: giữ logic, nhả quyền vẽ UI cho người dùng
function Select({ children }: {
  children: (api: { open: boolean; selected: string; toggle: () => void; select: (v: string) => void }) => ReactNode;
}) {
  const [open, setOpen] = useState(false); // trạng thái đóng/mở dropdown
  const [selected, setSelected] = useState("a"); // giá trị đang chọn
  const toggle = () => setOpen((o) => !o); // đảo trạng thái mở
  const select = (v: string) => { setSelected(v); setOpen(false); }; // chọn xong tự đóng
  return <div>{children({ open, selected, toggle, select })}</div>;
}

// Nơi dùng 1: UI đơn giản kiểu nút + list
function App() {
  return (
    <Select>
      {({ open, selected, toggle, select }) => (
        <div>
          {/* Nút hiện giá trị đang chọn, kèm aria-expanded cho screen reader */}
          <button aria-expanded={open} onClick={toggle}>Đang chọn: {selected}</button>
          {open && (
            <ul role="listbox">
              {["a", "b", "c"].map((v) => (
                <li key={v} role="option" aria-selected={v === selected} onClick={() => select(v)}>{v}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Select>
  );
}
```

---

## 9. Cặp dễ nhầm: render props vs `children` slot thường (DAY 5) vs HOC?

**Hỏi:** Ba cách "tái dùng UI" này khác nhau thế nào, khi nào chọn cái nào?

**Đáp:**
- Khác ở **ai giữ dữ liệu động**: `children` slot thường (DAY 5) nhận JSX **tĩnh** — cha không truyền dữ liệu tươi vào lúc render. Render props nhận **function** — cha truyền dữ liệu tươi (`pos`, `open`) mỗi lần gọi. HOC (higher-order component, pattern cũ `withX(Component)`) bọc component bằng function ở tầng module, khó đọc cây component và dễ đụng tên props.
- Cơ chế nhận diện nhanh: mở thân component, thấy `{children}` (không gọi) là slot tĩnh; thấy `{children(pos)}` hoặc `{render(data)}` (có gọi như hàm) là render props; thấy `export default withAuth(Page)` ở cuối file là HOC.
- Vì sao 2026 chuộng render props/compound hơn HOC: HOC tạo lớp bọc vô hình trong DevTools, props đi qua nhiều tầng bọc khó trace; render props hiện rõ trong JSX nên đọc luồng dữ liệu dễ hơn.

| Cách | Cú pháp nhận diện | Khi nào dùng |
|---|---|---|
| `children` slot (DAY 5) | `{children}` — render thẳng | Bọc layout tĩnh (Card, Modal khung) |
| Render props / function-as-children | `{children(data)}` — gọi như hàm | Cha giữ state, con quyết UI (Mouse, Select headless) |
| Compound + Context (cùng DAY 6) | `Tabs.Trigger` đọc `useContext` | Nhóm component phối hợp (Tabs, Accordion) |
| HOC `withX` | `withAuth(Page)` ở export | Legacy, hạn chế dùng mới |

---

## 10. Lỗi thực chiến: gọi hook bên trong callback render prop thì sao?

**Hỏi:** Viết `useState` ngay trong `{(pos) => { ... }}` có chạy không?

**Đáp:**
- **Không được.** Callback render prop chạy **trong lúc render của component cha** (`Mouse`), không phải thân của một component hay custom hook độc lập. Gọi `useState`/`useEffect` ở đó vi phạm Rules of Hooks (gọi hook trong hàm lồng, số lượng không ổn định theo thứ tự), React báo lỗi "Invalid hook call" hoặc gán nhầm state giữa các render.
- Cơ chế đúng: callback render prop chỉ được **vẽ JSX thuần** từ dữ liệu nhận được. Mọi state/effect phải nằm ở component bao ngoài (nơi khai `<Mouse>{...}</Mouse>`) hoặc trong chính `Mouse`, rồi truyền kết quả xuống qua tham số function.
- Sai thì sao: app crash lúc render, message khó hiểu nếu không biết quy tắc thứ tự hook. Fix: nâng hook ra component cha, callback chỉ đọc giá trị đã tính.

```tsx
// SAI: gọi hook trong callback render prop -> vi phạm Rules of Hooks
// <Mouse>{(pos) => { const [x] = useState(0); return <p>{pos.x}</p>; }}</Mouse>

// ĐÚNG: hook nằm ở component bao ngoài, callback chỉ vẽ JSX
import { useState } from "react";

function MouseView() {
  const [label] = useState("Tọa độ:"); // hook ở top-level component -> hợp lệ
  return (
    <div>
      {/* Callback chỉ nhận pos và vẽ, không gọi hook nào bên trong */}
      {/* Giả sử Mouse đã định nghĩa như example.tsx */}
      {/* <Mouse>{({ x, y }) => <p>{label} {x}, {y}</p>}</Mouse> */}
    </div>
  );
}
```

---

## 11. So sánh sâu Angular `ngTemplateOutletContext` ↔ function children (kèm `useId` cho a11y)?

**Hỏi:** Truyền dữ liệu vào template hai bên có tương đương 1:1 không? Còn `id` cho `aria-controls` thì sao?

**Đáp:**
- Tương đương gần 1:1 về ý tưởng: Angular `<ng-container *ngTemplateOutlet="tpl; context: { $implicit: pos }">` truyền `pos` vào template qua context; React `{children(pos)}` truyền `pos` vào function qua tham số. Khác ở chỗ Angular cần khai `ng-template` + directive riêng, còn React chỉ cần function thường nên ít khái niệm hơn.
- Vì sao cần `useId`: Tabs chuẩn cần nối `tab` với `panel` qua `id`/`aria-controls`. Nếu hardcode `id="panel"` mà trang có 2 cụm Tabs là trùng id, screen reader trỏ sai. `useId()` sinh id ổn định, SSR-safe (server và client sinh cùng giá trị, không lệch hydration), mỗi instance Tabs một id riêng.
- Lỗi thực chiến: quên `useId` mà copy Tabs sang chỗ khác trong trang, test a11y báo duplicate id. Fix: mỗi cụm Tabs gọi `const base = useId()` rồi suy ra `tabId = base + "-tab-a"`.

```tsx
import { useId } from "react";

function AccessibleTabsDemo({ value }: { value: string }) {
  const base = useId(); // sinh id duy nhất cho cụm Tabs này, an toàn SSR
  const tabId = `${base}-tab-a`; // id cho nút tab A
  const panelId = `${base}-panel-a`; // id cho panel A, nối qua aria-controls
  return (
    <>
      {/* aria-selected báo tab nào đang active, aria-controls trỏ tới panel */}
      <button role="tab" id={tabId} aria-selected={value === "a"} aria-controls={panelId}>A</button>
      <p role="tabpanel" id={panelId} aria-labelledby={tabId}>Nội dung A</p>
    </>
  );
}
```

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 6)
- https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children
- https://react.dev/learn/scaling-up-with-reducer-and-context (compound + context thực tế)
