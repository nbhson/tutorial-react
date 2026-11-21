# Create + Selectors — Lõi Zustand

> Nguồn: https://zustand.docs.pmnd.rs/getting-started/introduction

## Mục tiêu

Mục này nói về ba đích đến của bài: tạo store đúng cú pháp TypeScript, đọc state bằng selector không render thừa, và dùng store cả ngoài React. Đọc để biết cuối bài bạn làm được gì.

- Tạo store bằng `create` đúng cú pháp curried TypeScript.
- Đọc đúng slice bằng selector, hiểu `Object.is` quyết định re-render.
- Dùng `useShallow` cho selector nhiều field; đọc/ghi ngoài React bằng `getState`/`setState`.

> **Tóm gọn 1 câu:** Zustand là "căn hộ không cần quản lý" — tạo store một dòng, và selector quyết định ai được báo tin khi đồ đạc đổi chỗ.

## Khái niệm cốt lõi

Mục này nói về 6 khái niệm lõi của Zustand — đọc để hiểu cơ chế "ai re-render khi nào" trước khi xem code.

- **`create<T>()((set, get) => ...)`**: cặp `()` thứ hai bắt buộc để TypeScript suy kiểu. `set` ghi bất biến, `get` đọc state hiện tại trong action. Ví von: cặp ngoặc kép `()()` như viết hai lần tên người nhận trên bìa thư — thiếu một lần, bưu cục (TS) không biết giao cho ai.
- **Selector**: `useCart((s) => s.items.length)` — component subscribe đúng lát; Zustand so kết quả bằng `Object.is`, khác mới re-render. Hãy hình dung selector như kênh truyền hình: component chỉ đăng ký đúng kênh mình xem, kênh khác phát sóng thì không bị làm phiền.
- **Không selector = re-render mọi thay đổi**: `useCart()` trần subscribe cả store — field nào đổi cũng render lại.
- **`useShallow(selector)`**: so sánh nông object/mảng trả về — `{ a, b }` cùng giá trị thì không render lại dù tham chiếu mới. Ví von: so nội dung hai tờ giấy chứ không so hai tờ giấy đó có phải cùng tờ không.
- **Đọc ngoài React**: `useCart.getState().items` (event handler, non-React code), `useCart.setState(...)` ghi trực tiếp — tiện nhưng kỷ luật, tránh "global ẩn".
- **Action ổn định tham chiếu**: function trong store tạo một lần — truyền xuống con `memo` không gây miss như callback inline.

> **Tóm gọn 1 câu:** Selector là "kênh đăng ký" của component — chọn đúng lát cần, dùng `useShallow` khi trả object/mảng, và `useCart()` trần là tấm thẻ đăng ký "cả nhà truyền hình".

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song phần giải thích dưới.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về từng chi tiết trong ví dụ — đọc để hiểu "vì sao viết vậy" chứ không phải chép.

- `set((s) => ...)` dạng function: đọc state mới nhất — an toàn khi nhiều `add` dồn trong cùng event (batch).
- `useShallow` bọc ngoài selector object — không có nó, `{ add, clear }` mới mỗi lần gọi là render lại mãi.
- Action trong store (`add`/`clear`) tham chiếu không đổi suốt đời store — khác `useCallback` phải memo tay, như chìa khóa nhà được rèn một lần dùng mãi.
- `getState()` ngoài React vẫn trigger subscriber — store không phân biệt ai gọi, chỉ báo đổi.

## Lỗi thường gặp

Mục này nói về 4 bẫy phổ biến với người mới dùng Zustand — đọc để UI của bạn không "đơ" hay render vô hạn.

- **Mutate trong `set`** (`s.items.push(x)`) → tham chiếu cũ, subscriber không thấy, UI "đơ". Fix: luôn mảng/object mới.
- **Selector `.filter`/object literal không `useShallow`** → mảng mới mỗi lần → re-render vô hạn. Fix: nguyên thủy hoặc `useShallow`.
- **`useCart()` trần ở component lớn** → đổi field nào cũng render cả cây con. Fix: tách selector nhỏ, tách component đọc riêng.
- **Lưu derived (tổng tiền) vào store** → lệch khi items đổi mà quên tính lại. Fix: `useCart((s) => s.items.reduce(...))` tính lúc đọc — tổng tiền là con số trên hóa đơn in lúc đọc, không phải hàng lưu kho.

> **Tóm gọn 1 câu:** `set` luôn trả đồ mới, selector trả nguyên thủy hoặc `useShallow`, và derived data tính lúc đọc chứ không cất vào kho.

## Reference

- [Zustand — Getting started](https://zustand.docs.pmnd.rs/getting-started/introduction)
