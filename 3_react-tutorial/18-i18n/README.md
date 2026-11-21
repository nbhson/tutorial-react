# DAY 18: I18N (ĐA NGÔN NGỮ)

## Mục tiêu bài học
- Hiểu cơ chế i18n trong React: key-based JSON + runtime switching, thay cho `$localize`/`@angular/localize` build-time của Angular.
- Làm chủ **react-i18next** (chuẩn 2026) cho app SPA Vite: `t("key")`, interpolation `{{name}}`, đổi ngôn ngữ runtime.
- Dùng `Intl` API để format số/ngày **theo locale hiện tại** và cập nhật `<html lang>` động.

## Khái niệm cốt lõi (Core)

Mục này nói về cơ chế đa ngôn ngữ của React 2026: bản dịch là JSON tra theo key, đổi ngôn ngữ ngay lúc chạy — đọc để hiểu khác biệt cốt lõi so với cách Angular làm lúc build.

### 1. Angular build-time — React runtime
Angular: attribute `i18n`, dịch qua XLIFF, mỗi ngôn ngữ build riêng (hoặc `$localize` tag). Đổi ngôn ngữ là reload/build khác. React i18next: toàn bộ bản dịch JSON trong bundle (hoặc lazy theo namespace), `changeLanguage()` đổi ngay không reload, 1 bundle phục vụ mọi ngôn ngữ. Ví von: Angular là nhà hàng in sẵn 3 thực đơn tiếng khác nhau — khách đổi ngôn ngữ là đổi cả cuốn thực đơn (reload); React là thực đơn điện tử — bấm là đổi trang, món đang gọi vẫn giữ nguyên.

> 📄 **Code ví dụ:** [`examples/01-1-angular-build-time-react-runtime.tsx`](examples/01-1-angular-build-time-react-runtime.tsx)

Vì sao runtime thắng cho SPA? Vì user đổi VI→EN giữa chừng không mất form đang nhập, không tải lại bundle. Giá: bundle ôm nhiều JSON (namespace + lazy load khi lớn) và key thiếu hiện key thô nếu không `fallbackLng`.

> **Tóm gọn 1 câu:** i18n React là runtime: `changeLanguage()` đổi chữ ngay giữa chừng, không reload, không mất state.

### 2. Đơn vị dịch là key, không phải câu code
`t("save")` tra `{ save: "Lưu" }`. Tách nội dung khỏi code → dịch giả làm JSON, dev làm key. Key theo ngữ cảnh (`checkout.title`, `errors.required`) — không key chung (`title`, `button`) vì cùng "title" mà checkout khác settings. Ví von: key như mã món trên hóa đơn nhà hàng — bếp (code) chỉ ghi mã, thông dịch viên (dịch giả) lo phần diễn giải mã đó thành ngôn ngữ của từng bàn.

> 📄 **Code ví dụ:** [`examples/02-2-on-vi-dich-la-key-khong-phai.tsx`](examples/02-2-on-vi-dich-la-key-khong-phai.tsx)

Vì sao cả câu vào key? Vì nối `"Xin chào " + name` vỡ ngữ pháp ngôn ngữ khác (thứ tự tên khác, giống/cách khác). Interpolation `{{name}}` để dịch giả đặt tên đúng chỗ câu họ.

> **Tóm gọn 1 câu:** Dịch theo key có ngữ cảnh, cả câu một key — đừng nối chuỗi trong code nếu muốn app sống sót qua nhiều ngôn ngữ.

### 3. Interpolation + plural + nested
`t("hello", { name })` khớp `"Xin chào {{name}}"`. Plural (`item_one`/`item_other`, pedestal theo locale — tiếng Việt không chia, tiếng Anh/Rga chia), format (`{{v, number}}`), nested keys (`$t(common.save)` dùng chung). Example mini dùng hàm + plural tay để thấy ý; i18next khai trong JSON chuẩn hơn.

> 📄 **Code ví dụ:** [`examples/03-3-interpolation-plural-nested.tsx`](examples/03-3-interpolation-plural-nested.tsx)

> **Tóm gọn 1 câu:** `{{name}}` chèn biến vào câu, plural để i18next tự chọn số ít/nhiều theo luật từng locale — khỏi viết `if` số đếm tay.

### 4. Detector + fallback + namespace
Mục này về ba "người gác cổng" của hệ dịch: ai đoán ngôn ngữ đầu tiên, đâu là phương án dự phòng khi thiếu bản dịch, và cách chia từ điển cho nhẹ.

`i18next-browser-languagedetector` đọc localStorage → navigator → cookie để locale mặc định thông minh (user Việt mở là `vi` ngay). `fallbackLng: "vi"` — thiếu key ở `en` thì rơi về `vi`, không hiện key thô. Namespace (`common`, `checkout`, `errors`) tách JSON theo domain — tránh file khổng lồ, lazy load theo route. Ví von: detector là lễ tân đoán ngôn ngữ khách ngay lúc khách bước vào; fallback là đồng nghiệp đứng sau lưng thay lời khi lễ tân bí; namespace là chia sổ tay theo bộ phận thay vì một quyển dày cộp.

> **Tóm gọn 1 câu:** Detector đoán locale đầu, `fallbackLng` đỡ khi thiếu dịch, namespace chia từ điển theo route để app nhẹ.

### 5. `Intl` theo locale hiện tại
`new Intl.NumberFormat(i18n.language, ...)` cho tiền/số/ngày khớp ngôn ngữ đang chọn. Hardcode `"vi-VN"` là đổi EN vẫn dấu chấm/phẩy Việt — sai. Example `money`/`today` `useMemo` theo `lang` (đổi lang là format lại). Ví von: chữ và số là hai "quốc tịch" khác nhau — đổi ngôn ngữ mà quên đổi quốc tịch của con số thì giá 120.000 ₫ vẫn hiện 120,000 đ kiểu khác, nhìn là biết app dịch nửa vời.

> **Tóm gọn 1 câu:** Số/ngày/tiền phải theo locale đang chọn qua `Intl` + `i18n.language` — hardcode locale là song ngữ nửa vời.

### Keyword chính
`i18next` (core) + `react-i18next` (`useTranslation`, `t()`), interpolation (`{{name}}`), plural (`_one`/`_other`), `fallbackLng` (rơi về khi thiếu), `changeLanguage` (runtime switch), detector (đoán locale đầu), namespace (tách JSON), `Intl` + `i18n.language` (số/ngày theo locale), `<html lang>` (a11y/SEO).

> **Tóm gọn 1 câu:** Thuộc 9 từ này là làm chủ i18n: tra theo key, chèn biến, chia nhiều/những, fallback khi thiếu, đổi ngôn ngữ runtime, và format số theo locale.

## Luồng hoạt động (Flow)
Mục này đi theo một lượt bấm nút đổi ngôn ngữ từ lúc app khởi động tới khi toàn bộ chữ + số đổi theo — đọc để hiểu "ai nghe sự kiện gì".

1. `main.tsx` import `./i18n` **trước** render — module chạy `i18n.use(Detector).use(initReactI18next).init({...})` nạp resources. Quên import là `t` trả key thô (`"hello"` hiện chữ hello).
2. Detector chọn locale (localStorage `i18nextLng` → `navigator.language` → fallback `vi`) → i18next đặt `language` + nạp namespace tương ứng.
3. `App` mount, `useTranslation()` subscribe vào sự kiện `languageChanged`; `t` là hàm tra namespace hiện tại. `useMemo(dict[lang])` trong mini cùng ý (cache theo lang).
4. Lần đầu (`vi`): `t.hello("Son")` → "Xin chào Son"; `money` → `"120.000 ₫"`; `today` theo `vi`; `<html lang="vi">` qua effect.
5. Bấm EN → `setLang("en")` (mini) / `i18n.changeLanguage("en")` (thật) → phát sự kiện → mọi `useTranslation` re-render → `t` mới ("Hello Son"), `money`/`today` tính lại theo `en`, `<html lang="en">`.
6. Key thiếu ở `en` → `fallbackLng: "vi"` trả bản `vi` (mini: `?? dict.vi`). Không fallback là hiện key thô — tín hiệu thiếu dịch để bổ sung.
7. Plural: bấm "+1 mục" → `count` 2→3 → `t.items_one(count)` đổi ("2 items" → "3 items" EN; VI giữ "mục"). Không `if` tay.
8. Namespace lớn: route checkout chỉ nạp `checkout` JSON (lazy) — mount nhanh, không ôm cả từ điển.
9. Test (DAY 21): khởi tạo i18next với resources cố định, render, đổi locale, assert chuỗi — không phụ thuộc mạng.

> **Tóm gọn 1 câu:** Đổi ngôn ngữ là một chuỗi sự kiện: `changeLanguage` phát tín hiệu → mọi `useTranslation` nghe thấy → tra bảng mới → chữ và số đổi đồng loạt, không reload.

## Ví dụ chi tiết
Mục này cho code chạy được từ dict mini tới `src/i18n.ts` thật — copy về chạy thử rồi đọc phần giải thích.
Khớp 1-1 với `example.tsx` (dict mini + plural + Intl theo lang + `<html lang>`):

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.tsx`](examples/04-vi-du-chi-tiet.tsx)

`src/i18n.ts` thật + dùng trong component:

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.ts`](examples/05-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

## Giải thích từng phần
Mục này soi từng dòng của example — đọc khi bạn thắc mắc "vì sao phải `useMemo`, vì sao tắt escape".
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
Mục này đối chiếu hệ i18n của Angular với react-i18next — đọc như bảng chuyển đổi khái niệm khi chuyển dự án.

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

> **Cách đọc bảng này:** mỗi dòng là một cơ chế i18n của Angular đối chiếu với mảnh tương đương của react-i18next; cột Ghi chú tóm ý cần nhớ — hàng đầu tiên (build-time ↔ runtime) là khác biệt tư duy lớn nhất, đọc nó trước.

## Lỗi thường gặp (Common pitfalls)
Mục này là "bản đồ bẫy" của i18n — từ key thô hiện trên UI đến screen reader đọc sai giọng; đa số lỗi không crash mà chỉ "nhìn kỳ", nên phải biết trước.

### 1. Quên import `./i18n` trước render → key thô
> 📄 **Code ví dụ:** [`examples/07-1-quen-import-i18n-truoc-render-key-tho.tsx`](examples/07-1-quen-import-i18n-truoc-render-key-tho.tsx)

### 2. Nối chuỗi thay vì key + interpolation → không dịch + sai ngữ pháp
> 📄 **Code ví dụ:** [`examples/08-2-noi-chuoi-thay-vi-key-interpolation-khong.tsx`](examples/08-2-noi-chuoi-thay-vi-key-interpolation-khong.tsx)
> 📄 **Code ví dụ:** [`examples/09-2-noi-chuoi-thay-vi-key-interpolation-khong.tsx`](examples/09-2-noi-chuoi-thay-vi-key-interpolation-khong.tsx)

### 3. Sai cú pháp ngoặc (`{name}` thay `{{name}}`)
Mô tả: resource `"Hello {name}"` (1 ngoặc) mà gọi `t("hello", { name })` → hiện nguyên `{name}`. Fix: i18next mặc định `{{name}}` (2 ngoặc) — khớp cả hai phía.

### 4. `Intl` hardcode locale → đổi ngôn ngữ format không đổi
> 📄 **Code ví dụ:** [`examples/10-4-intl-hardcode-locale-oi-ngon-ngu-format.tsx`](examples/10-4-intl-hardcode-locale-oi-ngon-ngu-format.tsx)
> 📄 **Code ví dụ:** [`examples/11-4-intl-hardcode-locale-oi-ngon-ngu-format.tsx`](examples/11-4-intl-hardcode-locale-oi-ngon-ngu-format.tsx)

### 5. Một file dịch khổng lồ → chậm + conflict
Mô tả: `translation.json` 2000 key — tải chậm, merge xung đột. Fix: namespace (`common`/`checkout`/`errors`) + lazy theo route (`loadNamespaces`), `common` nhỏ cho mount nhanh.

### 6. Không `<html lang>` → screen reader sai giọng
> 📄 **Code ví dụ:** [`examples/12-6-khong-html-lang-screen-reader-sai-giong.tsx`](examples/12-6-khong-html-lang-screen-reader-sai-giong.tsx)
> 📄 **Code ví dụ:** [`examples/13-6-khong-html-lang-screen-reader-sai-giong.tsx`](examples/13-6-khong-html-lang-screen-reader-sai-giong.tsx)

### 7. Plural tay (`1 items`) → sai
> 📄 **Code ví dụ:** [`examples/14-7-plural-tay-1-items-sai.tsx`](examples/14-7-plural-tay-1-items-sai.tsx)
> 📄 **Code ví dụ:** [`examples/15-7-plural-tay-1-items-sai.tsx`](examples/15-7-plural-tay-1-items-sai.tsx)

### 8. Key chung chung (`title`) → trùng/khó dịch
Mô tả: 5 màn đều `t("title")` mà nghĩa khác nhau — dịch 1 kiểu sai 4 chỗ. Fix: ngữ cảnh (`checkout.title`, `settings.title`) — dài hơn nhưng đúng.

## Best practices / Mẹo
Mục này là "sổ tay quản lý bản dịch" — đọc để tổ chức key, namespace và quy trình dịch sạch lâu dài.
- **Key ngữ cảnh** (`checkout.title`, `errors.required`) — tránh trùng, dịch giả hiểu. Vì sao? Vì từ rời ngữ cảnh không dịch đúng (title của gì?).
- Mọi số/ngày/tiền qua `Intl` + `i18n.language` — không hardcode. Vì sao? Vì format là bản địa (dấu, ký hiệu, thứ tự ngày) — hardcode là sai nửa thế giới.
- SPA Vite → react-i18next; Next.js SSR → next-intl (tích hợp server tốt hơn). Vì sao chọn? Vì SSR cần dịch trên server + streaming, next-intl sinh cho đó.
- Type-safe key (gen type từ resources) để `t("sai")` báo compile + autocomplete. Vì sao? Vì key string thô sai chính tả không ai báo tới khi thấy UI.
- Namespace + lazy khi lớn; `common` nhỏ. Vì sao? Để mở app không tải từ điển checkout chưa vào.
- Test với i18next instance cố định (DAY 21) — assert chuỗi theo locale. Vì sao cố định? Để test không phụ thuộc mạng/detector máy chạy.
- Không đổi key đã dịch (dịch lại tốn công) — key ngắn nhưng ổn định. Vì sao? Vì mỗi key mới là chi phí dịch + review lại.

## Bài tập nhỏ
Làm tay để nhớ — mỗi bài luyện một mảnh: namespace, Intl, fallback, lazy load, `<html lang>`.

1. Chia dict thành `common`/`checkout` + thêm `ja` vài key, thiếu rơi về `vi` (fallback). Quan sát key nào thiếu hiện bản `vi`.
2. react-i18next + `Intl.NumberFormat(i18n.language, {currency:"VND"})` — đổi VI/EN dấu phân cách đổi không? Vì sao hardcode vỡ?
3. Nút `ja` + `fallbackLng` — cố ý thiếu 1 key `ja`, kiểm tra rơi về `vi` (không hiện key thô).
4. Lazy namespace theo route (`loadNamespaces("checkout")` khi vào checkout) — Network tab thấy JSON nạp khi vào, không lúc mở app.
5. `document.title` theo ngôn ngữ (effect) + `<html lang>` — screen reader/SEO đổi theo. Quên thì sao?

> **Tóm gọn 1 câu:** i18n chỉ ổn khi: chữ theo key có ngữ cảnh, số theo `Intl` + locale hiện tại, thiếu thì fallback, và `<html lang>` đổi theo — app "đa quốc tịch" đúng cả chữ lẫn số.

## Reference
- https://react.i18next.com/
- https://www.i18next.com/translation-function/interpolation
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- https://next-intl.dev/
