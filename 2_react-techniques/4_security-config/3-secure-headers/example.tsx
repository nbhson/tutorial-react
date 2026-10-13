// Component meta bổ trợ (không thay thế headers server):
// - referrer policy + theme cho defense-in-depth ở tầng HTML.
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
export async function secureFetch(path: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status === 401) window.location.assign('/login');
  return res;
}
