# Thuật ngữ React — Glossary toàn `3_react-tutorial` (DAY 0 → 21)

> Từ điển tra cứu nhanh cho cả track `3_react-tutorial`.
> **Cách dùng:** bấm vào từng DAY để mở bảng tra cứu — cột *Ví dụ* chỉ giữ đoạn code ngắn nhất đủ hiểu.
> Cần chi tiết đầy đủ (luồng hoạt động, pitfalls, bài tập) thì mở README của DAY đó.

## Mục lục

| DAY | Chủ đề | Mở nhanh |
|---|---|---|
| 0 | [Khám phá React + Vite](0-react-explore/) | [Bảng thuật ngữ](#day-0--khám-phá-react--vite) |
| 1 | [JSX & Hiển thị dữ liệu](1-jsx-data-display/) | [Bảng thuật ngữ](#day-1--jsx--hiển-thị-dữ-liệu) |
| 2 | [Render có điều kiện & Danh sách](2-conditional-list-rendering/) | [Bảng thuật ngữ](#day-2--render-có-điều-kiện--danh-sách) |
| 3 | [Props & Tương tác](3-props-interaction/) | [Bảng thuật ngữ](#day-3--props--tương-tác) |
| 4 | [Ref](4-ref-template-variable/) | [Bảng thuật ngữ](#day-4--ref) |
| 5 | [Children / Slot](5-children-slot/) | [Bảng thuật ngữ](#day-5--children--slot) |
| 6 | [Render props & Compound](6-render-props-compound/) | [Bảng thuật ngữ](#day-6--render-props--compound) |
| 7 | [Context](7-context-basic/) | [Bảng thuật ngữ](#day-7--context) |
| 8 | [External store](8-external-store/) | [Bảng thuật ngữ](#day-8--external-store) |
| 9 | [Children API](9-children-api/) | [Bảng thuật ngữ](#day-9--children-api) |
| 10 | [Memo & Format](10-memo-format/) | [Bảng thuật ngữ](#day-10--memo--format) |
| 11 | [Forms](11-forms/) | [Bảng thuật ngữ](#day-11--forms) |
| 12 | [Data fetching](12-data-fetching/) | [Bảng thuật ngữ](#day-12--data-fetching) |
| 13 | [Lazy + Suspense](13-lazy-suspense/) | [Bảng thuật ngữ](#day-13--lazy--suspense) |
| 14 | [Router](14-router/) | [Bảng thuật ngữ](#day-14--router) |
| 15 | [Lifecycle & Effects](15-lifecycle-effects/) | [Bảng thuật ngữ](#day-15--lifecycle--effects) |
| 16 | [Custom hooks](16-custom-hooks/) | [Bảng thuật ngữ](#day-16--custom-hooks) |
| 17 | [Thư viện UI](17-ui-libraries/) | [Bảng thuật ngữ](#day-17--thư-viện-ui) |
| 18 | [i18n](18-i18n/) | [Bảng thuật ngữ](#day-18--i18n) |
| 19 | [Animations](19-animations/) | [Bảng thuật ngữ](#day-19--animations) |
| 20 | [Drag & Drop](20-drag-drop/) | [Bảng thuật ngữ](#day-20--drag--drop) |
| 21 | [Testing & E2E](21-testing-e2e/) | [Bảng thuật ngữ](#day-21--testing--e2e) |

---

## DAY 0 — Khám phá React + Vite

<details>
<summary><b>11 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| `React` | UI library chỉ lo render view; HTTP/Router/Forms do ecosystem đảm nhận (khác Angular đóng gói sẵn) | `function App() { return <h1>Hello</h1>; }` |
| `Component` | Function trả về JSX, đơn vị UI nhỏ nhất; tên PascalCase để phân biệt thẻ HTML | `export default function App() { ... }` |
| `JSX` | Cú pháp mở rộng của TS, biên dịch thành `jsx(type, props)` — object mô tả UI, không phải HTML | `<h3>{name}</h3>` → `jsx("h3", {...})` |
| `Vite` | Build tool + dev server: dev dùng esbuild + ESM gốc (khởi động tức thì), build dùng Rollup | `npm run dev` / `npm run build` / `npm run preview` |
| `HMR` | Vá nóng module vừa sửa, **giữ nguyên state** (khác F5 reload mất hết) | Sửa `App.tsx` → trình duyệt tự cập nhật |
| `react-ts` | Template `npm create vite -- --template react-ts`: sinh sẵn `index.html`, `main.tsx`, `App.tsx`, configs | `npm create vite@latest my-app -- --template react-ts` |
| `Entry point` | Chuỗi kép: `index.html` (`#root` + script) → `main.tsx` (`createRoot.render`) → cây từ `App` | `<div id="root">` + `src="/src/main.tsx"` |
| `createRoot` | API React 18+ gắn root React vào node DOM; gọi **một lần duy nhất** | `createRoot(document.getElementById("root")!).render(<App />)` |
| `.render()` | Mount lần đầu thành DOM thật; mọi cập nhật sau do state/hooks re-render | Chỉ gọi 1 lần, không gọi lại khi update |
| `StrictMode` | Kiểm tra dev-only: render/effect 2 lần để lộ side-effect thiếu cleanup; prod không ảnh hưởng | `<StrictMode><App /></StrictMode>` |
| `VITE_*` | Biến môi trường Vite qua `import.meta.env`; chỉ `VITE_*` lộ ra client — cấm secret | `import.meta.env.VITE_API_URL` |

</details>

---

## DAY 1 — JSX & Hiển thị dữ liệu

<details>
<summary><b>9 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| `{expression}` | Cửa duy nhất đưa TS vào JSX; chỉ nhận **expression** (`if`/`for` là statement nên cấm) | `<p>Next year: {user.age + 1}</p>` |
| Attribute binding | Gán `{expr}` trực tiếp, không ngoặc vuông; `class`→`className`, `for`→`htmlFor`, `style` là object camelCase | `<img src={url} />` · `style={{ color: "red" }}` |
| Event binding (`on*`) | Nhận **tham chiếu hàm**; cần tham số thì bọc arrow | `onClick={fn}` · `onClick={() => fn(x)}` |
| `SyntheticEvent` | Wrapper thống nhất của React quanh event browser; TS tự suy kiểu từ context | `(e) => setName(e.target.value)` |
| Controlled input | `value` + `onChange`, state là nguồn duy nhất (thay `[(ngModel)]`); thiếu `onChange` → frozen | `<input value={name} onChange={...} />` |
| Uncontrolled input | `defaultValue` + `ref`, DOM tự giữ giá trị; hợp form lớn tránh re-render mỗi phím | `<input defaultValue={name} />` |
| `Fragment` | `<>...</>` nhóm nhiều element không thêm node DOM (≈ `ng-container`) | `return (<><h1/><p/></>)` |
| Derived data | Tính được từ state/props thì tính khi render, đừng `useState` dư gây lệch | `const nextYear = age + 1` |
| Batching + functional update | React gộp `setState` cùng event thành 1 render; update theo giá trị cũ dùng dạng hàm | `setCount((c) => c + 1)` |

</details>

---

## DAY 2 — Render có điều kiện & Danh sách

<details>
<summary><b>7 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| Conditional rendering | Không directive — dùng JS trên giá trị JSX | `&&` · `?:` · early `return` |
| `&&` | Nhánh có/không; vế trái phải là **boolean** (`{count && ...}` in ra "0" khi count = 0) | `{unread > 0 && <span/>}` |
| Ternary `?:` | Đủ 2 nhánh nội dung + empty state trong một biểu thức | `{empty ? <li>Hết!</li> : list.map(...)}` |
| Early `return` / `null` | Chặn cả component trước `return` chính; `null` = không render (tránh `undefined`) | `if (!isLogin) return <p>...</p>` |
| `.map()` | Biến mảng dữ liệu thành mảng JSX; lọc trước (`filter().map()`), tính ra biến trước `return` | `todos.map((t) => <li key={t.id}>)` |
| `key` | Identity cho reconciliation (≈ `track` của `@for`); id ổn định, cấm `key={index}` khi list đổi | `key={t.id}` |
| `reconciliation` | Diff cây cũ/mới: giữ node cùng key, mount key mới, unmount key mất, di chuyển node đổi chỗ | Tự động sau mỗi render |

</details>

---

## DAY 3 — Props & Tương tác

<details>
<summary><b>4 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| `props` | Argument của function component, dữ liệu một chiều cha → con (≈ `@Input`); read-only, snapshot mỗi render | `function C({ name }: { name: string })` |
| Default value | Mặc định qua destructuring (`greeting = "Hi"`); `defaultProps` đã bị gỡ | `{ name, age = 0 }: Props` |
| Callback prop | Prop hàm để con báo sự kiện lên cha (≈ `@Output` + `EventEmitter`); tên quy ước `on*`; payload là dữ liệu | `onAdd: (step: number) => void` |
| Lifting state up | Đưa `useState` lên cha chung gần nhất khi nhiều con chia sẻ dữ liệu đổi theo thời gian | Cha giữ `count`, con nhận `count` + `onAdd` |

</details>

---

## DAY 4 — Ref

<details>
<summary><b>4 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| `useRef` / `current` | Object `{ current }` ổn định qua mọi render; đổi `.current` **không re-render** | `const r = useRef<HTMLInputElement>(null)` |
| 3 công dụng ref | Trỏ DOM (`focus`/đo/scroll) · giữ mutable (timer id) · lấy giá trị mới nhất (chống stale closure) | `r.current?.focus()` · `idRef.current = setInterval(...)` |
| Ref là prop (R19) | `<MyInput ref={...}>` không cần `forwardRef` nữa (giữ cho code cũ) | `function MyInput({ ref }: { ref: Ref })` |
| Escape hatch + `useImperativeHandle` | Ref là đường vòng quanh React, chỉ dùng khi chưa có API trừu tượng; con lộ API chọn lọc qua `useImperativeHandle` | Dùng khiêm tốn |

</details>

---

## DAY 5 — Children / Slot

<details>
<summary><b>3 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| `children` | Prop đặc biệt: JSX giữa thẻ mở/đóng; cha quyết nội dung, con quyết layout; kiểu `ReactNode` | `<Card><p>Nội dung</p></Card>` |
| Named slots | Không có `select` như `ng-content` — tự định nghĩa nhiều props `ReactNode` | `<Layout header={...} sidebar={...}>` |
| Composition > inheritance | Không thừa kế component — bọc hoặc cấu hình qua props; nền tảng UI kit tái dùng | `<Card><SpecialContent /></Card>` |

</details>

---

## DAY 6 — Render props & Compound

<details>
<summary><b>3 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| Render props | Prop là function nhận dữ liệu từ cha, trả JSX (≈ `ngTemplateOutlet` + context); con giữ logic, user quyết UI | `<Mouse render={(pos) => <p>{pos.x}</p>} />` |
| Function-as-children | Biến thể hiện đại: children chính là function | `<Mouse>{(pos) => <p/>}</Mouse>` |
| Compound components | Nhóm component chia sẻ state ngầm qua Context; chuẩn UI kit headless + a11y | `Tabs.Trigger` / `Tabs.Panel` + `aria-selected` |

</details>

---

## DAY 7 — Context

<details>
<summary><b>4 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| `createContext` → `Provider` → `useContext` | Ống dẫn dữ liệu xuyên tầng, không đục props (≈ DI phân cấp); R19 rút gọn `<Ctx value>` | `createContext<Theme \| null>(null)` |
| Custom hook guard | Bọc `useContext` + `throw` khi ngoài Provider để bắt sai scope sớm | `useTheme()` |
| Provider gần nhất | Consumer đọc Provider gần nó nhất (scoped như Angular providers) | Lồng 2 Provider → con dưới đọc con gần |
| Prop drilling | Truyền tay qua tầng trung gian không dùng — dấu hiệu cần Context (config) hoặc store (DAY 8) | Thay `a→b→c→d` bằng context |

</details>

---

## DAY 8 — External store

<details>
<summary><b>4 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| External store | State ngoài React, React chỉ subscribe đọc (≈ Service + `BehaviorSubject`); cho state global hay đổi | `useState` cục bộ · Context config · store dữ liệu đổi |
| `useSyncExternalStore` | Hook nền tảng đọc store ngoài: `subscribe(fn)` + `getSnapshot()` | Zustand/Redux đều xây trên nó |
| Zustand | Mặc định 2026: `create()` không Provider; subscribe đúng slice (`Object.is`) giảm re-render | `useCart((s) => s.items.length)` |
| Redux Toolkit | App lớn: `createSlice` + Immer, DevTools time-travel, thunk/RTK Query (≈ NgRx gọn hơn) | `dispatch(add(item))` |

</details>

---

## DAY 9 — Children API

<details>
<summary><b>2 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| `Children.count / map / toArray` | Xử lý children thô đồng nhất; `toArray` phẳng hóa + gán key; traversal ngay lúc render (không có `ngAfterContentInit`) | `Children.count(children)` |
| `cloneElement` + `isValidElement` | Sao chép element chồng props mới — inject hàng loạt (`onClick`, `aria-selected`); kiểm tra trước khi clone; dùng khiêm tốn | `cloneElement(child, { selected: true })` |

</details>

---

## DAY 10 — Memo & Format

<details>
<summary><b>4 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| Pipe → function + `Intl` | Không có pipe — format là hàm thuần trong JSX; `Intl` cache instance ở module scope | `new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })` |
| `memo` | Chặn re-render khi props shallow-equal (item list render thường) | `memo(function Row({ text }) {...})` |
| `useMemo` | Cache tính toán nặng theo deps; có chi phí bộ nhớ + so deps — không lạm dụng | `useMemo(() => rows.reduce(...), [rows])` |
| React Compiler 1.0 | Tự memoize ở build-time; viết tự nhiên, **đo trước memo sau** | Bật `babel-plugin-react-compiler` |

</details>

---

## DAY 11 — Forms

<details>
<summary><b>3 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| Controlled (form) | State là nguồn duy nhất + validate tay; re-render mỗi phím | `value` + `onChange` + `err` thủ công |
| react-hook-form | `useForm` + `register` (uncontrolled + ref, ít re-render) + `handleSubmit` validate rồi gọi callback | `{...register("email")}` |
| Zod + `zodResolver` | Schema runtime, suy type `z.infer`, tái dùng API/server; lỗi ở `formState.errors` (≈ Reactive Forms + Validators) | `errors.email?.message` |

</details>

---

## DAY 12 — Data fetching

<details>
<summary><b>3 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| `fetch` + AbortController | `fetch` không reject HTTP lỗi → check `!r.ok`; `signal` + cleanup `abort()`; bỏ qua `AbortError` | `fetch(url, { signal: ctrl.signal })` |
| TanStack Query v5 | Managed fetching: `useQuery({ queryKey, queryFn })` — cache, dedupe, retry, `staleTime`/`gcTime`, refetch nền; mutation qua `useMutation` + `invalidateQueries` | `useQuery({ queryKey: ["users"], queryFn })` |
| `use()` + Suspense | Đọc Promise trong render, suspend tới khi resolve (RSC/framework) | `<Suspense fallback>` + `use(promise)` |

</details>

---

## DAY 13 — Lazy + Suspense

<details>
<summary><b>3 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| `lazy` + `import()` | Tách chunk riêng, tải lần đầu render (≈ `loadChildren`) | `lazy(() => import("./HeavyChart"))` |
| `<Suspense fallback>` | UI chờ cho component suspend; thiếu là lỗi boundary; remount sau dùng cache | `<Suspense fallback={<p>Đang tải...</p>}>` |
| Error Boundary + prefetch | Chunk lỗi → cần Boundary **ngoài** Suspense; `import()` sớm khi hover/idle giảm chờ | `onMouseEnter={() => import("./HeavyChart")}` |

</details>

---

## DAY 14 — Router

<details>
<summary><b>4 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| Router v7 | `createBrowserRouter` (object một chỗ) + `RouterProvider` cho SPA Vite (thay `RouterModule`) | `createBrowserRouter([{ path: "/", element: <Layout/> }])` |
| `Outlet` + `Link` | `Outlet` = chỗ route con render (≈ `router-outlet`); `Link` đi không reload; code: `useNavigate`, `useParams`, `useSearchParams` | `<Link to="/users/2">` |
| `loader` + `useLoaderData` | Chạy **trước** render route (≈ resolver) → ít skeleton | `loader: ({ params }) => fetchUser(params.id)` |
| `errorElement` + lazy route | Hiện khi loader throw 401/404; `lazy` tách chunk ngay trong route | `errorElement: <Err/>` |

</details>

---

## DAY 15 — Lifecycle & Effects

<details>
<summary><b>4 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| `useEffect(fn, deps)` | Side effect **sau paint**, đồng bộ hệ ngoài (timer/socket/DOM/sub); `[]` = sau mount, `[x]` = khi x đổi, bỏ deps = mọi render | `useEffect(() => { ... }, [roomId])` |
| Cleanup | `return () => {...}` trước effect kế + khi unmount; setup/cleanup đối xứng; StrictMode chạy 2 lần để lộ thiếu cleanup | `return () => clearInterval(id)` |
| `useLayoutEffect` | Chạy **trước paint** — đo DOM rồi set state tránh nháy; mặc định dùng `useEffect` | Tooltip position |
| `useEffectEvent` (R19.2+) | Tách logic không-reactive khỏi deps — thay `eslint-disable exhaustive-deps` | Handler đọc giá trị mới nhất |

</details>

---

## DAY 16 — Custom hooks

<details>
<summary><b>3 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| Custom hook (`use*`) | Hàm gọi hook khác, gói logic tái dùng; **không singleton/DI** — mỗi lần gọi state riêng (khác Service) | `useLocalStorage("name")` |
| Rules of hooks | Top-level only (React phân state theo **thứ tự gọi**) · tên `use*` · chỉ trong component/hook | Cấm hook trong `if`/loop |
| Lazy initializer | `useState(() => ...)` chạy 1 lần (đọc storage); `useFetch` + AbortController chỉ để học — prod dùng Query | `useState(() => localStorage.getItem(k) ?? "")` |

</details>

---

## DAY 17 — Thư viện UI

<details>
<summary><b>4 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| Headless | Chỉ logic + a11y, không style — tự style 100% (ghép Tailwind) | Radix / Ark / Base UI |
| shadcn/ui | **Không phải package npm** — copy code vào dự án, sở hữu và tùy biến tận gốc | `npx shadcn@latest add button` |
| Tailwind v4 + pipeline | CSS-first (`@import "tailwindcss"`); `cva` biến thể + `clsx` + `tailwind-merge` là "style API" | `cn(variantClass, className)` |
| MUI | Full-suite ≈ Angular Material: sẵn dùng + theming mạnh, đổi lại theo design MUI, bundle lớn | `<Button variant="contained">` |

</details>

---

## DAY 18 — i18n

<details>
<summary><b>3 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| react-i18next | Dịch **runtime** key-JSON, đổi ngôn ngữ không reload (khác Angular XLIFF build-time) | `const { t } = useTranslation()` |
| Interpolation / plural / namespace | `{{name}}`, `_one`/`_other`, tách JSON theo domain + lazy load; `fallbackLng` + detector | `t("hello", { name: "Son" })` |
| `Intl` + `<html lang>` | Format số/ngày theo locale đang chọn; cập nhật `lang` cho a11y/SEO | `new Intl.NumberFormat(i18n.language, ...)` |

</details>

---

## DAY 19 — Animations

<details>
<summary><b>3 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| State-driven | Không hệ animation built-in — đổi state → đổi class/style → CSS nội suy; transition đủ 80% micro-interaction | `open ? "translateY(0)" : "translateY(8px)"` |
| Motion | Tên mới Framer Motion: `motion.div`, `initial/animate/exit`, `layout`, `whileHover`; `<AnimatePresence>` hoãn gỡ DOM tới khi exit xong | `<AnimatePresence>{open && <motion.div exit={...}/>}</AnimatePresence>` |
| `prefers-reduced-motion` | Tôn trọng cài đặt giảm chuyển động (media query / `useReducedMotion`) | Nội dung đúng, chỉ tắt animate |

</details>

---

## DAY 20 — Drag & Drop

<details>
<summary><b>3 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| HTML5 native | `draggable` + `onDragStart` (ghi index) + `onDragOver` (**phải `preventDefault`** mới drop) + `onDrop`; touch kém, không a11y | Đủ demo/học cơ chế |
| State-driven reorder | Kéo không dời DOM — set nguồn, thả **tạo mảng mới** (`splice` trên copy), React render lại | `setItems((xs) => hoán vị bất biến)` |
| dnd-kit | Chuẩn prod: `DndContext` + `SortableContext` + `useSortable` + `arrayMove` (≈ `moveItemInArray`); 2 list phân biệt `active`/`over` | Keyboard + touch + screen reader |

</details>

---

## DAY 21 — Testing & E2E

<details>
<summary><b>3 thuật ngữ</b> — bấm để mở</summary>

| Thuật ngữ | Giải thích | Ví dụ |
|---|---|---|
| Vitest + RTL + jest-dom | Chuẩn 2026 (thay Karma/Jasmine): Vitest chung config Vite + jsdom; RTL query theo a11y; matcher DOM | `render(<App/>)` · `toBeInTheDocument()` |
| Triết lý RTL | Test **hành vi người dùng** (role/label/text), không chọc state nội bộ; `user-event` mô phỏng thật; `renderHook` cho hook | `getByRole("button", { name: "+1" })` |
| Playwright + auto-wait | E2E browser thật đa trình duyệt, locator tự chờ thay sleep tay; phân tầng unit → integration → E2E | `page.getByRole(...)` · `toBeVisible()` |

</details>

---

## Reference

- Từng DAY trong `3_react-tutorial/0..21/README.md` (nguồn chi tiết của mọi thuật ngữ trên)
- https://react.dev/learn · https://react.dev/reference/react
- https://vite.dev/guide/ · https://tanstack.com/query/latest
