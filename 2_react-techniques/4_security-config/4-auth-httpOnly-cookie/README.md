# Auth httpOnly Cookie (React + BFF)

> Nguồn: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

## Mục tiêu
- Hiểu vì sao token nên nằm trong cookie `HttpOnly` thay vì `localStorage`.
- Nắm flow login → access/refresh cookie → refresh rotation chống reuse.
- Biết phòng CSRF bằng `SameSite` + kiểm tra `Origin`/double-submit token.

## Tổng quan
- `localStorage`/`sessionStorage` đọc được bằng JS → dính XSS là mất token (xem bài `1-xss-escape`).
- Cookie `HttpOnly` **không** truy cập được bằng JS, trình duyệt tự gắn vào request cùng domain → an toàn hơn với XSS.
- Áp dụng kiến trúc **BFF** (Backend-for-Frontend): React chỉ gọi `/api/*` cùng origin; BFF giao tiếp với auth server và set cookie.
- React chỉ cần `credentials: 'include'` để cookie đi kèm; **không** giữ token trong state JS.

## Khái niệm cốt lõi
- **Thuộc tính cookie quan trọng**:
  - `HttpOnly`: JS không đọc được (chống XSS đánh cắp).
  - `Secure`: chỉ gửi qua HTTPS.
  - `SameSite=Lax/Strict`: hạn chế gửi cookie trong request cross-site (chống CSRF). `Strict` chặt hơn, `Lax` tiện cho điều hướng GET.
  - `Path`: giới hạn đường dẫn (refresh cookie nên `Path=/auth`).
  - `Max-Age`/`Expires`: thời hạn.
- **Access vs Refresh**: access ngắn hạn (~15 phút) dùng cho mọi API; refresh dài hạn (~30 ngày) chỉ dùng gọi endpoint refresh.
- **Refresh rotation**: mỗi lần refresh cấp cặp mới và **thu hồi** cặp cũ. Nếu refresh cũ bị dùng lại → nghi ngờ trộm → thu hồi cả "token family".
- **CSRF**: trình duyệt tự gửi cookie, kẻ tấn công có thể lợi dụng. Phòng bằng `SameSite`, kiểm tra header `Origin`/`Referer`, và/hoặc **double-submit token** (CSRF token đọc từ cookie không-httpOnly + gửi trong header).
- **CORS + credentials**: `credentials: 'include'` chỉ hợp lệ khi server trả `Access-Control-Allow-Credentials: true` và `Access-Control-Allow-Origin` là **origin cụ thể** (không `*`).
- **Không đọc/không parse token trong JS**: React chỉ biết `me` (user info) qua `/api/me`.

## Luồng hoạt động / Cách áp dụng
1. Người dùng POST `/api/login` (username/password) → BFF xác thực với auth server.
2. BFF set 2 cookie `HttpOnly; Secure`: `access` (ngắn) + `refresh` (dài, `Path=/auth`).
3. React gọi API kèm `credentials: 'include'`; server đọc cookie access.
4. Khi access hết hạn (401), gọi `/auth/refresh`; server xoay cặp cookie mới.
5. Phát hiện reuse refresh cũ → thu hồi toàn bộ family + buộc login lại.
6. Logout: POST `/api/logout` → server xoá cookie; React xoá state `me`.

## Ví dụ chi tiết
```tsx
import { createContext, useContext, useEffect, useState } from 'react';

// Chỉ giữ thông tin user hiển thị — KHÔNG giữ token
type Me = { id: number; name: string; roles: string[] } | null;

const AuthCtx = createContext<{
  me: Me;
  loading: boolean;
  logout: () => Promise<void>;
}>({ me: null, loading: true, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  // Đầu phiên: hỏi server "tôi là ai" — cookie httpOnly tự đi kèm
  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false)); // luôn tắt loading dù thành công hay lỗi
  }, []);

  const logout = async () => {
    // Server xoá cookie httpOnly; client chỉ dọn state
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    setMe(null);
    window.location.assign('/login');
  };

  return <AuthCtx.Provider value={{ me, loading, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
```

```ts
// fetch wrapper: tự refresh khi 401 rồi thử lại 1 lần
let refreshing: Promise<void> | null = null;

export async function apiFetch(input: string, init: RequestInit = {}) {
  const doFetch = () => fetch(input, { ...init, credentials: 'include' });

  let res = await doFetch();
  if (res.status === 401) {
    // Gộp nhiều request cùng lúc vào một lần refresh (tránh dội refresh)
    refreshing ??= fetch('/auth/refresh', { method: 'POST', credentials: 'include' }).then(
      () => { refreshing = null; },
    );
    await refreshing;
    res = await doFetch(); // thử lại với cookie mới
  }
  return res;
}
```

```http
# Server set cookie khi login (BFF) — HttpOnly + Secure + SameSite
Set-Cookie: access=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
Set-Cookie: refresh=...; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=2592000
```

## Giải thích từng phần
- `credentials: 'include'`: bắt buộc để trình duyệt gửi cookie cross-origin (khi BFF khác subdomain).
- `Path=/auth` cho refresh: cookie chỉ gửi tới endpoint refresh, giảm bề mặt tấn công.
- `refreshing` dùng chung promise: nhiều request 401 cùng lúc chỉ refresh **một lần**, tránh race làm hỏng rotation.
- `.finally(() => setLoading(false))`: tránh màn hình loading treo khi `/api/me` lỗi.
- `me` không chứa token: kể cả XSS đọc được state cũng không lấy được credential.

## Lỗi thường gặp / Chống chỉ định
- **Lưu token trong `localStorage`**: XSS đọc trực tiếp → dùng cookie `HttpOnly`.
- **Quên `Secure`/`SameSite`**: cookie bị gửi qua kênh không an toàn / bị lợi dụng CSRF → luôn set đủ thuộc tính.
- **`Access-Control-Allow-Origin: *` cùng credentials**: trình duyệt từ chối cookie → dùng origin cụ thể.
- **Không xoay refresh**: refresh bị đánh cắp dùng lại vô thời hạn → bật rotation + reuse detection.
- **Refresh dồn dập do race condition**: nhiều tab cùng refresh, rotation vô hiệu lẫn nhau → gộp refresh, hoặc dùng BroadcastChannel đồng bộ giữa tab.

## Best practices / Mẹo
- Access token ngắn hạn, refresh dài hạn nhưng có rotation + thu hồi.
- Kiểm tra `Origin`/`Referer` cho mọi mutation (POST/PUT/DELETE) ở server.
- Dùng `SameSite=Strict` cho refresh, `Lax` cho access nếu cần điều hướng.
- Logout phải xoá cookie **và** thu hồi refresh ở server.
- Với SSR (Next.js), đọc cookie qua header request ở server thay vì JS client.

## Bài tập nhỏ
Viết hook `useRequireAuth()` dùng `useAuth()`: nếu chưa đăng nhập thì `redirect('/login?next=...')`, nếu đang `loading` thì hiện skeleton. Thêm test với MSW giả lập `/api/me` trả 401 để kiểm tra redirect.

## Reference
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN — Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [MDN — Credentialed requests & CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
