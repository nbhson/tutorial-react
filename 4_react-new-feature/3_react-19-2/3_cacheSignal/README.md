# 3. cacheSignal

## Mô tả
- Bài này giới thiệu **`cacheSignal()`** — API mới của React 19.2 (ra mắt **10/2025**, **status: stable**) nhưng **chỉ dùng cho React Server Components (RSC)**.
- Trả về một **`AbortSignal` gắn với vòng đời của cache entry** tạo bởi `cache()`: khi React kết thúc render, bỏ render (browser navigate đi), hoặc render lỗi — signal **tự động abort**.
- Nhờ đó, fetch/heavy async bên trong server component có thể **tự hủy** khi kết quả không còn được dùng, thay vì tiếp tục chạy lãng phí.

## Mục tiêu
- Hiểu `cacheSignal()` khác gì `AbortController` tạo thủ công và vì sao nó gắn với `cache()`.
- Dùng `signal: cacheSignal()` trong fetch để hủy in-flight request khi render bị bỏ.
- Biết giới hạn: **chỉ RSC**, chỉ bên trong scope `cache()`/server render.

## Vấn đề giải quyết

Mục này nói về "công việc ma" trên server: fetch đã không ai dùng nữa vẫn chạy tới cùng. Đọc để hiểu vì sao abort signal cần bám vào vòng đời cache thay vì tự quản tay.

- Server render một trang có thể kick off nhiều fetch. Nếu user navigate đi giữa chừng hoặc render bị abort, các fetch cũ **vẫn chạy tới cùng** → tốn CPU/bandwidth server, giữ tài nguyên không cần thiết. Ví von: như nhà hàng vẫn nấu chừng món mà khách đã rời quán — `cacheSignal()` chính là chuông báo "bàn đã trống, ngừng nấu".
- Dedupe bằng `cache()` giúp cùng args chỉ fetch một lần, nhưng vẫn cần một cơ chế **biết khi nào cache entry hết hạn** để hủy công việc. Trước 19.2 phải tự tạo `AbortController` và truyền controller qua nhiều tầng code → dễ quên, dễ leak.
- `cacheSignal()` đưa tín hiệu hủy "miễn phí": chỉ cần đọc một lần trong hàm cache, đưa vào `fetch({ signal })` — React lo phần hủy đúng lúc.

## Khái niệm cốt lõi

Mục này gắn `cacheSignal()` với vòng đời cache entry: khi nào signal abort, tại sao chỉ dùng được trong RSC, và những gì signal không đảm bảo. Hãy hình dung cache entry như một chuyến tàu — signal là còi "kết thúc chuyến": tàu đến nơi, bị hủy, hay bỏ dở thì còi đều báo, mọi công việc gắn với còi đều dừng theo.

- **Lifecycle của cache entry**: `cache()` tạo một entry theo **args trong phạm vi một request/render**. Entry sống tới khi render kết thúc (thành công, bỏ, hoặc lỗi) — hoặc bị suy giảm dùng.
- `cacheSignal()` trả `AbortSignal` gắn đúng lifecycle đó:
  - Render **hoàn tất** → signal abort (kết quả đã dùng xong, hủy công việc dư).
  - Render **bị bỏ** (navigation, error boundary) → signal abort sớm.
  - Nếu cache entry bị evict/recompute → cũng abort.
- **Chỉ RSC**: gọi ngoài `cache()`/server-scope sẽ **ném lỗi**; client fetch vẫn dùng `AbortController` + Effect cleanup như bình thường.
- **Tầm tác động**: signal hủy đúng phần fetch bạn truyền vào; không tự dedupe xuyên request (đó là việc của `cache()` + framework fetch cache).
- Signal **không đảm bảo** fetch ngay lập tức dừng — nó chuyển fetch sang trạng thái aborted; code cần xử lý `AbortError` khi cần.

> **Tóm gọn 1 câu:** `cacheSignal()` là "còi kết thúc chuyến" bám sẵn vào cache entry — render xong, bỏ dở hay lỗi thì fetch tự dừng, bạn không phải tự tay rò rỉ AbortController qua từng tầng.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

Quy tắc: gọi `cacheSignal()` **bên trong** hàm bọc bởi `cache()` (hoặc scope server render có cache). Nó trả `AbortSignal | undefined`.

## Luồng hoạt động (Flow)

Mục này theo một request từ lúc cache entry sinh ra tới lúc signal abort — 5 bước cho thấy hủy fetch xảy ra đúng "mốc" nào.

1. Server bắt đầu render; component gọi `getUser(id)`.
2. `cache()` tạo entry, chạy thân hàm; `cacheSignal()` trả signal gắn entry.
3. `fetch(..., { signal })` bắt đầu request.
4. Render kết thúc / bị bỏ / lỗi → signal abort → request in-flight bị hủy; các transform nặng cũng có thể dừng.
5. Nếu dùng lại cùng args trong cùng render → cache trả kết quả (dedupe), không fetch lại.

> **Tóm gọn 1 câu:** Entry sinh theo request, sống trọn render, chết thì kéo fetch theo — đó là toàn bộ hợp đồng của `cacheSignal()`.

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- `cache(fn)` — bọc fetch; cùng `id` trong cùng render dùng chung một promise (dedupe), console chỉ `[fetch]` một lần cho `id=1`.
- `signal: cacheSignal()` — truyền thẳng signal vào fetch; khi render xong/abort, request bị hủy.
- `use(getUser(id))` — unwrap promise trong render (RSC/hỗ trợ Suspense); `<Suspense>` hiện fallback khi chưa có.
- Lưu ý: trong project **client thuần** (Vite/SPA) `cacheSignal` không có ý nghĩa/không tồn tại như RSC — ví dụ này minh họa ngữ cảnh Next.js/RSC.

## So sánh với cách làm cũ

Bảng dưới đối chiếu AbortController "tự lo" với signal do React quản. Đọc theo hàng: mỗi dòng là một chi phí plumbing cũ.

| Cách cũ | Cách mới (`cacheSignal`) | Lợi ích |
|---|---|---|
| Tự tạo `AbortController` và truyền qua nhiều tầng | Đọc `cacheSignal()` tại chỗ | Ít plumbing, không quên |
| Fetch vẫn chạy khi render bị bỏ | Tự abort theo render/cache lifecycle | Giảm lãng phí server |
| Dễ leak controller nếu không abort tay | React quản vòng đời | An toàn hơn |
| Không biết entry hết hạn lúc nào | Signal bám đúng `cache()` entry | Hủy đúng thời điểm |

> **Cách đọc bảng này:** 4 hàng đều xoay quanh một chủ đề — "ai chịu trách nhiệm hủy"; cột Lợi ích cho thấy câu trả lời của 19 là "React chịu, tại chỗ gọi không cần biết".

## Lỗi thường gặp

Mục này là 5 bẫy khi dùng `cacheSignal()` — chớp nhoáng nhất là gọi ngoài RSC (ném lỗi) và kỳ vọng signal tự dừng code CPU-bound (số 5).
1. **Gọi `cacheSignal()` ngoài `cache()`/RSC** → vì sao: API chỉ hợp lệ trong cache scope server → **ném lỗi** → fix: gọi bên trong hàm bọc `cache()` (hoặc hỗ trợ bởi framework).
2. **Dùng `cacheSignal()` trong client component/SPA** → vì sao: không có ngữ cảnh server render → fix: client vẫn `AbortController` + cleanup Effect.
3. **Kỳ vọng signal dedupe xuyên nhiều request** → vì sao: dedupe là việc của `cache()` theo args/render, không phải signal → fix: dùng `cache()` + framework fetch cache (`next.revalidate`...).
4. **Không xử lý `AbortError`** → vì sao: khi bị hủy, promise reject với `AbortError`; nếu code catch chung sẽ log "lỗi" oan → fix: phân nhánh bỏ qua `AbortError`.
5. **Truyền signal vào chỗ không phải fetch (transform nặng) mà không check** → vì sao: signal không tự dừng CPU-bound sync code → fix: kiểm tra `signal.aborted` giữa các bước async, không kỳ vọng hủy sync.

> **Tóm gọn 1 câu:** `cacheSignal()` chỉ hợp lệ trong "nhà" cache/RSC, chỉ hủy được việc async — CPU-bound thì phải tự check `aborted` từng chặng.

## Khi nào dùng / Khi nào không
- **Dùng**: data fetching có dedupe trong Server Component/`cache()`; fetch nên tự abort khi navigation/revalidate/render bỏ; tránh request "mồ côi".
- **Không dùng**: client fetch thông thường (dùng `AbortController` + Effect), hoặc code không nằm trong cache scope.

## Bài tập nhỏ

Bài tập cho bạn quan sát tận mắt cột Network: request bị **cancel** khi navigate đi giữa chừng — bằng chứng render bị bỏ thì fetch cũng bị bỏ.

- Trong project Next.js (App Router), viết `const getPost = cache(async (slug) => fetch(..., { signal: cacheSignal() }))`. Thêm một route chậm (delay) rồi navigate đi giữa chừng — quan sát Network: request tới API bị **cancel** thay vì chạy tới cùng. So sánh với bản không truyền `signal`.

> **Tóm gọn 1 câu:** Request hiện "canceled" trong Network tab thay vì 200 OK muộn màng — đó là dấu vết cacheSignal để lại.

## Reference
- [React 19.2 Release — cacheSignal](https://react.dev/blog/2025/10/01/react-19-2)
- [cacheSignal reference](https://react.dev/reference/react/cacheSignal)
- [cache reference](https://react.dev/reference/react/cache)