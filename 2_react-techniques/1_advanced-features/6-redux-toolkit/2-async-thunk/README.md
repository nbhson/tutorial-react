# Async Thunk — Đưa API vào store

> Nguồn: https://redux-toolkit.js.org/api/createAsyncThunk

## Mục tiêu

Mục này nói về ba đích đến của bài: viết thunk đủ vòng đời, hứng action chuẩn, và xử lý được hủy request. Đọc để biết cuối bài bạn làm được gì.

- Viết `createAsyncThunk` với đủ 3 vòng đời pending/fulfilled/rejected.
- Hứng thunk bằng `extraReducers` theo mẫu `status`/`error` chuẩn.
- Biết hủy request (`signal`) và test thunk không cần render.

> **Tóm gọn 1 câu:** Thunk là "người chạy errand" của store — đi lấy data về, và bài này dạy bạn ghi nhận đủ ba trạng thái của anh ấy: đang đi, về tới, hay về tay không.

## Khái niệm cốt lõi

Mục này nói về 6 khái niệm cốt lõi của createAsyncThunk — đọc trước để hiểu vì sao code mẫu có đúng ba case pending/fulfilled/rejected.

- **`createAsyncThunk("todos/fetch", async (arg, api) => ...)`**: sinh 3 action type `todos/fetch/pending|fulfilled|rejected`. Ví von: một chuyến đi chợ luôn có 3 kết cục — vừa chuẩn bị đi (pending), mua thành công (fulfilled), hoặc về không hàng (rejected). `arg` là tham số gọi, `api` cho `rejectWithValue`/`signal`/`getState`.
- **`extraReducers(builder)`**: nơi slice hứng action từ ngoài (thunk) — `reducers` thường không làm được vì action không do slice sinh. Giống như để cửa sau cho bưu tá ngoài gửi hàng vào, vì hàng không do chính bạn gửi đi.
- **Mẫu `status: "idle"|"pending"|"failed"` + `error`**: mọi slice async cùng một shape — UI nào cũng switch giống nhau, không mỗi chỗ một kiểu. Đây là "khổ giấy chuẩn" giúp mọi phần app đọc hiểu nhau.
- **`rejectWithValue(msg)`**: đưa lỗi có kiểm soát vào `action.payload` của case rejected — thay vì error thô khó hiển thị. Ví von: thay vì giao viên để bìa thư nháp xé toạc trước cửa, anh ta giao kèm mẩu giấy ghi rõ lý do.
- **`signal` (AbortSignal)**: thunk nhận signal hủy fetch; component unmount hoặc gọi lại thì `abort()` — chống race response cũ ghi đè mới. Hãy hình dung hai lá thư gửi cùng lúc: không hủy lá cũ, thư gửi sau có thể về trước và ghi đè sai thứ tự.
- **Điều kiện chạy**: `condition` (option thứ ba) cho phép skip thunk khi đang pending — chống double-submit ở tầng store, như ghế xe có cảm biến không cho bấm gọi thêm khi xe đã chạy.

> **Tóm gọn 1 câu:** Thunk sinh sẵn 3 action vòng đời, slice hứng bằng `extraReducers`, và `signal`/`condition` là phanh an toàn chống race + double-submit.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song phần giải thích dưới để hiểu từng dòng.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về những chi tiết dễ bỏ sót trong ví dụ — đọc để không tự hỏi "sao dòng này nằm đây".

- `pending` reset `error`: fetch lại sau lỗi mà còn message cũ là UI sai — reset ngay khi bắt đầu, như gở bảng "đóng cửa" trước khi mở lại quán.
- `a.payload` ở rejected chỉ có khi dùng `rejectWithValue`; ném `throw` thường thì lỗi nằm ở `a.error.message`.
- `signal` truyền thẳng vào `fetch` — không cần AbortController tay; gọi `dispatch(fetchTodos())` lần 2 không tự hủy lần 1, muốn vậy dùng `condition` hoặc abort tay qua `promise.abort()`.
- Test thuần: `reducer(prev, fetchTodos.fulfilled(payload, ""))` — gọi action creator của thunk như action thường, không cần mock store.

## Lỗi thường gặp

Mục này nói về 4 bẫy kinh điển khi làm async với Redux — đọc để spinner của bạn không quay mãi vô nghĩa.

- **Chỉ hứng fulfilled, bỏ pending/rejected** → UI không có tải/lỗi, treo im khi mạng lỗi. Fix: luôn đủ 3 case — câu chuyện phải có cả đoạn "đang đi" và "về tay không".
- **Để `status` kẹt `"pending"` khi lỗi** → spinner quay mãi. Fix: rejected phải set `failed` + `error`.
- **Race 2 lần gọi** (StrictMode double-effect, gõ search nhanh) → response cũ về sau ghi đè. Fix: `signal` + cleanup, hoặc `condition` skip khi đang pending.
- **Nhét cả response thô vào store** → dư field, khó chuẩn hóa. Fix: map về type gọn ở thunk, hoặc chuẩn hóa bằng entity adapter (bài 3).

> **Tóm gọn 1 câu:** Đủ 3 case, rejected phải "mở cờ" ngay, hủy request cũ trước khi gọi mới — thiếu một trong ba là UI nói dối user.

## Reference

- [createAsyncThunk](https://redux-toolkit.js.org/api/createAsyncThunk)
