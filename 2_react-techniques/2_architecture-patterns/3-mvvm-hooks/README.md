# MVVM với Hooks

> Nguồn: https://react.dev/learn/reusing-logic-with-custom-hooks

## Mục tiêu

Mục này nói về ba đích của bài: áp mô hình MVVM vào React qua custom hook, gom logic vào ViewModel, và test logic không cần UI. Đọc để thấy bài giúp bạn tổ chức màn hình phức tạp ra sao.

- Áp mô hình **MVVM** (Model–View–ViewModel) vào React thông qua custom hook `useViewModel`.
- Gom toàn bộ state + business logic mà không có JSX vào ViewModel → View chỉ render.
- Test logic bằng `renderHook` mà không cần render giao diện.

> **Tóm gọn 1 câu:** MVVM trong React là "custom hook làm bộ não, component làm gương mặt" — não test được riêng, gương mặt chỉ phản chiếu.

## Tổng quan

Mục này nói về cách MVVM được "dịch" sang thế giới React: ViewModel vốn của Angular/WPF hóa thân thành custom hook.

Trong Angular/WPF, MVVM tách **View** (giao diện), **ViewModel** (state hiển thị + lệnh + hành vi), **Model** (dữ liệu nghiệp vụ). React không có ViewModel sẵn, nhưng **custom hook chính là ViewModel tự nhiên**: nó giữ state, gọi API, bọc logic thành các action trả về; component (View) chỉ tiêu thụ. Ví von: hook là người quản lý quầy đứng sau quầy lo mọi thủ tục, còn nhân viên quầy (View) chỉ nhận phiếu và trao cho khách. Pattern này đặc biệt ăn khớp khi một màn hình có nhiều state phụ thuộc nhau (form đăng nhập: email, error, pending…), cần test logic độc lập, hoặc muốn giữ component sạch để designer/dev UI làm việc dễ. Áp dụng cho từng màn hình/form phức tạp; không dùng cho component lá 5 dòng.

> **Tóm gọn 1 câu:** Custom hook là ViewModel tự nhiên của React — logic sống trong hook, View chỉ đọc state và gọi action.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm của MVVM-hooks — đọc để hiểu ranh giới giữa View và ViewModel trước khi xem code.

- **ViewModel** = custom hook trả về một object ổn định `{ data, loading, actions }`: không chứa JSX, không render — chỉ state + hành vi. View không được phép gọi logic "bên ngoài" (fetch, validation) mà phải qua actions của viewmodel. Ví von: ViewModel như bảng điều khiển của máy bay — phi công (View) chỉ bấm nút và đọc kim, không tự đấu dây bên trong.
- **View** = component nhận `vm = useMyViewModel(...)` và render thuần; mọi tương tác gọi `vm.action()`, mọi hiển thị đọc `vm.state`.
- **Tách layer rõ hơn container–presentational** (bài 2): ở đây *trách nhiệm logic* được tách hẳn sang một hàm hook riêng tên `useXViewModel`, thay vì nằm lẫn trong component container.
- **Testability**: `renderHook(() => useLoginViewModel())` + `act()` — chạy submit, kiểm tra `error`, `pending` mà không cần render UI, không cần router.
- **State máy (state machine)**: với các màn hình phức tạp (upload, payment), viewmodel thường kết hợp `useReducer` hoặc XState để diễn tả rõ trạng thái/transition — tránh biển boolean riêng lẻ. Hãy hình dung `isPending && !error && isSuccess` là một biển cờ đỏ-xanh chồng chéo, còn state machine là một bảng mạch chỉ ở đúng một trạng thái tại một thời điểm.

> **Tóm gọn 1 câu:** ViewModel là hook không-JSX trả `{ data, loading, actions }`, View chỉ đọc-và-gọi, và màn hình phức tạp thì dùng reducer/state machine thay biển boolean.

## Luồng hoạt động / Cách áp dụng

Mục này nói về 5 bước dựng MVVM cho một màn hình — từ phác họa state đến test. Đọc để có trình tự cụ thể.

1. Mô tả màn hình bằng ngôn ngữ: nó có những state nào (idle/submitting/success/error), những hành động nào.
2. Viết `useXViewModel()`: khai báo `useState`/`useReducer`, định nghĩa `submit`/`reset`/… dùng `useCallback` (nếu memo cần), trả về object tường minh.
3. Viết View: gọi hook, render state, gắn action vào `onClick`/`onSubmit`.
4. Nếu cần dùng chung logic nhiều màn hình → tách hook nhỏ hơn (composition), ViewModel lớn chỉ orchestrating.
5. Test: `renderHook` cho logic; test component nhẹ chỉ xác nhận "nút gọi đúng action".

> **Tóm gọn 1 câu:** Mô tả state bằng lời → viết viewmodel → viết View "dumb" → tách hook con khi lặp → test logic bằng `renderHook`.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song phần giải thích dưới.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

ViewModel cho form login (màn hình thực tế):
> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về từng chi tiết trong ví dụ — những điểm làm nên "hợp đồng" giữa View và ViewModel.

- `canInc`/`canDec` là **derived state**: tính mỗi render từ `count`, không cần lưu riêng — View đọc để disable nút, tránh state trùng lặp (single source of truth). Ví von: tổng tiền trên hóa đơn là tính lúc in từ danh sách món, không phải một con số lưu riêng dễ lệch.
- `setCount((c) => ...)` dùng functional update → an toàn khi gọi nhiều lần trong một sự kiện (bấm nhanh).
- View không "hiểu" luật nghiệp vụ (không biết trần 10) — nó chỉ tin `canInc`; đổi luật chỉ sửa viewmodel, view đứng yên.
- `submit` trong login viewmodel gộp `setPending`/`setError` đúng thứ tự — lỗi gọn vào 1 hành động duy nhất, View không phải nhớ cách set từng field.
- Trả về object **tên rõ ràng** (`error`, `pending`, `submit`) — hợp đồng View↔ViewModel đọc được như tài liệu.

> **Tóm gọn 1 câu:** Derived state tính lúc đọc, View tin viewmodel tuyệt đối, và object trả về phải đọc như hợp đồng ký tên rõ ràng.

## So sánh (nếu có)

Mục này nói về ba cặp lựa chọn kiến trúc đặt cạnh nhau. Đọc để biết khi nào MVVM đáng trả giá.

- **MVVM hooks vs Container–Presentational**: container là component có data logic; viewmodel là hook tách rời hoàn toàn. MVVM mạnh hơn ở *testability logic* (renderHook không cần render) và ở chỗ View không thể "bất cẩn gọi store từ trong render".
- **MVVM (lift state lên hook) vs giữ state local trong component**: state local nhanh viết nhưng component phình và logic trộn với render; MVVM đẩy logic ra — chi phí: thêm 1 file/hook + hợp đồng rõ ràng.
- **`useState` rải rác vs `useReducer` trong viewmodel**: reducer diễn tả transition rõ (dispatch type) và test hàm reduce thuần dễ hơn, nhưng verbose; chọn khi state có ≥ 4–5 biến phụ thuộc nhau. XState/XStore cho flow phức tạp (payment, wizard).

> **Tóm gọn 1 câu:** MVVM là container–presentational "tách sâu hơn một bậc" — logic rời component hoàn toàn để test được không cần render.

## Lỗi thường gặp / Chống chỉ định

Mục này nói về 5 bẫy khi áp MVVM — từ "god hook" đến áp viewmodel cho ô input đơn. Đọc để pattern không biến thành gánh nặng.

- **Trả về object mới mỗi render, prop-drill xuống `memo` con** → mất memoization vì tham chiếu thay đổi. Fix: `useMemo`/`useCallback` cho action, hoặc để View dùng trực tiếp, không ép memo.
- **ViewModel phình** (state + fetch + validation + formatting + navigation…) → khó test, "god hook". Fix: composition — mỗi hook nhỏ một việc, viewmodel tổ chức lại. Ví von: một quản lý gánh cả kế toán, kho, nhân sự là quản lý bỏ bê — chia việc cho các trưởng nhóm (hook con) trước.
- **View gọi logic song song** (vừa dùng vm vừa tự `fetch`) → hai nguồn sự thật, desync. Fix: đưa mọi logic vào vm; View còn gọi hàm nào là dấu hiệu tách chưa đủ.
- **Mỗi màn hình "1 ViewModel khổng lồ" dù chỉ 1 ô input** → overhead. Fix: viewmodel cho form/màn hình thật sự nhiều state; ô input đơn nằm thẳng trong View là ổn.
- **Chống chỉ định**: màn hình thuần hiển thị (không logic), dữ liệu đã được TanStack Query container lo (bài 3 trước) — nhét thêm viewmodel làm trùng lặp trách nhiệm.

> **Tóm gọn 1 câu:** Đừng để viewmodel thành god hook, đừng để View tự fetch lén lút, và đừng đeo MVVM cho màn hình chỉ có một ô input.

## Câu hỏi thường gặp

Mục này nói về các câu hỏi ranh giới hay đắn nhất khi áp MVVM — tra nhanh khi phân vân.

- **MVVM hook khác container component thế nào?** Container là component chứa logic + render con; ViewModel là hook thuần logic, View tách hoàn toàn — test độc lập dễ hơn.
- **Có phải mọi màn hình đều cần ViewModel?** Không. Màn hình nhiều state/hành vi (form, wizard) mới đáng; màn hình thuần hiển thị không cần.
- **Test ViewModel thế nào?** `renderHook(() => useLoginViewModel())` + `act(async () => …)`; kiểm tra state sau từng action, không cần render UI.
- **Trả object mới mỗi render có sao không?** Chỉ sao khi View ép `memo` con và object là prop — khi đó dùng `useMemo`/`useCallback`; còn lại không đáng lo.
- **ViewModel có nên gọi `useQuery` không?** Nên — data server gọi qua hook query trong ViewModel/entity; ViewModel thêm layer UI-state lên trên.

## Ghi chú 2026

Mục này nói về những cập nhật React 19/hệ sinh thái liên quan MVVM — đọc để không áp cách cũ.

- React 19 + Compiler giúp ViewModel tránh re-render không cần thiết và ổn định hàm/giá trị trả về tự động.
- Với form phức tạp, cân nhắc react-hook-form làm "model" còn ViewModel bọc validation/async submit.
- Testing Library `renderHook` là chuẩn để test logic hook không cần DOM.

## Best practices / Mẹo

Mục này nói về 5 thói quen giữ MVVM lành mạnh — từ đặt tên file đến cách phối hợp với TanStack Query.

- Đặt tên file `use<X>ViewModel.ts` → "đọc thư mục biết ngay lớp nào là view".
- Test logic bằng `renderHook` + `act` trước; test giao diện sau chỉ để xác nhận "nút gọi đúng action".
- Khi viewmodel dùng async (login), `useEffect`/AbortController dọn request cũ nếu user submit nhiều lần.
- Giữ View "dumb nhất có thể": không `if (vm.error)` lan man — View chỉ `{vm.error && ...}`.
- Kết hợp với TanStack Query đúng cách: data server gọi qua hook query **bên trong viewmodel** (hoặc entity), viewmodel chỉ thêm layer UI-state.

> **Tóm gọn 1 câu:** Tên file nói lên vai, View dumb nhất có thể, và data server luôn đi qua hook query trong viewmodel chứ không rải rác.

## Bài tập nhỏ

Mục này nói về bài thực hành dựng viewmodel cho form đơn hàng kèm test — làm một lần để "chắc tay" cả logic lẫn test.

Viết `useOrderFormViewModel()` cho đơn hàng: fields (name, address), validate (name ≥ 3 ký tự, address ≥ 10), `submit()` gọi "/api/orders" với pending/error/success, `reset()`. Viết test `renderHook`: (1) submit với name ngắn → error "Tên quá ngắn", không gọi fetch; (2) submit hợp lệ → pending true rồi success. Sau đó dựng View form tương ứng.

> **Tóm gọn 1 câu:** Xong bài tập là bạn có một "khung form chuẩn" — viewmodel test được độc lập, View lắp vào chạy ngay.

## Reference

- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [useReducer](https://react.dev/reference/react/useReducer)
- [Testing Library — renderHook](https://testing-library.com/docs/react-testing-library/api/#renderhook)
