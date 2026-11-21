// api/http.ts — 1 file, mọi code chỉ import cái này
const TOKEN_KEY = "access_token";

export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (res.status === 401) {
    // (xem §4) single-flight refresh rồi retry request này 1 lần
  }
  if (!res.ok) throw new ApiError(res.status, await res.text().catch(() => "")); // normalize
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, public body: string) { super(`HTTP ${status}`); }
}
