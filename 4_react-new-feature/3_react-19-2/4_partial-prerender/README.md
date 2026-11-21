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

Mục này đặt 3 chiến lược render cạnh nhau để thấy PPR đứng ở đâu: static nhanh mà cũ, dynamic tươi mà chậm. Đọc để hiểu bài toán "nửa tĩnh nửa động" mà PPR giải.

- **Full static**: nhanh (CDN) nhưng data cũ — mỗi lần đổi phải rebuild; không hợp dữ liệu theo user.
- **Full dynamic SSR**: data tươi nhưng **TTFB chậm** — phải chờ query chậm nhất xong mới trả HTML; một widget chậm làm cả trang chậm.
- **PPR**: shell (header/layout/skeleton) pre-render và cache; các hole phụ thuộc user/session (giỏ hàng, feed cá nhân) được tính toán và stream sau → vừa nhanh (shell có sẵn) vừa tươi (hole stream).

## Khái niệm cốt lõi

Mục này định nghĩa 2 khối xây của PPR: shell tĩnh và dynamic hole. Ví von: PPR giống cửa hàng đóng gói sẵn khung gian hàng (shell) từ trước, còn các quầy theo khách (giỏ hàng, feed) được hoàn thiện ngay lúc khách bước vào — biển hiệu đã treo sẵn, chỉ thiếu số liệu cá nhân.

- **Static shell**: phần không phụ thuộc request — layout, nav, nội dung chung. Được **pre-render** một lần (build time/first request) và cache.
- **Dynamic holes**: phần phụ thuộc request/user — bọc trong `<Suspense>`; khi pre-render React "để lại lỗ" (postponed state), tới request thật sẽ **resume** để render phần này.
- **`prerender(element)`** (`react-dom/static`) trả `{ prelude, postponed }`: `prelude` là HTML shell; `postponed` là trạng thái để `resume`.
- **`resume(element, postponed)` / `resumeToPipeableStream`** (`react-dom/server`): render tiếp phần đã postpone và stream về client.
- **Frontend/Backend split**: shell không gọi `cookies()`/`headers()`/dynamic API; hole mới được phép.
- Trong Next.js: `export const experimental_ppr = true` bật PPR cho route; framework gọi prerender/resume hộ.

> **Tóm gọn 1 câu:** PPR = "khung nhà dựng sẵn tại CDN, nội thất động stream sau" — shell nhanh như static, hole tươi như SSR.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

## Luồng hoạt động (Flow)

Mục này theo một page PPR từ lúc build tới lúc nội dung động stream về trình duyệt — 5 bước cho thấy shell và hole tách nhau ở điểm nào.

1. Build/first render: `prerender(<App/>)` render shell; gặp `<Suspense>` động → ghi lại **postponed**, để fallback trong shell.
2. Shell (đã có skeleton) served ngay từ CDN → **TTFB rất thấp**.
3. Request/user tới: `resume(<App/>, postponed)` chạy phần hole với dữ liệu thật.
4. React **stream** kết quả hole về → client thay skeleton bằng nội dung thật.
5. CDN shell dùng chung; hole luôn tươi theo request.

> **Tóm gọn 1 câu:** Shell đi đường tốc hành từ CDN, hole đi "chuyến sau" mang dữ liệu thật — hai chuyến riêng nhưng ghép thành một trang liền mạch.

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- `ShopLayout` = shell tĩnh: header/nav giống nhau mọi user → pre-render, cache.
- Mỗi hole bọc trong `<Suspense>` **riêng** với fallback riêng → có thể stream độc lập, thay vì chờ tất cả.
- `PersonalFeed`/`CartBadge` async → React suspends chúng; trong PPR, chúng thuộc "postponed", render ở bước resume.
- Không có `cookies()`/`headers()` trong shell — đó là điều kiện để shell tĩnh được.

## So sánh với cách làm cũ

Bảng dưới so 3 chiến lược render theo TTFB và độ tươi dữ liệu. Đọc theo hàng từ static xuống PPR: dòng in đậm là điểm cân bằng được chọn.

| Chiến lược | TTFB | Độ tươi dữ liệu | Ghi chú |
|---|---|---|---|
| Full static (SSG) | Rất nhanh | Cũ (rebuild mới đổi) | Không hợp data per-user |
| Full dynamic SSR / `force-dynamic` | Chậm | Tươi | Chờ query chậm nhất |
| **PPR** | Nhanh (shell CDN) | Tươi cho hole | Kết hợp tốt nhất cho page nửa tĩnh nửa động |

> **Cách đọc bảng này:** đọc theo cột TTFB (tốc độ trả HTML đầu tiên) và cột "Độ tươi dữ liệu" — hai tiêu chí thường đánh đổi nhau; PPR là hàng duy nhất tốt ở cả hai, với điều kiện tách được hole.

## Lỗi thường gặp

Mục này là 5 lỗi cấu trúc khi bật PPR — gốc rễ của hầu hết là "để động API lọt vào shell" (số 1) và không bọc Suspense riêng cho từng hole (số 2).
1. **Đặt `await`/dynamic API trong shell (ngoài Suspense)** → vì sao: shell mất tính tĩnh, không cache được → fix: đưa mọi phần phụ thuộc request vào hole `<Suspense>`.
2. **Không tách hole bằng `<Suspense>`** → vì sao: phần động kéo cả page chờ; PPR không phát huy → fix: bọc từng hole với fallback skeleton riêng.
3. **Kỳ vọng API stable** → vì sao: `prerender`/`resume` còn `unstable_`; dùng qua Next.js PPR → fix: bám flag framework, không gọi core trực tiếp khi không cần.
4. **Cho rằng PPR là "cache vĩnh viễn"** → vì sao: shell cache theo CDN cấu hình; hole luôn render theo request → fix: cấu hình revalidate/cache phù hợp cho shell.
5. **Toàn page đã tĩnh hoặc toàn page bắt buộc dynamic đồng bộ** mà vẫn bật PPR → vì sao: thừa hoặc không tách được hole → fix: dùng SSG hoặc dynamic SSR thẳng.

> **Tóm gọn 1 câu:** PPR chỉ phát huy khi trang có "vùng phân giới" rõ: shell sạch dynamic API, hole được Suspense bọc riêng — khác thì đừng ép.

## Khi nào dùng / Khi nào không
- **Dùng**: page nửa tĩnh nửa động (ecommerce PDP, dashboard có layout chung + widget per-user, blog + comments cá nhân), shell cache CDN, hole phụ thuộc session.
- **Không dùng**: page hoàn toàn tĩnh (SSG đủ), hoặc toàn bộ nội dung phụ thuộc request không tách hole được — lúc đó static/dynamic SSR thuần tốt hơn.

## Bài tập nhỏ

Bài tập "soi HTML trả về" — quan sát skeleton về trước và nội dung thật thay dần, kèm thử nghiệm để xem TTFB sụp thế nào khi vi phạm quy tắc shell.

- Dựng page "Sản phẩm": shell tĩnh (header + mô tả sản phẩm từ props), hole "Giá theo khu vực" và "Tồn kho" mỗi cái trong `<Suspense>` với skeleton riêng. Giả lập delay 800ms/1200ms. Quan sát HTML trả về: skeleton xuất hiện ngay, nội dung thật thay dần — và ghi chú nếu vô tình đặt `await` ra ngoài shell thì TTFB tăng thế nào.

> **Tóm gọn 1 câu:** Skeleton tới trước, nội dung chui vào sau — còn TTFB tăng vọt nghĩa là bạn đã làm "bẩn" shell.

## Reference
- [React 19.2 Release — Partial Pre-rendering](https://react.dev/blog/2025/10/01/react-19-2)
- [prerender (react-dom/static)](https://react.dev/reference/react-dom/static/prerender)
- [resume (react-dom/server)](https://react.dev/reference/react-dom/server/resume)
- [Next.js experimental_ppr](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#experimental_ppr)