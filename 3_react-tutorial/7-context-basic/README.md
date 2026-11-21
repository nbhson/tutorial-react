# DAY 7: CONTEXT CƠ BẢN (DI ĐƠN GIẢN)

## Mục tiêu bài học
- Hiểu Context là cách React truyền dữ liệu "xuyên tầng" mà không đục từng lỗ props — tương đương DI phân cấp của Angular nhưng đơn giản hơn.
- Viết đúng bộ 3: `createContext` → `Provider` → `useContext` (gói trong custom hook để ép scope).
- Biết khi nào dùng Context vs props vs store (DAY 8).

## Khái niệm cốt lõi (Core)

### 1. Context = ống dẫn từ Provider xuống mọi con trong subtree
Không chỉ 1 tầng như props — sâu bao nhiêu cũng đọc được qua `useContext(Ctx)`, không cần tầng trung gian "chuyển tiếp". Tầng trung gian không đọc thì không re-render vì context đổi (chỉ consumer đọc mới render lại).

> 📄 **Code ví dụ:** [`examples/01-1-context-ong-dan-tu-provider-xuong-moi.tsx`](examples/01-1-context-ong-dan-tu-provider-xuong-moi.tsx)

Vì sao? Vì props là "đục lỗ từng tầng" — thêm một giá trị xuyên app (theme, locale, auth) là sửa 10 file trung gian. Context là "đường ống ngầm" — Provider cấp một lần, ai cần thì đọc. Giá phải trả: value đổi thì mọi consumer re-render (không phải chỉ lá đổi) — nên context hợp cho config ít đổi, không hợp cho dữ liệu gõ từng phím (đó là việc của store DAY 8).

> **Tóm gọn 1 câu:** Context là ống dẫn nước từ Provider xuống mọi vòi trong subtree — không đục tường từng tầng, nhưng nước đổi thì mọi vòi đang mở đều rung.

### 2. Ba mảnh bắt buộc: tạo → cấp → đọc
`createContext(defaultValue)` tạo ống; `<Ctx.Provider value={...}>` nạp giá trị cho subtree; `useContext(Ctx)` đọc ở con. Thiếu một mảnh là không chạy.

> 📄 **Code ví dụ:** [`examples/02-2-ba-manh-bat-buoc-tao-cap-oc.tsx`](examples/02-2-ba-manh-bat-buoc-tao-cap-oc.tsx)

React 19 cú pháp rút gọn `<ThemeCtx value={...}>` thay `<ThemeCtx.Provider value={...}>` — tương đương, ngắn hơn. Vì sao `value` là prop đặc biệt? Vì React dùng nó để so sánh và báo consumer re-render khi đổi (so `Object.is`).

> **Tóm gọn 1 câu:** Ba mảnh bắt buộc: `createContext` đào ống, `Provider` bơm nước, `useContext` mở vòi — thiếu mảnh nào là khô cả cây.

### 3. Custom hook an toàn `useTheme()` — ép scope
`useTheme()` gọi `useContext` + `if (!ctx) throw`. Ép consumer nằm trong Provider, bắt lỗi scope sớm với thông điệp rõ thay vì crash `cannot read property of null` ở dòng sâu.

> 📄 **Code ví dụ:** [`examples/03-3-custom-hook-an-toan-usetheme-ep-scope.tsx`](examples/03-3-custom-hook-an-toan-usetheme-ep-scope.tsx)

Vì sao không `?.` (optional chaining) cho "an toàn"? Vì `?.` cho UI câm — nút hiện nhưng không đổi theme, không lỗi để tìm. Throw cho lỗi ồn ào, sửa nhanh. Ngoại lệ duy nhất: muốn default thật (ví dụ theme default light khi không có Provider) thì default context là giá trị thật, không phải `null` — nhưng phải chủ đích, không phải quên.

> **Tóm gọn 1 câu:** `useTheme()` guard là chốt kiểm soát ở cửa: thiếu Provider thì "báo rõ thiếu vé", đừng để khách lạc tầng hầm bằng `?.`.

### 4. Đối chiếu Angular DI
`@Injectable({providedIn: "root"})` ↔ context đặt ở root; `providers: [...]` scoped cho subtree ↔ `<Provider>` bọc subtree đó; `constructor(private svc: Svc)` ↔ `const { theme } = useTheme()`. Khác ở chỗ Angular DI là container class + token, React context là value + hook — không có lifecycle/interceptor, không singleton class.

> 📄 **Code ví dụ:** [`examples/04-4-oi-chieu-angular-di.tsx`](examples/04-4-oi-chieu-angular-di.tsx)

Provider lồng: consumer đọc Provider **gần nhất** — override có phạm vi. Ngoài mọi Provider mà hook default `null` → throw ngay — lộ sớm thay vì UI trống.

> **Tóm gọn 1 câu:** Angular DI rút gọn thành 3 từ: đào (createContext), bơm (Provider), mở (useContext) — không class, không token.

### 5. Khi value đổi → consumer re-render (không phải cả app)
Chỉ component đã gọi `useContext(Ctx)` trong subtree mới render lại. Tầng trung gian không đọc thì giữ nguyên (React bỏ qua). Nhưng nếu một context ôm 10 field (theme + user + locale + cart) mà một field đổi, mọi consumer của context đó đều render lại dù chỉ dùng field khác — đó là lý do tách context theo domain.

> 📄 **Code ví dụ:** [`examples/05-5-khi-value-oi-consumer-re-render-khong.tsx`](examples/05-5-khi-value-oi-consumer-re-render-khong.tsx)

Object literal `value={{ theme, toggle }}` mới mỗi render → consumer re-render mỗi lần Provider render dù `theme` không đổi. React Compiler 1.0 giảm phí; chưa có Compiler thì `useMemo` value hoặc tách value/actions thành 2 context.

> **Tóm gọn 1 câu:** Value đổi thì mọi consumer "rung theo" — config ít đổi thì hợp, dữ liệu nhảy từng phím thì phải tách context hoặc chuyển store.

### 6. Default `null` vs giá trị thật
Dùng `null` để buộc kiểm tra, tránh "chạy nhưng sai ngầm" với default giả. Chỉ dùng default thật khi bạn chủ đích muốn "không Provider vẫn chạy với giá trị này" (ví dụ locale default `"vi"`).

> **Tóm gọn 1 câu:** Default `null` là "cửa có khóa bắt kiểm tra" — default thật chỉ dùng khi bạn chủ đích muốn mở cửa tự do.

### Keyword chính
`createContext`, `Provider` (`<Ctx.Provider>` / `<Ctx>` rút gọn), `value`, `useContext`, `useTheme()` guard, `scoped` (Provider lồng, gần nhất thắng), `prop drilling` (vấn đề context giải quyết), `re-render` theo consumer.

## Luồng hoạt động (Flow)
Mục này đi qua 10 bước theo vòng đời thật của ThemeContext: tạo context, bọc Provider, click toggle, cho tới khi test ngoài Provider — đọc theo thứ tự để thấy "dòng nước" chảy thế nào.
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

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

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
Mục này dịch từng khái niệm DI của Angular sang Context React — đọc cột Ghi chú để thấy chỗ nào dịch 1-1 và chỗ nào Context "không đủ sức" (BehaviorSubject).
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

> **Cách đọc bảng này:** mỗi dòng là một cặp DI ↔ Context; 4 dòng đầu là bộ làm việc hàng ngày, các dòng sau là trường hợp nâng cao (Optional, override, token) — khi cần "tính năng DI nào đó của Angular", tra dòng tương ứng trước khi tự chế.

## Lỗi thường gặp (Common pitfalls)

Mục này gom 7 cái bẫy của Context — phần lớn xoay quanh "đặt Provider sai chỗ", "value đổi quá thường xuyên" và "default giả che lỗi".

### 1. Quên Provider khi dùng hook
> 📄 **Code ví dụ:** [`examples/07-1-quen-provider-khi-dung-hook.tsx`](examples/07-1-quen-provider-khi-dung-hook.tsx)
> 📄 **Code ví dụ:** [`examples/08-1-quen-provider-khi-dung-hook.tsx`](examples/08-1-quen-provider-khi-dung-hook.tsx)

### 2. Value object mới mỗi render → consumer re-render thừa
> 📄 **Code ví dụ:** [`examples/09-2-value-object-moi-moi-render-consumer-re.tsx`](examples/09-2-value-object-moi-moi-render-consumer-re.tsx)
> 📄 **Code ví dụ:** [`examples/10-2-value-object-moi-moi-render-consumer-re.tsx`](examples/10-2-value-object-moi-moi-render-consumer-re.tsx)

### 3. Lạm dụng context cho dữ liệu tần suất cao
Mô tả: nhét text đang gõ (mỗi phím đổi) vào context → mọi consumer re-render mỗi phím. Fix: external store + selector (DAY 8) — chỉ ai đọc slice đổi mới render.

### 4. Nhầm context với DI toàn năng
Mô tả: mong context có lifecycle/interceptor/retry như Angular service. Không có. Fix: logic vào custom hook (DAY 16), server data vào TanStack Query (DAY 12); context chỉ chuyển dữ liệu đã chuẩn bị.

### 5. Default giả che lỗi scope
> 📄 **Code ví dụ:** [`examples/11-5-default-gia-che-loi-scope.tsx`](examples/11-5-default-gia-che-loi-scope.tsx)
> 📄 **Code ví dụ:** [`examples/12-5-default-gia-che-loi-scope.tsx`](examples/12-5-default-gia-che-loi-scope.tsx)

### 6. Một context khổng lồ cho mọi thứ
> 📄 **Code ví dụ:** [`examples/13-6-mot-context-khong-lo-cho-moi-thu.tsx`](examples/13-6-mot-context-khong-lo-cho-moi-thu.tsx)
> 📄 **Code ví dụ:** [`examples/14-6-mot-context-khong-lo-cho-moi-thu.tsx`](examples/14-6-mot-context-khong-lo-cho-moi-thu.tsx)

### 7. Đặt Provider quá cao
Mô tả: bọc cả app trong khi chỉ 1 trang cần → value đổi re-render cả app. Fix: đặt Provider sát nơi cần nhất (route layout thay vì root), đo bằng DevTools Profiler.

## Best practices / Mẹo
- **Công thức 3 cấp:** props (1-2 tầng, cha-con rõ) → Context (config ít đổi, xuyên nhiều tầng: theme/auth/locale) → store (hay đổi + nhiều nơi đọc/ghi: cart/realtime). Vì sao 3 cấp? Vì mỗi cấp thêm chi phí, chọn đúng cấp là tối ưu sẵn.
- Viết hook `useXxx()` cho từng context (`useTheme`, `useAuth`, `useLocale`) — throw khi thiếu Provider. Vì sao? Để consumer không thấy context object, chỉ thấy API domain, và lỗi scope ồn ào.
- Tạo helper `createSafeContext<T>()` trả `[Provider, useCtx]` tái dùng cho mọi domain — khỏi lặp pattern null-check. Vì sao? Vì 5 context mà lặp 5 lần `if (!ctx) throw` là rác.
- Đặt Provider ở tầng ngoài cùng hợp lý (root cho theme toàn app, layout route cho auth theo khu vực) — tránh bọc quá cao gây re-render toàn app. Vì sao? Vì value đổi là consumer render, phạm vi Provider càng rộng càng nhiều consumer.
- Tránh lưu server state trong context; để TanStack Query quản (DAY 12). Vì sao? Vì server state cần cache/retry/dedupe mà context không có.
- Với giá trị không đổi (config tĩnh), tạo Provider một lần ở root; với giá trị hay đổi, tách nhỏ để giảm phạm vi. Vì sao? Vì chi phí re-render tỉ lệ với số consumer.

> **Tóm gọn 1 câu:** Context đúng là "cấp nước có kiểm soát": props cho 1-2 tầng, Context cho config ít đổi, store cho nước chảy xiết — mỗi loại nước một đường ống.

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
