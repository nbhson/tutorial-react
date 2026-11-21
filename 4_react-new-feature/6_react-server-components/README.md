# React Server Components (RSC)

**React Server Components (Server Components, Server Functions/Actions)** đạt **stable trong React 19 (12/2024)**. RSC cho phép render component **trên server**, gửi cây UI đã serialize về client, và **không ship JavaScript** của Server Component xuống browser — nhờ đó giảm mạnh bundle và cho phép truy cập dữ liệu/secret trực tiếp.

Hãy hình dung RSC như một cửa hàng bánh chuyên nghiệp: lò nướng (server) làm mọi việc nặng — nhào bột, nướng bánh; quầy bán (client) chỉ trưng bày thành phẩm cho khách chọn. Khách không bao giờ phải vác lò nướng về nhà (không ship JS).

Framework triển khai: **Next.js App Router**, React Router, Waku...

> **Tóm gọn 1 câu:** RSC render trên server và không ship JS — bundle nhẹ hơn, dữ liệu gần hơn, secret an toàn hơn.

## Tổng quan theo nhóm

Mục này là bản đồ 5 bài của chương: từ phân biệt Server/Client Component đến PPR. Đọc theo thứ tự số để đi từ nền móng lên nâng cao.

| # | Feature | Mô tả |
|---|---------|-------|
| 1 | [App Router (Server vs Client)](1_app-router/README.md) | Server Component mặc định, boundary `"use client"`, quy tắc serializable props |
| 2 | [Server Actions](2_server-actions/README.md) | `"use server"` — gọi hàm server từ form/client, `useActionState`, revalidate + redirect |
| 3 | [cache() & fetch caching](3_cache-fetch/README.md) | `cache()` dedupe, fetch cache (`force-cache`/`no-store`/`revalidate`), tags, `cacheSignal()` |
| 4 | [Streaming + loading.js + Suspense](4_streaming-loading/README.md) | Shell stream trước, hole stream sau; `loading.js` theo segment, `<Suspense>` thủ công theo vùng |
| 5 | [Prerender + PPR](5_static-prerender-ppr/README.md) | `react-dom/static` (`prerender`), Partial Prerendering: shell tĩnh prerender lúc build + hole động stream runtime |

> **Cách đọc bảng này:** mỗi dòng là một bài con, xếp từ nền tảng (bài 1) đến nâng cao (bài 5); click vào cột Feature để vào bài chi tiết, cột Mô tả để xem trước nội dung.

## ĐÁNH GIÁ TỔNG QUAN

Mục này đánh giá RSC như một "món hàng" trước khi bạn đầu tư chuyển project: mạnh ở đâu, cẩn trọng ở đâu, dùng thế nào cho đúng.

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

Ví von tư duy tổng thể: RSC là "nhà bếp làm hết việc nặng, quầy chỉ bày món" — mọi quy tắc (boundary, serialization, cache, streaming) đều xoay quanh nguyên lý đó.

> **Tóm gọn 1 câu:** Mặc định server, tương tác thì island client đặt thấp nhất có thể, mutation qua Server Action có auth, fetch bọc `cache()`.

## Cú pháp nhanh

Mục này gom những đoạn code "xương sống" của RSC — mở ra là thấy đủ pattern dùng hằng ngày.

> 📄 **Code ví dụ:** [`examples/01-cu-phap-nhanh.tsx`](examples/01-cu-phap-nhanh.tsx)

> 📄 **Code ví dụ:** [`examples/02-cu-phap-nhanh.tsx`](examples/02-cu-phap-nhanh.tsx)

> 📄 **Code ví dụ:** [`examples/03-cu-phap-nhanh.tsx`](examples/03-cu-phap-nhanh.tsx)

> 📄 **Code ví dụ:** [`examples/04-cu-phap-nhanh.tsx`](examples/04-cu-phap-nhanh.tsx)

## Tính năng quan trọng khác

Mục này liệt kê các API "vệ tinh" quanh RSC — từ streaming, cache cho tới bảo mật secret.

| Feature | Mô tả | Ghi chú |
|---------|-------|---------|
| Streaming SSR | `<Suspense>` boundary stream dần | Kết hợp RSC |
| `use()` unwrap promise | Server truyền promise → client unwrap bằng `use()` | Pattern chuẩn |
| `cache()` | Dedupe theo args trong 1 request | Từ `react` |
| `cacheSignal()` | Trả `AbortSignal` khi vòng đời `cache()` kết thúc | React 19.2, RSC-only |
| `unstable_cache` | Cache kết quả hàm non-fetch với key + tags | Next.js |
| `taintObjectReference` | Chặn leak secret qua Server → Client props | Security API |

> **Cách đọc bảng này:** mỗi dòng một API, cột "Mô tả" nói nó làm gì, cột "Ghi chú" cho biết nguồn gốc và điều kiện dùng (React hay Next, version nào) — chi tiết từng API nằm ở các bài 3–5.

## Yêu cầu

Mục này là "điều kiện dự thi" để chạy được RSC trong project.

- React 19+ (RSC stable từ 12/2024).
- Next.js 14+ (khuyến nghị 15+; Next 16 hỗ trợ tốt hơn).
- Node.js 18+.

## Chạy thử

Mục này là lệnh khởi động project mẫu để xem RSC hoạt động tận mắt.

> 📄 **Code ví dụ:** [`examples/05-chay-thu.sh`](examples/05-chay-thu.sh)

## Tài liệu tham khảo

- [Server Components (react.dev)](https://react.dev/reference/rsc/server-components)
- [`"use client"`](https://react.dev/reference/rsc/use-client)
- [`"use server"`](https://react.dev/reference/rsc/use-server)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js — Fetching, Caching & Revalidating](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
