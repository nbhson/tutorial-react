# Security & Config — Tổng quan

> Nguồn: https://react.dev/learn/keeping-components-pure — https://owasp.org/www-project-top-ten/

Nhóm này gom 4 mảnh ghép bảo mật tưởng rời rạc nhưng thực ra bổ trợ nhau: **chống XSS ở tầng render**, **quản lý cấu hình an toàn**, **siết header ở tầng HTTP**, và **xác thực bằng cookie httpOnly**. Đọc theo thứ tự sẽ thấy mỗi bài là một lớp phòng thủ (defense-in-depth) cho lớp kế tiếp.

## Nhóm này giải quyết gì

Bảo mật frontend là **nhiều lớp chồng nhau**, không phải một "viên đạn bạc". Nếu một lớp thủng, lớp sau vẫn giữ:

1. **XSS** — kẻ tấn công chèn script chạy trong trang để đánh cắp token/dữ liệu → chặn ở tầng render và sanitize.
2. **Rò rỉ cấu hình** — secret bị nhúng vào bundle client hoặc cấu hình sai môi trường → quản lý env tập trung, fail-fast.
3. **Thiếu header phòng thủ** — không có CSP/HSTS/nosniff → trình duyệt không có lưới an toàn → siết ở tầng HTTP.
4. **Token bị đánh cắp** — lưu JWT trong `localStorage` thì XSS là mất → chuyển sang cookie httpOnly + chống CSRF.

## Khi nào cần

- App có **đăng nhập / dữ liệu người dùng** → cả 4 bài đều liên quan.
- Render **HTML từ nguồn ngoài** (rich text, markdown, CMS) → **bài 1** bắt buộc.
- Có nhiều môi trường (dev/staging/prod) và config khác nhau → **bài 2**.
- Chuẩn bị **lên production** / qua audit bảo mật → **bài 3**.
- Dùng JWT/session, có refresh token → **bài 4**.

## Các bài con

| # | Bài | Nội dung | Lớp phòng thủ |
|---|---|---|---|
| 1 | [1-xss-escape/](1-xss-escape/README.md) | Chống XSS: React escape mặc định, sanitize rich text bằng **DOMPurify**, validate URL bằng allowlist protocol, Trusted Types. | Tầng render |
| 2 | [2-env-config/](2-env-config/README.md) | Env config Vite (`VITE_*`), phân môi trường theo `mode`, validate **zod** fail-fast, tách secret sang BFF/SSR. | Cấu hình |
| 3 | [3-secure-headers/](3-secure-headers/README.md) | Secure headers + **CSP** (nonce/hash), HSTS, nosniff, Referrer-Policy, Permissions-Policy; set ở Nginx/CDN/host config. | Tầng HTTP |
| 4 | [4-auth-httpOnly-cookie/](4-auth-httpOnly-cookie/README.md) | Auth bằng cookie **HttpOnly; Secure; SameSite**, refresh rotation chống reuse, phòng CSRF, `credentials: 'include'`. | Tầng phiên |

## Mô tả chi tiết từng bài

### 1. Chống XSS trong React
React escape mọi `{value}` trong JSX nên XSS khó xảy ra — trừ khi dùng `dangerouslySetInnerHTML`, thuộc tính URL (`href`/`src`), hoặc render HTML từ thư viện. Bài này dạy: luôn sanitize rich text bằng `DOMPurify.sanitize()` với allowlist, validate URL chỉ nhận `https:`/`mailto:`, và coi CSP `script-src 'self'` là chốt chặn cuối. Kèm Trusted Types để khóa hẳn vector `innerHTML`.

### 2. Env Config (Vite)
Biến môi trường Vite chỉ expose ra client khi có tiền tố `VITE_`; giá trị bị "đóng băng" lúc build. Bài này đi qua thứ tự nạp file `.env.*`, khác biệt `mode` vs `NODE_ENV`, cách validate bằng `zod` để **fail-fast** và type-safe qua `ImportMetaEnv`. Nhấn mạnh: secret phải ở server/BFF, không bao giờ nhúng vào bundle frontend.

### 3. Secure Headers + CSP
SPA vẫn cần header từ server/CDN. Bài này giải thích CSP hoạt động như allowlist tài nguyên, khác biệt nonce/hash/`'unsafe-inline'`, vì sao build Vite production chỉ cần `script-src 'self'`, và quy trình rollout bằng report-only trước khi bật chặn. Cấu hình ở Nginx, `vercel.json`, `_headers` — không nhúng trong code React.

### 4. Auth httpOnly Cookie
Không lưu token trong `localStorage` (dính XSS là mất). Dùng cookie `HttpOnly; Secure; SameSite` do server set; React chỉ gọi API với `credentials: 'include'`. Bài này mô tả flow login → access/refresh, **refresh rotation** chống reuse, phòng CSRF bằng `SameSite` + kiểm tra `Origin`/double-submit token, và gộp refresh tránh race giữa các tab.

## Thứ tự đọc gợi ý

```
1 (render) → 2 (config) → 3 (HTTP) → 4 (phiên)
```

Đọc từ trong ra ngoài: bắt đầu ở tầng gần code React nhất (render/XSS), rồi ra cấu hình, rồi tầng HTTP, và cuối cùng là phiên xác thực — mỗi bước là một vành đai bảo vệ cho bước trước. Nếu chỉ quan tâm auth, có thể đọc 4 trước nhưng nhớ bài 1 & 3 là điều kiện để cookie không bị đánh cắp.

## Liên kết với các nhóm khác

- CSP (`3`) và Trusted Types (`1`) là hai lớp bảo vệ khi có lỗ hổng lọt qua tầng render.
- Env (`2`) là nền cho mọi cấu hình — dùng lại ở nhóm `6_dev-tools/1-vite`.
- Cookie (`4`) là "hợp đồng" để học cách BFF hoạt động khi bàn sang micro-frontend (`5_micro-frontend`) và error handling (`8_best-practices/3-error-boundary`).
- XSS (`1`) liên hệ `8_best-practices/2-accessibility` (đều là "đúng chuẩn web") và `7_build-with-ai` (prompt phải cấm `dangerouslySetInnerHTML` bừa).

## Sai lầm thường gặp (tổng hợp)

- **Dùng `dangerouslySetInnerHTML` với HTML từ nguồn ngoài mà không sanitize** → XSS; luôn `DOMPurify.sanitize` với allowlist (bài 1).
- **Nhúng secret vào `VITE_*`** → bundle client ai cũng đọc; secret phải ở server/BFF (bài 2).
- **CSP rollout bằng cách bật chặn ngay** → app vỡ vì tài nguyên bị chặn; chạy `report-only` trước (bài 3).
- **Lưu JWT trong `localStorage`** → XSS là mất token; dùng cookie `HttpOnly; Secure; SameSite` (bài 4).
- **Bỏ qua CSRF vì "đã có SameSite"** → vẫn cần kiểm tra `Origin`/double-submit cho luồng nhạy cảm (bài 4).
- **Coi guard client là bảo mật** → mọi kiểm tra quyền thật phải ở server.

## Câu hỏi thường gặp

- **React có tự chống XSS không?** Có ở mức JSX (`{value}` được escape), nhưng không bảo vệ `dangerouslySetInnerHTML`, URL prop, hay HTML từ thư viện.
- **`VITE_` khác `NODE_ENV` thế nào?** `VITE_*` là biến được expose (đóng băng lúc build); `NODE_ENV` là chế độ build/dev — phân môi trường dùng `mode`.
- **SPA có cần header không?** Có — CSP/HSTS/nosniff set ở Nginx/CDN/host, không nhúng trong code React.
- **HttpOnly cookie có chống được CSRF?** Không tự động — cần thêm `SameSite` + kiểm tra `Origin`.
- **Bao nhiêu là đủ?** Defense-in-depth: mỗi lớp có thể thủng, các lớp còn lại vẫn giữ.

## Tham khảo
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN — Web security](https://developer.mozilla.org/en-US/docs/Web/Security)
