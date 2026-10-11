# DAY 7: CONTEXT CƠ BẢN (DI ĐƠN GIẢN)

## Mục tiêu bài học
- Hiểu Context là cách React truyền dữ liệu "xuyên tầng" mà không đục từng lỗ props — tương đương DI phân cấp của Angular nhưng đơn giản hơn.
- Viết đúng bộ 3: `createContext` → `Provider` → `useContext` (gói trong custom hook để ép scope).
- Biết khi nào dùng Context vs props vs store (DAY 8).

## Khái niệm cốt lõi (Core)
- **Context = ống dẫn dữ liệu từ Provider xuống mọi component con trong subtree** (không chỉ 1 tầng như props). Đọc qua `useContext(Ctx)`.
- **Ba mảnh:** `createContext(defaultValue)` tạo context; `<Ctx.Provider value={...}>` nạp giá trị; `useContext(Ctx)` đọc ở con.
- **React 19 cú pháp mới:** `<Ctx value={...}>` thay `<Ctx.Provider value={...}>` (rút gọn, tương đương).
- **Pattern custom hook an toàn:** `useTheme()` gọi `useContext` + `if (!ctx) throw`. Ép consumer nằm trong Provider, bắt lỗi scope sớm.
- **Đối chiếu Angular DI:** `@Injectable({providedIn})` ↔ context root; `providers: [...]` scoped ↔ Provider bọc subtree; `constructor(private svc)` ↔ `const { theme } = useTheme()`.
- **Khi value đổi → consumer re-render.** Context không phải store tối ưu cho cập nhật tần suất cao.
- **Default value:** dùng `null` để buộc kiểm tra, tránh "chạy nhưng sai ngầm".
- **Keyword chính:** `createContext`, `Provider`, `value`, `useContext`, `useTheme`, `scoped`, `prop drilling`, `re-render`.

## Luồng hoạt động (Flow)
1. Module load: `createContext<{ theme, toggle } | null>(null)` tạo `ThemeCtx`.
2. `App` render → bọc `<ThemeProvider>` quanh `<ThemedButton/>`.
3. `ThemeProvider` mount: `useState<Theme>("light")`; `toggle` đổi light↔dark; render `<ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>`.
4. `ThemedButton` render → `useTheme()` → `useContext(ThemeCtx)` đọc value từ Provider gần nhất.
5. User click → `toggle()` → `setTheme` → `ThemeProvider` re-render với value mới.
6. React so sánh: value của context thay đổi → consumer đã gọi `useContext(ThemeCtx)` trong subtree re-render.
7. Nơi không đọc context không bị re-render vì thay đổi này.
8. Nếu ai dùng `useTheme()` ngoài Provider → `ctx === null` → throw thông điệp rõ ràng.
9. Provider lồng nhau: consumer dùng Provider **gần nhất** — scoped như Angular providers.
10. Re-render lan tới mọi consumer — cân nhắc tách context khi cần tối ưu.
11. Hai Provider cùng context lồng nhau: consumer dưới cùng đọc giá trị của Provider **gần nó nhất** — override có phạm vi như provider scoped.
12. Nếu consumer nằm ngoài mọi Provider, hook trả `null` → `useTheme` throw ngay trong render — lỗi lộ sớm thay vì UI trống.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 7: ThemeContext tối giản
import { createContext, useContext, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
// 1. Tạo context; default null để ép kiểm tra scope
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

// 2. Custom hook đọc context — ném lỗi nếu dùng sai chỗ
function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme cần <ThemeProvider>");
  return ctx;
}

// 3. Provider: giữ state + bọc subtree
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

// 4. Consumer: đọc qua hook, không cần biết nguồn gốc
function ThemedButton() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>Theme hiện tại: {theme} (bấm để đổi)</button>;
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}
```

## Giải thích từng phần
- `createContext<... | null>(null)`: generic mô tả shape. `| null` + default `null` buộc consumer check hoặc hook throw.
- `useTheme()`: đóng gói — consumer chỉ thấy `{ theme, toggle }`, không thấy context object; tên hook tự giải thích.
- `<ThemeCtx.Provider value={{ theme, toggle }}>`: mỗi lần `theme` đổi, value mới → consumer re-render. React 19 cho `<ThemeCtx value={...}>`.
- `ThemeProvider` giữ `useState`: "DI scope" — state riêng cho cây con. Hai Provider = 2 state độc lập.
- `ThemedButton` không nhận props từ `App`: dù sâu bao nhiêu tầng cũng đọc được.
- **`children` của Provider:** mọi component trong subtree đều có thể đọc context.
- **Default `null` vs giá trị thật:** tránh default gây hiểu nhầm "đã có provider".
- **Value identity:** object literal mới mỗi render khiến mọi consumer re-render; Compiler 1.0 giảm chi phí.
- **Tách context theo mối quan tâm:** theme, locale, auth — mỗi context riêng, đổi cái nào render cái đó.
- **Context không thay service logic:** logic gom vào custom hook (DAY 16); context chỉ chuyển dữ liệu.
- **SSR:** context đọc được với `use()` trong Server Components; vẫn ưu tiên props khi chỉ 1-2 tầng.
- **Testing:** bọc component test trong Provider (DAY 21).
- **Giá trị `null` mặc định:** ép mọi consumer "đi qua hook" — nếu truy cập trực tiếp, TS buộc kiểm tra null.
- **Provider là component bình thường:** có thể nhận props, giữ state, lồng nhiều tầng — không có gì đặc biệt ngoài việc cấp `value`.
- **`use()` vs `useContext` (React 19):** `use(ThemeCtx)` linh hoạt trong vài ngữ cảnh; `useContext` vẫn là chuẩn phổ biến.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `@Injectable({providedIn: "root"})` | context ở root / module singleton | Context không phải class |
| `providers: [...]` (scoped) | `<Ctx.Provider value={...}>` bọc subtree | Phạm vi = vị trí JSX |
| `constructor(private svc)` | `useContext(Ctx)` / `useTheme()` | Inject tĩnh vs đọc động |
| InjectionToken + `@Inject` | `createContext` + `useContext` | Cùng ý "key để lấy giá trị" |
| `APP_INITIALIZER` | Provider ở root | Không có config module riêng |
| `OnPush` manual | Compiler tự tối ưu | Consumer chỉ re-render khi value đổi |
| `forwardRef`/`SkipSelf` | Provider lồng (gần nhất thắng) | Scoping tương tự |
| Token đa cấp | nested Provider | Cùng cơ chế override |
| `@Optional()` injection | context default `null` + check | Bắt buộc xử lý "không có provider" |
| `InjectionToken` mô tả shape | generic `createContext<Shape>()` | Type đi kèm context |

## Lỗi thường gặp (Common pitfalls)
- **Quên Provider khi dùng hook** → `ctx === null`; không throw thì crash khó hiểu. → Fix: luôn throw trong hook.
- **Value là object mới mỗi render** → subtree consumer re-render. → Fix: Compiler; hoặc tách context/`useMemo`.
- **Lạm dụng context cho dữ liệu cập nhật tần suất cao** (typing) → render mỗi phím. → Fix: external store (DAY 8).
- **Nhầm context với DI toàn năng** → không lifecycle/interceptor. → Fix: logic vào custom hook; server data vào TanStack Query.
- **Default value trực quan che lỗi scope** → app chạy nhưng sai. → Fix: chủ động `null` + throw.
- **Quên cập nhật type generic khi thêm field** → TS sai chỗ. → Fix: 1 type dùng chung.
- **Một context khổng lồ cho mọi thứ** → re-render chéo. → Fix: tách nhỏ theo theme/user/locale.
- **Dùng context để truyền callback không cần thiết** → over-engineering. → Fix: props khi chỉ 1-2 tầng.
- **Đọc context trong vòng lặp/điều kiện** → vi phạm rules of hooks. → Fix: top-level.
- **Đặt Provider quá cao** → mọi thay đổi value re-render cả app. → Fix: đặt Provider sát nơi cần nhất.
- **Trộn nhiều mối quan tâm trong một value** → đổi theme kéo theo locale re-render. → Fix: tách context theo domain.

## Best practices / Mẹo
- **Công thức 3 cấp:** props (1-2 tầng) → Context (config toàn cục) → store (nhiều nơi cập nhật).
- Viết hook `useXxx()` cho từng context: `useTheme()`, `useAuth()`, `useLocale()`.
- Gộp context đổi độc lập → giảm re-render chéo.
- React 19: context đọc được trong Server Components; vẫn ưu tiên props khi có thể.
- Dùng `use()` (React 19) để đọc context trong render an toàn hơn một số trường hợp.
- Đặt Provider ở tầng ngoài cùng hợp lý (root hoặc layout) — tránh bọc quá cao gây re-render toàn app.
- Tạo helper `createSafeContext()` để tái dùng pattern null-check.
- Đặt tên context theo domain (`ThemeContext`) và hook theo hành động đọc (`useTheme`) — API rõ ràng.
- Với giá trị không đổi, tạo Provider một lần ở root; với giá trị hay đổi, tách nhỏ để giảm phạm vi re-render.
- Tránh lưu state **server** trong context; để TanStack Query quản (DAY 12).

## Bài tập nhỏ
1. Thêm `UserContext` (user + setUser) riêng biệt, bọc cùng `ThemeProvider` — chứng minh 2 context không re-render lẫn nhau.
2. Viết `useTheme` không throw (mặc định light), dùng ngoài Provider — quan sát khác biệt khả năng bắt lỗi (rồi đổi lại throw).
3. Tạo `useAuth` với login/logout và `isAuthed`.
4. Tách `ThemeContext` thành `ThemeValueContext` + `ThemeActionsContext`.
5. Viết một `createSafeContext` generic tái dùng cho cả theme/user.
6. Viết `createSafeContext<T>()` generic trả `[Provider, useCtx]` dùng chung cho theme lẫn user — so sánh lượng code lặp.
7. Bọc `ThemedButton` trong một `ThemeProvider` lồng với value khác và xác nhận consumer dùng Provider gần nhất.

## Reference
- https://react.dev/learn/passing-data-deeply-with-context
- https://react.dev/reference/react/createContext
- https://react.dev/reference/react/useContext
- https://react.dev/learn/scaling-up-with-reducer-and-context