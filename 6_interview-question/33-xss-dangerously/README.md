# Q33: Render nội dung user (comment, markdown) vào HTML — làm sao tránh bị XSS?

## Câu hỏi

> React nói là an toàn XSS — an toàn ở chỗ nào, và ở những chỗ nào lá chắn đó mất tác dụng? dangerouslySetInnerHTML dùng khi nào, vì sao tên lại có chữ dangerously? Render markdown/user content (comment, bio) thì sanitize bằng gì? javascript: trong href thì React chặn chưa đủ?

## Trả lời ngắn (elevator pitch, 30 giây)

- **React escape mặc định** mọi giá trị trong `{value}`: JSX tạo **text node** (`document.createTextNode`), trình duyệt **không parse** → `<img onerror=...>` chỉ hiện thành **chữ**, không chạy. Đây là **mặc định, không cần cấu hình** — "React an toàn XSS" là đúng **ở `{value}`**.
- **Lá chắn biến mất ở 4 "cửa hậu"**: (1) **`dangerouslySetInnerHTML`** (gán `innerHTML` thật → parse + thực thi `script`/`onerror`), (2) **thuộc tính URL** (`href`/`src`/`formAction` — `javascript:`), (3) **`eval`/`new Function`**, (4) **lib render HTML user** (marked + `rehype-raw`, SSR `innerHTML`).
- **Nguyên tắc**: mọi data từ **user/API/localStorage/query** mà đi vào HTML/URL thì **luôn** qua **sanitize/allowlist** — coi không tin cậy **ngang input user**. Không cần thẻ → để React **text** (escape) là xong; cần **rich text** (markdown) → **sanitize (DOMPurify)** rồi mới vào DOM.
- **Defense-in-depth**: dù sanitize có bypass mới, **CSP `script-src 'self'`** là lớp chặn cuối (payload lọt cũng không chạy được) — sanitize + CSP **đi đôi**.

## Trả lời chi tiết

### 1. Vì sao React "chặn" XSS mặc định (cơ chế, không vẹt)

| Cách render | Cơ chế | Kết quả với payload `<img src=x onerror=alert(1)>` |
|---|---|---|
| `<div>{userInput}</div>` | **`document.createTextNode`** (text node, trình duyệt không parse) | Hiện đúng **chữ** đó — **không** popup ✅ |
| `<div dangerouslySetInnerHTML={{__html: userInput}} />` | **`element.innerHTML = ...`** (parse + thực thi `script`/`onerror`) | **Popup chạy** ❌ |

> Tên `**dangerously**SetInnerHTML` là **cảnh báo thật**, không phải trang trí — bạn đang **thay text node (an toàn) bằng innerHTML (parse + chạy)** (Q6 JSX: `{value}` = escape, khác).

### 2. 4 "cửa hậu" (nêu đủ = ăn điểm)

1. **`dangerouslySetInnerHTML`** — **`innerHTML`** thật (parse + chạy `script`/`onerror`/`onclick`/`srcdoc`).
2. **URL scheme** (`href`/`src`/`formAction`) — **`javascript:alert(1)`** chạy khi click; **`data:text/html`** tương tự. React 16.9+ chặn **`javascript:` trong `href`** (throw), **NHƯNG còn `data:`, `vbscript:`**, + **lách** (khoảng trắng/`\u0000`/encoding: `  javascript:`). **Fix bền = allowlist protocol** (không blacklist) (§4).
3. **`eval` / `new Function` / `Function()`** — **không phải React** (bạn tự viết JS động) — **cấm** (code review chặn).
4. **Lib render HTML user** — `marked`/`markdown-it` **raw** (hoặc `rehype-raw`), SSR **`innerHTML`** — "parse markdown" ≠ "an toàn" (markdown **raw HTML** lọt qua).

### 3. Khi nào ĐƯỢC dùng `dangerouslySetInnerHTML` (quy tắc + sanitize)

- **Chỉ khi** cần **rich text/markdown** mà **không thể** dùng "safe component" (VD: render **markdown đã sanitize**). Không cần thẻ → **không dùng** (để React text escape, §1).
- **MỌI LẦN** dùng phải **kèm sanitize** (nguồn) + **comment "đã sanitize ở dòng trên"** (ESLint `react/no-danger` buộc comment khi disable):

```tsx
import DOMPurify from "dompurify";

// (1) Markdown → HTML (lib) — HTML THÔ (chưa an toàn)
const raw = marked.parse(userComment);

// (2) SANITIZE (loại thẻ/thuộc tính độc, giữ thẻ lành) — BẮT BUỘC trước khi vào DOM
const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } }); // allowlist thẻ

// (3) mới "mở cửa" (React "mặc định" escape — ở đây "giật" lá chắn, đã sanitize)
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

**DOMPurify làm gì (nói được = ăn điểm)**: **parse** bằng `DOMParser`, **allowlist** (giữ `<b>`, `<a>`, `<p>`...), **strip** ngoài danh sách (`<script>`, `on*`, `javascript:`), chạy **cả browser lẫn server (jsdom)**, hỗ trợ **Trusted Types** (CSP nghiêm). "Escape" (mất hết thẻ, thành chữ) vs "Sanitize" (giữ thẻ lành, bỏ thẻ độc) — **rich text = sanitize, không escape**.

### 4. URL: allowlist protocol (không blacklist) — bẫy thường gặp

```tsx
// ❌ SAI: "blacklist" javascript: — SÓT data:, vbscript:, + lách (khoảng trắng/\u0000/encoding)
const ok = !href.includes("javascript:");

// ✅ ĐÚNG: "ALLOWLIST" (chỉ 3 protocol này là link hợp lệ, còn lại = "chữ")
const u = new URL(href, window.location.origin);
const ok = ["https:", "http:", "mailto:"].includes(u.protocol);
// → <a href={ok ? href : undefined}>{label}</a> (không ok thì "không thành link")
```

> **Vì sao allowlist, không blacklist**: "đen" (blacklist) luôn sót scheme mới/lách; "trắng" (allowlist) = **mặc định từ chối** (chặn hết trừ 3 cái bạn cho phép) — **thành kiến với input** (an toàn hơn).

### 5. CSP — lớp "chặn cuối" (defense-in-depth, phối hợp "secure-headers")

- Dù sanitize "lọt" (bypass mới chưa biết), **CSP `script-src 'self'`** = **trình duyệt từ chối chạy script lạ** (chỉ script từ domain mình) → **payload lọt vẫn không thực thi**.
- **2 lớp đi đôi**: bài này (XSS) lo **"đừng để HTML độc vào DOM"** (sanitize/allowlist); "secure-headers" (CSP) lo **"vào rồi cũng không chạy được"** — **không lớp nào đủ một mình** (sanitize = "ngăn", CSP = "chặn sau").

### 6. Angular so sánh (điểm ăn điểm)

| Angular | React | Ghi chú |
|---|---|---|
| **Auto-escape** `{value}` (mặc định, "thành text") | **Cùng** (`{value}` = text node, escape) | **Giống** (cả 2 "mặc định an toàn") |
| `[innerHTML]` / `DomSanitizer` (bypass + sanitize) | `dangerouslySetInnerHTML` | **Cùng ý** (tự "mở cửa" + sanitize) |
| `bypassSecurityTrustHtml` (Angular **cảnh báo** "không dùng") | `dangerouslySetInnerHTML` (cảnh báo ở tên + ESLint) | "Tên" (Angular "bypass...", React "dangerously...") = "cảnh báo" |
| `href` URL — Angular **không auto-block** `javascript:` (cẩn thận) | React **16.9+ block `javascript:`** (throw), còn `data:`/`vbscript:` (allowlist) | React "hối" hơn ở `javascript:` (cảnh báo `data:`) |

> **Nói đúng câu chốt**: "Cả 2 **escape mặc định** ({value} thành text, không parse); rủi ro **chỉ** khi **tự mở cửa** (React `dangerouslySetInnerHTML` / Angular `[innerHTML]`). React **thêm** chặn `javascript:` trong `href` (16.9+), nhưng **không chặn `data:`/`vbscript:` → ALLOWLIST protocol**. Sanitize (DOMPurify) + **CSP** (defense-in-depth) = chuẩn."

## Bẫy khi phỏng vấn

1. **"Nói 'React không bị XSS' (quá an toàn)"** → **sai** (React "an toàn" **ở `{value}`** (escape text) — **rủi ro** từ **4 cửa hậu** (`dangerouslySetInnerHTML`, URL, eval, lib HTML user) (§2). "Mặc định an toàn, bạn tự phá" là câu đúng.
2. **Dùng `dangerouslySetInnerHTML` "không sanitize" (tin user comment)** → **mở XSS ngay** (innerHTML parse + chạy). **Mọi lần** kèm **DOMPurify** (allowlist thẻ) + comment (ESLint `react/no-danger`) (§3).
3. **Blacklist `javascript:` ở `href`** → **sót** `data:`, `vbscript:`, + **lách** (khoảng trắng/`\u0000`). **Allowlist** (`https/http/mailto`) — "mặc định từ chối" (§4).
4. **"Nói sanitize là đủ (không cần CSP)"** → **mất 1 lớp**: bypass "mới" (chưa biết) lọt sanitize → **CSP chặn thực thi** (defense-in-depth, §5). "2 lớp" (ngăn + chặn) — "chỉ 1 lớp" là "tủ".
5. **Tin `localStorage`/API là "an toàn"** → **sai** (XSS **stored** = payload **lưu DB** rồi hiện cho mọi người — nguy hiểm **nhất**; API/localStorage = **không tin cậy ngang input user**) — **luôn** sanitize khi hiện.

## Gợi ý câu chốt

> "React **escape mặc định** `{value}` (text node, không parse) — 'an toàn' **ở đó**. Rủi ro **chỉ** từ **4 cửa hậu**: `dangerouslySetInnerHTML` (innerHTML **thật**), **URL** (`javascript:`/`data:`/`vbscript:` — React **chặn `javascript:`** (16.9+) **chưa đủ** → **allowlist**), `eval`/`new Function`, **lib HTML user**. **Rich text**: markdown → **DOMPurify** (allowlist thẻ, strip độc) rồi mới `dangerouslySetInnerHTML` (kèm ESLint comment). **CSP `script-src 'self'`** = lớp chặn cuối (defense-in-depth, payload 'lọt' sanitize **vẫn không chạy**). Quy tắc: **mặc định an toàn, bạn tự phá** (mở cửa + không sanitize) — và **ngăn (sanitize) + chặn (CSP)** phải **đi đôi**."

## Reference

- [`2_react-techniques/4_security-config/1-xss-escape`](../../2_react-techniques/4_security-config/1-xss-escape) — "4 cửa hậu", escape (text node) vs sanitize (DOMPurify), allowlist protocol, CSP (defense-in-depth)
- [`2_react-techniques/4_security-config/3-secure-headers`](../../2_react-techniques/4_security-config/3-secure-headers) — CSP `script-src 'self'` (lớp chặn cuối, "đôi" với bài này)
- [`3_react-tutorial/18-i18n`](../../3_react-tutorial/18-i18n) — "nội dung user" (i18n/message) → XSS (không tin dữ liệu)
- [`2_react-techniques/4_security-config/4-auth-httpOnly-cookie`](../../2_react-techniques/4_security-config/4-auth-httpOnly-cookie) — XSS **lấy token** (localStorage JS **đọc được** vs httpOnly **không**) — "vì sao XSS nguy hiểm" (Q24 guard)
- Q6 (JSX) — `{value}` = escape (text), `dangerouslySetInnerHTML` = **mở** (innerHTML)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q6 — JSX `{}` render text (escape, an toàn)?](../06-jsx/README.md)
- **Đào sâu (xuyên nhóm)**: [Q35 — "validate ở biên" (parse data không tin cậy)?](../35-type-safety/README.md) · [Q32 — mutation trả nội dung user (rich text) thì sanitize?](../32-query-mutations/README.md) · [Q22 — token (auth) liên quan XSS (lấy token qua localStorage)?](../22-interceptor/README.md)
