// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
// Component meta bổ trợ (KHÔNG thay thế headers server):
// Vì sao không thay: meta thiếu frame-ancestors/report-uri, dễ bị ghi đè — header HTTP mới quyết định ở prod
export function SecurityMeta() {
  return (
    <>
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
    </>
  );
}

// Fetch luôn gửi kèm credentials để cookie httpOnly đi theo,
// kết hợp CSP/connect-src giới hạn domain ở tầng server.
// Vì sao include: cookie httpOnly (xem bài 4) chỉ đi theo khi credentials include + CORS server cho phép
export async function secureFetch(path: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    credentials: 'include', // cookie phiên đi theo — không có là 401 dù đã login
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status === 401) window.location.assign('/login'); // hết phiên → về login (dùng assign để không Back lại trang cần auth)
  return res;
}
