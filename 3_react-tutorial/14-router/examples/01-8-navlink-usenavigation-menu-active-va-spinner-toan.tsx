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
