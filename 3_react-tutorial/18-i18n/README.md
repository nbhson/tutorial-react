# DAY 18: I18N (ĐA NGÔN NGỮ)

## Mục tiêu bài học
- Hiểu cơ chế i18n trong React: key-based JSON + runtime switching, thay cho `$localize`/`@angular/localize` build-time của Angular.
- Làm chủ **react-i18next** (chuẩn 2026) cho app SPA Vite: `t("key")`, interpolation `{{name}}`, đổi ngôn ngữ runtime.
- Dùng `Intl` API để format số/ngày **theo locale hiện tại** và cập nhật `<html lang>` động.

## Khái niệm cốt lõi (Core)
- **Angular i18n là build-time:** dùng attribute `i18n`, dịch qua XLIFF, mỗi ngôn ngữ build riêng (hoặc `$localize`). **React i18next là runtime:** toàn bộ bản dịch nằm trong JSON, đổi ngôn ngữ ngay không reload, một bundle phục vụ nhiều ngôn ngữ.
- **Đơn vị dịch là "key", không phải câu.** `t("save")` tra bảng `{ save: "Lưu" }`. Tách nội dung khỏi code → dịch giả làm việc với JSON.
- **Interpolation:** `t("hello", { name: "Son" })` khớp `"Xin chào {{name}}"`. i18next còn hỗ trợ plural (`_one`/`_other`), format, nested keys.
- **Phát hiện ngôn ngữ:** `i18next-browser-languagedetector` đọc `navigator.language`/localStorage/cookie — chọn locale mặc định thông minh.
- **`Intl` đi kèm locale:** `Intl.NumberFormat(i18n.language, ...)` để số/tiền/ngày khớp ngôn ngữ đang chọn — đừng hardcode `"vi-VN"`.
- **Namespace:** tách JSON theo domain (`common`, `checkout`, `errors`) — tránh file khổng lồ, dễ lazy load.
- **Keyword chính:** `i18next`, `useTranslation`, `t()`, interpolation, `fallbackLng`, `changeLanguage`, `Intl`, namespace, detector.

## Luồng hoạt động (Flow)
1. `main.tsx` import `./i18n` — module chạy `i18n.use(...).init({...})` **trước** React render.
2. `LanguageDetector` chọn locale (localStorage → navigator) → i18next nạp resource tương ứng (`vi` hoặc `en`).
3. `App` mount, `useTranslation()` subscribe vào i18next; `t` là hàm dịch cho namespace hiện tại.
4. Render lần đầu: `t("hello", { name: "Son" })` → "Xin chào Son" (nếu locale `vi`).
5. User bấm "EN" → `i18n.changeLanguage("en")` → i18next phát sự kiện `languageChanged`.
6. Mọi component dùng `useTranslation` re-render → `t(...)` trả bản dịch mới "Hello Son". Không reload trang.
7. Format số: `new Intl.NumberFormat(i18n.language, {...})` dùng locale mới → tiền tệ/ngày tháng đổi theo.
8. `<html lang>` nên cập nhật qua effect nhỏ hoặc i18next plugin — tốt cho a11y/seo.
9. Namespace/lazy load (nâng cao): chỉ nạp JSON của namespace cần cho route → giảm bundle khởi động.
10. Kiểm thử: khởi tạo i18next cho test với resource cố định, render component và assert chuỗi theo locale (DAY 21).

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 18: i18n tối giản không cần lib (mô phỏng t())
import { useMemo, useState } from "react";

// Bảng dịch tối giản: key -> giá trị (hàm nếu cần interpolation)
const dict = {
  vi: { hello: (name: string) => `Xin chào ${name}`, save: "Lưu" },
  en: { hello: (name: string) => `Hello ${name}`, save: "Save" },
} as const;

type Lang = keyof typeof dict;

export default function App() {
  const [lang, setLang] = useState<Lang>("vi");
  // "t" đổi theo lang — tương đương i18n.getFixedT(lang)
  const t = useMemo(() => dict[lang], [lang]);
  return (
    <>
      <p>{t.hello("Son")}</p>
      <button onClick={() => setLang("vi")}>VI</button>
      <button onClick={() => setLang("en")}>EN</button>
      <button>{t.save}</button>
    </>
  );
}
```

```ts
// src/i18n.ts — react-i18next thực tế (npm i i18next react-i18next i18next-browser-languagedetector)
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector)   // tự chọn ngôn ngữ từ trình duyệt
  .use(initReactI18next)   // cắm vào React
  .init({
    resources: {
      vi: { translation: { hello: "Xin chào {{name}}", save: "Lưu" } },
      en: { translation: { hello: "Hello {{name}}", save: "Save" } },
    },
    fallbackLng: "vi",                       // ngôn ngữ dự phòng
    interpolation: { escapeValue: false },   // React đã escape XSS
  });
export default i18n;
```

Dùng trong component với `useTranslation`:

```tsx
import { useTranslation } from "react-i18next";

function Toolbar() {
  const { t, i18n } = useTranslation();
  return (
    <button onClick={() => i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi")}>
      {t("save")}
    </button>
  );
}
```

## Giải thích từng phần
- `dict[lang]`: mô phỏng "namespace" — mỗi ngôn ngữ một object bản dịch. Bản thật thay bằng resources của i18next.
- `useMemo(() => dict[lang], [lang])`: cache bảng dịch theo `lang`; thực tế i18next làm việc này qua `getFixedT`.
- `t.hello("Son")` vs `t("hello", { name: "Son" })`: cùng ý tưởng; i18next dùng template `{{name}}` để không phải viết hàm cho từng câu.
- `setLang("en")` ↔ `i18n.changeLanguage("en")`: đổi ngôn ngữ runtime → mọi consumer re-render. Không build lại trang.
- `fallbackLng: "vi"`: nếu thiếu key ở ngôn ngữ hiện tại, dùng bản `vi` — tránh hiển thị key thô.
- `interpolation.escapeValue: false`: React tự escape khi render — tránh escape kép hiển thị `&amp;`.
- **`useTranslation` trả `t` đã gắn namespace:** `const { t } = useTranslation("checkout")` để `t("title")` tra đúng namespace.
- **`i18n.language` là nguồn locale chuẩn:** truyền vào `Intl.*Format` và `document.documentElement.lang`.
- **Key thiếu:** i18next trả chính key (mặc định) — dấu hiệu rõ để phát hiện bản dịch còn thiếu.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `i18n` attribute + XLIFF (build-time) | key JSON + `t("key")` (runtime) | Runtime switch không reload |
| `$localize` tagged template | `t("key", { ... })` | Cùng bản chất tagged lookup |
| `import locale vi` + `registerLocaleData` | `Intl` API (built-in) | Không cần đăng ký locale thủ công |
| mỗi ngôn ngữ build riêng / server | 1 bundle + resources JSON | Đổi ngôn ngữ tức thì |
| `LOCALE_ID` DI | `i18n.language` | Truy vấn locale hiện tại |
| ICU MessageFormat | i18next plurals/format | Plurals khai trong JSON |
| Number/date format theo locale | `Intl` + `i18n.language` | Xem DAY 10 cho chi tiết |
| `Transloco`/`ngx-translate` | `react-i18next` | Cùng hướng runtime translation |
| `LOCALE_ID` không đổi runtime | `i18n.changeLanguage` | Đổi tức thì, không reload |

## Lỗi thường gặp (Common pitfalls)
- **Quên import `./i18n` vào `main.tsx`** → `useTranslation` chạy nhưng không có resource → hiển thị key thô (`hello`). → Fix: import cấu hình trước khi render App.
- **Nối chuỗi thay vì dùng `t`** (`"Xin chào " + name`) → không dịch được, sai ngữ pháp ngôn ngữ khác. → Fix: đưa cả câu vào key + interpolation.
- **`t("hello", { name })` nhưng resource dùng `{name}` (1 ngoặc)** → không khớp. → Fix: i18next mặc định `{{name}}`.
- **Dùng `i18n.language` cũ sau khi đổi ngôn ngữ** nếu đọc ngoài hook — → Fix: truyền `i18n` từ `useTranslation()` vào `Intl.NumberFormat`.
- **Một file dịch khổng lồ** → tải chậm, conflict merge. → Fix: chia namespace + (nâng cao) lazy load resource theo route.
- **Không cập nhật `<html lang>`** → trình đọc màn hình đọc sai ngôn ngữ. → Fix: effect `document.documentElement.lang = i18n.language`.
- **Plural/số ít nhiều sai** (`1 items`) → dùng i18next plural keys `item_one`/`item_other` thay vì `inside$1` thủ công.
- **Đặt key quá chung chung** (`button`, `title`) → trùng nghĩa, khó dịch. → Fix: key theo ngữ cảnh (`checkout.title`).
- **Format ngày/số không dùng locale hiện tại** → hiển thị sai định dạng sau khi đổi ngôn ngữ. → Fix: luôn truyền `i18n.language`.

## Best practices / Mẹo
- **Đặt key theo ngữ cảnh** (`checkout.title`, `errors.required`) — tránh trùng lặp, dễ hiểu cho dịch giả.
- Dùng `Intl` cho **mọi** số/ngày/tiền; kết hợp `i18n.language` — không hardcode locale.
- Với Next.js: cân nhắc **next-intl** thay vì react-i18next (tích hợp SSR tốt hơn). SPA Vite: react-i18next là chuẩn.
- Type-safe i18n (nâng cao): khai type từ resource để `t("...")` autocomplete + bắt key sai lúc compile.
- Tách JSON theo namespace + lazy load khi app lớn; giữ `common` nhỏ để mount nhanh.
- Kiểm thử: render component với i18next test instance (DAY 21) để assert đúng bản dịch theo locale.
- **Giữ key ngắn nhưng có ngữ cảnh**; tránh đổi key đã dịch — dịch lại tốn công.
- **Cập nhật `<html lang>`** qua effect để a11y/SEO đúng; đồng bộ với `i18n.language`.

## Bài tập nhỏ
1. Chia `dict` của ví dụ thành 2 namespace (`common`, `checkout`) và thêm nút đổi sang tiếng Nhật (`ja`) với vài key; đảm bảo fallback về `vi` khi key thiếu.
2. Cài react-i18next: chuyển `App` sang `useTranslation`, thêm format tiền bằng `Intl.NumberFormat(i18n.language, {style:"currency", currency:"VND"})`; kiểm tra đổi VI/EN thì format tiền có đổi dấu phân cách không.
3. Thêm nút `ja` và `fallbackLng` để kiểm tra key thiếu rơi về ngôn ngữ dự phòng.
4. Tách resource theo namespace (`common`, `checkout`) và lazy load namespace khi vào route.
5. Cập nhật `document.title` theo ngôn ngữ bằng effect; kiểm tra a11y đọc đúng `lang`.

## Reference
- https://react.i18next.com/
- https://www.i18next.com/translation-function/interpolation
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- https://next-intl.dev/ (nếu dùng Next.js)