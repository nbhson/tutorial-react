# 5. Prerender tĩnh (`react-dom/static`) + Partial Prerendering (PPR)

## Mô tả

React 19 cung cấp **`react-dom/static`** — bộ API prerender **tĩnh**: render component thành HTML **không phát đi ngay** (`prerender`) hoặc render phần tĩnh trước (shell) rồi xử lý phần động sau (`resumeAndPrerender`). Đây là nền móng cho **Partial Prerendering (PPR)** — được React 19.2 phát triển tiếp và Next.js 16 triển khai chính thức: **một trang = shell tĩnh (prerender lúc build, phục vụ tức thì từ CDN) + hole động stream lúc request**.

Trước PPR phải chọn một trong hai: trang tĩnh (SSG — nhanh nhưng stale) hoặc trang động (SSR/streaming — tươi nhưng chậm hơn). PPR cho **cả hai cùng lúc** trên cùng một route.

## Mục tiêu

- Hiểu `prerender()` của `react-dom/static` khác gì `renderToPipeableStream`.
- Nắm mô hình PPR: shell tĩnh prebuild + hole động stream runtime, boundary nào tách chúng.
- Cấu hình PPR trong Next.js 16 (`experimental_ppr` / config), biết chuyển dần từng route.
- Phân biệt PPR với ISR và full SSG — khi nào chọn cái nào.

## Vấn đề giải quyết

SSG vs SSR là **thỏa hiệp toàn trang**:

- **SSR/SSR streaming**: mọi request render server → TTFB phụ thuộc server + data, shell không cache CDN được.
- **SSG/ISR**: cực nhanh (HTML tĩnh từ CDN) nhưng dữ liệu **cứng** đến lần build sau; muốn "shell tĩnh + user box động" phải client-fetch (nháy) hoặc chia micro-route.

Pain cụ thể: trang bán hàng — 95% nội dung (tên sản phẩm, mô tả, ảnh) hiếm đổi, nhưng 5% (giỏ hàng, giá theo user, tồn kho) phải tươi. SSG thì giá sai; SSR thì lãng phí vì render lại phần tĩnh mỗi request. **PPR**: shell (95% nội dung) prerender lúc build phục vụ tức thì từ cache; hole 5% stream ngay khi request vào.

## Khái niệm cốt lõi

- **`react-dom/static`** — bộ API prerender: `prerender()` (chờ toàn bộ tree settle, lấy HTML đầy đủ + streams) và `resume()` / `resumeAndPrerender()` (React 19.2 — tiếp tục render từ stream đã prerender để hoàn tất phần động). Khác `renderToPipeableStream` ở chỗ **không phát shell sớm** — nó đợi các shell hoàn chỉnh rồi mới đưa, dành cho build-time/static generation, không phải per-request.
- **PPR (Partial Prerendering)** — 1 route = 1 **static shell** (render lúc build) + các **dynamic hole** (chỗ dùng `await` data động / cookies / headers). Shell deploy lên CDN như file tĩnh; hole stream runtime như streaming bài 4.
- **Static shell vs dynamic hole** — ranh giới do **Suspense boundary** quyết định: nội dung ngoài Suspense trong shell (prerender lúc build); bên trong Suspense nếu phụ thuộc data động (cookies, headers, fetch no-store) thì thành hole runtime.
- **Dynamic APIs** — `cookies()`, `headers()`, `searchParams` (Next) là tín hiệu "phần này động"; PPR dùng Suspense để tách phần động khỏi shell thay vì cho cả trang thành động.
- **Quan hệ với streaming** — PPR = prerender shell lúc build + streaming runtime cho hole. Bài 4 là streaming *toàn bộ render runtime*; PPR nâng lên: shell thậm chí **không render lúc request** nữa.

## Cú pháp / API

```tsx
// react-dom/static — prerender lúc build (SSG, CI, email HTML...)
import { prerender } from "react-dom/static";

async function buildStaticPage() {
  const { prelude } = await prerender(<App url="/" />);
  // `prelude`: ReadableStream chứa shell hoàn chỉnh + các hole đã settle
  for await (const chunk of prelude) process.stdout.write(String(chunk));
}
```

```tsx
// Next.js 16 — bật PPR theo từng route
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    ppr: "incremental", // opt-in từng route, không bật toàn app một lúc
  },
};
```

```tsx
// app/product/[slug]/page.tsx
import { Suspense } from "react";
import { cookies } from "next/headers";

// PHẦN TĨNH — không đụng API động: prerender lúc build, CDN phục vụ tức thì
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug); // fetch có cache (revalidate) — vào shell
  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <Suspense fallback={<CartSkeleton />}>
        <CartInfo /> {/* dùng cookies() => DYNAMIC: hole stream lúc request */}
      </Suspense>
    </article>
  );
}
```

Quy tắc nhanh:

| API | Môi trường | Kết quả | Dùng cho |
|---|---|---|---|
| `prerender()` (`react-dom/static`) | Node / build-time | Chờ shell settle, trả stream đầy đủ | SSG, email, export tĩnh |
| `prerender()` (`react-dom/static`) | Node / build-time | Chờ shell settle, trả stream đầy đủ | SSG, email, export tĩnh |
| `resume()` / `resumeAndPrerender()` (`react-dom/static`) | Node | Tiếp stream bị treo rồi prerender xong | Advanced build pipeline (nền PPR) |
| PPR (Next 16) | Build + runtime | Shell tĩnh từ CDN + hole stream | Trang "phần lớn tĩnh, ít chỗ động" |

## Luồng hoạt động (Flow)

1. **Build time**: Next render route thành shell tĩnh (mọi phần ngoài Suspense), lưu CDN. Dynamic hole được đánh dấu, giữ placeholder.
2. **Request đến**: CDN trả **shell tĩnh ngay** — không chờ server render (vì đã prerender). User thấy nội dung chính gần như tức thì.
3. Song song, server render **các hole động** (chỗ đọc cookies/user/fetch no-store) bằng React streaming.
4. Hole xong → stream xuống, React thay fallback đúng chỗ — y cơ chế bài 4, chỉ khác phần shell không render lại.
5. Kết quả: TTFB ≈ static (CDN), phần động vẫn cá nhân hóa/tươi — không cần chọn SSG *hoặc* SSR nữa.

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

```tsx
// app/product/[slug]/page.tsx — SERVER COMPONENT (Next 16, PPR bật)
import { Suspense } from "react";
import { cookies } from "next/headers";

async function getProduct(slug: string) {
  // fetch có cache/revalidate — chạy lúc BUILD, nằm trong static shell
  const res = await fetch(`${process.env.API}/products/${slug}`, {
    next: { revalidate: 3600 },
  });
  return res.json();
}

// Phần TĨNH trong shell: mọi ai xem cũng giống nhau
export default async function ProductPage({ params }: { params: Promise<{ slug }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* hole ĐỘNG: đọc cookies → không thể prerender → stream runtime */}
      <Suspense fallback={<Skeleton line />}>
        <PersonalizedSection />
      </Suspense>
    </article>
  );
}

// Phần ĐỘNG: phụ thuộc user — hole của PPR
async function PersonalizedSection() {
  const cart = (await cookies()).get("cart"); // API động => bóc phần này ra khỏi shell
  return <CartPreview count={cart ? 3 : 0} />;
}
```

```tsx
// react-dom/static (build script thuần — ngoài Next)
import { prerender } from "react-dom/static";
import { ProductPage } from "./app/product/page";

const { prelude } = await prerender(<ProductPage slug="ao-thun" />, {
  bootstrapScripts: ["/main.js"],
});
for await (const chunk of prelude) fs.writeSync(1, chunk); // HTML hoàn chỉnh cho SSG
```

## Giải thích từng phần

- **`prerender()`** — khác `renderToPipeableStream`: **không stream từng mảnh khi xong**, mà chờ toàn bộ tree (kể cả Suspense) settle rồi mới trả `prelude`. Vì vậy dùng lúc **build** (không có user đang chờ), không dùng cho request runtime.
- **`experimental: { ppr: "incremental" }`** — opt-in từng route bằng `export const experimental_ppr = true` ở page/layout; tắt dần an toàn từng trang thay vì bật cả app.
- **`<Suspense>` là ranh giới tĩnh/động** — bên ngoài: prerender vào shell; bên trong: nếu đụng API động (`cookies()`, `headers()`, `fetch no-store`) thì thành hole stream lúc request. Không bọc = cả nhánh đó đẩy page thành full-dynamic.
- **`getProduct` với `revalidate`** — data "gần tĩnh" vào shell, refresh nền theo revalidate (bài 3); không bắt user chờ.
- **`cookies()` trong `PersonalizedSection`** — API động chuyển segment này thành dynamic; vì nằm trong Suspense riêng nên **chỉ hole này** stream, phần còn lại vẫn từ CDN.

## So sánh với cách làm cũ

| Cách cũ | Cách mới (PPR) | Lợi ích |
|---------|----------------|---------|
| Chọn 1 trong: SSG hoặc SSR cho cả route | Shell tĩnh + hole động trên **cùng một route** | Nhanh như SSG, cá nhân hóa như SSR |
| SSG + fetch client-side cho phần user (JSON thêm 1 chuyến) | Hole stream RSC payload ngay trong cùng response | Không waterfall JSON, không spinner thủ công |
| ISR toàn trang | Shell prerender + hole runtime | Đổi phần động không vô hiệu cả trang |
| `getServerSideProps` (mọi request render đủ) | Dynamic hole nhỏ | Server chỉ render phần thật sự động |

## Lỗi thường gặp

1. **Đọc `cookies()`/`headers()` ngoài Suspense** ⇒ cả page thành dynamic, mất shell. *Fix:* đẩy API động xuống component con bọc `<Suspense>`.
2. **Bật PPR toàn app (`ppr: true`)** ⇒ một page đọc cookie làm hành vi khó đoán toàn site. *Fix:* `ppr: "incremental"` + `export const experimental_ppr = true` từng route.
3. **Tưởng PPR = ISR** — ISR revalidate *toàn bộ* HTML theo thời gian; PPR tách *vĩnh viễn* phần tĩnh khỏi phần động, không đợi revalidate cho phần động.
4. **Dùng `prerender()` cho request runtime** — nó chờ settle hết, user chờ lâu hơn cả SSR thường; runtime vẫn là `renderToPipeableStream` (framework lo).
5. **`await params`/`searchParams` nhầm chỗ** — Next 15+ trả Promise; `searchParams` động (mỗi request khác) ⇒ nếu page đọc `searchParams` ngoài Suspense thì không prerender được shell.
6. **Fallback của hole bị cache content sai ngữ cảnh** — shell chứa fallback không biết user; đừng để fallback hiển thị dữ liệu "chung" dễ hiểu nhầm là của user.

## Khi nào dùng / Khi nào không

**Dùng PPR khi:**

- Trang chủ/blog/docs/sản phẩm: **95% nội dung chung** + vài widget cá nhân (cart, avatar, A/B banner).
- Cần TTFB/CDN của static nhưng vẫn có phần theo user — thay thế mô hình "SSG + fetch client".
- Route mới triển khai dần: bật từng page, đo trước/sau bằng Lighthouse/Core Web Vitals.

**Không nên / chưa cần:**

- Route **động hoàn toàn** (dashboard theo user, dữ liệu real-time) — PPR không thêm gì; mọi thứ đều hole, shell rỗng.
- Route **tĩnh hoàn toàn** — dùng SSG thường, không cần PPR.
- App **không dùng App Router / framework hỗ trợ** — `react-dom/static` dùng được cho prerender build riêng, nhưng PPR dạng shell+hole là cơ chế framework (Next 16+).

## Bài tập nhỏ

Dựng `app/pricing/page.tsx` với Next 16: toàn bộ bảng giá prerender vào shell (fetch `revalidate: 3600`); phần "plan hiện tại của bạn" đọc `cookies()` bọc `<Suspense>` thành hole. Bật `ppr: "incremental"` + `experimental_ppr = true`. Kiểm chứng: curl trang thấy shell chứa bảng giá + placeholder của hole, phần plan đến sau trong cùng response.

## Reference

- [`react-dom/static` (react.dev)](https://react.dev/reference/react-dom/static)
- [Partial Prerendering — Next.js](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering)
- [`experimental_ppr` config — Next.js](https://nextjs.org/docs/app/api-reference/config/next-config-js/partial-prerendering)
- [React 19.2 — Release notes](https://react.dev/blog/2025/10/01/react-19-2)
- Bài liên quan: [4_streaming-loading](../4_streaming-loading/README.md) — cơ chế stream hole runtime; [3_cache-fetch](../3_cache-fetch/README.md) — cache quyết định phần nào tĩnh.
