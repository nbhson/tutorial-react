# DevTools + Persist — Debug và giữ state

> Nguồn: https://redux-toolkit.js.org/api/configureStore — https://github.com/reduxjs/redux-devtools-extension

## Mục tiêu

Mục này nói về ba đích đến của bài: dùng time-travel để bắt bug, giữ store serialize được, và persist đúng slice cần thiết. Đọc để biết bài trang bị cho bạn gì.

- Dùng Redux DevTools time-travel: xem action, nhảy state, skip action để khoanh bug.
- Hiểu `serializableCheck` và giữ store serialize được.
- Persist slice cần thiết qua reload bằng redux-persist (whitelist, migrate).

> **Tóm gọn 1 câu:** DevTools là "máy quay camera an ninh" của store, persist là "tủ giữ đồ qua đêm" — bài này dạy bạn dùng cả hai đúng chỗ.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm của DevTools + persist — đọc để hiểu bộ máy trước khi mở tab DevTools.

- **DevTools time-travel**: mỗi dispatch là một điểm trong lịch sử — click nhảy tới state bất kỳ, "skip" bỏ qua action để xem UI không có nó ra sao. Ví von: như máy chiếu có nút tua — tua lại từng khung hình để thấy chính xác khoảnh khắc mọi thứ lệch. Đây là lý do lớn nhất chọn Redux cho app lớn.
- **Action log đọc được**: `todos/toggle` + payload hiển thị rõ — đặt tên slice/reducer rõ nghĩa chính là đầu tư cho debug. Log không rõ tên giống xem camera chung cư mà không có số phòng.
- **`serializableCheck` (mặc định bật)**: cảnh báo khi state/action chứa Date/class/function/Promise — vì time-travel + persist cần serialize. Hãy hình dung store như nhật ký phải chụp ảnh được: những thứ không chụp được (một con người đang sống, một cái máy chạy) không để vào trang vở. Tắt từng field có chủ đích, không tắt cả middleware.
- **redux-persist**: `persistReducer({ key, storage, whitelist })` bọc reducer + `persistStore` — rehydrate khi boot. `whitelist` chỉ giữ slice cần (cart/theme), blacklist auth/token nhạy cảm — như giữ đồ trong tủ xe qua đêm, nhưng tuyệt đối không để ví tiền.
- **Listener middleware** (`createListenerMiddleware`): phản ứng sau action (vd action X xong thì dispatch Y, log analytics) — thay saga cho case vừa, vẫn trong hệ sinh thái RTK.

> **Tóm gọn 1 câu:** DevTools tua lại lịch sử state, `serializableCheck` giữ mọi thứ "chụp ảnh được", và persist chọn đúng ngăn đồ an toàn để giữ qua reload.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song phần giải thích dưới.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về các cấu hình trong ví dụ và lý do từng dòng tồn tại — đọc để không xóa nhầm dòng "trông thừa".

- `whitelist: ["items"]` — chỉ persist dữ liệu, bỏ `status`/`error` (trạng thái nhất thời, boot lại tính mới) — như giữ quần áo trong tủ, không giữ tờ giấy nhớ "đang đi chợ".
- `ignoredActions: ["persist/PERSIST"]` — action của persist chứa function/non-serializable có chủ đích, bỏ qua check đúng chỗ thay vì tắt cả middleware.
- `.prepend(listener.middleware)` — listener chạy trước thunk mặc định để kịp nghe action; thứ tự middleware là thứ tự chạy, giống xếp hàng: đứng trước thì nghe trước.
- `<PersistGate>` giữ UI chờ rehydrate xong — không thì lần render đầu đọc state rỗng rồi nhảy UI, như mở quán khi hàng chưa kịp nhập về.

## Lỗi thường gặp

Mục này nói về 4 bẫy nguy hiểm (có cái liên quan bảo mật) — đọc kỹ mục này trước khi bật persist.

- **Persist cả token/auth vào localStorage** → XSS đọc được. Fix: token httpOnly cookie (nhóm `4_security-config`), persist chỉ data vô hại.
- **Đổi shape state không migrate** → rehydrate data cũ vỡ app. Fix: `version` + `migrate` mỗi lần đổi shape — như đổi quy cách tủ đồ phải có bảng chuyển đổi đồ cũ sang ngăn mới.
- **Tắt hẳn `serializableCheck`** vì "ồn" → mất lá chắn time-travel/persist. Fix: `ignoredActions`/`ignoredPaths` đúng field.
- **Debug bằng console.log thay vì DevTools** → chậm. Fix: thói quen mới — nghi bug là mở DevTools xem action trước, skip action để khoanh vùng.

> **Tóm gọn 1 câu:** Không persist token, luôn migrate khi đổi shape, không tắt cả serializableCheck, và nghi bug thì mở DevTools trước khi console.log.

## Reference

- [Redux DevTools](https://github.com/reduxjs/redux-devtools-extension) · [redux-persist](https://github.com/rt2zz/redux-persist)
