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
- Server render một trang có thể kick off nhiều fetch. Nếu user navigate đi giữa chừng hoặc render bị abort, các fetch cũ **vẫn chạy tới cùng** → tốn CPU/bandwidth server, giữ tài nguyên không cần thiết.
- Dedupe bằng `cache()` giúp cùng args chỉ fetch một lần, nhưng vẫn cần một cơ chế **biết khi nào cache entry hết hạn** để hủy công việc. Trước 19.2 phải tự tạo `AbortController` và truyền controller qua nhiều tầng code → dễ quên, dễ leak.
- `cacheSignal()` đưa tín hiệu hủy "miễn phí": chỉ cần đọc một lần trong hàm cache, đưa vào `fetch({ signal })` — React lo phần hủy đúng lúc.

## Khái niệm cốt lõi
- **Lifecycle của cache entry**: `cache()` tạo một entry theo **args trong phạm vi một request/render**. Entry sống tới khi render kết thúc (thành công, bỏ, hoặc lỗi) — hoặc bị suy giảm dùng.
- `cacheSignal()` trả `AbortSignal` gắn đúng lifecycle đó:
  - Render **hoàn tất** → signal abort (kết quả đã dùng xong, hủy công việc dư).
  - Render **bị bỏ** (navigation, error boundary) → signal abort sớm.
  - Nếu cache entry bị evict/recompute → cũng abort.
- **Chỉ RSC**: gọi ngoài `cache()`/server-scope sẽ **ném lỗi**; client fetch vẫn dùng `AbortController` + Effect cleanup như bình thường.
- **Tầm tác động**: signal hủy đúng phần fetch bạn truyền vào; không tự dedupe xuyên request (đó là việc của `cache()` + framework fetch cache).
- Signal **không đảm bảo** fetch ngay lập tức dừng — nó chuyển fetch sang trạng thái aborted; code cần xử lý `AbortError` khi cần.

## Cú pháp / API

```tsx
import { cache, cacheSignal } from 'react';

const getUser = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/users/${id}`, {
    signal: cacheSignal(), // abort khi cache entry hết hạn / render bỏ
  });
  return res.json();
});
```

Quy tắc: gọi `cacheSignal()` **bên trong** hàm bọc bởi `cache()` (hoặc scope server render có cache). Nó trả `AbortSignal | undefined`.

## Luồng hoạt động (Flow)

1. Server bắt đầu render; component gọi `getUser(id)`.
2. `cache()` tạo entry, chạy thân hàm; `cacheSignal()` trả signal gắn entry.
3. `fetch(..., { signal })` bắt đầu request.
4. Render kết thúc / bị bỏ / lỗi → signal abort → request in-flight bị hủy; các transform nặng cũng có thể dừng.
5. Nếu dùng lại cùng args trong cùng render → cache trả kết quả (dedupe), không fetch lại.

## Ví dụ chi tiết

```tsx
// example.tsx — cacheSignal (React 19.2)
import { Suspense, cache, cacheSignal, use } from 'react';

// Dedupe: cùng id trong cùng render chỉ fetch 1 lần,
// signal tự abort khi cache entry hết hạn hoặc render bỏ.
const getUser = cache(async (id: string) => {
  console.log(`[fetch] user ${id}`);
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, {
    signal: cacheSignal(), // AbortSignal gắn lifecycle của cache()
  });
  if (!res.ok) throw new Error('Fetch lỗi');
  return res.json() as Promise<{ name: string; email: string }>;
});

function UserCard({ id }: { id: string }) {
  const user = use(getUser(id)); // đọc promise qua use → suspend
  return (
    <p>
      {user.name} — {user.email}
    </p>
  );
}

export default function CacheSignalDemo() {
  return (
    <div>
      <h2>cacheSignal (React 19.2)</h2>
      <p>2 card cùng id=1 chỉ fetch 1 lần (xem console/network).</p>
      <Suspense fallback={<p>Đang tải...</p>}>
        <UserCard id="1" />
        <UserCard id="1" /> {/* dedupe với card trên */}
        <UserCard id="2" /> {/* id khác → fetch mới */}
      </Suspense>
    </div>
  );
}
```

## Giải thích từng phần
- `cache(fn)` — bọc fetch; cùng `id` trong cùng render dùng chung một promise (dedupe), console chỉ `[fetch]` một lần cho `id=1`.
- `signal: cacheSignal()` — truyền thẳng signal vào fetch; khi render xong/abort, request bị hủy.
- `use(getUser(id))` — unwrap promise trong render (RSC/hỗ trợ Suspense); `<Suspense>` hiện fallback khi chưa có.
- Lưu ý: trong project **client thuần** (Vite/SPA) `cacheSignal` không có ý nghĩa/không tồn tại như RSC — ví dụ này minh họa ngữ cảnh Next.js/RSC.

## So sánh với cách làm cũ

| Cách cũ | Cách mới (`cacheSignal`) | Lợi ích |
|---|---|---|
| Tự tạo `AbortController` và truyền qua nhiều tầng | Đọc `cacheSignal()` tại chỗ | Ít plumbing, không quên |
| Fetch vẫn chạy khi render bị bỏ | Tự abort theo render/cache lifecycle | Giảm lãng phí server |
| Dễ leak controller nếu không abort tay | React quản vòng đời | An toàn hơn |
| Không biết entry hết hạn lúc nào | Signal bám đúng `cache()` entry | Hủy đúng thời điểm |

## Lỗi thường gặp
1. **Gọi `cacheSignal()` ngoài `cache()`/RSC** → vì sao: API chỉ hợp lệ trong cache scope server → **ném lỗi** → fix: gọi bên trong hàm bọc `cache()` (hoặc hỗ trợ bởi framework).
2. **Dùng `cacheSignal()` trong client component/SPA** → vì sao: không có ngữ cảnh server render → fix: client vẫn `AbortController` + cleanup Effect.
3. **Kỳ vọng signal dedupe xuyên nhiều request** → vì sao: dedupe là việc của `cache()` theo args/render, không phải signal → fix: dùng `cache()` + framework fetch cache (`next.revalidate`...).
4. **Không xử lý `AbortError`** → vì sao: khi bị hủy, promise reject với `AbortError`; nếu code catch chung sẽ log "lỗi" oan → fix: phân nhánh bỏ qua `AbortError`.
5. **Truyền signal vào chỗ không phải fetch (transform nặng) mà không check** → vì sao: signal không tự dừng CPU-bound sync code → fix: kiểm tra `signal.aborted` giữa các bước async, không kỳ vọng hủy sync.

## Khi nào dùng / Khi nào không
- **Dùng**: data fetching có dedupe trong Server Component/`cache()`; fetch nên tự abort khi navigation/revalidate/render bỏ; tránh request "mồ côi".
- **Không dùng**: client fetch thông thường (dùng `AbortController` + Effect), hoặc code không nằm trong cache scope.

## Bài tập nhỏ
- Trong project Next.js (App Router), viết `const getPost = cache(async (slug) => fetch(..., { signal: cacheSignal() }))`. Thêm một route chậm (delay) rồi navigate đi giữa chừng — quan sát Network: request tới API bị **cancel** thay vì chạy tới cùng. So sánh với bản không truyền `signal`.

## Reference
- [React 19.2 Release — cacheSignal](https://react.dev/blog/2025/10/01/react-19-2)
- [cacheSignal reference](https://react.dev/reference/react/cacheSignal)
- [cache reference](https://react.dev/reference/react/cache)