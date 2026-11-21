# 3. `cache()`, fetch caching & Revalidation

## Mô tả

RSC cung cấp một **data layer nhiều tầng** để kiểm soát việc lấy và cache dữ liệu. Hãy hình dung như ba tầng tủ lạnh: ngăn đá (cache xuyên request), khung mì tự hủy sau bữa ăn (dedupe trong request), và nút "vứt đồ cũ" (revalidation). Ba tầng chính:

1. **`cache()`** (từ `react`) — dedupe lời gọi hàm **theo args trong một request**.
2. **fetch caching** (Next.js) — cache dữ liệu **xuyên request** với `cache: 'force-cache' | 'no-store'` và `next: { revalidate, tags }`.
3. **Revalidation** — xóa cache có chủ đích sau mutation bằng `revalidatePath` / `revalidateTag`, kết hợp `unstable_cache`.

Ngoài ra **`cacheSignal()`** (**React 19.2**, chỉ dùng trong RSC) trả về một `AbortSignal` khi vòng đời của `cache()` kết thúc — hữu ích để hủy công việc không còn cần thiết.

> **Tóm gọn 1 câu:** Data layer của RSC gồm 3 tầng — `cache()` dedupe trong request, fetch cache xuyên request, và `revalidate*` để xóa cache có chủ đích.

## Mục tiêu

- Hiểu `cache()` dedupe trong request và phân biệt với fetch cache xuyên request.
- Cấu hình `fetch` cache tường minh (`force-cache`, `no-store`, `next.revalidate`, tags).
- Biết revalidate đúng scope sau mutation và dùng `cacheSignal()` để hủy việc.

## Vấn đề giải quyết

Mục này nêu hai thái cực dữ liệu: fetch trùng lặp lãng phí và cache sai hư hại — đọc để hiểu vì sao cần phân biệt rõ từng tầng cache.

Hai vấn đề trái ngược:

- **Fetch trùng lặp**: nhiều Server Component trong cùng một render cần chung một record (ví dụ user hiện tại) ⇒ gọi API/DB N lần thừa.
- **Cache sai**: cache quá tay ⇒ dữ liệu cũ; không cache ⇒ chậm. Đặc biệt Next.js 14 và 15+ có **default fetch cache khác nhau**, khiến hành vi thay đổi khi nâng cấp.

Ba tầng giải quyết riêng biệt: **dedupe trong request** (`cache()`), **cache xuyên request** (`fetch` options), và **xóa cache có chủ đích** (`revalidate*`).

> **Tóm gọn 1 câu:** Hai bệnh "fetch thừa" và "cache sai" được chữa bởi ba loại thuốc riêng — `cache()`, fetch options, và `revalidate*`.

## Khái niệm cốt lõi

Mục này định nghĩa từng API một — đây là phần "học thuộc" nhất của bài, đọc chậm từng bullet để phân biệt phạm vi sống của mỗi loại cache.

- **`cache(fn)`** — bọc một hàm async; trong **cùng một request**, các lời gọi `cache(fn)(cùngArgs)` chỉ thực thi hàm **một lần**, các lần sau trả kết quả đã lưu. Ví von: trong một bữa ăn, gọi món "cà phê sữa" 3 lần thì quán pha đúng 1 ly rồi dọn ra lại — nhưng qua bữa khác (request khác) là pha ly mới. Khác React.memo: dedupe sống theo phạm vi request.
- **`cacheSignal()`** (**React 19.2**, RSC-only) — gọi bên trong một hàm `cache()` để lấy `AbortSignal`. Khi vòng đời của `cache()` kết thúc, signal bị abort ⇒ bạn hủy fetch/tác vụ dài không còn cần.
- **fetch cache (Next)**:
  - `cache: 'force-cache'` — dùng cache (mặc định cũ).
  - `cache: 'no-store'` — luôn fetch mới, không cache.
  - `next: { revalidate: 60 }` — cache tối đa 60 giây (ISR).
  - `next: { tags: ['posts'] }` — gắn tag để revalidate theo tag.
- **`unstable_cache`** — cache kết quả một hàm (kể cả query DB không phải `fetch`) với key + tags.
- **Revalidation**: `revalidatePath('/path')` làm mới theo route; `revalidateTag('tag')` làm mới mọi mục gắn tag đó.
- **Khác biệt version**: default `fetch` cache **khác nhau giữa Next 14 và 15+**. Ví von như mặc định của công tắc đèn đổi giữa hai đời nhà: bật lên hay tắt đi là tùy đời — vì vậy **luôn khai báo rõ** `cache`/`revalidate`, đừng dựa vào mặc định.

> **Tóm gọn 1 câu:** Mỗi API một "tuổi thọ" khác nhau — `cache()` sống đúng một request, fetch cache sống xuyên request, `revalidate*` là nút xóa có chủ đích.

## Cú pháp / API

Mục này là bảng tra nhanh "nhu cầu → API": đang cần gì thì dò đúng dòng đó lấy đúng công cụ.

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

Bảng chọn tầng:

| Nhu cầu | API | Phạm vi |
|---------|-----|---------|
| Dedupe cùng request | `cache()` | 1 request |
| Cache có TTL | `fetch(..., { next: { revalidate } })` | xuyên request |
| Không cache | `fetch(..., { cache: 'no-store' })` | — |
| Cache hàm non-fetch | `unstable_cache(fn, keys, { tags })` | xuyên request |
| Xóa cache sau mutation | `revalidatePath` / `revalidateTag` | xuyên request |
| Hủy việc khi request xong | `cacheSignal()` | 1 request |

> **Cách đọc bảng này:** bắt đầu từ cột "Nhu cầu" (viết bằng ngôn ngữ bài toán của bạn), dò sang cột "API" để lấy công cụ, và xem cột "Phạm vi" để biết cache sống bao lâu — 1 request hay xuyên request.

## Luồng hoạt động (Flow)

Mục này mô tả 6 bước dữ liệu đi qua các tầng cache trong một request — từ lúc gọi helper đến lúc mutation xóa cache.

1. Server Component gọi helper đã bọc `cache()`.
2. Lần gọi đầu trong request thực thi fetch/DB; các lần sau cùng args trả cache.
3. Nếu `fetch` có `revalidate`/`tags`, kết quả được cache xuyên request ở data cache của Next.
4. Mutation (Server Action) chạy xong → `revalidatePath`/`revalidateTag`.
5. Next xóa cache tương ứng; request kế tiếp lấy dữ liệu mới.
6. `cacheSignal()` abort các tác vụ khi vòng đời `cache()` kết thúc (React 19.2).

> **Tóm gọn 1 câu:** Request đi qua các tầng: `cache()` chặn fetch trùng, fetch options cache xuyên request, mutation xong thì `revalidate*` dọn đúng chỗ cần dọn.

## Ví dụ chi tiết

Mục này chứng minh `cache()` hoạt động thật qua console log — thấy tận mắt 3 card nhưng chỉ 2 lần fetch.

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần

- **`cache(async (id) => ...)`** — bọc `getUser`. Trong cùng request, `getUser('1')` gọi hai lần (cho hai `UserCard`) chỉ thực thi fetch **một lần**; console in `[fetch] user 1` đúng một lần.
- **`console.log`** — dùng để *chứng minh* dedupe: bạn thấy 2 dòng log (`user 1`, `user 2`) dù có 3 card.
- **`use(getUser(id))`** — `use()` unwrap promise bên trong `Suspense`; đây là pattern chuẩn để Server Component truyền promise xuống và client đọc.
- **`Suspense fallback`** — trong khi promise chưa resolve, hiển thị "Đang tải...".
- **Ghi chú `next.revalidate`/`tags`** — trong Next.js, thêm `next: { revalidate: 60, tags: ['users'] }` để cache xuyên request và có thể revalidate.
- **`revalidateTag('users')` / `revalidatePath('/users')`** — gọi trong Server Action sau khi sửa dữ liệu user để xóa cache đúng scope.

## So sánh với cách làm cũ

Mục này đối chiếu cách "tự chế cache" trước đây với các API chuẩn hóa bây giờ — từng hàng là một việc không còn phải tự làm.

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| Tự lưu cache trong `useState`/context | `cache()` dedupe theo request | Không fetch trùng, không code thủ công |
| Dựa vào default fetch cache | Khai báo rõ `cache` + `next.revalidate` | Hành vi ổn định qua các version Next |
| Invalidate bằng reload cả trang | `revalidatePath` / `revalidateTag` | Xóa cache đúng scope, không nặng |
| Query DB không cache được | `unstable_cache` bọc hàm | Cache cả non-fetch với tags |
| Fetch treo khi request kết thúc | `cacheSignal()` (React 19.2) | Hủy việc không còn cần |

> **Cách đọc bảng này:** đọc ngang từng hàng để thấy "cách chắp vá cũ → API chuẩn mới → lợi ích"; cột giữa chính là thứ nên tra lại khi cần dùng.

## Lỗi thường gặp

Mục này là 5 lỗi cache "đau nhất" — từ hành vi đổi bất ngờ khi nâng cấp Next cho tới lộ dữ liệu người khác vì cache theo user.

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

> **Tóm gọn 1 câu:** Chọn tầng cache theo tính chất dữ liệu: ít đổi thì cache có TTL, theo user thì `no-store`, DB query thì `unstable_cache` — đừng "cache đại trà".

## Bài tập nhỏ

Bọc `getUser(id)` bằng `cache()` rồi render ba `UserCard` với id `1, 1, 2`. Kiểm tra console chỉ có **2** lần fetch. Sau đó thêm `next: { revalidate: 60, tags: ['users'] }` và viết một Server Action `refreshUser()` gọi `revalidateTag('users')` — mô tả điều gì xảy ra với các request tiếp theo.

> **Tóm gọn 1 câu:** Ba tầng cache như ba ngăn tủ lạnh: ngăn đá (xuyên request), khay trong bữa ăn (trong request), và nút vứt đồ cũ (revalidate) — nhớ tuổi thọ từng ngăn là không còn nhầm.

## Reference

- [`cache()` (react.dev)](https://react.dev/reference/react/cache)
- [`cacheSignal()` (react.dev)](https://react.dev/reference/react/cacheSignal)
- [Next.js — Fetching, Caching & Revalidating](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [`unstable_cache`](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
