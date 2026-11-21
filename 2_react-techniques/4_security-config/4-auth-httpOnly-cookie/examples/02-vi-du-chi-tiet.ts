// fetch wrapper: tự refresh khi 401 rồi thử lại 1 lần
let refreshing: Promise<void> | null = null;

export async function apiFetch(input: string, init: RequestInit = {}) {
  const doFetch = () => fetch(input, { ...init, credentials: 'include' });

  let res = await doFetch();
  if (res.status === 401) {
    // Gộp nhiều request cùng lúc vào một lần refresh (tránh dội refresh)
    refreshing ??= fetch('/auth/refresh', { method: 'POST', credentials: 'include' }).then(
      () => { refreshing = null; },
    );
    await refreshing;
    res = await doFetch(); // thử lại với cookie mới
  }
  return res;
}
