# Middleware + Persist — Giữ state, debug chuẩn

> Nguồn: https://zustand.docs.pmnd.rs/middlewares/persist — https://zustand.docs.pmnd.rs/middlewares/immer

## Mục tiêu

Mục này nói về ba đích đến của bài: giữ state qua reload, debug bằng DevTools, và viết update lồng gọn gàng. Đọc để thấy bài trang bị gì cho bạn.

- Giữ state qua reload bằng `persist` (chọn field, version/migrate).
- Debug bằng `devtools` middleware; viết update lồng nhau gọn bằng `immer`.
- Hiểu thứ tự bọc middleware.

> **Tóm gọn 1 câu:** Middleware là "lớp áo khoác" bọc quanh store — persist giữ đồ qua đêm, devtools lắp camera, immer cho bạn viết gạch xoá thoải mái.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm của persist/devtools/immer — đọc để hiểu thứ tự bọc trước khi viết.

- **`persist(storeFn, { name, partialize, version, migrate })`**: tự ghi/đọc storage (mặc định localStorage). `name` là key; `partialize` chọn field giữ (bỏ function/loading nhất thời); `version` + `migrate` xử data cũ khi đổi shape. Ví von: `partialize` là danh sách đồ bạn định mang vào tủ giữ đồ qua đêm — quần áo thì giữ, tiền vé (cờ nhất thời) thì bỏ.
- **Rehydrate bất đồng bộ**: lần render đầu state còn rỗng → UI cần chịu được (giỏ hiện 0 rồi nhảy số). Quan trọng thì `useStore.persist.hasHydrated()` để chờ — như chờ xe chở hàng tới nơi rồi mới mở cửa hàng, đừng bán theo kệ đang trống.
- **`devtools`**: nối Redux DevTools — action có tên (`set` thứ ba nhận tên) để log đọc được.
- **`immer`**: viết `set((s) => { s.items.push(x) })` cho state lồng sâu — thay spread 3 tầng dễ sai. Hãy hình dung immer là người biên tập: bạn gạch xoá trên bản nháp, bản in ra vẫn là bản mới sạch.
- **Thứ tự bọc**: `create(devtools(persist(immer(fn))))` — lớp ngoài cùng chạy trước. Đặt `devtools` ngoài để log thấy state sau cùng, như camera đặt ở cửa chính thấy cả ai ra lẫn ai vào.

> **Tóm gọn 1 câu:** `persist` chọn đồ giữ bằng `partialize`, `devtools` phải bọc ngoài cùng để thấy trọn log, `immer` giải cứu bạn khỏi spread 3 tầng.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song phần giải thích dưới.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về từng cấu hình trong ví dụ — đọc để không bỏ sót cấu hình "vô hình nhưng quyết định".

- `partialize` trả subset — type ép về `CartState` vì persist merge lại khi rehydrate; field thiếu dùng initial.
- `version`/`migrate`: `(persisted, version) => newState` — không có là user cũ mở bản mới vỡ UI, như khách cũ quay lại quán mà thực đơn đổi hoàn toàn không có người dẫn.
- Tên action trong DevTools: `set(..., false, "cart/add")` — tham số thứ ba đặt tên, log đọc được như Redux.
- `lastSync` bỏ ngoài persist vì là metadata phiên — giữ lại là số cũ gây hiểu nhầm "vừa đồng bộ".

## Lỗi thường gặp

Mục này nói về 4 bẫy khi dùng middleware — có bẫy liên quan bảo mật, đọc kỹ.

- **Persist function/token nhạy cảm** → localStorage ai đọc cũng được (XSS). Fix: `partialize` loại ngay; token vào httpOnly cookie (nhóm `4_security-config`).
- **Persist `loading: true`** → reload xong kẹt spinner. Fix: chỉ persist dữ liệu, cờ nhất thời để initial — ai muốn giữ tờ giấy nhớ "đang đi chợ" trong tủ qua đêm cơ chứ.
- **Không chờ rehydrate** → UI nhảy số sau 1 frame, test flake. Fix: nhánh chờ `hasHydrated()` cho vùng quan trọng (giỏ/checkout).
- **Bọc sai thứ tự** (`persist(devtools(...))` vs ngược) → DevTools log thiếu bước. Fix: `devtools` ngoài cùng như mẫu.

> **Tóm gọn 1 câu:** Chỉ persist data vô hại, chờ `hasHydrated()` cho vùng quan trọng, và nhớ lớp ngoài cùng của middleware là `devtools`.

## Reference

- [persist](https://zustand.docs.pmnd.rs/middlewares/persist) · [devtools](https://zustand.docs.pmnd.rs/middlewares/devtools) · [immer](https://zustand.docs.pmnd.rs/middlewares/immer)
