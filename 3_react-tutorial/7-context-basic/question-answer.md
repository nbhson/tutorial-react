# DAY 7 — Hỏi & Đáp: Context cơ bản

> File hỏi–đáp chi tiết cho `3_react-tutorial/7-context-basic`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (ThemeContext chạy được).

---

## 1. Context là gì? Khác props ở đâu?

**Hỏi:** Context và props đều truyền dữ liệu xuống con — khác nhau thế nào?

**Đáp:**
- Props truyền **1 tầng** (cha → con trực tiếp). Context là **ống dẫn từ Provider xuống mọi con
  trong subtree**, xuyên qua tầng trung gian mà không cần đục lỗ từng tầng.
- Tương đương DI phân cấp của Angular nhưng đơn giản hơn: không module, không decorator, không container —
  chỉ 3 mảnh: `createContext` → `Provider` → `useContext`.

```tsx
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);
```

---

## 2. Bộ 3 `createContext` / `Provider` / `useContext` làm gì?

**Hỏi:** Mỗi mảnh trong ThemeContext đảm nhiệm vai trò gì?

**Đáp:**
- `createContext(default)` — tạo "ống" + giá trị mặc định khi không có Provider.
  Default nên là **`null`** để ép kiểm tra scope (lỗi lộ sớm thay vì chạy sai ngầm).
- `<ThemeCtx.Provider value={{ theme, toggle }}>` — nạp giá trị thật cho cả subtree bên trong.
  React 19 rút gọn thành `<ThemeCtx value={...}>` (tương đương).
- `useContext(ThemeCtx)` — con đọc giá trị từ Provider **gần nhất** bao quanh nó.
- Trong example còn có `ThemeProvider` (component bọc, giữ `useState<Theme>`) và `useTheme()` (hook guard).

---

## 3. `useTheme()` guard để làm gì? Sao không gọi `useContext` trực tiếp?

**Hỏi:** Vì sao phải bọc thêm hook kiểm tra `if (!ctx) throw`?

**Đáp:**
- Gọi `useContext` ngoài mọi Provider trả về default (`null`) → đọc `.theme` trên `null` là **crash khó hiểu**.
  Hook guard biến nó thành **lỗi rõ ràng**: `"useTheme cần <ThemeProvider>"` — biết ngay thiếu Provider ở đâu.
- Pattern chuẩn: mỗi context viết một hook guard riêng (`useTheme`, `useAuth`, `useCart`) và **không export
  context thô** — ép mọi consumer đi qua cửa kiểm tra.

---

## 4. Value đổi thì ai re-render? Có giống store không?

**Hỏi:** Bấm toggle đổi theme, cả app re-render hay chỉ nút?

**Đáp:**
- Chỉ **consumer** — component đã gọi `useContext(ThemeCtx)` trong subtree — re-render.
  Component không đọc context thì đứng yên (dù nằm cùng cây).
- **Không giống store tối ưu:** Context không có selector — mọi consumer re-render dù chỉ dùng 1 field nhỏ.
  Dữ liệu cập nhật nhanh + nhiều subscriber → dùng store + selector (DAY 8), không nhét vào Context.

---

## 5. Provider lồng nhau thì con đọc của ai?

**Hỏi:** Hai `<ThemeProvider>` lồng nhau, con ở trong cùng đọc theme nào?

**Đáp:**
- Đọc Provider **gần nhất** bao quanh nó (override có phạm vi) — giống provider scoped của Angular.
  Đây chính là ý nghĩa "phân cấp": subtree con có thể ghi đè config của subtree cha mà không ảnh hưởng bên ngoài.

---

## 6. Khi nào dùng Context vs props vs store?

**Hỏi:** Ba cách truyền dữ liệu này chọn thế nào?

**Đáp:**
- **Props** — dữ liệu đi 1–2 tầng, quan hệ cha-con rõ ràng. Mặc định luôn ưu tiên props.
- **Context** — config **ít đổi**, nhiều nơi đọc: theme, locale, auth, router. Tránh dữ liệu gõ từng phím.
- **Store (DAY 8)** — state **hay đổi + nhiều subscriber**: giỏ hàng, realtime, form lớn. Có selector giảm re-render.
- Dấu hiệu sai: nhét counter gõ liên tục vào Context → cả cụm re-render vô tội vạ; hoặc đục props 5 tầng
  cho theme → prop drilling, lúc đó Context đúng hơn.

---

## 7. So nhanh Angular DI ↔ Context?

**Hỏi:** Từng khái niệm DI Angular tương đương gì?

**Đáp:**

| Angular | React Context | Ghi chú |
|---|---|---|
| `@Injectable({ providedIn: "root" })` | context + Provider ở root | Một nguồn cho cả app |
| `providers: [...]` scoped | Provider bọc subtree | Gần nhất thắng |
| `constructor(private svc: Svc)` | `const { theme } = useTheme()` | Đọc tại chỗ dùng, không constructor |
| `BehaviorSubject` + `async` pipe | Context KHÔNG thay được — sang store (DAY 8) | Context thiếu selector/tối ưu stream |

---

## 8. Tách Context để giảm re-render: `ThemeValue` + `ThemeActions` thế nào?

**Hỏi:** Bấm toggle theme mà cả nút không cần `toggle` cũng re-render — tách sao?

**Đáp:**
- Nguyên nhân: `value={{ theme, toggle }}` là object mới mỗi render, và Context **không có selector** — mọi consumer của `ThemeCtx` re-render dù chỉ đọc `theme` hay chỉ đọc `toggle`. Với theme ít đổi thì vô hại, nhưng với state đổi liên tục (search, drag) là thảm họa perf.
- Cơ chế tách: tạo 2 context — một chứa **giá trị đổi theo state** (`theme`), một chứa **hàm ổn định** (`toggle`). Component chỉ hiển thị chữ đăng ký context giá trị; component chỉ bấm nút đăng ký context hành động. Đổi `theme` thì nút bấm không re-render vì context nó đọc không đổi.
- Quy tắc nhận diện: khi thấy một consumer chỉ dùng `toggle` mà vẫn re-render mỗi lần `theme` đổi (check bằng React DevTools highlight), đó là tín hiệu tách. Trước Compiler phải `useMemo` cho value; có Compiler 1.0 thì chi phí giảm nhưng tách vẫn rõ ngữ nghĩa hơn.

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const ThemeValueCtx = createContext<Theme>("light"); // context chỉ chứa giá trị theme
const ThemeToggleCtx = createContext<() => void>(() => {}); // context chỉ chứa hàm toggle

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light"); // state theme đổi khi toggle
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light")); // hàm đảo theme
  return (
    // Lồng 2 Provider: consumer nào đọc context nào thì chỉ re-render theo context đó
    <ThemeValueCtx.Provider value={theme}>
      <ThemeToggleCtx.Provider value={toggle}>{children}</ThemeToggleCtx.Provider>
    </ThemeValueCtx.Provider>
  );
}

function ThemeLabel() {
  const theme = useContext(ThemeValueCtx); // chỉ re-render khi theme đổi
  return <p>Theme: {theme}</p>;
}
```

---

## 9. Viết `createSafeContext` generic tái dùng cho mọi domain thế nào?

**Hỏi:** Mỗi context viết một `useTheme`/`useAuth` guard lặp code — gộp được không?

**Đáp:**
- Được, bằng factory generic trả về cặp `[Provider, useCtx]`. Cơ chế: factory tạo `createContext<T | null>(null)` bên trong, định nghĩa `Provider` bọc `value` nhận từ props, và `useCtx` đọc context + `throw` khi `null` kèm tên hook để message rõ. Mỗi domain gọi factory một lần là có bộ an toàn riêng, không chia sẻ nhầm context.
- Vì sao không export context thô: ép mọi consumer đi qua hook guard, lỗi thiếu Provider lộ ngay với tên domain cụ thể ("useAuth cần <AuthProvider>") thay vì crash `cannot read .user of null` khó trace.
- Sai thì sao: quên truyền `hookName` thì message generic, debug chậm hơn. Fix: luôn truyền tên hook khi tạo.

```tsx
import { createContext, useContext, type ReactNode } from "react";

// Factory tạo context an toàn: dùng chung cho theme, auth, locale...
function createSafeContext<T>(hookName: string) {
  const Ctx = createContext<T | null>(null); // default null để ép kiểm tra scope
  function Provider({ value, children }: { value: T; children: ReactNode }) {
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>; // nạp giá trị cho subtree
  }
  function useCtx(): T {
    const ctx = useContext(Ctx); // đọc từ Provider gần nhất
    if (!ctx) throw new Error(`${hookName} cần Provider tương ứng`); // lỗi rõ thay vì crash null
    return ctx;
  }
  return [Provider, useCtx] as const; // trả cặp để nơi dùng bung ra
}

// Cách dùng: mỗi domain một cặp riêng, không lẫn nhau
const [ThemeProvider, useTheme] = createSafeContext<{ theme: string }>("useTheme");
```

---

## 10. Lỗi thực chiến: đặt Provider quá cao + quên `useMemo` cho value?

**Hỏi:** Bọc Provider ở root cho tiện có hại gì? Object literal mỗi render sao lại tệ?

**Đáp:**
- Hai lỗi hay đi cùng nhau. Đặt Provider ở root (bọc cả app) thì mỗi lần value đổi, **mọi consumer trong cả app** re-render — dù trang đang xem không liên quan theme. Đặt Provider **sát nơi cần nhất** (layout của cụm dùng theme) thì phạm vi re-render gọn.
- Object literal `value={{ theme, toggle }}` tạo tham chiếu mới mỗi render của Provider — kể cả khi `theme` không đổi (cha re-render vì lý do khác), consumer vẫn thấy value "mới" và re-render theo. Trước Compiler phải bọc `useMemo(() => ({ theme, toggle }), [theme])`; có Compiler thì tự memo nhưng tách context (câu 8) vẫn là cách rõ nhất.
- Fix tổng: Provider đặt thấp + value memo/tách. Đo bằng DevTools Profiler: bấm toggle, xem component nào highlight mà không dùng theme là còn đặt sai.

| Cách đặt | Phạm vi re-render | Khi nào đúng |
|---|---|---|
| Provider ở root bọc cả app | Mọi consumer toàn app | Chỉ khi value thật sự global + ít đổi (locale, auth) |
| Provider sát cụm dùng (layout con) | Consumer trong cụm đó | Mặc định nên làm thế này |
| Một context khổng lồ cho mọi thứ | Đổi 1 field, cả cụm nhảy | Sai — tách theo domain (theme/user/locale riêng) |

---

## 11. Test component dùng Context và đối chiếu `@Optional()` của Angular?

**Hỏi:** Render `ThemedButton` đơn lẻ trong test thì sao? Angular `@Optional()` tương đương gì?

**Đáp:**
- Render trần `render(<ThemedButton />)` mà không bọc Provider thì `useTheme()` throw ngay trong render — test đỏ với message rõ. Đây là **hành vi mong muốn** (fail fast), không phải bug test. Fix test: bọc đúng Provider như prod (`render(<ThemeProvider><ThemedButton /></ThemeProvider>)`), và thêm một test riêng assert throw khi thiếu Provider để khóa contract scope.
- Tương đương Angular: `@Optional()` cho phép inject vắng mặt trả `null` thay vì lỗi. Bên React, default `null` + **không throw** chính là `@Optional()` (consumer tự check null, chạy ngoài Provider vẫn sống với giá trị mặc định). Còn default `null` + **throw trong hook** là inject bắt buộc (thiếu là lỗi ngay). Chọn bên nào tùy ngữ cảnh: theme nên bắt buộc (lộ sai scope), còn config có fallback hợp lý thì cho optional.
- Sai thì sao: test bọc Provider sai tầng (bọc ngoài nhưng consumer đọc context khác) vẫn throw — kiểm tra lại đúng cặp Provider/hook cùng factory.

```tsx
// Minh họa ý tưởng test (Vitest + RTL, xem chi tiết DAY 21)
import { render, screen } from "@testing-library/react";

// ĐÚNG: bọc Provider như prod thì button hiện theme
// render(<ThemeProvider><ThemedButton /></ThemeProvider>);
// expect(screen.getByRole("button")).toHaveTextContent("light");

// KHÓA CONTRACT: thiếu Provider phải throw message rõ, không được "câm"
// expect(() => render(<ThemedButton />)).toThrow("useTheme cần <ThemeProvider>");
```

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 7)
- https://react.dev/learn/passing-data-deeply-with-context
- https://react.dev/reference/react/createContext · https://react.dev/reference/react/useContext
