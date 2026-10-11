# 3. `cache()`, fetch caching & Revalidation

## Mô tả

RSC cung cấp một **data layer nhiều tầng** để kiểm soát việc lấy và cache dữ liệu. Ba tầng chính:

1. **`cache()`** (từ `react`) — dedupe lời gọi hàm **theo args trong một request**.
2. **fetch caching** (Next.js) — cache dữ liệu **xuyên request** với `cache: 'force-cache' | 'no-store'` và `next: { revalidate, tags }`.
3. **Revalidation** — xóa cache có chủ đích sau mutation bằng `revalidatePath` / `revalidateTag`, kết hợp `unstable_cache`.

Ngoài ra **`cacheSignal()`** (**React 19.2**, chỉ dùng trong RSC) trả về một `AbortSignal` khi vòng đời của `cache()` kết thúc — hữu ích để hủy công việc không còn cần thiết.

## Mục tiêu

- Hiểu `cache()` dedupe trong request và phân biệt với fetch cache xuyên request.
- Cấu hình `fetch` cache tường minh (`force-cache`, `no-store`, `next.revalidate`, tags).
- Biết revalidate đúng scope sau mutation và dùng `cacheSignal()` để hủy việc.

## Vấn đề giải quyết

Hai vấn đề trái ngược:

- **Fetch trùng lặp**: nhiều Server Component trong cùng một render cần chung một record (ví dụ user hiện tại) ⇒ gọi API/DB N lần thừa.
- **Cache sai**: cache quá tay ⇒ dữ liệu cũ; không cache ⇒ chậm. Đặc biệt Next.js 14 và 15+ có **default fetch cache khác nhau**, khiến hành vi thay đổi khi nâng cấp.

Ba tầng giải quyết riêng biệt: **dedupe trong request** (`cache()`), **cache xuyên request** (`fetch` options), và **xóa cache có chủ đích** (`revalidate*`).

## Khái niệm cốt lõi

- **`cache(fn)`** — bọc một hàm async; trong **cùng một request**, các lời gọi `cache(fn)(cùngArgs)` chỉ thực thi hàm **một lần**, các lần sau trả kết quả đã lưu. Khác React.memo: dedupe sống theo phạm vi request.
- **`cacheSignal()`** (**React 19.2**, RSC-only) — gọi bên trong một hàm `cache()` để lấy `AbortSignal`. Khi vòng đời của `cache()` kết thúc, signal bị abort ⇒ bạn hủy fetch/tác vụ dài không còn cần.
- **fetch cache (Next)**:
  - `cache: 'force-cache'` — dùng cache (mặc định cũ).
  - `cache: 'no-store'` — luôn fetch mới, không cache.
  - `next: { revalidate: 60 }` — cache tối đa 60 giây (ISR).
  - `next: { tags: ['posts'] }` — gắn tag để revalidate theo tag.
- **`unstable_cache`** — cache kết quả một hàm (kể cả query DB không phải `fetch`) với key + tags.
- **Revalidation**: `revalidatePath('/path')` làm mới theo route; `revalidateTag('tag')` làm mới mọi mục gắn tag đó.
- **Khác biệt version**: default `fetch` cache **khác nhau giữa Next 14 và 15+**. Vì vậy **luôn khai báo rõ** `cache`/`revalidate`, đừng dựa vào mặc định.

## Cú pháp / API

```tsx
import { cache, cacheSignal } from 'react';
import { unstable_cache } from 'next/cache';

// 1) Dedupe trong 1 request
const getUser = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/users/${id}`, {
    cache: 'force-cache',
    next: { revalidate: 60, tags: ['users'] },
  });
  return res.json();
});

// 2) Cache xuyên request theo tag
const getPosts = unstable_cache(
  async () => db.post.findMany(),
  ['posts'],            // cache key parts
  { tags: ['posts'], revalidate: 3600 },
);

// 3) Revalidate sau mutation (trong Server Action)
// revalidatePath('/posts');
// revalidateTag('posts');

// 4) Hủy việc khi vòng đời cache() kết thúc (React 19.2, RSC-only)
const getReport = cache(async (id: string) => {
  const signal = cacheSignal();
  return fetch(`https://api.example.com/report/${id}`, { signal });
});
```

Bảng chọn tầng:

| Nhu cầu | API | Phạm vi |
|---------|-----|---------|
| Dedupe cùng request | `cache()` | 1 request |
| Cache có TTL | `fetch(..., { next: { revalidate } })` | xuyên request |
| Không cache | `fetch(..., { cache: 'no-store' })` | — |
| Cache hàm non-fetch | `unstable_cache(fn, keys, { tags })` | xuyên request |
| Xóa cache sau mutation | `revalidatePath` / `revalidateTag` | xuyên request |
| Hủy việc khi request xong | `cacheSignal()` | 1 request |

## Luồng hoạt động (Flow)

1. Server Component gọi helper đã bọc `cache()`.
2. Lần gọi đầu trong request thực thi fetch/DB; các lần sau cùng args trả cache.
3. Nếu `fetch` có `revalidate`/`tags`, kết quả được cache xuyên request ở data cache của Next.
4. Mutation (Server Action) chạy xong → `revalidatePath`/`revalidateTag`.
5. Next xóa cache tương ứng; request kế tiếp lấy dữ liệu mới.
6. `cacheSignal()` abort các tác vụ khi vòng đời `cache()` kết thúc (React 19.2).

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

```tsx
import { Suspense, cache, use } from 'react';

// 1. cache(): cùng id trong 1 request chỉ fetch 1 lần.
const getUser = cache(async (id: string) => {
  console.log(`[fetch] user ${id}`); // in 1 lần cho mỗi id / request
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, {
    // 2. fetch caching (Next): cache xuyên request 60s.
    // Trong Next: { next: { revalidate: 60, tags: ['users'] } }
    // Demo Vite/plain React: dùng cache mặc định của fetch wrapper.
  });
  if (!res.ok) throw new Error('Fetch lỗi');
  return res.json() as Promise<{ name: string; phone: string }>;
});

function UserCard({ id }: { id: string }) {
  // `use()` unwrap promise — Server Component truyền promise xuống client.
  const user = use(getUser(id));
  return (
    <p>
      {user.name} — {user.phone}
    </p>
  );
}

export default function CacheFetchDemo() {
  return (
    <div>
      <h2>cache() + fetch caching (RSC)</h2>
      <p>2 card id=1 dedupe thành 1 fetch (xem console).</p>
      <Suspense fallback={<p>Đang tải...</p>}>
        {/* id=1 xuất hiện 2 lần → chỉ 1 fetch nhờ cache() */}
        <UserCard id="1" />
        <UserCard id="1" />
        <UserCard id="2" />
      </Suspense>
      <p>
        <small>
          Sau mutation gọi revalidateTag('users') / revalidatePath('/users') để
          xóa cache có chủ đích (Next.js).
        </small>
      </p>
    </div>
  );
}
```

## Giải thích từng phần

- **`cache(async (id) => ...)`** — bọc `getUser`. Trong cùng request, `getUser('1')` gọi hai lần (cho hai `UserCard`) chỉ thực thi fetch **một lần**; console in `[fetch] user 1` đúng một lần.
- **`console.log`** — dùng để *chứng minh* dedupe: bạn thấy 2 dòng log (`user 1`, `user 2`) dù có 3 card.
- **`use(getUser(id))`** — `use()` unwrap promise bên trong `Suspense`; đây là pattern chuẩn để Server Component truyền promise xuống và client đọc.
- **`Suspense fallback`** — trong khi promise chưa resolve, hiển thị "Đang tải...".
- **Ghi chú `next.revalidate`/`tags`** — trong Next.js, thêm `next: { revalidate: 60, tags: ['users'] }` để cache xuyên request và có thể revalidate.
- **`revalidateTag('users')` / `revalidatePath('/users')`** — gọi trong Server Action sau khi sửa dữ liệu user để xóa cache đúng scope.

## So sánh với cách làm cũ

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| Tự lưu cache trong `useState`/context | `cache()` dedupe theo request | Không fetch trùng, không code thủ công |
| Dựa vào default fetch cache | Khai báo rõ `cache` + `next.revalidate` | Hành vi ổn định qua các version Next |
| Invalidate bằng reload cả trang | `revalidatePath` / `revalidateTag` | Xóa cache đúng scope, không nặng |
| Query DB không cache được | `unstable_cache` bọc hàm | Cache cả non-fetch với tags |
| Fetch treo khi request kết thúc | `cacheSignal()` (React 19.2) | Hủy việc không còn cần |

## Lỗi thường gặp

1. **Dựa vào default fetch cache** ⇒ hành vi khác nhau giữa Next 14 và 15+. *Fix:* luôn khai báo `cache`/`next.revalidate` tường minh.
2. **Nghĩ `cache()` cache xuyên request** ⇒ thực ra chỉ trong 1 request. *Fix:* cần xuyên request thì dùng `next.revalidate`/tags hoặc `unstable_cache`.
3. **Cache dữ liệu theo user/realtime bằng `force-cache`** ⇒ lộ dữ liệu cũ/người khác. *Fix:* dùng `no-store` hoặc fetch client.
4. **Quên revalidate sau mutation, hoặc revalidate sai scope (toàn site)** ⇒ UI cũ / giảm hiệu năng. *Fix:* gọi `revalidateTag`/`revalidatePath` với scope hẹp đúng đối tượng vừa thay đổi.
5. **Dùng `cacheSignal()` ngoài RSC** ⇒ không hoạt động. *Fix:* chỉ gọi trong ngữ cảnh React Server Components.

## Khi nào dùng / Khi nào không

- **Dedupe trong cùng request** → bọc helper bằng `cache()`.
- **Data ít đổi** (danh mục, bài viết) → `force-cache` / `revalidate: 3600` + tags.
- **Data theo user / realtime** (giỏ hàng, feed) → `no-store` hoặc fetch phía client.
- **Query DB không phải fetch** cần cache → `unstable_cache`.
- **Hủy fetch khi request lifecycle kết thúc** → `cacheSignal()` (React 19.2, RSC-only).

> Lưu ý: đây là API **framework-dependent** — `cache()`/`cacheSignal()` đến từ `react`, còn `unstable_cache`/`revalidate*` đến từ Next.js.

## Bài tập nhỏ

Bọc `getUser(id)` bằng `cache()` rồi render ba `UserCard` với id `1, 1, 2`. Kiểm tra console chỉ có **2** lần fetch. Sau đó thêm `next: { revalidate: 60, tags: ['users'] }` và viết một Server Action `refreshUser()` gọi `revalidateTag('users')` — mô tả điều gì xảy ra với các request tiếp theo.

## Reference

- [`cache()` (react.dev)](https://react.dev/reference/react/cache)
- [`cacheSignal()` (react.dev)](https://react.dev/reference/react/cacheSignal)
- [Next.js — Fetching, Caching & Revalidating](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [`unstable_cache`](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
