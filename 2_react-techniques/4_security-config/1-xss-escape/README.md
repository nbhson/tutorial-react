# Chống XSS trong React

> Nguồn: https://react.dev/learn/keeping-components-pure — https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

## Mục tiêu

### 1. Hiểu vì sao React escape mặc định chặn được phần lớn XSS, và khi nào "lá chắn" biến mất

**Vì sao:** XSS là chèn script chạy trong trình duyệt nạn nhân (cắp phiên, đọc data, đổi UI, gửi request thay user). React/JSX escape mọi giá trị trong `{value}` (`<` → `&lt;`) bằng cách tạo text node thay vì parse HTML — `<img onerror>` chỉ hiện thành chữ, không chạy. Lá chắn này biến mất đúng ở 4 "cửa hậu": `dangerouslySetInnerHTML`, thuộc tính URL (`href/src/formAction`), `eval`/`new Function`, lib render HTML user (marked + raw).

**Cơ chế React:** `<div>{userInput}</div>` → `document.createTextNode(userInput)` — trình duyệt không parse, không thực thi. `dangerouslySetInnerHTML={{ __html }}` → `innerHTML = ...` — trình duyệt parse + thực thi `script/onerror/onclick`. Tên "dangerously" là cảnh báo thật, không phải trang trí.

```tsx
// ✅ ĐÚNG: React escape — payload chỉ hiện thành chữ, không chạy
<div>{'<img src=x onerror=alert(1)>'}</div> // hiện đúng chuỗi đó, không popup
// ❌ SAI: dangerously với HTML thô — payload chạy ngay khi render
<div dangerouslySetInnerHTML={{ __html: '<img src=x onerror=alert(1)>' }} /> // alert bật
```

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

### 1. Escaping vs Sanitizing — biến thành chữ vs loại thẻ độc giữ thẻ lành

Escape (React tự làm): `<` → `&lt;` — mọi thứ thành text vô hại, mất hết định dạng. Sanitize (DOMPurify): `<b>ok</b><script>x</script>` → `<b>ok</b>` — giữ định dạng hợp lệ, bỏ thứ độc. Không cần thẻ → để React text là xong; cần rich text → sanitize rồi mới vào DOM.

### 2. Cơ chế React — text node, không parse

`<div>{userInput}</div>` tạo text node — trình duyệt không chạy gì trong đó. Đây là lý do 90% XSS chết từ đầu mà dev không cần làm gì. Chỉ khi ta tự mở cửa (`dangerouslySetInnerHTML`) thì lá chắn mới mất.

### 3. Cơ chế `dangerouslySetInnerHTML` — `innerHTML` thật, thực thi thật

Gán thẳng `innerHTML` → parse + chạy `script`, `onerror`, `onclick`, `srcdoc`. Vì thế mỗi lần dùng phải có `eslint-disable react/no-danger` kèm comment "đã sanitize ở dòng trên" — disable mà không sanitize là mở cửa cho XSS.

### 4. URL scheme injection — `javascript:`/`data:`/`vbscript:` trong href/src

`href="javascript:alert(1)"` chạy khi click; `data:text/html,<script>` tương tự. React 16.9+ chặn `javascript:` trong href (thay bằng throw) nhưng còn `data:`, `vbscript:`, redirect mở, khoảng trắng/encoding lách (`\u0000javascript:`). Fix duy nhất bền: allowlist protocol (`https/http/mailto`), không blacklist.

```tsx
// ❌ SAI: blacklist javascript: — sót data:, vbscript:, encoding lách
const ok = !href.includes('javascript:');
// ✅ ĐÚNG: allowlist — chỉ 3 protocol này được làm link, còn lại thành chữ
const u = new URL(href, window.location.origin);
const ok = ['https:', 'http:', 'mailto:'].includes(u.protocol);
```

### 5. DOMPurify — allowlist parser, chạy 2 phía, bản 3.x hiện hành

Parse bằng `DOMParser`, strip ngoài `ALLOWED_TAGS/ATTR`, chặn `on*`/`srcdoc`/`formaction` mặc định. Allowlist tường minh (`['b','i','u','a','p','br']`) giúp review dễ và ổn định hơn mặc định (mặc định đổi theo version). Chạy client (browser) và server (jsdom) — SSR phải sanitize ở server, không tin client đã làm.

### 6. Trusted Types / CSP — `innerHTML` chuỗi thô bị chặn khi bật

CSP `require-trusted-types-for 'script'` cấm gán `innerHTML` bằng string thường — phải là `TrustedHTML`. DOMPurify `RETURN_TRUSTED_TYPE: true` trả đúng kiểu này. Chỉ bật khi CSP có directive đó, nếu không mismatch kiểu.

## Luồng hoạt động / Cách áp dụng

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

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

```tsx
// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import DOMPurify from 'dompurify';

// Render HTML người dùng nhập — luôn sanitize trước khi đưa vào DOM
// Vì sao phải sanitize: dangerouslySetInnerHTML gán innerHTML thật — không sanitize là script chạy ngay
export function RichText({ html }: { html: string }) {
  // Allowlist tối thiểu: chỉ giữ định dạng cơ bản, bỏ script/iframe/style/on*/srcdoc
  // Vì sao tường minh: mặc định DOMPurify đổi theo version; allowlist riêng giúp review ổn định
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'], // chỉ href — bỏ on*, style, srcdoc ngay từ config
  });
  // eslint-disable-next-line react/no-danger — chỉ tắt SAU khi đã sanitize, kèm lý do
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// Link an toàn: chặn javascript:/data: bằng allowlist protocol (không blacklist)
// Vì sao allowlist: blacklist sót data:/vbscript:/encoding lách; allowlist chỉ cho 3 cái lành
export function SafeLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  let ok = false;
  try {
    // Phân giải URL tương đối theo origin hiện tại để chuẩn hoá (xử lý //evil.com, encoding, khoảng trắng)
    const u = new URL(href, window.location.origin);
    ok = u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:';
  } catch {
    ok = false; // URL hỏng → coi như không an toàn, không làm link
  }
  if (!ok) return <span>{children}</span>; // fallback: chỉ còn chữ, không phải link — an toàn hơn link độc
  return (
    // noopener + noreferrer: trang đích không chạm window.opener (reverse tabnabbing) + không nhận referrer
    <a href={href} rel="noopener noreferrer">
      {children}
    </a>
  );
}
```

Trusted Types cho CSP nghiêm (khối bổ sung trong README gốc):

```ts
// Bật khi CSP có require-trusted-types-for 'script' — trả TrustedHTML thay vì string
import DOMPurify from 'dompurify';
DOMPurify.setConfig({ RETURN_TRUSTED_TYPE: true });
export const cleanHtml = (raw: string) => DOMPurify.sanitize(raw);
```

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

```tsx
// ❌ SAI: HTML user thẳng vào DOM — <img onerror> chạy lúc render
<div dangerouslySetInnerHTML={{ __html: userHtml }} />
// ✅ ĐÚNG: sanitize trước, allowlist hẹp
const clean = DOMPurify.sanitize(userHtml, { ALLOWED_TAGS: ['b', 'i', 'p', 'br'], ALLOWED_ATTR: [] });
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

### 2. Sanitize rồi nối thêm chuỗi → bypass

```tsx
// ❌ SAI: phần nối thêm chưa sanitize — attacker nhét payload vào phần nối
<div dangerouslySetInnerHTML={{ __html: clean + userSuffix }} />
// ✅ ĐÚNG: nối trước, sanitize sau cùng ngay trước render
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(raw + suffix, config) }} />
```

### 3. Blacklist `javascript:` → sót họ protocol + encoding

Dùng allowlist `https/http/mailto` như SafeLink. Thêm test payload `data:text/html,<script>alert(1)</script>`, `vbscript:`, `\u0000javascript:` để khóa regression.

### 4. Tin sanitize mặc định cho mọi ngữ cảnh (SVG/contenteditable)

Mỗi ngữ cảnh config riêng, cập nhật DOMPurify thường xuyên (bypass mới xuất hiện liên tục — đọc changelog mỗi lần nâng).

### 5. Markdown `marked` + dangerously không sanitize; `target=_blank` quên rel; chỉ sanitize client mà SSR render HTML

Markdown qua `rehype-sanitize` hoặc bọc DOMPurify. Link blank luôn `noopener noreferrer`. SSR sanitize ở server (jsdom) — client sanitize không bảo vệ lần render đầu từ server.

## Best practices / Mẹo

### Allowlist không blacklist; server cũng sanitize; Trusted Types đóng vector innerHTML

Mặc định React text. Server SSR sanitize độc lập — không tin client. Bật `require-trusted-types-for` khi được để `innerHTML` chuỗi thô bị chặn ở tầng browser.

### Test payload XSS mẫu + eslint no-unsanitized + CSP report-only

Lưu `<img src=x onerror=alert(1)>` vào suite — nâng DOMPurify mà regression là test đỏ ngay. `eslint-plugin-no-unsanitized` bắt gán `innerHTML` chưa sanitize lúc review. CSP report-only thu thập payload lọt trước khi chặn thật. Coi API/localStorage/query là không tin cậy như input. Giữ lib render HTML bản mới nhất.

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
