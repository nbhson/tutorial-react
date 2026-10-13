# DAY 6: RENDER PROPS & COMPOUND COMPONENTS

## Mục tiêu bài học
- Hiểu 2 pattern cao cấp thay cho `ng-template` + `*ngTemplateOutlet`: **render props** (prop là function) và **compound components** (chia sẻ state ngầm qua Context).
- Biết khi nào pattern này thắng hooks thuần — xây UI kit / headless component tái sử dụng.
- Code được bộ `Tabs` compound có accessibility cơ bản (`role="tablist"`, `aria-selected`).

## Khái niệm cốt lõi (Core)

### 1. Render props — prop là function nhận dữ liệu, trả JSX
Component con giữ state/logic, gọi `render(data)` (hoặc `children(data)`); người dùng quyết UI vẽ thế nào. Đây là `ngTemplateOutlet` + context của Angular: template nhận context để vẽ.

```tsx
// Mouse trong example.tsx: giữ vị trí chuột, người dùng quyết hiện thế nào
function Mouse({ children }: { children: (pos: { x: number; y: number }) => ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      {children(pos)} {/* GỌI function -> JSX; quên gọi là UI trắng */}
    </div>
  );
}
// Dùng: <Mouse>{({ x, y }) => <p>Mouse: {x}, {y}</p>}</Mouse>
// Cùng dữ liệu pos, người A vẽ <p>, người B vẽ tooltip — logic giữ nguyên, UI tự do
```

Vì sao? Vì tách "theo dõi chuột thế nào" (logic, khó, cần test) khỏi "hiện tọa độ ra sao" (UI, đổi theo design). Không có pattern này, mỗi nơi cần tọa độ phải copy `onMouseMove` + state. Biến thể hiện đại là **function-as-children** (`<Mouse>{fn}</Mouse>`) gọn hơn `<Mouse render={fn} />` nhưng cùng bản chất. Type `children: (pos) => ReactNode` chặn lúc compile nếu ai truyền element tĩnh thay vì function.

### 2. Compound components — nhóm chia sẻ state ngầm qua Context
Một nhóm (`Tabs`, `Tabs.Trigger`, `Tabs.Panel`...) hoạt động thống nhất **không cần truyền state qua props từng phần tử** — chia sẻ qua `Context`. Thêm con mới không sửa cha.

```tsx
// example.tsx: Tabs root giữ state, Trigger/Panel tự đọc qua useTabs()
function Tabs({ children, defaultValue = "a" }: { children: ReactNode; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>;
}
function Trigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useTabs(); // không nhận active/setValue qua props — đọc ngầm
  const active = ctx.value === value;
  return <button role="tab" aria-selected={active ? "true" : "false"} onClick={() => ctx.setValue(value)}>{children}</button>;
}
```

Vì sao thắng prop drilling? Vì tabs 5 nút mà truyền `active/onSelect` tay cho từng nút thì thêm nút thứ 6 phải sửa cha + 5 chỗ. Compound chỉ `<Trigger value="c">C</Trigger>` là xong — state đi đường ngầm. Đây là nền tảng của Radix/shadcn (DAY 17): `<Dialog.Root><Dialog.Trigger/><Dialog.Content/></Dialog.Root>`.

### 3. Đối chiếu Angular
Structural directive `ng-template`/`ngTemplateOutlet` cho "template render với context" — render props là bản đồ 1:1 (function nhận context, trả JSX). `ng-container` ↔ fragment. `mat-tab-group` ↔ Radix/shadcn `Tabs` compound — cùng triết lý nhóm chia sẻ state.

### 4. Năm 2026: hooks đủ cho 90%, pattern này cho UI kit
Custom hook trả `{ value, setValue }` + children thường là đủ cho app. Render props/compound còn giá trị cho **UI kit headless** (Radix, shadcn/ui, Ark) nơi một logic (tabs, select, dialog) cần vẽ 10 kiểu UI khác nhau. Đừng dùng cho component nhỏ 1 lần — overhead (function mới mỗi render, context value mới) không đáng.

### 5. Chi phí của render props
Function truyền mới mỗi render (trừ khi Compiler memo) → con re-render mỗi lần cha render dù dữ liệu giống. Chỉ dùng khi cần linh hoạt thật; không thì children element tĩnh + hook là đủ.

### Keyword chính
render props, function-as-children, compound components, `createContext`, `Provider`, `useContext`, `useTabs()` guard, `aria-selected`, headless UI, `useId` cho aria.

## Luồng hoạt động (Flow)
1. `Mouse` mount: `useState({x: 0, y: 0})` khởi tạo vị trí.
2. User di chuột trong vùng `onMouseMove` → `setPos({x: e.clientX, y: e.clientY})` → `Mouse` re-render (state đổi).
3. Trong render mới, `Mouse` gọi `children(pos)` — function người dùng truyền — thu được JSX hiển thị tọa độ mới. Mỗi pixel di là một lần gọi lại.
4. Với Tabs chuẩn: `Tabs` root tạo `useState(defaultValue)`, bọc mọi thứ trong `TabsCtx.Provider value={{value, setValue}}`. State nằm ở root cụm.
5. `Trigger` đọc context qua `useTabs()` (bên trong là `useContext`), so `ctx.value === value` để set `aria-selected="true"/"false"` (chuỗi cho ARIA, không phải boolean).
6. Click Trigger → `ctx.setValue(value)` → Provider value đổi (object mới) → mọi consumer (`Trigger`, `Panel`) re-render.
7. `Panel` check `ctx.value !== value` thì `return null` (không vẽ); khớp thì vẽ `role="tabpanel"`. Không cần prop `active` truyền tay.
8. Bất kỳ component trong Provider đều đọc được — không prop drilling qua tầng trung gian.
9. Nếu đặt Trigger ngoài Provider → `useTabs()` thấy `null` → throw "phải nằm trong <Tabs>" — lộ lỗi scope ngay lúc render thay vì UI câm khó debug.
10. Re-render context cập nhật tất cả consumer — khi dữ liệu lớn/đổi nhanh, tách context value/actions (xem DAY 7) để giảm re-render.
11. Compound chuẩn khai static members (`Tabs.Trigger = Trigger`) để `import { Tabs }` rồi `<Tabs.Trigger>` — IDE gợi ý, API tự tài liệu. Demo gộp file nên để hàm rời cho dễ đọc.
12. Khi rời trang, consumer unmount → React tự bỏ subscriber context; không cần cleanup thủ công vì context do React quản lý (khác store ngoài DAY 8).

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` cùng thư mục (render prop Mouse + compound Tabs chuẩn + bản rút gọn để so sánh):

```tsx
// example.tsx — DAY 6: render prop Mouse + compound Tabs + useTabs() chuẩn
// Mục đích: con giữ state/logic, người dùng quyết UI (render props);
// nhóm component chia sẻ state ngầm qua Context (compound).
import { createContext, useContext, useState, type ReactNode } from "react"; // (1) Context + hook đọc

// ── Render props: children là FUNCTION nhận state của Mouse, trả JSX ──────────
// Người dùng quyết vẽ tọa độ thế nào; Mouse chỉ lo theo dõi chuột.
function Mouse({ children }: { children: (pos: { x: number; y: number }) => ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 }); // (2) State vị trí do Mouse giữ
  return (
    <div
      style={{ border: "1px dashed #888", padding: 16 }}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })} // (3) Di chuột -> setPos -> re-render -> gọi lại children(pos)
    >
      {children(pos)} {/* (4) GỌI function để lấy JSX — quên gọi là UI trắng */}
    </div>
  );
}

// ── Compound: Context là "đường ống ngầm" giữa các phần tử Tabs ───────────────
const TabsCtx = createContext<{ value: string; setValue: (v: string) => void } | null>(null); // (5) Default null ép check scope

// (6) Custom hook an toàn: throw ngay nếu dùng ngoài Provider — lộ lỗi sớm thay vì UI câm.
function useTabs() {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("Tabs.* phải nằm trong <Tabs>");
  return ctx;
}

// (7) Root giữ state tab + cấp Provider cho cả cụm.
function Tabs({ children, defaultValue = "a" }: { children: ReactNode; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>;
}

// (8) Trigger đọc context: tự biết mình active hay không, không cần cha truyền tay.
function Trigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useTabs();
  const active = ctx.value === value;
  return (
    <button role="tab" aria-selected={active ? "true" : "false"} onClick={() => ctx.setValue(value)}>
      {children} {active ? "●" : ""}
    </button>
  );
}

// (9) Panel chỉ hiện khi value khớp — không cần prop active truyền tay.
function Panel({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useTabs();
  if (ctx.value !== value) return null;
  return <div role="tabpanel">{children}</div>;
}

export default function App() {
  const [value, setValue] = useState("a"); // (10) State cho demo rút gọn (bản compound dùng Tabs root ở trên)
  return (
    <>
      {/* (11) Dùng render props: app quyết hiển thị tọa độ thế nào */}
      <Mouse>{({ x, y }) => <p>Mouse: {x}, {y}</p>}</Mouse>
      {/* (12) Compound chuẩn: không prop drilling — Trigger/Panel tự đọc context */}
      <Tabs defaultValue="a">
        <div role="tablist">
          <Trigger value="a">A</Trigger>
          <Trigger value="b">B</Trigger>
        </div>
        <Panel value="a"><p>Nội dung A</p></Panel>
        <Panel value="b"><p>Nội dung B</p></Panel>
      </Tabs>
      {/* (13) Bản rút gọn minh họa Provider trực tiếp (giữ để so sánh với bản Tabs ở trên) */}
      <TabsCtx.Provider value={{ value, setValue }}>
        <button onClick={() => setValue("a")}>A {value === "a" ? "●" : ""}</button>
        <button onClick={() => setValue("b")}>B {value === "b" ? "●" : ""}</button>
      </TabsCtx.Provider>
    </>
  );
}
```

## Giải thích từng phần
- Dòng `children: (pos) => ReactNode`: type render props — children là function, không phải JSX tĩnh. Vì sao type này quan trọng? Vì nó chặn lúc compile khi ai đó `<Mouse><p>Hi</p></Mouse>` (element không gọi được) — TS báo "not callable".
- Dòng `{children(pos)}`: **gọi** function trong JSX. Mỗi lần `pos` đổi, `Mouse` re-render và gọi lại với giá trị mới. Quên gọi (`{children}`) thì React cố render function như element → trắng/báo lỗi. Đây là lỗi số 1 của pattern.
- Dòng `onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}`: `clientX/Y` là tọa độ viewport. Mỗi pixel di là một `setState` → re-render. Prod nên throttle/rAF nếu nặng, demo để thô cho thấy cơ chế.
- Dòng `createContext<... | null>(null)`: default `null` để ép consumer check. Vì sao không default `{ value: "a", setValue: () => {} }` giả? Vì default giả che lỗi scope — Trigger ngoài Provider vẫn "chạy" với giá trị giả, UI sai ngầm khó tìm.
- Khối `useTabs()`: đóng gói `useContext` + throw. Vì sao throw mà không `?.`? Vì `?.` cho UI câm (nút không active, panel không hiện, không ai biết vì sao). Throw cho stack trace chỉ đúng chỗ đặt sai.
- Khối `Tabs({ children, defaultValue })`: root giữ `useState`, cấp Provider. `defaultValue` là uncontrolled initial (giống `defaultValue` input) — muốn controlled thì thêm `value/onValueChange` (xem DAY 3 mẫu).
- Khối `Trigger`: `active = ctx.value === value` tính mỗi render — derived, không state. `aria-selected` truyền chuỗi `"true"/"false"` (chuẩn ARIA) thay vì boolean. `role="tab"` + cha `role="tablist"` cho screen reader hiểu đây là tabs.
- Khối `Panel`: `if (ctx.value !== value) return null` — không vẽ gì khi không active. Vì sao `return null` mà không CSS ẩn? Vì tab ẩn không nên tồn tại trong a11y tree; CSS ẩn vẫn bị screen reader đọc.
- Dòng `<Mouse>{({ x, y }) => <p>...}</Mouse>`: function-as-children — destructure `pos` ngay tham số. Gọn hơn `<Mouse render={(pos) => ...} />` mà cùng bản chất. Chọn một kiểu và nhất quán trong UI kit.
- Quy tắc **Context value mới mỗi render**: `<Provider value={{value, setValue}}>` tạo object mới mỗi lần `Tabs` render → mọi consumer re-render dù `value` không đổi (ví dụ `setValue` cùng giá trị). Compiler 1.0 giảm phí; chưa có Compiler thì tách context value/actions hoặc `useMemo` value.
- Quy tắc **`useId` cho aria**: nhiều instance Tabs cùng trang mà `id`/`aria-controls` hardcode sẽ trùng. `const id = useId()` sinh id SSR-safe, mỗi instance khác nhau.
- Quy tắc **không gọi hook trong render prop callback**: `children(pos)` chỉ được vẽ JSX, không `useState`/`useEffect` bên trong. Vì sao? Vì callback chạy như hàm thường trong render, không phải component — gọi hook ở đó vi phạm rules of hooks.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `ng-template` + `*ngTemplateOutlet` (+ `context`) | render prop / function-as-children (`children(pos)`) | Template với context ↔ function trả JSX theo tham số |
| `ng-container` | `<>` fragment | Không thêm DOM, chỉ nhóm để compound gọn |
| Structural directive tự viết | render props / custom hook | Directive cần compiler API, React chỉ cần hàm |
| Kế thừa service + view đa dạng | compound components + context | State chia sẻ "ngầm" qua Provider |
| `@ContentChild` cho template | props component / children typed | Xem DAY 9 cho duyệt children |
| `mat-tab-group` / `mat-select` | Radix/shadcn `Tabs`/`Select` (compound) | Cùng triết lý nhóm + headless |
| `ngTemplateOutletContext` | tham số function children (`pos`, `{open, toggle}`) | Truyền dữ liệu vào template/function |
| `ViewContainerRef.createEmbeddedView` | render props / portal | Tạo view động theo dữ liệu |
| `@Input` của content projected | render props truyền dữ liệu xuống con | Không có `@Input` ngầm, function tham số là đủ |
| `ng-content` bọc structural directive | compound + context | State chia sẻ ngầm thay vì input drilling |

## Lỗi thường gặp (Common pitfalls)

### 1. Quên gọi function render props
```tsx
// ❌ SAI: truyền function nhưng render như element — UI trắng
function Mouse({ children }: { children: (p: Pos) => ReactNode }) {
  const [pos] = useState({ x: 0, y: 0 });
  return <div>{children}</div>; // children là function, không phải JSX
}
```
```tsx
// ✅ ĐÚNG: gọi với dữ liệu
return <div>{children(pos)}</div>;
```

### 2. Truyền element thay vì function
```tsx
// ❌ SAI: mất khả năng nhận pos — TS báo nếu type đúng
<Mouse><p>Hi</p></Mouse>
```
```tsx
// ✅ ĐÚNG: truyền function, type chặn lúc compile
<Mouse>{({ x, y }) => <p>Mouse: {x}, {y}</p>}</Mouse>
```

### 3. Context value object mới mỗi render → consumer re-render thừa
```tsx
// ❌ SAI (khi chưa Compiler, data lớn): mọi consumer render lại dù value không đổi
<TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>
```
```tsx
// ✅ ĐÚNG: Compiler 1.0 tự lo; chưa có thì tách context hoặc useMemo
const value = useMemo(() => ({ value, setValue }), [value]); // setValue ổn định
// Hoặc tách TabsValueContext + TabsActionsContext
```

### 4. Compound thiếu check null → crash khó hiểu ngoài Provider
```tsx
// ❌ SAI: useContext trực tiếp, ngoài Provider thì ctx null -> crash "cannot read value"
const ctx = useContext(TabsCtx); ctx.value;
```
```tsx
// ✅ ĐÚNG: custom hook throw với thông điệp rõ (như useTabs trong ví dụ)
function useTabs() { const ctx = useContext(TabsCtx); if (!ctx) throw new Error("Tabs.* phải nằm trong <Tabs>"); return ctx; }
```

### 5. Quên `role`/`aria-selected` → a11y vỡ
```tsx
// ❌ SAI: div onClick — keyboard không focus, screen reader không hiểu
<div onClick={() => setValue("a")}>A</div>
```
```tsx
// ✅ ĐÚNG: button + role + aria chuỗi (như Trigger trong ví dụ)
<button role="tab" aria-selected={active ? "true" : "false"} onClick={() => setValue("a")}>A</button>
// Đầy đủ: tablist/tab/tabpanel + aria-controls + keyboard ArrowLeft/Right
```

### 6. Gọi hook bên trong render prop callback
```tsx
// ❌ SAI: hook trong hàm thường — vi phạm rules of hooks
<Mouse>{(pos) => { const [x] = useState(0); return <p>{pos.x}</p>; }}</Mouse>
```
```tsx
// ✅ ĐÚNG: callback chỉ vẽ JSX; hook (nếu cần) nằm ở component chứa <Mouse>
function Wrap() { const [x] = useState(0); return <Mouse>{(pos) => <p>{pos.x + x}</p>}</Mouse>; }
```

### 7. Đặt Trigger ngoài Provider rồi dùng `?.` che lỗi
```tsx
// ❌ SAI: UI câm — nút hiện nhưng không active bao giờ, không lỗi để tìm
{useContext(TabsCtx)?.value === "a" ? <p>A</p> : <p>B</p>}
```
```tsx
// ✅ ĐÚNG: useTabs() throw để lộ ngay chỗ đặt sai (xem ví dụ chuẩn)
```

## Best practices / Mẹo
- **Chọn đúng bậc:** props (nông, 1-2 tầng) → render props (một logic nhiều UI) → compound + context (nhóm chia sẻ state) → store (toàn app hay đổi). Vì sao bậc? Vì mỗi bậc thêm chi phí (function/context/store), chỉ lên bậc khi bậc dưới rối.
- Đặt tên prop render rõ: `render`/`renderItem` cho prop tên, giữ `children` cho function-as-children. Vì sao? Để người đọc nhìn tên là biết "đây là function, phải gọi".
- Compound khai static members (`Tabs.Trigger`, `Tabs.Panel`) để IDE gợi ý và API tự tài liệu. Vì sao? Vì `import { Tabs }` một lần có cả nhóm, không import rời 4 hàm.
- UI kit theo **headless**: tách hành vi (compound + context) khỏi style (class qua props). Vì sao? Để cùng `Tabs` dùng được cho 3 design khác nhau mà không fork logic.
- Cung cấp `useTabs()` check null + JSDoc ví dụ ngắn ("children là function nhận pos"). Vì sao? Vì người mới không đoán được `children` là function nếu không đọc type.
- Cân nhắc `useId` cho `id`/`aria-controls` để nhiều instance không trùng (SSR an toàn). Vì sao? Vì hardcode `id="tab-1"` mà trang có 2 Tabs là trùng, aria trỏ sai panel.

## Bài tập nhỏ
1. Hoàn chỉnh `Tabs` compound: `Tabs`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Panel` với ARIA đầy đủ (`tablist`/`tab`/`tabpanel`, `aria-selected`, `aria-controls` bằng `useId`).
2. Viết `Select` headless bằng render props: `children({ open, toggle, select })`; dùng 2 kiểu UI khác nhau (dropdown + modal) chung một logic.
3. Thêm keyboard nav (ArrowLeft/Right) cho Tabs — focus di theo phím, `aria-selected` cập nhật.
4. Tách `TabsActionsContext` và `TabsValueContext` — đo re-render giảm khi chỉ đổi actions.
5. Viết `Accordion` compound dùng cùng pattern (root + Item + Trigger + Panel) — so sánh với Tabs khác gì.
6. Viết `useTabs()` throw khi thiếu Provider và cố ý đặt `Trigger` ngoài — quan sát thông điệp lỗi rõ hơn `?.` thế nào.

## Reference
- https://react.dev/learn/passing-props-to-a-component
- https://react.dev/learn/scaling-up-with-reducer-and-context
- https://react.dev/reference/react/createContext
- https://www.radix-ui.com/primitives
