# React Server Components (RSC)

**React Server Components (Server Components, Server Functions/Actions)** đạt **stable trong React 19 (12/2024)**. RSC cho phép render component **trên server**, gửi cây UI đã serialize về client, và **không ship JavaScript** của Server Component xuống browser — nhờ đó giảm mạnh bundle và cho phép truy cập dữ liệu/secret trực tiếp.

Framework triển khai: **Next.js App Router**, React Router, Waku...

## Tổng quan theo nhóm

| # | Feature | Mô tả |
|---|---------|-------|
| 1 | [App Router (Server vs Client)](1_app-router/README.md) | Server Component mặc định, boundary `"use client"`, quy tắc serializable props |
| 2 | [Server Actions](2_server-actions/README.md) | `"use server"` — gọi hàm server từ form/client, `useActionState`, revalidate + redirect |
| 3 | [cache() & fetch caching](3_cache-fetch/README.md) | `cache()` dedupe, fetch cache (`force-cache`/`no-store`/`revalidate`), tags, `cacheSignal()` |

## ĐÁNH GIÁ TỔNG QUAN

### Điểm mạnh

1. **Bundle nhỏ** — Server Component không ship JS, chỉ gửi UI tree đã serialize.
2. **Fetch gần data** — query DB/API ngay trong component server, bỏ REST trung gian và waterfall.
3. **Server Actions** — mutation không cần tự viết REST endpoint thủ công.
4. **Bảo mật** — secret (API key, DB URL) chỉ tồn tại ở server, không lọt vào bundle client.

### Điểm cần lưu ý

1. **Không dùng state/effect trong Server Component** — cần boundary `"use client"` cho phần tương tác.
2. **Serialization boundary** — props qua Server → Client phải **serializable**; không truyền function, class instance, hay `Date` thô.
3. **Cache semantics dễ nhầm** — default `fetch` cache **khác nhau giữa Next 14 và 15+**; luôn khai báo `cache`/`next.revalidate` rõ ràng.
4. **Server Actions là endpoint công khai** — luôn auth + validate **trên server**, không tin client.

### Lời khuyên

- **Mặc định viết Server Component**, chỉ `"use client"` cho interactive islands (đặt càng thấp càng tốt).
- Mutation form → Server Actions + `revalidatePath`/`revalidateTag`, auth check trong action.
- Dedupe request cùng render → bọc fetch helper bằng `cache()`.

## Cú pháp nhanh

```tsx
// Server Component (mặc định) — async, truy cập DB/secret
export default async function Page() {
  const items = await db.query();
  return <ClientWidget items={items} />; // props phải serializable
}
```

```tsx
// Client island
'use client';
export function ClientWidget({ items }: { items: Item[] }) {
  // state / effect / event
}
```

```tsx
// Server Action
'use server';
export async function createItem(formData: FormData) {
  await db.item.create({ /* ... */ });
  revalidatePath('/items');
}
```

```tsx
// Data layer
import { cache, cacheSignal } from 'react';        // cache trong request (RSC-only cho cacheSignal)
await fetch(url, { next: { revalidate: 60, tags: ['items'] } }); // cache xuyên request
revalidateTag('items');                             // xóa cache sau mutation
```

## Tính năng quan trọng khác

| Feature | Mô tả | Ghi chú |
|---------|-------|---------|
| Streaming SSR | `<Suspense>` boundary stream dần | Kết hợp RSC |
| `use()` unwrap promise | Server truyền promise → client unwrap bằng `use()` | Pattern chuẩn |
| `cache()` | Dedupe theo args trong 1 request | Từ `react` |
| `cacheSignal()` | Trả `AbortSignal` khi vòng đời `cache()` kết thúc | React 19.2, RSC-only |
| `unstable_cache` | Cache kết quả hàm non-fetch với key + tags | Next.js |
| `taintObjectReference` | Chặn leak secret qua Server → Client props | Security API |

## Yêu cầu

- React 19+ (RSC stable từ 12/2024).
- Next.js 14+ (khuyến nghị 15+; Next 16 hỗ trợ tốt hơn).
- Node.js 18+.

## Chạy thử

```bash
npx create-next-app@latest demo --typescript --app
cd demo && npm run dev
```

## Tài liệu tham khảo

- [Server Components (react.dev)](https://react.dev/reference/rsc/server-components)
- [`"use client"`](https://react.dev/reference/rsc/use-client)
- [`"use server"`](https://react.dev/reference/rsc/use-server)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js — Fetching, Caching & Revalidating](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
