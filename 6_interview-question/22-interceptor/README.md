# Q22: Muốn mọi request tự động gắn token, xử lý 401 một chỗ tập trung — làm sao?

## Câu hỏi

> Mình muốn mọi request HTTP trong app tự động gắn `Authorization: Bearer <token>`, gặp 401 thì tự refresh token (hoặc đăng xuất), log request/response ở 1 chỗ — kiểu `HttpInterceptor` trong Angular vậy. React thì làm thế nào, pattern chuẩn là gì?

## Trả lời ngắn (elevator pitch, 30 giây)

- **React KHÔNG có interceptor built-in** (không có DI container toàn app, Q1) — nhưng ý định hoàn toàn làm được qua **pattern "wrapper/instance"**:
  1. **Fetch wrapper** (tối giản, 0 lib): 1 hàm `api()` bọc `fetch` — thêm header, check `r.ok`, normalize error. Mọi code chỉ gọi `api()`, không gọi `fetch` trần.
  2. **Axios instance + `interceptors.request/response`** (gần Angular nhất): axios có đúng từ ngữ "interceptor" — request chain (gắn token) + response chain (401 → refresh, unwrap error).
- **Nguyên tắc chọn tầng**: interceptor chỉ làm **infrastructure** (auth token, log, timeout, refresh); **retry theo nghiệp vụ + cache để TanStack Query** (Q20) — đừng retry ở cả 2 chỗ (bẫy §2).
- **401 + refresh**: dùng **single-flight** (1 promise refresh dùng chung, các request 401 xếp hàng) — không để N request 401 gọi N lần refresh.

## Trả lời chi tiết

### 1. Vì sao React "không có" interceptor (nói đúng gốc rễ = ăn điểm)

| | Angular | React |
|---|---|---|
| HTTP client | **1** (`HttpClient` của framework, DI sẵn) | **N** (`fetch` trần, axios, ky... — bạn chọn) |
| Điểm chặn request | framework nắm giữ client → register `HttpInterceptor` (DI) | không ai nắm giữ → **tự gói** (wrapper / instance) |
| Cơ chế | chain `HttpHandler` (Observable) | hàm bọc (fetch) / middleware chain (axios) |

React là **library không IoC** (Q1) — không có "nơi" để framework cho bạn đăng ký interceptor. Thay vào đó: **đóng gói client thành 1 module, mọi code import module đó**. Hiệu quả bằng nhau, chỉ khác "ai giữ".

### 2. Pattern A: fetch wrapper (0 dependency)

```ts
// api/http.ts — 1 file, mọi code chỉ import cái này
const TOKEN_KEY = "access_token";

export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (res.status === 401) {
    // (xem §4) single-flight refresh rồi retry request này 1 lần
  }
  if (!res.ok) throw new ApiError(res.status, await res.text().catch(() => "")); // normalize
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, public body: string) { super(`HTTP ${status}`); }
}
```

Với TanStack Query (Q20): `queryFn: () => api<User[]>("/api/users")` — wrapper lo header/error, Query lo cache/retry/dedupe.

### 3. Pattern B: axios instance (gần Angular nhất)

```ts
import axios from "axios";

export const http = axios.create({ baseURL: "/api", timeout: 15_000 });

// "Request interceptor" — tương đương chain request Angular (gắn token/log):
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("access_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// "Response interceptor" — tương đương chain response (401 → refresh, unwrap):
http.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retried) {
      err.config._retried = true;
      await refreshOnce();              // single-flight (§4)
      return http(err.config);          // retry request gốc
    }
    return Promise.reject(err);         // Query/UI xử lý (onError)
  },
);
```

> **Quy tắc chọn 1 client cho cả app** (fetch wrapper **hoặc** axios) — không "nửa app fetch, nửa app axios" (2 bộ hành vi error/header khác nhau).

### 4. 401 + refresh token: **single-flight** (điểm ăn điểm sâu nhất)

Vấn đề: user có 3 request cùng lúc, access token hết hạn → **3 request cùng 401** → nếu mỗi cái tự refresh = **3 lần refresh** (token đổi → request thứ 2/3 refresh lại = race + refresh token có thể bị dùng 2 lần).

Fix: **1 promise dùng chung** — request 401 đầu tiên tạo refresh, các request 401 sau **chờ cùng promise đó**:

```ts
let refreshing: Promise<string> | null = null;

function refreshOnce() {
  if (!refreshing) {
    refreshing = api("/auth/refresh")   // gọi refresh (không qua interceptor 401!)
      .then(({ access_token }) => {
        localStorage.setItem("access_token", access_token);
        return access_token;
      })
      .finally(() => { refreshing = null; });   // reset để lần sau refresh lại được
  }
  return refreshing;
}
// (thêm: refresh THẤT BẠI → logout + redirect /login, hủy mọi request đang chờ)
```

### 5. Ngắn về retry: ai làm gì (tránh trùng)

| Việc | Ai làm | Vì sao |
|---|---|---|
| Retry lỗi **mạng** (ECONNABORTED...) | **Query** (`retry: 2`, `retryDelay`) | Cache biết "đang có data cũ chưa" → retry thông minh hơn interceptor |
| Retry request gốc sau **refresh 401** | **Interceptor** | Thuộc hạ tầng auth, không phải nghiệp vụ |
| Retry **nghiệp vụ** (API rate-limit, idempotency) | **Query / mutation** (`onError` + button) | Người dùng phải thấy, không silent |

**Chọn 1 tầng cho mỗi loại retry** — trùng = retry nhân bội (2 tầng × 3 lần = 6+ request, 401-refresh-401-loop).

## Bẫy khi phỏng vấn

1. **"React cũng có `interceptors` built-in như Angular"** → **sai** (Q1: library, không DI). React chỉ có **hàm/instance bạn tự viết**; axios tự có (đó là lib, không phải framework).
2. **Retry đặt ở CẢ axios lẫn TanStack Query** → nhân bội + mất quyền "giữ data cũ khi retry" của Query. Quy tắc: **mạng → Query; auth → interceptor; nghiệp vụ → UI**.
3. **Mỗi request 401 tự gọi refresh riêng** → N refresh cùng lúc (race + dùng refresh token 2 lần bị server từ chối). Fix: **single-flight promise** (§4).
4. **Token + refresh logic nằm trong component (useState token, useEffect đọc)** → mỗi component tự lo token = mất "tập trung hóa" (đúng điểm của câu hỏi). Logic token phải **1 module** (wrapper/instance), component chỉ dùng `api()`/`http`.
5. **Dùng interceptor để toast lỗi nghiệp vụ** (validation 400 từ form) → interceptor là **hạ tầng** (auth/log/timeout); lỗi nghiệp vụ để `onError` của mutation (Query) hoặc form (RHF, Q18) — nếu toast mọi lỗi ở interceptor, 2 nơi cùng toast.
6. **Axios "phải dùng mới có interceptor"** → không: fetch cũng làm được (§2), axios chỉ là chọn có sẵn chain + instance + cancel.

## Gợi ý câu chốt

> "React không có interceptor built-in (library, không DI — Q1) — thay bằng **1 module HTTP**: fetch wrapper (0 lib) hoặc axios instance + `interceptors.request/response` (gần Angular nhất). Interceptor chỉ làm **hạ tầng**: gắn token, log, timeout, **401 → refresh single-flight** (1 promise dùng chung, các request 401 xếp hàng). **Retry mạng + cache để TanStack Query** (Q20) — chọn 1 tầng cho mỗi loại, không trùng. Quyết định: app có cần chain request/response trung gian (retry, log, refresh) → axios; không → fetch wrapper đủ."

## Reference

- [`3_react-tutorial/12-data-fetching`](../../3_react-tutorial/12-data-fetching) — "Không có interceptor built-in... tự viết wrapper (ky/axios instance)" + bảng Angular↔React (interceptor ↔ wrapper fetch)
- [`5_react-crud-jsonplaceholder`](../../5_react-crud-jsonplaceholder) — pattern `api/posts.ts` (wrapper fetch + checkOk) — ví dụ "tự viết tầng giữa"
- [`2_react-techniques/8_best-practices/3_error-boundary`](../../2_react-techniques/8_best-practices/3_error-boundary) — xử lý lỗi HTTP (4xx không retry vô ích)
- Q20 (fetch data 3 tầng) — interceptor/wrapper nằm ở tầng "client" trong bức tranh
- Q1 (library vs framework) — vì sao React không có chỗ "đăng ký" interceptor toàn cục

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q20 — fetch viết đúng 4 điểm (abort, lỗi, ...)?](../20-data-fetching/README.md) · [Q24 — token hết hạn trên route admin (guard)?](../24-router-guard/README.md)
- **Đào sâu (xuyên nhóm)**: [Q35 — "validate ở biên" (Zod) — nền cho việc parse data không tin cậy ở 1 chỗ?](../35-type-safety/README.md) · [Q36 — HTTP client module đặt ở layer nào?](../36-architecture-code-org/README.md)
