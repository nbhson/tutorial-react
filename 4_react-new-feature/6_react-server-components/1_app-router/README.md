# 1. App Router — Server vs Client Component

## Mô tả

**React Server Components (RSC)** là mô hình render chính thức **stable trong React 19 (12/2024)**. Trong Next.js **App Router**, mọi component **mặc định là Server Component**: render trên **server**, không ship JavaScript xuống browser. Chỉ những "ốc đảo tương tác" (islands) cần state/effect/event mới đánh dấu `"use client"`.

Framework hỗ trợ RSC: Next.js App Router, React Router, Waku... Giao tiếp Server → Client chủ yếu qua **props serializable**.

## Mục tiêu

- Hiểu Server Component là gì và vì sao mặc định trong App Router.
- Biết khi nào cần `"use client"` và đặt boundary ở đâu cho hợp lý.
- Nắm quy tắc **serialization** khi truyền props qua boundary Server → Client.

## Vấn đề giải quyết

Trước RSC, Pages Router trộn lẫn việc render và fetch giữa client–server:

- **Bundle phình** — thư viện nặng (markdown parser, date lib, DB client) lọt xuống browser.
- **Fetch chậm** — dữ liệu thường phải lấy qua API rồi hydrate ở client, gây waterfall.
- **Không rõ ràng** — khó biết đoạn code nào chạy ở đâu, secret dễ lọt ra client.

RSC tách bạch: **Server Component** fetch/query DB trực tiếp, không ship JS; **Client Component** chỉ nhận UI + dữ liệu JSON để tương tác.

## Khái niệm cốt lõi

- **Server Component**: chạy trên server, có thể `async`/`await`, truy cập DB/secret trực tiếp, **không** dùng `useState`/`useEffect`/`onClick`. Không có JS gửi xuống client.
- **Client Component**: đánh dấu `"use client"`, chạy cả trên server (SSR lần đầu) lẫn client; dùng được state, effect, event handler. JS của nó được ship xuống browser.
- **Boundary**: `"use client"` tạo ranh giới. Mọi thứ **import từ** Client Component (và con của nó) đều thành client. Server Component có thể render Client Component; ngược lại Client Component **không thể** `import` Server Component (trừ khi truyền qua `children` prop).
- **Serialization boundary**: props đi từ Server → Client phải **serializable** — không phải function, class instance, hay `Date` "thô" theo nghĩa tùy tiện. Chỉ dùng dữ liệu giống JSON (string, number, boolean, array, plain object, null) và một số kiểu được RSC hỗ trợ.

## Cú pháp / API

```tsx
// Server Component (mặc định) — KHÔNG có "use client"
export default async function Page() {
  const data = await db.query(); // chạy trên server
  return <ClientWidget data={data} />;
}

// Client Component — bắt buộc directive ở đầu file
'use client';
export function ClientWidget({ data }: { data: Item[] }) {
  // dùng được state / effect / event
}
```

Quy tắc nhanh:

| | Server Component | Client Component |
|--|------------------|------------------|
| Directive | (không có) | `"use client"` |
| `async/await` trong component | ✅ | ❌ |
| DB / secret / file system | ✅ | ❌ |
| `useState` / `useEffect` / `onClick` | ❌ | ✅ |
| Ship JS xuống browser | ❌ | ✅ |
| Import Client từ Server | ✅ | — |
| Import Server từ Client | ❌ (trừ qua `children`) | — |

## Luồng hoạt động (Flow)

1. Request tới một route trong App Router.
2. Server render cây **Server Component** trước (fetch DB/API, đọc secret).
3. Chỗ nào gặp Client Component, server đánh dấu một "lỗ" (hole) trong cây.
4. Server **serialize** cây UI (kèm props đã serialize) và gửi về browser.
5. Browser dựng lại cây, **hydrate** các Client Component ("ốc đảo").
6. Client Component chạy tương tác (state, event); Server Component **không** chạy lại ở client.
7. Cập nhật sau này (navigation/mutation) khiến server render lại phần tương ứng và stream xuống.

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

```tsx
// app/products/page.tsx — SERVER COMPONENT (không 'use client')
type Product = { id: string; name: string; price: number };

async function getProducts(): Promise<Product[]> {
  // Chạy trên server: query DB / fetch API nội bộ trực tiếp.
  await new Promise((r) => setTimeout(r, 300)); // giả lập độ trễ DB
  return [
    { id: 'p1', name: 'Bàn phím cơ', price: 1_900_000 },
    { id: 'p2', name: 'Chuột công thái học', price: 900_000 },
  ];
}

// `async function` ngay trong component — đặc quyền của Server Component.
export default async function ShopPage() {
  const products = await getProducts(); // await trực tiếp, không useEffect
  return (
    <div>
      <h2>Shop — Server Component (RSC)</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} — {p.price.toLocaleString('vi-VN')}đ{' '}
            {/* Nhúng Client island vào cây Server — hợp lệ */}
            <AddToCart id={p.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// components/AddToCart.tsx — CLIENT ISLAND
// 'use client';
// import { useState } from 'react';
// export function AddToCart({ id }: { id: string }) {
//   const [count, setCount] = useState(0);
//   return <button onClick={() => setCount(count + 1)}>Thêm ({count})</button>;
// }

// Demo self-contained: bản client minh họa island
'use client';
import { useState } from 'react';

export function AddToCart({ id }: { id: string }) {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => { setCount(count + 1); console.log('add', id); }}>
      Thêm ({count})
    </button>
  );
}
```

## Giải thích từng phần

- **`async function ShopPage()`** — Server Component có thể là hàm `async`; `await` chạy trên server trước khi gửi HTML. Không cần `useEffect` để fetch.
- **`getProducts()`** — truy cập DB/API trực tiếp, không qua REST endpoint trung gian. Code này **không** có trong bundle client.
- **`<AddToCart id={p.id} />`** — nhúng Client island vào cây Server. Props `id` là string ⇒ **serializable**, hợp lệ qua boundary.
- **`'use client'` trong `AddToCart`** — đánh dấu ranh giới. `useState` và `onClick` chỉ tồn tại trong nhánh client này.
- **`id` là string** — chú ý kiểu dữ liệu truyền qua boundary phải đơn giản (không function, không class instance).

## So sánh với cách làm cũ

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| `getServerSideProps` / `getStaticProps` | `await` trực tiếp trong Server Component | Colocate fetch cạnh UI, ít boilerplate |
| Fetch API rồi hydrate ở client | Query DB trực tiếp trên server | Bỏ waterfall, không cần REST trung gian |
| Cả trang là client bundle | Chỉ island tương tác là client | Bundle nhỏ, tải nhanh |
| Khó kiểm soát secret | Secret chỉ ở Server Component | Không lộ API key/DB URL ra client |

## Lỗi thường gặp

1. **Dùng `useState`/`onClick` trong Server Component** ⇒ lỗi build. *Fix:* tách phần tương tác ra Client Component có `"use client"`.
2. **Truyền function/class instance/Date "thô" qua boundary** ⇒ lỗi serialize. *Fix:* chỉ truyền dữ liệu JSON-like (string/number/array/plain object).
3. **`import` Server Component từ Client Component** ⇒ lỗi. *Fix:* truyền Server Component qua `children` prop thay vì import trực tiếp.
4. **Đặt `"use client"` quá cao (ở layout gốc)** ⇒ cả cây thành client, mất lợi ích RSC. *Fix:* đẩy `"use client"` xuống leaf island.
5. **Đọc `process.env.SECRET` trong Client Component** ⇒ lộ ra bundle. *Fix:* chỉ đọc secret trong Server Component; client dùng biến `NEXT_PUBLIC_` cho giá trị công khai.

## Khi nào dùng / Khi nào không

**Server Component (mặc định):**
- Fetch dữ liệu, query DB, đọc secret, render markdown, SEO content.
- Mọi thứ **không** cần tương tác.

**Client Component (`"use client"`):**
- Form/input, state, effect, animation, drag-drop, event handler.
- Đặt **càng thấp càng tốt** — island ở leaf để bundle client tối thiểu.

**Không nên:** biến cả page/layout thành client chỉ vì một nút nhỏ cần `onClick`.

## Bài tập nhỏ

Viết một `app/posts/page.tsx` (Server Component) `await` danh sách bài viết giả, render mỗi bài kèm một `LikeButton` (Client island) nhận `postId: string`. Đảm bảo `LikeButton` có `"use client"` + `useState`, và props truyền qua boundary chỉ gồm string.

## Reference

- [Server Components (react.dev)](https://react.dev/reference/rsc/server-components)
- [`"use client"` directive](https://react.dev/reference/rsc/use-client)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server vs Client Components (Next.js)](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
