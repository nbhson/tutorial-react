# 4. Streaming + loading.js + `<Suspense>` theo route

## Mô tả

Streaming SSR cho phép server **gửi HTML về browser theo từng mảnh** thay vì chờ toàn bộ trang render xong mới trả. Người dùng thấy **shell** (layout, header, phần tĩnh) gần như ngay lập tức; phần dữ liệu chậm stream đến sau, khít chỗ `<Suspense>` fallback đang hiển thị. Đây là cơ chế built-in của **Next.js App Router** (qua `loading.js` và `<Suspense>`) và của React 18+ SSR (`renderToPipeableStream`).

Ba tầng trong bài này:

1. **`loading.js` theo route segment** — Next tự bọc segment trong `<Suspense>`, fallback tự động.
2. **`<Suspense>` thủ công trong Server Component** — chia page thành nhiều vùng với thời gian tải khác nhau (granularity do bạn quyết).
3. **Streaming ở tầng nền** — `renderToPipeableStream` (Node) / `renderToReadableStream` (Web streams) gửi shell trước, hole sau; RSC payload cũng stream theo.

## Mục tiêu

- Hiểu pipeline streaming: shell trước → hole → stream dần → thay fallback.
- Dùng được `loading.js` theo route và biết nó bọc Suspense ở đâu.
- Biết đặt `<Suspense>` thủ công sát phần chậm để không fallback cả trang.
- Phân biệt **streaming SSR** với **Suspense client-side** (lazy code-split của DAY 13) — cùng tên hook, khác đường ống.

## Vấn đề giải quyết

SSR "classic" (React 17) phải `await` **mọi** data của trang rồi mới gửi HTML:

- **TTFB (Time To First Byte) chậm** — 1 query chậm 2s làm cả trang trắng 2s dù header/menu sẵn sàng ngay.
- **All-or-nothing** — không có khái niệm "phần nhanh hiện trước".
- **Skeleton tự viết tay** — mỗi trang tự quản loading state, không đồng bộ với data thật.

Streaming giải quyết: server trả shell + skeleton ngay, mỗi phần data xong thì stream thêm — TTFB và First Paint giảm mạnh, phần chậm không chặn phần nhanh.

## Khái niệm cốt lõi

- **Shell** — phần HTML render được ngay (layout, header, nội dung tĩnh, những Server Component không chờ data). Gửi đi trong response đầu tiên.
- **Hole** — chỗ trong cây mà data chưa xong. Server **không chờ** hole: gửi placeholder trước, khi data xong thì stream đoạn HTML/RSC payload để thay chỗ đó.
- **`loading.js`** — file đặc biệt theo segment trong App Router. Next bọc segment đó trong `<Suspense fallback={<Loading/>}>` cho bạn; mỗi segment có loading riêng ⇒ loading "nested" theo route, không phải 1 loading cho cả app.
- **`<Suspense>` thủ công** — bọc trực tiếp component async chậm trong page: vùng nào chậm chỉ fallback vùng đó. Đây là cách đạt **granularity nhỏ hơn** loading.js (cấp component thay vì cấp route).
- **Streaming ≠ Suspense client-side** — Suspense client (DAY 13) bắt việc *tải code* (lazy chunk) trên browser; streaming SSR là việc *render và gửi HTML* từ server. Cùng cơ chế "suspend → fallback", khác môi trường.

## Cú pháp / API

```tsx
// app/dashboard/loading.tsx — Next tự bọc segment này trong <Suspense>
export default function Loading() {
  return <DashboardSkeleton />; // hiện khi segment này (và con nó) đang stream
}
```

```tsx
// app/dashboard/page.tsx — Server Component async, stream thủ công theo vùng
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Vùng nhanh — render cùng shell */}
      <Revenue />
      {/* Vùng chậm — stream sau, fallback hiện trước */}
      <Suspense fallback={<ChartSkeleton />}>
        <SlowChart /> {/* async component, await 2s */}
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  );
}
```

```tsx
// app/layout.tsx — chỉ là server component thường; loading.js KHÔNG đặt ở layout gốc trừ khi muốn loading toàn app
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

Quy tắc nhanh:

| Cơ chế | Phạm vi | Ai khai báo | Khi nào dùng |
|---|---|---|---|
| `loading.js` | Theo route segment | File convention của Next | Loading mặc định cho cả segment (page + layout con) |
| `<Suspense>` thủ công | Cấp component trong page | Bạn tự bọc | Chia page thành vùng nhanh/chậm khác nhau |
| Shell + hole (tầng nền) | Toàn trang | Framework tự lo | Hiểu để debug, không viết tay trong App Router |

## Luồng hoạt động (Flow)

1. Request tới `/dashboard`. Server bắt đầu render cây Server Component.
2. Phần render **đồng bộ** (layout, header, section tĩnh) xong ngay → server **gửi shell HTML** về browser. Browser vẽ shell ngay — user không thấy màn trắng.
3. Component async chưa xong (`SlowChart` đang `await` query) → server chừa **hole** kèm fallback của `<Suspense>` gần nhất.
4. Browser hiển thị fallback (skeleton/spinner) đúng chỗ hole.
5. Data chậm resolve trên server → server render tiếp cây từ chỗ đó và **stream** đoạn HTML + RSC payload xuống.
6. React (client runtime) **thay fallback bằng nội dung thật** đúng vị trí, không reload trang, không re-render phần đã vẽ.
7. Thứ tự stream theo thứ tự hoàn thành — vùng nhanh hiện trước vùng chậm, bất kể vị trí trong cây.

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

```tsx
// app/dashboard/page.tsx — SERVER COMPONENT
type Sale = { id: string; total: number };

async function getRevenue() {
  await new Promise((r) => setTimeout(r, 200)); // nhanh — vào shell
  return { revenue: 52_400_000, orders: 131 };
}

async function getSlowChart() {
  await new Promise((r) => setTimeout(r, 2500)); // chậm — stream sau
  return [{ day: "T2", value: 12 }, { day: "T3", value: 19 }];
}

// Vùng nhanh: KHÔNG bọc Suspense — render cùng shell, hiện ngay
async function Revenue() {
  const sales = await fetchSales(); // ~200ms, nằm trong shell
  return <p>Doanh thu: {sales.revenue.toLocaleString("vi-VN")}đ</p>;
}

// Vùng chậm: bọc Suspense thủ công — chỉ vùng này fallback + stream sau
async function SlowChart() {
  const series = await getWeeklySales(); // 2s
  return <Chart data={series} />;
}

export default function DashboardPage() {
  return (
    <section>
      <h1>Dashboard</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <SlowChart />            {/* chậm — stream sau, không chặn phần trên */}
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />          {/* stream theo lượt xong của nó */}
      </Suspense>
    </div>
  );
}
```

```tsx
// app/dashboard/loading.tsx — fallback CẤP ROUTE (Next tự bọc Suspense)
export default function Loading() {
  return <DashboardSkeleton />; // hiện ngay khi segment /dashboard đang render
}
```

## Giải thích từng phần

- **`export default function Loading()`** — quy ước file của App Router. Next bọc `page.tsx` cùng segment trong `<Suspense fallback={<Loading/>}>`; chỉ tính cho segment đó, không ảnh hưởng segment anh em (`/settings` không có loading riêng thì không fallback).
- **`<Suspense fallback>` quanh `SlowChart`** — ranh giới do bạn đặt: phần trên page (`Revenue`) không chờ chart; chart xong đến đâu stream đến đó. Đây là "per-route + per-component" granularity — kiểm soát tốt hơn `loading.js`.
- **`async function` + `await` trong page** — giữ nguyên như bài 1; điểm mới là **không `await` tất cả ở đầu page** — đẩy phần chậm xuống component con có Suspense, phần nhanh vẫn hiện sớm.
- **Shell** — những gì render xong ngay (không await gì ngoài Suspense hole). Muốn shell nhỏ/ít JS thì giữ layout tĩnh, đẩy data vào island có Suspense.
- **Streaming RSC payload** — nếu hole chứa Server Component con, RSC payload stream kèm HTML; client hydrate khít vị trí. Không phải "AJAX gọi lại" — một kết nối, một luồng.

## So sánh với cách làm cũ

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| `getServerSideProps` chờ tất cả data | Shell stream ngay, hole đi sau | First paint ~ ngay cả khi data chậm |
| Loading state tự viết (`isLoading` + skeleton) | `loading.js` / `<Suspense fallback>` | Khai báo, khít từng segment/vùng |
| Spinner toàn trang khi 1 widget chậm | Fallback theo vùng | Widget chậm không chặn trang |
| TTFB chậm vì data chậm nhất quyết định | Shell không phụ thuộc data chậm | Core Web Vitals (LCP) tốt hơn |

## Lỗi thường gặp

1. **`await` mọi thứ ở đầu page rồi mới return JSX** ⇒ mất streaming — cả trang chờ query chậm nhất. *Fix:* đẩy `await` xuống component con, bọc `<Suspense>` cho phần chậm.
2. **Đặt `loading.js` ở `app/layout.tsx` gốc** ⇒ mọi navigation đều fallback toàn app, "nháy" skeleton vô nghĩa. *Fix:* đặt `loading.js` ở segment thực sự chậm (cấp page/section).
3. **Fallback to quá** (full-page skeleton) cho widget nhỏ ⇒ nháy khó chịu khi tải nhanh (< 300ms). *Fix:* fallback nhỏ, đúng vùng; hoặc fallback "tối thiểu" (spinner dòng).
4. **Nhầm Suspense streaming với Suspense lazy code** — cùng tên, khác việc: streaming bắt *data chưa render xong trên server*; lazy+Suspense bắt *chunk JS* tải trên client (DAY 13). Trong App Router, `loading.js` là data-streaming, không phải code-splitting.
5. **Quên metadata/SEO** — nội dung stream muộn vẫn có trong HTML cuối (crawler chờ đủ), nhưng nếu bọc cả `<h1>` chính trong hole thì LCP xấu. Giữ nội dung quan trọng ngoài hole chậm nhất.
6. **Streaming + `revalidate`/cache hiểu sai** — stream nhanh không đồng nghĩa data tươi; cache semantics vẫn do `fetch`/`cache()` quyết (bài 3).

## Khi nào dùng / Khi nào không

**Dùng streaming + Suspense theo route khi:**

- Page có **nhiều vùng tốc độ khác nhau** (hero nhanh, chart/bảng chậm) — Suspense thủ công từng vùng.
- Route segment chậm đều (mọi phần phụ thuộc 1 query) — `loading.js` cho segment là đủ.
- Shell quan trọng cho cảm giác nhanh (nav, header, layout brand).

**Không nên:**

- Suspense bọc *mọi thứ* với fallback spinner toàn trang — mất ý nghĩa chia vùng; fallback sát chỗ chậm.
- Streaming cho trang **cần data trước khi render** (redirect theo data, auth check cứng) — xử lý ở middleware/layout trước, đừng đổ vào hole.
- Lạm dụng hàng chục Suspense lồng nhau — skeleton nhiều tầng nhấp nháy còn khó chịu hơn chờ.

## Bài tập nhỏ

Dựng `app/orders/page.tsx` với 3 vùng: header tĩnh, bảng đơn hàng (`await` 300ms), biểu đồ doanh thu (`await` 2s). Yêu cầu: header hiện cùng shell; bảng có `loading.js` riêng theo segment; biểu đồ bọc `<Suspense>` với skeleton riêng. Kiểm tra bằng Network tab: thấy HTML đến 2 đợt (shell → chart).

## Reference

- [Streaming (react.dev)](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [`loading.js` — Next.js](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [`<Suspense>` (react.dev)](https://react.dev/reference/react/Suspense)
- [Streaming SSR — React docs](https://react.dev/reference/react-dom/server/renderToPipeableStream)
