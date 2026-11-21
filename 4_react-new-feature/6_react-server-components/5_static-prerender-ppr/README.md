# 5. Prerender tĩnh (`react-dom/static`) + Partial Prerendering (PPR)

## Mô tả

React 19 cung cấp **`react-dom/static`** — bộ API prerender **tĩnh**: render component thành HTML **không phát đi ngay** (`prerender`) hoặc render phần tĩnh trước (shell) rồi xử lý phần động sau (`resumeAndPrerender`). Đây là nền móng cho **Partial Prerendering (PPR)** — được React 19.2 phát triển tiếp và Next.js 16 triển khai chính thức: **một trang = shell tĩnh (prerender lúc build, phục vụ tức thì từ CDN) + hole động stream lúc request**.

Hãy hình dung một trang PPR như gian hàng hội chợ được dựng sẵn từ đêm hôm trước (shell tĩnh từ CDN) — khách đến là thấy ngay khung kệ hàng; riêng quầy "đo kích cỡ giày theo chân từng khách" (hole động) thì phục vụ ngay tại chỗ khi có người hỏi.

Trước PPR phải chọn một trong hai: trang tĩnh (SSG — nhanh nhưng stale) hoặc trang động (SSR/streaming — tươi nhưng chậm hơn). PPR cho **cả hai cùng lúc** trên cùng một route.

> **Tóm gọn 1 câu:** PPR chấm dứt cuộc tranh cãi "SSG hay SSR" — shell tĩnh build trước phục vụ từ CDN, hole động stream lúc request, cả hai sống chung một route.

## Mục tiêu

- Hiểu `prerender()` của `react-dom/static` khác gì `renderToPipeableStream`.
- Nắm mô hình PPR: shell tĩnh prebuild + hole động stream runtime, boundary nào tách chúng.
- Cấu hình PPR trong Next.js 16 (`experimental_ppr` / config), biết chuyển dần từng route.
- Phân biệt PPR với ISR và full SSG — khi nào chọn cái nào.

## Vấn đề giải quyết

Mục này phân tích cái thỏa hiệp "SSG hay SSR, chọn một" — và pain thực tế của trang bán hàng 95% tĩnh 5% động. Đọc để hiểu PPR giải bài toán nào.

SSG vs SSR là **thỏa hiệp toàn trang**:

- **SSR/SSR streaming**: mọi request render server → TTFB phụ thuộc server + data, shell không cache CDN được.
- **SSG/ISR**: cực nhanh (HTML tĩnh từ CDN) nhưng dữ liệu **cứng** đến lần build sau; muốn "shell tĩnh + user box động" phải client-fetch (nháy) hoặc chia micro-route.

Pain cụ thể: trang bán hàng — 95% nội dung (tên sản phẩm, mô tả, ảnh) hiếm đổi, nhưng 5% (giỏ hàng, giá theo user, tồn kho) phải tươi. SSG thì giá sai; SSR thì lãng phí vì render lại phần tĩnh mỗi request. Ví von: như in cả cuốn sách mới mỗi lần chỉ để thay một dòng ở trang bìa. **PPR**: shell (95% nội dung) prerender lúc build phục vụ tức thì từ cache; hole 5% stream ngay khi request vào.

> **Tóm gọn 1 câu:** SSG nhanh nhưng cứng, SSR tươi nhưng chậm — PPR tách trang: phần ít đổi build trước, phần phải tươi stream runtime.

## Khái niệm cốt lõi

Mục này định nghĩa các mảnh ghép của PPR: `react-dom/static`, static shell, dynamic hole, và Suspense làm ranh giới tĩnh/động.

- **`react-dom/static`** — bộ API prerender: `prerender()` (chờ toàn bộ tree settle, lấy HTML đầy đủ + streams) và `resume()` / `resumeAndPrerender()` (React 19.2 — tiếp tục render từ stream đã prerender để hoàn tất phần động). Khác `renderToPipeableStream` ở chỗ **không phát shell sớm** — nó đợi các shell hoàn chỉnh rồi mới đưa, dành cho build-time/static generation, không phải per-request.
- **PPR (Partial Prerendering)** — 1 route = 1 **static shell** (render lúc build) + các **dynamic hole** (chỗ dùng `await` data động / cookies / headers). Shell deploy lên CDN như file tĩnh; hole stream runtime như streaming bài 4.
- **Static shell vs dynamic hole** — ranh giới do **Suspense boundary** quyết định: nội dung ngoài Suspense trong shell (prerender lúc build); bên trong Suspense nếu phụ thuộc data động (cookies, headers, fetch no-store) thì thành hole runtime. Ví von: Suspense như "laser ranh giới" — vượt qua là bước vào vùng động phải làm việc lúc request.
- **Dynamic APIs** — `cookies()`, `headers()`, `searchParams` (Next) là tín hiệu "phần này động"; PPR dùng Suspense để tách phần động khỏi shell thay vì cho cả trang thành động.
- **Quan hệ với streaming** — PPR = prerender shell lúc build + streaming runtime cho hole. Bài 4 là streaming *toàn bộ render runtime*; PPR nâng lên: shell thậm chí **không render lúc request** nữa.

> **Tóm gọn 1 câu:** Suspense là "ranh giới hai vùng" của PPR — ngoài ranh prerender lúc build, trong ranh stream lúc request.

## Cú pháp / API

Mục này là bảng tra API prerender theo môi trường và mục đích — đọc để chọn đúng API cho đúng thời điểm (build hay runtime).

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

> 📄 **Code ví dụ:** [`examples/02-cu-phap-api.tsx`](examples/02-cu-phap-api.tsx)

> 📄 **Code ví dụ:** [`examples/03-cu-phap-api.tsx`](examples/03-cu-phap-api.tsx)

Quy tắc nhanh:

| API | Môi trường | Kết quả | Dùng cho |
|---|---|---|---|
| `prerender()` (`react-dom/static`) | Node / build-time | Chờ shell settle, trả stream đầy đủ | SSG, email, export tĩnh |
| `resume()` / `resumeAndPrerender()` (`react-dom/static`) | Node | Tiếp stream bị treo rồi prerender xong | Advanced build pipeline (nền PPR) |
| PPR (Next 16) | Build + runtime | Shell tĩnh từ CDN + hole stream | Trang "phần lớn tĩnh, ít chỗ động" |

> **Cách đọc bảng này:** cột "Môi trường" cho biết API chạy lúc nào (build-time hay runtime), cột "Dùng cho" là tình huống điển hình — chọn hàng theo việc bạn đang cần prerender hay stream.

## Luồng hoạt động (Flow)

Mục này đi qua 5 bước vòng đời một request vào trang PPR — từ build time đến lúc hole được thay vào shell.

1. **Build time**: Next render route thành shell tĩnh (mọi phần ngoài Suspense), lưu CDN. Dynamic hole được đánh dấu, giữ placeholder.
2. **Request đến**: CDN trả **shell tĩnh ngay** — không chờ server render (vì đã prerender). User thấy nội dung chính gần như tức thì.
3. Song song, server render **các hole động** (chỗ đọc cookies/user/fetch no-store) bằng React streaming.
4. Hole xong → stream xuống, React thay fallback đúng chỗ — y cơ chế bài 4, chỉ khác phần shell không render lại.
5. Kết quả: TTFB ≈ static (CDN), phần động vẫn cá nhân hóa/tươi — không cần chọn SSG *hoặc* SSR nữa.

> **Tóm gọn 1 câu:** Build xong shell lên CDN, request đến thì trả ngay + stream hole động — TTFB của static, sự tươi của dynamic.

## Ví dụ chi tiết

Mục này dựng một trang PPR thật với shell chứa data "gần tĩnh" và hole cá nhân hóa đọc cookies.

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.tsx`](examples/04-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

## Giải thích từng phần

- **`prerender()`** — khác `renderToPipeableStream`: **không stream từng mảnh khi xong**, mà chờ toàn bộ tree (kể cả Suspense) settle rồi mới trả `prelude`. Vì vậy dùng lúc **build** (không có user đang chờ), không dùng cho request runtime.
- **`experimental: { ppr: "incremental" }`** — opt-in từng route bằng `export const experimental_ppr = true` ở page/layout; tắt dần an toàn từng trang thay vì bật cả app.
- **`<Suspense>` là ranh giới tĩnh/động** — bên ngoài: prerender vào shell; bên trong: nếu đụng API động (`cookies()`, `headers()`, `fetch no-store`) thì thành hole stream lúc request. Không bọc = cả nhánh đó đẩy page thành full-dynamic.
- **`getProduct` với `revalidate`** — data "gần tĩnh" vào shell, refresh nền theo revalidate (bài 3); không bắt user chờ.
- **`cookies()` trong `PersonalizedSection`** — API động chuyển segment này thành dynamic; vì nằm trong Suspense riêng nên **chỉ hole này** stream, phần còn lại vẫn từ CDN.

## So sánh với cách làm cũ

Mục này cho thấy PPR "hấp thụ" được những hạn chế nào của SSG/ISR/SSR — từng hàng là một mô hình cũ được thay thế.

| Cách cũ | Cách mới (PPR) | Lợi ích |
|---------|----------------|---------|
| Chọn 1 trong: SSG hoặc SSR cho cả route | Shell tĩnh + hole động trên **cùng một route** | Nhanh như SSG, cá nhân hóa như SSR |
| SSG + fetch client-side cho phần user (JSON thêm 1 chuyến) | Hole stream RSC payload ngay trong cùng response | Không waterfall JSON, không spinner thủ công |
| ISR toàn trang | Shell prerender + hole runtime | Đổi phần động không vô hiệu cả trang |
| `getServerSideProps` (mọi request render đủ) | Dynamic hole nhỏ | Server chỉ render phần thật sự động |

> **Cách đọc bảng này:** mỗi hàng là một mô hình render trước đây — cột giữa cho thấy PPR thay thế nó ra sao, cột phải là lợi ích cụ thể nhận được.

## Lỗi thường gặp

Mục này là 6 bẫy khi cấu hình PPR — hầu hết xoay quanh "đọc API động ngoài Suspense" khiến shell biến mất.

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

> **Tóm gọn 1 câu:** PPR tỏa sáng ở trang "nhiều tĩnh ít động" — trang động hoàn toàn hay tĩnh hoàn toàn thì cứ dùng công cụ phù hợp hơn, khỏi bắt PPR làm.

## Bài tập nhỏ

Dựng `app/pricing/page.tsx` với Next 16: toàn bộ bảng giá prerender vào shell (fetch `revalidate: 3600`); phần "plan hiện tại của bạn" đọc `cookies()` bọc `<Suspense>` thành hole. Bật `ppr: "incremental"` + `experimental_ppr = true`. Kiểm chứng: curl trang thấy shell chứa bảng giá + placeholder của hole, phần plan đến sau trong cùng response.

> **Tóm gọn 1 câu:** PPR = gian hàng dựng sẵn từ đêm (shell CDN) + quầy phục vụ đo riêng từng khách (hole stream) — nhanh và cá nhân hóa cùng lúc.

## Reference

- [`react-dom/static` (react.dev)](https://react.dev/reference/react-dom/static)
- [Partial Prerendering — Next.js](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering)
- [`experimental_ppr` config — Next.js](https://nextjs.org/docs/app/api-reference/config/next-config-js/partial-prerendering)
- [React 19.2 — Release notes](https://react.dev/blog/2025/10/01/react-19-2)
- Bài liên quan: [4_streaming-loading](../4_streaming-loading/README.md) — cơ chế stream hole runtime; [3_cache-fetch](../3_cache-fetch/README.md) — cache quyết định phần nào tĩnh.
