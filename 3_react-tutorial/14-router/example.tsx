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
