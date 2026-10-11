# DAY 18: I18N (ĐA NGÔN NGỮ)

## Mục tiêu bài học
- Hiểu cơ chế i18n trong React: key-based JSON + runtime switching, thay cho `$localize`/`@angular/localize` build-time của Angular.
- Làm chủ **react-i18next** (chuẩn 2026) cho app SPA Vite: `t("key")`, interpolation `{{name}}`, đổi ngôn ngữ runtime.
- Dùng `Intl` API để format số/ngày **theo locale hiện tại** và cập nhật `<html lang>` động.

## Khái niệm cốt lõi (Core)

### 1. Angular build-time — React runtime
Angular: attribute `i18n`, dịch qua XLIFF, mỗi ngôn ngữ build riêng (hoặc `$localize` tag). Đổi ngôn ngữ là reload/build khác. React i18next: toàn bộ bản dịch JSON trong bundle (hoặc lazy theo namespace), `changeLanguage()` đổi ngay không reload, 1 bundle phục vụ mọi ngôn ngữ.

```tsx
// Mini trong example.tsx: lang state + dict — đổi là re-render, không reload
const [lang, setLang] = useState<Lang>("vi");
const t = useMemo(() => dict[lang], [lang]);
<button onClick={() => setLang("en")}>EN</button> // bấm là mọi t.* đổi ngay
```

Vì sao runtime thắng cho SPA? Vì user đổi VI→EN giữa chừng không mất form đang nhập, không tải lại bundle. Giá: bundle ôm nhiều JSON (namespace + lazy load khi lớn) và key thiếu hiện key thô nếu không `fallbackLng`.

### 2. Đơn vị dịch là key, không phải câu code
`t("save")` tra `{ save: "Lưu" }`. Tách nội dung khỏi code → dịch giả làm JSON, dev làm key. Key theo ngữ cảnh (`checkout.title`, `errors.required`) — không key chung (`title`, `button`) vì cùng "title" mà checkout khác settings.

```tsx
// resources i18next thật (2 ngôn ngữ, interpolation {{name}}):
resources: {
  vi: { translation: { hello: "Xin chào {{name}}", save: "Lưu" } },
  en: { translation: { hello: "Hello {{name}}", save: "Save" } },
}
// Dùng: t("hello", { name: "Son" }) -> "Xin chào Son" (vi) / "Hello Son" (en)
```

Vì sao cả câu vào key? Vì nối `"Xin chào " + name` vỡ ngữ pháp ngôn ngữ khác (thứ tự tên khác, giống/cách khác). Interpolation `{{name}}` để dịch giả đặt tên đúng chỗ câu họ.

### 3. Interpolation + plural + nested
`t("hello", { name })` khớp `"Xin chào {{name}}"`. Plural (`item_one`/`item_other`, pedestal theo locale — tiếng Việt không chia, tiếng Anh/Rga chia), format (`{{v, number}}`), nested keys (`$t(common.save)` dùng chung). Example mini dùng hàm + plural tay để thấy ý; i18next khai trong JSON chuẩn hơn.

```tsx
// Plural đúng (không if tay "1 items"):
i18next: { item_one: "{{count}} item", item_other: "{{count}} items" }
t("item", { count }) // count=1 -> "1 item", =2 -> "2 items" (tự theo quy tắc locale)
// Example mini: t.items_one(count) + count state để bấm +1 xem số ít/nhiều đổi
```

### 4. Detector + fallback + namespace
`i18next-browser-languagedetector` đọc localStorage → navigator → cookie để locale mặc định thông minh (user Việt mở là `vi` ngay). `fallbackLng: "vi"` — thiếu key ở `en` thì rơi về `vi`, không hiện key thô. Namespace (`common`, `checkout`, `errors`) tách JSON theo domain — tránh file khổng lồ, lazy load theo route.

### 5. `Intl` theo locale hiện tại
`new Intl.NumberFormat(i18n.language, ...)` cho tiền/số/ngày khớp ngôn ngữ đang chọn. Hardcode `"vi-VN"` là đổi EN vẫn dấu chấm/phẩy Việt — sai. Example `money`/`today` `useMemo` theo `lang` (đổi lang là format lại).

### Keyword chính
`i18next` (core) + `react-i18next` (`useTranslation`, `t()`), interpolation (`{{name}}`), plural (`_one`/`_other`), `fallbackLng` (rơi về khi thiếu), `changeLanguage` (runtime switch), detector (đoán locale đầu), namespace (tách JSON), `Intl` + `i18n.language` (số/ngày theo locale), `<html lang>` (a11y/SEO).

## Luồng hoạt động (Flow)
1. `main.tsx` import `./i18n` **trước** render — module chạy `i18n.use(Detector).use(initReactI18next).init({...})` nạp resources. Quên import là `t` trả key thô (`"hello"` hiện chữ hello).
2. Detector chọn locale (localStorage `i18nextLng` → `navigator.language` → fallback `vi`) → i18next đặt `language` + nạp namespace tương ứng.
3. `App` mount, `useTranslation()` subscribe vào sự kiện `languageChanged`; `t` là hàm tra namespace hiện tại. `useMemo(dict[lang])` trong mini cùng ý (cache theo lang).
4. Lần đầu (`vi`): `t.hello("Son")` → "Xin chào Son"; `money` → `"120.000 ₫"`; `today` theo `vi`; `<html lang="vi">` qua effect.
5. Bấm EN → `setLang("en")` (mini) / `i18n.changeLanguage("en")` (thật) → phát sự kiện → mọi `useTranslation` re-render → `t` mới ("Hello Son"), `money`/`today` tính lại theo `en`, `<html lang="en">`.
6. Key thiếu ở `en` → `fallbackLng: "vi"` trả bản `vi` (mini: `?? dict.vi`). Không fallback là hiện key thô — tín hiệu thiếu dịch để bổ sung.
7. Plural: bấm "+1 mục" → `count` 2→3 → `t.items_one(count)` đổi ("2 items" → "3 items" EN; VI giữ "mục"). Không `if` tay.
8. Namespace lớn: route checkout chỉ nạp `checkout` JSON (lazy) — mount nhanh, không ôm cả từ điển.
9. Test (DAY 21): khởi tạo i18next với resources cố định, render, đổi locale, assert chuỗi — không phụ thuộc mạng.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` (dict mini + plural + Intl theo lang + `<html lang>`):

```tsx
// example.tsx — DAY 18: dict mini + react-i18next + Intl theo locale + <html lang>
// Mục đích: key JSON + runtime switch (không reload) + số/ngày theo locale + a11y lang.
import { useEffect, useMemo, useState } from "react"; // (1) lang state + memo bảng dịch + effect cập nhật <html lang>

// (2) Bảng dịch tối giản: key -> giá trị (hàm khi interpolation). Bản thật là JSON resources i18next.
const dict = {
  vi: {
    hello: (name: string) => `Xin chào ${name}`, // interpolation bản mini (hàm); i18next dùng "{{name}}"
    save: "Lưu",
    items_one: (n: number) => `${n} mục`, // plural giản lược; i18next có _one/_other + format
    total: "Tổng",
  },
  en: {
    hello: (name: string) => `Hello ${name}`,
    save: "Save",
    items_one: (n: number) => `${n} item${n === 1 ? "" : "s"}`, // số ít/nhiều tiếng Anh
    total: "Total",
  },
  ja: { hello: (name: string) => `こんにちは ${name}`, save: "保存", items_one: (n: number) => `${n} 件`, total: "合計" }, // (3) Thêm ja để demo fallback khi thiếu key
} as const;

type Lang = keyof typeof dict; // "vi" | "en" | "ja" — union chặn lang lạ

export default function App() {
  const [lang, setLang] = useState<Lang>("vi"); // (4) Runtime switch — đổi là re-render, không reload (khác Angular build-time)
  const [count, setCount] = useState(2); // số để demo plural + Intl
  // (5) "t" theo lang — tương đương i18n.getFixedT(lang). useMemo để bảng ổn định theo lang.
  const t = useMemo(() => dict[lang], [lang]);
  // (6) Fallback: thiếu key ở lang hiện tại thì rơi về vi (thay fallbackLng i18next).
  const hello = (t.hello ?? dict.vi.hello) as (n: string) => string;

  // (7) Intl theo locale hiện tại — KHÔNG hardcode "vi-VN". Đổi lang là số/tiền/ngày đổi theo.
  const money = useMemo(() => new Intl.NumberFormat(lang, { style: "currency", currency: lang === "ja" ? "JPY" : "VND" }).format(120000), [lang]);
  const today = useMemo(() => new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(new Date()), [lang]);

  // (8) Cập nhật <html lang> cho screen reader/SEO — quên là đọc sai ngôn ngữ.
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  return (
    <>
      <p>{hello("Son")}</p> {/* interpolation: cả câu vào key, không nối "Xin chào " + name */}
      <p>{t.items_one(count)} — {t.total}: {money} — {today}</p>
      <div>
        <button onClick={() => setLang("vi")}>VI</button>
        <button onClick={() => setLang("en")}>EN</button>
        <button onClick={() => setLang("ja")}>JA</button>
        <button onClick={() => setCount((c) => c + 1)}>+1 mục (test plural)</button>
      </div>
      <button>{t.save}</button>
    </>
  );
}

// Ghi chú react-i18next thật (xem README copy đầy đủ):
// import i18n from "i18next"; LanguageDetector (navigator/localStorage) + initReactI18next +
// resources { vi: { translation: { hello: "Xin chào {{name}}" } } } + fallbackLng: "vi" +
// interpolation: { escapeValue: false } (React đã escape). Component: const { t, i18n } = useTranslation();
// <button onClick={() => i18n.changeLanguage("en")}>{t("save")}</button> +
// new Intl.NumberFormat(i18n.language, ...) + effect document.documentElement.lang = i18n.language.
```

`src/i18n.ts` thật + dùng trong component:

```ts
// src/i18n.ts — npm i i18next react-i18next i18next-browser-languagedetector
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector)   // đoán locale từ trình duyệt/localStorage
  .use(initReactI18next)   // cắm vào React (useTranslation subscribe)
  .init({
    resources: {
      vi: { translation: { hello: "Xin chào {{name}}", save: "Lưu" } },
      en: { translation: { hello: "Hello {{name}}", save: "Save" } },
    },
    fallbackLng: "vi",                       // thiếu key rơi về vi, không hiện key thô
    interpolation: { escapeValue: false },   // React đã escape XSS, tránh escape kép &amp;
  });
export default i18n;
// main.tsx: import "./i18n"; — TRƯỚC createRoot().render()
```

```tsx
import { useTranslation } from "react-i18next";

function Toolbar() {
  const { t, i18n } = useTranslation(); // t theo namespace hiện tại; i18n cho language/changeLanguage
  return (
    <button onClick={() => i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi")}>
      {t("save")}
    </button>
  );
}
// Số/ngày: new Intl.NumberFormat(i18n.language, { style: "currency", currency: "VND" })
```

## Giải thích từng phần
- Dòng `dict` 3 ngôn ngữ: mô phỏng resources. Vì sao hàm cho `hello`? Vì mini không có engine `{{name}}` — hàm nhận `name` trả câu là interpolation tay. Bản thật `{{name}}` để dịch giả (không code) đặt tên đúng chỗ.
- Dòng `type Lang = keyof typeof dict`: union từ keys — `setLang("fr")` báo compile (chưa có từ điển). Thêm ngôn ngữ là thêm entry dict + union tự mở.
- Dòng `useMemo(() => dict[lang], [lang])`: cache bảng theo lang — `getFixedT` của i18next cùng ý. Vì sao memo? Để `t` ổn định tham chiếu theo lang (tránh tạo object mỗi render làm con memo miss).
- Dòng fallback `t.hello ?? dict.vi.hello`: `??` chỉ khi `null`/`undefined` (thiếu key), giữ `""`/`0` nếu cố ý rỗng. `fallbackLng` i18next cùng ý nhưng tự động mọi key.
- Dòng `Intl.NumberFormat(lang, ...)` theo `lang`: ĐÚNG (đổi EN là dấu phẩy/chấm + ký hiệu đổi). Hardcode `"vi-VN"` là SAI khi đa ngôn ngữ (EN vẫn format Việt). `currency` theo lang (`JPY` cho ja) vì tiền cũng bản địa.
- Dòng `useEffect(() => { document.documentElement.lang = lang; }, [lang])`: DOM ngoài nên effect (không phải render). Vì sao `<html lang>`? Vì screen reader chọn giọng đọc + hyphenation + SEO theo nó. Quên là user khiếm thị nghe giọng sai.
- Dòng `interpolation.escapeValue: false`: React render đã escape (`<` → `&lt;`) chống XSS. i18next escape nữa là kép (`&amp;lt;` hiện chữ). Tắt ở i18next, để React lo.
- Dòng `useTranslation("checkout")`: `t` gắn namespace — `t("title")` tra `checkout.title`. Vì sao namespace? Để JSON nhỏ theo route + lazy (`i18n.loadNamespaces`) — `common` mount nhanh.
- Quy tắc **key thiếu trả key**: `t("missing")` → `"missing"` (không crash). Đây là tín hiệu "chưa dịch" — thấy key thô trên UI là biết bổ sung, không phải bug render.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `i18n` attribute + XLIFF build-time | key JSON + `t("key")` runtime | Runtime đổi không reload; 1 bundle mọi ngôn ngữ |
| `$localize` tagged template | `t("key", { ... })` interpolation | Cùng tra cứu theo key + tham số |
| `import locale` + `registerLocaleData` | `Intl` built-in (không đăng ký) | Trình duyệt có sẵn locale data |
| Mỗi ngôn ngữ build riêng / server redirect | 1 bundle + resources JSON (+ lazy namespace) | Đổi tức thì, giữ form đang nhập |
| `LOCALE_ID` DI (cố định) | `i18n.language` (đổi runtime) | Đọc locale hiện tại để Intl/lang |
| ICU MessageFormat plural | i18next `_one`/`_other` + format | Khai trong JSON, không `if` tay |
| Number/date theo locale (pipe) | `Intl` + `i18n.language` (DAY 10) | Không hardcode locale |
| `Transloco`/`ngx-translate` (runtime) | `react-i18next` | Cùng hướng runtime JSON |
| Detector không có (build quyết) | `i18next-browser-languagedetector` | Đoán từ navigator/localStorage |

## Lỗi thường gặp (Common pitfalls)

### 1. Quên import `./i18n` trước render → key thô
```tsx
// ❌ SAI: main.tsx không import i18n — resources chưa nạp, t("hello") hiện "hello"
// main.tsx: createRoot(...).render(<App />);

// ✅ ĐÚNG: import trước render
// main.tsx:
import "./i18n"; // chạy init trước
createRoot(document.getElementById("root")!).render(<App />);
```

### 2. Nối chuỗi thay vì key + interpolation → không dịch + sai ngữ pháp
```tsx
// ❌ SAI: dịch giả không thấy câu, thứ tự tên sai ở ngôn ngữ khác
<p>{"Xin chào " + name}</p>
```
```tsx
// ✅ ĐÚNG: cả câu vào key, tên là tham số
// vi: { hello: "Xin chào {{name}}" } en: { hello: "Hello {{name}}" }
<p>{t("hello", { name })}</p>
```

### 3. Sai cú pháp ngoặc (`{name}` thay `{{name}}`)
Mô tả: resource `"Hello {name}"` (1 ngoặc) mà gọi `t("hello", { name })` → hiện nguyên `{name}`. Fix: i18next mặc định `{{name}}` (2 ngoặc) — khớp cả hai phía.

### 4. `Intl` hardcode locale → đổi ngôn ngữ format không đổi
```tsx
// ❌ SAI: EN vẫn chấm/phẩy Việt
new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
```
```tsx
// ✅ ĐÚNG: theo locale hiện tại (như example money/today)
new Intl.NumberFormat(i18n.language, { style: "currency", currency: "VND" }).format(n)
```

### 5. Một file dịch khổng lồ → chậm + conflict
Mô tả: `translation.json` 2000 key — tải chậm, merge xung đột. Fix: namespace (`common`/`checkout`/`errors`) + lazy theo route (`loadNamespaces`), `common` nhỏ cho mount nhanh.

### 6. Không `<html lang>` → screen reader sai giọng
```tsx
// ❌ SAI: đổi EN mà <html lang="vi"> — đọc giọng Việt cho tiếng Anh
```
```tsx
// ✅ ĐÚNG: effect theo language (như example)
useEffect(() => { document.documentElement.lang = i18n.language; }, [i18n.language]);
```

### 7. Plural tay (`1 items`) → sai
```tsx
// ❌ SAI: `${n} item(s)` hoặc if tay — sai quy tắc nhiều locale (Nga/Anh/Việt khác nhau)
<p>{n} item{n > 1 ? "s" : ""}</p>
```
```tsx
// ✅ ĐÚNG: plural keys để engine lo
// { item_one: "{{count}} item", item_other: "{{count}} items" }
<p>{t("item", { count: n })}</p>
```

### 8. Key chung chung (`title`) → trùng/khó dịch
Mô tả: 5 màn đều `t("title")` mà nghĩa khác nhau — dịch 1 kiểu sai 4 chỗ. Fix: ngữ cảnh (`checkout.title`, `settings.title`) — dài hơn nhưng đúng.

## Best practices / Mẹo
- **Key ngữ cảnh** (`checkout.title`, `errors.required`) — tránh trùng, dịch giả hiểu. Vì sao? Vì từ rời ngữ cảnh không dịch đúng (title của gì?).
- Mọi số/ngày/tiền qua `Intl` + `i18n.language` — không hardcode. Vì sao? Vì format là bản địa (dấu, ký hiệu, thứ tự ngày) — hardcode là sai nửa thế giới.
- SPA Vite → react-i18next; Next.js SSR → next-intl (tích hợp server tốt hơn). Vì sao chọn? Vì SSR cần dịch trên server + streaming, next-intl sinh cho đó.
- Type-safe key (gen type từ resources) để `t("sai")` báo compile + autocomplete. Vì sao? Vì key string thô sai chính tả không ai báo tới khi thấy UI.
- Namespace + lazy khi lớn; `common` nhỏ. Vì sao? Để mở app không tải từ điển checkout chưa vào.
- Test với i18next instance cố định (DAY 21) — assert chuỗi theo locale. Vì sao cố định? Để test không phụ thuộc mạng/detector máy chạy.
- Không đổi key đã dịch (dịch lại tốn công) — key ngắn nhưng ổn định. Vì sao? Vì mỗi key mới là chi phí dịch + review lại.

## Bài tập nhỏ
1. Chia dict thành `common`/`checkout` + thêm `ja` vài key, thiếu rơi về `vi` (fallback). Quan sát key nào thiếu hiện bản `vi`.
2. react-i18next + `Intl.NumberFormat(i18n.language, {currency:"VND"})` — đổi VI/EN dấu phân cách đổi không? Vì sao hardcode vỡ?
3. Nút `ja` + `fallbackLng` — cố ý thiếu 1 key `ja`, kiểm tra rơi về `vi` (không hiện key thô).
4. Lazy namespace theo route (`loadNamespaces("checkout")` khi vào checkout) — Network tab thấy JSON nạp khi vào, không lúc mở app.
5. `document.title` theo ngôn ngữ (effect) + `<html lang>` — screen reader/SEO đổi theo. Quên thì sao?

## Reference
- https://react.i18next.com/
- https://www.i18next.com/translation-function/interpolation
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- https://next-intl.dev/
