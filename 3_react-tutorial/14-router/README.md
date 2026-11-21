# DAY 14: ROUTER

## Mục tiêu bài học
- Cài và dùng **React Router v7** (package `react-router`) — data router `createBrowserRouter` + `RouterProvider` thay cho `RouterModule` + `router-outlet` của Angular.
- Hiểu 3 khái niệm trọng tâm: `<Outlet>` layout, `loader` (chạy trước khi render route — tương đương resolver), `errorElement` cho lỗi loader (tương đương ErrorHandler của route).
- Biết viết guard (canActivate) kiểu React: throw trong `loader` giá trị response có status 401 → `errorElement` hiển thị.

## Khái niệm cốt lõi (Core)

Mục này nói về bộ khung điều hướng của React 2026: khai route tập trung, vẽ con qua Outlet, chặn reload bằng Link, lấy data trước render bằng loader — đọc để biết "ai đứng đâu trong cây route" trước khi vào code.

### 1. Package 2026: `react-router` + data router chuẩn
Framework mode (SSR/loader/actions) + library mode (SPA Vite). `createBrowserRouter(routes)` khai báo object tập trung (typed, loader/action/lazy/errorElement đúng chỗ route), `RouterProvider` mount. `<Routes>` JSX (v3/v6 cũ) vẫn chạy nhưng thiếu loader/action — app mới dùng data router.

> 📄 **Code ví dụ:** [`examples/01-1-package-2026-react-router-data-router-chuan.tsx`](examples/01-1-package-2026-react-router-data-router-chuan.tsx)

Vì sao object thắng JSX? Vì loader/action/lazy là data gắn với route, không phải UI — khai ở object thì type-check + colocate (nhìn route thấy data + lỗi + chunk). `<Route element loader>` JSX tách data khỏi config, khó thấy toàn cục. Ví von: khai route kiểu object giống như bản đồ tòa nhà vẽ trên một tờ giấy duy nhất — đứng một chỗ thấy hết mọi tầng; kiểu JSX là mỗi tầng một mảnh giấy rời, đi hết lầu mới hiểu tòa nhà.

### 2. `<Outlet />` — lỗ render con trong layout cha
Tương đương `<router-outlet>`. Layout (nav + khung) ở route cha, `children` khai trong object, con vẽ vào `<Outlet/>`. Guard nhóm đặt ở layout cha là con kế thừa (bọc layout cần auth). Ví von: `Outlet` là khung tranh treo tường — nav và viền là của layout cha, bức tranh bên trong thay theo URL mà không phải đóng đinh lại khung.

> 📄 **Code ví dụ:** [`examples/02-2-outlet-lo-render-con-trong-layout-cha.tsx`](examples/02-2-outlet-lo-render-con-trong-layout-cha.tsx)

> **Tóm gọn 1 câu:** Layout cha là khung tranh, `<Outlet/>` là chỗ treo — con đổi theo URL, khung đứng yên.

### 3. `<Link to>` — navigation không reload
`Link` render `<a>` nhưng chặn click mặc định, đẩy qua History API. Khác `<a href>` reload toàn trang (mất state, tải lại bundle). `NavLink` thêm `isActive`/`isPending` cho style menu. Điều hướng lập trình (sau login) dùng `useNavigate()("/dashboard")` trong event, không render `<Link>`. Ví von: `<a href>` là đập đi xây lại cả ngôi nhà chỉ vì muốn đổi bức tranh trong phòng; `<Link>` là chỉ đổi bức tranh, nhà vẫn nguyên.

> **Tóm gọn 1 câu:** `<Link>` đổi trang mà không reload — state và scroll giữ nguyên; cần "nhảy" sau logic thì dùng `useNavigate`.

### 4. `loader` — resolver chạy TRƯỚC render
Lấy data/validate trước khi component hiện; kết quả đọc qua `useLoaderData()`. Data sẵn → ít skeleton, ít "vẽ rồi mới fetch". Loader chạy ngoài cây React nên chỉ đọc `params`/`request`/singleton, không đọc context/state component. Ví von: loader như người phục vụ ghi món trước khi bếp nhắc món — vào bàn là đồ ăn chuẩn bị sẵn, chứ không phải ngồi bàn trống rồi chờ gọi đi gọi lại.

> 📄 **Code ví dụ:** [`examples/03-4-loader-resolver-chay-truoc-render.tsx`](examples/03-4-loader-resolver-chay-truoc-render.tsx)

Với data cập nhật liên tục (realtime), loader làm bridge (`queryClient.fetchQuery` trong loader) rồi component dùng `useQuery` (TanStack DAY 12) — loader cho lần đầu nhanh, query cho cập nhật.

> **Tóm gọn 1 câu:** `loader` chuẩn bị data trước khi vẽ trang — vào là có, khỏi skeleton; chỉ đọc được URL/singleton, không đọc được state component.

### 5. `errorElement` — boundary lỗi theo route
Hiện khi loader/action throw (401/404/mạng). Mỗi route data nên có `errorElement` riêng (thông điệp đúng ngữ cảnh); root có boundary chung cho lỗi không ngờ. Không có là lỗi trồi lên, trang trắng. Ví von: mỗi route có "chướng vật mềm" riêng — ngã ở phòng nào thì đệm phòng đó đỡ, còn ở root có tấm đệm lớn bắt cả những cú ngã không lường.

> **Tóm gọn 1 câu:** Loader throw → `errorElement` đỡ — mỗi route một tấm đệm, root thêm tấm chung cho cú ngã bất ngờ.

### 6. Guard = loader throw + errorElement
Không cần guard class như Angular. Loader check token/quyền, thiếu thì `throw new Response("Unauthorized", { status: 401 })` → không render trang → `errorElement` "Không có quyền". Đây là canActivate đơn giản nhất cho UX. Bảo mật thật vẫn ở API server (loader guard client chỉ giấu UI, không chặn API). Ví von: guard client như biển "nhân viên mới được vào" ở cửa phòng — treo được để khách khỏi đi nhầm, nhưng két sắt thì vẫn khóa ở ngân hàng (server).

> 📄 **Code ví dụ:** [`examples/04-6-guard-loader-throw-errorelement.tsx`](examples/04-6-guard-loader-throw-errorelement.tsx)

### 7. `lazy` route + query params
`lazy: () => import("./pages/UserPage")` — code splitting trong route (DAY 13), Router tự tải chunk + Suspense khi vào. Query `?q=` đọc qua `useSearchParams()`; đổi query mà loader đọc `request.url` thì loader chạy lại.

> **Tóm gọn 1 câu:** Route `lazy` là "mỗi trang một va-li riêng" — vào trang nào Router mở va-li trang đó; `?q=` đọc qua `useSearchParams`.

### Keyword chính
`createBrowserRouter` (object config), `RouterProvider` (mount), `Outlet` (lỗ con), `Link`/`NavLink` (không reload + active), `useParams` (string, validate), `useSearchParams` (query), `useNavigate` (điều hướng lập trình), `useLoaderData` (đọc loader), `loader` (trước render), `action` (form mutation + revalidate), `errorElement` (boundary route), `lazy` route (chunk).

> **Tóm gọn 1 câu:** 12 từ khóa này là bản đồ định vị của Router v7 — khai ở object, vẽ qua Outlet, data qua loader, lỗi qua errorElement.

## Luồng hoạt động (Flow)
Mục này đi theo một lượt bấm link từ trang chủ tới trang có guard — đọc để hình dung thứ tự: match URL → loader → render, và lỗi rơi vào đâu.
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

> **Tóm gọn 1 câu:** Mỗi lần bấm link là một chuỗi cố định: đổi URL → match route → loader chạy → vẽ; lỗi loader thì rơi vào errorElement gần nhất.

## Ví dụ chi tiết
Mục này ghép mọi mảnh thành code chạy được — đọc kèm `example.tsx` trong thư mục.
Khớp 1-1 với `example.tsx` (Layout/Outlet/Link/params/query/loader-guard):

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

`action` cho form mutation + tự revalidate loader (không cần `invalidateQueries` tay):

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

## Giải thích từng phần
Mục này soi từng dòng config và hook — đọc khi bạn thắc mắc "vì sao phải viết thế này".
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
Mục này là "từ điển chuyển nhà" cho người quen Angular Router — bên trái thói quen cũ, bên phải mảnh thay thế.

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

> **Cách đọc bảng này:** mỗi dòng là một khái niệm Router của Angular đối chiếu sang React Router v7, cột Ghi chú tóm ý cần nhớ — tra theo tính năng bạn đang chuyển chứ đừng học thuộc cả bảng.

## Lỗi thường gặp (Common pitfalls)
Mục này là "bản đồ bẫy" của Router — sập vào thì thường là trang trắng, 404 khó hiểu hoặc `undefined` nơi bất ngờ.

### 1. Quên `RouterProvider`
> 📄 **Code ví dụ:** [`examples/07-1-quen-routerprovider.tsx`](examples/07-1-quen-routerprovider.tsx)
> 📄 **Code ví dụ:** [`examples/08-1-quen-routerprovider.tsx`](examples/08-1-quen-routerprovider.tsx)

### 2. `Link` absolute/relative sai → 404
> 📄 **Code ví dụ:** [`examples/09-2-link-absolute-relative-sai-404.tsx`](examples/09-2-link-absolute-relative-sai-404.tsx)
> 📄 **Code ví dụ:** [`examples/10-2-link-absolute-relative-sai-404.tsx`](examples/10-2-link-absolute-relative-sai-404.tsx)

### 3. Loader throw mà thiếu `errorElement` → trắng
> 📄 **Code ví dụ:** [`examples/11-3-loader-throw-ma-thieu-errorelement-trang.tsx`](examples/11-3-loader-throw-ma-thieu-errorelement-trang.tsx)
> 📄 **Code ví dụ:** [`examples/12-3-loader-throw-ma-thieu-errorelement-trang.tsx`](examples/12-3-loader-throw-ma-thieu-errorelement-trang.tsx)

### 4. `useLoaderData` sai component → undefined
Mô tả: đọc ở layout cha trong khi loader ở con (hoặc ngược). Fix: chỉ đọc trong component của route khai loader. Muốn cha đọc thì loader phải ở cha.

### 5. Params luôn string, `Number(id)` NaN
> 📄 **Code ví dụ:** [`examples/13-5-params-luon-string-number-id-nan.tsx`](examples/13-5-params-luon-string-number-id-nan.tsx)
> 📄 **Code ví dụ:** [`examples/14-5-params-luon-string-number-id-nan.tsx`](examples/14-5-params-luon-string-number-id-nan.tsx)

### 6. Guard localStorage tưởng bảo mật thật
Mô tả: loader check token client rồi cho hiện nút "Xóa user" — user mở DevTools set token giả là thấy. Fix: loader guard chỉ UX (giấu UI); API server vẫn check token thật, không có là 401 dù UI hiện.

### 7. Loader đọc context/state component → sai
Mô tả: `loader: () => fetch(user.id)` với `user` từ context — loader chạy ngoài cây React, không có context. Fix: loader chỉ đọc `params`/`request`/singleton module (token store, queryClient). Data từ component thì để `useQuery` trong component (DAY 12).

## Best practices / Mẹo
Mục này là "cẩm nang cấu trúc route" của app thật — đọc để tổ chức route sạch từ đầu thay vì dọn dẹp sau.
- **Chuẩn v7:** data router (loader/action/errorElement/lazy) cho app mới thay `<Routes>` JSX. Vì sao? Vì data + lỗi + chunk colocate với route, type-check, ít skeleton.
- Layout nhóm (`AuthLayout`/`AppLayout`): guard ở cha, con kế thừa. Vì sao? Để 10 trang admin chỉ guard 1 chỗ, thêm trang không quên.
- Data cần ngay khi vào → `loader`; cập nhật liên tục → TanStack trong component (loader bridge `fetchQuery`). Vì sao 2 tầng? Vì loader cho lần đầu nhanh (không skeleton), query cho nền (realtime/poll).
- `useNavigation()` spinner toàn cục + `NavLink` active (`isActive`/`isPending`). Vì sao? Để chuyển trang có phản hồi (pending) và menu biết đang đâu.
- `action` cho form mutation theo route — tự revalidate loader sau submit. Vì sao? Ít hơn `useMutation` + `invalidate` tay khi form thuộc về route đó.
- **Tách route theo feature/layout**, `errorElement` ở cha bắt cho con. Vì sao? Để lỗi con không có boundary riêng vẫn rơi về cha, không trắng.

## Bài tập nhỏ
Làm tay để nhớ — mỗi bài thử một tính năng route và quan sát URL/Network/errorElement phản ứng ra sao.

1. `users/:id` loader fetch + 404 `errorElement` + `useLoaderData` hiện tên. Thử id lạ (`/users/abc`) — validate params + fallback hiện gì?
2. `NavLink` Home/User + guard `admin` (token giả nút login). Vào thẳng `/admin` không token → errorElement. Bấm login → vào lại → qua. Vì sao loader guard chỉ UX?
3. `useSearchParams` `?q=` filter users + loader đọc query refetch theo. Đổi `q` mà không reload trang — loader chạy lại khi nào?
4. `useNavigate` sau "login" sang `/dashboard` + guard loader bảo vệ. So sánh với `<Link>` — khi nào lập trình, khi nào render link?
5. Thêm `action` cho form sửa user + tự revalidate — so sánh với `useMutation` + `invalidateQueries` (khi nào action gọn hơn?).

> **Tóm gọn 1 câu:** Router v7 gói cả bài trong 1 nhịp: khai object, vẽ qua Outlet, data trước render bằng loader, chặn vào bằng throw 401, lỗi đỡ bằng errorElement.

## Reference
- https://reactrouter.com/start/framework/routing
- https://reactrouter.com/start/library/routing
- https://react.dev/learn/start-a-new-react-project
