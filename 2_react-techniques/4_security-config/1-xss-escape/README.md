# Chống XSS trong React

> Nguồn: https://react.dev/learn/keeping-components-pure — https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

## Mục tiêu
- Hiểu vì sao React escape mặc định lại chặn được phần lớn XSS, và khi nào "lá chắn" đó biến mất.
- Biết sanitize rich text bằng DOMPurify (kèm Trusted Types) và validate URL theo allowlist protocol.
- Xem CSP `script-src` là lớp phòng thủ cuối, phối hợp với bài `3-secure-headers`.

## Tổng quan
- XSS (Cross-Site Scripting) là chèn script chạy trong trình duyệt nạn nhân: đánh cắp phiên, đọc dữ liệu, đổi UI, gửi request thay người dùng.
- React/JSX **escape mọi giá trị** đặt trong cú pháp `{value}` → `<` thành `&lt;`, không phá được thẻ HTML.
- Rủi ro chỉ đến từ các "cửa hậu": `dangerouslySetInnerHTML`, thuộc tính URL (`href`, `src`, `formAction`), `eval`/`new Function`, thư viện render HTML từ user (marked, dangerouslySetInnerHTML trong SSR).
- Áp dụng **mỗi khi render nội dung người dùng tạo**: comment, bio, markdown, chat, tên file, query param phản chiếu lại UI.

## Khái niệm cốt lõi
- **Escaping vs Sanitizing**: escape biến ký tự nguy hiểm thành text vô hại (React tự làm); sanitize loại bỏ *thẻ/thuộc tính* nguy hiểm nhưng vẫn giữ HTML hợp lệ (DOMPurify làm).
- **Cơ chế React**: render `<div>{userInput}</div>` tạo *text node*, không parse HTML → `<img onerror>` chỉ hiện thành chữ, không chạy.
- **Cơ chế `dangerouslySetInnerHTML`**: gán thẳng `innerHTML` → trình duyệt parse và **thực thi** `<script>`, `onerror`, `onclick`. Vì thế tên có chữ "dangerously".
- **URL scheme injection**: `href="javascript:alert(1)"` hoặc `data:text/html,<script>` chạy khi click. React 16.9+ đã chặn `javascript:` trong `href` (thay bằng `javascript:throw new Error(...)`) nhưng vẫn còn `data:`, `vbscript:`, redirect mở → cần allowlist.
- **DOMPurify**: parse HTML bằng `DOMParser`, xây dựng allowlist, strip mọi thứ ngoài danh sách; chạy cả client (browser) và server (jsdom). Hỗ trợ **Trusted Types** để tương thích CSP `require-trusted-types-for`.
- **Trusted Types / CSP**: khi bật, việc gán `innerHTML` bằng chuỗi thô bị chặn; DOMPurify có thể trả `TrustedHTML` qua `RETURN_TRUSTED_TYPE: true`.

## Luồng hoạt động / Cách áp dụng
1. Rà soát mọi chỗ dùng `dangerouslySetInnerHTML` / `innerHTML` / renderer tự viết (`react-markdown` + `rehype-raw`).
2. Nếu nội dung không cần thẻ → để React render text (`{html}`) là xong.
3. Nếu cần rich text → `DOMPurify.sanitize(raw, config)` với allowlist tối thiểu, **rồi mới** đưa vào DOM.
4. Validate mọi URL từ user: `new URL()`, chỉ chấp nhận `https:`/`http:`/`mailto:`.
5. Thêm CSP `script-src 'self'` (bài 3): nếu có lọt thì script inline/ngoài domain vẫn không chạy.

## Ví dụ chi tiết
```tsx
import DOMPurify from 'dompurify';

// Render HTML người dùng nhập — luôn sanitize trước khi đưa vào DOM
export function RichText({ html }: { html: string }) {
  // Allowlist: chỉ giữ định dạng cơ bản, bỏ script/iframe/style/on*
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
    // Bật true khi CSP dùng Trusted Types để nhận về TrustedHTML:
    RETURN_TRUSTED_TYPE: false,
  });
  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// Link an toàn: chặn javascript:/data: bằng allowlist protocol
export function SafeLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  let ok = false;
  try {
    // Phân giải URL tương đối theo origin hiện tại để chuẩn hoá
    const u = new URL(href, window.location.origin);
    ok = u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:';
  } catch {
    ok = false; // URL hỏng → coi như không an toàn
  }
  if (!ok) return <span>{children}</span>; // fallback: chỉ còn chữ, không phải link
  return (
    // noopener + noreferrer chặn reverse tabnabbing + rò referrer
    <a href={href} rel="noopener noreferrer">
      {children}
    </a>
  );
}
```

```ts
// Tùy chọn: bật Trusted Types cho môi trường CSP nghiêm ngặt
import DOMPurify from 'dompurify';

// Trả về TrustedHTML thay vì string — cần CSP require-trusted-types-for 'script'
DOMPurify.setConfig({ RETURN_TRUSTED_TYPE: true });
export const cleanHtml = (raw: string) => DOMPurify.sanitize(raw);
```

## Giải thích từng phần
- `ALLOWED_TAGS` / `ALLOWED_ATTR`: càng hẹp càng an toàn; DOMPurify mặc định đã chặn `<script>`, `on*`, `srcdoc`..., nhưng allowlist tường minh giúp review dễ và ổn định hơn.
- `new URL(href, origin)`: chuẩn hóa URL (xử lý `//evil.com`, percent-encoding, khoảng trắng) trước khi so sánh protocol.
- `rel="noopener noreferrer"`: trang đích không truy cập được `window.opener` và không nhận referrer.
- `RETURN_TRUSTED_TYPE`: chỉ bật khi CSP có `require-trusted-types-for 'script'`, nếu không sẽ không tương thích kiểu DOM.
- `eslint-disable react/no-danger`: chỉ tắt sau khi đã sanitize, kèm comment nêu lý do.
- `ALLOWED_URI_REGEXP` (tùy chọn): có thể giới hạn ngay trong DOMPurify nếu muốn chặn protocol ngay ở tầng sanitize thay vì kiểm tra sau.
- **Ngữ cảnh khác nhau cần cấu hình khác nhau**: SVG/MathML có namespace riêng (`svg`/`math`), contenteditable cần allowlist rộng hơn — đừng dùng chung một cấu hình cho mọi chỗ.

## Lỗi thường gặp / Chống chỉ định
- **`dangerouslySetInnerHTML` với HTML thô**: script `onerror` chạy ngay khi render → luôn sanitize bằng DOMPurify trước.
- **Sanitize rồi nối chuỗi lại** (`clean + userInput`): bypass hoàn toàn → sanitize **sau cùng**, ngay trước khi render.
- **Chỉ blacklist `javascript:`**: bỏ sót `data:`, `vbscript:`, `\u0000javascript:` → dùng allowlist protocol thay vì danh sách chặn.
- **Tin `sanitize()` mặc định đủ cho mọi ngữ cảnh** (SVG, MathML, contenteditable): cấu hình theo ngữ cảnh và cập nhật DOMPurify thường xuyên vì bypass mới liên tục xuất hiện.
- **Render markdown bằng `marked` + `dangerouslySetInnerHTML` không sanitize**: dùng `rehype-sanitize` hoặc bọc DOMPurify.
- **Đặt `target="_blank"` nhưng quên `rel="noopener"`**: trang đích điều khiển `window.opener` → luôn kèm `noopener noreferrer`.
- **Sanitize ở client nhưng API trả HTML và render ở SSR**: lọt ở server → sanitize cả phía server.

## Best practices / Mẹo
- Nguyên tắc vàng: **allowlist, không blacklist**; mặc định để React render text.
- Server cũng phải sanitize (SSR) — không tin client đã làm.
- Bật Trusted Types (`require-trusted-types-for 'script'`) để đóng hẳn vector `innerHTML`.
- Viết unit test với payload XSS mẫu (`<img src=x onerror=alert(1)>`) cho hàm sanitize.
- Theo dõi advisory của DOMPurify, nâng version thường xuyên (DOMPurify 3.x là bản hiện hành).
- Bật `eslint-plugin-no-unsanitized` để bắt mọi chỗ gán `innerHTML` chưa qua sanitize trong review tự động.
- Dùng `Content-Security-Policy` report-only để phát hiện payload XSS lọt qua trước khi bật chặn.
- Coi mọi dữ liệu từ API/`localStorage`/query param là "không tin cậy" ngang hàng với input người dùng.
- Lưu payload XSS mẫu vào test suite để bắt regression khi nâng cấp DOMPurify.
- Giữ DOMPurify và mọi thư viện render HTML ở bản mới nhất; đọc changelog mỗi lần nâng version.

## Bài tập nhỏ
Viết component `UserBio` nhận `bio` (markdown đơn giản) và `website`. Sanitize markdown (chỉ cho `**bold**`, `*italic*`, link), validate `website` chỉ nhận `https:`, và viết test với payload `<img src=x onerror=alert(1)>` kỳ vọng không còn thẻ `img`.

## Reference
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)
- [React — Keeping components pure](https://react.dev/learn/keeping-components-pure)
