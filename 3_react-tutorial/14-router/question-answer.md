# DAY 14 — Hỏi & Đáp: Router

> File hỏi–đáp chi tiết cho `3_react-tutorial/14-router`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (router tối giản chạy được, cần `npm i react-router`).

---

## 1. React Router v7 dùng package nào? Khai báo route ở đâu?

**Hỏi:** `react-router` hay `react-router-dom`? `<Routes>` trong JSX còn dùng không?

**Đáp:**
- 2026 dùng package **`react-router`** (chế độ framework + library). Chuẩn là **data router**:
  `createBrowserRouter(routes)` khai báo object **một chỗ**, rồi `<RouterProvider router={router}/>` mount.
  `<Routes>` kiểu cũ vẫn chạy nhưng không phải chuẩn v7 (thiếu `loader`/`action` tích hợp).
- Trong example: route cha `Layout` bọc 2 con — `index` (Home) và `users/:id` — đúng mô hình cây route.

---

## 2. `<Outlet />` là gì? (So với `router-outlet`)

**Hỏi:** `Layout` render mà không thấy nội dung trang con ở đâu?

**Đáp:**
- `<Outlet />` chính là **chỗ route con được render** — tương đương `<router-outlet>` của Angular.
  Layout giữ nav/khung chung, `Outlet` là "lỗ" thay nội dung theo URL.
- Không có `Outlet` trong Layout → vào route con vẫn khớp URL nhưng **trắng phần nội dung**.

---

## 3. `<Link>` khác `<a href>` ở đâu? Còn `useNavigate` để làm gì?

**Hỏi:** Sao không dùng thẻ `<a>` cho nhanh?

**Đáp:**
- `<a href>` **reload toàn trang** (mất state). `<Link to>` chặn mặc định + dùng History API —
  chỉ chạy loader mới + re-render vùng `Outlet`, state (theme, scroll) giữ nguyên.
- `useNavigate()` cho **điều hướng trong handler** (login xong nhảy `/dashboard`) — nơi không render `<Link>` được.
  Đọc id trên URL: `useParams()` (`users/:id` → `{ id }`); đọc `?page=2`: `useSearchParams()`.

---

## 4. `loader` là gì? Khác fetch trong `useEffect` ở đâu?

**Hỏi:** Lấy data trong `loader` và trong component khác gì nhau?

**Đáp:**
- `loader` chạy **trước khi render route** (tương đương resolver Angular): vào `/users/1` là data user 1
  đã sẵn → component hiện ngay, **ít skeleton** hơn fetch-sau-mount.
- Data đọc qua `useLoaderData()`. Đổi query param (`?page=2`) → loader chạy lại theo URL.
- Fetch trong `useEffect` (DAY 12) vẫn hợp cho data phụ/interactive sau mount; data chính của trang nên ở `loader`.

---

## 5. Guard (canActivate) viết ở đâu? `errorElement` là gì?

**Hỏi:** Chặn `/admin` khi chưa login kiểu React?

**Đáp:**
- **Throw trong `loader`**: `throw new Response("Unauthorized", { status: 401 })` → route không render,
  React hiện **`errorElement`** thay thế ("Không có quyền."). Đó chính là guard + ErrorHandler của route gộp một.
- `errorElement` cũng bắt lỗi loader khác (404, network) — không cần ErrorBoundary tay cho từng route.

---

## 6. Lazy route là gì? Liên quan DAY 13 thế nào?

**Hỏi:** Tách chunk ở tầng route khác gì `lazy()` tay?

**Đáp:**
- `lazy: () => import("./UserPage")` trong object route — React Router **tự tải chunk khi vào route
  và tự bọc Suspense**, không cần viết `lazy()` + `<Suspense>` tay như DAY 13.
- Đây là cách tách chunk phổ biến nhất prod: mỗi trang một chunk, vào trang nào tải trang đó.

---

## 7. So nhanh Angular Router ↔ React Router?

**Hỏi:** Từng khái niệm RouterModule tương đương gì?

**Đáp:**

| Angular | React Router v7 | Ghi chú |
|---|---|---|
| `RouterModule` + `router-outlet` | `createBrowserRouter` + `<Outlet/>` | Khai báo object một chỗ |
| `routerLink` | `<Link to>` | Không reload |
| resolver | `loader` + `useLoaderData` | Data trước render |
| guard `canActivate` | throw trong `loader` + `errorElement` | 401 → trang lỗi |
| `loadChildren` | `lazy` route | Tách chunk theo trang |

---

## 8. `NavLink` + `useNavigation`: menu active và spinner toàn cục thế nào?

**Hỏi:** Làm sao menu biết đang ở trang nào, và hiện "đang tải trang" khi chuyển route?

**Đáp:**
- `Link` thường không biết active. `NavLink` tự cung cấp `isActive`/`isPending` (qua prop `className={({ isActive }) => ...}` hoặc `style`) — đang ở `/users/1` thì link đó nhận class active, user biết vị trí. Đây là thứ Angular làm bằng `routerLinkActive`, React làm bằng render prop của `NavLink`.
- Cơ chế `useNavigation()`: khi chuyển route có `loader`, Router ở trạng thái `loading` trong lúc loader chạy — đọc `navigation.state === "loading"` ở Layout để hiện spinner mỏng trên cùng, thay vì để Outlet trống. Khác với fetch trong component (phải tự state), Router cho trạng thái chuyển trang toàn cục miễn phí.
- Sai thì sao: tự `useState` loading cho navigation là thừa + dễ lệch (quên tắt khi loader lỗi). Fix: đọc `useNavigation()` ở Layout, spinner theo Router.

```tsx
import { NavLink, useNavigation, Outlet } from "react-router";

function Layout() {
  const nav = useNavigation(); // trạng thái điều hướng toàn cục của Router
  return (
    <div>
      <nav>
        {/* isActive tự tính theo URL: đang ở trang nào thì link đó nổi bật */}
        <NavLink to="/" className={({ isActive }) => (isActive ? "font-bold" : "")}>Home</NavLink>
        {" | "}
        <NavLink to="/users/1" className={({ isActive }) => (isActive ? "font-bold" : "")}>User 1</NavLink>
      </nav>
      {/* Hiện chỉ báo khi Router đang chạy loader của route đích */}
      {nav.state === "loading" && <p>Đang tải trang...</p>}
      <Outlet />
    </div>
  );
}
```

---

## 9. `useSearchParams` cho filter `?q=` + `useNavigate` sau login thế nào?

**Hỏi:** Ô search đổi query trên URL mà không reload, login xong nhảy trang — code ra sao?

**Đáp:**
- Cơ chế `useSearchParams()`: đọc/ghi query string (`?q=son&page=2`) như state — `setSearchParams({ q: "son" })` đẩy URL mới qua History API, Router chạy lại `loader` theo URL (nếu loader đọc `request.url`), component re-render với giá trị mới. Back/forward trình duyệt giữ filter vì filter nằm trên URL, không nằm state mất khi reload.
- `useNavigate()` cho điều hướng **trong handler** (sau login thành công, sau submit): `navigate("/dashboard")` hoặc `navigate(-1)` quay lại. Khác `Link` (render trong JSX cho user bấm), `navigate` gọi trong code sau logic.
- Sai thì sao: lưu filter vào `useState` thường thì reload mất, copy link cho đồng nghiệp không giữ filter. Fix: filter chia sẻ được → URL (`useSearchParams`); state tạm → `useState`. Login guard vẫn ở `loader` (câu 5), `navigate` chỉ lo nhảy sau khi có token.

```tsx
import { useSearchParams, useNavigate } from "react-router";

function UserList() {
  const [params, setParams] = useSearchParams(); // query ?q=... thành state 2 chiều
  const q = params.get("q") ?? ""; // đọc filter hiện tại từ URL
  const navigate = useNavigate(); // điều hướng trong handler
  return (
    <div>
      {/* Gõ là URL đổi (?q=...), loader chạy lại, back/forward giữ filter */}
      <input value={q} onChange={(e) => setParams({ q: e.target.value })} placeholder="Lọc user (?q=)" />
      {/* Sau login xong: nhảy sang dashboard thay vì render Link */}
      <button onClick={() => navigate("/dashboard")}>Giả lập login xong</button>
    </div>
  );
}
```

---

## 10. `loader` + TanStack Query + `action`: data chính, data live, mutation chia thế nào?

**Hỏi:** Có Query (DAY 12) rồi thì `loader` còn việc gì? `action` để làm gì?

**Đáp:**
- Chia 3 tầng rõ: `loader` lo **data chính của trang cần ngay trước render** (user theo `:id`) — vào URL là có, ít skeleton. TanStack Query lo **data live/cập nhật liên tục** trong component (danh sách realtime, poll) — loader không poll được. `action` lo **mutation từ form của route** (POST/PUT) — submit xong Router tự revalidate `loader`, UI tươi mà ít gọi `invalidateQueries` tay.
- Cơ chế cầu: `loader` gọi `queryClient.fetchQuery(...)` rồi trả data — vừa có data trước render, vừa nạp sẵn cache Query để component `useQuery` sau đó không fetch lại. `action` nhận `request.formData()`, xử lý xong trả kết quả, Router chạy lại loader các route liên quan.
- Sai thì sao: nhét poll realtime vào `loader` (loader chỉ chạy khi URL đổi, không chạy lại mỗi giây) → số liệu đứng yên. Hoặc fetch data chính trong `useEffect` thay vì loader → vào trang trắng + skeleton lâu. Fix: chính → loader, live → Query, ghi → action.

| Tầng | Chạy khi nào | Dùng cho |
|---|---|---|
| `loader` | Trước render route, khi URL đổi | Data chính cần ngay (user/:id) |
| `useQuery` trong component | Sau mount, poll/refetch được | Data live, realtime, dependent |
| `action` | Khi form route submit | Mutation + tự revalidate loader |

---

## 11. Lỗi thực chiến: `:id` luôn string + `useLoaderData` sai chỗ + guard `localStorage`?

**Hỏi:** `Number(id)` ra `NaN`, `useLoaderData()` undefined, guard loader có bảo mật thật không?

**Đáp:**
- **Params luôn string**: `users/:id` khớp `/users/abc` cũng cho `id = "abc"` — `Number("abc")` là `NaN`, fetch `/users/NaN` lỗi lạ. Fix: validate + fallback — `const id = Number(raw); if (!Number.isInteger(id)) throw new Response("Not Found", { status: 404 })` để `errorElement` hiện "Không tìm thấy".
- **`useLoaderData` sai chỗ**: hook này chỉ có data trong **component của route có loader**. Gọi ở Layout cha hoặc component cháu ngoài route là `undefined`. Fix: gọi đúng component route, hoặc nâng loader lên route cha nếu nhiều con cùng cần.
- **Guard `localStorage` chỉ là UX**: `loader` chạy client-side, token trong storage sửa được bằng DevTools — chặn ở loader không ngăn API thật. Bảo mật thật nằm ở **server/API kiểm token**. Loader guard chỉ để **không render nhầm + hiện trang 401 đẹp**, không thay auth backend.

```tsx
import { useParams } from "react-router";

function UserPage() {
  const { id: raw } = useParams(); // params luôn là string | undefined
  const id = Number(raw); // ép sang số để gọi API
  // Validate sớm: id bậy thì throw 404 để errorElement hiện, không fetch bừa
  if (!Number.isInteger(id)) throw new Response("Not Found", { status: 404 });
  return <p>Trang user #{id}</p>;
}
```

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 14)
- https://reactrouter.com/ (data router, loader, errorElement)
