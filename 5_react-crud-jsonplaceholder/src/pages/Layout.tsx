import { Link, Outlet } from "react-router-dom";
import { useUiStore } from "../store/ui";

// Layout chung (DAY 14 router): header + notice toàn app + <Outlet/> cho route con.
export default function Layout() {
  const notice = useUiStore((s) => s.notice);

  return (
    <main className="container">
      <header>
        <h1>CRUD Posts — JSONPlaceholder</h1>
        <p className="muted">
          API <code>https://jsonplaceholder.typicode.com/posts</code> là fake — POST/PUT/DELETE
          thành công nhưng không lưu thật, app mirror vào cache TanStack Query.
        </p>
        <nav className="row">
          <Link to="/">Danh sách</Link>
        </nav>
      </header>

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      <Outlet />
    </main>
  );
}
