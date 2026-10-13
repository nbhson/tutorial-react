# 4. Partial Pre-rendering (PPR)

## Mô tả
- Bài này giới thiệu **Partial Pre-rendering (PPR)** — kết hợp static shell + dynamic holes trong **một response**, ra mắt trong React 19.2 (**10/2025**).
- API core: **`prerender`** (`react-dom/static`) và **`resume` / `resumeToPipeableStream`** (`react-dom/server`) — trong React core vẫn mang cờ **`unstable_`**, thường dùng qua framework (Next.js `experimental_ppr`).
- Ý tưởng: pre-render toàn page thành **shell tĩnh** (cache ở CDN), phần động nằm trong `<Suspense>` được **resume** và stream về sau.

## Mục tiêu
- Hiểu vì sao PPR nằm giữa "full static" và "full dynamic SSR", và lợi ích TTFB.
- Biết cấu trúc App: shell tĩnh + các `<Suspense>` hole có fallback skeleton riêng.
- Nắm giới hạn: API `unstable_`, cần framework hỗ trợ để lo streaming/resume.

## Vấn đề giải quyết
- **Full static**: nhanh (CDN) nhưng data cũ — mỗi lần đổi phải rebuild; không hợp dữ liệu theo user.
- **Full dynamic SSR**: data tươi nhưng **TTFB chậm** — phải chờ query chậm nhất xong mới trả HTML; một widget chậm làm cả trang chậm.
- **PPR**: shell (header/layout/skeleton) pre-render và cache; các hole phụ thuộc user/session (giỏ hàng, feed cá nhân) được tính toán và stream sau → vừa nhanh (shell có sẵn) vừa tươi (hole stream).

## Khái niệm cốt lõi
- **Static shell**: phần không phụ thuộc request — layout, nav, nội dung chung. Được **pre-render** một lần (build time/first request) và cache.
- **Dynamic holes**: phần phụ thuộc request/user — bọc trong `<Suspense>`; khi pre-render React "để lại lỗ" (postponed state), tới request thật sẽ **resume** để render phần này.
- **`prerender(element)`** (`react-dom/static`) trả `{ prelude, postponed }`: `prelude` là HTML shell; `postponed` là trạng thái để `resume`.
- **`resume(element, postponed)` / `resumeToPipeableStream`** (`react-dom/server`): render tiếp phần đã postpone và stream về client.
- **Frontend/Backend split**: shell không gọi `cookies()`/`headers()`/dynamic API; hole mới được phép.
- Trong Next.js: `export const experimental_ppr = true` bật PPR cho route; framework gọi prerender/resume hộ.

## Cú pháp / API

```tsx
import { Suspense } from 'react';
import { prerender } from 'react-dom/static';        // unstable_* trong core
import { resume } from 'react-dom/server';

// Build / first request:
const { prelude, postponed } = await prerender(<App />);
// -> gửi prelude (shell) cho client/CDN

// Request thật (hoặc khi hole cần dữ liệu):
const stream = await resume(<App />, postponed);
// -> stream phần dynamic về client

function App() {
  return (
    <Layout>                          {/* static — shell */}
      <Suspense fallback={<Skeleton />}>
        <PersonalFeed />              {/* dynamic hole — stream sau */}
      </Suspense>
    </Layout>
  );
}
```

## Luồng hoạt động (Flow)

1. Build/first render: `prerender(<App/>)` render shell; gặp `<Suspense>` động → ghi lại **postponed**, để fallback trong shell.
2. Shell (đã có skeleton) served ngay từ CDN → **TTFB rất thấp**.
3. Request/user tới: `resume(<App/>, postponed)` chạy phần hole với dữ liệu thật.
4. React **stream** kết quả hole về → client thay skeleton bằng nội dung thật.
5. CDN shell dùng chung; hole luôn tươi theo request.

## Ví dụ chi tiết

```tsx
// example.tsx — cấu trúc App PPR (React 19.2)
import { Suspense } from 'react';

// Shell tĩnh — pre-render 1 lần, cache ở CDN.
function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>
        <h2>Shop — Partial Pre-rendering (React 19.2)</h2>
        <nav>Home | Sản phẩm | Liên hệ</nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

// Hole động 1: feed cá nhân — stream sau (query chậm).
async function PersonalFeed() {
  await new Promise((r) => setTimeout(r, 1200)); // giả lập query chậm
  return <p>Gợi ý cho bạn: Giày chạy bộ, Tai nghe BT</p>;
}

// Hole động 2: giỏ hàng theo session — stream sau.
async function CartBadge() {
  await new Promise((r) => setTimeout(r, 600));
  return <p>Giỏ hàng: 3 món</p>;
}

function FeedSkeleton() {
  return <p>Đang tải gợi ý...</p>;
}

// Trong Next.js PPR: export const experimental_ppr = true
// Framework tự gọi prerender/resume: shell trả ngay, 2 hole stream dần.
export default function ShopPage() {
  return (
    <ShopLayout>
      <Suspense fallback={<FeedSkeleton />}>
        <PersonalFeed />
      </Suspense>
      <Suspense fallback={<p>Đang tải giỏ hàng...</p>}>
        <CartBadge />
      </Suspense>
    </ShopLayout>
  );
}
```

## Giải thích từng phần
- `ShopLayout` = shell tĩnh: header/nav giống nhau mọi user → pre-render, cache.
- Mỗi hole bọc trong `<Suspense>` **riêng** với fallback riêng → có thể stream độc lập, thay vì chờ tất cả.
- `PersonalFeed`/`CartBadge` async → React suspends chúng; trong PPR, chúng thuộc "postponed", render ở bước resume.
- Không có `cookies()`/`headers()` trong shell — đó là điều kiện để shell tĩnh được.

## So sánh với cách làm cũ

| Chiến lược | TTFB | Độ tươi dữ liệu | Ghi chú |
|---|---|---|---|
| Full static (SSG) | Rất nhanh | Cũ (rebuild mới đổi) | Không hợp data per-user |
| Full dynamic SSR / `force-dynamic` | Chậm | Tươi | Chờ query chậm nhất |
| **PPR** | Nhanh (shell CDN) | Tươi cho hole | Kết hợp tốt nhất cho page nửa tĩnh nửa động |

## Lỗi thường gặp
1. **Đặt `await`/dynamic API trong shell (ngoài Suspense)** → vì sao: shell mất tính tĩnh, không cache được → fix: đưa mọi phần phụ thuộc request vào hole `<Suspense>`.
2. **Không tách hole bằng `<Suspense>`** → vì sao: phần động kéo cả page chờ; PPR không phát huy → fix: bọc từng hole với fallback skeleton riêng.
3. **Kỳ vọng API stable** → vì sao: `prerender`/`resume` còn `unstable_`; dùng qua Next.js PPR → fix: bám flag framework, không gọi core trực tiếp khi không cần.
4. **Cho rằng PPR là "cache vĩnh viễn"** → vì sao: shell cache theo CDN cấu hình; hole luôn render theo request → fix: cấu hình revalidate/cache phù hợp cho shell.
5. **Toàn page đã tĩnh hoặc toàn page bắt buộc dynamic đồng bộ** mà vẫn bật PPR → vì sao: thừa hoặc không tách được hole → fix: dùng SSG hoặc dynamic SSR thẳng.

## Khi nào dùng / Khi nào không
- **Dùng**: page nửa tĩnh nửa động (ecommerce PDP, dashboard có layout chung + widget per-user, blog + comments cá nhân), shell cache CDN, hole phụ thuộc session.
- **Không dùng**: page hoàn toàn tĩnh (SSG đủ), hoặc toàn bộ nội dung phụ thuộc request không tách hole được — lúc đó static/dynamic SSR thuần tốt hơn.

## Bài tập nhỏ
- Dựng page "Sản phẩm": shell tĩnh (header + mô tả sản phẩm từ props), hole "Giá theo khu vực" và "Tồn kho" mỗi cái trong `<Suspense>` với skeleton riêng. Giả lập delay 800ms/1200ms. Quan sát HTML trả về: skeleton xuất hiện ngay, nội dung thật thay dần — và ghi chú nếu vô tình đặt `await` ra ngoài shell thì TTFB tăng thế nào.

## Reference
- [React 19.2 Release — Partial Pre-rendering](https://react.dev/blog/2025/10/01/react-19-2)
- [prerender (react-dom/static)](https://react.dev/reference/react-dom/static/prerender)
- [resume (react-dom/server)](https://react.dev/reference/react-dom/server/resume)
- [Next.js experimental_ppr](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#experimental_ppr)