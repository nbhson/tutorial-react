# React Compiler + memo

> Nguồn: https://react.dev/learn/react-compiler — https://react.dev/reference/react/memo

## Mục tiêu

### 1. Hiểu React Compiler 1.0 (2026): tự memoize render, giảm gần hết `useMemo`/`useCallback` tay

**Vì sao:** re-render thừa là nguyên nhân hàng đầu app chậm khi lớn: cha vẽ lại → cả cây con vẽ theo dù props không đổi. Trước 2024 dev tự chống bằng `memo`/`useMemo`/`useCallback` — dễ sót (quên bọc), dễ sai deps (stale), khó review. Compiler phân tích tĩnh và tự chèn memoization lúc build: component tuân "rules of React" thì tự được tối ưu, dev viết code "trần" mà vẫn nhanh.

**Cơ chế:** Compiler (Babel plugin) duyệt từng component/hook, ghi lại biến/deps nào dùng ở đâu, sinh code cache so sánh. Re-render cha chỉ chạy lại khối mà dependency thật sự đổi. Điều kiện duy nhất: không mutate props/state, hook đúng rules, render thuần (cùng input → cùng output). Vi phạm → Compiler skip component đó và báo ở build log/eslint.

> 📄 **Code ví dụ:** [`examples/01-1-hieu-react-compiler-1-0-2026-tu.tsx`](examples/01-1-hieu-react-compiler-1-0-2026-tu.tsx)

**Usecase thực tế:** list 1.000 dòng, cha giữ state filter gõ liên tục. Không Compiler: mỗi phím vẽ lại 1.000 Row. Có Compiler: chỉ Row có item đổi mới vẽ. Quy tắc nhận diện "khi nào bật": project React 19+ mới thì bật mặc định; codebase cũ chạy `healthcheck` trước, sửa mutation rồi bật nhánh riêng, so Profiler trước/sau.

### 2. Biết khi nào `memo` thủ công vẫn cần sau khi có Compiler

**Vì sao:** Compiler không bao phủ 100%: component ngoài vùng biên dịch (lib cũ, file skip do vi phạm), props từ code không qua Compiler, giá trị tính rất đắt cần ý đồ rõ, list rất lớn cần chặn tường minh. Xóa hết `memo` vì "đã có Compiler" sẽ làm những chỗ này chậm lại.

**Ba trường hợp giữ `memo`:** (1) Row nhận props từ thư viện ngoài vùng compiler; (2) tính toán > 1ms cần `useMemo` rõ ý đồ + deps tường minh; (3) muốn ngữ nghĩa "component này không vẽ lại trừ khi item đổi" như hợp đồng đọc hiểu. Mỗi `memo` giữ lại phải kèm comment vì sao — không memo bừa.

### 3. Đo trước/sau bằng Profiler, tránh memo bừa

**Vì sao:** `memo` không miễn phí: mỗi lần so sánh props tốn CPU + giữ bộ nhớ. Bọc component nhẹ (vài text) thì chi phí so sánh lớn hơn tiết kiệm. Ví von: `memo` giống như thuê bảo vệ gác cửa — cửa nào đông khách (component nặng, render nhiều) thì đáng thuê, cửa kho ít ai qua thì tốn tiền oan. "Premature optimization is the root of all evil" — chỉ memo khi Profiler chỉ ra render thừa thật (render count cao, duration lớn, props thực sự không đổi).

> **Tóm gọn 1 câu:** Mục tiêu của bài: để Compiler tự memoize thay bạn, biết chỗ nào `memo` tay vẫn cần, và mọi quyết định tối ưu phải có số Profiler chứng minh.

## Tổng quan

Re-render thừa là nguyên nhân hàng đầu app React chậm khi lớn: cha render → cả cây con render dù props không đổi. Trước 2024, dev tự chống bằng `memo`/`useMemo`/`useCallback` — dễ sai, dễ lãng quên. **React Compiler** (Babel plugin, stable ở React 19 — đã ra 1.0 trong hệ sinh thái 2026) phân tích tĩnh và tự thêm memoization vào component/hook ở bước biên dịch: thành phần render lại chỉ khi *thực sự cần*.

Tác giả phải tuân "rules of React" (không mutate, hook đúng thứ tự, render thuần); khi tuân đúng, Compiler tự lo gần như toàn bộ. Ngoại lệ cần tay: props từ bên ngoài vùng compiler, giá trị tính toán rất đắt, hoặc list rất lớn cần chặn tường minh. Áp dụng mặc định cho project Vite/Next với React 19+: bật Compiler, chạy healthcheck, đọc log skip, đo Profiler, giữ `memo` chỉ cho ngoại lệ có số liệu.

## Khái niệm cốt lõi

Mục này mổ xẻ 6 khái niệm làm nên bài: Compiler hoạt động thế nào, `memo`/`useMemo` còn vai trò gì, và bộ công cụ nào bắt buộc phải có khi bật. Đọc để hiểu "tại sao" trước khi sang phần áp dụng bên dưới.

### 1. Cơ chế Compiler — memoize theo purity, skip khi mutate

**Vì sao:** Compiler "biết" nhờ giả định render thuần: cùng props/state cho cùng JSX. Mọi mutation (`arr.push`, `obj.field = x`) phá giả định — Compiler không dám cache vì cache sẽ sai. Nên "rules of React" từ mẹo style thành điều kiện chạy đúng.

**Cơ chế:** với mỗi component, Compiler chia render thành các khối reactive, mỗi khối nhớ deps. Re-render chỉ chạy khối mà deps đổi (so `Object.is`). Gặp mutation/vi phạm rules → bỏ qua component (skip), giữ hành vi cũ (đúng nhưng không nhanh), log "bail out" để sửa. Ví von: Compiler như nhân viên kiểm chất lượng trên dây chuyền — sản phẩm nào tuân chuẩn thì đóng dấu "cache được", sản phẩm nào bị can thiệp tay lúc chạy thì bỏ qua, không đóng dấu.

> 📄 **Code ví dụ:** [`examples/02-1-co-che-compiler-memoize-theo-purity-skip.tsx`](examples/02-1-co-che-compiler-memoize-theo-purity-skip.tsx)

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

> **Tóm gọn 1 câu:** Compiler là "memo tự động", `memo`/`useMemo` là bảo hiểm cho vùng ngoài tầm biên dịch — còn purity (không mutate) là điều kiện để cả hai chạy đúng.

## Luồng hoạt động / Cách áp dụng

Mục này là roadmap 5 bước từ "kiểm tra sức khỏe codebase" tới "đo Profiler có số liệu" — đi đúng thứ tự thì bật Compiler không làm vỡ gì.

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

> **Tóm gọn 1 câu:** Luồng chuẩn: healthcheck → sửa vi phạm → bật ở nhánh riêng → đo Profiler trước/sau → chỉ giữ `memo` tay ở ngoại lệ có comment lý do.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

## Giải thích từng phần

### Gõ filter → List re-render → memo chặn Row không đổi

Không memo: 1.000 Row vẽ lại mỗi phím. Có memo: chỉ Row có `item` đổi tham chiếu mới vẽ (sau lọc, item cũ giữ reference nên Row cũ bỏ qua). Tiết kiệm theo cấp số nhân với list lớn. **Sai thì sao:** `items` là mảng object mới toanh mỗi fetch (dù nội dung giống) → mọi `item` khác reference → memo vô dụng. Fix: giữ reference ổn định từ server/cache (Query structural sharing) hoặc chuẩn hóa ở selector.

### `useMemo` giữ `visible` ổn định khi filter chưa đổi

List re-render vì cha vẽ lại (không phải do filter) → không `useMemo` là lọc lại 1.000 phần tử vô ích + `visible` mới → Row memo cũng vô dụng theo (prop mới). `useMemo` cắt chuỗi lãng phí này từ gốc.

### `console.log` chỉ debug, không production

Log giữ tham chiếu và làm Profiler khó đọc; production dùng DevTools Profiler (badge "compiled", render count) thay thế. Quên xóa log 1.000 Row là tự làm chậm console.

### Compiler làm tự động những gì ví dụ làm tay

Với code tuân rules, Compiler sinh memo cho `visible` và từng Row mà không cần viết. Ví dụ giữ `memo`/`useMemo` để minh họa + bảo hiểm ngoài vùng — đọc comment để biết đâu là "dạy", đâu là "cần thật".

> **Tóm gọn 1 câu:** Chuỗi lãng phí "cha vẽ → lọc lại → Row vẽ lại" bị cắt ở ba điểm: `useMemo` chặn tính lại, `memo` chặn vẽ lại, Compiler lo cả hai khi code tuân rules.

## So sánh (nếu có)

### Memo tay vs Compiler

Tay: dev quyết định ở đâu (sót, sai deps, khó review). Máy: tự động khắp nơi, sót chỉ vì code vi phạm. Compiler giảm 70–90% memo tay; phần còn lại là ngoại lệ có lý do + comment. Không tắt Compiler vì một component lỗi — sửa component đó (eslint chỉ chỗ), giữ lợi cho 99 chỗ còn lại.

### `memo` vs sửa kiến trúc (colocation, slice, composition)

Memo là miếng dán cho render thừa; sửa gốc (hạ state xuống gần nơi dùng, tách slice Zustand, `children` composition) bền hơn. List re-render vì state đặt ở root quá cao → hạ state xuống List là khỏi bệnh, không cần memo. Đo trước khi chọn: dán nhanh nhưng bệnh còn; mổ gốc lâu nhưng khỏi.

> **Tóm gọn 1 câu:** Memo là miếng vá nhanh, Compiler là tự động hóa, còn sửa kiến trúc là chữa gốc bệnh — đo xong mới chọn vũ khí.

## Lỗi thường gặp / Chống chỉ định

Mục này là danh sách 5 cách "tiền mất tật mang" khi tối ưu — đọc trước để không nếm thử.

### 1. Mutate props/state → Compiler skip hoặc sai

> 📄 **Code ví dụ:** [`examples/04-1-mutate-props-state-compiler-skip-hoac-sai.tsx`](examples/04-1-mutate-props-state-compiler-skip-hoac-sai.tsx)

### 2. `useMemo` deps thiếu/trống → stale

> 📄 **Code ví dụ:** [`examples/05-2-usememo-deps-thieu-trong-stale.tsx`](examples/05-2-usememo-deps-thieu-trong-stale.tsx)

### 3. `memo` bừa cho component nhẹ → tốn hơn lợi

So sánh props mỗi lần + giữ bộ nhớ cho component vài text là lỗ. Chỉ memo khi Profiler xác nhận render thừa (count cao + props không đổi).

### 4. Tạo function/object mới mỗi render trước `memo` con → memo công cốc

> 📄 **Code ví dụ:** [`examples/06-4-tao-function-object-moi-moi-render-truoc.tsx`](examples/06-4-tao-function-object-moi-moi-render-truoc.tsx)

### 5. Chống chỉ định: app 3 màn hình, props inline không memo

App nhỏ bật Compiler vẫn ổn nhưng đừng thêm memo tay. Component nhận object inline mỗi lần mà không `useMemo` thì memo vô dụng — sửa gốc (ổn định reference) trước khi bọc.

> **Tóm gọn 1 câu:** Mutate là kẻ thù số một của Compiler, còn memo bừa cho component nhẹ là "trả lương bảo vệ gác cửa kho" — cả hai đều nên tránh.

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

> **Tóm gọn 1 câu:** Nguyên tắc vàng: viết trần cho Compiler lo, giữ `memo` tay như ngoại lệ có lý do ghi rõ, và mọi thay đổi phải đi kèm số đo trước/sau.

## Bài tập nhỏ

Mục này cho bạn một thí nghiệm 5 bước tự đo bằng tay — làm xong là "thấy mắt thấy tai" Compiler giúp được bao nhiêu và mutate phá được bao nhiêu.

1. Tạo `List` 1.000 Row (id + tên ngẫu nhiên).
2. Đo Profiler bản (1): bật Compiler, không memo — gõ filter không trúng, ghi render count Row.
3. Thêm `memo(Row)` — đo lại bản (2), so số Row vẽ lại.
4. Cố tình mutate (`items[0].name = 'x'` trong render) — xem eslint/compiler báo skip, đo lại bản (3) thấy render tăng.
5. Ghi 3 con số + kết luận: Compiler lo được bao nhiêu, `memo` thêm được bao nhiêu, mutate phá bao nhiêu.

## Reference

- [React Compiler](https://react.dev/learn/react-compiler)
- [memo](https://react.dev/reference/react/memo)
- [useMemo / useCallback](https://react.dev/reference/react/useMemo)
