# MVVM với Hooks

> Nguồn: https://react.dev/learn/reusing-logic-with-custom-hooks

## Mục tiêu
- Áp mô hình **MVVM** (Model–View–ViewModel) vào React thông qua custom hook `useViewModel`.
- Gom toàn bộ state + business logic mà không có JSX vào ViewModel → View chỉ render.
- Test logic bằng `renderHook` mà không cần render giao diện.

## Tổng quan
Trong Angular/WPF, MVVM tách **View** (giao diện), **ViewModel** (state hiển thị + lệnh + hành vi), **Model** (dữ liệu nghiệp vụ). React không có ViewModel sẵn, nhưng **custom hook chính là ViewModel tự nhiên**: nó giữ state, gọi API, bọc logic thành các action trả về; component (View) chỉ tiêu thụ. Pattern này đặc biệt ăn khớp khi một màn hình có nhiều state phụ thuộc nhau (form đăng nhập: email, error, pending…), cần test logic độc lập, hoặc muốn giữ component sạch để designer/dev UI làm việc dễ. Áp dụng cho từng màn hình/form phức tạp; không dùng cho component lá 5 dòng.

## Khái niệm cốt lõi
- **ViewModel** = custom hook trả về một object ổn định `{ data, loading, actions }`: không chứa JSX, không render — chỉ state + hành vi. View không được phép gọi logic "bên ngoài" (fetch, validation) mà phải qua actions của viewmodel.
- **View** = component nhận `vm = useMyViewModel(...)` và render thuần; mọi tương tác gọi `vm.action()`, mọi hiển thị đọc `vm.state`.
- **Tách layer rõ hơn container–presentational** (bài 2): ở đây *trách nhiệm logic* được tách hẳn sang một hàm hook riêng tên `useXViewModel`, thay vì nằm lẫn trong component container.
- **Testability**: `renderHook(() => useLoginViewModel())` + `act()` — chạy submit, kiểm tra `error`, `pending` mà không cần render UI, không cần router.
- **State máy (state machine)**: với các màn hình phức tạp (upload, payment), viewmodel thường kết hợp `useReducer` hoặc XState để diễn tả rõ trạng thái/transition — tránh biển boolean riêng lẻ.

## Luồng hoạt động / Cách áp dụng
1. Mô tả màn hình bằng ngôn ngữ: nó có những state nào (idle/submitting/success/error), những hành động nào.
2. Viết `useXViewModel()`: khai báo `useState`/`useReducer`, định nghĩa `submit`/`reset`/… dùng `useCallback` (nếu memo cần), trả về object tường minh.
3. Viết View: gọi hook, render state, gắn action vào `onClick`/`onSubmit`.
4. Nếu cần dùng chung logic nhiều màn hình → tách hook nhỏ hơn (composition), ViewModel lớn chỉ orchestrating.
5. Test: `renderHook` cho logic; test component nhẹ chỉ xác nhận "nút gọi đúng action".

## Ví dụ chi tiết
```tsx
import { useState } from 'react';

// ---------- ViewModel: toàn bộ state + logic, không có JSX ----------
export function useCounterViewModel(max = 10) {
  const [count, setCount] = useState(0); // state duy nhất của màn hình

  return {
    count,                                  // giá trị hiển thị
    canInc: count < max,                    // dẫn xuất: có tăng được nữa không
    canDec: count > 0,                      // dẫn xuất: có giảm được không
    inc: () => setCount((c) => Math.min(c + 1, max)), // chặn trần max
    dec: () => setCount((c) => Math.max(c - 1, 0)),   // chặn sàn 0
    reset: () => setCount(0),               // reset về 0
  };
}

// ---------- View: chỉ render, mọi thứ khác qua vm ----------
export function CounterView() {
  const vm = useCounterViewModel(5); // viewmodel có tham số max = 5
  return (
    <div>
      <p>Giá trị: {vm.count}</p>              {/* đọc state từ vm */}
      <button onClick={vm.dec} disabled={!vm.canDec}>−</button>
      <button onClick={vm.inc} disabled={!vm.canInc}>+</button>
      <button onClick={vm.reset}>Reset</button>
    </div>
  );
}
```

ViewModel cho form login (màn hình thực tế):
```tsx
export function useLoginViewModel() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit() {
    setPending(true); setError(null);
    try {
      const r = await fetch('/api/login', {
        method: 'POST', body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error('Sai email');   // lỗi nghiệp vụ → hiện cho user
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return { email, setEmail, error, pending, submit };
}
```

## Giải thích từng phần
- `canInc`/`canDec` là **derived state**: tính mỗi render từ `count`, không cần lưu riêng — View đọc để disable nút, tránh state trùng lặp (single source of truth).
- `setCount((c) => ...)` dùng functional update → an toàn khi gọi nhiều lần trong một sự kiện (bấm nhanh).
- View không "hiểu" luật nghiệp vụ (không biết trần 10) — nó chỉ tin `canInc`; đổi luật chỉ sửa viewmodel, view đứng yên.
- `submit` trong login viewmodel gộp `setPending`/`setError` đúng thứ tự — lỗi gọn vào 1 hành động duy nhất, View không phải nhớ cách set từng field.
- Trả về object **tên rõ ràng** (`error`, `pending`, `submit`) — hợp đồng View↔ViewModel đọc được như tài liệu.

## So sánh (nếu có)
- **MVVM hooks vs Container–Presentational**: container là component có data logic; viewmodel là hook tách rời hoàn toàn. MVVM mạnh hơn ở *testability logic* (renderHook không cần render) và ở chỗ View không thể "bất cẩn gọi store từ trong render".
- **MVVM (lift state lên hook) vs giữ state local trong component**: state local nhanh viết nhưng component phình và logic trộn với render; MVVM đẩy logic ra — chi phí: thêm 1 file/hook + hợp đồng rõ ràng.
- **`useState` rải rác vs `useReducer` trong viewmodel**: reducer diễn tả transition rõ (dispatch type) và test hàm reduce thuần dễ hơn, nhưng verbose; chọn khi state có ≥ 4–5 biến phụ thuộc nhau. XState/XStore cho flow phức tạp (payment, wizard).

## Lỗi thường gặp / Chống chỉ định
- **Trả về object mới mỗi render, prop-drill xuống `memo` con** → mất memoization vì tham chiếu thay đổi. Fix: `useMemo`/`useCallback` cho action, hoặc để View dùng trực tiếp, không ép memo.
- **ViewModel phình** (state + fetch + validation + formatting + navigation…) → khó test, "god hook". Fix: composition — mỗi hook nhỏ một việc, viewmodel tổ chức lại.
- **View gọi logic song song** (vừa dùng vm vừa tự `fetch`) → hai nguồn sự thật, desync. Fix: đưa mọi logic vào vm; View còn gọi hàm nào là dấu hiệu tách chưa đủ.
- **Mỗi màn hình "1 ViewModel khổng lồ" dù chỉ 1 ô input** → overhead. Fix: viewmodel cho form/màn hình thật sự nhiều state; ô input đơn nằm thẳng trong View là ổn.
- **Chống chỉ định**: màn hình thuần hiển thị (không logic), dữ liệu đã được TanStack Query container lo (bài 3 trước) — nhét thêm viewmodel làm trùng lặp trách nhiệm.

## Câu hỏi thường gặp
- **MVVM hook khác container component thế nào?** Container là component chứa logic + render con; ViewModel là hook thuần logic, View tách hoàn toàn — test độc lập dễ hơn.
- **Có phải mọi màn hình đều cần ViewModel?** Không. Màn hình nhiều state/hành vi (form, wizard) mới đáng; màn hình thuần hiển thị không cần.
- **Test ViewModel thế nào?** `renderHook(() => useLoginViewModel())` + `act(async () => …)`; kiểm tra state sau từng action, không cần render UI.
- **Trả object mới mỗi render có sao không?** Chỉ sao khi View ép `memo` con và object là prop — khi đó dùng `useMemo`/`useCallback`; còn lại không đáng lo.
- **ViewModel có nên gọi `useQuery` không?** Nên — data server gọi qua hook query trong ViewModel/entity; ViewModel thêm layer UI-state lên trên.

## Ghi chú 2026
- React 19 + Compiler giúp ViewModel tránh re-render không cần thiết và ổn định hàm/giá trị trả về tự động.
- Với form phức tạp, cân nhắc react-hook-form làm "model" còn ViewModel bọc validation/async submit.
- Testing Library `renderHook` là chuẩn để test logic hook không cần DOM.

## Best practices / Mẹo
- Đặt tên file `use<X>ViewModel.ts` → "đọc thư mục biết ngay lớp nào là view".
- Test logic bằng `renderHook` + `act` trước; test giao diện sau chỉ để xác nhận "nút gọi đúng action".
- Khi viewmodel dùng async (login), `useEffect`/AbortController dọn request cũ nếu user submit nhiều lần.
- Giữ View "dumb nhất có thể": không `if (vm.error)` lan man — View chỉ `{vm.error && ...}`.
- Kết hợp với TanStack Query đúng cách: data server gọi qua hook query **bên trong viewmodel** (hoặc entity), viewmodel chỉ thêm layer UI-state.

## Bài tập nhỏ
Viết `useOrderFormViewModel()` cho đơn hàng: fields (name, address), validate (name ≥ 3 ký tự, address ≥ 10), `submit()` gọi "/api/orders" với pending/error/success, `reset()`. Viết test `renderHook`: (1) submit với name ngắn → error "Tên quá ngắn", không gọi fetch; (2) submit hợp lệ → pending true rồi success. Sau đó dựng View form tương ứng.

## Reference
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [useReducer](https://react.dev/reference/react/useReducer)
- [Testing Library — renderHook](https://testing-library.com/docs/react-testing-library/api/#renderhook)