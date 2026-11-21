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
