# Secure Headers + CSP

> Nguồn: https://owasp.org/www-project-secure-headers/ — https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

## Mục tiêu
- Nắm bộ header bảo mật tối thiểu cho một SPA React và vai trò từng header.
- Hiểu Content-Security-Policy (CSP) hoạt động ra sao, nonce/hash khác `'unsafe-inline'` thế nào.
- Biết **nơi** cấu hình header (reverse proxy / CDN / host config), không nhúng trong code React.

## Tổng quan
- SPA tải HTML tĩnh nhưng vẫn cần server/CDN gửi header bảo mật: chặn XSS, clickjacking, sniffing, rò referrer.
- CSP là lớp **defense-in-depth**: kể cả khi lọt XSS (xem bài `1-xss-escape`), script lạ vẫn bị chặn chạy.
- Áp dụng cho mọi môi trường production (staging có thể nới lỏng + report-only).
- Không set được bằng React/JS trong client — header phải do tầng HTTP (Nginx, Cloudflare, Vercel, Netlify) trả về.

## Khái niệm cốt lõi
- **CSP = allowlist tài nguyên**: `default-src` là mặc định; `script-src`, `style-src`, `img-src`, `connect-src`, `font-src`, `frame-ancestors`... ghi đè từng loại.
- **`'self'`**: chỉ cho tài nguyên cùng origin. **Không có `'unsafe-inline'`** nghĩa là script/style inline bị chặn.
- **Nonce vs Hash**: `script-src 'nonce-abc123'` cho phép đúng thẻ `<script nonce="abc123">`; `'sha256-...'` cho phép theo nội dung file. Nonce phải **ngẫu nhiên mỗi response** (server sinh), hash ổn định cho file tĩnh.
- **Vì sao SPA Vite production không cần nonce**: `vite build` xuất JS ra file `.js` riêng → `script-src 'self'` là đủ. Chỉ dev server mới inline script, nên dev hay phải nới `'unsafe-inline'` (đừng copy sang prod).
- **`'strict-dynamic'`**: cho script đã được nonce tin cậy tự nạp thêm script con; dùng khi cần bundler động.
- **Report-only**: `Content-Security-Policy-Report-Only` chỉ báo vi phạm mà không chặn — dùng để rollout an toàn.
- **Header khác**: `Strict-Transport-Security` (ép HTTPS), `X-Content-Type-Options: nosniff` (chặn đoán MIME), `Referrer-Policy` (giới hạn referrer), `Permissions-Policy` (tắt camera/mic), `frame-ancestors`/`X-Frame-Options` (chống clickjacking).

## Luồng hoạt động / Cách áp dụng
1. Bắt đầu với CSP **report-only** để thu thập nguồn tài nguyên đang dùng (DevTools Console hiện vi phạm).
2. Chốt `default-src 'self'`, thêm domain API vào `connect-src`, domain ảnh vào `img-src`.
3. Bật chế độ chặn thật (`Content-Security-Policy`) ở production.
4. Thêm các header còn lại (HSTS, nosniff, Referrer-Policy, Permissions-Policy).
5. Verify bằng `securityheaders.com` và DevTools → Network → Response Headers.
6. Theo dõi report endpoint (`report-uri` / `report-to`) để bắt vi phạm mới.

## Ví dụ chi tiết
```nginx
# Nginx phục vụ SPA đã build — header áp cho mọi response
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.example.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

# Ép HTTPS trong 1 năm, áp cả subdomain
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
# Không để trình duyệt "đoán" MIME — chặn các kiểu tấn công sniff
add_header X-Content-Type-Options "nosniff" always;
# Chỉ gửi origin khi đi cross-site
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
# Tắt quyền nhạy cảm mặc định
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

```json
// vercel.json — cấu hình header tương đương trên Vercel
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; connect-src 'self' https://api.example.com"
        }
      ]
    }
  ]
}
```

```tsx
// example.tsx — component meta bổ trợ ở tầng HTML (KHÔNG thay thế header server)
export function SecurityMeta() {
  return (
    <>
      {/* Chỉ là gợi ý; header HTTP mới là nguồn quyết định ở production */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
    </>
  );
}

// fetch luôn kèm credentials để cookie httpOnly đi theo — phối hợp CSP connect-src
export async function secureFetch(path: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status === 401) window.location.assign('/login'); // hết phiên → về login
  return res;
}
```

## Giải thích từng phần
- `default-src 'self'`: mặc định chỉ cho tài nguyên cùng origin; các directive sau mở rộng có kiểm soát.
- `script-src 'self'`: chỉ nạp JS từ domain mình → chặn script lạ chèn qua XSS.
- `style-src ... 'unsafe-inline'`: nhiều thư viện UI cần style inline; cân nhắc nonce nếu muốn chặt hơn.
- `connect-src`: giới hạn `fetch`/XHR/WebSocket — thêm đúng domain API.
- `frame-ancestors 'none'`: chống nhúng site vào iframe (clickjacking); thay thế `X-Frame-Options`.
- `base-uri 'self'` / `form-action 'self'`: chặn đổi `<base>` và submit form ra ngoài.

## Lỗi thường gặp / Chống chỉ định
- **Copy CSP dev (`'unsafe-inline'` cho script) vào prod**: vô hiệu hóa bảo vệ XSS → prod chỉ `script-src 'self'`.
- **Đặt CSP trong `<meta>` thay vì header**: không hỗ trợ `frame-ancestors`, `report-uri` → luôn set ở HTTP layer.
- **Bật chặn ngay khi chưa thử report-only**: app vỡ vì chặn nhầm CDN → chạy report-only trước.
- **Quên `connect-src` domain API**: fetch bị chặn, app "im lặng lỗi" → thêm domain API vào `connect-src`.
- **Dùng nonce cho file tĩnh build sẵn**: nonce đổi mỗi request nhưng file không nhúng nonce → dùng hash hoặc `'self'`.

## Best practices / Mẹo
- Nguyên tắc tối thiểu quyền: chỉ mở đúng nguồn cần thiết, không dùng `*`.
- Giữ CSP trong file config hạ tầng có version control để review.
- Ghi log vi phạm CSP (`report-to`) và định kỳ rà.
- Với app cần `innerHTML`, cân nhắc thêm `require-trusted-types-for 'script'` (gắn với bài `1-xss-escape`).
- Đặt `Strict-Transport-Security` chỉ sau khi HTTPS đã chạy ổn để tránh khóa cứng nhầm.
- Kiểm tra CSP mỗi khi thêm dịch vụ ngoài (analytics, chat, thanh toán) — thường phải nới `connect-src`/`img-src`.

## Bài tập nhỏ
Soạn file `_headers` (Netlify) hoặc `vercel.json` cho một app React gọi `https://api.example.com`, dùng ảnh từ `https://images.unsplash.com`, và Google Fonts. Viết CSP đầy đủ, sau đó liệt kê 3 vi phạm có thể gặp khi thiếu directive.

## Reference
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN — Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Content Security Policy (web.dev)](https://web.dev/articles/csp)
- [securityheaders.com](https://securityheaders.com/)
