# React Compiler + memo

> Nguồn: https://react.dev/learn/react-compiler — https://react.dev/reference/react/memo

## Mục tiêu

### 1. Hiểu React Compiler 1.0 (2026): tự memoize render, giảm gần hết `useMemo`/`useCallback` tay

**Vì sao:** re-render thừa là nguyên nhân hàng đầu app chậm khi lớn: cha vẽ lại → cả cây con vẽ theo dù props không đổi. Trước 2024 dev tự chống bằng `memo`/`useMemo`/`useCallback` — dễ sót (quên bọc), dễ sai deps (stale), khó review. Compiler phân tích tĩnh và tự chèn memoization lúc build: component tuân "rules of React" thì tự được tối ưu, dev viết code "trần" mà vẫn nhanh.

**Cơ chế:** Compiler (Babel plugin) duyệt từng component/hook, ghi lại biến/deps nào dùng ở đâu, sinh code cache so sánh. Re-render cha chỉ chạy lại khối mà dependency thật sự đổi. Điều kiện duy nhất: không mutate props/state, hook đúng rules, render thuần (cùng input → cùng output). Vi phạm → Compiler skip component đó và báo ở build log/eslint.

```tsx
// ✅ ĐÚNG: viết trần, tuân rules — Compiler tự memo, không cần useMemo/useCallback
function Chao({ ten }: { ten: string }) {
  const loiChao = `Xin chào, ${ten}!`; // dẫn xuất thuần — Compiler tự cache
  return <p>{loiChao}</p>; // cha re-render mà ten không đổi → Compiler bỏ qua render này
}
```

**Usecase thực tế:** list 1.000 dòng, cha giữ state filter gõ liên tục. Không Compiler: mỗi phím vẽ lại 1.000 Row. Có Compiler: chỉ Row có item đổi mới vẽ. Quy tắc nhận diện "khi nào bật": project React 19+ mới thì bật mặc định; codebase cũ chạy `healthcheck` trước, sửa mutation rồi bật nhánh riêng, so Profiler trước/sau.

### 2. Biết khi nào `memo` thủ công vẫn cần sau khi có Compiler

**Vì sao:** Compiler không bao phủ 100%: component ngoài vùng biên dịch (lib cũ, file skip do vi phạm), props từ code không qua Compiler, giá trị tính rất đắt cần ý đồ rõ, list rất lớn cần chặn tường minh. Xóa hết `memo` vì "đã có Compiler" sẽ làm những chỗ này chậm lại.

**Ba trường hợp giữ `memo`:** (1) Row nhận props từ thư viện ngoài vùng compiler; (2) tính toán > 1ms cần `useMemo` rõ ý đồ + deps tường minh; (3) muốn ngữ nghĩa "component này không vẽ lại trừ khi item đổi" như hợp đồng đọc hiểu. Mỗi `memo` giữ lại phải kèm comment vì sao — không memo bừa.

### 3. Đo trước/sau bằng Profiler, tránh memo bừa

**Vì sao:** `memo` không miễn phí: mỗi lần so sánh props tốn CPU + giữ bộ nhớ. Bọc component nhẹ (vài text) thì chi phí so sánh lớn hơn tiết kiệm. "Premature optimization is the root of all evil" — chỉ memo khi Profiler chỉ ra render thừa thật (render count cao, duration lớn, props thực sự không đổi).

## Tổng quan

Re-render thừa là nguyên nhân hàng đầu app React chậm khi lớn: cha render → cả cây con render dù props không đổi. Trước 2024, dev tự chống bằng `memo`/`useMemo`/`useCallback` — dễ sai, dễ lãng quên. **React Compiler** (Babel plugin, stable ở React 19 — đã ra 1.0 trong hệ sinh thái 2026) phân tích tĩnh và tự thêm memoization vào component/hook ở bước biên dịch: thành phần render lại chỉ khi *thực sự cần*.

Tác giả phải tuân "rules of React" (không mutate, hook đúng thứ tự, render thuần); khi tuân đúng, Compiler tự lo gần như toàn bộ. Ngoại lệ cần tay: props từ bên ngoài vùng compiler, giá trị tính toán rất đắt, hoặc list rất lớn cần chặn tường minh. Áp dụng mặc định cho project Vite/Next với React 19+: bật Compiler, chạy healthcheck, đọc log skip, đo Profiler, giữ `memo` chỉ cho ngoại lệ có số liệu.

## Khái niệm cốt lõi

### 1. Cơ chế Compiler — memoize theo purity, skip khi mutate

**Vì sao:** Compiler "biết" nhờ giả định render thuần: cùng props/state cho cùng JSX. Mọi mutation (`arr.push`, `obj.field = x`) phá giả định — Compiler không dám cache vì cache sẽ sai. Nên "rules of React" từ mẹo style thành điều kiện chạy đúng.

**Cơ chế:** với mỗi component, Compiler chia render thành các khối reactive, mỗi khối nhớ deps. Re-render chỉ chạy khối mà deps đổi (so `Object.is`). Gặp mutation/vi phạm rules → bỏ qua component (skip), giữ hành vi cũ (đúng nhưng không nhanh), log "bail out" để sửa.

```tsx
// ❌ SAI: mutate props — Compiler skip, mất tối ưu (và eslint báo đỏ)
function Row({ item }: any) { item.ten = item.ten.trim(); return <li>{item.ten}</li>; }
// ✅ ĐÚNG: thuần — Compiler cache được
function Row({ item }: any) { const ten = item.ten.trim(); return <li>{ten}</li>; }
```

### 2. `memo(Component)` — so shallow props, chặn render tường minh

**Vì sao còn cần:** Compiler tự làm cho code trong vùng; `memo` là "bảo hiểm" cho ngoài vùng + hợp đồng ngữ nghĩa ("Row này chỉ vẽ khi item đổi") mà người đọc hiểu ngay không cần biết Compiler có bật không.

**Cơ chế:** `memo` bọc component, trước mỗi render so sánh props cũ/mới nông (từng key `Object.is`). Giống nhau → bỏ qua render, dùng kết quả cũ. Khác → render. Shallow nên object mới mỗi lần (`item={{...}}` inline) luôn khác → memo vô dụng nếu cha tạo prop mới liên tục.

### 3. `useMemo` cho giá trị đắt, `useCallback` cho hàm ổn định

`useMemo(() => filter(items), [items, filter])` nhớ kết quả lọc — cha re-render vì lý do khác mà deps không đổi thì không tính lại. `useCallback(fn, deps)` nhớ hàm — truyền xuống `memo` con mà hàm mới mỗi lần thì memo thành công cốc. Có Compiler thì viết trần trước, đo, chỉ thêm khi Profiler chỉ ra điểm nóng + comment lý do.

### 4. `react-compiler-healthcheck` + `eslint-plugin-react-compiler` — bộ đôi bắt buộc

Healthcheck CLI đếm bao nhiêu component tuân thủ/vi phạm trước khi bật — biết sức khỏe codebase. ESLint plugin báo mutation/violation ngay lúc gõ (đỏ dưới dòng mutate) để sửa trước khi build. Bật Compiler mà không cài hai thứ này như lái mù.

### 5. Purity là nền — rules of hooks + không mutate + không side-effect ở render

Gọi hook điều kiện/trong loop, mutate props/state, gọi hàm không thuần (random, Date.now, fetch) ở render đều phá purity. Compiler skip custom hook vi phạm luôn — một hook bẩn làm cả cây dùng nó mất tối ưu.

### 6. memo không biến mất — lib cũ vẫn dùng, không xung đột

Component thư viện viết trước Compiler vẫn `memo` — cứ để yên. Compiler và `memo` tay cộng tác (memo ngoài, compiler trong), không đè nhau. Gỡ dần `memo` nội bộ sau khi đo, giữ ngoại lệ có lý do.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Kiểm tra sẵn sàng: `npx react-compiler-healthcheck@latest`

Chạy ở root, đọc báo cáo: bao nhiêu component OK, bao nhiêu vi phạm (mutate, hook điều kiện). Sửa vi phạm dễ trước (mutate → copy) để tỉ lệ OK cao rồi mới bật.

### Bước 2. Bật Compiler: Vite qua `vite-plugin-react` (babel) / Next `experimental.reactCompiler` (đã stable)

Bật ở nhánh riêng, không bật thẳng main. Build thử, đọc log "skipped/bail out" — mỗi dòng là một component cần sửa.

### Bước 3. Run build + test, sửa theo eslint rules

Cài `eslint-plugin-react-compiler`, sửa đỏ từng file: mutate → spread/copy, hook điều kiện → tách nhánh, side-effect ở render → chuyển effect/handler. Mỗi PR sửa một cụm để dễ review.

### Bước 4. Đo trước/sau bằng Profiler: render count + duration

Mở Profiler record lúc gõ filter: đếm Row render bao nhiêu lần, mỗi lần bao lâu. Lưu baseline vào tài liệu để lần tối ưu sau so sánh.

### Bước 5. Giữ memo/useMemo chỉ cho ngoại lệ có số liệu + comment lý do

List > 100 row, tính > 1ms, props ngoài vùng compiler — giữ và ghi `// memo: vì props từ lib X ngoài vùng compiler`. Không số liệu thì không memo.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

```tsx
// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { memo, useMemo, useState } from 'react';

type Item = { id: number; name: string };

// Chỉ re-render khi item đổi (so sánh shallow props)
// Với Compiler bật, memo này gần như là "bảo hiểm" — compiler cũng tự memo;
// giữ lại khi Row nhận props từ ngoài vùng compiler hoặc muốn tường minh ngữ nghĩa.
// Vì sao memo ở đây: List re-render mỗi phím gõ; không memo thì 1.000 Row vẽ lại dù item không đổi.
export const Row = memo(function Row({ item }: { item: Item }) {
  console.log('render row', item.id); // theo dõi để debug re-render — KHÔNG để log ở production
  return <li>{item.name}</li>;
});

export function List({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState(''); // state "nóng": mỗi phím gõ re-render List
  // useMemo chỉ cho việc lọc danh sách (đắt khi 1.000+ phần tử) — deps đầy đủ items + filter
  // Vì sao useMemo: List re-render vì lý do khác (cha vẽ lại) mà filter chưa đổi thì không lọc lại
  const visible = useMemo(
    () => items.filter((i) => i.name.includes(filter)),
    [items, filter], // thiếu deps là stale; thừa deps là tính lại thừa — phải đủ đúng
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
        {/* Vì sao key=id: key ổn định để React + memo nhận đúng Row nào là nào sau lọc */}
        {visible.map((i) => (
          <Row key={i.id} item={i} />
        ))}
      </ul>
    </div>
  );
}
```

## Giải thích từng phần

### Gõ filter → List re-render → memo chặn Row không đổi

Không memo: 1.000 Row vẽ lại mỗi phím. Có memo: chỉ Row có `item` đổi tham chiếu mới vẽ (sau lọc, item cũ giữ reference nên Row cũ bỏ qua). Tiết kiệm theo cấp số nhân với list lớn. **Sai thì sao:** `items` là mảng object mới toanh mỗi fetch (dù nội dung giống) → mọi `item` khác reference → memo vô dụng. Fix: giữ reference ổn định từ server/cache (Query structural sharing) hoặc chuẩn hóa ở selector.

### `useMemo` giữ `visible` ổn định khi filter chưa đổi

List re-render vì cha vẽ lại (không phải do filter) → không `useMemo` là lọc lại 1.000 phần tử vô ích + `visible` mới → Row memo cũng vô dụng theo (prop mới). `useMemo` cắt chuỗi lãng phí này từ gốc.

### `console.log` chỉ debug, không production

Log giữ tham chiếu và làm Profiler khó đọc; production dùng DevTools Profiler (badge "compiled", render count) thay thế. Quên xóa log 1.000 Row là tự làm chậm console.

### Compiler làm tự động những gì ví dụ làm tay

Với code tuân rules, Compiler sinh memo cho `visible` và từng Row mà không cần viết. Ví dụ giữ `memo`/`useMemo` để minh họa + bảo hiểm ngoài vùng — đọc comment để biết đâu là "dạy", đâu là "cần thật".

## So sánh (nếu có)

### Memo tay vs Compiler

Tay: dev quyết định ở đâu (sót, sai deps, khó review). Máy: tự động khắp nơi, sót chỉ vì code vi phạm. Compiler giảm 70–90% memo tay; phần còn lại là ngoại lệ có lý do + comment. Không tắt Compiler vì một component lỗi — sửa component đó (eslint chỉ chỗ), giữ lợi cho 99 chỗ còn lại.

### `memo` vs sửa kiến trúc (colocation, slice, composition)

Memo là miếng dán cho render thừa; sửa gốc (hạ state xuống gần nơi dùng, tách slice Zustand, `children` composition) bền hơn. List re-render vì state đặt ở root quá cao → hạ state xuống List là khỏi bệnh, không cần memo. Đo trước khi chọn: dán nhanh nhưng bệnh còn; mổ gốc lâu nhưng khỏi.

## Lỗi thường gặp / Chống chỉ định

### 1. Mutate props/state → Compiler skip hoặc sai

```tsx
// ❌ SAI: đẩy trực tiếp vào mảng state — mutate, Compiler bỏ qua
items.push(moi); setItems(items);
// ✅ ĐÚNG: bản sao — Compiler cache được, React phát hiện đổi
setItems([...items, moi]);
```

### 2. `useMemo` deps thiếu/trống → stale

```tsx
// ❌ SAI: deps [] mà dùng filter — đổi filter không lọc lại, UI cũ
const v = useMemo(() => items.filter((i) => i.name.includes(filter)), []);
// ✅ ĐÚNG: deps đủ — hay hơn để Compiler tự làm nếu tuân rules
const v = useMemo(() => items.filter((i) => i.name.includes(filter)), [items, filter]);
```

### 3. `memo` bừa cho component nhẹ → tốn hơn lợi

So sánh props mỗi lần + giữ bộ nhớ cho component vài text là lỗ. Chỉ memo khi Profiler xác nhận render thừa (count cao + props không đổi).

### 4. Tạo function/object mới mỗi render trước `memo` con → memo công cốc

```tsx
// ❌ SAI: onClick mới mỗi lần — Row memo so props luôn khác
{list.map((i) => <Row key={i.id} item={i} onChon={() => chon(i.id)} />)}
// ✅ ĐÚNG: useCallback ổn định (hoặc Compiler lo) + Row memo mới có tác dụng
const chon = useCallback((id: number) => chonThat(id), []);
```

### 5. Chống chỉ định: app 3 màn hình, props inline không memo

App nhỏ bật Compiler vẫn ổn nhưng đừng thêm memo tay. Component nhận object inline mỗi lần mà không `useMemo` thì memo vô dụng — sửa gốc (ổn định reference) trước khi bọc.

## Câu hỏi thường gặp

### Có cần bỏ memo tay khi bật Compiler?

Không bắt buộc — không xung đột. Gỡ dần sau khi đo (PR riêng để so sánh), giữ ngoại lệ thật (ngoài vùng, đắt, list lớn) kèm comment.

### Compiler làm build chậm/app nặng hơn?

Build tăng nhẹ (phân tích tĩnh). Runtime thường nhẹ hơn (bớt render). Theo dõi bundle visualizer vì mã memo sinh ra tăng nhẹ kích thước.

### Làm sao biết component bị skip?

Build log "bail out/skip" + `eslint-plugin-react-compiler` đỏ tại editor. Mỗi skip là một mùi mutate/violation cần sửa — đừng bỏ qua.

### Codebase cũ có nên bật?

Chạy healthcheck, bật nhánh riêng, sửa cảnh báo, so Profiler trước/sau rồi merge. Đừng bật thẳng main khi tỉ lệ vi phạm cao.

### Compiler thay `useMemo` cho tính đắt không?

Có nếu tuân rules — compiler memo biểu thức dẫn xuất. Giữ `useMemo` khi cần ý đồ rõ (đắt > 1ms, deps đặc biệt) để người đọc hiểu đây là điểm nóng có chủ đích.

## Ghi chú 2026

- **React Compiler 1.0 ổn định, bật mặc định ở nhiều template mới:** Vite/Next template mới đã kèm cấu hình; project cũ bật tay theo luồng trên.
- **Bộ đôi bắt buộc: eslint plugin + healthcheck:** một cái bắt lúc gõ, một cái đếm toàn repo — thiếu một là mù một mắt.
- **DevTools Profiler badge "compiled":** tick component quan trọng xem đã compiled chưa; chưa thì đọc log skip để sửa.

## Best practices / Mẹo

### Bật Compiler cho project mới; memo trần chỉ cho 3 ngoại lệ có comment

List > 100 row, tính đắt > 1ms, props ngoài vùng compiler — giữ và ghi `// memo: vì ...`. Còn lại viết trần tuân rules. Đo render count trước/sau mỗi thay đổi, không chỉ duration tổng.

### Sửa nguồn re-render trước khi dán memo; giữ rules nghiêm; đọc log skip

Hạ state, tách slice, composition trước. Không mutate, không hook trong loop — Compiler tối đa khi code clean. Log "skipped" là todo list, không phải nhiễu để bỏ qua. Cài eslint plugin ngay khi bật. Test hành vi trước khi bật để bắt hồi quy. Lib ngoài giữ `memo` tường minh. Lưu baseline Profiler vào tài liệu.

## Bài tập nhỏ

1. Tạo `List` 1.000 Row (id + tên ngẫu nhiên).
2. Đo Profiler bản (1): bật Compiler, không memo — gõ filter không trúng, ghi render count Row.
3. Thêm `memo(Row)` — đo lại bản (2), so số Row vẽ lại.
4. Cố tình mutate (`items[0].name = 'x'` trong render) — xem eslint/compiler báo skip, đo lại bản (3) thấy render tăng.
5. Ghi 3 con số + kết luận: Compiler lo được bao nhiêu, `memo` thêm được bao nhiêu, mutate phá bao nhiêu.

## Reference

- [React Compiler](https://react.dev/learn/react-compiler)
- [memo](https://react.dev/reference/react/memo)
- [useMemo / useCallback](https://react.dev/reference/react/useMemo)
