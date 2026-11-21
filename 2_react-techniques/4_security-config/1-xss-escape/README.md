# Chống XSS trong React

> Nguồn: https://react.dev/learn/keeping-components-pure — https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

## Mục tiêu

### 1. Hiểu vì sao React escape mặc định chặn được phần lớn XSS, và khi nào "lá chắn" biến mất

**Vì sao:** XSS là chèn script chạy trong trình duyệt nạn nhân (cắp phiên, đọc data, đổi UI, gửi request thay user). React/JSX escape mọi giá trị trong `{value}` (`<` → `&lt;`) bằng cách tạo text node thay vì parse HTML — `<img onerror>` chỉ hiện thành chữ, không chạy. Lá chắn này biến mất đúng ở 4 "cửa hậu": `dangerouslySetInnerHTML`, thuộc tính URL (`href/src/formAction`), `eval`/`new Function`, lib render HTML user (marked + raw).

**Cơ chế React:** `<div>{userInput}</div>` → `document.createTextNode(userInput)` — trình duyệt không parse, không thực thi. `dangerouslySetInnerHTML={{ __html }}` → `innerHTML = ...` — trình duyệt parse + thực thi `script/onerror/onclick`. Tên "dangerously" là cảnh báo thật, không phải trang trí.

> 📄 **Code ví dụ:** [`examples/01-1-hieu-vi-sao-react-escape-mac-inh.tsx`](examples/01-1-hieu-vi-sao-react-escape-mac-inh.tsx)

**Usecase thực tế:** mọi nơi render nội dung user tạo — comment, bio, markdown, chat, tên file, query param phản chiếu. Quy tắc nhận diện: data từ user/API/localStorage/query mà đi vào HTML/URL thì luôn qua escape/sanitize/allowlist — không tin bất kỳ nguồn nào.

### 2. Biết sanitize rich text bằng DOMPurify (kèm Trusted Types) và validate URL theo allowlist protocol

**Vì sao:** rich text cần giữ thẻ (`<b>`, `<a>`) nên không thể escape hết — phải sanitize (loại thẻ/thuộc tính nguy hiểm, giữ HTML hợp lệ). DOMPurify parse bằng `DOMParser`, allowlist, strip ngoài danh sách, chạy cả browser lẫn server (jsdom), hỗ trợ Trusted Types cho CSP nghiêm. URL cần allowlist protocol (`https/http/mailto`) vì React chỉ chặn `javascript:` còn `data:/vbscript:` vẫn lọt.

### 3. Xem CSP `script-src` là lớp phòng thủ cuối, phối hợp với bài `3-secure-headers`

Dù sanitize lọt (bypass mới), CSP `script-src 'self'` chặn script lạ chạy — defense-in-depth. Không có CSP, một payload lọt là game over; có CSP, payload lọt vẫn bị chặn thực thi. Hai bài này đi đôi: bài này lo "đừng để HTML độc vào DOM", bài 3 lo "vào rồi cũng không chạy được".

## Tổng quan

- XSS là chèn script chạy trong trình duyệt nạn nhân: đánh cắp phiên, đọc dữ liệu, đổi UI, gửi request thay người dùng. Ba họ chính: stored (lưu DB rồi hiện cho mọi người — nguy hiểm nhất), reflected (query param phản chiếu), DOM-based (JS client ghép HTML không an toàn).
- React/JSX **escape mọi giá trị** trong `{value}` → không phá được thẻ HTML. Đây là mặc định, không cần cấu hình.
- Rủi ro chỉ từ "cửa hậu": `dangerouslySetInnerHTML`, thuộc tính URL, `eval`/`new Function`, lib render HTML user (marked, `rehype-raw`, SSR `innerHTML`).
- Áp dụng **mỗi khi render nội dung người dùng tạo**: comment, bio, markdown, chat, tên file, query param. Coi API/localStorage/query là không tin cậy ngang input user.

## Khái niệm cốt lõi

Mục này phân biệt rõ hai "ông chú" escape và sanitize, giải thích cơ chế lá chắn của React, rồi lần lượt soi từng cửa hậu: `dangerouslySetInnerHTML`, URL scheme, DOMPurify, Trusted Types. Đọc để biết kẻ tấn công chui vào từ đâu.

### 1. Escaping vs Sanitizing — biến thành chữ vs loại thẻ độc giữ thẻ lành

Escape (React tự làm): `<` → `&lt;` — mọi thứ thành text vô hại, mất hết định dạng. Sanitize (DOMPurify): `<b>ok</b><script>x</script>` → `<b>ok</b>` — giữ định dạng hợp lệ, bỏ thứ độc. Ví von: escape là bọc toàn bộ quà trong hộp kính (nhìn được, không sờ được), còn sanitize là nhân viên hải quan soi từng món — bút màu được qua, dao găm bị giữ lại. Không cần thẻ → để React text là xong; cần rich text → sanitize rồi mới vào DOM.

### 2. Cơ chế React — text node, không parse

`<div>{userInput}</div>` tạo text node — trình duyệt không chạy gì trong đó. Đây là lý do 90% XSS chết từ đầu mà dev không cần làm gì. Chỉ khi ta tự mở cửa (`dangerouslySetInnerHTML`) thì lá chắn mới mất.

### 3. Cơ chế `dangerouslySetInnerHTML` — `innerHTML` thật, thực thi thật

Gán thẳng `innerHTML` → parse + chạy `script`, `onerror`, `onclick`, `srcdoc`. Vì thế mỗi lần dùng phải có `eslint-disable react/no-danger` kèm comment "đã sanitize ở dòng trên" — disable mà không sanitize là mở cửa cho XSS.

### 4. URL scheme injection — `javascript:`/`data:`/`vbscript:` trong href/src

`href="javascript:alert(1)"` chạy khi click; `data:text/html,<script>` tương tự. React 16.9+ chặn `javascript:` trong href (thay bằng throw) nhưng còn `data:`, `vbscript:`, redirect mở, khoảng trắng/encoding lách (`\u0000javascript:`). Fix duy nhất bền: allowlist protocol (`https/http/mailto`), không blacklist.

> 📄 **Code ví dụ:** [`examples/02-4-url-scheme-injection-javascript-data-vbscript-trong.tsx`](examples/02-4-url-scheme-injection-javascript-data-vbscript-trong.tsx)

### 5. DOMPurify — allowlist parser, chạy 2 phía, bản 3.x hiện hành

Parse bằng `DOMParser`, strip ngoài `ALLOWED_TAGS/ATTR`, chặn `on*`/`srcdoc`/`formaction` mặc định. Allowlist tường minh (`['b','i','u','a','p','br']`) giúp review dễ và ổn định hơn mặc định (mặc định đổi theo version). Chạy client (browser) và server (jsdom) — SSR phải sanitize ở server, không tin client đã làm.

### 6. Trusted Types / CSP — `innerHTML` chuỗi thô bị chặn khi bật

CSP `require-trusted-types-for 'script'` cấm gán `innerHTML` bằng string thường — phải là `TrustedHTML`. DOMPurify `RETURN_TRUSTED_TYPE: true` trả đúng kiểu này. Chỉ bật khi CSP có directive đó, nếu không mismatch kiểu.

> **Tóm gọn 1 câu:** Escape biến mọi thứ thành chữ vô hại, sanitize lọc giữ thẻ lành — và 4 cửa hậu (`dangerouslySetInnerHTML`, URL, `eval`, lib raw) là chỗ bạn phải tự khóa.

## Luồng hoạt động / Cách áp dụng

Mục này là quy trình 5 bước rà chống XSS từ "quét toàn repo tìm cửa hậu" tới "thêm CSP làm lớp cuối" — đi theo thứ tự thì không bỏ sót lỗ hổng.

### Bước 1. Rà soát mọi `dangerouslySetInnerHTML`/`innerHTML`/renderer tự viết

Grep toàn repo. Mỗi hit ghi lại: nguồn data từ đâu, đã sanitize chưa, allowlist gì. `react-markdown` + `rehype-raw` cũng là hit (raw cho HTML user vào).

### Bước 2. Không cần thẻ → để React text

Tên user, tiêu đề, query param hiển thị — `{value}` là xong, không sanitize, không dangerously. Đơn giản nhất là an toàn nhất.

### Bước 3. Cần rich text → `DOMPurify.sanitize(raw, config)` allowlist tối thiểu rồi mới vào DOM

Sanitize sau cùng, ngay trước render — sanitize rồi nối thêm chuỗi user là bypass. Mỗi ngữ cảnh một config (HTML thường, SVG/MathML namespace riêng, contenteditable rộng hơn) — không dùng chung một config cho mọi chỗ.

### Bước 4. Mọi URL user → `new URL()` + allowlist protocol

Chuẩn hóa (`//evil.com`, percent-encoding, khoảng trắng) trước khi so sánh. Hỏng/không cho phép → fallback `<span>` (chữ, không link). Link ngoài `target="_blank"` luôn kèm `rel="noopener noreferrer"` (chống reverse tabnabbing + rò referrer).

### Bước 5. Thêm CSP `script-src 'self'` (bài 3) — lọt vẫn không chạy

Header HTTP ở Nginx/CDN, không phải meta. Report-only trước để thu thập vi phạm, chặn thật sau.

> **Tóm gọn 1 câu:** Thứ tự ưu tiên: không cần thẻ thì để React text, cần thẻ thì sanitize allowlist, URL thì `new URL()` + allowlist protocol, và CSP là chốt chặn cuối.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

Trusted Types cho CSP nghiêm (khối bổ sung trong README gốc):

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.ts`](examples/04-vi-du-chi-tiet.ts)

## Giải thích từng phần

### `ALLOWED_TAGS/ATTR` càng hẹp càng an toàn

Mặc định DOMPurify đã chặn `script`/`on*`, nhưng allowlist tường minh giúp reviewer thấy ngay "chỗ này cho thẻ gì" và không bị đổi hành vi khi nâng version lib. SVG/MathML cần config riêng (namespace khác) — đừng dùng chung.

### `new URL(href, origin)` chuẩn hóa trước khi so sánh

Bắt `//evil.com/x` (kế thừa protocol), `%6Aavascript:` (encoding), khoảng trắng đầu (`  javascript:`). So sánh string thô mà không qua URL là lọt hết các biến thể này.

### `rel="noopener noreferrer"` chống 2 thứ

`noopener`: trang đích không `window.opener.location = 'phishing'` (reverse tabnabbing). `noreferrer`: không rò URL trang mình qua header Referer. Quên là mở 2 lỗ cùng lúc.

### `RETURN_TRUSTED_TYPE` chỉ khi CSP yêu cầu

Bật mà CSP không có `require-trusted-types-for` thì kiểu TrustedHTML gây lỗi gán không cần thiết. Tắt mà CSP có thì `innerHTML = string` bị chặn — trắng nội dung. Hai phía phải khớp.

### `eslint-disable react/no-danger` + `ALLOWED_URI_REGEXP`

Disable chỉ sau sanitize, kèm comment để reviewer biết đã nghĩ. `ALLOWED_URI_REGEXP` là lớp chặn protocol ngay trong DOMPurify (thay vì kiểm tra sau) — dùng khi muốn sanitize và validate URL cùng một chỗ.

## Lỗi thường gặp / Chống chỉ định

### 1. dangerously với HTML thô → script chạy ngay

> 📄 **Code ví dụ:** [`examples/05-1-dangerously-voi-html-tho-script-chay-ngay.tsx`](examples/05-1-dangerously-voi-html-tho-script-chay-ngay.tsx)

### 2. Sanitize rồi nối thêm chuỗi → bypass

> 📄 **Code ví dụ:** [`examples/06-2-sanitize-roi-noi-them-chuoi-bypass.tsx`](examples/06-2-sanitize-roi-noi-them-chuoi-bypass.tsx)

### 3. Blacklist `javascript:` → sót họ protocol + encoding

Dùng allowlist `https/http/mailto` như SafeLink. Thêm test payload `data:text/html,<script>alert(1)</script>`, `vbscript:`, `\u0000javascript:` để khóa regression.

### 4. Tin sanitize mặc định cho mọi ngữ cảnh (SVG/contenteditable)

Mỗi ngữ cảnh config riêng, cập nhật DOMPurify thường xuyên (bypass mới xuất hiện liên tục — đọc changelog mỗi lần nâng).

### 5. Markdown `marked` + dangerously không sanitize; `target=_blank` quên rel; chỉ sanitize client mà SSR render HTML

Markdown qua `rehype-sanitize` hoặc bọc DOMPurify. Link blank luôn `noopener noreferrer`. SSR sanitize ở server (jsdom) — client sanitize không bảo vệ lần render đầu từ server.

> **Tóm gọn 1 câu:** Quy tắc sống còn: allowlist chứ không blacklist, sanitize là điểm cuối cùng trước khi vào DOM, và server phải tự sanitize — không tin client.

## Best practices / Mẹo

### Allowlist không blacklist; server cũng sanitize; Trusted Types đóng vector innerHTML

Mặc định React text. Server SSR sanitize độc lập — không tin client. Bật `require-trusted-types-for` khi được để `innerHTML` chuỗi thô bị chặn ở tầng browser.

### Test payload XSS mẫu + eslint no-unsanitized + CSP report-only

Lưu `<img src=x onerror=alert(1)>` vào suite — nâng DOMPurify mà regression là test đỏ ngay. `eslint-plugin-no-unsanitized` bắt gán `innerHTML` chưa sanitize lúc review. CSP report-only thu thập payload lọt trước khi chặn thật. Coi API/localStorage/query là không tin cậy như input. Giữ lib render HTML bản mới nhất.

> **Tóm gọn 1 câu:** Phòng thủ nhiều lớp: React text mặc định → DOMPurify khi cần thẻ → Trusted Types khóa `innerHTML` → CSP chặn thực thi — thủng lớp nào còn lớp sau.

## Bài tập nhỏ

1. Viết `UserBio` nhận `bio` (markdown mini: chỉ `**bold**`, `*italic*`, link) và `website`.
2. Parse markdown thủ công (không `marked` raw), sanitize qua DOMPurify allowlist hẹp, validate `website` chỉ `https:` (dùng `new URL`).
3. Viết test với `<img src=x onerror=alert(1)>` trong bio và `javascript:alert(1)` ở website — assert không còn thẻ `img`, không còn link (fallback span).
4. Bật CSP report-only, dán payload vào comment, xác nhận report ghi nhận nếu lọt.

## Reference

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)
- [React — Keeping components pure](https://react.dev/learn/keeping-components-pure)
