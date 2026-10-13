# Q24: Làm sao chặn user không có permission khi vào một route (ví dụ trang admin)?

## Câu hỏi

> Làm sao để chặn user chưa đăng nhập, hoặc thiếu role, khi vào trang admin? Bọc component (RequireAuth + Navigate) hay dùng loader (Data Router v7) thì hơn? guard trong useEffect có vấn đề gì? So với canActivate của Angular thì sao?

## Trả lời ngắn (elevator pitch, 30 giây)

- React **không có guard class như Angular** (`CanActivate`/DI) — thay bằng **2 tầng**:
  1. **Tầng component** (đơn giản, mọi app): `<RequireAuth>` / `<RequireRole>` bọc route, đọc token/roles từ store/Context, sai → `<Navigate to="/login" replace />` (redirect lần render đầu, không flash).
  2. **Tầng `loader` (Data Router v7)** — mạnh hơn: chạy **trước khi render** (giống `canActivate` của Angular + resolver), thiếu quyền → `throw redirect("/403")` — không có khung hình tạm, không fetch data của trang cấm.
- **Guard trong `useEffect` là SAI** (bẫy #1): page **đã render + đã fetch data** rồi mới đá → flash nội dung nhạy cảm + request thừa.
- **Nguyên tắc vàng**: guard client **chỉ là UX** (giấu UI) — **bảo mật thật ở API server** (token giả, localStorage ai cũng sửa được).

## Trả lời chi tiết

### 1. Tầng 1: component guard (`RequireAuth`/`RequireRole`) — đọc state client, redirect ngay

```tsx
import { Navigate } from "react-router-dom";

export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { roles: myRoles } = useAuth();              // từ Context/Zustand (root loader, 1 lần)
  const ok = roles.some((r) => myRoles.includes(r));  // cần 1 trong các role
  if (!ok) return <Navigate to="/403" replace />;     // ← redirect lần RENDER ĐẦU
  return <>{children}</>;
}
```

- **`replace` — vì sao bắt buộc** (điểm ăn điểm nhỏ nhưng lộ nền tảng): không `replace` → history có entry trang cấm → bấm **Back** là quay lại → guard đá lại → **kẹt vòng lặp** Back/đá. `replace` xóa entry cấm khỏi history.
- **Đúng thời điểm**: trong **body render** (không phải `useEffect`). Render là pure — quyết định "hiện con hay redirect" trước khi mount.
- **Chia tách**: `RequireAuth` (có đăng nhập?) ở **layout cha** (1 chỗ cho mọi route cần login); `RequireRole` (đủ role?) ở **route con**. Không lồng ngược (Role ngoài Auth = user chưa login bị báo 403 thay vì /login).

### 2. Tầng 2: guard ở `loader` (Data Router v7) — chặn từ "cổng", như `canActivate` + resolver

```tsx
// router.ts — Data Router (React Router v7 framework/library mode)
import { redirect } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    // root loader: fetch /api/me MỘT LẦN — cả app đọc lại (useRouteLoaderData('root'))
    loader: async () => {
      const r = await fetch("/api/me", { headers: authHeader() });
      if (r.status === 401) return redirect("/login");
      return r.json(); // { roles: [...] }
    },
    children: [
      {
        path: "admin",
        loader: async ({ request }) => {
          const me = useRouteLoaderData("root");      // đọc cache, không fetch lại
          if (!me?.roles?.includes("admin")) return redirect("/403");
          return null;
        },
        element: <AdminPage />,
        errorElement: <NotFound />,
      },
    ],
  },
]);
```

- **Vì sao tầng này "ăn điểm"**: loader chạy **trong router, trước khi React tạo element** → không flash 1 frame, không có component nào mount, **không fetch data của trang cấm**. Hoạt động cả với SSR (client guard thì SSR render trang cấm → flash server-side).
- **`useRouteLoaderData` — dedupe**: root fetch `/api/me` 1 lần, mọi route con đọc lại — không N request trùng + N chỗ xử lý 401.
- **Dùng CẢ HAI tầng (pattern chuẩn app có phân quyền)**: loader = quyết định cuối (cần data server, không flash); component = phản xạ **tức thì** theo state client (token hết hạn giữa chừng không cần chờ roundtrip).

### 3. Vì sao guard trong `useEffect` là SAI (bẫy kinh điển)

```tsx
// ❌ SAI: page ĐÃ render + ĐÃ fetch rồi mới đá
function Admin() {
  useEffect(() => { if (!isAdmin) navigate("/403"); }, []); // 1–2 frame nội dung + data nhạy cảm đã bay về
  return <BangQuanTri />;
}

// ✅ ĐÚNG: quyết định ở render (RequireRole) hoặc trước render (loader)
```

Thứ tự đúng: **loader (trước render) → render đầu (component) → tuyệt đối không effect (sau render)**.

### 4. Đối chiếu Angular (bảng ăn điểm)

| Angular | React (v7) | Ghi chú |
|---|---|---|
| `CanActivate` guard class (DI, `canActivate(route, state)`) | **Guard component** (`RequireRole`) + **`loader` throw `redirect`** | React không có DI guard; 2 tầng thay 1 class |
| `canActivate` chạy **trước** navigation (chặn resolve) | **`loader`** chạy trước render (router) | Gần nhất: **loader = canActivate + resolver gộp** (chặn + data một bước) |
| `canActivateChild` (mỗi level) | `RequireAuth` layout cha / `RequireRole` route con (bọc tree JSX) | Cùng ý cấp bậc |
| `CanDeactivate` (confirm "chưa lưu") | **Không có sẵn** — hook trong render + `beforeunload` (chỉ tab đóng) / custom `Link` onClick confirm | Điểm khác thật: Angular chặn được điều hướng router; React chỉ chặn UX qua component tự viết (state chưa lưu cần lưu store, không phải route) |
| `UrlTree` redirect object | `redirect('/403')` (Response) / `<Navigate>` | Loader throw Response (kèm status), component trả JSX |
| Guard + DI service | `useRouteLoaderData('root')` + Context/Zustand | Data guard đọc từ 1 nơi |

> **Nói đúng câu chốt**: "Angular guard là **class DI chạy trong router engine** (canActivate/canDeactivate). React không có engine guard — thay bằng **loader** (chặn + fetch trước render, mạnh nhất) và **component wrapper + `<Navigate replace>`** (chặn ở render, tức thì theo state client). `CanDeactivate` không có tương đương built-in — xử lý bằng store (chặn save-trạng-thái), không chặn điều hướng."

### 5. Bảo mật: guard client ≠ bảo mật (điểm không được thiếu)

- Token trong `localStorage`/Context → **ai cũng đọc/sửa được** (DevTools) — guard client chỉ **giấu UI** (UX + không phí request).
- **Quyền thật do server quyết**: mọi API endpoint check JWT/role phía backend (bài auth-httpOnly-cookie: ưu tiên **httpOnly cookie** để JS không đọc được token).
- Guard client thất bại = UX tệ (vẫn vào được UI cấm, data không về). Guard client đúng = UX tốt; **bảo mật = 2 tầng (UI + server), không phải 1**.

## Bẫy khi phỏng vấn

1. **Guard trong `useEffect`** → flash + fetch data nhạy cảm rồi mới đá (§3). "Nhớ được useEffect là sai" — đúng guard ở **render hoặc trước render**.
2. **"Nói guard client là đủ bảo mật"** → **sai** (bỏ qua tầng server; user sửa localStorage/ghép API bằng Postman là qua). Câu đúng: "guard là UX, quyền thật ở API (httpOnly + check server)".
3. **Quên `replace` trong `<Navigate>`** → vòng lặp Back (bấm Back quay lại trang cấm → đá lại → Back → đá…).
4. **Mỗi page tự fetch `/api/me`** → N request + N chỗ xử lý 401. Đúng: **root loader 1 lần** + `useRouteLoaderData` (dedupe).
5. **Chỉ guard component, không guard loader** → page cấm **vẫn fetch data trong loader** (data nhạy cảm bay về dù UI redirect). Fix: guard **cả 2 tầng**.
6. **Lộn xộn `RequireRole` ra ngoài `RequireAuth`** (user chưa login vào route admin → báo 403 thay vì /login) — thứ tự: Auth (layout cha) → Role (route con).

## Gợi ý câu chốt

> "React không có guard class như Angular — dùng **2 tầng**: (1) **component** `<RequireAuth/RequireRole>` đọc store + `<Navigate to replace/>` (quên `replace` là vòng lặp Back), (2) **`loader` của Data Router v7** — chạy **trước render**, `throw redirect('/403')`, chặn + fetch 1 lần (root `/api/me`), `useRouteLoaderData` dedupe — tầng này mới tương đương `canActivate`. Guard trong `useEffect` = sai (flash + fetch trước khi đá). Và guard client **chỉ là UX** — quyền thật quyết ở API server (httpOnly token + check endpoint)."

## Reference

- [`3_react-tutorial/14-router`](../../3_react-tutorial/14-router) — "Guard = loader throw + errorElement" (canActivate đơn giản nhất), bảng Angular↔React guard
- [`2_react-techniques/1_advanced-features/5-routing-animation-guard`](../../2_react-techniques/1_advanced-features/5-routing-animation-guard) — 2 tầng guard (loader + component), `replace`, `useRouteLoaderData`, bẫy `useEffect`, `RequireAuth`/`RequireRole`
- [`2_react-techniques/4_security-config/4-auth-httpOnly-cookie`](../../2_react-techniques/4_security-config/4-auth-httpOnly-cookie) — bảo mật thật: token server-side (httpOnly), guard client chỉ UX
- Q22 (interceptor HTTP) — nơi xử lý 401/refresh nằm (interceptor), guard chỉ đọc kết quả
- Q1 (library vs framework) — vì sao React không có "canActivate DI" (không IoC container)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q20 — data chưa về thì guard loader (Data Router) chờ ra sao?](../20-data-fetching/README.md)
- **Đào sâu (xuyên nhóm)**: [Q22 — 401 → refresh token rồi redirect (interceptor)?](../22-interceptor/README.md) · [Q36 — guard/loader nằm ở layer nào của kiến trúc?](../36-architecture-code-org/README.md)
