# DAY 7: CONTEXT CƠ BẢN (DI ĐƠN GIẢN)

## Mục tiêu bài học
- Hiểu Context là cách React truyền dữ liệu "xuyên tầng" mà không đục từng lỗ props — tương đương DI phân cấp của Angular nhưng đơn giản hơn.
- Viết đúng bộ 3: `createContext` → `Provider` → `useContext` (gói trong custom hook để ép scope).
- Biết khi nào dùng Context vs props vs store (DAY 8).

## Khái niệm cốt lõi (Core)

### 1. Context = ống dẫn từ Provider xuống mọi con trong subtree
Không chỉ 1 tầng như props — sâu bao nhiêu cũng đọc được qua `useContext(Ctx)`, không cần tầng trung gian "chuyển tiếp". Tầng trung gian không đọc thì không re-render vì context đổi (chỉ consumer đọc mới render lại).

```tsx
// Không Context: App -> Page -> Card -> Button phải drilling theme qua 3 tầng
<App theme={t}><Page theme={t}><Card theme={t}><Button theme={t} /></Card></Page></App>

// Có Context: Provider ở App, Button đọc trực tiếp — Page/Card không biết theme tồn tại
<ThemeProvider><Page><Card><ThemedButton /></Card></Page></ThemeProvider>
function ThemedButton() { const { theme } = useTheme(); return <button>{theme}</button>; }
```

Vì sao? Vì props là "đục lỗ từng tầng" — thêm một giá trị xuyên app (theme, locale, auth) là sửa 10 file trung gian. Context là "đường ống ngầm" — Provider cấp một lần, ai cần thì đọc. Giá phải trả: value đổi thì mọi consumer re-render (không phải chỉ lá đổi) — nên context hợp cho config ít đổi, không hợp cho dữ liệu gõ từng phím (đó là việc của store DAY 8).

### 2. Ba mảnh bắt buộc: tạo → cấp → đọc
`createContext(defaultValue)` tạo ống; `<Ctx.Provider value={...}>` nạp giá trị cho subtree; `useContext(Ctx)` đọc ở con. Thiếu một mảnh là không chạy.

```tsx
// (1) Tạo: generic mô tả shape, default null để ép check
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

// (2) Cấp: Provider giữ state, bọc cây con — state riêng cho subtree này
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

// (3) Đọc: consumer sâu mấy tầng cũng được, không cần props
function ThemedButton() {
  const { theme, toggle } = useTheme(); // useTheme bọc useContext + throw
  return <button onClick={toggle}>{theme}</button>;
}
```

React 19 cú pháp rút gọn `<ThemeCtx value={...}>` thay `<ThemeCtx.Provider value={...}>` — tương đương, ngắn hơn. Vì sao `value` là prop đặc biệt? Vì React dùng nó để so sánh và báo consumer re-render khi đổi (so `Object.is`).

### 3. Custom hook an toàn `useTheme()` — ép scope
`useTheme()` gọi `useContext` + `if (!ctx) throw`. Ép consumer nằm trong Provider, bắt lỗi scope sớm với thông điệp rõ thay vì crash `cannot read property of null` ở dòng sâu.

```tsx
// example.tsx dùng đúng pattern này:
function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme cần <ThemeProvider>");
  return ctx;
}
// Dùng sai: <ThemedButton /> ngoài Provider -> throw ngay lúc render,
// stack trace chỉ đúng component thiếu bọc — sửa bằng cách bọc <ThemeProvider>
```

Vì sao không `?.` (optional chaining) cho "an toàn"? Vì `?.` cho UI câm — nút hiện nhưng không đổi theme, không lỗi để tìm. Throw cho lỗi ồn ào, sửa nhanh. Ngoại lệ duy nhất: muốn default thật (ví dụ theme default light khi không có Provider) thì default context là giá trị thật, không phải `null` — nhưng phải chủ đích, không phải quên.

### 4. Đối chiếu Angular DI
`@Injectable({providedIn: "root"})` ↔ context đặt ở root; `providers: [...]` scoped cho subtree ↔ `<Provider>` bọc subtree đó; `constructor(private svc: Svc)` ↔ `const { theme } = useTheme()`. Khác ở chỗ Angular DI là container class + token, React context là value + hook — không có lifecycle/interceptor, không singleton class.

```tsx
// Angular: providers scoped — 2 nhánh có 2 instance khác nhau
// @Component({ providers: [ThemeService] })

// React: 2 Provider = 2 state độc lập — example.tsx NestedDemo minh họa
<ThemeProvider><ThemedButton /> {/* light ngoài */}
  <ThemeProvider><ThemedButton /> {/* state trong độc lập */}</ThemeProvider>
</ThemeProvider>
// Toggle nút trong không ảnh hưởng nút ngoài — scoped như providers
```

Provider lồng: consumer đọc Provider **gần nhất** — override có phạm vi. Ngoài mọi Provider mà hook default `null` → throw ngay — lộ sớm thay vì UI trống.

### 5. Khi value đổi → consumer re-render (không phải cả app)
Chỉ component đã gọi `useContext(Ctx)` trong subtree mới render lại. Tầng trung gian không đọc thì giữ nguyên (React bỏ qua). Nhưng nếu một context ôm 10 field (theme + user + locale + cart) mà một field đổi, mọi consumer của context đó đều render lại dù chỉ dùng field khác — đó là lý do tách context theo domain.

```tsx
// ❌ Một context ôm tất cả — đổi theme kéo locale re-render theo
const AppCtx = createContext<{ theme: Theme; locale: string; user: User }>(...);

// ✅ Tách theo mối quan tâm — đổi cái nào render cái đó
const ThemeCtx = createContext<Theme>(...);
const LocaleCtx = createContext<string>(...);
```

Object literal `value={{ theme, toggle }}` mới mỗi render → consumer re-render mỗi lần Provider render dù `theme` không đổi. React Compiler 1.0 giảm phí; chưa có Compiler thì `useMemo` value hoặc tách value/actions thành 2 context.

### 6. Default `null` vs giá trị thật
Dùng `null` để buộc kiểm tra, tránh "chạy nhưng sai ngầm" với default giả. Chỉ dùng default thật khi bạn chủ đích muốn "không Provider vẫn chạy với giá trị này" (ví dụ locale default `"vi"`).

### Keyword chính
`createContext`, `Provider` (`<Ctx.Provider>` / `<Ctx>` rút gọn), `value`, `useContext`, `useTheme()` guard, `scoped` (Provider lồng, gần nhất thắng), `prop drilling` (vấn đề context giải quyết), `re-render` theo consumer.

## Luồng hoạt động (Flow)
1. Module load: `createContext<{ theme, toggle } | null>(null)` tạo `ThemeCtx` với default `null`. Chưa có giá trị thật — chỉ là "chìa khóa" để đọc.
2. `App` render → bọc `<ThemeProvider>` quanh `<ThemedButton/>` và `<NestedDemo/>`. Provider là component thường, có thể giữ state/lồng nhau.
3. `ThemeProvider` mount: `useState<Theme>("light")` tạo state riêng cho subtree; `toggle` đảo light↔dark bằng functional update; render `<ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>`.
4. `ThemedButton` render → `useTheme()` → `useContext(ThemeCtx)` tìm Provider gần nhất phía trên, đọc `value` của nó. Sâu bao nhiêu tầng cũng tìm được, không cần props trung gian.
5. User click → `toggle()` → `setTheme` → `ThemeProvider` re-render với `theme` mới → `value` object mới → React so sánh thấy đổi.
6. React báo mọi consumer đã gọi `useContext(ThemeCtx)` trong subtree re-render (`ThemedButton` vẽ "dark"). Tầng trung gian (`Page`, `Card` nếu có) không đọc thì đứng yên.
7. `NestedDemo` có Provider lồng: nút trong đọc Provider trong (state độc lập), nút ngoài đọc Provider ngoài. Toggle trong không ảnh hưởng ngoài — chứng minh scoped.
8. Nếu ai dùng `useTheme()` ngoài mọi Provider → `ctx === null` → throw "cần <ThemeProvider>" ngay lúc render — lỗi ồn ào, stack chỉ đúng chỗ.
9. Hai Provider cùng context lồng nhau: consumer dưới cùng đọc Provider **gần nó nhất** — override có phạm vi như provider scoped của Angular.
10. Re-render lan tới mọi consumer của context đó — khi cần tối ưu (theme đổi 1 lần không sao, nhưng typing mỗi phím thì sao), tách context hoặc chuyển sang external store (DAY 8).

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` cùng thư mục (ThemeContext + guard + Provider lồng):

```tsx
// example.tsx — DAY 7: ThemeContext + useTheme() guard + Provider lồng
// Mục đích: truyền dữ liệu xuyên tầng không drilling — Provider cấp, useTheme đọc.
import { createContext, useContext, useState, type ReactNode } from "react"; // (1) Ba mảnh: tạo, đọc, giữ state

type Theme = "light" | "dark"; // (2) Union chặn giá trị lạ — chỉ 2 theme hợp lệ

// (3) Tạo context; default null để ÉP kiểm tra scope (không default giả che lỗi).
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

// (4) Custom hook đọc — ném lỗi nếu dùng ngoài Provider. Consumer chỉ thấy { theme, toggle }.
function useTheme() {
  const ctx = useContext(ThemeCtx); // đọc từ Provider GẦN NHẤT trong cây
  if (!ctx) throw new Error("useTheme cần <ThemeProvider>"); // lộ lỗi scope sớm
  return ctx;
}

// (5) Provider: giữ state + bọc subtree. Hai Provider = 2 state độc lập (scoped như Angular providers).
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light"); // state riêng cho cây con này
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light")); // functional update
  // React 19 cũng cho <ThemeCtx value={...}> rút gọn — tương đương Provider
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

// (6) Consumer sâu bao nhiêu tầng cũng đọc được — không cần props trung gian.
function ThemedButton() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>Theme hiện tại: {theme} (bấm để đổi)</button>;
}

// (7) Demo Provider lồng: consumer dưới cùng đọc Provider GẦN NHẤT (override có phạm vi).
function NestedDemo() {
  return (
    <ThemeProvider>
      <ThemedButton /> {/* đọc theme ngoài = light */}
      <ThemeProvider>
        <ThemedButton /> {/* đọc theme trong — state độc lập, toggle không ảnh hưởng ngoài */}
      </ThemeProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
      <NestedDemo />
    </ThemeProvider>
  );
}
```

## Giải thích từng phần
- Dòng `createContext<{ theme: Theme; toggle: () => void } | null>(null)`: generic mô tả shape value. `| null` + default `null` buộc mọi consumer (đọc trực tiếp) phải check null, hoặc đi qua `useTheme()` throw. Vì sao không default `{ theme: "light", toggle: () => {} }`? Vì default giả làm Trigger ngoài Provider vẫn "chạy" với giá trị giả — sai ngầm.
- Khối `useTheme()`: đóng gói — consumer chỉ thấy `{ theme, toggle }`, không thấy object context, không cần biết Provider ở đâu. Tên hook (`useTheme`) tự tài liệu hơn `useContext(ThemeCtx)`. Throw với tên Provider cụ thể để người mới biết bọc cái gì.
- Dòng `<ThemeCtx.Provider value={{ theme, toggle }}>`: mỗi lần `theme` đổi, object literal mới → React thấy value đổi → consumer re-render. React 19 cho `<ThemeCtx value={...}>` ngắn hơn, cùng ý. Vì sao value là object mà không 2 context riêng? Vì theme + toggle đổi cùng nhau (toggle đổi theme), gộp là hợp lý; khi hai field đổi độc lập (theme vs locale) mới tách.
- Dòng `useState<Theme>("light")` trong Provider: "DI scope" — state riêng cho cây con được bọc. Hai `<ThemeProvider>` là hai `useState` độc lập, không chia sẻ. Đây là khác biệt với singleton module (DAY 8 store là singleton, Provider là scoped).
- Dòng `toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"))`: functional update đảm bảo đảo từ giá trị mới nhất. Vì sao không `setTheme(theme === "light" ? "dark" : "light")`? Vì `theme` là snapshot render tạo callback; click nhanh 2 lần trước re-render sẽ đọc cùng snapshot cũ.
- Khối `ThemedButton`: không nhận props từ `App` — dù sâu 10 tầng vẫn đọc được. Đây là toàn bộ giá trị của context: xóa drilling. Test component này phải bọc Provider (DAY 21): `render(<ThemeProvider><ThemedButton/></ThemeProvider>)`, không render trần.
- Khối `NestedDemo`: chứng minh Provider lồng + gần nhất thắng. Toggle nút trong chỉ đổi nút trong. Vì sao demo này quan trọng? Vì nó là câu trả lời cho "làm sao 2 nhánh có theme khác nhau" (ví dụ preview theme) — bọc Provider riêng cho nhánh đó.
- Quy tắc **value identity**: object mới mỗi render → consumer re-render mỗi lần Provider render. Với theme (đổi 1 lần khi bấm) không sao; với value đổi mỗi phím gõ thì phải tách/memo hoặc chuyển store. Compiler 1.0 tự tối ưu phần này.
- Quy tắc **SSR**: context đọc được trong Server Components bằng `use()`; nhưng nếu chỉ 1-2 tầng, props vẫn đơn giản hơn context. Đừng "context hóa" mọi thứ.
- Quy tắc **`use()` vs `useContext` (React 19)**: `use(ThemeCtx)` linh hoạt hơn trong vài ngữ cảnh (đọc trong điều kiện sau khi đã có promise), nhưng `useContext` vẫn là chuẩn phổ biến cho client component — dùng `useContext` trừ khi có lý do.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `@Injectable({providedIn: "root"})` | context đặt ở root (`<ThemeProvider>` ở `main.tsx`/App) | Context không phải class, chỉ là value + hook |
| `providers: [...]` scoped cho subtree | `<Ctx.Provider value={...}>` bọc subtree (NestedDemo) | Phạm vi = vị trí JSX bọc, gần nhất thắng |
| `constructor(private svc: Svc)` inject | `useContext(Ctx)` / `useTheme()` đọc | Inject tĩnh lúc tạo vs đọc động mỗi render |
| InjectionToken + `@Inject(Token)` | `createContext<Shape>()` + `useContext` | Cùng ý "key để lấy giá trị", khác cú pháp |
| `APP_INITIALIZER` chạy trước | Provider ở root khởi tạo trước con | Không có config module riêng, code chạy theo thứ tự render |
| `ChangeDetectionStrategy.OnPush` thủ công | Compiler tự tối ưu consumer | Consumer chỉ re-render khi value đổi (so Object.is) |
| `SkipSelf`/`Self`/`Optional` decorator | Provider lồng (gần nhất thắng) + default `null` + throw | Scoping tương tự, thiếu thì throw thay vì Optional null |
| Token đa cấp override | nested Provider override | Cùng cơ chế "gần nhất thắng" |
| `@Optional()` injection (có thể null) | context default `null` + check/throw trong hook | Bắt buộc xử lý "không có provider" tường minh |
| Type của service class | generic `createContext<Shape>()` | Type đi kèm context, sai field báo compile |

## Lỗi thường gặp (Common pitfalls)

### 1. Quên Provider khi dùng hook
```tsx
// ❌ SAI: render trần — ctx null, crash hoặc UI câm nếu dùng ?.
render(<ThemedButton />); // throw "cần <ThemeProvider>" (may vì hook throw)
```
```tsx
// ✅ ĐÚNG: luôn bọc Provider (kể cả trong test DAY 21)
render(<ThemeProvider><ThemedButton /></ThemeProvider>);
```

### 2. Value object mới mỗi render → consumer re-render thừa
```tsx
// ❌ SAI (data đổi nhanh, chưa Compiler): theme không đổi nhưng Provider render vì lý do khác vẫn làm consumer render
<ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
```
```tsx
// ✅ ĐÚNG: Compiler 1.0 tự lo; chưa có thì tách context hoặc memo
const value = useMemo(() => ({ theme, toggle }), [theme]); // toggle ổn định via useCallback/Compiler
// Hoặc tách ThemeValueContext + ThemeActionsContext
```

### 3. Lạm dụng context cho dữ liệu tần suất cao
Mô tả: nhét text đang gõ (mỗi phím đổi) vào context → mọi consumer re-render mỗi phím. Fix: external store + selector (DAY 8) — chỉ ai đọc slice đổi mới render.

### 4. Nhầm context với DI toàn năng
Mô tả: mong context có lifecycle/interceptor/retry như Angular service. Không có. Fix: logic vào custom hook (DAY 16), server data vào TanStack Query (DAY 12); context chỉ chuyển dữ liệu đã chuẩn bị.

### 5. Default giả che lỗi scope
```tsx
// ❌ SAI: default trông thật — ngoài Provider vẫn chạy, sai ngầm
const ThemeCtx = createContext({ theme: "light" as Theme, toggle: () => {} });
```
```tsx
// ✅ ĐÚNG: null + throw để lộ ngay
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);
```

### 6. Một context khổng lồ cho mọi thứ
```tsx
// ❌ SAI: đổi theme kéo user/locale re-render theo
const AppCtx = createContext<{ theme: Theme; user: User; locale: string }>(...);
```
```tsx
// ✅ ĐÚNG: tách nhỏ theo domain — đổi cái nào render cái đó
const ThemeCtx = createContext<Theme>(...); const UserCtx = createContext<User>(...);
```

### 7. Đặt Provider quá cao
Mô tả: bọc cả app trong khi chỉ 1 trang cần → value đổi re-render cả app. Fix: đặt Provider sát nơi cần nhất (route layout thay vì root), đo bằng DevTools Profiler.

## Best practices / Mẹo
- **Công thức 3 cấp:** props (1-2 tầng, cha-con rõ) → Context (config ít đổi, xuyên nhiều tầng: theme/auth/locale) → store (hay đổi + nhiều nơi đọc/ghi: cart/realtime). Vì sao 3 cấp? Vì mỗi cấp thêm chi phí, chọn đúng cấp là tối ưu sẵn.
- Viết hook `useXxx()` cho từng context (`useTheme`, `useAuth`, `useLocale`) — throw khi thiếu Provider. Vì sao? Để consumer không thấy context object, chỉ thấy API domain, và lỗi scope ồn ào.
- Tạo helper `createSafeContext<T>()` trả `[Provider, useCtx]` tái dùng cho mọi domain — khỏi lặp pattern null-check. Vì sao? Vì 5 context mà lặp 5 lần `if (!ctx) throw` là rác.
- Đặt Provider ở tầng ngoài cùng hợp lý (root cho theme toàn app, layout route cho auth theo khu vực) — tránh bọc quá cao gây re-render toàn app. Vì sao? Vì value đổi là consumer render, phạm vi Provider càng rộng càng nhiều consumer.
- Tránh lưu server state trong context; để TanStack Query quản (DAY 12). Vì sao? Vì server state cần cache/retry/dedupe mà context không có.
- Với giá trị không đổi (config tĩnh), tạo Provider một lần ở root; với giá trị hay đổi, tách nhỏ để giảm phạm vi. Vì sao? Vì chi phí re-render tỉ lệ với số consumer.

## Bài tập nhỏ
1. Thêm `UserContext` (user + setUser) riêng biệt, bọc cùng `ThemeProvider` — chứng minh toggle theme không làm consumer user re-render (thêm `console.log` để thấy).
2. Viết `useTheme` không throw (default light), dùng ngoài Provider — quan sát khác biệt bắt lỗi (UI chạy nhưng sai ngầm), rồi đổi lại throw. Vì sao throw tốt hơn?
3. Tạo `useAuth` với login/logout và `isAuthed` — bọc route cần auth, ngoài route công cộng không bọc.
4. Tách `ThemeContext` thành `ThemeValueContext` + `ThemeActionsContext` — đo re-render giảm khi chỉ bấm toggle.
5. Viết `createSafeContext<T>()` generic trả `[Provider, useCtx]` dùng chung cho theme lẫn user — so sánh lượng code lặp trước/sau.
6. Bọc `ThemedButton` trong Provider lồng với value khác (như NestedDemo) và xác nhận consumer dùng Provider gần nhất — giải thích vì sao gọi là "scoped".

## Reference
- https://react.dev/learn/passing-data-deeply-with-context
- https://react.dev/reference/react/createContext
- https://react.dev/reference/react/useContext
- https://react.dev/learn/scaling-up-with-reducer-and-context
