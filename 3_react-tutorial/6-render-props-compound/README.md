# DAY 6: RENDER PROPS & COMPOUND COMPONENTS

## Mục tiêu bài học
- Hiểu 2 pattern cao cấp thay cho `ng-template` + `*ngTemplateOutlet`: **render props** (prop là function) và **compound components** (chia sẻ state ngầm qua Context).
- Biết khi nào pattern này thắng hooks thuần — xây UI kit / headless component tái sử dụng.
- Code được bộ `Tabs` compound có accessibility cơ bản (`role="tablist"`, `aria-selected`).

## Khái niệm cốt lõi (Core)
- **Render props:** truyền một **function nhận dữ liệu từ component cha và trả về JSX**. Component con giữ state/logic, gọi `render(pos)`; người dùng quyết định UI. Đây là `ngTemplateOutlet` + context của Angular.
- **Biến thể hiện đại: function-as-children** — `{({ x, y }) => <p/>}`. Cùng ý tưởng, đọc tự nhiên hơn vì vẫn đúng cú pháp `children`.
- **Compound components:** một nhóm component (Tabs, List.Trigger, List.Panel...) hoạt động thống nhất **không cần truyền state qua props từng phần tử** — chia sẻ state qua `Context`.
- **Đối chiếu Angular:** structural directive `ng-template`/`ngTemplateOutlet` cho phép "template render với context" — render props là bản đồ 1:1. `ng-container` ↔ fragment.
- **2026:** 90% trường hợp hooks (custom hook trả state + handler) là đủ; render props/compound còn giá trị cho **UI kit headless** (Radix, shadcn/ui, Ark).
- **Render props có chi phí:** function mới mỗi render (trừ khi Compiler memo) — dùng khi cần linh hoạt thật.
- **Compound + Context tách trách nhiệm:** cha cấp state, các con đọc cùng context; thêm con mới không phải sửa cha.
- **Keyword chính:** render props, function-as-children, compound components, `createContext`, `Provider`, `useContext`, `aria-selected`, headless UI.

## Luồng hoạt động (Flow)
1. `Mouse` mount: `useState({x: 0, y: 0})` khởi tạo vị trí chuột.
2. User di chuột trong vùng `onMouseMove` → `setPos({x: e.clientX, y: e.clientY})` → `Mouse` re-render.
3. Trong render, `Mouse` gọi `children(pos)` — function người dùng truyền — thu được JSX hiển thị tọa độ.
4. Với Tabs: `App` tạo `useState("a")`, bọc mọi thứ trong `TabsCtx.Provider value={{value, setValue}}`.
5. `Tabs.Trigger` đọc context qua `useContext(TabsCtx)`, so `ctx.value === value` để set `aria-selected`.
6. Click Trigger → `ctx.setValue(value)` → Provider value đổi → mọi consumer re-render.
7. Bất kỳ component trong Provider đọc được state — không prop drilling.
8. Panel hiển thị theo `value` hiện tại.
9. Nếu đặt Trigger ngoài Provider → `useContext` trả `null` → crash nếu không check.
10. Re-render context cập nhật tất cả consumer — cân nhắc tách context khi dữ liệu lớn.
11. Compound chuẩn thường khai `Tabs.List`, `Tabs.Trigger`, `Tabs.Panel` là static members — IDE gợi ý và API tự tài liệu.
12. Khi rời trang, consumer unmount → không còn subscriber; không cần cleanup thủ công vì context do React quản lý.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 6: render prop Mouse + compound Tabs (rút gọn)
import { createContext, useContext, useState, type ReactNode } from "react";

// --- Render props: children là function nhận state của Mouse ---
function Mouse({ children }: { children: (pos: { x: number; y: number }) => ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div
      style={{ border: "1px dashed #888", padding: 16 }}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
    >
      {children(pos)} {/* Gọi function -> JSX; UI do người dùng tự vẽ */}
    </div>
  );
}

// --- Compound: Context là "đường ống ngầm" giữa các phần tử Tabs ---
const TabsCtx = createContext<{ value: string; setValue: (v: string) => void } | null>(null);

export default function App() {
  // State tab nằm ở root của cụm compound
  const [value, setValue] = useState("a");
  return (
    <>
      {/* Dùng render props: app quyết định hiển thị tọa độ thế nào */}
      <Mouse>{({ x, y }) => <p>Mouse: {x}, {y}</p>}</Mouse>
      {/* Compound: các button + panel chia sẻ state qua context */}
      <TabsCtx.Provider value={{ value, setValue }}>
        <button onClick={() => setValue("a")}>A {value === "a" ? "●" : ""}</button>
        <button onClick={() => setValue("b")}>B {value === "b" ? "●" : ""}</button>
        {useContext(TabsCtx)?.value === "a" ? <p>Nội dung A</p> : <p>Nội dung B</p>}
      </TabsCtx.Provider>
    </>
  );
}
```

## Giải thích từng phần
- `children: (pos) => ReactNode`: kiểu render props — children là function, không phải JSX tĩnh.
- `{children(pos)}`: gọi function trong JSX. Mỗi lần `pos` đổi, `Mouse` re-render và gọi lại children với giá trị mới.
- `createContext<{value, setValue} | null>(null)`: context default `null` — ép consumer check null.
- `<TabsCtx.Provider value={{value, setValue}}>`: "DI scoped" — con trong subtree đọc được giá trị không qua props.
- `useContext(TabsCtx)?.value`: đọc context; `?.` tránh crash khi ngoài Provider (demo) — bản đủ dùng custom hook throw.
- **Function-as-children vs render prop có tên:** `<Mouse>{fn}</Mouse>` gọn hơn `<Mouse render={fn}/>`; cùng bản chất.
- **Compound đầy đủ hơn:** khai `Tabs.List`, `Tabs.Trigger`, `Tabs.Panel` là static members, gọi `useTabs()` check null.
- **A11y:** thêm `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, hỗ trợ phím mũi tên.
- **Context value mới mỗi render:** trước Compiler gây re-render mọi consumer; Compiler 1.0 tối ưu.
- **Tách context:** nếu state đổi thường xuyên, tách context actions khỏi context value để giảm re-render.
- **Render props và memo:** function truyền mới mỗi render làm con re-render; Compiler xử lý.
- **Headless:** compound tách hành vi khỏi style — đúng tinh thần Radix/Ark (DAY 17).
- **`useId` cho `id`/`aria-controls`:** sinh id SSR-safe, tránh trùng khi nhiều instance Tabs trên cùng trang.
- **Kiểm tra ngoài Provider:** trong bản đầy đủ, `useTabs()` nên throw khi context `null` — bắt lỗi scope sớm (DAY 7).

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `ng-template` + `*ngTemplateOutlet` (+ `context`) | render prop / function-as-children | Template với context ↔ function trả JSX |
| `ng-container` | `<>` fragment | Không thêm DOM |
| Structural directive (tự viết) | render props / custom hook | Directive cần compiler API |
| Kế thừa service + view đa dạng | compound components + context | State chia sẻ "ngầm" |
| `@ContentChild` cho template | props component / children typed | Xem DAY 9 |
| `mat-tab-group` | Radix/shadcn `Tabs` (compound) | Cùng triết lý compound |
| `ngTemplateOutletContext` | tham số function children | Truyền dữ liệu vào template |
| `ViewContainerRef.createEmbeddedView` | render props / portal | Tạo view động |
| `@Input` của content projected | render props truyền dữ liệu xuống con | Không có cơ chế `@Input` ngầm |
| `ng-content` bọc structural directive | compound + context | State chia sẻ "ngầm" |

## Lỗi thường gặp (Common pitfalls)
- **Quên gọi function render props** (`{children}` thay `{children(pos)}`) → UI không hiện. → Fix: luôn gọi với dữ liệu.
- **Tạo element thay vì function** khi truyền → mất khả năng nhận `pos`. → Fix: kiểu `children: (pos) => ReactNode` chặn lúc compile.
- **Context value object mới mỗi render** → consumer re-render vô tội vạ. → Fix: Compiler tự xử lý; hoặc tách context/`useMemo`.
- **Compound thiếu check null** khi Trigger ngoài Provider → crash. → Fix: custom hook throw (DAY 7).
- **Quên `role`/`aria-selected`** → keyboard a11y vỡ. → Fix: thêm ARIA hoặc dùng headless lib.
- **Lạm dụng pattern cho component nhỏ** → code rối. → Fix: custom hook + children thường trước.
- **Gọi `useContext` trong hàm render con** không phải component → vi phạm rules of hooks. → Fix: chỉ gọi trong component/hook.
- **Quên `key` khi map Trigger** → diff sai. → Fix: key ổn định.
- **Truyền state xuống nhiều tầng vẫn dùng prop** → nên compound/context. → Fix: bọc Provider.
- **Render prop trả về array không key** → warning. → Fix: key trong map.
- **Đặt Trigger ngoài Provider** → `useContext` trả `null`, `?.` che lỗi → UI "câm". → Fix: custom hook throw để lộ ngay.
- **Gọi hook bên trong render prop callback** → vi phạm rules of hooks. → Fix: render prop chỉ vẽ JSX, không gọi hook bên trong.

## Best practices / Mẹo
- **Chọn đúng bậc:** props (nông) → render props (linh hoạt) → compound + context (nhóm) → store (toàn app).
- Đặt tên prop render props rõ: `render`/`renderItem`; giữ `children` cho function-as-children.
- Compound nên khai static members (`Tabs.List = ...`) để IDE gợi ý.
- UI kit: theo chuẩn **headless** — tách logic khỏi style.
- Cung cấp custom hook `useTabs()` check null cho consumer.
- Document pattern trong JSDoc để người mới biết children là function.
- Cân nhắc `useId` cho `id`/`aria-controls` ổn định (SSR an toàn).
- Với compound, export cả nhóm như một object (`Tabs.List`) để API gọn và dễ khám phá.
- Pattern render props/compound nên đi kèm ví dụ ngắn trong JSDoc — người mới khó đoán `children` là function.

## Bài tập nhỏ
1. Hoàn chỉnh `Tabs` compound: `Tabs`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Panel` với ARIA đầy đủ.
2. Viết `Select` headless bằng render props: `children({ open, toggle, select })`; dùng 2 kiểu UI khác nhau.
3. Thêm keyboard nav (ArrowLeft/Right) cho Tabs.
4. Tách `TabsActionsContext` và `TabsStateContext` — quan sát re-render giảm.
5. Viết `Accordion` compound dùng cùng context pattern.
6. Viết `useTabs()` throw khi thiếu Provider và dùng trong `Tabs.Trigger`/`Tabs.Panel` — quan sát thông điệp lỗi khi đặt sai chỗ.

## Reference
- https://react.dev/learn/passing-props-to-a-component
- https://react.dev/learn/scaling-up-with-reducer-and-context
- https://react.dev/reference/react/createContext
- https://www.radix-ui.com/primitives