# 1. App Router — Server vs Client Component

## Mô tả

**React Server Components (RSC)** là mô hình render chính thức **stable trong React 19 (12/2024)**. Trong Next.js **App Router**, mọi component **mặc định là Server Component**: render trên **server**, không ship JavaScript xuống browser. Chỉ những "ốc đảo tương tác" (islands) cần state/effect/event mới đánh dấu `"use client"`.

Hãy hình dung cả trang web như một nhà hàng: nhà bếp (server) chế biến món chính — làm việc nặng nhọc, khách không cần thấy; chỉ có bàn ăn (client island) là nơi khách thực sự cầm đũa tương tác. RSC chính là triết lý "nhà bếp làm hết việc nặng, client chỉ nhận thành phẩm".

Framework hỗ trợ RSC: Next.js App Router, React Router, Waku... Giao tiếp Server → Client chủ yếu qua **props serializable**.

> **Tóm gọn 1 câu:** App Router mặc định mọi thứ là Server Component — chỉ đánh dấu `"use client"` ở "ốc đảo" cần tương tác, giúp bundle gọn tối đa.

## Mục tiêu

- Hiểu Server Component là gì và vì sao mặc định trong App Router.
- Biết khi nào cần `"use client"` và đặt boundary ở đâu cho hợp lý.
- Nắm quy tắc **serialization** khi truyền props qua boundary Server → Client.

## Vấn đề giải quyết

Mục này kể "câu chuyện trước khi có RSC" để bạn hiểu vì sao mô hình mới ra đời — đọc để thấy được lợi ích cụ thể thay vì nghe suông.

Trước RSC, Pages Router trộn lẫn việc render và fetch giữa client–server:

- **Bundle phình** — thư viện nặng (markdown parser, date lib, DB client) lọt xuống browser.
- **Fetch chậm** — dữ liệu thường phải lấy qua API rồi hydrate ở client, gây waterfall.
- **Không rõ ràng** — khó biết đoạn code nào chạy ở đâu, secret dễ lọt ra client.

RSC tách bạch: **Server Component** fetch/query DB trực tiếp, không ship JS; **Client Component** chỉ nhận UI + dữ liệu JSON để tương tác.

> **Tóm gọn 1 câu:** RSC "về về" việc nặng về server — bundle nhỏ hơn, fetch nhanh hơn, secret không còn lọt ra client.

## Khái niệm cốt lõi

Mục này định nghĩa 4 thuật ngữ nền của cả chương: Server Component, Client Component, Boundary và Serialization. Nắm 4 khái niệm này là hiểu được 80% RSC.

- **Server Component**: chạy trên server, có thể `async`/`await`, truy cập DB/secret trực tiếp, **không** dùng `useState`/`useEffect`/`onClick`. Không có JS gửi xuống client.
- **Client Component**: đánh dấu `"use client"`, chạy cả trên server (SSR lần đầu) lẫn client; dùng được state, effect, event handler. JS của nó được ship xuống browser.
- **Boundary**: `"use client"` tạo ranh giới. Mọi thứ **import từ** Client Component (và con của nó) đều thành client. Server Component có thể render Client Component; ngược lại Client Component **không thể** `import` Server Component (trừ khi truyền qua `children` prop).
- **Serialization boundary**: props đi từ Server → Client phải **serializable** — không phải function, class instance, hay `Date` "thô" theo nghĩa tùy tiện. Chỉ dùng dữ liệu giống JSON (string, number, boolean, array, plain object, null) và một số kiểu được RSC hỗ trợ. Ví von: bưu kiện xuyên biên giới chỉ nhận đồ phẳng, đóng hộp chuẩn — function hay class instance là "đồ cồng kềnh" không gửi được.

> **Tóm gọn 1 câu:** Server Component = "đầu bếp", Client Component = "bàn ăn", boundary = "cửa ra vào" chỉ cho dữ liệu JSON-like đi qua.

## Cú pháp / API

Mục này tổng hợp quy tắc "ai được làm gì" giữa hai loại component dưới dạng bảng đối chiếu — dùng như tờ cheat sheet khi nghi ngờ component của mình thuộc phe nào.

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

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

> **Cách đọc bảng này:** đọc theo từng hàng — hàng nào có ✅ ở cột Server nghĩa là Server Component được phép làm việc đó (và ngược lại). Hai cột giữa chính là "hai thái độ sống" của component: server lo việc nặng, client lo tương tác.

## Luồng hoạt động (Flow)

Mục này đi qua 7 bước một request đi từ browser tới server và ngược lại — theo dõi để hiểu "cái lỗ" (hole) và hydration hoạt động ra sao.

1. Request tới một route trong App Router.
2. Server render cây **Server Component** trước (fetch DB/API, đọc secret).
3. Chỗ nào gặp Client Component, server đánh dấu một "lỗ" (hole) trong cây.
4. Server **serialize** cây UI (kèm props đã serialize) và gửi về browser.
5. Browser dựng lại cây, **hydrate** các Client Component ("ốc đảo").
6. Client Component chạy tương tác (state, event); Server Component **không** chạy lại ở client.
7. Cập nhật sau này (navigation/mutation) khiến server render lại phần tương ứng và stream xuống.

Hãy ví von cả luồng như giao đồ ăn tận nơi: nhà bếp nấu xong (server render), đóng hộp (serialize), ship đi (stream về browser), khách mở hộp và ăn (hydrate + tương tác).

> **Tóm gọn 1 câu:** Server nấu trước — gặp chỗ tương tác thì "chừa lỗ" — serialize gửi về, browser hydrate "ốc đảo" để hoàn thiện.

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần

- **`async function ShopPage()`** — Server Component có thể là hàm `async`; `await` chạy trên server trước khi gửi HTML. Không cần `useEffect` để fetch.
- **`getProducts()`** — truy cập DB/API trực tiếp, không qua REST endpoint trung gian. Code này **không** có trong bundle client.
- **`<AddToCart id={p.id} />`** — nhúng Client island vào cây Server. Props `id` là string ⇒ **serializable**, hợp lệ qua boundary.
- **`'use client'` trong `AddToCart`** — đánh dấu ranh giới. `useState` và `onClick` chỉ tồn tại trong nhánh client này.
- **`id` là string** — chú ý kiểu dữ liệu truyền qua boundary phải đơn giản (không function, không class instance).

## So sánh với cách làm cũ

Mục này so sánh Pages Router thời "tiền RSC" với App Router hiện tại — nhìn bảng là thấy rõ mình được giải phóng khỏi những gì.

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| `getServerSideProps` / `getStaticProps` | `await` trực tiếp trong Server Component | Colocate fetch cạnh UI, ít boilerplate |
| Fetch API rồi hydrate ở client | Query DB trực tiếp trên server | Bỏ waterfall, không cần REST trung gian |
| Cả trang là client bundle | Chỉ island tương tác là client | Bundle nhỏ, tải nhanh |
| Khó kiểm soát secret | Secret chỉ ở Server Component | Không lộ API key/DB URL ra client |

> **Cách đọc bảng này:** đọc ngang từng hàng để thấy "nỗi đau cũ → giải pháp mới → phần thưởng"; dùng làm argument thuyết phục khi propose chuyển project sang App Router.

## Lỗi thường gặp

Mục này là "danh sách điểm danh" 5 lỗi kinh điển khi mới chuyển sang RSC — mỗi lỗi kèm thuốc chữa ngay cạnh.

1. **Dùng `useState`/`onClick` trong Server Component** ⇒ lỗi build. *Fix:* tách phần tương tác ra Client Component có `"use client"`.
2. **Truyền function/class instance/Date "thô" qua boundary** ⇒ lỗi serialize. *Fix:* chỉ truyền dữ liệu JSON-like (string/number/array/plain object).
3. **`import` Server Component từ Client Component** ⇒ lỗi. *Fix:* truyền Server Component qua `children` prop thay vì import trực tiếp.
4. **Đặt `"use client"` quá cao (ở layout gốc)** ⇒ cả cây thành client, mất lợi ích RSC. *Fix:* đẩy `"use client"` xuống leaf island.
5. **Đọc `process.env.SECRET` trong Client Component** ⇒ lộ ra bundle. *Fix:* chỉ đọc secret trong Server Component; client dùng biến `NEXT_PUBLIC_` cho giá trị công khai.

## Khi nào dùng / Khi nào không

Mục này vẽ ranh giới "việc của ai": việc nặng ai làm, tương tác ai làm — phân vân chỗ nào thì tra bảng này.

**Server Component (mặc định):**
- Fetch dữ liệu, query DB, đọc secret, render markdown, SEO content.
- Mọi thứ **không** cần tương tác.

**Client Component (`"use client"`):**
- Form/input, state, effect, animation, drag-drop, event handler.
- Đặt **càng thấp càng tốt** — island ở leaf để bundle client tối thiểu.

**Không nên:** biến cả page/layout thành client chỉ vì một nút nhỏ cần `onClick`.

## Bài tập nhỏ

Viết một `app/posts/page.tsx` (Server Component) `await` danh sách bài viết giả, render mỗi bài kèm một `LikeButton` (Client island) nhận `postId: string`. Đảm bảo `LikeButton` có `"use client"` + `useState`, và props truyền qua boundary chỉ gồm string.

> **Tóm gọn 1 câu:** App Router là "nhà hàng": đầu bếp server làm món chính, "ốc đảo" client chỉ để khách cầm đũa — nhớ gửi qua boundary chỉ đồ phẳng (JSON-like).

## Reference

- [Server Components (react.dev)](https://react.dev/reference/rsc/server-components)
- [`"use client"` directive](https://react.dev/reference/rsc/use-client)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server vs Client Components (Next.js)](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
