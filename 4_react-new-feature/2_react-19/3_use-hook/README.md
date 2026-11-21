# 3. use() hook

## Mô tả
- Bài này giới thiệu **`use()`** — API đọc **Promise hoặc Context ngay trong render**, ra mắt stable trong React 19 (**12/2024**).
- Điểm độc đáo: `use()` **không phải hook** theo nghĩa cũ — nó **không cần gọi top-level**: được phép dùng trong `if`, sau early-return, trong loop.
- Đọc Promise sẽ **suspend** (dừng render của boundary gần nhất) cho tới khi Promise resolve; đọc Context thì như `useContext`.
- Pattern quan trọng: Server Component (RSC) pass **Promise** cho Client Component → client `use(promise)` unwrap mà không cần protocol riêng.

## Mục tiêu
- Unwrap Promise trong render thay cho `useEffect + useState` thủ công.
- Đọc Context có điều kiện mà không vi phạm quy tắc hooks.
- Hiểu yêu cầu bắt buộc: `<Suspense>` quanh `use(promise)` + promise tạo **bên ngoài render**.

## Vấn đề giải quyết

Mục này nêu 2 "quy tắc chai lọ" cũ: `useContext` bắt buộc đặt trên đỉnh, và Promise chỉ đọc được qua bộ `useEffect + useState` dài dòng. Đọc để thấy `use()` đập vỡ những chai lọ đó.

- **`useContext` phải top-level, vô điều kiện** → chẳng hạn "chỉ đọc theme khi `showTheme` bật" buộc phải gọi `useContext` luôn hoặc tự tách component → code rườm rà.
- **Unwrap promise** cũ: `useEffect` + `useState` + xử lý loading/error + guard race → boilerplate dài; sai thứ tự dễ fetch lại.
- RSC pass dữ liệu async: trước đây phải `await` hết trên server rồi truyền JSON; giờ pass **Promise xuống client**, client quyết định suspend theo nhu cầu.

## Khái niệm cốt lõi

Mục này trả lời câu hỏi "use() khác hook ở điểm nào". Ví von: hook thường là máy ATM — chỉ dùng ở sảnh (top-level), còn `use()` là ví tiền: rút tiền ở đâu trong render cũng được, miễn là trong giờ render.

- `use(resource)` nhận một trong hai loại resource:
  - **Promise**: đọc "giá trị bên trong". Nếu chưa resolve → **throw Promise** (cơ chế suspend) → React tìm `<Suspense>` gần nhất, hiện fallback; khi resolve → render lại.
  - **Context**: tương đương `useContext(Context)` — chỉ khác là được gọi có điều kiện.
- Giống hook ở chỗ: chỉ gọi trong **hàm component/hook đang render**, không gọi trong `useEffect`/event/handler; khác ở chỗ: **không có quy tắc "always top-level"**.
- **Promise phải ổn định giữa các render**: nếu tạo promise mới trong thân render → mỗi lần suspend/resolve tạo promise khác → **suspend vô hạn** (infinite loop). Giải pháp: tạo promise ở module scope, từ `cache()`, từ RSC, hoặc store trong `useState`/`useRef`.
- Trong client concurrent, `use(promise)` cũng hưởng **Suspense cơ chế chuẩn**: transition có thể giữ fallback, streaming SSR có thể stream boundary.

> **Tóm gọn 1 câu:** `use()` là "chìa khóa vạn năng" đọc Promise và Context ở bất kỳ nhánh nào của render — chỉ cần nhớ 2 điều: promise phải ổn định, và phải có `<Suspense>` chờ.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

Điều kiện: promise resolve → render lại; reject → cần Error Boundary quanh `<Suspense>` để bắt lỗi.

## Luồng hoạt động (Flow)

Mục này đi qua 5 bước đời của một `use(promise)`: render → ném Promise → fallback → resolve → (hoặc) reject sang Error Boundary.

1. Render `<Profile>` gặp `use(userPromise)`.
2. Promise chưa resolve → `use` **ném promise** → React treo render boundary.
3. `<Suspense fallback>` hiển thị.
4. Promise resolve → React render lại boundary → `use` trả giá trị → UI hoàn chỉnh.
5. Promise reject → error propagated → Error Boundary (nếu có) hiển thị.

> **Tóm gọn 1 câu:** `use(promise)` hoạt động bằng "ném promise để xin nghỉ phép": chưa xong thì Suspense thay ca, xong thì quay lại làm tiếp đúng chỗ dở.

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- `const userPromise = fetchUser()` — module scope: cùng một promise mọi render → `use` không bao giờ bị "treo vô hạn".
- `const theme = showTheme ? use(ThemeContext) : '(ẩn theme)'` — `use` trong ternary: điều hooks thường cấm, `use` cho phép vì không phụ thuộc thứ tự.
- `<ThemeContext value="dark">` — cú pháp provider mới của React 19; cả hai `ThemedGreeting` cùng đọc ở vị trí khác nhau.
- 2 instance cùng suspend trên 1 promise → **một Suspense chung** hiện fallback một lần, resolve rồi cả hai render.

## So sánh với cách làm cũ

Bảng dưới xếp 4 việc từng phải vòng vèo thành 4 việc dùng `use()` thẳng tắp. Đọc theo hàng: cột "Cách cũ" là những gì bạn có thể đang viết trong codebase hiện tại.

| Vấn đề | Cách cũ | Cách mới (`use()`) | Lợi ích |
|---|---|---|---|
| Đọc Context có điều kiện | `useContext` top-level + biến phụ | `use(Context)` trong `if` | Code theo logic thật |
| Unwrap Promise | `useEffect` + `useState` + loading state | `use(promise)` + Suspense | Bỏ boilerplate, không race |
| RSC → client data | `await` server hết, pass JSON | Pass **Promise** xuống, client `use()` | Client tự chọn suspend point |
| Loading UI | Tự quản boolean | `<Suspense fallback>` | Chỉ định nghĩa một lần |

> **Cách đọc bảng này:** mỗi hàng là một tác vụ; hàng thứ hai và thứ ba liên quan tới dữ liệu async, hai hàng còn lại là Context và loading UI — ghép lại là 4 "mặt trận" mà `use()` đơn giản hóa.

## Lỗi thường gặp

Mục này gom 5 bẫy, đứng đầu là bẫy "tạo promise trong render" — nguyên nhân số một gây infinite suspend.
1. **Tạo promise trong render** → vì sao: mỗi lần suspend/resolve tạo promise mới → suspend vô hạn → fix: module scope, `cache()`, hoặc state/ref ổn định (RSC framework lo).
2. **Gọi `use()` trong `useEffect`/event handler** → vì sao: sai địa điểm, `use` chỉ hợp lệ trong render → fix: dùng `await`/`then` ở event; `use` chỉ ở render path.
3. **Quên `<Suspense>`** → vì sao: suspend không có boundary → lỗi render ("A component suspended while responding to synchronous input") → fix: bọc boundary gần nhất, hoặc đảm bảo promise đã resolve.
4. **Không có Error Boundary khi promise reject** → vì sao: lỗi suspend không bắt được → fix: bọc `<ErrorBoundary>` quanh `<Suspense>`.
5. **Dùng `use()` cho Context nhưng vẫn viết "giả hook top-level" thừa** → vì sao: mất ý nghĩa; `use` sinh ra để linh hoạt → fix: dùng có điều kiện khi thật sự cần.

> **Tóm gọn 1 câu:** `use()` giống thuê phòng khách sạn: promise phải là "phòng đã đặt trước" (ổn định), không phải "đặt mới mỗi lần ghé" — và luôn cần có "sảnh chờ" Suspense.

## Khi nào dùng / Khi nào không
- **Dùng**: unwrap promise từ RSC/`cache()`, đọc context có điều kiện (theme/locale/permission), fetch dữ liệu theo kiểu Suspense trong client app.
- **Không dùng**: trong `useEffect`/handlers (không phải render), khi promise không ổn định, hoặc khi bạn chỉ cần đọc context vô điều kiện (lúc đó `useContext` gọn hơn).

## Bài tập nhỏ

Bài tập kiểm tra cả happy path lẫn bẫy infinite suspend — làm xong bạn sẽ hiểu vì sao promise ổn định là điều kiện sống còn.

- Viết component `PostDetail` nhận prop `promise: Promise<{title, body}>` từ module cache; render qua `use(promise)` trong `<Suspense>`. Thêm nút "Đọc lại" tạo promise mới qua `cache()`/state rồi dùng — xác nhận fallback hiện lại đúng một lần, không infinite suspend.

> **Tóm gọn 1 câu:** Fallback hiện đúng một lần và không treo vô hạn = bạn đã quản lý promise ổn định đúng cách.

## Reference
- [use() hook](https://react.dev/reference/react/use)
- [Suspense](https://react.dev/reference/react/Suspense)
- [React 19 Release](https://react.dev/blog/2024/12/05/react-19)