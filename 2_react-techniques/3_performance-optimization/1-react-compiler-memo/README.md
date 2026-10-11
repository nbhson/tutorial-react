# React Compiler + memo

> Nguồn: https://react.dev/learn/react-compiler — https://react.dev/reference/react/memo

## Mục tiêu
- Hiểu **React Compiler 1.0** (2026): bộ biên dịch tự memoize render, giảm gần như toàn bộ `useMemo`/`useCallback` viết tay.
- Biết **khi nào `memo` thủ công vẫn còn cần thiết** sau khi có Compiler.
- Đo trước/sau bằng React DevTools Profiler, tránh memo bừa bãi.

## Tổng quan
Re-render thừa là nguyên nhân hàng đầu app React chậm khi lớn: cha render → cả cây con render dù props không đổi. Trước 2024, dev tự chống bằng `memo`/`useMemo`/`useCallback` — dễ sai, dễ lãng quên. **React Compiler** (Babel plugin, stable ở React 19 — đã ra 1.0 trong hệ sinh thái 2026) phân tích tĩnh và tự thêm memoization vào component/hook ở bước biên dịch: thành phần render lại chỉ khi *thực sự cần*. Tác giả phải tuân "rules of React"; khi tuân đúng, Compiler tự lo gần như toàn bộ, nhưng vẫn có ngoại lệ cần tay: props từ bên ngoài vùng compiler, giá trị tính toán rất đắt, hoặc list rất lớn. Áp dụng mặc định cho project Vite/Next với React 19+.

## Khái niệm cốt lõi
- **Cơ chế Compiler**: với mỗi component, nó "memoir" (ghi lại) các biến/deps được dùng; khi re-render cha, chỉ những phần khối phụ thuộc thay đổi mới chạy lại. Nguyên tắc làm việc: **không mutate props/state** — React "rules of hooks + purity"; nếu vi phạm, Compiler bỏ qua (skip) component đó và báo ở build logs/eslint.
- **`memo(Component)`**: React so sánh props cũ/mới (shallow) trước khi re-render; chỉ render khi props *đổi tham chiếu*. Vẫn hữu ích khi component: (1) nằm ngoài vùng Compiler (thư viện cũ, babel bỏ sót), (2) nhận props từ code không qua Compiler, (3) muốn chặn render tường minh theo ngữ nghĩa.
- **`useMemo`** dành cho *giá trị tính toán đắt* (reduce, sort, format 10k phần tử) — nhớ kết quả theo deps; **`useCallback`** dành cho *hàm ổn định* truyền xuống `memo` con. Khi đã có Compiler, viết "thẳng" trước, đo, chỉ thêm khi Profiler chỉ ra điểm nóng.
- **`react-compiler-healthcheck`**: CLI rà soát codebase — đếm component tuân thủ/vi phạm trước khi bật; `eslint-plugin-react-compiler` chặn bug mutation ngay tại editor.
- **Vì sao Compiler "biết"**: nó dựa vào tính *thuần khiết* (purity) của hàm render — cùng input cho cùng output; mọi mutation phá giả định này. Đây là lý do "rules of React" không còn là mẹo style mà trở thành điều kiện chạy đúng.
- **Compiler và hook tùy biến**: compiler cũng memoize bên trong custom hook; nhưng hook vi phạm "rules of hooks" (gọi có điều kiện, trong vòng lặp) sẽ bị skip.
- **memo không biến mất hoàn toàn**: các thư viện/components viết trước Compiler vẫn dùng `memo`; chúng không xung đột — compiler chỉ giảm *nhu cầu mới*.

## Luồng hoạt động / Cách áp dụng
1. Kiểm tra sẵn sàng: `npx react-compiler-healthcheck@latest`.
2. Bật Compiler: Vite qua `vite-plugin-react` (babel) hoặc babel plugin; Next qua `experimental.reactCompiler` (đã stable hóa).
3. Run build + test: log cảnh báo component bị skip vì mutation; sửa theo eslint rules.
4. Đo trước/sau bằng Profiler: đếm số lần re-render, duration trung bình.
5. Giữ `memo`/`useMemo` chỉ cho ngoại lệ được đo (list lớn, giá trị đắt, props từ bên ngoài vùng compiler) — ghi chú vì sao trong comment.

## Ví dụ chi tiết
```tsx
import { memo, useMemo, useState } from 'react';

type Item = { id: number; name: string };

// Chỉ re-render khi item đổi (so sánh shallow props)
// Với Compiler bật, memo này gần như là "bảo hiểm" — compiler cũng tự memo;
// giữ lại khi Row nhận props từ ngoài vùng compiler hoặc muốn tường minh.
export const Row = memo(function Row({ item }: { item: Item }) {
  console.log('render row', item.id);      // theo dõi để debug re-render
  return <li>{item.name}</li>;
});

export function List({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState('');   // state "nóng": gõ phím re-render List
  // useMemo chỉ cho việc lọc danh sách (đắt) — deps đầy đủ items + filter
  const visible = useMemo(
    () => items.filter((i) => i.name.includes(filter)),
    [items, filter],
  );
  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Lọc…"
      />
      <ul>
        {/* Row memo: mỗi lần gõ filter, Row nào không đổi item sẽ bỏ qua render */}
        {visible.map((i) => (
          <Row key={i.id} item={i} />
        ))}
      </ul>
    </div>
  );
}
```

## Giải thích từng phần
- Phần quan trọng nhất của ví dụ: gõ `filter` → `List` re-render → nếu **không** memo, mọi `Row` đều render lại dù nội dung không đổi. `memo(Row)` chặn: chỉ Row có `item` thay đổi (ở đây sau lọc items là mảng mới nhưng các item cũ giữ tham chiếu) mới render → tiết kiệm đáng kể với 1.000 dòng.
- Nếu `items` đến từ `result` filter mỗi render (mảng mới toanh chứa object cũ), `memo` so sánh *shallow* từng phần tử → item object cũ giữ nguyên nên Row không render. Điều khác biệt khiến Compiler sinh ra: nó làm việc này tự động với component tuân thủ rules.
- `useMemo` ở đây đảm bảo `visible` có tham chiếu ổn định giữa các lần re-render *khi `filter` chưa đổi* (ví dụ List re-render vì lý do khác) — kết hợp với `memo(Row)` hạn chế render dư theo chuỗi: List render → visible không đổi → Row không render.
- `console.log` chỉ để debug; **không** để log production (nó giữ tham chiếu, đôi khi khiến compiler/nhận thức sai). Dùng React DevTools Profiler thay thế.

## So sánh (nếu có)
- **Memo thủ công vs React Compiler**: thủ công — dev quyết định *ở đâu* (dễ sót, dễ sai deps), compiler — máy quyết định *tự động khắp nơi* (bỏ sót vì lỗi người là chuyện còn lại). Compiler giảm 70–90% memo viết tay; phần còn lại là ngoại lệ có lý do.
- **`memo` vs sửa kiến trúc**: memo là "miếng dán" cho re-render quá mức; nếu List luôn re-render vì cha quá lớn, hãy tách state xuống (colocation), slice Zustand, hoặc `children` composition (bài 4 nhóm 2) — đúng bệnh. Đo trước khi chọn.
- **Bật Compiler vs tắt (đối chiếu)**: bật mọi thứ "an toàn" song song với DevTools/Perf monitoring; nếu một route chuyển từ "chậm nhưng đúng" sang "nhanh mà sai render" — thường do mutation — tìm bằng eslint plugin, không tắt cả compiler.

## Lỗi thường gặp / Chống chỉ định
- **Mutate props/state trực tiếp** (đẩy vào mảng, sửa field) → Compiler skip component đó (mất lợi) hoặc hành vi sai. Fix: luôn tạo bản sao; chạy `eslint-plugin-react-compiler` để bắt sớm.
- **`useMemo` với deps thiếu/trống** (`[]` cho giá trị phụ thuộc props) → giá trị stale. Fix: deps đầy đủ; hay hơn, để Compiler tự làm nếu tuân thủ rules.
- **`memo` "bừa" cho component vốn nhẹ** → tốn chi phí so sánh props mỗi lần + giữ bộ nhớ. Fix: chỉ memo khi Profiler xác nhận render thừa — "premature optimization is the root of all evil".
- **Tạo function/object mới mỗi render trước `memo` con** → memo thành công cốc vì props luôn mới. Fix: `useCallback`/`useMemo` (hoặc compiler biên dịch) — và giữ `children` sanh sản qua props ổn định.
- **Chống chỉ định**: app 3 màn hình, vài chục component — bật compiler vẫn ổn nhưng đừng thêm memo tay; cũng đừng dùng `memo` cho component nhận props là object được tạo inline mỗi lần mà không dùng `useMemo` — công cốc.

## Câu hỏi thường gặp
- **Có cần bỏ memo thủ công khi bật Compiler không?** Không bắt buộc — chúng không xung đột. Có thể gỡ dần sau khi đo, giữ lại ngoại lệ thật sự cần.
- **Compiler có làm build chậm/App nặng hơn?** Thời gian build tăng nhẹ; runtime thường nhẹ hơn nhờ bớt render. Theo dõi bundle bằng visualizer.
- **Làm sao biết component bị skip?** Đọc build log tìm "bail out/skip", hoặc bật `eslint-plugin-react-compiler` để bắt mutation/violation tại editor.
- **Có nên bật Compiler cho codebase cũ?** Chạy `healthcheck` trước, bật trong nhánh riêng, sửa cảnh báo, so sánh Profiler trước/sau khi merge.
- **Compiler có thay thế `useMemo` cho tính toán đắt không?** Có, nếu component tuân rules — compiler tự memo hóa biểu thức dẫn xuất; giữ `useMemo` chỉ khi cần rõ ý đồ hoặc deps đặc biệt.

## Ghi chú 2026
- React Compiler 1.0 ổn định, bật mặc định ở nhiều template Vite/Next mới.
- `eslint-plugin-react-compiler` và `react-compiler-healthcheck` là bộ đôi bắt buộc khi áp vào dự án hiện hữu.
- React DevTools Profiler hiển thị "compiled" badge cho component đã được tối ưu.

## Best practices / Mẹo
- Mặc định **bật React Compiler** cho project React 19+ mới; chạy `healthcheck` trước khi áp vào codebase cũ.
- Khi compiler đã lo phần lớn, viết **memo "vẻ trần"** chỉ khi: list > 100 row, tính toán đắt >1ms, hoặc component nhận props ngoài vùng compiler — ghi chú lí do bằng comment.
- Đo bằng Profiler trước/sau từng thay đổi: quan tâm "render count" của component con, không chỉ tổng duration.
- Ưu tiên sửa *nguồn re-render* (state thừa, lift sai) trước khi thêm memo — giải pháp cấu trúc bền hơn miếng dán.
- Giữ "rules of React" nghiêm túc (không mutate, không gọi hook trong vòng lặp) — Compiler hoạt động tối đa khi code clean.
- Đọc build log khi bật lần đầu: các dòng "compiler skipped / bail out" chỉ ra chính xác component chưa tối ưu — sửa dần, đừng bỏ qua.
- Khi bạn phải giữ memo thủ công, viết comment `// memo: vì props đến từ thư viện X` — người sau biết đây là ngoại lệ có chủ đích.
- Cài `eslint-plugin-react-compiler` ngay khi bật compiler để bắt violation tại editor.
- Theo dõi badge "compiled" trong React DevTools cho các component quan trọng.
- Bật compiler trước, đo, rồi gỡ memo thủ công trong PR riêng để dễ so sánh.
- Theo dõi kích thước bundle sau khi bật (mã memo hoá compiler sinh ra có thể tăng nhẹ).
- Viết test hành vi trước khi bật compiler để bắt hồi quy render.
- Với thư viện bên thứ ba không kiểm soát được, giữ `memo` tường minh.
- Lưu baseline Profiler vào tài liệu dự án để so sánh các lần tối ưu sau.
- Xác nhận compiler biên dịch đúng file bằng cách xem output Babel khi cần debug.
- Với component bị skip, khoanh vùng vào PR riêng và sửa mutation trước khi tối ưu tiếp.

## Bài tập nhỏ
Tạo `List` 1.000 Row. Đo Profiler: (1) bật Compiler, không memo — gõ filter, quan sát render count; (2) thêm `memo(Row)` — so sánh số lần render Row khi gõ phím không trúng; (3) vi phạm thử (mutate `items[0].name`) để xem eslint/compiler cảnh báo skip và Profiler hạ cánh re-render. Ghi chú 3 con số và kết luận.

## Reference
- [React Compiler](https://react.dev/learn/react-compiler)
- [memo](https://react.dev/reference/react/memo)
- [useMemo / useCallback](https://react.dev/reference/react/useMemo)