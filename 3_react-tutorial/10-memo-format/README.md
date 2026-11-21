# DAY 10: MEMO & FORMAT (PIPE)

DAY 10 trả lời hai câu hỏi kinh điển khi chuyển từ Angular: "pipe đâu rồi?" (đáp: format là hàm JS thuần + `Intl`) và "tối ưu render thế nào?" (đáp: `memo`/`useMemo` — nhưng 2026 có Compiler tự lo hộ bạn).

## Mục tiêu bài học

Mục này nêu 3 đích của DAY 10. Đọc để biết cuối bài bạn nắm được gì.

- Thay khái niệm Angular Pipe bằng tư duy "format là function": `Intl` API + hàm thuần + `useMemo`/Compiler để cache.
- Hiểu `memo` và `useMemo` hoạt động thế nào, và **vì sao React 19.3 + Compiler 1.0 khiến bạn hầu như không cần tự memo** — đo trước, memo sau.
- Biết `use()` + Suspense thay cho `async` pipe (gợi ý sang DAY 12-13).

> **Tóm gọn 1 câu:** Cuối DAY 10: format dùng `Intl` như hàm thuần, tối ưu render để Compiler lo trước, tự memo sau khi đo.

## Khái niệm cốt lõi (Core)

Mục này định nghĩa 5 khái niệm: pipe → function, `Intl`, `useMemo`, `memo`, và Compiler. Đọc tuần tự — hai khái niệm cache ở giữa là lõi của bài.

### 1. Angular Pipe là cú pháp template — React pipe chỉ là function
`{{ total | currency:"VND" }}` trong Angular cần học pipe name + tham số + pure/impure. React không có pipe: `{fmtVND.format(total)}` — gọi hàm thuần ngay trong JSX vì JSX là JS. Muốn "giống pipe" thì gom helper `vnd(n)` trong `utils/format.ts`.

> 📄 **Code ví dụ:** [`examples/01-1-angular-pipe-la-cu-phap-template-react.tsx`](examples/01-1-angular-pipe-la-cu-phap-template-react.tsx)

Vì sao function thắng pipe? Vì pipe là DSL phải đăng ký (`@Pipe`, `declarations`), function là JS — import là dùng, test bằng `expect(vnd(120000)).toBe("120.000 ₫")` không cần TestBed. Hàm thuần còn tái dùng cho API/logic ngoài UI, pipe thì kẹt trong template. Ví von: pipe là **máy xay lắp cố định vào bếp**, hàm thuần là **máy xay cầm tay** — cầm đi được khắp nhà, kể cả ra sân (dùng ngoài UI).

### 2. `Intl` API là "pipe chuẩn" của modern JS
`Intl.NumberFormat` (số/tiền/phần trăm), `Intl.DateTimeFormat` (ngày), `Intl.RelativeTimeFormat` ("2 ngày trước") — built-in trình duyệt, đúng locale, cache instance ngoài component (tạo 1 lần, dùng mọi render).

> 📄 **Code ví dụ:** [`examples/02-2-intl-api-la-pipe-chuan-cua-modern.tsx`](examples/02-2-intl-api-la-pipe-chuan-cua-modern.tsx)

Vì sao tạo ngoài component? Vì `new Intl.NumberFormat(...)` tốn (parse locale + options). Tạo trong render là mỗi render tốn một lần + mất cache nội bộ. Ngoài component = 1 lần duy nhất (giống pure pipe `pure: true`). Khi app đa ngôn ngữ (DAY 18), tạo Map cache theo locale hoặc `useMemo` theo `i18n.language` — không hardcode `"vi-VN"`.

### 3. `useMemo(fn, deps)` — cache kết quả tính nặng
Chỉ tính lại khi `deps` đổi. Không phải "tối ưu mọi thứ": cache tốn bộ nhớ giữ kết quả cũ + CPU so deps mỗi render. Tính cộng vài số mà `useMemo` là lỗ (so deps đắt hơn tính lại).

> 📄 **Code ví dụ:** [`examples/03-3-usememo-fn-deps-cache-ket-qua-tinh.tsx`](examples/03-3-usememo-fn-deps-cache-ket-qua-tinh.tsx)

Kỷ luật deps: dữ liệu bất biến (`[...rows, x]` tạo mảng mới khi đổi, không `push`), deps là tham chiếu ổn định. Mutate `rows.push(x)` giữ tham chiếu → deps tưởng không đổi → tổng stale (sai). Hiểu `deps = "khi nào cần tính lại"`, `[]` = 1 lần (như lazy init). Ví von: `useMemo` là **tủ lạnh cho kết quả tính** — món (deps) còn nguyên thì không nấu lại; nhưng nếu bạn "đổi món trong nồi cũ" (mutate) mà dán nhãn cũ thì cả nhà ăn nhầm món stale.

### 4. `memo(Component)` — chặn re-render khi props không đổi
Mặc định React "cha render → **mọi con render theo**", kể cả con không đổi gì. `memo` bọc ngoài so props cũ/mới nông (`Object.is` từng field): giống hệt thì bỏ qua render, tái dùng kết quả cũ; khác thì render bình thường.

> 📄 **Code ví dụ:** [`examples/04-4-memo-component-chan-re-render-khi-props.tsx`](examples/04-4-memo-component-chan-re-render-khi-props.tsx)

Thử nghiệm trong example: gõ input → console KHÔNG thêm "Row render" (memo chặn). Xóa memo (dùng `Row` thường) → mỗi phím 3 dòng log. Với list 1000 dòng, đây là khác biệt giật vs mượt (khi chưa có Compiler). `memo` so nông: props object lồng (`style={{...}}` mới mỗi render) thì luôn khác → miss. Muốn so sâu thì custom `areEqual` thứ 2, nhưng hiếm cần.

### 5. React Compiler 1.0 — viết tự nhiên, Compiler memo thay
Bật mặc định ở nhiều setup Vite 2026: tự memo re-render + function/object. Bạn viết code DAY 1–9 tự nhiên (không `memo`/`useMemo`), Compiler tối ưu tương đương. Chỉ thêm tay khi (a) đo được issue (Profiler chỉ component render nhiều), (b) cần tham chiếu ổn định cho `useEffect` deps, (c) vùng Compiler chưa bao phủ.

> 📄 **Code ví dụ:** [`examples/05-5-react-compiler-1-0-viet-tu-nhien.tsx`](examples/05-5-react-compiler-1-0-viet-tu-nhien.tsx)

Vì sao "đo trước memo sau"? Vì memo sai tốn hơn không memo (so props 1000 component mỗi render đắt hơn vẽ lại 3 dòng). Profiler (React DevTools) cho biết ai render nhiều — memo đúng chỗ đó.

### Keyword chính
`Intl` + `NumberFormat`/`DateTimeFormat`/`RelativeTimeFormat` (pipe chuẩn), `pure function` (format helper), `useMemo` (cache giá trị), `memo` (chặn component render), React Compiler 1.0 (tự memo), `async pipe` → `use()`/Suspense (DAY 12-13).

> **Tóm gọn 1 câu:** Năm khái niệm kết thành một câu: format là hàm `Intl` tạo 1 lần, cache giá trị bằng `useMemo`, chặn component bằng `memo` — và 2026 thì Compiler tự làm cả hai.

## Luồng hoạt động (Flow)

Mục này đi qua 8 bước vận hành của ví dụ demo, từ tạo instance `Intl` đến bật Compiler. Đọc để thấy cơ chế memo/diff "diễn" ra sao theo từng thao tác.
1. Module load: tạo 1 instance `fmtVND` (vi-VN, VND) ngoài component — tái dùng mọi render, không tạo lại. Tương tự `fmtDate`/`fmtRelative` khi cần.
2. `App` render lần đầu: `rows = [120000, 45000, 89000]` (mảng mới mỗi render trong demo — chú ý deps), `useMemo(() => reduce, [rows])` tính tổng 254000; `rows.map` tạo 3 `<MemoRow text={fmtVND.format(r)} />`; console in 3 dòng "Row render".
3. Hiển thị: mỗi dòng tiền format `"120.000 ₫"` đúng locale; tổng `"254.000 ₫"`.
4. Gõ "a" vào input → `setQ("a")` → `App` re-render. `rows` tạo lại (tham chiếu mới) nên `useMemo` tính lại (demo nhỏ không sao); `MemoRow` nhận `text` cùng chuỗi → `memo` so `Object.is` từng prop → giống → **bỏ qua render** (console không thêm).
5. Đổi locale (DAY 18) → tạo instance `Intl` mới cho locale đó (hoặc `useMemo` theo locale) → chuỗi format đổi (dấu `.` thành `,`), không logic thủ công.
6. Thêm state `theme` ở App mà không đụng `text`: bấm đổi theme → App render, `memo` chặn Row (text giống) — `console.log` trong Row không chạy. Bỏ `memo` để so sánh: mọi Row render dù text giống — thấy ngay giá trị khi chưa Compiler.
7. Bật Compiler: gỡ `memo`/`useMemo`, chạy lại — số render vẫn thấp (Compiler tự chặn tương đương). Đây là tinh thần "viết tự nhiên, để Compiler lo".
8. Nếu `rows` từ props/state ổn định tham chiếu (không tạo mới mỗi render), `useMemo` mới có ý nghĩa cache; tạo mới mỗi render thì cache miss luôn — phải ổn định nguồn trước.

> **Tóm gọn 1 câu:** 8 bước demo: tạo `Intl` một lần → render → gõ phím → memo chặn Row → đổi locale/theme → bật Compiler gỡ memo tay — luôn thấy qua `console.log`.

## Ví dụ chi tiết

Mục này trỏ tới 4 file ví dụ khớp với `example.tsx`. Đọc kèm để thấy từng kỹ thuật thành code chạy được.

Khớp 1-1 với `example.tsx` cùng thư mục (KHÔNG sửa example DAY 10 — đã chuẩn):

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

Các "pipe" ngày/tương đối (giữ từ bản cũ):

> 📄 **Code ví dụ:** [`examples/07-vi-du-chi-tiet.tsx`](examples/07-vi-du-chi-tiet.tsx)

React Compiler: cùng component, không cần memo tay:

> 📄 **Code ví dụ:** [`examples/08-vi-du-chi-tiet.tsx`](examples/08-vi-du-chi-tiet.tsx)

Gom format vào module dùng chung (`src/utils/format.ts` — tái dùng, dễ test như pure pipe):

> 📄 **Code ví dụ:** [`examples/09-vi-du-chi-tiet.ts`](examples/09-vi-du-chi-tiet.ts)

> **Tóm gọn 1 câu:** Bốn file ví dụ: demo chính, format ngày/tương đối, bản "không cần memo tay" với Compiler, và module `format.ts` tái sử dụng.

## Giải thích từng phần

Mục này bóc từng dòng code kèm "vì sao". Đọc khi cần hiểu sâu cơ chế trước khi chỉnh theo dự án của mình.
- Dòng `new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })`: "pipe currency" — luôn `"120.000 ₫"` kiểu Việt (chấm nghìn, ₫ sau). Đặt ngoài component = không tạo mới mỗi render (giống pure pipe `pure: true`). Tham số thứ 2 là options (thay tham số pipe `currency:"VND"`).
- Dòng `fmtVND.format(r)` trong `map`: gọi function trong JSX — không cần `|`. Muốn "giống pipe" thì helper `vnd(r)`. Format là thuần (cùng input → cùng output), không side effect, dễ mock/test.
- Dòng `function Row({ text })` + `console.log`: component thường không biết memo — log là bằng chứng render. Vì sao log trong render? Vì render là hàm thuần được gọi mỗi lần vẽ — log cho thấy memo có chặn không. Nhớ xóa log ở prod.
- Dòng `const MemoRow = memo(Row)`: so props cũ/mới nông (`Object.is` từng key). `text` là string nên so nhanh, đúng. List dài + cha render thường (input search) thì tiết kiệm lớn. Component nhỏ không props thì `memo` vô ích (so tốn hơn vẽ).
- **`memo` "chặn render lại":** mặc định React render kiểu "cha render → **mọi con render theo**", kể cả con không đổi gì. `memo` là lớp bọc chặn cái đó:

> 📄 **Code ví dụ:** [`examples/10-giai-thich-tung-phan.tsx`](examples/10-giai-thich-tung-phan.tsx)

Cơ chế: mỗi khi cha render lại, thay vì render `Row` ngay, React **so props cũ vs mới** (so nông từng field bằng `Object.is`):
  - Props giống hệt → **bỏ qua render**, tái dùng kết quả lần trước.
  - Props khác → render lại bình thường.
Ví dụ: `App` có ô tìm kiếm, gõ phím nào cha cũng render. List 1000 `Row` bọc `memo` mà `text` không đổi → 1000 dòng đứng yên, chỉ ô input render — đó là "chặn render lại".
- Dòng `useMemo(() => rows.reduce(...), [rows])`: `rows` là tham chiếu — tạo mới mỗi render (như demo `const rows = [...]` trong body) thì deps luôn khác → cache miss luôn, vừa so vừa tính lại. Kỷ luật: nguồn ổn định (props/state/memo) + bất biến (không `push`). Demo giữ để học cơ chế; prod tính rẻ này bỏ memo cũng được (Compiler lo).
- Dòng `rows.map((r) => <MemoRow key={r} text={...} />)`: `key={r}` ổn định vì giá trị unique (120000 ≠ 45000). Nếu giá trị trùng thì key trùng → diff sai — phải key theo id. `key` đúng là điều kiện để memo/diff đúng (DAY 2).
- Dòng `<input value={q} onChange={...}>`: controlled để "ép" App render mỗi phím — tạo điều kiện demo memo. Không có input này thì App không render lại, không thấy memo chặn.
- Quy tắc **`Intl` theo locale**: đa ngôn ngữ thì `new Intl.NumberFormat(i18n.language, ...)` (DAY 18), không hardcode `"vi-VN"`. Nối `"$" + n.toFixed(2)` là sai quốc tế (sai dấu, sai vị trí ký hiệu).
- Quy tắc **đo trước tối ưu**: DevTools Profiler ghi ai render bao nhiêu lần, tốn bao lâu. Chỉ memo component Profiler chỉ đỏ. Memo theo cảm tính ("memo hết cho chắc") thường chậm hơn.

> **Tóm gọn 1 câu:** Mỗi dòng là một bài học nhỏ: `Intl` ngoài component, hàm format thuần dễ test, memo so nông, `key` đúng để diff đúng, và Profiler chỉ đường tối ưu.

## Bảng so sánh Angular ↔ React

Mục này là từ điển dịch pipe Angular sang React, kèm bảng so `memo` vs `OnPush`. Đọc khi bạn quen Angular và cần đối chiếu chính xác từng cú pháp.

| Angular | React | Ghi chú |
|---|---|---|
| `{{ d \| date }}` | `{fmtDate.format(d)}` | Pipe built-in ↔ Intl function, không cú pháp `\|` |
| `{{ v \| currency:"VND" }}` | `{fmtVND.format(v)}` | Tham số pipe ↔ options khi tạo instance Intl |
| pure pipe (cache theo input) | instance Intl ngoài component / `useMemo` theo deps | Cùng ý cache, khác cơ chế |
| pipe tùy biến (`@Pipe` + declarations) | hàm thuần trong `utils/format.ts` | Không decorator/module, import là dùng |
| `async` pipe (subscribe/unsubscribe) | `use()` + Suspense / TanStack Query (DAY 12-13) | Đọc promise trực tiếp, không subscribe tay |
| `ChangeDetectionStrategy.OnPush` | `memo` / React Compiler | Cùng mục đích "đừng vẽ khi không đổi", khác cơ chế (chi tiết dưới) |
| `\| number` với locale | `new Intl.NumberFormat(locale)` | Locale là tham số tạo instance |
| `\| percent` | `Intl.NumberFormat(..., { style: "percent" })` | Cùng API Intl, đổi style |
| `\| json` (debug) | `JSON.stringify(data, null, 2)` trong `<pre>` | Không cần pipe, JS thuần |
| `\| slice`/`\| uppercase` | `.slice()`, `.toUpperCase()` trực tiếp trong `{}` | Chuỗi JS thuần, không pipe |

> **Cách đọc bảng này:** mỗi dòng là một pipe Angular và cách thay thế trong React — cột Angular để nhận diện khái niệm, cột React là cách viết dùng ngay, cột Ghi chú nêu sự khác biệt cốt lõi của cặp đó.

`memo` vs `OnPush` — cùng mục đích, khác cơ chế:

| Điểm | Angular `OnPush` | React `memo` |
|---|---|---|
| Kích hoạt check | Chỉ khi: `@Input` đổi tham chiếu, event trong component, `async` pipe emit, `markForCheck()` tay | Cha render → so props cũ/mới nông, giống thì bỏ qua |
| So sánh | So tham chiếu `@Input` (không so sâu) | So nông từng prop (`Object.is` mỗi field) |
| Phạm vi | Chiến lược cả component + subtree (con OnPush cũng ít bị check ké) | Chỉ 1 component bọc; con của nó vẫn render theo nếu nó render |
| Ép cập nhật | `ChangeDetectorRef.markForCheck()` / `detectChanges()` | `setState` bên trong, context đổi — tự render, không cần gọi gì |
| Mặc định | Opt-in từng component (`changeDetection: OnPush`) | Opt-in từng component (`memo(...)`) — React Compiler 2026 còn tự làm thay |

**Bẫy chung cả hai:** mutate object thay vì tạo mới → tham chiếu không đổi → cả hai tưởng "không đổi" → UI đơ. Cả 2 hệ đều bắt **immutable update** (`[...arr, x]`, `{...obj, k: v}`).

> **Cách đọc bảng này:** bảng so `memo` vs `OnPush` đọc theo từng "điểm" (dòng): cùng một vấn đề, hai framework giải theo hai cách — cột giữa là hành vi React bạn đang học.

> **Tóm gọn 1 câu:** Hai bảng chốt bài học: pipe Angular nào cũng có "twin" là hàm JS, còn OnPush và `memo` là cùng mục đích khác cơ chế — và cả hai đều cần immutable update.

## Lỗi thường gặp (Common pitfalls)

Mục này liệt kê 7 lỗi hay gặp với memo/format, mỗi lỗi có file ví dụ chạy được. Đọc để tránh tự đốt thời gian debug những bug ẩn.

### 1. `useMemo` với deps tạo mới mỗi render → cache miss luôn
> 📄 **Code ví dụ:** [`examples/11-1-usememo-voi-deps-tao-moi-moi-render.tsx`](examples/11-1-usememo-voi-deps-tao-moi-moi-render.tsx)
> 📄 **Code ví dụ:** [`examples/12-1-usememo-voi-deps-tao-moi-moi-render.tsx`](examples/12-1-usememo-voi-deps-tao-moi-moi-render.tsx)

### 2. Lạm dụng `memo` cho mọi component
> 📄 **Code ví dụ:** [`examples/13-2-lam-dung-memo-cho-moi-component.tsx`](examples/13-2-lam-dung-memo-cho-moi-component.tsx)
> 📄 **Code ví dụ:** [`examples/14-2-lam-dung-memo-cho-moi-component.tsx`](examples/14-2-lam-dung-memo-cho-moi-component.tsx)

### 3. Tạo `Intl` mới trong render
> 📄 **Code ví dụ:** [`examples/15-3-tao-intl-moi-trong-render.tsx`](examples/15-3-tao-intl-moi-trong-render.tsx)
> 📄 **Code ví dụ:** [`examples/16-3-tao-intl-moi-trong-render.tsx`](examples/16-3-tao-intl-moi-trong-render.tsx)

### 4. Mutate rồi `useMemo` → stale
> 📄 **Code ví dụ:** [`examples/17-4-mutate-roi-usememo-stale.tsx`](examples/17-4-mutate-roi-usememo-stale.tsx)
> 📄 **Code ví dụ:** [`examples/18-4-mutate-roi-usememo-stale.tsx`](examples/18-4-mutate-roi-usememo-stale.tsx)

### 5. Nhầm `useMemo` là "chạy 1 lần"
Mô tả: `useMemo(fn, [a, b])` chạy lại khi `a`/`b` đổi (đúng ý "khi nào cần tính lại"). Muốn 1 lần thì `[]`, nhưng 1 lần mà dùng biến đổi theo thời gian là stale. Hiểu deps thay vì mong "chạy 1 lần".

### 6. `memo` với `children` mới mỗi render → miss
> 📄 **Code ví dụ:** [`examples/19-6-memo-voi-children-moi-moi-render-miss.tsx`](examples/19-6-memo-voi-children-moi-moi-render-miss.tsx)
> 📄 **Code ví dụ:** [`examples/20-6-memo-voi-children-moi-moi-render-miss.tsx`](examples/20-6-memo-voi-children-moi-moi-render-miss.tsx)

### 7. Nối chuỗi tiền tệ tay
> 📄 **Code ví dụ:** [`examples/21-7-noi-chuoi-tien-te-tay.tsx`](examples/21-7-noi-chuoi-tien-te-tay.tsx)
> 📄 **Code ví dụ:** [`examples/22-7-noi-chuoi-tien-te-tay.tsx`](examples/22-7-noi-chuoi-tien-te-tay.tsx)

> **Tóm gọn 1 câu:** Bảy lỗi đều quay về hai gốc: deps/tham chiếu "giả ổn định" (cache miss, stale) và tự chế format thay vì dùng `Intl`.

## Best practices / Mẹo

Mục này chốt 5 mẹo vận hành memo/format. Đọc để hình thành thói quen đúng ngay từ dự án mới.
- **Với Compiler 1.0:** viết tự nhiên trước; chỉ `useMemo` khi (a) Profiler chỉ issue, (b) cần tham chiếu ổn định cho `useEffect` deps, (c) vùng Compiler chưa phủ. Vì sao? Vì memo tay sai đắt hơn không memo.
- Gom format vào `utils/format.ts` (`vnd(n)`, `date(d)`) — tái dùng, test như hàm thuần (DAY 21). Vì sao? Vì format là logic thuần, không thuộc component nào.
- List lớn: `memo` + `key` đúng (DAY 2) + virtualization khi nghìn item. Vì sao thứ tự? Vì key sai thì memo/virtualize cũng sai.
- Tạo instance `Intl` ở module scope hoặc `Map` cache theo locale — không tạo trong render. Vì sao? Vì tạo Intl tốn, cache nội bộ mất khi tạo mới.
- `toLocaleString`/`toLocaleDateString` cho nhanh, `Intl.*Format` khi cần options chi tiết. Vì sao 2 mức? Vì 80% chỉ cần `n.toLocaleString("vi-VN")`, 20% tiền/ngày chuẩn mới cần instance cấu hình.

> **Tóm gọn 1 câu:** Mẹo phân bậc: Compiler lo trước, format gom vào `utils`, list lớn nhớ key + virtualize, và chọn `toLocaleString` cho nhanh hay instance `Intl` cho chuẩn.

## Bài tập nhỏ
1. Thêm state `theme` vào `App`, bấm đổi — giữ `console.log` trong `Row`; bật/tắt `memo` và Compiler, ghi số lần Row render mỗi trường hợp. Vì sao Compiler gỡ memo vẫn ít render?
2. Viết `formatBytes(bytes)` bằng `Intl.NumberFormat` unit byte/kilobyte, hiện danh sách file; so sánh round-off với nối chuỗi tay.
3. Viết `formatRelative(date)` bằng `Intl.RelativeTimeFormat` ("x phút trước") từ delta `Date.now() - mốc`. Xử lý số ít/nhiều thế nào mà không `if` tay?
4. Tạo `useMemo` trung bình danh sách lớn, đo thời gian trước/sau memo bằng `performance.now()`. Khi nào chênh lệch đáng kể?
5. Đổi locale sang `en-US` (dùng `i18n.language` DAY 18) và quan sát tiền/ngày đổi dấu/vị trí. Vì sao hardcode `"vi-VN"` vỡ ở đây?

## Reference
- https://react.dev/reference/react/useMemo
- https://react.dev/reference/react/memo
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- https://react.dev/learn/react-compiler
