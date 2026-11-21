# DAY 6: RENDER PROPS & COMPOUND COMPONENTS

## Mục tiêu bài học
- Hiểu 2 pattern cao cấp thay cho `ng-template` + `*ngTemplateOutlet`: **render props** (prop là function) và **compound components** (chia sẻ state ngầm qua Context).
- Biết khi nào pattern này thắng hooks thuần — xây UI kit / headless component tái sử dụng.
- Code được bộ `Tabs` compound có accessibility cơ bản (`role="tablist"`, `aria-selected`).

## Khái niệm cốt lõi (Core)

### 1. Render props — prop là function nhận dữ liệu, trả JSX
Component con giữ state/logic, gọi `render(data)` (hoặc `children(data)`); người dùng quyết UI vẽ thế nào. Đây là `ngTemplateOutlet` + context của Angular: template nhận context để vẽ.

> 📄 **Code ví dụ:** [`examples/01-1-render-props-prop-la-function-nhan-du.tsx`](examples/01-1-render-props-prop-la-function-nhan-du.tsx)

Vì sao? Vì tách "theo dõi chuột thế nào" (logic, khó, cần test) khỏi "hiện tọa độ ra sao" (UI, đổi theo design). Không có pattern này, mỗi nơi cần tọa độ phải copy `onMouseMove` + state. Biến thể hiện đại là **function-as-children** (`<Mouse>{fn}</Mouse>`) gọn hơn `<Mouse render={fn} />` nhưng cùng bản chất. Type `children: (pos) => ReactNode` chặn lúc compile nếu ai truyền element tĩnh thay vì function. Ví von: component giữ logic như bếp nấu sẵn món, render prop là cách bạn trình bày món lên đĩa theo gu riêng.

> **Tóm gọn 1 câu:** Render props = logic ở bếp, đĩa (UI) do bạn chọn — một nồi cà ri, trăm kiểu bày bàn.

### 2. Compound components — nhóm chia sẻ state ngầm qua Context
Một nhóm (`Tabs`, `Tabs.Trigger`, `Tabs.Panel`...) hoạt động thống nhất **không cần truyền state qua props từng phần tử** — chia sẻ qua `Context`. Thêm con mới không sửa cha.

> 📄 **Code ví dụ:** [`examples/02-2-compound-components-nhom-chia-se-state-ngam.tsx`](examples/02-2-compound-components-nhom-chia-se-state-ngam.tsx)

Vì sao thắng prop drilling? Vì tabs 5 nút mà truyền `active/onSelect` tay cho từng nút thì thêm nút thứ 6 phải sửa cha + 5 chỗ. Compound chỉ `<Trigger value="c">C</Trigger>` là xong — state đi đường ngầm. Đây là nền tảng của Radix/shadcn (DAY 17): `<Dialog.Root><Dialog.Trigger/><Dialog.Content/></Dialog.Root>`.

> **Tóm gọn 1 câu:** Compound = các mảnh ghép chung mạch điện ngầm (Context): cha cấp điện, con tự cắm — thêm mảnh mới không phải kéo lại dây.

### 3. Đối chiếu Angular
Structural directive `ng-template`/`ngTemplateOutlet` cho "template render với context" — render props là bản đồ 1:1 (function nhận context, trả JSX). `ng-container` ↔ fragment. `mat-tab-group` ↔ Radix/shadcn `Tabs` compound — cùng triết lý nhóm chia sẻ state.

### 4. Năm 2026: hooks đủ cho 90%, pattern này cho UI kit
Custom hook trả `{ value, setValue }` + children thường là đủ cho app. Render props/compound còn giá trị cho **UI kit headless** (Radix, shadcn/ui, Ark) nơi một logic (tabs, select, dialog) cần vẽ 10 kiểu UI khác nhau. Đừng dùng cho component nhỏ 1 lần — overhead (function mới mỗi render, context value mới) không đáng.

> **Tóm gọn 1 câu:** Hooks là cơm nhà cho app thường; render props/compound là bếp riêng cho UI kit bán "cùng một món, trăm kiểu trình bày".

### 5. Chi phí của render props
Function truyền mới mỗi render (trừ khi Compiler memo) → con re-render mỗi lần cha render dù dữ liệu giống. Chỉ dùng khi cần linh hoạt thật; không thì children element tĩnh + hook là đủ.

> **Tóm gọn 1 câu:** Mỗi render là một "lời mời mới" — gọi function trong JSX là gọi lại cả buổi tiệc, nên chỉ mời khi thật cần.

### Keyword chính
render props, function-as-children, compound components, `createContext`, `Provider`, `useContext`, `useTabs()` guard, `aria-selected`, headless UI, `useId` cho aria.

## Luồng hoạt động (Flow)
Mục này đi qua 12 bước theo vòng đời thật của `Mouse` và `Tabs`: từ mount, di chuột, click trigger, cho tới khi consumer rời trang.
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

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

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
Mục này dịch từng khái niệm template/directive của Angular sang hai pattern React của bài — đọc cột Ghi chú để thấy React thay "compiler magic" bằng hàm thuần + Context.
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

> **Cách đọc bảng này:** mỗi dòng là một cặp cũ ↔ mới; dòng 1 và dòng 2 là cặp dùng nhiều nhất (template-with-context ↔ function children, container ↔ fragment) — phần còn lại là đối chiếu cho người đến từ Angular deep-dive.

## Lỗi thường gặp (Common pitfalls)

Mục này gom 7 cái bẫy của hai pattern — phần lớn xoay quanh "quên gọi function", "lạm dụng context" và "che lỗi scope".

### 1. Quên gọi function render props
> 📄 **Code ví dụ:** [`examples/04-1-quen-goi-function-render-props.tsx`](examples/04-1-quen-goi-function-render-props.tsx)
> 📄 **Code ví dụ:** [`examples/05-1-quen-goi-function-render-props.tsx`](examples/05-1-quen-goi-function-render-props.tsx)

### 2. Truyền element thay vì function
> 📄 **Code ví dụ:** [`examples/06-2-truyen-element-thay-vi-function.tsx`](examples/06-2-truyen-element-thay-vi-function.tsx)
> 📄 **Code ví dụ:** [`examples/07-2-truyen-element-thay-vi-function.tsx`](examples/07-2-truyen-element-thay-vi-function.tsx)

### 3. Context value object mới mỗi render → consumer re-render thừa
> 📄 **Code ví dụ:** [`examples/08-3-context-value-object-moi-moi-render-consumer.tsx`](examples/08-3-context-value-object-moi-moi-render-consumer.tsx)
> 📄 **Code ví dụ:** [`examples/09-3-context-value-object-moi-moi-render-consumer.tsx`](examples/09-3-context-value-object-moi-moi-render-consumer.tsx)

### 4. Compound thiếu check null → crash khó hiểu ngoài Provider
> 📄 **Code ví dụ:** [`examples/10-4-compound-thieu-check-null-crash-kho-hieu.tsx`](examples/10-4-compound-thieu-check-null-crash-kho-hieu.tsx)
> 📄 **Code ví dụ:** [`examples/11-4-compound-thieu-check-null-crash-kho-hieu.tsx`](examples/11-4-compound-thieu-check-null-crash-kho-hieu.tsx)

### 5. Quên `role`/`aria-selected` → a11y vỡ
> 📄 **Code ví dụ:** [`examples/12-5-quen-role-aria-selected-a11y-vo.tsx`](examples/12-5-quen-role-aria-selected-a11y-vo.tsx)
> 📄 **Code ví dụ:** [`examples/13-5-quen-role-aria-selected-a11y-vo.tsx`](examples/13-5-quen-role-aria-selected-a11y-vo.tsx)

### 6. Gọi hook bên trong render prop callback
> 📄 **Code ví dụ:** [`examples/14-6-goi-hook-ben-trong-render-prop-callback.tsx`](examples/14-6-goi-hook-ben-trong-render-prop-callback.tsx)
> 📄 **Code ví dụ:** [`examples/15-6-goi-hook-ben-trong-render-prop-callback.tsx`](examples/15-6-goi-hook-ben-trong-render-prop-callback.tsx)

### 7. Đặt Trigger ngoài Provider rồi dùng `?.` che lỗi
> 📄 **Code ví dụ:** [`examples/16-7-at-trigger-ngoai-provider-roi-dung-che.tsx`](examples/16-7-at-trigger-ngoai-provider-roi-dung-che.tsx)
> 📄 **Code ví dụ:** [`examples/17-7-at-trigger-ngoai-provider-roi-dung-che.tsx`](examples/17-7-at-trigger-ngoai-provider-roi-dung-che.tsx)

## Best practices / Mẹo
- **Chọn đúng bậc:** props (nông, 1-2 tầng) → render props (một logic nhiều UI) → compound + context (nhóm chia sẻ state) → store (toàn app hay đổi). Vì sao bậc? Vì mỗi bậc thêm chi phí (function/context/store), chỉ lên bậc khi bậc dưới rối.
- Đặt tên prop render rõ: `render`/`renderItem` cho prop tên, giữ `children` cho function-as-children. Vì sao? Để người đọc nhìn tên là biết "đây là function, phải gọi".
- Compound khai static members (`Tabs.Trigger`, `Tabs.Panel`) để IDE gợi ý và API tự tài liệu. Vì sao? Vì `import { Tabs }` một lần có cả nhóm, không import rời 4 hàm.
- UI kit theo **headless**: tách hành vi (compound + context) khỏi style (class qua props). Vì sao? Để cùng `Tabs` dùng được cho 3 design khác nhau mà không fork logic.
- Cung cấp `useTabs()` check null + JSDoc ví dụ ngắn ("children là function nhận pos"). Vì sao? Vì người mới không đoán được `children` là function nếu không đọc type.
- Cân nhắc `useId` cho `id`/`aria-controls` để nhiều instance không trùng (SSR an toàn). Vì sao? Vì hardcode `id="tab-1"` mà trang có 2 Tabs là trùng, aria trỏ sai panel.

> **Tóm gọn 1 câu:** Chọn pattern theo "bậc thang": props → render props → compound → store — chỉ lên bậc trên khi bậc dưới rối, đừng dùng dao mổ trâu giết gà.

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
