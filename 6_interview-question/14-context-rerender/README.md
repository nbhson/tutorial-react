# Q14: Đổi một giá trị trong Context thì có phải cả app render lại không?

## Câu hỏi

> Khi giá trị Context đổi, bao nhiêu component sẽ render lại — có phải cả app không?
> Làm sao giảm re-render thừa (ví dụ khi `value` là object literal)?

## Trả lời ngắn (elevator pitch, 30 giây)
- Đổi value thì **chỉ những component có gọi `useContext` mới vẽ lại** — component không đọc thì đứng yên, không phải cả app.
- Component ở giữa không đọc Context cũng đứng yên (React đi thẳng tới nơi đọc, khác props là cha vẽ thì con vẽ theo).
- Bẫy hay gặp nhất: `value={{...}}` tạo object mới mỗi lần cha vẽ → React tưởng đổi → vẽ lại hết. Sửa bằng `useMemo` cho value hoặc tách thành 2 context.

## Trả lời chi tiết

### 1. Ai re-render khi value đổi — chính xác

```
Provider (ThemeCtx) render → value mới (reference đổi, so bằng Object.is)
   → React đánh dấu tất cả CONSUMER của ThemeCtx trong subtree cần render
   → consumer chạy lại function + reconciliation như thường
   → component KHÔNG đọc ThemeCtx (tầng trung gian Page, Card...) → ĐỨNG YÊN
```

Quy tắc 3 vế (nói được đủ 3 vế là "ăn điểm"):

| Component | Re-render khi value đổi? |
|---|---|
| **Consumer** (gọi `useContext(Ctx)`), nằm **bên dưới** Provider gần nhất | **Có** |
| **Tầng trung gian** không đọc Context | **Không** (React "xuyên qua") |
| Consumer ở **ngoài** subtree của Provider đó (không được bọc) | **Không** (đọc default) |

Ví dụ (2 Provider lồng — scoped như `providers: [...]` của Angular):

```tsx
<ThemeProvider>                     {/* value = A */}
  <ThemedButton />                   {/* consumer: đọc A */}
  <ThemeProvider>                    {/* value = B (lồng trong) */}
    <ThemedButton />                 {/* consumer: đọc B (Provider gần nhất) */}
  </ThemeProvider>
</ThemeProvider>
```

Toggle **provider trong** (B đổi) → chỉ consumer trong subtree **trong** render; **consumer ngoài** (đọc A) **không đổi**. Provider lồng "gần nhất thắng" — cùng cơ chế scoped của Angular DI.

### 2. Vì sao `value={{ theme, toggle }}` (object literal) gây re-render thừa

```tsx
// Provider render lại (state phụ đổi) → value MỚI
// (object literal tạo lại mỗi render) → React so Object.is → "khác" →
// mọi consumer render lại DÙ theme không đổi
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>; // ❌ mỗi render = object mới
}
```

3 cách xử lý:

1. **Bật React Compiler** (chuẩn 2026 — khuyến nghị cho app mới): compiler auto-memo `value` (và callback) khi thấy ổn định — không cần `useMemo` tay (xem [`4_react-new-feature/5_react-compiler`](../../4_react-new-feature/5_react-compiler)).
2. **Tách value + actions thành 2 context** (cơ chế kinh điển): `ThemeCtx` (giá trị, ít đổi) và `ThemeActionsCtx` (hàm `toggle` — stable) tách riêng → đổi theme chỉ kéo consumer "value", không kéo consumer "actions".
3. **`useMemo` thủ công** (khi chưa bật Compiler): `const value = useMemo(() => ({ theme, toggle }), [theme])`.

### 3. Cách "thay value" đúng (liên hệ Q "gì khiến UI render lại")

Value đổi **qua** 1 trong 2 đường — không có đường thứ ba:

```tsx
// (a) Provider (component giữ state) tự đổi:
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  // setTheme → Provider re-render → value mới → consumer re-render
}

// (b) Consumer "đẩy" đổi lên (callback do Provider cấp qua value — pattern chuẩn):
const { theme, toggle } = useTheme();
<button onClick={toggle}>Đổi theme</button> // consumer không tự sửa context;
                                            // nó gọi hàm mà Provider "cấp"
```

**Không có cách "viết trực tiếp" vào Context** (context là read-only từ góc nhìn consumer; mutation phải đi qua **state ở Provider** — tức lifting state up, xem [`09-lifting-state-up`](../09-lifting-state-up/README.md)).

### 4. Khi nào chuyển sang Store (vượt phạm vi Context)

Dữ liệu **đổi liên tục** (mỗi phím gõ, cart, stream) → Context **đắt** (mọi consumer render mỗi lần value đổi). **Store** (Zustand/Redux, [`8-external-store`](../../3_react-tutorial/8-external-store)) cho **selector**: mỗi consumer **chỉ subscribe đúng slice** nó đọc → đổi slice A không kéo consumer slice B. Đây là **giới hạn hiệu năng** của Context.

## Bẫy khi phỏng vấn

1. **"Context đắt vì cả app re-render"** (nói suông) → **sai**: chỉ **consumer** trong **subtree** của Provider. Tầng trung gian không đọc **đứng yên**.
2. **"Không chênh hiệu năng Context vs props"** → **sai**: điểm khác là **phạm vi** (props = 1 tầng, context = nhiều tầng), cùng mức "đắt" khi value đổi (consumer render).
3. **Một context "ôm" nhiều domain (theme + user + locale)** → mọi consumer render lẫn (đổi theme kéo locale). Fix: **tách context** (hoặc store).
4. **Value object literal mới mỗi render** → consumer render thừa dù giá trị không đổi. Fix: **Compiler** (chuẩn) / `useMemo` / tách value + actions.
5. **Consumer thử "sửa" context trực tiếp** → context read-only; muốn đổi → gọi callback do Provider cấp (mô hình một chiều — xem [`09-lifting-state-up`](../09-lifting-state-up/README.md)).

## Gợi ý câu chốt

> "Khi context value đổi (so bằng `Object.is`), React **re-render tất cả consumer** (component gọi `useContext`) **trong subtree của Provider** — tầng trung gian không đọc **đứng yên**, không phải cả app. Bẫy lớn nhất: `value` là object literal thì "mới" mỗi lần Provider render → consumer render thừa; fix bằng React Compiler (auto-memo) hoặc tách value + actions thành 2 context. Và khi data **đổi liên tục** (không phải 'ít đổi' như theme), dừng lại ở Context mà chuyển **Store** (selector giới hạn re-render đúng slice)."

## Reference

- [`3_react-tutorial/7-context-basic`](../../3_react-tutorial/7-context-basic) — "re-render theo consumer, không phải cả app", Provider lồng (scoped), tách context theo domain, `value` object mới mỗi render
- [`3_react-tutorial/8-external-store`](../../3_react-tutorial/8-external-store) — Store + selector (giới hạn re-render đúng slice)
- [`4_react-new-feature/5_react-compiler`](../../4_react-new-feature/5_react-compiler) — Compiler auto-memo `value` (chuẩn 2026)
- Q13 (Context vs Props) — "nguyên tắc chọn khi nào dùng Context"
- Q9 (Lifting state up) — "state ở Provider, consumer đẩy đổi lên qua callback"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q13 — Context khác props khi nào?](../13-context-vs-props/README.md) · [Q16 — memo chặn re-render thừa?](../16-memo/README.md)
- **Đào sâu (xuyên nhóm)**: [Q30 — pipeline render: value Context đổi thì cascade ra sao?](../30-rerender-pipeline/README.md) · [Q15 — data đổi liên tục (giây) thì nên dùng store không?](../15-external-stores/README.md)
