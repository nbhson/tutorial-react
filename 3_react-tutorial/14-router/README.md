# DAY 14: ROUTER

## Mục tiêu bài học
- Cài và dùng **React Router v7** (package `react-router`) — data router `createBrowserRouter` + `RouterProvider` thay cho `RouterModule` + `router-outlet` của Angular.
- Hiểu 3 khái niệm trọng tâm: `<Outlet>` layout, `loader` (chạy trước khi render route — tương đương resolver), `errorElement` cho lỗi loader (tương đương ErrorHandler của route).
- Biết viết guard (canActivate) kiểu React: throw trong `loader` giá trị response có status 401 → `errorElement` hiển thị.

## Khái niệm cốt lõi (Core)

### 1. Package 2026: `react-router` + data router chuẩn
Framework mode (SSR/loader/actions) + library mode (SPA Vite). `createBrowserRouter(routes)` khai báo object tập trung (typed, loader/action/lazy/errorElement đúng chỗ route), `RouterProvider` mount. `<Routes>` JSX (v3/v6 cũ) vẫn chạy nhưng thiếu loader/action — app mới dùng data router.

```tsx
// Chuẩn v7 (example.tsx): object, không JSX lồng
const router = createBrowserRouter([
  { element: <Layout />, errorElement: <p>Lỗi chung</p>, children: [
    { index: true, element: <Home /> },
    { path: "users/:id", element: <UserPage />, loader: fetchUser, errorElement: <p>404</p> },
  ]},
]);
export default function App() { return <RouterProvider router={router} />; }
```

Vì sao object thắng JSX? Vì loader/action/lazy là data gắn với route, không phải UI — khai ở object thì type-check + colocate (nhìn route thấy data + lỗi + chunk). `<Route element loader>` JSX tách data khỏi config, khó thấy toàn cục.

### 2. `<Outlet />` — lỗ render con trong layout cha
Tương đương `<router-outlet>`. Layout (nav + khung) ở route cha, `children` khai trong object, con vẽ vào `<Outlet/>`. Guard nhóm đặt ở layout cha là con kế thừa (bọc layout cần auth).

```tsx
// Layout trong example.tsx: nav Link + Outlet
function Layout() {
  return <div><nav><Link to="/">Home</Link> | <Link to="/users/1">User 1</Link></nav><Outlet /></div>;
}
// Vào /users/1: Layout vẽ (nav giữ nguyên) + Outlet vẽ UserPage — không reload, giữ theme/scroll
```

### 3. `<Link to>` — navigation không reload
`Link` render `<a>` nhưng chặn click mặc định, đẩy qua History API. Khác `<a href>` reload toàn trang (mất state, tải lại bundle). `NavLink` thêm `isActive`/`isPending` cho style menu. Điều hướng lập trình (sau login) dùng `useNavigate()("/dashboard")` trong event, không render `<Link>`.

### 4. `loader` — resolver chạy TRƯỚC render
Lấy data/validate trước khi component hiện; kết quả đọc qua `useLoaderData()`. Data sẵn → ít skeleton, ít "vẽ rồi mới fetch". Loader chạy ngoài cây React nên chỉ đọc `params`/`request`/singleton, không đọc context/state component.

```tsx
// users/:id loader trong example.tsx: fetch trước, 404 thì throw (không render UserPage)
loader: async ({ params }) => {
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${params.id}`);
  if (!res.ok) throw new Response("Không tìm thấy user", { status: 404 });
  return res.json(); // UserPage: const user = useLoaderData() as User;
},
errorElement: <p>Không tìm thấy user (loader throw 404).</p>,
```

Với data cập nhật liên tục (realtime), loader làm bridge (`queryClient.fetchQuery` trong loader) rồi component dùng `useQuery` (TanStack DAY 12) — loader cho lần đầu nhanh, query cho cập nhật.

### 5. `errorElement` — boundary lỗi theo route
Hiện khi loader/action throw (401/404/mạng). Mỗi route data nên có `errorElement` riêng (thông điệp đúng ngữ cảnh); root có boundary chung cho lỗi không ngờ. Không có là lỗi trồi lên, trang trắng.

### 6. Guard = loader throw + errorElement
Không cần guard class như Angular. Loader check token/quyền, thiếu thì `throw new Response("Unauthorized", { status: 401 })` → không render trang → `errorElement` "Không có quyền". Đây là canActivate đơn giản nhất cho UX. Bảo mật thật vẫn ở API server (loader guard client chỉ giấu UI, không chặn API).

```tsx
// admin guard trong example.tsx:
loader: () => {
  if (!localStorage.getItem("token")) throw new Response("Unauthorized", { status: 401 });
  return null; // có token mới cho render AdminPage
},
errorElement: <p>Không có quyền — bấm "Login giả" để có token rồi vào lại.</p>,
```

### 7. `lazy` route + query params
`lazy: () => import("./pages/UserPage")` — code splitting trong route (DAY 13), Router tự tải chunk + Suspense khi vào. Query `?q=` đọc qua `useSearchParams()`; đổi query mà loader đọc `request.url` thì loader chạy lại.

### Keyword chính
`createBrowserRouter` (object config), `RouterProvider` (mount), `Outlet` (lỗ con), `Link`/`NavLink` (không reload + active), `useParams` (string, validate), `useSearchParams` (query), `useNavigate` (điều hướng lập trình), `useLoaderData` (đọc loader), `loader` (trước render), `action` (form mutation + revalidate), `errorElement` (boundary route), `lazy` route (chunk).

## Luồng hoạt động (Flow)
1. `createBrowserRouter(config)` ở module: cha `Layout` (+ `errorElement` chung), con index Home + `users/:id` (loader + 404) + `admin` (guard 401). Chưa render gì — chỉ đăng ký.
2. `App` render `<RouterProvider router={router}/>` — Router quản URL, history, match, loader, error. Quên Provider là mọi hook router null.
3. Mở `/`: match index → render `Layout` → `<Outlet/>` vẽ `Home`. Nav `Link` hiện, chưa fetch gì.
4. Click `User 1` (`<Link to="/users/1">`): Router chặn reload, đổi URL qua History API, match `users/:id` (`id = "1"` string). Loader chạy **trước**: fetch user 1. Nếu có `lazy`, tải chunk song song.
5. Loader OK → render `Layout` (nav giữ nguyên, theme/scroll giữ) + `Outlet` vẽ `UserPage` (`useParams().id = "1"`, `useLoaderData()` có user). Không skeleton vì data sẵn.
6. Click `/users/2?q=son`: params + query mới → `UserPage` re-render (`q = "son"`), loader chạy lại (vì URL đổi) → data user 2. `useSearchParams` cho query mà không cần parse tay.
7. Vào `/admin` không token: loader throw `Response 401` → **không render** `AdminPage` → `errorElement` "Không có quyền" thay thế tại vị trí Outlet. Đây là guard.
8. Bấm "Login giả" (`localStorage.setItem("token", "1")`) rồi vào lại `/admin`: loader qua → `AdminPage` vẽ. Auth thật vẫn ở server; loader chỉ UX.
9. Loader throw mà route không có `errorElement` → trồi lên `errorElement` cha (root chung) — không trắng trang nếu root có boundary.
10. `useNavigate()("/dashboard")` trong handler sau login — điều hướng lập trình, không render `<Link>`. `useNavigation()` cho spinner toàn cục khi chuyển (pending state).

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` (Layout/Outlet/Link/params/query/loader-guard):

```tsx
// example.tsx — DAY 14: router data (Layout/Outlet/Link/params/loader-guard/lazy ý tưởng)
// Mục đích: điều hướng client-side không reload + data trước render + guard bằng throw.
import {
  createBrowserRouter, // (1) Data router chuẩn v7: object config gồm loader/action/lazy/errorElement
  Link, // (2) Navigation client-side (History API, không reload) — khác <a href> reload
  Outlet, // (3) Lỗ render route con trong layout cha — tương đương <router-outlet>
  RouterProvider, // (4) Mount router — quên là useParams/useLoaderData null
  useParams, // (5) Đọc :id động (luôn string) — validate trước khi Number()
  useLoaderData, // (6) Đọc kết quả loader chạy TRƯỚC render — data sẵn, ít skeleton
  useSearchParams, // (7) Query ?q= — đổi là re-render + loader chạy lại (nếu loader đọc request)
} from "react-router";

// (8) Layout dùng chung: nav Link + lỗ Outlet cho con. Guard nhóm đặt ở layout cha để con kế thừa.
function Layout() {
  return (
    <div>
      <nav>
        {/* Link chặn navigation thường, đẩy qua router — giữ theme/scroll, không reload */}
        <Link to="/">Home</Link> | <Link to="/users/1">User 1</Link> | <Link to="/users/2?q=son">User 2 + query</Link> | <Link to="/admin">Admin (guard)</Link>
      </nav>
      <Outlet /> {/* (9) Route con (index/users/admin) vẽ vào đây */}
    </div>
  );
}

function Home() {
  return <h1>Home</h1>; // (10) Index route: path cha rỗng "/" — trang mặc định của Layout
}

// (11) Route con đọc params động + query + data loader (demo gộp để thấy 3 nguồn).
function UserPage() {
  const { id } = useParams(); // :id luôn string — "1", không phải 1
  const [search] = useSearchParams(); // ?q=son — useSearchParams trả [params, setParams]
  const q = search.get("q") ?? ""; // null khi không có -> fallback ""
  // useLoaderData() đọc ở route có loader thật (xem router dưới); ở đây minh họa params/query trước
  const numId = Number(id); // NaN nếu id lạ — phải validate + fallback (xem README)
  if (!id || Number.isNaN(numId)) return <p>User id không hợp lệ.</p>;
  return <p>Trang user #{numId}{q ? ` — tìm "${q}"` : ""}</p>;
}

function AdminPage() {
  return <p>Admin — chỉ thấy khi có token (loader guard cho qua).</p>;
}

// (12) Data router object — chuẩn v7 (thay <Routes> JSX cũ). loader/action/lazy khai đúng chỗ route.
const router = createBrowserRouter([
  {
    element: <Layout />, // layout cha bọc mọi con
    errorElement: <p>Lỗi chung — loader con nào throw mà không có errorElement riêng thì rơi về đây.</p>, // boundary toàn cục
    children: [
      { index: true, element: <Home /> }, // (13) index = URL đúng path cha "/"
      {
        path: "users/:id", // (14) Dynamic segment tương đối so với cha — ":id" bắt giá trị
        element: <UserPage />,
        // Loader thật: chạy TRƯỚC render — fetch user, throw 404 thì errorElement hiện (xem README mẫu)
        loader: async ({ params }) => {
          const res = await fetch(`https://jsonplaceholder.typicode.com/users/${params.id}`);
          if (!res.ok) throw new Response("Không tìm thấy user", { status: 404 });
          return res.json(); // useLoaderData() đọc kết quả này trong UserPage
        },
        errorElement: <p>Không tìm thấy user (loader throw 404).</p>,
        // lazy route (DAY 13): lazy: () => import("./pages/UserPage") — chunk riêng khi vào route
      },
      {
        path: "admin",
        // (15) Guard kiểu React: loader throw Response 401 -> KHÔNG render AdminPage -> errorElement hiện
        // Đây là canActivate đơn giản nhất (không cần guard class). Auth thật vẫn check ở API server.
        loader: () => {
          if (!localStorage.getItem("token")) throw new Response("Unauthorized", { status: 401 });
          return null;
        },
        errorElement: <p>Không có quyền — bấm "Login giả" để có token rồi vào lại.</p>,
        element: <AdminPage />,
      },
    ],
  },
]);

export default function App() {
  // (16) Mount router — toàn bộ URL/state điều hướng do RouterProvider quản lý
  return <RouterProvider router={router} />;
}
```

`action` cho form mutation + tự revalidate loader (không cần `invalidateQueries` tay):

```tsx
// Route có form: action xử lý POST, xong Router tự chạy lại loader route đó
{
  path: "users/:id/edit",
  action: async ({ request, params }) => {
    const form = await request.formData(); // đọc form POST
    const res = await fetch(`/api/users/${params.id}`, { method: "PUT", body: JSON.stringify(Object.fromEntries(form)) });
    if (!res.ok) throw new Response("Lưu thất bại", { status: 400 });
    return res.json(); // xong -> loader users/:id chạy lại, UI mới — ít code hơn
  },
  errorElement: <p>Lưu thất bại.</p>,
  element: <EditPage />,
}
```

## Giải thích từng phần
- Dòng `createBrowserRouter([...])`: tập trung — nhìn 1 object thấy layout + con + data + lỗi + chunk. Vì sao hơn `<Routes><Route>`? Vì loader/action/lazy là data, không phải UI — object colocate data với route, JSX tách rời.
- Dòng `{ index: true, element: <Home /> }`: index = "khi URL đúng path cha, không segment con". Vì sao cần? Vì `/` khớp cha `Layout` nhưng không khớp `users/:id` — không có index là Outlet trống. Index là "trang mặc định của layout".
- Dòng `path: "users/:id"`: tương đối so với cha (không `/` đầu). `:id` bắt segment → `useParams().id`. Lồng `admin/users/:id` thì path nối dần — nested path tương đối, không viết full từ root.
- Dòng `element: <Layout />` + `children`: mô hình outlet — cha khung, con thay trong `<Outlet/>`. Vào route nào thì nav/layout giữ, chỉ Outlet đổi → không reload, giữ state ngoài Outlet.
- Dòng `Link` vs `<a>`: `Link` chặn default, `history.pushState` + báo Router. Vì sao giữ được scroll/theme? Vì không reload document — React chỉ thay Outlet. `<a href>` là tải lại bundle, mất hết.
- Dòng `useParams()`: `:id` luôn string (`"1"`). `Number("abc")` là NaN — phải `Number.isNaN` + fallback "id không hợp lệ" như example. Không validate là fetch `/users/abc` → 404 khó hiểu.
- Dòng `useSearchParams()`: trả `[params, setParams]` (giống `useState`). `get("q")` null khi thiếu → `?? ""`. Đổi query mà loader đọc `request.url` thì loader chạy lại — filter `?q=` refetch đúng.
- Dòng `loader` throw `Response`: "thẳng" — lỗi thì throw để boundary xử, không trả `null` che lỗi. `throw new Response(msg, { status })` chuẩn để `errorElement` đọc `useRouteError()` phân biệt 401/404/500.
- Dòng `useLoaderData()`: chỉ trong component của route có loader. Dùng sai chỗ (layout cha không loader) là `undefined`. Type cast tay (`as User`) nếu không generic — Router v7 có helper type khi cần chặt.
- Dòng `NavLink` (không trong ví dụ nhưng cần): `className={({ isActive, isPending }) => ...}` cho menu active/đang tải. Vì sao `Link` thường không đủ? Vì menu cần biết đang ở trang nào để highlight — `NavLink` cho sẵn.
- Dòng `action`: POST/PUT của route — tách mutation khỏi UI. Xong Router tự revalidate loader (UI mới) — ít code hơn `useMutation` + `invalidateQueries` tay khi form gắn với route.

## Bảng so sánh Angular ↔ React
| Angular | React Router v7 | Ghi chú |
|---|---|---|
| `Routes` + `<router-outlet>` | `createBrowserRouter` (object) + `<Outlet/>` | Outlet rõ, config object colocate data |
| `routerLink="/users/1"` | `<Link to="/users/1">` | Cùng client-side, không reload |
| `ActivatedRoute.params` (Observable) | `useParams()` / `useLocation()` (hook) | Hook đọc trực tiếp, không subscribe |
| Resolver (data trước render) | `loader` + `useLoaderData()` | Khai trong route config, chạy trước vẽ |
| Guard `canActivate` (class) | loader throw `Response 401` + `errorElement` | Guard đơn giản nhất cho UX; auth thật ở server |
| `RouterModule.forRoot` | `createBrowserRouter` + `RouterProvider` | Cùng khai tập trung ở module/App |
| Lazy route `loadChildren` | `lazy: () => import(...)` trong route | Cùng code splitting khi vào route |
| `Router.events` stream | `useNavigation()` (pending state) / `useLocation()` | Hook thay stream để spinner theo dõi |
| Query `queryParamMap` | `useSearchParams()` | Tương đương, dễ hơn (get/set) |
| `canDeactivate` (chặn rời khi form bẩn) | `useBlocker` / confirm trong form | Mới hơn, dùng cẩn thận (chặn nhầm khó chịu) |
| `resolve` + `runGuardsAndResolvers` | `loader` + `shouldRevalidate` | Kiểm soát khi nào chạy lại loader |

## Lỗi thường gặp (Common pitfalls)

### 1. Quên `RouterProvider`
```tsx
// ❌ SAI: render Layout trực tiếp — useParams ngoài router -> null, Link reload thường
return <Layout />;
```
```tsx
// ✅ ĐÚNG: mount router, mọi hook/link trong cây mới sống
return <RouterProvider router={router} />;
```

### 2. `Link` absolute/relative sai → 404
```tsx
// ❌ SAI: trong /admin mà to="/users" (absolute) khi muốn users của admin
<Link to="/users">Users</Link> // ra /users gốc, không phải /admin/users
```
```tsx
// ✅ ĐÚNG: relative khi cần (to="users" trong /admin -> /admin/users) hoặc ../ lên
<Link to="users">Users</Link> // relative so với route hiện tại
```

### 3. Loader throw mà thiếu `errorElement` → trắng
```tsx
// ❌ SAI: loader 404 nhưng không boundary — lỗi trồi lên root/xuyên ra, trắng vùng Outlet
{ path: "users/:id", loader: fetchUser, element: <UserPage /> }
```
```tsx
// ✅ ĐÚNG: mỗi route data có errorElement riêng + root có chung (như example)
{ path: "users/:id", loader: fetchUser, errorElement: <p>Không tìm thấy user.</p>, element: <UserPage /> }
```

### 4. `useLoaderData` sai component → undefined
Mô tả: đọc ở layout cha trong khi loader ở con (hoặc ngược). Fix: chỉ đọc trong component của route khai loader. Muốn cha đọc thì loader phải ở cha.

### 5. Params luôn string, `Number(id)` NaN
```tsx
// ❌ SAI: tin id là number — fetch /users/abc, crash
const { id } = useParams(); fetch(`/api/users/${id}`);
```
```tsx
// ✅ ĐÚNG: validate + fallback (như UserPage trong ví dụ)
const numId = Number(id); if (!id || Number.isNaN(numId)) return <p>User id không hợp lệ.</p>;
```

### 6. Guard localStorage tưởng bảo mật thật
Mô tả: loader check token client rồi cho hiện nút "Xóa user" — user mở DevTools set token giả là thấy. Fix: loader guard chỉ UX (giấu UI); API server vẫn check token thật, không có là 401 dù UI hiện.

### 7. Loader đọc context/state component → sai
Mô tả: `loader: () => fetch(user.id)` với `user` từ context — loader chạy ngoài cây React, không có context. Fix: loader chỉ đọc `params`/`request`/singleton module (token store, queryClient). Data từ component thì để `useQuery` trong component (DAY 12).

## Best practices / Mẹo
- **Chuẩn v7:** data router (loader/action/errorElement/lazy) cho app mới thay `<Routes>` JSX. Vì sao? Vì data + lỗi + chunk colocate với route, type-check, ít skeleton.
- Layout nhóm (`AuthLayout`/`AppLayout`): guard ở cha, con kế thừa. Vì sao? Để 10 trang admin chỉ guard 1 chỗ, thêm trang không quên.
- Data cần ngay khi vào → `loader`; cập nhật liên tục → TanStack trong component (loader bridge `fetchQuery`). Vì sao 2 tầng? Vì loader cho lần đầu nhanh (không skeleton), query cho nền (realtime/poll).
- `useNavigation()` spinner toàn cục + `NavLink` active (`isActive`/`isPending`). Vì sao? Để chuyển trang có phản hồi (pending) và menu biết đang đâu.
- `action` cho form mutation theo route — tự revalidate loader sau submit. Vì sao? Ít hơn `useMutation` + `invalidate` tay khi form thuộc về route đó.
- **Tách route theo feature/layout**, `errorElement` ở cha bắt cho con. Vì sao? Để lỗi con không có boundary riêng vẫn rơi về cha, không trắng.

## Bài tập nhỏ
1. `users/:id` loader fetch + 404 `errorElement` + `useLoaderData` hiện tên. Thử id lạ (`/users/abc`) — validate params + fallback hiện gì?
2. `NavLink` Home/User + guard `admin` (token giả nút login). Vào thẳng `/admin` không token → errorElement. Bấm login → vào lại → qua. Vì sao loader guard chỉ UX?
3. `useSearchParams` `?q=` filter users + loader đọc query refetch theo. Đổi `q` mà không reload trang — loader chạy lại khi nào?
4. `useNavigate` sau "login" sang `/dashboard` + guard loader bảo vệ. So sánh với `<Link>` — khi nào lập trình, khi nào render link?
5. Thêm `action` cho form sửa user + tự revalidate — so sánh với `useMutation` + `invalidateQueries` (khi nào action gọn hơn?).

## Reference
- https://reactrouter.com/start/framework/routing
- https://reactrouter.com/start/library/routing
- https://react.dev/learn/start-a-new-react-project
