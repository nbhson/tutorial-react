// Layout trong example.tsx: nav Link + Outlet
function Layout() {
  return <div><nav><Link to="/">Home</Link> | <Link to="/users/1">User 1</Link></nav><Outlet /></div>;
}
// Vào /users/1: Layout vẽ (nav giữ nguyên) + Outlet vẽ UserPage — không reload, giữ theme/scroll
