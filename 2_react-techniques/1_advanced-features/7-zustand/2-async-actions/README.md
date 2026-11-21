# Async Actions — Gọi API trong store

> Nguồn: https://zustand.docs.pmnd.rs/guides/async-actions

## Mục tiêu

Mục này nói về hai đích đến của bài: viết action async chuẩn với cờ loading/error, và biết ranh giới khi nào nên giao việc cho TanStack Query. Đọc để thấy bản đồ bài học.

- Viết action async (fetch rồi `set`) với cờ `loading`/`error`.
- Biết optimistic update tay + rollback; biết khi nào dừng (chuyển Query).

> **Tóm gọn 1 câu:** Zustand cho bạn tự viết action async bằng async/await thuần — nhưng biết dừng đúng chỗ: fetch nghiêm túc thì giao cho Query.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm của async action trong Zustand — đọc để hiểu quy mô bài toán trước khi chọn giải pháp.

- **Action async = hàm async trong store**: `fetch: async () => { set({ loading: true }); ... set({ data }) }` — không cần thunk/middleware, async/await thuần. Ví von: Zustand không cần "người chạy errand" chuyên nghiệp như thunk — chính chủ nhà tự ra chợ và tự ghi sổ khi về.
- **Cờ loading/error trong state**: UI switch 3 nhánh như mẫu thunk (track Redux bài 2) — đừng dùng biến ngoài store (mất re-render).
- **Optimistic tay**: `set` dữ liệu đoán trước → gọi API → lỗi thì `set` rollback snapshot đã lưu. Hãy hình dung như đưa món đồ cho khách ngay trước khi kiểm kho: kiểm xong thiếu thì thu lại đúng món đã đưa. Query làm sẵn (`onMutate`); Zustand làm tay khi cần.
- **Giới hạn**: cache theo key, dedupe, retry, staleTime — Zustand không có. API cần các thứ đó → TanStack Query (bài 3), store chỉ giữ kết quả cuối.
- **`get()` trong action**: đọc state mới nhất trước khi set tiếp (vd kiểm tra đang loading thì skip — chống double-fetch), như liếc đồng hồ trước khi bấm hẹn giờ lần nữa.

> **Tóm gọn 1 câu:** Action async Zustand là async/await thuần: set cờ trước, set data sau, chụp snapshot trước khi optimistic — và vượt quá "set đơn giản" thì chuyển sang Query.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song phần giải thích dưới.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về từng chi tiết trong ví dụ — những dòng nhỏ giữ cho flow đúng.

- `get().loading` guard đầu action — rẻ hơn `condition` của thunk nhưng cùng mục đích chống trùng.
- `prev` chụp **trước** `set` optimistic — rollback trả đúng mảng cũ (tham chiếu cũ, selector mảng đứng yên tiếp), như lưu ảnh chụp căn phòng trước khi dọn để biết đường trả lại nguyên trạng.
- `PATCH` JSONPlaceholder không lưu thật — demo flow optimistic vẫn đạt: UI hiện ngay, lỗi thì về cũ.
- Action async không trả data về component (trừ khi cần) — component đọc qua selector sau khi `set` xong.

## Lỗi thường gặp

Mục này nói về 4 bẫy khi làm async với Zustand — đọc để spinner không kẹt và UI không hiện "đồ giả".

- **Quên reset `loading` trong catch** → spinner kẹt mãi. Fix: `finally` hoặc set đủ 2 nhánh.
- **Optimistic không rollback** → lỗi mạng mà UI vẫn hiện đồ giả. Fix: luôn chụp snapshot trước, catch trả về.
- **Nhét cache/dedupe/retry vào store** → viết lại Query dở hơn. Fix: fetch nghiêm túc thì Query; store giữ kết quả + cờ UI.
- **Race 2 fetch** (gõ search) → response cũ ghi đè. Fix: AbortController trong action, hoặc debounce query ở component (DAY 16).

> **Tóm gọn 1 câu:** `finally` là nơi reset cờ, snapshot là bảo hiểm của optimistic, và khi cần cache/retry thì đó không còn việc của Zustand.

## Reference

- [Zustand — Async actions](https://zustand.docs.pmnd.rs/guides/async-actions)
