# useDeferredValue + useTransition

> Nguồn: https://react.dev/reference/react/useDeferredValue — https://react.dev/reference/react/useTransition

## Mục tiêu
- Giữ input/search **phản hồi tức thì** ngay cả khi phía sau là render danh sách nặng.
- Dùng `useTransition` đánh dấu update ít ưu tiên (giữ UI cũ + `isPending`).
- Dùng `useDeferredValue` trì hoãn giá trị dẫn đến render nặng (filter/sort/search).

## Tổng quan
Khi gõ ô tìm kiếm, mỗi phím kích hoạt `setQuery` → filter 50.000 phần tử → render lại cả list. Nếu làm "ngay mà không suy nghĩ", keypress bị block, gõ bị delay — UX tệ. Hai hook sinh đôi trong React 18+ giải quyết bằng **ưu tiên tác vụ** (scheduling): React chia update thành *urgent* (nhập chữ — phải tức thì) và *non-urgent* (lọc/render list — có thể chờ). `useTransition` quấn `setState` vào `startTransition` để "hạ độ ưu tiên"; `useDeferredValue` đơn giản hơn: tạo **bản sao trễ** của một giá trị dùng riêng cho render nặng — giá trị gốc vẫn cập nhật ngay (input nhạy), bản trễ cập nhật khi main thread rảnh. Áp dụng cho: filter/search to, tab chuyển đổi view phức tạp, sort lớn, bất kỳ "render nặng theo input".

## Khái niệm cốt lõi
- **Concurrency (tính đồng thời trong React)**: render không còn "in sync" tuyệt đối — React có thể render update non-urgent *rồi hủy giữa chừng* nếu urgent xuất hiện, giữ màn hình cũ hoàn hảo tới khi sẵn sàng.
- **`useTransition`** trả `[isPending, startTransition]`: bọc `setState` bên trong để React coi nó low-priority. `isPending = true` lúc rendering pending — dùng cho spinner/qu'é: UI cũ vẫn hiển thị, không chớp trắng.
- **`useDeferredValue(value)`**: trả một "lazy twin" của `value` — khởi đầu giữ giá trị cũ, sau đó "bắt kịp" khi event xong; render *đọc nó* (list) là render non-urgent, còn render đọc `value` gốc (input) là urgent. Không cần bọc `setState`.
- **Kết hợp với `memo`/Compiler**: render deferred vẫn là render (dù trì hoãn) — `memo`/compiler giúp phần list ít thay đổi bỏ qua; tổ hợp đúng: deferred xử lý *khi nào*, memo xử lý *ai được re-render*.
- Phân biệt với **debounce**: debounce trì hoãn update tới khi ngưng gõ (cảm giác "imo 1–2s"); deferred không hoãn *vĩnh viễn* — nó giữ input responsive và bắt kịp dần, không đánh mất lần gõ cuối (thường được ưa hơn cho search).
- **Tại sao deferred "đợi" được**: React duy trì *hai phiên bản giá trị* — bản khẩn cho UI nhạy cảm (input) và bản trễ cho phần render đắt. Khi main thread bận (đang vẽ list cũ), React hoãn công việc deferred, ưu tiên sự kiện người dùng mới; render deferred chỉ chạy giữa các lần idle.
- **`startTransition` bên trong thư viện**: các lib như React Router (điều hướng), TanStack Table (sort/filter) đã tự quấn transition — bạn thấy mượt mà không cần đụng tay; hiểu cơ chế để khi cần tinh chỉnh (tắt transition, đo) biết đường làm.
- **Multi-deferred**: một màn hình có thể dùng nhiều `useDeferredValue` (query + filter cùng lúc) — miễn mỗi phần render đọc đúng biến trễ của mình.

## Luồng hoạt động / Cách áp dụng
1. Xác định "render nặng theo input": filter/sort list lớn, large recharts, template.
2. Với controlled input đơn giản → `useDeferredValue(query)` cho danh sách; giữ `setQuery` trực tiếp cho input.
3. Với update có cấu trúc hơn (đổi tab, count query) → `startTransition(() => setState(...))` + đọc `isPending` hiển thị nhẹ.
4. Kết hợp `useMemo` cho kết quả tính (filter) theo deferred value.
5. Đo: Healthcheck — gõ phím nhanh: input không delay; DevTools Profiler thể hiện lượt render non-urgent tách rời.

## Ví dụ chi tiết
```tsx
import { useDeferredValue, useMemo, useState, useTransition } from 'react';

export function FilterDemo({ items }: { items: string[] }) {
  const [query, setQuery] = useState('');        // value gốc — "sự thật" của input
  const [isPending, startTransition] = useTransition(); // guard update nền
  const deferred = useDeferredValue(query);      // bản "trễ" cho phần render nặng

  // kết quả lọc dựa trên deferred, không phải query gốc
  const result = useMemo(
    // so sánh lowercase để tìm không phân biệt hoa thường
    () => items.filter((i) => i.toLowerCase().includes(deferred.toLowerCase())),
    [items, deferred],                            // deps: items + giá trị trễ
  );

  return (
    <div>
      <input
        value={query}                             // input luôn phản hồi tức thì
        placeholder="Tìm kiếm…"
        onChange={(e) => startTransition(() => setQuery(e.target.value))}
      />
      {/* pending: báo nhẹ "đang lọc" cho tác vụ nền */}
      {isPending && <p>Đang lọc…</p>}
      <p>{result.length} kết quả</p>              {/* đếm theo kết quả trễ */}
      <ul>{result.slice(0, 50).map((r) => <li key={r}>{r}</li>)}</ul>
      {/* chỉ hiện 50 dòng — việc filter 100k phần tử vẫn đắt, chỗ này là render */}
    </div>
  );
}
```

## Giải thích từng phần
- `query` gốc dùng cho `input` — mỗi phím gõ, React cập nhật ô input **ngay** (urgent) → không lag gõ.
- `deferred` bắt chước `query` nhưng "trễ": — list render **đọc deferred** nên nó là render non-urgent; React vẽ nó vào lúc rảnh, trong khi đó vẫn giữ UI cũ.
- `startTransition` quanh `setQuery` đánh dấu luôn hành vi "thấp" — với `useDeferredValue` *có thể bỏ* `useTransition`, nhưng giữ để có `isPending` cho micro-feedback (spinner/đang lọc).
- `useMemo` theo `deferred` đảm bảo không tính filter lại mỗi khi `query` đổi mà kết quả tương đương; nếu items đổi -> invoke lại đúng do deps.
- `result.slice(0, 50)` — giới hạn render; với list thực sự lớn kết hợp thêm virtualize (bài 2) — deferred không thay cho virtualization, chúng cộng hưởng.

## So sánh (nếu có)
- **`useDeferredValue` vs `useTransition`**: deferred — không đụng tay `setState`, chỉ "lọc nơi đọc" (đơn giản, gọn với list/search); transition — bọc nguyên cây update, cho `isPending` tổng (phù hợp tab/filter/wizard "đổi cả view"). Chọn: chỉ 1 list nặng theo input → deferred; đổi cả trang/query nặng → transition (hoặc cả hai).
- **vs debounce**: debounce hoãn toàn bộ — gõ dừng 300ms mới lọc; deferred không "đợi dừng", vẫn lọc theo tốc độ sẵn sàng, không mất lần gõ cuối. Debounce còn hữu ích khi *server* bị spam request; deferred có thể dùng kèm nhưng không thay thế cho việc giới hạn network.
- **vs `React.memo`**: hai mặt: deferred quyết định *khi* render, memo quyết định *có bớt phần nào không*. Kết hợp thay vì "or".

## Lỗi thường gặp / Chống chỉ định
- **Dùng `deferred` cho input chính** (rồi render input bằng deferred) → ô input cập nhật trễ, ngược đời: gõ chậm. Fix: input đọc value gốc; phần nặng đọc deferred.
- **Quên `useMemo` quanh filter** → mỗi render (kể cả defer) lọc lại từ đầu list 100k — hàm thừa. Fix: useMemo deps `[items, deferred]`; hoặc compiler tự làm.
- **Đặt `isPending` làm trạng thái "chặn render"** → pending chỉ là báo hiệu, đừng early-return (sẽ gây chớp trắng thay vì giữ UI cũ).
- **Tưởng deferred = debounce cho network** → vẫn gửi request mỗi lần filter được tính lại. Fix: kết hợp debounce/`startTransition` ở tầng query, hoặc stale-while-revalidate.
- **Chống chỉ định**: render nhẹ (< 50ms) — thêm hoãn không cần; tránh dùng cho trường hợp phải phản hồi tức thì tuyệt đối như nhập mật khẩu/OTP hay auto-save từng ký tự — lúc đó gõ xong rồi mới kịp xử lý sẽ gây mất chữ/cảm giác lag.

## Câu hỏi thường gặp
- **Deferred khác debounce thế nào?** Debounce chờ ngưng gõ rồi mới chạy (có độ trễ cố định); deferred giữ input nhạy và cập nhật list khi rảnh, không mất lần gõ cuối.
- **Khi nào dùng transition, khi nào deferred?** Một giá trị gây render nặng → deferred; một update làm đổi cả view/query/route → transition (có `isPending`).
- **Có cần kết hợp cả hai không?** Thường có — `useTransition` cho `setState` lớn, `useDeferredValue` cho giá trị lọc/hiển thị; hoặc chỉ một trong hai là đủ.
- **`isPending` dùng làm gì?** Báo nhẹ rằng update nền đang chạy (giữ UI cũ), không phải để chặn render hay thay thế loading state ban đầu.
- **Có thay thế virtualization không?** Không — deferred chỉ hoãn thời điểm render, không giảm số DOM nodes; list khổng lồ vẫn cần virtualization.

## Ghi chú 2026
- React 19 ổn định concurrent rendering; `useDeferredValue`/`useTransition` là API chuẩn cho ưu tiên tác vụ.
- React Router v7 tự quấn transition cho điều hướng, giúp chuyển route không đơ khi page nặng.
- Kết hợp React Compiler: ít render dư hơn, nhưng deferred vẫn hữu ích cho tác vụ filter/sort thật sự nặng.

## Best practices / Mẹo
- Nguyên tắc chung: **input urgent, output deferred** — một điểm cắm tiêu chuẩn cho search/filter.
- Kết hợp `isPending` với một chỉ báo nhỏ ("Đang lọc…") font nhẹ, không chặn thao tác.
- Đo bằng Profiler: quan sát 2 khối render tách — urgent nhỏ (input), non-urgent lớn (list); nếu thấy chúng "gộp", kiểm tra bạn có đọc deferred ở đúng nơi.
- Với list khổng lồ + deferred + memo + virtualization = công thức full (filter mượt, DOM ít).
- Trong React 19 + Compiler, deps tự ổn định hơn; vẫn giữ `useMemo` khi filter thật đắt để rõ ý đồ.
- Khi deferred không cải thiện (render vẫn đơ), thủ phạm thường là render *phần khác* đắt — dùng Profiler tìm "wide render" (cha render kéo con), sửa cấu trúc trước.
- Đừng mô phỏng "đang lọc" bằng cách chặn input; `isPending` chỉ nên điều khiển độ mờ/opacity của list cũ, giữ mọi thao tác khác hoạt động.
- Dùng `useDeferredValue(value, initialValue)` (React 19) để đặt giá trị khởi tạo cho lần render đầu.
- Không dùng cho update sync bắt buộc như nhập OTP/mật khẩu — cần phản hồi tức thì tuyệt đối.
- Nếu `isPending` kéo dài bất thường, kiểm tra state update vòng lặp làm deferred không bắt kịp.
- Đo cải thiện bằng **INP** (Interaction to Next Paint) trên Lighthouse/Performance, không chỉ cảm giác.
- Giữ danh sách kết quả trong `useMemo` theo deferred để không tính lại ngoài ý muốn.
- Bọc `startTransition` cho đổi tab/route nội bộ để UI cũ không bị thay chớp nhoáng.
- Với danh sách rất lớn, kết hợp deferred + `memo` row + virtualization.
- Thông báo trạng thái `isPending` qua `aria-live` để screen reader biết đang xử lý.
- Tránh đẩy `isPending` vào global store — sẽ re-render toàn app thay vì chỉ vùng cần.
- Đo trước khi thêm: nhiều màn hình render nhẹ không cần đến concurrency.
- Dùng `useTransition` cho điều hướng nội bộ (tab/wizard) không đổi URL.
- Giữ `query` gốc cho input và chỉ dùng deferred để lọc — đừng trộn lẫn hai biến.

## Bài tập nhỏ
Tạo ô search filter 20.000 string + hiện kết quả. (1) Đo không tối ưu: trực tiếp setQuery → filter → render — ghi nhận delay/gõ lag. (2) Thêm `useDeferredValue` cho filter. (3) Thêm `useTransition` + `isPending` badge. (4) So sánh với version dùng debounce 300ms. Ghi chú 3 cảm nhận: delay phím, độ giật list, độ "imo" khi đổi kết quả. Đề xuất tổ hợp bạn giữ nguyên.

## Reference
- [useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [useTransition](https://react.dev/reference/react/useTransition)
- [React docs — concurrency scheduling](https://react.dev/learn/render-and-commit)