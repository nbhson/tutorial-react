# Q33: Phải hiển thị comment do user nhập, em làm sao để không bị dính XSS?

## Câu hỏi

> React nói là an toàn XSS — an toàn ở chỗ nào, và ở những chỗ nào lá chắn đó mất tác dụng?
> `dangerouslySetInnerHTML` dùng khi nào, vì sao tên lại có chữ "dangerously"?
> Render markdown / user content (comment, bio) thì sanitize bằng gì?
> `javascript:` trong `href` thì React chặn chưa đủ?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói nhanh 30 giây" — chốt được khung 3 gạch đầu dòng này là đã qua vòng "có hiểu không", phần dưới dành cho vòng "hiểu tới đâu".

- Giá trị trong `{value}` React biến thành **chữ thuần**, trình duyệt không chạy — `<img onerror=...>` chỉ hiện thành chữ. Đây là mặc định, không cần cấu hình.
- Lá chắn mất ở 4 cửa: `dangerouslySetInnerHTML` (gán HTML thật), thuộc tính URL (`href`/`src` với `javascript:`), `eval`/`new Function`, lib render HTML của user.
- Luật: data từ user/API mà vào HTML/URL thì luôn qua kiểm duyệt (sanitize, chỉ cho phép thẻ an toàn). Chỉ cần chữ thì để React escape, cần rich text (markdown) thì DOMPurify trước. Thêm CSP `script-src 'self'` làm lớp chặn cuối.

## Trả lời chi tiết

Mục này lần lượt mở: lá chắn mặc định của React vận hành thế nào, nó hở ở đâu (4 "cửa hậu"), và cách vá từng cửa — đọc để trả lời được câu hỏi nuột nhất: "nếu React an toàn sẵn thì hack XSS bằng cách nào?".

### 1. Vì sao React "chặn" XSS mặc định (cơ chế, không vẹt)

| Cách render | Cơ chế | Kết quả với payload `<img src=x onerror=alert(1)>` |
|---|---|---|
| `<div>{userInput}</div>` | **`document.createTextNode`** (text node, trình duyệt không parse) | Hiện đúng **chữ** đó — **không** popup ✅ |
| `<div dangerouslySetInnerHTML={{__html: userInput}} />` | **`element.innerHTML = ...`** (parse + thực thi `script`/`onerror`) | **Popup chạy** ❌ |

> **Cách đọc bảng này:** mỗi dòng là một cách render cùng một payload độc; so cột Cơ chế với cột Kết quả để thấy mấu chốt — text node thì trình duyệt "đọc thành chữ", còn innerHTML thì trình duyệt "nấu chín thành HTML" và script chạy luôn.

> Tên `**dangerously**SetInnerHTML` là **cảnh báo thật**, không phải trang trí — bạn đang **thay text node (an toàn) bằng innerHTML (parse + chạy)** (Q6 JSX: `{value}` = escape, khác). Ví von: mặc định của React như đưa khách một tấm ảnh pho-tô-có-sẵn của tài liệu (nhìn, không sửa được); `dangerouslySetInnerHTML` là giao hẳn bản gốc kèm bút cho khách — họ viết gì lên đó cũng thành thật.

### 2. 4 "cửa hậu" (nêu đủ = ăn điểm)

1. **`dangerouslySetInnerHTML`** — **`innerHTML`** thật (parse + chạy `script`/`onerror`/`onclick`/`srcdoc`).
2. **URL scheme** (`href`/`src`/`formAction`) — **`javascript:alert(1)`** chạy khi click; **`data:text/html`** tương tự. React 16.9+ chặn **`javascript:` trong `href`** (throw), **NHƯNG còn `data:`, `vbscript:`**, + **lách** (khoảng trắng/`\u0000`/encoding: `  javascript:`). **Fix bền = allowlist protocol** (không blacklist) (§4).
3. **`eval` / `new Function` / `Function()`** — **không phải React** (bạn tự viết JS động) — **cấm** (code review chặn).
4. **Lib render HTML user** — `marked`/`markdown-it` **raw** (hoặc `rehype-raw`), SSR **`innerHTML`** — "parse markdown" ≠ "an toàn" (markdown **raw HTML** lọt qua).

### 3. Khi nào ĐƯỢC dùng `dangerouslySetInnerHTML` (quy tắc + sanitize)

Mục này trả lời câu hỏi "vậy khi nào được mở cửa": chỉ khi thật sự cần rich text, và mở cửa bao nhiêu lần thì khóa cửa (sanitize) bấy nhiêu lần.

- **Chỉ khi** cần **rich text/markdown** mà **không thể** dùng "safe component" (VD: render **markdown đã sanitize**). Không cần thẻ → **không dùng** (để React text escape, §1).
- **MỌI LẦN** dùng phải **kèm sanitize** (nguồn) + **comment "đã sanitize ở dòng trên"** (ESLint `react/no-danger` buộc comment khi disable):

> 📄 **Code ví dụ:** [`examples/01-3-khi-nao-uoc-dung-dangerouslysetinnerhtml-quy-tac.tsx`](examples/01-3-khi-nao-uoc-dung-dangerouslysetinnerhtml-quy-tac.tsx)

**DOMPurify làm gì (nói được = ăn điểm)**: **parse** bằng `DOMParser`, **allowlist** (giữ `<b>`, `<a>`, `<p>`...), **strip** ngoài danh sách (`<script>`, `on*`, `javascript:`), chạy **cả browser lẫn server (jsdom)**, hỗ trợ **Trusted Types** (CSP nghiêm). "Escape" (mất hết thẻ, thành chữ) vs "Sanitize" (giữ thẻ lành, bỏ thẻ độc) — **rich text = sanitize, không escape**. Ví von: escape là "xé trắng" cả cuốn thư để chắc không có gì đọc được; sanitize là "kiểm duyệt thư" — giữ lại chữ và hình hợp lệ, gỡ bỏ những phần độc.

### 4. URL: allowlist protocol (không blacklist) — bẫy thường gặp

> 📄 **Code ví dụ:** [`examples/02-4-url-allowlist-protocol-khong-blacklist-bay-thuong.tsx`](examples/02-4-url-allowlist-protocol-khong-blacklist-bay-thuong.tsx)

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

> **Cách đọc bảng này:** mỗi dòng là một tình huống XSS ghép Angular với React tương đương; cột Ghi chú là điểm chênh — dòng 4 đáng chú ý nhất nếu bạn chuyển dự án từ Angular sang React, vì "React tự chặn" không có nghĩa là "chặn hết".

> **Nói đúng câu chốt**: "Cả 2 **escape mặc định** ({value} thành text, không parse); rủi ro **chỉ** khi **tự mở cửa** (React `dangerouslySetInnerHTML` / Angular `[innerHTML]`). React **thêm** chặn `javascript:` trong `href` (16.9+), nhưng **không chặn `data:`/`vbscript:` → ALLOWLIST protocol**. Sanitize (DOMPurify) + **CSP** (defense-in-depth) = chuẩn."

> **Tóm gọn 1 câu:** React là bảo vệ kiểm đồ vào nhà (escape mặc định), nhưng ai tự mở cửa hậu (`dangerouslySetInnerHTML`, URL, eval) thì phải tự kiểm tra hành lý (sanitize) — và CSP là chốt cửa sắt cuối cùng.

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 5 câu trả lời nghe hợp lý nhưng sai — biết trước 5 chỗ ngập này thì câu hỏi bảo mật nào cũng đi được.

1. **"Nói 'React không bị XSS' (quá an toàn)"** → **sai** (React "an toàn" **ở `{value}`** (escape text) — **rủi ro** từ **4 cửa hậu** (`dangerouslySetInnerHTML`, URL, eval, lib HTML user) (§2). "Mặc định an toàn, bạn tự phá" là câu đúng.
2. **Dùng `dangerouslySetInnerHTML` "không sanitize" (tin user comment)** → **mở XSS ngay** (innerHTML parse + chạy). **Mọi lần** kèm **DOMPurify** (allowlist thẻ) + comment (ESLint `react/no-danger`) (§3).
3. **Blacklist `javascript:` ở `href`** → **sót** `data:`, `vbscript:`, + **lách** (khoảng trắng/`\u0000`). **Allowlist** (`https/http/mailto`) — "mặc định từ chối" (§4).
4. **"Nói sanitize là đủ (không cần CSP)"** → **mất 1 lớp**: bypass "mới" (chưa biết) lọt sanitize → **CSP chặn thực thi** (defense-in-depth, §5). "2 lớp" (ngăn + chặn) — "chỉ 1 lớp" là "tủ".
5. **Tin `localStorage`/API là "an toàn"** → **sai** (XSS **stored** = payload **lưu DB** rồi hiện cho mọi người — nguy hiểm **nhất**; API/localStorage = **không tin cậy ngang input user**) — **luôn** sanitize khi hiện.

> **Tóm gọn 1 câu:** Bẫy lớn nhất là tin "React an toàn sẵn" — mặc định nó escape mọi thứ, nhưng chỉ cần bạn mở một trong 4 cửa hậu mà quên sanitize là lá chắn coi như không có.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói một hơi rồi diễn đạt lại theo giọng của mình.

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
