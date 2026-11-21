# 4. Streaming + loading.js + `<Suspense>` theo route

## Mô tả

Streaming SSR cho phép server **gửi HTML về browser theo từng mảnh** thay vì chờ toàn bộ trang render xong mới trả. Giống như phục vụ bàn ăn theo kiểu "món nào xong mang món đó" thay vì chờ đủ bộ menu mới dọn ra — khách có ngay món khai vị trong lúc món chính còn nấu. Người dùng thấy **shell** (layout, header, phần tĩnh) gần như ngay lập tức; phần dữ liệu chậm stream đến sau, khít chỗ `<Suspense>` fallback đang hiển thị. Đây là cơ chế built-in của **Next.js App Router** (qua `loading.js` và `<Suspense>`) và của React 18+ SSR (`renderToPipeableStream`).

Ba tầng trong bài này:

1. **`loading.js` theo route segment** — Next tự bọc segment trong `<Suspense>`, fallback tự động.
2. **`<Suspense>` thủ công trong Server Component** — chia page thành nhiều vùng với thời gian tải khác nhau (granularity do bạn quyết).
3. **Streaming ở tầng nền** — `renderToPipeableStream` (Node) / `renderToReadableStream` (Web streams) gửi shell trước, hole sau; RSC payload cũng stream theo.

> **Tóm gọn 1 câu:** Streaming SSR = server gửi HTML theo đợt — shell hiện trước, phần chậm "khai quật" sau ngay tại chỗ Suspense fallback đang đứng.

## Mục tiêu

- Hiểu pipeline streaming: shell trước → hole → stream dần → thay fallback.
- Dùng được `loading.js` theo route và biết nó bọc Suspense ở đâu.
- Biết đặt `<Suspense>` thủ công sát phần chậm để không fallback cả trang.
- Phân biệt **streaming SSR** với **Suspense client-side** (lazy code-split của DAY 13) — cùng tên hook, khác đường ống.

## Vấn đề giải quyết

Mục này kể về thời SSR "chờ đủ mới gửi" — đọc để hiểu giá trị thật của streaming đo được bằng TTFB và First Paint.

SSR "classic" (React 17) phải `await` **mọi** data của trang rồi mới gửi HTML:

- **TTFB (Time To First Byte) chậm** — 1 query chậm 2s làm cả trang trắng 2s dù header/menu sẵn sàng ngay.
- **All-or-nothing** — không có khái niệm "phần nhanh hiện trước".
- **Skeleton tự viết tay** — mỗi trang tự quản loading state, không đồng bộ với data thật.

Streaming giải quyết: server trả shell + skeleton ngay, mỗi phần data xong thì stream thêm — TTFB và First Paint giảm mạnh, phần chậm không chặn phần nhanh.

> **Tóm gọn 1 câu:** SSR cũ là "all-or-nothing" — một query chậm khóa cả trang; streaming tách page thành vùng nhanh/chậm, vùng nào xong hiện vùng đó.

## Khái niệm cốt lõi

Mục này định nghĩa bộ từ khóa của streaming: shell, hole, `loading.js`, Suspense thủ công — và phân biệt với Suspense client-side cùng tên khác nghề.

- **Shell** — phần HTML render được ngay (layout, header, nội dung tĩnh, những Server Component không chờ data). Gửi đi trong response đầu tiên.
- **Hole** — chỗ trong cây mà data chưa xong. Ví von: như ghế trống có thẻ "chức ngồi chờ được xác nhận" trong hội trường — server gửi sẵn chỗ trống kèm biển fallback, data xong thì "khách" vào ghế ngay. Server **không chờ** hole: gửi placeholder trước, khi data xong thì stream đoạn HTML/RSC payload để thay chỗ đó.
- **`loading.js`** — file đặc biệt theo segment trong App Router. Next bọc segment đó trong `<Suspense fallback={<Loading/>}>` cho bạn; mỗi segment có loading riêng ⇒ loading "nested" theo route, không phải 1 loading cho cả app.
- **`<Suspense>` thủ công** — bọc trực tiếp component async chậm trong page: vùng nào chậm chỉ fallback vùng đó. Đây là cách đạt **granularity nhỏ hơn** loading.js (cấp component thay vì cấp route).
- **Streaming ≠ Suspense client-side** — Suspense client (DAY 13) bắt việc *tải code* (lazy chunk) trên browser; streaming SSR là việc *render và gửi HTML* từ server. Ví von: cùng chữ "giao hàng", một bên là giao đồ ăn trong thành phố (browser tải code), một bên là giao hàng quốc tế qua cảng (server render HTML) — quy trình và phương tiện khác hẳn. Cùng cơ chế "suspend → fallback", khác môi trường.

> **Tóm gọn 1 câu:** Shell = phần giao ngay, hole = ghế chờ data, `loading.js` = fallback tự động theo route, Suspense thủ công = fallback theo vùng bạn chọn.

## Cú pháp / API

Mục này so sánh 3 cơ chế hiện loading trong bảng — tra nhanh để chọn đúng cơ chế cho từng tình huống.

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

> 📄 **Code ví dụ:** [`examples/02-cu-phap-api.tsx`](examples/02-cu-phap-api.tsx)

> 📄 **Code ví dụ:** [`examples/03-cu-phap-api.tsx`](examples/03-cu-phap-api.tsx)

Quy tắc nhanh:

| Cơ chế | Phạm vi | Ai khai báo | Khi nào dùng |
|---|---|---|---|
| `loading.js` | Theo route segment | File convention của Next | Loading mặc định cho cả segment (page + layout con) |
| `<Suspense>` thủ công | Cấp component trong page | Bạn tự bọc | Chia page thành vùng nhanh/chậm khác nhau |
| Shell + hole (tầng nền) | Toàn trang | Framework tự lo | Hiểu để debug, không viết tay trong App Router |

> **Cách đọc bảng này:** đọc cột "Cơ chế" để biết có mấy lựa chọn, cột "Ai khai báo" cho biết bạn phải viết gì hay Next tự lo, cột "Khi nào dùng" là câu trả lời trực tiếp cho câu hỏi "trang này nên dùng cái nào".

## Luồng hoạt động (Flow)

Mục này đi theo một request `/dashboard` qua 7 bước — từ lúc server bắt đầu render đến lúc fallback được thay bằng nội dung thật.

1. Request tới `/dashboard`. Server bắt đầu render cây Server Component.
2. Phần render **đồng bộ** (layout, header, section tĩnh) xong ngay → server **gửi shell HTML** về browser. Browser vẽ shell ngay — user không thấy màn trắng.
3. Component async chưa xong (`SlowChart` đang `await` query) → server chừa **hole** kèm fallback của `<Suspense>` gần nhất.
4. Browser hiển thị fallback (skeleton/spinner) đúng chỗ hole.
5. Data chậm resolve trên server → server render tiếp cây từ chỗ đó và **stream** đoạn HTML + RSC payload xuống.
6. React (client runtime) **thay fallback bằng nội dung thật** đúng vị trí, không reload trang, không re-render phần đã vẽ.
7. Thứ tự stream theo thứ tự hoàn thành — vùng nhanh hiện trước vùng chậm, bất kể vị trí trong cây.

> **Tóm gọn 1 câu:** Shell về trước, hole để fallback trấn an, data xong đâu stream đến đó — thứ tự hiện theo tốc độ hoàn thành, không theo vị trí trong cây.

## Ví dụ chi tiết

Mục này ghép `loading.js` và Suspense thủ công vào cùng một trang để thấy cả hai tầng hoạt động song song.

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.tsx`](examples/04-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

## Giải thích từng phần

- **`export default function Loading()`** — quy ước file của App Router. Next bọc `page.tsx` cùng segment trong `<Suspense fallback={<Loading/>}>`; chỉ tính cho segment đó, không ảnh hưởng segment anh em (`/settings` không có loading riêng thì không fallback).
- **`<Suspense fallback>` quanh `SlowChart`** — ranh giới do bạn đặt: phần trên page (`Revenue`) không chờ chart; chart xong đến đâu stream đến đó. Đây là "per-route + per-component" granularity — kiểm soát tốt hơn `loading.js`.
- **`async function` + `await` trong page** — giữ nguyên như bài 1; điểm mới là **không `await` tất cả ở đầu page** — đẩy phần chậm xuống component con có Suspense, phần nhanh vẫn hiện sớm.
- **Shell** — những gì render xong ngay (không await gì ngoài Suspense hole). Muốn shell nhỏ/ít JS thì giữ layout tĩnh, đẩy data vào island có Suspense.
- **Streaming RSC payload** — nếu hole chứa Server Component con, RSC payload stream kèm HTML; client hydrate khít vị trí. Không phải "AJAX gọi lại" — một kết nối, một luồng.

## So sánh với cách làm cũ

Mục này đo lường khoảng cách giữa SSR "chờ hết" và streaming — cả về trải nghiệm người dùng lẫn chỉ số Core Web Vitals.

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| `getServerSideProps` chờ tất cả data | Shell stream ngay, hole đi sau | First paint ~ ngay cả khi data chậm |
| Loading state tự viết (`isLoading` + skeleton) | `loading.js` / `<Suspense fallback>` | Khai báo, khít từng segment/vùng |
| Spinner toàn trang khi 1 widget chậm | Fallback theo vùng | Widget chậm không chặn trang |
| TTFB chậm vì data chậm nhất quyết định | Shell không phụ thuộc data chậm | Core Web Vitals (LCP) tốt hơn |

> **Cách đọc bảng này:** đọc ngang từng hàng — cột "Cách cũ" là hành vi chờ tất cả, cột "Cách mới" là hành vi chia đợt, cột "Lợi ích" chỉ ra người dùng và chỉ số được gì.

## Lỗi thường gặp

Mục này là 6 lỗi khiến streaming "hỏng ngầm" — code vẫn chạy nhưng mất hết lợi ích, hoặc skeleton nhấp nháy khó chịu.

1. **`await` mọi thứ ở đầu page rồi mới return JSX** ⇒ mất streaming — cả trang chờ query chậm nhất. *Fix:* đẩy `await` xuống component con, bọc `<Suspense>` cho phần chậm.
2. **Đặt `loading.js` ở `app/layout.tsx` gốc** ⇒ mọi navigation đều fallback toàn app, "nháy" skeleton vô nghĩa. *Fix:* đặt `loading.js` ở segment thực sự chậm (cấp page/section).
3. **Fallback to quá** (full-page skeleton) cho widget nhỏ ⇒ nháy khó chịu khi tải nhanh (< 300ms). *Fix:* fallback nhỏ, đúng vùng; hoặc fallback "tối thiểu" (spinner dòng).
4. **Nhầm Suspense streaming với Suspense lazy code** — cùng tên, khác việc: streaming bắt *data chưa render xong trên server*; lazy+Suspense bắt *chunk JS* tải trên client (DAY 13). Trong App Router, `loading.js` là data-streaming, không phải code-splitting.
5. **Quên metadata/SEO** — nội dung stream muộn vẫn có trong HTML cuối (crawler chờ đủ), nhưng nếu bọc cả `<h1>` chính trong hole thì LCP xấu. Giữ nội dung quan trọng ngoài hole chậm nhất.
6. **Streaming + `revalidate`/cache hiểu sai** — stream nhanh không đồng nghĩa data tươi; cache semantics vẫn do `fetch`/`cache()` quyết (bài 3).

## Khi nào dùng / Khi nào không

Mục này giúp chọn giữa `loading.js` (cấp route) và Suspense thủ công (cấp vùng) — và vài trường hợp nên tránh streaming hẳn.

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

> **Tóm gọn 1 câu:** Streaming là "phục vụ món nào xong món đó" — đừng chờ món chậm nhất khóa cả bàn, và đừng bọc spinner toàn trang cho một widget bé xíu.

## Reference

- [Streaming (react.dev)](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [`loading.js` — Next.js](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [`<Suspense>` (react.dev)](https://react.dev/reference/react/Suspense)
- [Streaming SSR — React docs](https://react.dev/reference/react-dom/server/renderToPipeableStream)
