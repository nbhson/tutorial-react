# Q13: Truyền props qua nhiều tầng thì chán — nên dùng Context khi nào?

## Câu hỏi

> Trong app, truyền props qua 3-4 tầng thì chán (prop drilling) — khi nào nên chuyển sang Context?
> Context và props khác nhau ở đâu, và dữ liệu đổi liên tục thì có nên dùng Context không?
> So với DI của Angular thì thế nào?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Context = "ống dẫn" truyền một giá trị từ Provider xuống mọi consumer trong subtree, DÙ SÂU BAO NHIÊU TẦNG** — không cần "đục lỗ" (drill) qua từng component trung gian. Bộ 3: **`createContext` → `<Provider value>` → `useContext`** (thường bọc trong custom hook để ép scope).
- **Props** chỉ đi **1 tầng** (cha → con trực tiếp). Muốn xuyên 3–4 tầng bằng props thì phải truyền "chuyển tiếp" qua mỗi tầng trung gian (**prop drilling**) — component trung gian phải "đỡ" một giá trị không phải việc của nó.
- **Quy tắc chọn**:
  - **1–2 tầng, rõ ràng** (cha → con, con → cháu) → **props** (dễ theo dõi).
  - **3+ tầng, ít đổi** (theme, locale, auth, i18n) → **Context**.
  - **Đổi THƯỜNG XUYÊN** (input gõ từng phím, cart, stream) → **Store** (Zustand/Redux — DAY 8), **không phải Context** (mỗi lần value đổi, **mọi consumer re-render**).

## Trả lời chi tiết

### 1. Vì sao Context tồn tại (vấn đề "prop drilling")

```tsx
// Không Context: App → Page → Card → Button phải truyền theme qua 3 tầng
<App theme={t}>
  <Page theme={t}>
    <Card theme={t}>
      <Button theme={t} />
    </Card>
  </Page>
</App>
// Page, Card "đỡ" theme (mặc dù không dùng) — mỗi tầng "đục lỗ" 1 prop

// Có Context: Provider ở App, Button đọc trực tiếp — Page/Card không "biết" theme tồn tại
<ThemeProvider>
  <Page>
    <Card>
      <ThemedButton />
    </Card>
  </Page>
</ThemeProvider>

function ThemedButton() {
  const { theme, toggle } = useTheme(); // "đọc" ở "sâu" cũng "được"
  return <button onClick={toggle}>{theme}</button>;
}
```

**Vì sao nên Context khi sâu (3–4+ tầng)?** Vì "đục lỗ" props qua từng tầng trung gian → (1) mỗi tầng "biết" một value không phải việc mình; (2) đổi tên prop phải sửa cả chuỗi; (3) code "nặng" hơn.

**Vì sao chưa nên Context khi chỉ 1–2 tầng?** Vì props **rõ ràng hơn, dễ theo dõi hơn** (nằm ngay ở đầu component), và **đơn giản hơn** (không cần bọc thêm layer).

### 2. Ba mảnh bắt buộc (tạo → cấp → đọc)

```tsx
// (1) TẠO (1 lần khi module load) — default null để "ép" "check"
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

// (2) CẤP (Provider giữ state, "bọc" "subtree")
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}
// React 19: "rút gọn" <ThemeCtx value={...}> "thay" <ThemeCtx.Provider value> (tương đương)

// (3) ĐỌC (consumer "sâu" "mấy" "tầng" "cũng" "được" — "bọc" "vùng")
function ThemedButton() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>{theme}</button>;
}

function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme cần <ThemeProvider>"); // "lỗi" "sớm", "clear"
  return ctx;
}
```

**Tầng trung gian không đọc** context **không re-render** vì value đổi — chỉ **consumer** (component gọi `useContext`) mới render lại.

### 3. Điểm "ăn điểm" quan trọng: re-render theo consumer, không phải cả app

- **Khi value đổi** → **mọi consumer** trong subtree (component gọi `useContext`) **re-render** (React so value bằng `Object.is`).
- **Tầng trung gian không đọc** → **đứng yên** (không "kéo" theo).

**Hậu quả cần biết**: Nếu 1 context "ôm" 10 field (theme + user + locale + cart) mà 1 field đổi → **mọi consumer của context đó render lại** dù chỉ dùng field khác.

```tsx
// ❌ Một context "ôm" "tất cả" — "đổi" "theme" "kéo" "locale" "render" "lẫn"
const AppCtx = createContext<{ theme: Theme; locale: string; user: User }>(...);

// ✅ Tách "theo" "mối quan tâm" — "đổi" "cái nào render" "cái" "đó"
const ThemeCtx = createContext<Theme>(...);
const LocaleCtx = createContext<string>(...);
```

**Lưu ý kèm** (nếu bị hỏi tiếp): `value={{ theme, toggle }}` (object literal) **mới mỗi lần Provider render** → consumer "re-render" theo dù theme không đổi. Fix: bật **React Compiler** (auto-memo), hoặc `useMemo` value, hoặc tách value + actions thành 2 context (xem [`10-memo-format`](../../3_react-tutorial/10-memo-format)).

### 4. Quy tắc CHỌN (đáp câu hỏi chủ)

| Đặc điểm | Dùng cái nào | Lý do |
|---|---|---|
| **1–2 tầng**, rõ ràng | **Props** | Dễ theo dõi (props nằm ở đầu component), không cần bọc layer |
| **3+ tầng**, ít đổi (theme, locale, auth) | **Context** | Tránh "đục lỗ" nhiều tầng; consumer "sâu" đọc trực tiếp |
| **Đổi thường xuyên** (input, cart, stream) | **Store (Zustand/Redux)** | Mỗi lần value đổi, mọi consumer render — "đắt" hơn cần thiết; "selector" của store giới hạn được |
| **Nhiều domain thông tin** (user + theme + locale) | **Tách nhiều Context** hoặc **Store** | Một context "ôm tất cả" khiến "mọi" consumer "render" "lẫn" |

### 5. Đối chiếu Angular (điểm ăn điểm cho người từ Angular)

| React (Context) | Angular (DI container) | Cùng vấn đề |
|---|---|---|
| `createContext` default `null` | `@Injectable` | "Tạo" "kênh" "chia sẻ" |
| `<Provider value>` bọc subtree | `providers: [...]` scoped (hoặc `root` = toàn app) | "Scope" "một" "instance" |
| `useContext(Ctx)` đọc "gần nhất" | `constructor(private svc: Svc)` inject "gần nhất" | "Consumer" "đọc" "instance" "cận" |
| 2 Provider cùng context "lồng" = "2 state" "độc lập" | 2 `providers` scoped = "2 instance" "độc lập" | "Provider" "scoped" (lồng "gần nhất" "thắng") |

> **Điểm khác cơ bản**: Angular DI = **class + token + singleton** (mỗi `@Injectable` "một instance" "toàn app" nếu `"root"`); React Context = **value + hook** (không lifecycle, không interceptor, không singleton class — mỗi Provider "một value riêng"). Vì sao React "không" "DI" "sẵn" → xem Q1 (library vs framework).

### 6. 5 bẫy phổ biến (nếu bị hỏi sâu)

| Bẫy | Đúng làm |
|---|---|
| Context cho dữ liệu "động" "nhiều lần" (input gõ, cart) | **Chuyển sang store** (DAY 8) — selector giới hạn re-render, an toàn hơn Context "ôm" |
| Một context "ôm" "nhiều domain" (theme + user + locale) | **Tách** "mỗi domain" "một context" (hoặc store) — "đổi" "cái nào render" "cái" "đó" |
| Default `null` "nhưng" "không guard" (dùng `?.`) | **"Bọc" `useContext` "trong custom hook" (throw)** — "lỗi sớm, clear", không UI "câm" |
| Object literal `value={{...}}` "mới" "mỗi render" | **Bật Compiler** hoặc `useMemo` value — tránh consumer "re-render" "thừa" |
| Lẫn Context "và Store" (dùng Context cho cart) | **Context** = "ít đổi" (theme); **Store** = "động + nhiều" (cart) — "nhầm phạm vi" là "đắt" "không cần" |

## Bẫy khi phỏng vấn

1. **"Context thay thế toàn bộ prop drilling"** (nói suông) → **sai**: Context giải quyết "đục lỗ nhiều tầng", **không thay** props ở "1–2 tầng" (props vẫn rõ hơn).
2. **"Context nhanh hơn props"** → **sai**: cùng "đắt" (value đổi → consumer re-render); khác ở **phạm vi** (1 tầng vs nhiều tầng).
3. **"Mọi state cần Context"** → **sai**: **động thường xuyên** → Store; **ít đổi + sâu** → Context; **thấp (1–2 tầng)** → props.
4. **Default `null` nhưng không throw (dùng `?.`)** → UI "câm" (thiếu Provider thì "trống", không lỗi). **Fix**: guard + throw.
5. **Một context cho nhiều domain** → "mọi consumer re-render lẫn". **Fix**: tách context.

## Gợi ý câu chốt

> "Context là 'ống dẫn' (piping) truyền 1 giá trị từ Provider xuống mọi consumer trong subtree — không cần 'đục lỗ' (drill) qua từng component trung gian. Props chỉ đi 1 tầng; muốn xuyên 3–4 tầng mà không đục → Context. **Quy tắc chọn: 1–2 tầng rõ = props; 3+ tầng ít đổi = Context; đổi thường xuyên = Store (không phải Context)**. Điểm khác cơ bản với Angular DI: Angular có container + singleton, React chỉ có 'value + hook' (mỗi Provider một value riêng). Và điều quan trọng nhất: **Context cho dữ liệu ÍT đổi; dữ liệu ĐỘNG → Store**."

## Reference

- [`3_react-tutorial/7-context-basic`](../../3_react-tutorial/7-context-basic) — "ba mảnh" `createContext` → Provider → `useContext`, "custom hook guard", "scope" (Provider lồng), "đối chiếu Angular DI"
- [`3_react-tutorial/8-external-store`](../../3_react-tutorial/8-external-store) — **Store (Zustand/Redux)** khi "dữ liệu động + nhiều" (không phải Context)
- [`3_react-tutorial/3-props-interaction`](../../3_react-tutorial/3-props-interaction) — **"prop drilling"** (vấn đề Context "giải quyết" "nhiều tầng")
- [`3_react-tutorial/10-memo-format`](../../3_react-tutorial/10-memo-format) — "value" "object" "mới" "mỗi" "render" → "consumer" "re-render" "thừa"
- Q1 (Library vs Framework) — "vì sao React 'không có' DI (Angular có, React không)"; "value + hook" vs "class + token"
- Q9 (Lifting state up) — "đưa state lên 'cha chung gần nhất'"; "khi 'quá cao' (nhiều tầng) → Context/Store"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q9 — state nên đặt ở đâu?](../09-lifting-state-up/README.md) · [Q14 — đổi value Context thì bao nhiêu component render lại?](../14-context-rerender/README.md)
- **Đào sâu (xuyên nhóm)**: [Q15 — data đổi liên tục thì nên dùng store (Redux/Zustand) không?](../15-external-stores/README.md) · [Q16 — chặn re-render thừa bằng memo?](../16-memo/README.md)
