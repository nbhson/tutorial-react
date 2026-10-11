# DAY 18 — Hỏi & Đáp: i18n (đa ngôn ngữ)

> File hỏi–đáp chi tiết cho `3_react-tutorial/18-i18n`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (dict mô phỏng `t()` chạy được, không cần lib).

---

## 1. i18n React khác Angular ở điểm nào?

**Hỏi:** Angular dùng `i18n` attribute + XLIFF, React dùng gì?

**Đáp:**
- Angular là **build-time**: đánh dấu `i18n`, dịch qua file XLIFF, **mỗi ngôn ngữ build riêng** (hoặc `$localize`).
- React (`react-i18next`) là **runtime**: toàn bộ bản dịch nằm trong JSON, **đổi ngôn ngữ ngay không reload**,
  một bundle phục vụ nhiều ngôn ngữ.
- Đơn vị dịch là **"key", không phải câu**: `t("save")` tra bảng `{ save: "Lưu" }` — tách nội dung khỏi code
  để dịch giả làm việc với JSON, dev không sửa code khi đổi câu chữ.

---

## 2. `t()`, interpolation, plural là gì?

**Hỏi:** Ba khái niệm dịch thuật này dùng thế nào?

**Đáp:**
- `t("save")` — tra key ra chuỗi ngôn ngữ hiện tại. Trong example mô phỏng: `t.save` (`"Lưu"`/`"Save"`).
- **Interpolation** — chèn biến vào câu: `t("hello", { name: "Son" })` khớp `"Xin chào {{name}}"`
  (example mô phỏng bằng hàm `hello: (name) => ...` — cùng ý tưởng).
- **Plural** — số ít/nhiều theo luật từng locale (`_one`/`_other`; tiếng Việt không chia nhưng Anh/Nga có) —
  i18next tự chọn form theo count, khỏi `if` tay.

---

## 3. Đổi ngôn ngữ runtime hoạt động thế nào? (Luồng `changeLanguage`)

**Hỏi:** Bấm nút EN là cả app đổi chữ — cơ chế gì?

**Đáp:**
1. `i18n.changeLanguage("en")` → i18next phát sự kiện `languageChanged`.
2. Mọi component dùng `useTranslation()` (đã subscribe) **re-render** → `t(...)` tra bảng mới → chữ đổi.
3. **Không reload trang**, state (form đang gõ, scroll) giữ nguyên — điều build-time Angular không làm được.
- Trong example mô phỏng: `setLang("en")` → `useMemo(() => dict[lang])` chọn bảng mới → re-render.

---

## 4. `Intl` và `<html lang>` liên quan gì đến i18n?

**Hỏi:** Đổi chữ xong, số tiền/ngày tháng có tự đổi không?

**Đáp:**
- **Không tự đổi.** `Intl.NumberFormat("vi-VN")` hardcode thì tiền vẫn format kiểu Việt khi đang xem tiếng Anh.
  Phải truyền locale đang chọn: `new Intl.NumberFormat(i18n.language, ...)` — số/tiền/ngày khớp ngôn ngữ.
- `<html lang>` nên cập nhật theo (effect nhỏ hoặc plugin i18next) — tốt cho **a11y** (screen reader đọc đúng
  giọng) và **SEO** (Google biết trang đang ngôn ngữ nào).

---

## 5. Namespace và detector để làm gì?

**Hỏi:** Hai khái niệm nâng cao này giải quyết vấn đề gì?

**Đáp:**
- **Namespace** — tách JSON theo domain (`common`, `checkout`, `errors`): tránh 1 file khổng lồ,
  lazy load đúng namespace route cần → giảm bundle khởi động.
- **Detector** (`i18next-browser-languagedetector`) — chọn locale mặc định thông minh:
  localStorage → cookie → `navigator.language`. User Việt mở lần đầu tự thấy tiếng Việt, không cần bấm.

---

## 6. Test i18n thế nào? (Nhá hàng DAY 21)

**Hỏi:** Assert chuỗi dịch trong test ra sao khi locale đổi được?

**Đáp:**
- Khởi tạo i18next cho test với **resource cố định** (không detector, không load async), render component,
  assert chuỗi theo locale đang set. Đổi locale trong test rồi assert lại — kiểm tra cả luồng `changeLanguage`.
- Quy tắc: test tra đúng **key** chứ không hardcode câu dài dễ vỡ khi dịch giả sửa chữ.

---

## 7. Interpolation `{{name}}` + plural `_one/_other`: viết đúng cho Anh/Việt thế nào?

**Hỏi:** `t("hello", { name })` khớp template ra sao? Số ít/nhiều mỗi locale khác nhau thì sao?

**Đáp:**
- Cơ chế interpolation: resource khai template `"Xin chào {{name}}"` (hai ngoặc — một ngoặc là không khớp), gọi `t("hello", { name: "Son" })` thì i18next thay `{{name}}` bằng `"Son"`. Example mô phỏng bằng hàm `hello: (name) => ...` — cùng ý tưởng nhưng bản thật không viết hàm cho từng câu, chỉ viết template.
- Plural: i18next chọn form theo `count` và **luật từng locale** — tiếng Anh chia `one/other` ("1 item" vs "5 items"), tiếng Việt không chia (mọi số một form) nhưng vẫn nên khai đủ để đổi locale không vỡ. Key dạng `item_one`/`item_other`, gọi `t("item", { count: 5 })`.
- Sai thì sao: nối chuỗi `"Xin chào " + name` thì sang ngôn ngữ đảo thứ tự (Nhật: tên trước) là sai ngữ pháp — cả câu phải nằm trong key để dịch giả sắp xếp. Quên `count` thì plural luôn rơi form mặc định.

```tsx
// Resource minh họa (bản thật nằm trong i18n.init({ resources }))
const resources = {
  en: { translation: {
    hello: "Hello {{name}}", // template 2 ngoặc, khớp t("hello", { name })
    item_one: "{{count}} item", // số ít Anh
    item_other: "{{count}} items", // số nhiều Anh
  } },
  vi: { translation: {
    hello: "Xin chào {{name}}", // cùng key, câu Việt
    item_other: "{{count}} mục", // Việt không chia, dùng other cho mọi số
  } },
};
// Gọi: t("hello", { name: "Son" }) -> "Xin chào Son" (vi) / "Hello Son" (en)
// Gọi: t("item", { count: 1 }) -> "1 item" (en) / "1 mục" (vi)
```

---

## 8. `fallbackLng` + key thiếu: app hiện gì khi quên dịch một key?

**Hỏi:** Thêm key mới mà file `en` chưa dịch — user Anh thấy gì?

**Đáp:**
- Cơ chế fallback 2 tầng: thiếu key ở ngôn ngữ hiện tại (`en`) thì i18next rơi về `fallbackLng` (`vi`) — user Anh thấy câu Việt còn hơn thấy key thô. Thiếu cả ở fallback thì trả **chính key** (`"checkout.title"`) — nhìn xấu nhưng là tín hiệu rõ để dev phát hiện, không "câm" như render trống.
- Vì sao đặt `fallbackLng: "vi"`: app gốc Việt, key mới viết Việt trước — Anh thấy Việt tạm trong lúc chờ dịch, không vỡ layout. Không đặt fallback thì key thô hiện (`checkout.title`) — user tưởng bug.
- Quy tắc: key theo ngữ cảnh (`checkout.title`, `errors.required`) thay vì chung (`title`) — trùng nghĩa khó dịch, và khi thiếu thì key ngữ cảnh cũng gợi dev biết thuộc màn nào. Giữ key ổn định, đừng đổi key đã dịch (dịch lại tốn công).

| Tình huống | `fallbackLng: "vi"`, locale `en` | Không fallback |
|---|---|---|
| Key có ở cả 2 | Câu `en` | Câu `en` |
| Key mới chỉ có `vi` | Câu `vi` tạm (không vỡ) | Key thô `checkout.title` |
| Key thiếu cả 2 | Key thô (tín hiệu fix) | Key thô |

---

## 9. Detector chọn locale đầu + `escapeValue: false` vì sao?

**Hỏi:** `i18next-browser-languagedetector` đọc từ đâu theo thứ tự nào? Sao tắt escape?

**Đáp:**
- Cơ chế detector thử theo thứ tự ưu tiên: `localStorage` (lựa chọn user đã lưu — tôn trọng nhất) → `cookie` → `navigator.language` (ngôn ngữ trình duyệt/OS) → fallback config. User Việt mở lần đầu tự thấy Việt, không cần bấm; đã bấm EN lần trước thì lần sau nhớ EN vì `changeLanguage` nên lưu lại storage.
- `interpolation.escapeValue: false` vì React đã **tự escape khi render** (chống XSS ở tầng JSX). Để i18next escape nữa là escape kép — user tên `A&B` hiện `A&amp;B`. Tắt ở i18next, để React lo — đúng một người gác một cửa.
- Sai thì sao: quên lưu lựa chọn vào storage thì mỗi lần reload detector đọc navigator lại — user đã chọn EN, reload về VI, tưởng app quên. Fix: `changeLanguage` xong `localStorage.setItem("lng", lng)` (hoặc để detector cache tự làm).

```tsx
// Khởi tạo detector + tắt escape kép (trích README, giải thích lại từng dòng)
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector"; // tự chọn locale đầu thông minh
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector) // đọc localStorage -> cookie -> navigator, khỏi chọn tay lần đầu
  .use(initReactI18next) // cắm vào React để useTranslation subscribe được
  .init({
    resources: { vi: { translation: { save: "Lưu" } }, en: { translation: { save: "Save" } } },
    fallbackLng: "vi", // thiếu key en thì rơi về vi, không hiện key thô
    interpolation: { escapeValue: false }, // React đã escape XSS, tránh escape 2 lần
  });
```

---

## 10. Namespace + lazy load + type-safe key: app lớn tổ chức JSON thế nào?

**Hỏi:** 500 key trong 1 file thì merge conflict + tải chậm — tách sao, key sai thì ai báo?

**Đáp:**
- Cơ chế namespace: tách JSON theo domain (`common` nhỏ cho khung, `checkout` cho màn thanh toán, `errors` cho lỗi) — `useTranslation("checkout")` thì `t("title")` tra đúng namespace đó. Route vào màn nào nạp namespace đó (lazy load resource), bundle khởi động chỉ mang `common`.
- Type-safe (nâng cao): suy type từ resource để `t("...")` autocomplete và **báo key sai lúc compile** — gõ `t("chekout.title")` (sai chính tả) là đỏ ngay, không đợi runtime hiện key thô. Chưa làm type-safe thì ít nhất giữ key có ngữ cảnh, không đổi key đã dịch.
- Sai thì sao: một file khổng lồ thì 2 dev sửa 2 màn cùng conflict, user mở trang chủ cũng tải cả chữ màn admin. Fix: `common` giữ nhỏ (khung + nút chung), mỗi feature một namespace, lazy theo route.

```tsx
import { useTranslation } from "react-i18next";

function CheckoutTitle() {
  // Gắn namespace checkout: t("title") tra checkout.title, không lẫn common.title
  const { t } = useTranslation("checkout");
  return <h1>{t("title")}</h1>; // type-safe (nâng cao) thì gõ sai key đỏ lúc compile
}

function SaveButton() {
  const { t } = useTranslation("common"); // nút chung dùng namespace common nhỏ gọn
  return <button>{t("save")}</button>;
}
```

---

## 11. Lỗi thực chiến: quên import `./i18n`, template 1 ngoặc, `Intl` hardcode, `<html lang>`?

**Hỏi:** Bốn lỗi này hiện tượng ra sao và fix từng cái?

**Đáp:**
- **Quên `import "./i18n"` trong `main.tsx`**: i18next chưa `init` mà `useTranslation` đã chạy — không resource nên `t("hello")` trả key thô. Fix: import cấu hình **trước** `createRoot(...).render(<App/>)`, một dòng nhưng bắt buộc.
- **Template 1 ngoặc `{name}`**: i18next mặc định chỉ khớp `{{name}}` — 1 ngoặc hiện nguyên `{name}` trên UI. Fix: resource viết 2 ngoặc, hoặc đổi config `prefix/suffix` nếu team quen kiểu khác (khuyên giữ mặc định).
- **`Intl` hardcode `"vi-VN"`**: đổi sang EN mà tiền/ngày vẫn format Việt — song ngữ nửa vời. Fix: luôn `new Intl.NumberFormat(i18n.language, ...)` lấy từ `useTranslation`, đổi ngôn ngữ là số/ngày đổi theo.
- **Quên `<html lang>`**: screen reader đọc tiếng Việt bằng giọng Anh, SEO nhận sai ngôn ngữ. Fix: effect nhỏ `document.documentElement.lang = i18n.language` mỗi lần đổi (hoặc plugin i18next tự làm).

```tsx
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

function LocaleSync() {
  const { i18n } = useTranslation(); // nguồn locale chuẩn của app
  useEffect(() => {
    // Đồng bộ thẻ html với ngôn ngữ đang chọn: tốt cho a11y (giọng đọc) + SEO
    document.documentElement.lang = i18n.language;
  }, [i18n.language]); // chạy lại mỗi lần changeLanguage
  // Format tiền theo locale hiện tại, không hardcode "vi-VN"
  const money = new Intl.NumberFormat(i18n.language, { style: "currency", currency: "VND" }).format(100000);
  return <p>{money}</p>;
}
```

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 18)
- https://www.i18next.com/ · https://react.i18next.com/
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
