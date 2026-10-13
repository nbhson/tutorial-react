# Secure Headers + CSP

> Nguồn: https://owasp.org/www-project-secure-headers/ — https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

## Mục tiêu

### 1. Nắm bộ header bảo mật tối thiểu cho SPA React và vai trò từng header

**Vì sao:** SPA tải HTML tĩnh nhưng vẫn chạy JS đầy quyền trong origin mình — thiếu header là thiếu 4 lớp giáp: XSS chạy tự do (không CSP), bị nhúng vào iframe lừa click (không frame-ancestors), bị đoán MIME thực thi file tải lên (không nosniff), bị ép về HTTP nghe lén (không HSTS), bị xin camera/mic ngầm (không Permissions-Policy), bị rò URL nội bộ qua referrer (không Referrer-Policy). Mỗi header khóa một vector — bỏ một là hở một.

**Bộ tối thiểu (nhớ 6 cái):** `Content-Security-Policy` (allowlist tài nguyên), `Strict-Transport-Security` (ép HTTPS), `X-Content-Type-Options: nosniff` (chặn đoán MIME), `Referrer-Policy` (giới hạn referrer), `Permissions-Policy` (tắt quyền nhạy cảm), `frame-ancestors 'none'` trong CSP (chống clickjacking, thay X-Frame-Options cũ).

### 2. Hiểu CSP hoạt động ra sao, nonce/hash khác `'unsafe-inline'` thế nào

**Vì sao:** CSP là allowlist "cái gì được tải/chạy từ đâu", chia theo loại (`script-src`, `style-src`, `img-src`, `connect-src`, `font-src`, `frame-ancestors`, `base-uri`, `form-action`) với `default-src` làm mặc định. `'unsafe-inline'` cho script inline chạy — bật là CSP mất nửa tác dụng (XSS inline chạy tự do). Nonce (server sinh ngẫu nhiên mỗi response, thẻ nào có nonce đúng mới chạy) và hash (cho phép theo nội dung file) là cách cho phép inline có kiểm soát thay vì mở toang.

**SPA Vite production không cần nonce cho script:** `vite build` xuất JS ra file `.js` riêng → `script-src 'self'` đủ. Chỉ dev server mới inline (HMR) nên dev hay nới `'unsafe-inline'` — tuyệt đối không copy sang prod.

### 3. Biết nơi cấu hình header (reverse proxy / CDN / host), không nhúng trong code React

**Vì sao:** header là tầng HTTP — do server/CDN trả về trước khi browser chạy JS. React chỉ chạy sau khi HTML về nên không thể tự đặt header cho chính response chở nó. Đặt trong code (meta) thiếu `frame-ancestors`/`report-uri`, dễ bị ghi đè, và mỗi deploy front phải nhớ — sai chỗ. Đúng chỗ: Nginx `add_header`, Vercel `vercel.json headers`, Netlify `_headers`, Cloudflare Transform Rules — version control ở hạ tầng, review như code.

## Tổng quan

- SPA tải HTML tĩnh nhưng vẫn cần server/CDN gửi header bảo mật: chặn XSS, clickjacking, sniffing, rò referrer. Không header, mọi sanitize ở JS chỉ là một lớp — thủng một chỗ là mất.
- CSP là lớp **defense-in-depth**: kể cả khi lọt XSS (xem bài `1-xss-escape`), script lạ vẫn bị chặn chạy. CSP không thay sanitize — hai lớp cộng nhau.
- Áp dụng mọi production (staging nới lỏng + report-only để thu thập vi phạm mà không vỡ app).
- Không set bằng React/JS client — header phải do tầng HTTP (Nginx, Cloudflare, Vercel, Netlify) trả về. Component meta trong example chỉ là bổ trợ defense-in-depth ở HTML, không thay header.

## Khái niệm cốt lõi

### 1. CSP = allowlist theo loại tài nguyên

`default-src 'self'` là mặc định (chỉ cùng origin). Từng loại ghi đè: `script-src` (JS), `style-src` (CSS), `img-src` (ảnh), `connect-src` (fetch/XHR/WS — quên domain API là app "im lặng lỗi"), `font-src`, `frame-ancestors` (ai được nhúng mình), `base-uri` (chặn đổi `<base>`), `form-action` (chặn submit ra ngoài). Thiếu directive nào thì `default-src` quyết — nên `default-src 'self'` chặt từ đầu rồi mở có kiểm soát.

### 2. `'self'` và cấm `'unsafe-inline'` cho script ở prod

`'self'` = cùng scheme+host+port. Không `'unsafe-inline'` = script/style inline bị chặn. Nhiều lib UI cần style inline → `style-src` hay phải nới `'unsafe-inline'` (chấp nhận được, style ít nguy hiểm hơn script); script thì không bao giờ nới ở prod.

```nginx
# ❌ SAI (prod): mở unsafe-inline cho script — XSS inline chạy tự do, CSP vô dụng
# add_header Content-Security-Policy "script-src 'self' 'unsafe-inline'" always;
# ✅ ĐÚNG (prod): script chỉ từ file cùng origin (Vite build ra file riêng nên đủ)
# add_header Content-Security-Policy "script-src 'self'" always;
```

### 3. Nonce vs Hash — cho phép inline có kiểm soát

Nonce: server sinh `abc123` mỗi response, header `script-src 'nonce-abc123'`, thẻ `<script nonce="abc123">` mới chạy — attacker không đoán được nonce. Hash: `'sha256-...'` cho phép đúng nội dung file đó (ổn định cho file tĩnh). Nonce mỗi request đổi nên không dùng cho file build sẵn (file không nhúng nonce động được) — file tĩnh dùng `'self'`/hash.

### 4. `'strict-dynamic'` — script tin cậy được nạp thêm con

Script có nonce hợp lệ được quyền nạp thêm script (bundler động, loader). Dùng khi chuỗi nạp lồng nhau mà không muốn liệt kê hết domain con.

### 5. Report-only — rollout không vỡ app

`Content-Security-Policy-Report-Only` chỉ báo vi phạm (Console + `report-uri`/`report-to`) mà không chặn. Luồng chuẩn: report-only 1–2 tuần → thu thập đủ nguồn (analytics, chat, font, ảnh) → chốt allowlist → bật chặn thật. Bật chặn ngay khi chưa thử là app vỡ vì chặn nhầm CDN.

### 6. Header còn lại — HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors

HSTS ép HTTPS 1 năm + subdomain (chỉ bật sau khi HTTPS ổn — khóa cứng nhầm là tự DDoS mình). `nosniff` chặn đoán MIME (file tải lên giả ảnh chứa JS không bị thực thi). Referrer-Policy `strict-origin-when-cross-origin` (nội bộ giữ path, cross-site chỉ origin). Permissions-Policy tắt camera/mic/geo mặc định (cần mới mở theo origin). `frame-ancestors 'none'` chống nhúng iframe (clickjacking) — thay `X-Frame-Options` cũ.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Bắt đầu report-only, đọc Console thu thập nguồn

Triển khai header report-only ở staging, click hết flow chính, ghi lại mọi vi phạm Console (domain nào, loại nào). Đây là allowlist thực tế, không phải đoán.

### Bước 2. Chốt `default-src 'self'`, mở `connect-src` (API), `img-src` (ảnh), `font-src` đúng domain

Mỗi domain mở phải trả lời "dịch vụ gì, sao cần". Không `*`. Thêm dịch vụ ngoài (analytics/chat/thanh toán) là quay lại bước này — kiểm tra CSP mỗi lần thêm vendor.

### Bước 3. Bật chặn thật ở production, giữ report endpoint

`Content-Security-Policy` (không Only) + `report-uri`/`report-to` để bắt vi phạm mới sau deploy. Log vi phạm định kỳ rà — vi phạm tăng đột biến sau release là mùi bundle mới kéo domain mới.

### Bước 4. Thêm HSTS/nosniff/Referrer/Permissions-Policy

HSTS sau khi HTTPS ổn. Mỗi header verify ở DevTools Network → Response Headers + `securityheaders.com` chấm điểm.

### Bước 5. Verify + theo dõi

`securityheaders.com` phải A trở lên. Mỗi deploy kiểm tra lại (header ở hạ tầng, dễ bị ghi đè khi đổi CDN config).

## Ví dụ chi tiết

Mirror đầy đủ với `example.tsx` cùng thư mục (không rút gọn) + config server:

```nginx
# Nginx phục vụ SPA đã build — header áp cho mọi response (mirror từ README gốc, giữ nguyên)
# Vì sao always: Nginx chỉ add cho response 2xx mặc định — always để cả lỗi cũng có header
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.example.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

# Ép HTTPS trong 1 năm, áp cả subdomain — chỉ bật sau khi HTTPS chạy ổn (khóa cứng nhầm là tự chặn mình)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
# Không để trình duyệt "đoán" MIME — file giả ảnh chứa JS không bị thực thi (chặn sniff)
add_header X-Content-Type-Options "nosniff" always;
# Chỉ gửi origin khi đi cross-site — nội bộ giữ path, ngoài chỉ biết domain (chống rò URL nội bộ)
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
# Tắt quyền nhạy cảm mặc định — cần (gọi video) thì mở theo origin cụ thể, không mở toang
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

```json
// vercel.json — cấu hình tương đương trên Vercel (mirror từ README gốc)
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
// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
// Component meta bổ trợ (KHÔNG thay thế headers server):
// Vì sao không thay: meta thiếu frame-ancestors/report-uri, dễ bị ghi đè — header HTTP mới quyết định ở prod
export function SecurityMeta() {
  return (
    <>
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
    </>
  );
}

// Fetch luôn gửi kèm credentials để cookie httpOnly đi theo,
// kết hợp CSP/connect-src giới hạn domain ở tầng server.
// Vì sao include: cookie httpOnly (xem bài 4) chỉ đi theo khi credentials include + CORS server cho phép
export async function secureFetch(path: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    credentials: 'include', // cookie phiên đi theo — không có là 401 dù đã login
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status === 401) window.location.assign('/login'); // hết phiên → về login (dùng assign để không Back lại trang cần auth)
  return res;
}
```

## Giải thích từng phần

### `default-src 'self'` — mặc định chặt, mở có kiểm soát

Mọi loại không ghi đè đều chỉ cùng origin. Muốn mở (ảnh Unsplash, font Google) thì ghi đè riêng từng loại — không nới default. Đây là "deny by default" của CSP.

### `script-src 'self'` — chặn script lạ dù XSS lọt

Payload `<script src="https://evil.com/x.js">` chèn được vào DOM cũng không chạy vì domain lạ. Kết hợp sanitize (bài 1) thành 2 lớp: lọt lớp 1 còn lớp 2.

### `style-src ... 'unsafe-inline'` — nhượng bộ có lý do

Nhiều UI lib chèn style inline. Style ít nguy hiểm hơn script nên nới ở đây chấp nhận được; muốn chặt hơn thì nonce cho style. Script thì không bao giờ nới.

### `connect-src` — quên là fetch "chết im"

`fetch`/`WS` tới domain không liệt kê bị chặn, lỗi hiện ở Console chứ không phải exception rõ — app "im lặng lỗi". Thêm đúng domain API (+ socket nếu có). Mỗi lần thêm vendor mới (analytics, chat) là kiểm tra lại directive này.

### `frame-ancestors 'none'` + `base-uri`/`form-action` — chống 3 trò

`frame-ancestors 'none'`: không ai nhúng mình vào iframe (clickjacking). `base-uri 'self'`: chặn đổi `<base href="evil">` để lái mọi relative URL. `form-action 'self'`: chặn submit form ra ngoài (cắp credential qua form giả).

## Lỗi thường gặp / Chống chỉ định

### 1. Copy CSP dev (`'unsafe-inline'` script) sang prod → vô hiệu XSS-shield

```nginx
# ❌ SAI (prod): copy từ dev (dev cần inline cho HMR)
# add_header Content-Security-Policy "script-src 'self' 'unsafe-inline'" always;
# ✅ ĐÚNG (prod): chỉ self — build ra file riêng nên không cần inline
# add_header Content-Security-Policy "default-src 'self'; script-src 'self'; ..." always;
```

### 2. Đặt CSP trong `<meta>` thay header → thiếu directive quan trọng

Meta không hỗ trợ `frame-ancestors`, `report-uri`/`report-to`, `sandbox`. Luôn set ở HTTP layer (Nginx/Vercel/Netlify). Meta chỉ bổ trợ.

### 3. Bật chặn ngay chưa report-only → vỡ app vì chặn nhầm CDN

Chạy report-only 1–2 tuần, chốt allowlist từ vi phạm thật, rồi mới chặn. Mỗi vendor mới là một vòng lại.

### 4. Quên `connect-src` API → app im lặng lỗi

Triệu chứng: UI trắng/treo, không báo đỏ rõ, Console có dòng CSP blocked. Fix: thêm domain API (+ WS) vào `connect-src`.

### 5. Nonce cho file tĩnh build sẵn → không khớp

Nonce đổi mỗi response nhưng file build hash cố định không nhúng nonce động — không bao giờ khớp. File tĩnh dùng `'self'`/hash, nonce chỉ cho inline server render động.

## Best practices / Mẹo

### Tối thiểu quyền + version control hạ tầng + log vi phạm

Chỉ mở đúng nguồn cần, không `*`. CSP trong file hạ tầng có git để review như code. `report-to` log định kỳ — vi phạm tăng sau release là mùi bundle mới. App có `innerHTML` thì thêm `require-trusted-types-for` (nối bài 1). HSTS sau HTTPS ổn. Mỗi vendor mới kiểm tra lại CSP.

## Bài tập nhỏ

1. Soạn `_headers` (Netlify) hoặc `vercel.json` cho app gọi `https://api.example.com`, ảnh `https://images.unsplash.com`, Google Fonts (`fonts.googleapis.com` + `fonts.gstatic.com`).
2. Viết CSP đầy đủ: `default-src 'self'`, `connect-src` (api), `img-src` (self + unsplash + data), `font-src` (gstatic), `style-src` (self + googleapis + unsafe-inline nếu cần), `frame-ancestors 'none'`.
3. Liệt kê 3 vi phạm khi thiếu: thiếu `connect-src` (fetch chết im), thiếu `img-src` unsplash (ảnh vỡ + Console blocked), thiếu `font-src` gstatic (font rớt về system).
4. Chạy `securityheaders.com` chấm điểm, sửa tới A.

## Reference

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN — Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Content Security Policy (web.dev)](https://web.dev/articles/csp)
- [securityheaders.com](https://securityheaders.com/)
