# DAY 14: ROUTER

## Mục tiêu bài học
- Cài và dùng **React Router v7** (package `react-router`) — data router `createBrowserRouter` + `RouterProvider` thay cho `RouterModule` + `router-outlet` của Angular.
- Hiểu 3 khái niệm trọng tâm: `<Outlet>` layout, `loader` (chạy trước khi render route — tương đương resolver), `errorElement` cho lỗi loader (tương đương ErrorHandler của route).
- Biết viết guard (canActivate) kiểu React: throw trong `loader` giá trị response có status 401 → `errorElement` hiển thị.

## Khái niệm cốt lõi (Core)
- **Package 2026: `react-router`** — framework mode (SSR/loader/actions) + library mode (SPA). Dùng `createBrowserRouter` cho SPA Vite: khai báo route một chỗ, typed, dùng chung `loader`/`action`.
- **`createBrowserRouter(routes)`:** cấu hình route dạng object (không phải `<Routes>` trong JSX như v3/v6 cũ — vẫn dùng được nhưng data router là chuẩn v7). `RouterProvider` mount toàn bộ.
- **`<Outlet />`:** nơi route con được render — tương đương `<router-outlet>` của Angular. Layout component đặt ở route cha, `children` khai trong object.
- **`<Link to>`:** client-side navigation `a` được chặn + History API — không reload trang (khác `href` thuần).
- **`loader`:** chạy **trước** khi render route — lấy data/validation; kết quả đọc qua `useLoaderData()`. Đây là "resolver" của Angular: data sẵn sàng trước khi component hiện → ít skeleton.
- **`errorElement`:** hiển thị khi loader throw (401/404/network) — không phải tạo ErrorBoundary thủ công cho từng route.
- **`lazy` route:** `lazy: () => import("./UserPage")` — code splitting tự động (DAY 13) ngay trong route.
- **Keyword chính:** `createBrowserRouter`, `RouterProvider`, `Outlet`, `Link`, `useParams`, `useLoaderData`, `loader`, `action`, `errorElement`, `lazy` route.

## Luồng hoạt động (Flow)
1. `createBrowserRouter(config)` được gọi ở module level — routes: cha `Layout`, con index "Home" và `users/:id`.
2. `App` render `<RouterProvider router={router}/>` — RouterProvider quản lý toàn bộ; URL thay đổi → chọn route khớp.
3. Vào `/users/1`: route `users/:id` khớp; nếu có `loader`, **loader chạy trước** (fetch user 1); nếu có `lazy`, chunk `UserPage` được tải.
4. Khi sẵn sàng, React render `Layout` → `<Outlet />` render `UserPage` (đã có params `id=1`), đọc `useLoaderData()` để hiển thị.
5. Click `<Link to="/users/2">` → React Router **không reload trang**: chỉ chạy loader mới + re-render vùng Outlet; trạng thái (theme, scroll) giữ nguyên.
6. Vào `/admin` không token: `loader` throw `Response("Unauthorized", {status:401})` → không render `AdminPage`; `errorElement` hiển thị "Không có quyền." thay thế.
7. Query param đổi (`/users?page=2`) → `useSearchParams()` trả giá trị mới → component re-render; loader (nếu có) chạy lại theo URL.
8. Điều hướng lập trình: `useNavigate()("/dashboard")` — dùng trong event handler (sau login) thay vì render `<Link>`.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 14: router tối giản (cần `npm i react-router`)
import {
  createBrowserRouter,
  Link,
  Outlet,
  RouterProvider,
  useParams,
} from "react-router";

// Layout dùng chung: nav + chỗ render route con
function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/users/1">User 1</Link>
      </nav>
      <Outlet />
    </div>
  );
}

// Route con đọc params động
function UserPage() {
  const { id } = useParams();
  return <p>Trang user #{id}</p>;
}

// Data router: khai báo bằng object — chuẩn React Router v7
const router = createBrowserRouter([
  {
    element: <Layout />,       // layout cha
    children: [
      { index: true, element: <h1>Home</h1> },   // index = route mặc định rỗng "/"
      { path: "users/:id", element: <UserPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

```tsx
// Loader lấy data trước render + guard chặn (admin)
{
  path: "admin",
  loader: () => {
    if (!localStorage.getItem("token")) throw new Response("Unauthorized", { status: 401 });
    return null;
  },
  errorElement: <p>Không có quyền.</p>,
  element: <AdminPage />,
}
```

## Giải thích từng phần
- `createBrowserRouter([...])`: cấu hình tập trung; lợi ích so với `<Routes>`: loader/action/lazy được khai đúng chỗ route, có sẵn type helpers.
- `{ index: true, element: <h1>Home</h1> }`: route **index** = khi URL đúng path cha (`/`) không có segment con — "trang mặc định" của Layout.
- `path: "users/:id"`: dynamic segment; `:id` bắt giá trị → `useParams().id`. Nested path tương đối so với cha.
- `element: <Layout />` + `children`: đúng mô hình Angular `router-outlet` — Layout hiển thị khung, con thay đổi trong `<Outlet/>`.
- `Link` vs `a`: Link chặn navigation thường, đẩy qua react-router (History API) — không reload, SPA mượt.
- `loader` throw `Response`: dữ liệu route phải "thẳng" — nếu lỗi, throw để `errorElement` xử lý; đây chính là guard: không render route.
- `useLoaderData()`: phải gọi trong component đúng route có loader; kiểu cast thủ công nếu không khai generic.
- **`NavLink`:** biến thể của `Link` tự thêm `isActive`/`isPending` cho style trạng thái — dùng cho menu.
- **`action`:** xử lý submit form (POST/PUT) ở route — tách form handling khỏi component UI.

## Bảng so sánh Angular ↔ React
| Angular | React Router v7 | Ghi chú |
|---|---|---|
| `Routes` + `<router-outlet>` | `createBrowserRouter` + `<Outlet/>` | Outlet rõ ràng hơn, config object |
| `routerLink="/users/1"` | `<Link to="/users/1">` | Navigation client-side |
| `ActivatedRoute.params` | `useParams()` / `useLocation()` | Hook tương ứng |
| Resolver (data trước render) | `loader` + `useLoaderData` | Lấy trực tiếp trong route config |
| Guard `canActivate` | loader throw / `<Navigate>` / layout condition | Throw + errorElement là guard đơn giản nhất |
| `RouterModule.forRoot` | `createBrowserRouter` + `RouterProvider` | Cùng khai báo tập trung |
| Lazy route `loadChildren` | `lazy: () => import(...)` | Cả hai code splitting |
| `Router.events` subscribe | `useNavigation` (state) / `useLocation` | React dùng hook thay stream |
| Query params `queryParamMap` | `useSearchParams()` | Tương đương dễ dùng hơn |
| `canDeactivate` (chặn rời) | `useBlocker` / confirm trong form | Tính năng mới hơn, dùng cẩn thận |

## Lỗi thường gặp (Common pitfalls)
- **Quên `RouterProvider`** → React không biết router; `useParams` outside → null. → Fix: `<App>` render `<RouterProvider router={router}/>`.
- **`Link` dùng absolute path sai** (`to="/users"` trong route con đã prefix) → 404. → Fix: so sánh với cấu trúc path; dùng `..`/relative khi cần.
- **Loader throw nhưng thiếu `errorElement`** → lỗi trồi ra ngoài, trang trắng. → Fix: mỗi route có dữ liệu chính thêm `errorElement`; root có ErrorBoundary toàn cục.
- **`useLoaderData` dùng sai component** (KHÔNG phải component route) → undefined. → Fix: chỉ đọc trong component của route có loader.
- **Không xử lý params là string** — `:id` luôn string; `Number(id)` có thể NaN. → Fix: validate + fallback.
- **Guard theo `localStorage` trong loader** — chạy client-side chỉ; SPA không phải bảo mật thật. → Fix: auth token bảo vệ phía server/API; loader guard chỉ cho UX.
- **Loader phụ thuộc context/state component** → loader chạy ngoài cây React. → Fix: đọc từ `params`/`request`/module singleton.
- **`throw` giá trị không phải `Response`** → `errorElement` khó xử lý. → Fix: `throw new Response(msg, { status })` chuẩn.

## Best practices / Mẹo
- **Chuẩn v7:** dùng data router (loader/action/errorElement) thay `<Routes>` JSX cho app mới; kết hợp route `lazy` để code splitting tự nhiên (DAY 13).
- Nhóm layout: route cha `AuthLayout` / `AppLayout` khác nhau; guard đặt ở layout cha cho các con kế thừa.
- Mút data fetch vào `loader` khi khách tới route cần dữ liệu ngay; với dữ liệu cập nhật liên tục thì dùng TanStack Query trong component (loader làm bridge qua `queryClient.fetchQuery`).
- `useNavigation()` cho global loading indicator; `NavLink` cho active style (isActive/isPending).
- Với framework-mode, `loader` chạy server + client — viết loader là pure data layer để tái dùng.
- **Dùng `action` cho form mutation** để tự động revalidate loader sau submit — ít code hơn tự gọi `queryClient.invalidateQueries`.
- **Tách route theo feature/layout**; giữ `errorElement` ở layout cha để bắt lỗi của mọi route con.

## Bài tập nhỏ
1. Thêm route `users/:id` có `loader` gọi `fetch('.../users/${id}')`, `errorElement` hiển thị "Không tìm thấy user" khi throw 404 — dùng `useLoaderData` hiển thị tên.
2. Thêm `NavLink` cho Home/User và bọc `AdminPage` sau guard loader (localStorage token giả lập qua một button "login"). Kiểm tra trực tiếp URL `/admin` không token → errorElement.
3. Thêm `useSearchParams` cho bộ lọc `?q=` trên route users và refetch loader theo query.
4. Dùng `useNavigate` để chuyển trang sau khi "login" thành công và bảo vệ `/dashboard` bằng loader guard.

## Reference
- https://reactrouter.com/start/framework/routing
- https://reactrouter.com/start/library/routing
- https://react.dev/learn/start-a-new-react-project