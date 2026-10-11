// Tầng API cho resource /posts của JSONPlaceholder.
// - fetch thuần + AbortController (DAY 12): check r.ok, bỏ qua AbortError, cleanup abort().
// - Base URL đọc từ env (nhóm 4_security-config), có fallback để chạy ngay.
// - JSONPlaceholder là API fake: POST/PUT/DELETE thành công nhưng KHÔNG persist.
//   Mutation hooks sẽ mirror vào cache TanStack Query (xem hooks/usePosts.ts).

import type { Post, PostInput } from "../types";
import { env } from "../lib/env";

export const BASE_URL = `${env.apiUrl}/posts`;

export async function checkOk(res: Response): Promise<Response> {
  // fetch chỉ reject khi lỗi mạng; HTTP 4xx/5xx vẫn resolve -> phải check tay.
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res;
}

// READ — danh sách (giới hạn _limit để demo nhẹ, mặc định API trả 100 items)
export async function getPosts(signal?: AbortSignal, limit = env.postsLimit): Promise<Post[]> {
  const res = await fetch(`${BASE_URL}?_limit=${limit}`, { signal });
  await checkOk(res);
  return res.json() as Promise<Post[]>;
}

// READ — chi tiết 1 post (route /posts/:id — DAY 14 router loader pattern thủ công)
export async function getPost(id: number, signal?: AbortSignal): Promise<Post> {
  const res = await fetch(`${BASE_URL}/${id}`, { signal });
  await checkOk(res);
  return res.json() as Promise<Post>;
}

// CREATE — JSONPlaceholder luôn trả về { id: 101 }
export async function createPost(input: PostInput, signal?: AbortSignal): Promise<Post> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  await checkOk(res);
  return res.json() as Promise<Post>;
}

// UPDATE (full) — PUT yêu cầu đủ title/body/userId
export async function updatePost(
  id: number,
  input: PostInput,
  signal?: AbortSignal,
): Promise<Post> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  await checkOk(res);
  return res.json() as Promise<Post>;
}

// DELETE
export async function deletePost(id: number, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE", signal });
  await checkOk(res);
}

export function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}
